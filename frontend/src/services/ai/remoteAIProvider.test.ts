import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RemoteAIProvider } from "./remoteAIProvider";
import type { AIInputEvidence } from "../../types/aiDiagnosis";

/**
 * These tests exercise the actual HTTP boundary (a mocked `fetch`) rather
 * than mocking RemoteAIProvider itself — the point is to prove every
 * failure mode the hardening pass added (timeout, network failure, bad
 * status, malformed JSON, missing content) throws cleanly so the caller's
 * try/catch-and-fallback (diagnosisService/reassessmentAIService) always
 * has something to catch, never an unhandled hang or crash.
 */

const INPUT: AIInputEvidence = {
  subject: "Python",
  overallScore: { totalScore: 50, totalQuestions: 100, percentage: 50 },
  conceptMasteryAverage: 50,
  conceptMastery: {},
  rootGaps: [],
  conceptGaps: [],
  applicationGaps: [],
  strengths: [],
  confidenceNote: null,
  prerequisiteGraph: {},
};

function chatCompletionResponse(content: string): Response {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 });
}

describe("RemoteAIProvider", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("returns the parsed diagnosis on a successful, well-formed response", async () => {
    vi.mocked(fetch).mockResolvedValue(
      chatCompletionResponse(
        JSON.stringify({
          headline: "Test",
          summary: "Test summary",
          rootCause: null,
          applicationGaps: [],
          strengths: [],
          recommendations: [],
          learningSequence: [],
          confidenceInsight: null,
        }),
      ),
    );

    const provider = new RemoteAIProvider("key", "https://example.com/chat", "gpt-test");
    const result = await provider.generateDiagnosis(INPUT);

    expect(result.headline).toBe("Test");
    expect(result.source).toBe("ai");
  });

  it("throws when the response status is not ok", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("", { status: 500 }));

    const provider = new RemoteAIProvider("key", "https://example.com/chat", "gpt-test");
    await expect(provider.generateDiagnosis(INPUT)).rejects.toThrow(/status 500/);
  });

  it("throws when the response body isn't valid JSON", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("not json", { status: 200 }));

    const provider = new RemoteAIProvider("key", "https://example.com/chat", "gpt-test");
    await expect(provider.generateDiagnosis(INPUT)).rejects.toThrow();
  });

  it("throws when the response is missing message content", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ choices: [{}] }), { status: 200 }));

    const provider = new RemoteAIProvider("key", "https://example.com/chat", "gpt-test");
    await expect(provider.generateDiagnosis(INPUT)).rejects.toThrow(/missing message content/);
  });

  it("throws when the message content itself isn't valid JSON", async () => {
    vi.mocked(fetch).mockResolvedValue(chatCompletionResponse("{not valid json"));

    const provider = new RemoteAIProvider("key", "https://example.com/chat", "gpt-test");
    await expect(provider.generateDiagnosis(INPUT)).rejects.toThrow(/not valid JSON/);
  });

  it("throws when the parsed content doesn't match the expected diagnosis shape", async () => {
    vi.mocked(fetch).mockResolvedValue(chatCompletionResponse(JSON.stringify({ headline: "" })));

    const provider = new RemoteAIProvider("key", "https://example.com/chat", "gpt-test");
    await expect(provider.generateDiagnosis(INPUT)).rejects.toThrow(/expected diagnosis shape/);
  });

  it("propagates a network failure (fetch rejecting) rather than hanging", async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError("Failed to fetch"));

    const provider = new RemoteAIProvider("key", "https://example.com/chat", "gpt-test");
    await expect(provider.generateDiagnosis(INPUT)).rejects.toThrow(/Failed to fetch/);
  });

  it("aborts and throws a timeout error when the request never settles", async () => {
    vi.useFakeTimers();
    vi.mocked(fetch).mockImplementation(
      (_url, options) =>
        new Promise((_resolve, reject) => {
          const signal = (options as RequestInit)?.signal;
          signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
        }),
    );

    const provider = new RemoteAIProvider("key", "https://example.com/chat", "gpt-test");
    const call = provider.generateDiagnosis(INPUT);
    const assertion = expect(call).rejects.toThrow(/timed out/);

    await vi.advanceTimersByTimeAsync(10_001);
    await assertion;
  });
});
