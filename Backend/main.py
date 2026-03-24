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


def parse_model_findings(raw_findings: list) -> list:
    parsed = []
    for i, item in enumerate(raw_findings):
        if isinstance(item, (list, tuple)) and len(item) == 2:
            text, bbox_raw = item
        elif isinstance(item, dict):
            text = item.get("text", "")
            bbox_raw = item.get("boundingBox", None)
        else:
            continue

        bounding_box = None
        if bbox_raw is not None:
            if isinstance(bbox_raw, (list, tuple)) and len(bbox_raw) == 4:
                x_min, y_min, x_max, y_max = bbox_raw
                bounding_box = {
                    "x": x_min * 1000,
                    "y": y_min * 1000,
                    "width": (x_max - x_min) * 1000,
                    "height": (y_max - y_min) * 1000,
                }
            elif isinstance(bbox_raw, dict):
                bounding_box = bbox_raw

        critical_keywords = [
            "effusion", "pneumothorax", "opacity", "consolidation",
            "mass", "nodule", "fracture", "tamponade", "edema"
        ]
        is_critical = any(kw in text.lower() for kw in critical_keywords)
        status = "worsened" if is_critical else "same"

        parsed.append({
            "id": str(i + 1),
            "text": text,
            "isCritical": is_critical,
            "status": status,
            "boundingBox": bounding_box,
        })

    return parsed


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

        raw_model_output = [
            ("There is a large right pleural effusion.", [0.055, 0.275, 0.445, 0.665]),
            ("The left lung is clear.", None),
            ("No pneumothorax is identified.", None),
            ("The cardiomediastinal silhouette is within normal limits.", None),
            ("The visualized osseous structures are unremarkable.", None),
        ]

        findings = parse_model_findings(raw_model_output)

        for f in findings:
            has_box = "with box" if f["boundingBox"] else "no box"
            print(f"  [{'CRITICAL' if f['isCritical'] else 'normal'}] {f['text']} ({has_box})")

        return findings

    image_bytes = await file.read()
    base64_image = base64.b64encode(image_bytes).decode('utf-8')

    analysis_prompt = """
    You are an expert radiologist analyzing a chest X-ray image.

    Return a JSON array of findings. Each finding must have:
    - "text": a string describing the observation
    - "boundingBox": an object with x, y, width, height in a 1000x1000 coordinate system,
      or null if the finding has no specific localizable region

    Example:
    [
      {"text": "Large left pleural effusion", "boundingBox": {"x": 100, "y": 500, "width": 300, "height": 400}},
      {"text": "No pneumothorax identified", "boundingBox": null}
    ]

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

            ai_response = response.choices[0].message.content
            if ai_response is None:
                raise ValueError("Empty response from API")
            
            ai_response = ai_response.strip()
            if ai_response.startswith("```json"):
                ai_response = ai_response[7:]
            if ai_response.startswith("```"):
                ai_response = ai_response[3:]
            if ai_response.endswith("```"):
                ai_response = ai_response[:-3]

            raw = json.loads(ai_response.strip())
            return parse_model_findings(raw)

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