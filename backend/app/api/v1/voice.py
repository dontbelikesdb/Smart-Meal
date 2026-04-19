from functools import lru_cache
import os
import tempfile
from typing import Any

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.api import dependencies as deps
from app.core.config import settings
from app.models.user import User


router = APIRouter()


_ALLOWED_AUDIO_TYPES = {
    "audio/webm",
    "audio/webm;codecs=opus",
    "audio/mp4",
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/x-wav",
    "audio/ogg",
    "audio/ogg;codecs=opus",
    "audio/m4a",
    "video/webm",
    "video/mp4",
}


@lru_cache(maxsize=1)
def _get_local_transcriber():
    model_name = (settings.LOCAL_TRANSCRIPTION_MODEL or "").strip()
    if not model_name:
        return None

    try:
        from faster_whisper import WhisperModel
    except Exception:
        return None

    return WhisperModel(
        model_name,
        device="cpu",
        compute_type=settings.LOCAL_TRANSCRIPTION_COMPUTE_TYPE,
    )


def _transcribe_with_local_model(file_name: str, body: bytes) -> str:
    model = _get_local_transcriber()
    if model is None:
        return ""

    suffix = os.path.splitext(file_name or "")[1] or ".webm"
    temp_path = ""
    language = (settings.LOCAL_TRANSCRIPTION_LANGUAGE or "").strip() or None
    beam_size = max(1, int(settings.LOCAL_TRANSCRIPTION_BEAM_SIZE or 1))
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp:
            temp.write(body)
            temp_path = temp.name

        segments, _info = model.transcribe(
            temp_path,
            language=language,
            vad_filter=bool(settings.LOCAL_TRANSCRIPTION_VAD_FILTER),
            beam_size=beam_size,
            best_of=beam_size,
            condition_on_previous_text=False,
            initial_prompt=(
                "Meal planner voice search. The user may say recipe names, "
                "Indian dishes, ingredients, diets, allergies, or nutrition goals, "
                "such as paneer butter masala, chicken biryani, high protein, "
                "low carb, gluten free, tomato allergy, or tuna."
            ),
        )
        text = " ".join((segment.text or "").strip() for segment in segments).strip()
        return text
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except OSError:
                pass


def _transcribe_with_openai(file_name: str, body: bytes, content_type: str) -> str:
    api_key = (settings.OPENAI_API_KEY or "").strip()
    if not api_key:
        return ""

    try:
        from openai import OpenAI
    except Exception:
        return ""

    client = OpenAI(api_key=api_key)
    transcript = client.audio.transcriptions.create(
        model=settings.OPENAI_TRANSCRIPTION_MODEL,
        file=(file_name, body, content_type or "application/octet-stream"),
        prompt=(
            "This audio contains a user speaking a dish name, meal request, "
            "or recipe-search phrase for a meal planner app."
        ),
    )
    return (getattr(transcript, "text", "") or "").strip()


@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    _ = current_user

    if not file.filename:
        raise HTTPException(status_code=400, detail="Audio file is required.")

    content_type = (file.content_type or "").lower().strip()
    if content_type and content_type not in _ALLOWED_AUDIO_TYPES:
        raise HTTPException(
            status_code=415,
            detail="Unsupported audio format. Try recording again.",
        )

    body = await file.read()
    if not body:
        raise HTTPException(status_code=400, detail="Uploaded audio file is empty.")

    try:
        text = _transcribe_with_local_model(file.filename, body)
        if not text:
            text = _transcribe_with_openai(file.filename, body, content_type)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Voice transcription failed: {exc}",
        ) from exc

    if not text:
        if (settings.LOCAL_TRANSCRIPTION_MODEL or "").strip():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Local voice transcription is unavailable. Install faster-whisper or configure a valid local model.",
            )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Voice transcription is not configured on the server.",
        )

    return {"text": text}
