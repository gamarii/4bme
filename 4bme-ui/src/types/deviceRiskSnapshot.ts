export type DeviceRiskSnapshot = {
  id: string;
  deviceId: string;
  score: number;
  level: "Low" | "Medium" | "High";
  reasons: string[];
  recommendedAction: string;
  createdAt?: any;
};