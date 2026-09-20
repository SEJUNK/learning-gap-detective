from fastapi import APIRouter, HTTPException

from app.data.python_subject import PYTHON_SUBJECT
from app.models.subject import Subject

router = APIRouter()

_SUBJECTS: dict[str, Subject] = {PYTHON_SUBJECT.id: PYTHON_SUBJECT}


@router.get("/subjects", response_model=list[Subject])
def list_subjects() -> list[Subject]:
    return list(_SUBJECTS.values())


@router.get("/subjects/{subject_id}", response_model=Subject)
def get_subject(subject_id: str) -> Subject:
    subject = _SUBJECTS.get(subject_id)
    if subject is None:
        raise HTTPException(status_code=404, detail="Subject not found")
    return subject
