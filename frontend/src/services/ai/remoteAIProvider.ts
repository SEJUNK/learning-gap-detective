import type { AIProvider } from "./aiProvider";
import type { AIInputEvidence, StructuredDiagnosis } from "../../types/aiDiagnosis";
import type { ReassessmentReflection, ReassessmentReflectionInput } from "../../types/aiReassessment";
import { isValidStructuredDiagnosis } from "./diagnosisValidator";
import { isValidReassessmentReflection } from "./reassessmentReflectionValidator";

/**
 * A real LLM-backed provider, configured entirely through environment
 * variables — no hardcoded key, no hardcoded provider. Targets any
 * OpenAI-compatible chat-completions endpoint (OpenAI itself, or a
 * compatible gateway) so swapping providers is a `.env` change, not a
 * code change.
 *
 * Note for production hardening: calling an LLM directly from the
 * browser means the API key ships to every client. That's an accepted
 * tradeoff for this hackathon-speed MVP (the key is opt-in via env and
 * never committed), but the documented next step is routing this same
 * request shape through a backend proxy instead of removing the
 * abstraction — nothing here is coupled to running in the browser.
 */

/** A hung request must not hang the diagnosis/reflection pipeline forever — this is what turns "network unavailable" into a fast, guaranteed fallback instead of an indefinite spinner. */
const REQUEST_TIMEOUT_MS = 10_000;

export class RemoteAIProvider implements AIProvider {
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly model: string;

  constructor(apiKey: string, apiUrl: string, model: string) {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
    this.model = model;
  }

  private async chatJSON(systemPrompt: string, userPayload: unknown): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: JSON.stringify(userPayload) },
          ],
          response_format: { type: "json_object" },
          temperature: 0.4,
        }),
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Error(`AI provider request timed out after ${REQUEST_TIMEOUT_MS}ms`);
      }
      // Covers "network unavailable" (fetch rejects with a TypeError) —
      // rethrown as-is so the caller's catch-and-fallback still triggers.
      throw error;
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      throw new Error(`AI provider request failed with status ${response.status}`);
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new Error("AI provider response was not valid JSON");
    }

    const content = (payload as { choices?: { message?: { content?: unknown } }[] })?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      throw new Error("AI provider response missing message content");
    }

    try {
      return JSON.parse(content);
    } catch {
      throw new Error("AI provider message content was not valid JSON");
    }
  }

  async generateDiagnosis(input: AIInputEvidence): Promise<StructuredDiagnosis> {
    const parsed = await this.chatJSON(DIAGNOSIS_SYSTEM_PROMPT, input);
    if (!isValidStructuredDiagnosis({ ...(parsed as object), source: "ai" })) {
      throw new Error("AI provider response did not match the expected diagnosis shape");
    }
    return { ...(parsed as StructuredDiagnosis), source: "ai" };
  }

  async generateReassessmentReflection(input: ReassessmentReflectionInput): Promise<ReassessmentReflection> {
    const parsed = await this.chatJSON(REFLECTION_SYSTEM_PROMPT, input);
    if (!isValidReassessmentReflection({ ...(parsed as object), source: "ai" })) {
      throw new Error("AI provider response did not match the expected reflection shape");
    }
    return { ...(parsed as ReassessmentReflection), source: "ai" };
  }
}

const DIAGNOSIS_SYSTEM_PROMPT = `You are the explanation layer of an academic diagnostic system. You will receive structured evidence (concept mastery, already-identified root gaps, concept gaps, application gaps, and strengths) computed by a deterministic engine. You do NOT calculate scores, mastery, or decide which concepts are gaps — that has already been done. Your job is only to explain WHY, in plain, encouraging, hedge-worded language ("evidence suggests", "this pattern may indicate"), and to recommend next steps.

Respond with ONLY a JSON object matching this exact shape, no prose outside the JSON:
{
  "headline": string,
  "summary": string,
  "rootCause": { "concept": string, "mastery": number, "explanation": string, "evidence": string[] } | null,
  "applicationGaps": [{ "concept": string, "explanation": string }],
  "strengths": [{ "concept": string, "explanation": string }],
  "recommendations": string[],
  "learningSequence": string[],
  "confidenceInsight": string | null
}`;

const REFLECTION_SYSTEM_PROMPT = `You are the reflection layer of a targeted reassessment system. You will receive structured before/after comparison data for a student who just completed a short recovery lesson and a follow-up reassessment — per-concept before/after scores, an overall improvement tier, and optionally an application-transfer result. You do NOT decide whether the student improved, calculate any score, or invent any number not present in the input — that has already been computed deterministically. Your only job is to describe, in plain, encouraging language, what the data shows changed.

Never state a number, concept, or outcome that isn't present in the input. If the input shows no improvement or a regression, describe that honestly rather than framing it as a success.

Respond with ONLY a JSON object matching this exact shape, no prose outside the JSON:
{
  "headline": string,
  "narrative": string
}`;
