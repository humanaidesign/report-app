from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import httpx
from openai import OpenAI
from dotenv import load_dotenv
import base64
import json
import time

load_dotenv()

app = FastAPI()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_API_KEY)
HPC_MODEL_URL = os.getenv("HPC_MODEL_URL", "http://localhost:8001")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

USE_MOCK_DATA = False
USE_HPC_MODEL = True


class BoundingBox(BaseModel):
    x: float
    y: float
    width: float
    height: float

class Finding(BaseModel):
    id: str
    text: str
    isCritical: bool
    boundingBox: Optional[BoundingBox] = None
    status: Optional[str] = "same"


@app.get("/")
def read_root():
    return {
        "message": "X-Ray Analysis API is running",
        "endpoints": {
            "test_openai": "/api/test-openai",
            "analyze_xray": "/api/analyze-xray",
            "generate_report": "/api/generate-report",
            "hpc_health": "/api/hpc-health",
        }
    }


@app.get("/api/hpc-health")
async def hpc_health():
    try:
        async with httpx.AsyncClient(timeout=5.0) as hpc:
            response = await hpc.get(f"{HPC_MODEL_URL}/health")
            return {"status": "reachable", "hpc_response": response.json()}
    except Exception as e:
        return {"status": "unreachable", "error": str(e)}


@app.get("/api/test-openai")
def test_openai():
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": "Say 'API is working'"}],
            max_tokens=50
        )
        return {"status": "success", "message": response.choices[0].message.content}
    except Exception as e:
        return {"status": "error", "error": str(e)}


@app.post("/api/analyze-xray")
async def analyze_xray(file: UploadFile = File(...)):
    if USE_MOCK_DATA:
        time.sleep(1)
        mock_findings = [
            {
                "id": "1",
                "text": "Large left pleural effusion",
                "isCritical": True,
                "status": "worsened",
                "boundingBox": {"x": 100, "y": 500, "width": 300, "height": 400}
            },
            {
                "id": "2",
                "text": "Small right pleural effusion",
                "isCritical": False,
                "status": "changed",
                "boundingBox": {"x": 600, "y": 550, "width": 250, "height": 350}
            },
            {
                "id": "3",
                "text": "Cardiomegaly (enlarged heart)",
                "isCritical": False,
                "status": "same",
                "boundingBox": {"x": 350, "y": 400, "width": 300, "height": 350}
            },
        ]
        return mock_findings

    image_bytes = await file.read()

    if USE_HPC_MODEL:
        try:
            async with httpx.AsyncClient(timeout=120.0) as hpc:
                response = await hpc.post(
                    f"{HPC_MODEL_URL}/analyze",
                    files={"file": (file.filename, image_bytes, file.content_type)},
                )
                data = response.json()
                return data["findings"]
        except httpx.ConnectError:
            return {"error": "Cannot reach HPC model server. Check your SSH tunnel is running."}
        except Exception as e:
            return {"error": f"HPC model error: {str(e)}"}

    base64_image = base64.b64encode(image_bytes).decode("utf-8")
    analysis_prompt = """
    You are an expert radiologist analyzing a chest X-ray image.

    Identify all visible abnormalities and return a JSON array. Each finding must include:
    - id (string number)
    - text (description)
    - isCritical (boolean)
    - status: one of "worsened", "changed", or "same"
    - boundingBox with x, y, width, height (coordinate system: 1000x1000)

    Return ONLY the JSON array, no markdown or extra text.
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": analysis_prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}", "detail": "high"}}
                    ]
                }
            ],
            max_tokens=1000,
            temperature=0.3,
        )
        ai_response = response.choices[0].message.content.strip()
        ai_response = ai_response.removeprefix("```json").removeprefix("```").removesuffix("```")
        return json.loads(ai_response.strip())
    except Exception as e:
        return {"error": str(e)}


@app.post("/api/generate-report")
async def generate_report(findings: List[Finding]):
    if USE_MOCK_DATA:
        time.sleep(1)
        finding_texts = [f.text for f in findings]
        critical_findings = [f for f in findings if f.isCritical]
        if critical_findings:
            impression = ". ".join([f.text for f in critical_findings]) + "."
        else:
            impression = ("No acute findings. " + findings[0].text) if findings else "No significant abnormalities detected."
        report = f"""Findings:
{". ".join(finding_texts)}. The cardiac silhouette size is within normal limits. The mediastinal contour is unremarkable. No pneumothorax is identified. Osseous structures show age-appropriate changes.

Impression:
{impression}"""
        return {"report": report}

    findings_context = ", ".join([f.text for f in findings])
    system_prompt = """You are an expert radiologist. Generate a formal, concise narrative medical report.

The report must include:
1. A 'Findings' section with detailed observations
2. An 'Impression' section with key diagnoses

Use professional medical terminology and maintain a clinical tone.
Format the output exactly as:

Findings:
[detailed findings here]

Impression:
[key diagnoses here]
"""
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Generate a radiology report for these findings: {findings_context}"}
            ],
            temperature=0.7,
            max_tokens=500,
        )
        return {"report": response.choices[0].message.content}
    except Exception as e:
        return {"error": str(e)}