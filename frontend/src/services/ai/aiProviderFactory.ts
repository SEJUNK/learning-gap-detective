import type { AIProvider } from "./aiProvider";
import { MockAIProvider } from "./mockAIProvider";
import { RemoteAIProvider } from "./remoteAIProvider";

const DEFAULT_API_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = "gpt-4o-mini";

/**
 * Selects the provider based on environment configuration alone — no
 * app code anywhere else decides this. Missing/empty VITE_AI_API_KEY
 * (the default in this repo — see frontend/.env.example) means the app
 * runs entirely on MockAIProvider, by design, so it always works.
 */
export function getAIProvider(): AIProvider {
  const apiKey = import.meta.env.VITE_AI_API_KEY as string | undefined;

  if (!apiKey || apiKey.trim() === "") {
    return new MockAIProvider();
  }

  const apiUrl = (import.meta.env.VITE_AI_API_URL as string | undefined) || DEFAULT_API_URL;
  const model = (import.meta.env.VITE_AI_MODEL as string | undefined) || DEFAULT_MODEL;
  return new RemoteAIProvider(apiKey, apiUrl, model);
}
