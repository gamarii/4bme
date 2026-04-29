export type MaintenanceLog = {
  id: string;
  deviceId: string;
  workOrderId: string;

  failureCode: string;      // structured field
  partsUsed: string[];      // structured field
  notes: string;            // structured field

  createdByUid: string;
  createdByEmail?: string;

  timestamp?: any;
};