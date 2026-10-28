from fastapi import APIRouter, File, HTTPException, UploadFile
from app.models.contracts import DetectionResult
from app.store import store

router = APIRouter(tags=["Upload"])


@router.post("/upload", response_model=DetectionResult)
async def upload_csv_dataset(file: UploadFile = File(...)):
    """
    Accepts CSV transaction file, validates schema, updates store,
    and runs fraud detection rules.
    """
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are supported")

    content_bytes = await file.read()
    try:
        content_str = content_bytes.decode("utf-8")
    except UnicodeDecodeError:
        try:
            content_str = content_bytes.decode("latin-1")
        except Exception:
            raise HTTPException(status_code=400, detail="File encoding not recognized. Please provide UTF-8 CSV.")

    try:
        detection_result = store.load_from_csv(content_str)
        return detection_result
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process CSV: {str(e)}")
