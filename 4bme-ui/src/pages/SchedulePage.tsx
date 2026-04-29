import { useEffect, useState } from "react";
import {
  recalculateUrgentSchedule,
  fetchScheduleQueue,
  confirmScheduleQueue,
} from "@/lib/api";
import { listWorkOrders } from "@/services/workOrders";
import { listEngineers } from "@/services/engineers";
import { useAuth } from "@/auth/AuthContext";
import type { WorkOrder } from "@/types/workOrder";
import type { ScheduleTask, UrgentScheduleResponse } from "@/types/schedule";
import type { Engineer } from "@/types/engineer";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function toScheduleTasks(workOrders: WorkOrder[]): ScheduleTask[] {
  return workOrders
    .filter(
      (w) =>
        !!w.assignedEngineerId &&
        !!w.dueDate &&
        ["Scheduled", "In progress", "Blocked", "Open"].includes(w.status)
    )
    .map((w) => {
      const end = new Date(w.dueDate!);
      const start = new Date(end);
      start.setHours(end.getHours() - 1);

      return {
        id: w.id,
        title: w.description,
        assignedEngineerId: w.assignedEngineerId!,
        assignedEngineerName: w.assignedEngineerName ?? null,
        start: start.toISOString(),
        end: end.toISOString(),
        priority: mapPriority(w.priority),
      };
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

function mapPriority(
  p: WorkOrder["priority"]
): "low" | "medium" | "high" | "critical" {
  if (p === "Low") return "low";
  if (p === "Medium") return "medium";
  if (p === "High") return "high";
  return "critical";
}

export default function SchedulePage() {
  const { user } = useAuth();

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("Urgent ventilator inspection");
  const [assignedEngineerId, setAssignedEngineerId] = useState("eng_1");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "critical">("critical");

  const [result, setResult] = useState<UrgentScheduleResponse | null>(null);
  const [error, setError] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [confirmedSchedule, setConfirmedSchedule] = useState<ScheduleTask[]>([]);

  async function refresh() {
    setLoading(true);
    const [rows, engs, queue] = await Promise.all([
      listWorkOrders(),
      listEngineers(),
      fetchScheduleQueue().catch(() => [] as ScheduleTask[]),
    ]);

    setWorkOrders(rows);
    setEngineers(engs);

    if (queue.length > 0) {
      setConfirmedSchedule(queue);
    } else {
      setConfirmedSchedule(toScheduleTasks(rows));
    }

    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  const engineerOptions = engineers.filter((e) => e.isActive);

  async function handlePreview() {
    try {
      setError("");
      setResult(null);
      setPreviewOpen(false);
      setSuccessMessage("");

      const selectedEngineer = engineerOptions.find((e) => e.id === assignedEngineerId);

      const payload = {
        urgentTask: {
          id: `urgent_${Date.now()}`,
          title,
          assignedEngineerId,
          assignedEngineerName: selectedEngineer?.name ?? null,
          start: new Date(start).toISOString(),
          end: new Date(end).toISOString(),
          priority,
        },
        currentSchedule: confirmedSchedule,
      };

      const res = await recalculateUrgentSchedule(payload);
      setResult(res);
      setPreviewOpen(true);
    } catch (err: any) {
      setError(err.message || "Failed to recalculate schedule.");
    }
  }

  async function handleConfirmScheduleChange() {
    if (!result) return;

    try {
      const response = await confirmScheduleQueue({
        updatedSchedule: result.updatedSchedule,
        supervisorId: user?.uid,
      });

      setConfirmedSchedule(response.updatedSchedule);
      setPreviewOpen(false);
      setSuccessMessage("Urgent task inserted into the schedule queue successfully.");
      setResult(null);
    } catch (err: any) {
      setError(err.message || "Failed to confirm schedule change.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Schedule</h2>
        <p className="mt-1 text-sm text-zinc-300">
          Preview how urgent work affects the current engineer schedule before confirming changes.
        </p>
      </div>

      <Card className="border-white/10 bg-white/5 text-zinc-100">
        <CardHeader>
          <CardTitle>Urgent task insertion</CardTitle>
          <CardDescription className="text-zinc-300">
            Preview and then confirm schedule impact.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label>Urgent task title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="grid gap-2">
            <Label>Assigned engineer</Label>
            <select
              value={assignedEngineerId}
              onChange={(e) => setAssignedEngineerId(e.target.value)}
              className="h-10 rounded-md border border-white/10 bg-black/20 px-3 text-sm text-zinc-100"
            >
              {engineerOptions.map((eng) => (
                <option key={eng.id} value={eng.id}>
                  {eng.name} ({eng.location})
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label>Start</Label>
            <Input
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label>End</Label>
            <Input
              type="datetime-local"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label>Priority</Label>
            <select
              value={priority}
              onChange={(e) =>
                setPriority(e.target.value as "low" | "medium" | "high" | "critical")
              }
              className="h-10 rounded-md border border-white/10 bg-black/20 px-3 text-sm text-zinc-100"
            >
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
              <option value="critical">critical</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <Button onClick={handlePreview} disabled={!start || !end || !assignedEngineerId}>
              Preview Impact
            </Button>
          </div>

          {error && <div className="md:col-span-2 text-sm text-red-300">{error}</div>}
          {successMessage && (
            <div className="md:col-span-2 text-sm text-emerald-300">{successMessage}</div>
          )}
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5 text-zinc-100">
        <CardHeader>
          <CardTitle>Current schedule queue</CardTitle>
          <CardDescription className="text-zinc-300">
            This queue updates after you confirm a preview.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-zinc-300">Loading…</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Engineer</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Priority</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {confirmedSchedule.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="text-zinc-100">{task.title}</TableCell>
                    <TableCell className="text-zinc-300">
                      {task.assignedEngineerName || task.assignedEngineerId}
                    </TableCell>
                    <TableCell className="text-zinc-300">
                      {new Date(task.start).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-zinc-300">
                      {new Date(task.end).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-zinc-300">{task.priority}</TableCell>
                  </TableRow>
                ))}

                {confirmedSchedule.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-zinc-300">
                      No assigned scheduled tasks yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {previewOpen && result && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-white/10 bg-zinc-950 p-6 text-zinc-100 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">Schedule Impact Preview</h3>
                <p className="mt-1 text-sm text-zinc-300">
                  Review impacted tasks and confirm the queue update.
                </p>
              </div>

              <Button
                variant="secondary"
                className="border border-white/10 bg-white/5"
                onClick={() => setPreviewOpen(false)}
              >
                Close
              </Button>
            </div>

            <div className="mt-6 grid gap-6">
              <Card className="border-white/10 bg-white/5 text-zinc-100">
                <CardHeader>
                  <CardTitle>Impacted tasks</CardTitle>
                  <CardDescription className="text-zinc-300">
                    These tasks would be affected if the urgent job is inserted.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {result.impactedTasks.length > 0 ? (
                    <ul className="space-y-2 text-sm text-zinc-200">
                      {result.impactedTasks.map((id) => (
                        <li key={id} className="rounded-md border border-white/10 px-3 py-2">
                          {id}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-zinc-300">No tasks would be impacted.</div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/5 text-zinc-100">
                <CardHeader>
                  <CardTitle>Updated schedule preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Task</TableHead>
                        <TableHead>Engineer</TableHead>
                        <TableHead>Start</TableHead>
                        <TableHead>End</TableHead>
                        <TableHead>Priority</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.updatedSchedule.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell className="text-zinc-100">{task.title}</TableCell>
                          <TableCell className="text-zinc-300">
                            {task.assignedEngineerName || task.assignedEngineerId}
                          </TableCell>
                          <TableCell className="text-zinc-300">
                            {new Date(task.start).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-zinc-300">
                            {new Date(task.end).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-zinc-300">{task.priority}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="secondary"
                className="border border-white/10 bg-white/5"
                onClick={() => setPreviewOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleConfirmScheduleChange}>
                Confirm Schedule Change
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}