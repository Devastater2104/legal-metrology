import io
import os
import re
import subprocess
import tempfile
import uuid
from pathlib import Path

from PIL import Image, UnidentifiedImageError


MAX_IMAGE_BYTES = 10 * 1024 * 1024
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
UPLOAD_ROOT = Path(os.getenv("INSPECTION_UPLOAD_DIR", "uploads/inspections"))


def _extract(label_patterns: list[str], text: str) -> str | None:
    pattern = rf"(?:{'|'.join(label_patterns)})\s*[:#-]?\s*([^\n\r]+)"
    match = re.search(pattern, text, re.IGNORECASE)
    return match.group(1).strip() if match else None


def extract_fields(raw_text: str) -> dict:
    return {
        "manufacturer": _extract(["manufacturer", "mfr", "make"], raw_text),
        "model": _extract(["model number", "model no", "model"], raw_text),
        "serial_number": _extract(["serial number", "serial no", "serial", "s/n"], raw_text),
        "capacity": _extract(["capacity"], raw_text),
    }


def process_image(content: bytes, content_type: str) -> tuple[str, dict, str]:
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise ValueError("Unsupported image type. Use JPEG, PNG, or WebP.")
    if len(content) > MAX_IMAGE_BYTES:
        raise ValueError("Image exceeds the 10 MB size limit.")
    try:
        image = Image.open(io.BytesIO(content))
        image.verify()
    except (UnidentifiedImageError, OSError) as exc:
        raise ValueError("The uploaded file is not a valid image.") from exc

    photo_id = str(uuid.uuid4())
    UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)
    suffix = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}[content_type]
    storage_name = f"{photo_id}{suffix}"
    path = UPLOAD_ROOT / storage_name
    path.write_bytes(content)

    try:
        try:
            result = subprocess.run(
                ["tesseract", str(path), "stdout", "--psm", "6"],
                capture_output=True,
                text=True,
                timeout=20,
                check=False,
            )
        except (FileNotFoundError, subprocess.TimeoutExpired) as exc:
            raise RuntimeError("OCR is unavailable. Please enter the details manually.") from exc

        if result.returncode != 0:
            raise RuntimeError("Unable to analyze the image. Please enter the details manually.")
        raw_text = result.stdout.strip()
        if not raw_text:
            raise RuntimeError("No text detected. Please enter the details manually.")
    except RuntimeError:
        path.unlink(missing_ok=True)
        raise
    return photo_id, extract_fields(raw_text) | {"raw_text": raw_text, "confidence": None}, storage_name