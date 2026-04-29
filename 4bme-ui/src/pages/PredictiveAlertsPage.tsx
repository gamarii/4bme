import { useEffect, useMemo, useState } from "react";
import { listDevices } from "@/services/devices";
import { listWorkOrders, createWorkOrder } from "@/services/workOrders";
import { listMaintenanceLogs } from "@/services/maintenanceLogs";
import { createDeviceRiskSnapshot } from "@/services/deviceRiskSnapshots";
import { createAuditLog } from "@/services/auditLogs";

import type { Device } from "@/types/device";
import type { WorkOrder } from "@/types/workOrder";
import type { MaintenanceLog } from "@/types/maintenanceLog";
import type { DeviceRisk } from "@/types/deviceRisk";

import { calculateAllDeviceRisks } from "@/lib/riskEngine";
import RiskBadge from "@/components/predictive/RiskBadge";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/auth/AuthContext";

export default function PredictiveAlertsPage() {
  const { user } = useAuth();

  const [devices, setDevices] = useState<Device[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function refresh() {
    setLoading(true);
    const [ds, wos, lg] = await Promise.all([
      listDevices(),
      listWorkOrders(),
      listMaintenanceLogs(),
    ]);
    setDevices(ds);
    setWorkOrders(wos);
    setLogs(lg);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  const risks = useMemo(() => {
    return calculateAllDeviceRisks({
      devices,
      workOrders,
      logs,
    }).sort((a, b) => b.score - a.score);
  }, [devices, workOrders, logs]);

  const highMediumRisks = risks.filter((r) => r.level === "High" || r.level === "Medium");

  const deviceMap = useMemo(() => {
    const map = new Map<string, Device>();
    devices.forEach((d) => map.set(d.id, d));
    return map;
  }, [devices]);

  async function createPreventiveTask(risk: DeviceRisk) {
    const device = deviceMap.get(risk.deviceId);
    if (!device) return;

    await createWorkOrder({
      deviceId: device.id,
      priority:
        risk.level === "High"
          ? "Critical"
          : risk.level === "Medium"
          ? "High"
          : "Medium",
      description: `Preventive maintenance generated from predictive warning for ${device.name}`,
      status: "Open",
      source: "Predictive",
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      assignedEngineerId: null,
      assignedEngineerName: null,
      partsBlocked: false,
    });

    await createAuditLog({
      taskId: `predictive_${device.id}`,
      action: "predictive_task_created",
      supervisorId: user?.uid ?? null,
      reason: `Preventive task created from predictive warning for ${device.name}`,
      deviceId: device.id,
    });

    setMessage(`Preventive task created for ${device.name}.`);
    await refresh();
  }

  async function saveSnapshot(risk: DeviceRisk) {
    await createDeviceRiskSnapshot({
      deviceId: risk.deviceId,
      score: risk.score,
      level: risk.level,
      reasons: risk.reasons,
      recommendedAction: risk.recommendedAction,
    });

    setMessage(`Risk snapshot saved for ${deviceMap.get(risk.deviceId)?.name ?? risk.deviceId}.`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Predictive Alerts</h2>
          <p className="mt-1 text-sm text-zinc-300">
            Review devices with elevated failure risk and create preventive work orders.
          </p>
        </div>

        <Button
          onClick={refresh}
          variant="secondary"
          className="border border-white/10 bg-white/5"
        >
          Refresh
        </Button>
      </div>

      {message && (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {message}
        </div>
      )}

      <div className="grid gap-4">
        {loading ? (
          <Card className="border-white/10 bg-white/5 text-zinc-100">
            <CardContent className="pt-6 text-sm text-zinc-300">Loading…</CardContent>
          </Card>
        ) : highMediumRisks.length === 0 ? (
          <Card className="border-white/10 bg-white/5 text-zinc-100">
            <CardContent className="pt-6 text-sm text-zinc-300">
              No medium or high predictive alerts right now.
            </CardContent>
          </Card>
        ) : (
          highMediumRisks.map((risk) => {
            const device = deviceMap.get(risk.deviceId);

            return (
              <Card key={risk.deviceId} className="border-white/10 bg-white/5 text-zinc-100">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-base">
                        {device?.name ?? risk.deviceId}
                      </CardTitle>
                      <CardDescription className="mt-1 text-zinc-300">
                        {device?.department ?? "-"} • {device?.location ?? "-"}
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-sm text-zinc-300">Score: {risk.score}</div>
                      <RiskBadge level={risk.level} />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="text-sm text-zinc-300">{risk.recommendedAction}</div>

                  <div className="space-y-1">
                    {risk.reasons.map((reason, index) => (
                      <div key={index} className="text-xs text-zinc-400">
                        • {reason}
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => createPreventiveTask(risk)}>
                      Create Preventive Task
                    </Button>
                    <Button
                      variant="secondary"
                      className="border border-white/10 bg-white/5"
                      onClick={() => saveSnapshot(risk)}
                    >
                      Save Snapshot
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}