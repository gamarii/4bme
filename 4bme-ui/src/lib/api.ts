import type { RecommendationResponse } from "@/types/recommendation";
import type { AuditLogEntry } from "@/types/audit";
import type { ScheduleTask } from "@/types/schedule";

const API_BASE = "http://localhost:4000/api";

export async function fetchRecommendations(payload: {
  taskId: string;
  deviceName: string;
  deviceType: string;
  location: string;
  urgency: "low" | "medium" | "high" | "critical";
  requiredSkills: string[];
}): Promise<RecommendationResponse> {
  const res = await fetch(`${API_BASE}/recommendations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Failed to fetch recommendations");
  }

  return res.json();
}

export async function submitDecision(payload: {
  taskId: string;
  action: "approve" | "reject" | "override" | "select_alternative";
  selectedEngineerId?: string;
  supervisorId: string;
  reason?: string;
}) {
  const res = await fetch(`${API_BASE}/decisions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Decision submission failed");
  }

  return data;
}

export async function fetchAuditLogs(): Promise<AuditLogEntry[]> {
  const res = await fetch(`${API_BASE}/decisions`);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to load audit logs");
  }

  return data;
}

export async function recalculateUrgentSchedule(payload: {
  urgentTask: ScheduleTask;
  currentSchedule: ScheduleTask[];
}) {
  const res = await fetch(`${API_BASE}/schedule/recalculate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Failed to recalculate schedule");
  }

  return res.json();
}

export async function fetchScheduleQueue(): Promise<ScheduleTask[]> {
  const res = await fetch(`${API_BASE}/schedule/queue`);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to load schedule queue");
  }

  return data;
}

export async function confirmScheduleQueue(payload: {
  updatedSchedule: ScheduleTask[];
  supervisorId?: string;
}) {
  const res = await fetch(`${API_BASE}/schedule/confirm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to confirm schedule queue");
  }

  return data as { success: boolean; updatedSchedule: ScheduleTask[] };
}

