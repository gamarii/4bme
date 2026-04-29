export type ScheduleTask = {
  id: string;
  title: string;
  assignedEngineerId: string;
  assignedEngineerName?: string | null;
  start: string;
  end: string;
  priority: "low" | "medium" | "high" | "critical";
};

export type UrgentInsertRequest = {
  urgentTask: ScheduleTask;
  currentSchedule: ScheduleTask[];
};

export function recalculateSchedule(input: UrgentInsertRequest) {
  const impacted = input.currentSchedule.filter(
    (t) =>
      t.assignedEngineerId === input.urgentTask.assignedEngineerId &&
      new Date(t.start) >= new Date(input.urgentTask.start)
  );

  const updatedSchedule = input.currentSchedule.map((task) => {
    if (
      task.assignedEngineerId === input.urgentTask.assignedEngineerId &&
      new Date(task.start) >= new Date(input.urgentTask.start)
    ) {
      const shiftedStart = new Date(task.start);
      shiftedStart.setHours(shiftedStart.getHours() + 1);

      const shiftedEnd = new Date(task.end);
      shiftedEnd.setHours(shiftedEnd.getHours() + 1);

      return {
        ...task,
        start: shiftedStart.toISOString(),
        end: shiftedEnd.toISOString(),
      };
    }

    return task;
  });

  updatedSchedule.push(input.urgentTask);
  updatedSchedule.sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );

  return {
    urgentInserted: true,
    impactedTasks: impacted.map((t) => t.id),
    updatedSchedule,
  };
}