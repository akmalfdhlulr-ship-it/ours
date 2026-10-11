export interface LivenessResponse {
  status: "ok";
  timestamp: string;
  uptime: number;
}

export type HealthCheckStatus = "healthy" | "unhealthy" | "degraded";

export interface ReadinessResponse {
  status: "ok" | "error";
  timestamp: string;
  checks: {
    database: HealthCheckStatus;
    [dependency: string]: HealthCheckStatus;
  };
  details?: Record<string, unknown>;
}
