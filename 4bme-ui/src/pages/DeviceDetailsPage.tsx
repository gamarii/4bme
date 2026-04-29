import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

import type { Device } from "@/types/device";
import type { WorkOrder } from "@/types/workOrder";
import type { MaintenanceLog } from "@/types/maintenanceLog";
import type { DeviceRiskSnapshot } from "@/types/deviceRiskSnapshot";

import { getDevice, updateDevice } from "@/services/devices";
import { createWorkOrder, listWorkOrdersByDevice } from "@/services/workOrders";
import { listLogsByDevice } from "@/services/maintenanceLogs";
import {
  createDeviceRiskSnapshot,
  listDeviceRiskSnapshots,
} from "@/services/deviceRiskSnapshots";
import { createAuditLog } from "@/services/auditLogs";

import { calculateDeviceRisk } from "@/lib/riskEngine";
import RiskBadge from "@/components/predictive/RiskBadge";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/auth/AuthContext";

function formatSnapshotDate(value: any) {
  if (!value) return "-";
  if (value?.seconds) return new Date(value.seconds * 1000).toLocaleDateString();
  if (value?._seconds) return new Date(value._seconds * 1000).toLocaleDateString();
  return new Date(value).toLocaleDateString();
}

export default function DeviceDetailsPage() {
  const { deviceId } = useParams<{ deviceId: string }>();
  const { user } = useAuth();

  const [device, setDevice] = useState<Device | null>(null);
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [snapshots, setSnapshots] = useState<DeviceRiskSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");

async function refresh() {
  if (!deviceId) return;

  try {
    setLoading(true);

    const d = await getDevice(deviceId);
    setDevice(d);

    if (d) {
      const [ordersData, logsData] = await Promise.all([
        listWorkOrdersByDevice(d.id),
        listLogsByDevice(d.id),
      ]);

      setOrders(ordersData);
      setLogs(logsData);
    }
  } catch (err) {
    console.error("Failed to load device details:", err);
  } finally {
    setLoading(false);
  }
}

  useEffect(() => {
    refresh();
  }, [deviceId]);

  const risk = useMemo(() => {
    if (!device) return null;
    return calculateDeviceRisk({
      device,
      workOrders: orders,
      logs,
    });
  }, [device, orders, logs]);

  const chartData = useMemo(() => {
    return snapshots.map((s, index) => ({
      name: formatSnapshotDate(s.createdAt) || `Point ${index + 1}`,
      score: s.score,
    }));
  }, [snapshots]);

  if (loading) return <div className="text-sm text-zinc-100">Loading…</div>;
  if (!device) return <div className="text-sm text-zinc-100">Device not found.</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">{device.name}</h2>
          <p className="text-sm text-zinc-100">
            {device.department} • {device.location}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/devices" className="underline text-zinc-200">
            Back
          </Link>
          <Button
            variant="secondary"
            className="border border-white/10 bg-white/5"
            onClick={refresh}
          >
            Refresh
          </Button>
        </div>
      </div>

      {risk && (
        <Card className="border-white/10 bg-white/5 text-zinc-100">
          <CardHeader>
            <CardTitle className="text-base">Predictive Maintenance Risk</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-300">Risk score:</span>
              <span className="text-xl font-semibold">{risk.score}</span>
              <RiskBadge level={risk.level} />
            </div>

            <div className="text-sm text-zinc-300">{risk.recommendedAction}</div>

            <div className="space-y-1">
              {risk.reasons.map((reason, index) => (
                <div key={index} className="text-xs text-zinc-400">
                  • {reason}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                onClick={async () => {
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

                  setStatusMessage("Preventive work order created successfully.");
                  await refresh();
                }}
              >
                Create Preventive Task
              </Button>

              <Button
                variant="secondary"
                className="border border-white/10 bg-white/5"
                onClick={async () => {
                  await createDeviceRiskSnapshot({
                    deviceId: device.id,
                    score: risk.score,
                    level: risk.level,
                    reasons: risk.reasons,
                    recommendedAction: risk.recommendedAction,
                  });

                  setStatusMessage("Risk snapshot saved successfully.");
                  await refresh();
                }}
              >
                Save Risk Snapshot
              </Button>
            </div>

            {statusMessage && (
              <div className="text-sm text-emerald-300">{statusMessage}</div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="border-white/10 bg-white/5 text-zinc-100">
        <CardHeader>
          <CardTitle className="text-base">Risk Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="text-sm text-zinc-300">
              No risk history yet. Save a risk snapshot to start tracking.
            </div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-base">Edit device</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-2">
            <Label>Department</Label>
            <Input
              value={device.department}
              onChange={(e) => setDevice({ ...device, department: e.target.value })}
              className="border-white/10 bg-black/20"
            />
          </div>
          <div className="grid gap-2">
            <Label>Location</Label>
            <Input
              value={device.location}
              onChange={(e) => setDevice({ ...device, location: e.target.value })}
              className="border-white/10 bg-black/20"
            />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <Button
              onClick={async () => {
                await updateDevice(device.id, {
                  department: device.department,
                  location: device.location,
                });
                await refresh();
              }}
            >
              Save
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-base">Work orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead>Due</TableHead>
                <TableHead className="text-right">Open</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="text-zinc-200">{w.priority}</TableCell>
                  <TableCell className="text-zinc-300">{w.status}</TableCell>
                  <TableCell className="text-zinc-300">{w.source ?? "Manual"}</TableCell>
                  <TableCell className="text-zinc-300">
                    {w.assignedEngineerName || w.assignedEngineerId || "Unassigned"}
                  </TableCell>
                  <TableCell className="text-zinc-300">
                    {w.dueDate ? new Date(w.dueDate).toLocaleString() : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link className="underline text-zinc-100" to={`/work-orders/${w.id}`}>
                      Details
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-zinc-100">
                    No work orders yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-base">Maintenance history</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Failure code</TableHead>
                <TableHead>Parts</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-zinc-200">{l.failureCode}</TableCell>
                  <TableCell className="text-zinc-300">
                    {(l.partsUsed || []).join(", ") || "-"}
                  </TableCell>
                  <TableCell className="text-zinc-300">{l.notes}</TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-zinc-100">
                    No logs yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}