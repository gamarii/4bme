import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import type { WorkOrder } from "@/types/workOrder";
import type { MaintenanceLog } from "@/types/maintenanceLog";
import type { PartsRequest, PartsStatus } from "@/types/partsRequest";

import { getWorkOrder, setWorkOrderStatus, updateWorkOrder } from "@/services/workOrders";
import { addMaintenanceLog, listLogsByWorkOrder } from "@/services/maintenanceLogs";
import { createPartsRequest, listPartsByWorkOrder, updatePartsStatus } from "@/services/partsRequests";

import { useAuth } from "@/auth/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function WorkOrderDetailsPage() {
  const { workOrderId } = useParams<{ workOrderId: string }>();
  const { firebaseUser } = useAuth();

  const [wo, setWo] = useState<WorkOrder | null>(null);
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [parts, setParts] = useState<PartsRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Log form
  const [failureCode, setFailureCode] = useState("");
  const [partsUsedText, setPartsUsedText] = useState("");
  const [notes, setNotes] = useState("");

  // Parts form
  const [partName, setPartName] = useState("");

async function refresh() {
  if (!workOrderId) return;

  try {
    setLoading(true);

    const w = await getWorkOrder(workOrderId);
    setWo(w);

    if (w) {
      const [logsData, partsData] = await Promise.all([
        listLogsByWorkOrder(w.id),
        listPartsByWorkOrder(w.id),
      ]);

      setLogs(logsData);
      setParts(partsData);
    }
  } catch (err) {
    console.error("Failed to load work order details:", err);
  } finally {
    setLoading(false);
  }
}

  useEffect(() => {
    refresh();
  }, [workOrderId]);

  if (loading) return <div className="text-sm text-zinc-100">Loading…</div>;
  if (!wo) return <div className="text-sm text-zinc-100">Work order not found.</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
<Card className="border border-sky-200 bg-white">
  <CardContent className="flex flex-wrap items-center justify-between gap-6 p-6">
    
    {/* Left: Title */}
    <div>
      <h2 className="text-xl font-semibold text-slate-900">
        Work Order #{wo.id}
      </h2>
      <p className="text-sm text-slate-500">
        Key details and current status
      </p>
    </div>

    {/* Right: Info badges */}
    <div className="flex flex-wrap items-center gap-3 text-sm">
      
      <span className="rounded-full bg-red-100 px-3 py-1 font-medium text-red-700">
        {wo.priority}
      </span>

      <span className="rounded-full bg-blue-100 px-3 py-1 font-medium text-blue-700">
        {wo.status}
      </span>

      <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
        Device: {wo.deviceId}
      </span>

    </div>
  </CardContent>
</Card>
        <div className="flex gap-3">
          <Link to="/work-orders" className="underline text-zinc-200">Back</Link>
          <Button variant="secondary" className="border border-white/10 bg-white/5" onClick={refresh}>
            Refresh
          </Button>
        </div>
      </div>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-base">Current Status</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {(["Open", "Scheduled", "In progress", "Blocked", "Completed"] as const).map((s) => (
            <Button
              key={s}
              variant={wo.status === s ? "default" : "secondary"}
              className={wo.status === s ? "" : "border border-white/10 bg-white/5"}
              onClick={async () => {
                await setWorkOrderStatus(wo.id, s);
                // Mark partsBlocked automatically if status Blocked
                if (s === "Blocked") {
                  await updateWorkOrder(wo.id, { partsBlocked: true });
                }
                if (s !== "Blocked") {
                  await updateWorkOrder(wo.id, { partsBlocked: false });
                }
                await refresh();
              }}
            >
              {s}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-base">Add maintenance log (structured)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid gap-2">
            <Label>Failure code</Label>
            <Input value={failureCode} onChange={(e) => setFailureCode(e.target.value)} className="border-white/10 bg-black/20" />
          </div>
          <div className="grid gap-2">
            <Label>Parts used (comma separated)</Label>
            <Input value={partsUsedText} onChange={(e) => setPartsUsedText(e.target.value)} className="border-white/10 bg-black/20" />
          </div>
          <div className="grid gap-2">
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} className="border-white/10 bg-black/20" />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={async () => {
                if (!firebaseUser) return;
                if (!failureCode || !notes) return;

                await addMaintenanceLog({
                  deviceId: wo.deviceId,
                  workOrderId: wo.id,
                  failureCode,
                  partsUsed: partsUsedText
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                  notes,
                  createdByUid: firebaseUser.uid,
                  createdByEmail: firebaseUser.email ?? "",
                });

                setFailureCode("");
                setPartsUsedText("");
                setNotes("");

                await refresh();
              }}
            >
              Save log
            </Button>
          </div>

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
                  <TableCell className="text-zinc-300">{(l.partsUsed || []).join(", ") || "-"}</TableCell>
                  <TableCell className="text-zinc-300">{l.notes}</TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-zinc-100">No logs yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-base">Parts requests</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid gap-2 md:grid-cols-3">
            <div className="md:col-span-2 grid gap-2">
              <Label>Part name</Label>
              <Input value={partName} onChange={(e) => setPartName(e.target.value)} className="border-white/10 bg-black/20" />
            </div>
            <div className="flex items-end justify-end">
              <Button
                onClick={async () => {
                  if (!partName) return;
                  await createPartsRequest({
                    workOrderId: wo.id,
                    deviceId: wo.deviceId,
                    partName,
                    status: "requested",
                  });
                  setPartName("");
                  // if parts requested, mark blocked for visibility
                  await updateWorkOrder(wo.id, { partsBlocked: true, status: "Blocked" });
                  await refresh();
                }}
              >
                Request part
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Part</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Update</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-zinc-200">{p.partName}</TableCell>
                  <TableCell className="text-zinc-300">{p.status}</TableCell>
                  <TableCell className="text-right">
                    <select
                      value={p.status}
                      onChange={async (e) => {
                        const next = e.target.value as PartsStatus;
                        await updatePartsStatus(p.id, next);

                        // if all parts are received, unblock (simple rule)
                        if (next === "received") {
                          // refresh to compute state
                          const updated = await listPartsByWorkOrder(wo.id);
                          const anyNotReceived = updated.some((x) => x.status !== "received");
                          await updateWorkOrder(wo.id, {
                            partsBlocked: anyNotReceived,
                            status: anyNotReceived ? "Blocked" : "Scheduled",
                          });
                        }

                        await refresh();
                      }}
                      className="h-9 rounded-md border border-white/10 bg-black/20 px-2 text-sm text-zinc-100"
                    >
                      <option value="requested">requested</option>
                      <option value="ordered">ordered</option>
                      <option value="received">received</option>
                    </select>
                  </TableCell>
                </TableRow>
              ))}
              {parts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-zinc-100">No parts requests.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}