export type DeviceRiskLevel = "Low" | "Medium" | "High";

export type DeviceRisk = {
  deviceId: string;
  score: number; // 0 - 100
  level: DeviceRiskLevel;
  reasons: string[];
  recommendedAction: string;
};