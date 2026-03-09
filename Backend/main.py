from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from openai import OpenAI
from dotenv import load_dotenv
import base64
import json
import time


load_dotenv()

app = FastAPI()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_API_KEY)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

USE_MOCK_DATA = True

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
            "generate_report": "/api/generate-report"
        }
    }

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
            {
                "id": "4",
                "text": "Degenerative changes in thoracic spine",
                "isCritical": False,
                "status": "same",
                "boundingBox": {"x": 450, "y": 100, "width": 100, "height": 600}
            },
            {
                "id": "5",
                "text": "Calcification in aortic arch",
                "isCritical": False,
                "status": "same",
                "boundingBox": {"x": 350, "y": 200, "width": 150, "height": 120}
            },
            {
                "id": "6",
                "text": "Right lower lobe opacity",
                "isCritical": True,
                "status": "worsened",
                "boundingBox": {"x": 550, "y": 650, "width": 250, "height": 250}
            }
        ]

        for f in mock_findings:
            print(f"  [{f['status'].upper()}] {f['text']}")

        return mock_findings

    image_bytes = await file.read()
    base64_image = base64.b64encode(image_bytes).decode('utf-8')

    analysis_prompt = """
    You are an expert radiologist analyzing a chest X-ray image.

    Identify all visible abnormalities and return a JSON array. Each finding must include:
    - id (string number)
    - text (description)
    - isCritical (boolean)
    - status: one of "worsened", "changed", or "same" based on typical clinical presentation
    - boundingBox with x, y, width, height (coordinate system: 1000x1000)

    Return ONLY the JSON array, no markdown or extra text.
    """

    models_to_try = ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"]

    for model_name in models_to_try:
        try:
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": analysis_prompt},
                            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                        ]
                    }
                ],
                max_tokens=1000,
                temperature=0.3
            )

            ai_response = response.choices[0].message.content.strip()
            if ai_response.startswith("```json"):
                ai_response = ai_response[7:]
            if ai_response.startswith("```"):
                ai_response = ai_response[3:]
            if ai_response.endswith("```"):
                ai_response = ai_response[:-3]

            return json.loads(ai_response.strip())

        except Exception as e:
            print(f"Model {model_name} failed: {str(e)}")
            if model_name == models_to_try[-1]:
                return {"error": f"All models failed. Last error: {str(e)}"}
            continue

@app.post("/api/generate-report")
async def generate_report(findings: List[Finding]):
    print(f"Generating report for {len(findings)} findings")

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
            max_tokens=500
        )
        return {"report": response.choices[0].message.content}

    except Exception as e:
        print(f"Error generating report: {str(e)}")
        return {"error": str(e)}