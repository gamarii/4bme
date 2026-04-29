import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { WorkOrder } from "@/types/workOrder";
import { createWorkOrder, listWorkOrders } from "@/services/workOrders";
import { listDevices } from "@/services/devices";
import type { Device } from "@/types/device";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function WorkOrdersPage() {
  const [rows, setRows] = useState<WorkOrder[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  const [deviceId, setDeviceId] = useState("");
  const [priority, setPriority] = useState<WorkOrder["priority"]>("High");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  async function refresh() {
    setLoading(true);
    setRows(await listWorkOrders());
    setDevices(await listDevices());
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  const deviceMap = new Map(devices.map((d) => [d.id, d]));

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold">Work Orders</h2>
          <p className="text-sm text-zinc-100">Create tasks and track status with timestamps.</p>
        </div>
        <Button onClick={refresh} variant="secondary" className="border border-white/10 bg-white/5">
          Refresh
        </Button>
      </div>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-base text-zinc-100">Create work order</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-2">
            <Label>Device</Label>
            <select
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              className="h-10 rounded-md border border-white/10 bg-black/20 px-3 text-sm text-zinc-100"
            >
              <option value="">Select device…</option>
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.department})
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label>Priority</Label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as WorkOrder["priority"])}
              className="h-10 rounded-md border border-white/10 bg-black/20 px-3 text-sm text-zinc-100"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div className="grid gap-2 md:col-span-2">
            <Label>Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border-white/10 bg-black/20"
              placeholder="e.g., Quarterly PM and calibration"
            />
          </div>

          <div className="grid gap-2">
            <Label>Due date (optional)</Label>
            <Input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="border-white/10 bg-black/20"
            />
          </div>

          <div className="flex items-end justify-end">
            <Button
              onClick={async () => {
                if (!deviceId || !description) return;
                await createWorkOrder({
                  deviceId,
                  priority,
                  description,
                  status: "Open",
                  source: "Manual",
                  dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
                  assignedEngineerId: null,
                  assignedEngineerName: null,
                  partsBlocked: false,
                });
                setDeviceId("");
                setDescription("");
                setDueDate("");
                await refresh();
              }}
            >
              Create
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-base">All work orders</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-zinc-100">Loading…</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((w) => {
                  const device = deviceMap.get(w.deviceId);

                  return (
                    <TableRow key={w.id}>
                      <TableCell className="text-zinc-200">{w.priority}</TableCell>
                      <TableCell className="text-zinc-300">{w.status}</TableCell>
                      <TableCell className="text-zinc-300">
                        {w.source === "Predictive" ? (
                          <span className="rounded-full bg-purple-500/15 px-2 py-0.5 text-xs text-purple-600 ring-1 ring-purple-500/30">
                            Predictive
                          </span>
                        ) : (
                          w.source ?? "Manual"
                        )}
                      </TableCell>
                      <TableCell className="text-zinc-300">
                        {device?.name ?? w.deviceId}
                      </TableCell>
                      <TableCell className="text-zinc-300">
                        {w.assignedEngineerName || w.assignedEngineerId || "Unassigned"}
                      </TableCell>
                      <TableCell className="text-zinc-300">
                        {w.dueDate ? new Date(w.dueDate).toLocaleString() : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link className="underline text-zinc-100" to={`/work-orders/${w.id}`}>
                            Details
                          </Link>

                          <Link
                            className="underline text-zinc-100"
                            to={`/recommendations?taskId=${w.id}&deviceId=${w.deviceId}`}
                          >
                            Recommend
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-zinc-100">
                      No work orders yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}