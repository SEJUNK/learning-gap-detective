import { API_BASE_URL } from "../constants/config";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** Thin fetch wrapper: centralizes base URL, JSON handling, and error shape. */
export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    throw new ApiError(response.status, `Request to ${path} failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}
