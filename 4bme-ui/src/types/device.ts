export type DeviceCriticality = "Low" | "Medium" | "High";
export type DeviceStatus = "Active" | "Out of service" | "Maintenance";

export type Device = {
  id: string;
  name: string;
  model?: string;
  manufacturer?: string;
  department: string;
  location: string;
  status: DeviceStatus;
  criticality: DeviceCriticality;

  createdAt?: any;
  updatedAt?: any;
};