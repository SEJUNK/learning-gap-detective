from pydantic import BaseModel


class Concept(BaseModel):
    """A single teachable concept within a subject (e.g. 'Loops' in Python)."""

    id: str
    name: str
    description: str
    prerequisite_ids: list[str] = []


class Subject(BaseModel):
    """A subject made up of an ordered set of concepts.

    The architecture is subject-agnostic: additional subjects can be added
    by contributing another entry to app/data without touching application
    logic, routing, or the frontend.
    """

    id: str
    name: str
    concepts: list[Concept]
