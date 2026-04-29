export type PartsStatus = "requested" | "ordered" | "received";

export type PartsRequest = {
  id: string;
  workOrderId: string;
  deviceId: string;

  partName: string;
  status: PartsStatus;

  updatedAt?: any;
};