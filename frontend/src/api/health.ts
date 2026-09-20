import { apiGet } from "./client";

export interface HealthStatus {
  status: string;
  service: string;
  environment: string;
}

export function getHealth(): Promise<HealthStatus> {
  return apiGet<HealthStatus>("/health");
}
