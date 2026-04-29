import type { Device } from "@/types/device";
import type { WorkOrder } from "@/types/workOrder";
import type { MaintenanceLog } from "@/types/maintenanceLog";
import type { DeviceRisk } from "@/types/deviceRisk";

type RiskInput = {
  device: Device;
  workOrders: WorkOrder[];
  logs: MaintenanceLog[];
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function calculateDeviceRisk(input: RiskInput): DeviceRisk {
  const { device, workOrders, logs } = input;

  let score = 0;
  const reasons: string[] = [];

  const deviceLogs = logs.filter((l) => l.deviceId === device.id);
  const deviceOrders = workOrders.filter((w) => w.deviceId === device.id);

  const activeOrders = deviceOrders.filter((w) =>
    ["Open", "Scheduled", "In progress", "Blocked"].includes(w.status)
  );

  const blockedOrders = deviceOrders.filter((w) => w.status === "Blocked");
  const highPriorityOrders = deviceOrders.filter(
    (w) => w.priority === "High" || w.priority === "Critical"
  );

  if (device.criticality === "High") {
    score += 20;
    reasons.push("Device is marked as high criticality.");
  } else if (device.criticality === "Medium") {
    score += 10;
    reasons.push("Device has medium criticality.");
  }

  if (deviceLogs.length >= 5) {
    score += 25;
    reasons.push("Frequent maintenance history / repeated issues recorded.");
  } else if (deviceLogs.length >= 3) {
    score += 15;
    reasons.push("Multiple maintenance incidents recorded.");
  } else if (deviceLogs.length >= 1) {
    score += 8;
    reasons.push("Previous maintenance issues exist.");
  }

  if (blockedOrders.length >= 2) {
    score += 20;
    reasons.push("Multiple blocked work orders are associated with this device.");
  } else if (blockedOrders.length === 1) {
    score += 10;
    reasons.push("A blocked work order is associated with this device.");
  }

  if (highPriorityOrders.length >= 2) {
    score += 15;
    reasons.push("Repeated high-priority maintenance demand.");
  } else if (highPriorityOrders.length === 1) {
    score += 8;
    reasons.push("At least one high-priority maintenance task exists.");
  }

  if (activeOrders.length >= 3) {
    score += 12;
    reasons.push("Several active maintenance tasks exist for this device.");
  } else if (activeOrders.length >= 1) {
    score += 5;
    reasons.push("There is at least one active maintenance task.");
  }

  if (device.status === "Out of service") {
    score += 25;
    reasons.push("Device is currently out of service.");
  } else if (device.status === "Maintenance") {
    score += 10;
    reasons.push("Device is currently under maintenance.");
  }

  score = clamp(score, 0, 100);

  let level: DeviceRisk["level"] = "Low";
  if (score >= 60) level = "High";
  else if (score >= 30) level = "Medium";

  const recommendedAction =
    level === "High"
      ? "Create a preventive work order immediately and prioritize inspection."
      : level === "Medium"
      ? "Schedule preventive maintenance soon and monitor closely."
      : "Continue routine monitoring.";

  return {
    deviceId: device.id,
    score,
    level,
    reasons,
    recommendedAction,
  };
}

export function calculateAllDeviceRisks(params: {
  devices: Device[];
  workOrders: WorkOrder[];
  logs: MaintenanceLog[];
}) {
  const { devices, workOrders, logs } = params;
  return devices.map((device) =>
    calculateDeviceRisk({
      device,
      workOrders,
      logs,
    })
  );
}