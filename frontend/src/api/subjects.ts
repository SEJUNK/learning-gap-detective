import { apiGet } from "./client";
import type { Concept, Subject } from "../types/subject";

interface ConceptDto {
  id: string;
  name: string;
  description: string;
  prerequisite_ids: string[];
}

interface SubjectDto {
  id: string;
  name: string;
  concepts: ConceptDto[];
}

function toConcept(dto: ConceptDto): Concept {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    prerequisiteIds: dto.prerequisite_ids,
  };
}

function toSubject(dto: SubjectDto): Subject {
  return { id: dto.id, name: dto.name, concepts: dto.concepts.map(toConcept) };
}

export async function listSubjects(): Promise<Subject[]> {
  const dtos = await apiGet<SubjectDto[]>("/subjects");
  return dtos.map(toSubject);
}
