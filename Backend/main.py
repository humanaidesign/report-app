from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from openai import OpenAI
from dotenv import load_dotenv
import base64
import json

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

USE_MOCK_DATA = False

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

@app.get("/")
def read_root():
    return {
        "message": "X-Ray Analysis API is running",
        "endpoints": {
            "test_openai": "/api/test-openai",
            "findings": "/api/findings",
            "analyze_xray": "/api/analyze-xray",
            "generate_report": "/api/generate-report"
        }
    }

@app.get("/api/test-openai")
def test_openai():
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "user", "content": "Say 'API is working"}
            ],
            max_tokens=50
        )
        result = response.choices[0].message.content
        
        return {
            "status": "success",
            "message": result,
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
        }

@app.post("/api/analyze-xray")
async def analyze_xray(file: UploadFile = File(...)):
    
    print("ANALYZING X-RAY IMAGE")
    
    image_bytes = await file.read()
    base64_image = base64.b64encode(image_bytes).decode('utf-8')
    
    print(f"Image size: {len(image_bytes)} bytes")
    
    analysis_prompt = """
    You are an expert radiologist analyzing a chest X-ray image.
    
    Your task:
    1. Identify all visible abnormalities, findings, or conditions
    2. For each finding, estimate its location on the image as a bounding box
    3. Determine if each finding is critical/urgent
    
    Return your analysis as a JSON array with this exact structure:
    [
      {
        "id": "1",
        "text": "Description of finding",
        "isCritical": true,
        "boundingBox": {
          "x": 100,
          "y": 150,
          "width": 200,
          "height": 180
        }
      }
    ]
    
    IMPORTANT RULES:
    - Use a coordinate system where the image is 1000 pixels wide and 1000 pixels tall
    - x and y are the TOP-LEFT corner of the bounding box
    - width and height are the dimensions of the box
    - Return ONLY the JSON array, no markdown, no extra text
    - If you see multiple findings, include all of them
    """
    
    models_to_try = ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"]
    
    for model_name in models_to_try:
        try:
            print(f"Trying model: {model_name}")
            
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": analysis_prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=1000,
                temperature=0.3
            )
            
            print(f"Model {model_name} succeeded")
            
            ai_response = response.choices[0].message.content
            
            print(ai_response)
            
            cleaned_response = ai_response.strip()
            if cleaned_response.startswith("```json"):
                cleaned_response = cleaned_response[7:]
            if cleaned_response.startswith("```"):
                cleaned_response = cleaned_response[3:]
            if cleaned_response.endswith("```"):
                cleaned_response = cleaned_response[:-3]
            cleaned_response = cleaned_response.strip()
            
            print(cleaned_response)
            
            findings_data = json.loads(cleaned_response)
            
            print(f"\nParsed {len(findings_data)} findings:")
            for i, finding in enumerate(findings_data, 1):
                print(f"\nFinding {i}:")
                print(f"  ID: {finding.get('id')}")
                print(f"  Text: {finding.get('text')}")
                print(f"  Critical: {finding.get('isCritical')}")
                if finding.get('boundingBox'):
                    bb = finding['boundingBox']
                    print(f"  BoundingBox: x={bb['x']}, y={bb['y']}, width={bb['width']}, height={bb['height']}")
                else:
                    print(f"  BoundingBox: None")
            
            print("RETURNING FINDINGS TO FRONTEND")            
            return findings_data
            
        except Exception as e:
            print(f"Model {model_name} failed: {str(e)}")
            if model_name == models_to_try[-1]:
                print("\nAll models failed!")
                return {
                    "error": f"All models failed. Last error: {str(e)}",
                    "tried_models": models_to_try
                }
            continue

@app.post("/api/generate-report")
async def generate_report(findings: List[Finding]):
    print("GENERATING REPORT")
    print(f"Received {len(findings)} findings")
    
    findings_context = ", ".join([f.text for f in findings])
    
    print(f"Findings context: {findings_context}")
    
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
        
        report = response.choices[0].message.content
        
        print("\nGENERATED REPORT:")
        print(report)
        print("\n" + "="*60)
        
        return {"report": report}
        
    except Exception as e:
        print(f"Error generating report: {str(e)}")
        return {"error": str(e)}