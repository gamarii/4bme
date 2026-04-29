export type WorkOrderPriority = "Low" | "Medium" | "High" | "Critical";
export type WorkOrderStatus =
  | "Open"
  | "Scheduled"
  | "In progress"
  | "Completed"
  | "Blocked";

export type WorkOrderSource = "Manual" | "Predictive" | "Schedule";

export type WorkOrder = {
  id: string;
  deviceId: string;

  priority: WorkOrderPriority;
  description: string;
  status: WorkOrderStatus;

  source?: WorkOrderSource;

  dueDate?: string;
  assignedEngineerId?: string | null;
  assignedEngineerName?: string | null;

  partsBlocked?: boolean;

  createdAt?: any;
  updatedAt?: any;
  completedAt?: any;
};