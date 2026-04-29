

export type ScheduleTask = {
  id: string;
  title: string;
  assignedEngineerId: string;
  assignedEngineerName?: string | null;
  start: string;
  end: string;
  priority: "low" | "medium" | "high" | "critical";
};

export type UrgentScheduleResponse = {
  urgentInserted: boolean;
  impactedTasks: string[];
  updatedSchedule: ScheduleTask[];
};

