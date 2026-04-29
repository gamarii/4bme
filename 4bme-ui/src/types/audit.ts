export type AuditLogEntry = {
  id: string;
  taskId: string;
  action: string;
  selectedEngineerId?: string | null;
  selectedEngineerName?: string | null;
  supervisorId?: string | null;
  reason?: string | null;
  timestamp: string | { _seconds?: number } | Date;
};