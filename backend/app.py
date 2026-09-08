import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from pydantic import BaseModel, Field
from huggingface_hub import InferenceClient

app = FastAPI(title="Viora Video API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

HF_TOKEN = os.getenv("HF_TOKEN", "").strip()
MODEL = os.getenv("VIDEO_MODEL", "Wan-AI/Wan2.2-TI2V-5B").strip()
PROVIDER = os.getenv("HF_PROVIDER", "fal-ai").strip()


class GenerateRequest(BaseModel):
    prompt: str = Field(min_length=3, max_length=1200)


@app.get("/")
def root():
    return {
        "service": "Viora Video API",
        "status": "ready",
        "model": MODEL,
        "provider": PROVIDER,
    }


@app.get("/health")
def health():
    return {
        "ok": True,
        "configured": bool(HF_TOKEN)
    }


@app.post("/generate")
def generate(req: GenerateRequest):
    if not HF_TOKEN:
        raise HTTPException(
            status_code=500,
            detail="HF_TOKEN is not configured."
        )

    try:
        client = InferenceClient(
            provider=PROVIDER,
            api_key=HF_TOKEN
        )

        video = client.text_to_video(
            req.prompt,
            model=MODEL
        )

        if not video:
            raise RuntimeError("Provider returned no video.")

        return Response(
            content=video,
            media_type="video/mp4",
            headers={
                "Content-Disposition":
                'inline; filename="viora-generated.mp4"'
            }
        )

    except Exception as exc:
        return JSONResponse(
            status_code=500,
            content={
                "detail": f"Video generation error: {exc}"
            }
        )
