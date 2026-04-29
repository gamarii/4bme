import { useEffect, useMemo, useState } from "react";
import { Activity, CalendarClock, MapPin, Users, Wrench } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { listDevices } from "@/services/devices";
import { listWorkOrders } from "@/services/workOrders";
import { listEngineers } from "@/services/engineers";
import { listMaintenanceLogs } from "@/services/maintenanceLogs";

import type { Device } from "@/types/device";
import type { WorkOrder } from "@/types/workOrder";
import type { Engineer } from "@/types/engineer";
import type { MaintenanceLog } from "@/types/maintenanceLog";
import type { DeviceRisk } from "@/types/deviceRisk";

import { calculateAllDeviceRisks } from "@/lib/riskEngine";

type UpcomingRow = {
  id: string;
  device: string;
  dept: string;
  location: string;
  engineer: string;
  due: string;
  status: "Scheduled" | "In progress" | "Blocked" | "Open" | "Completed";
};

export default function DashboardPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const [ds, wos, engs, lg] = await Promise.all([
      listDevices(),
      listWorkOrders(),
      listEngineers(),
      listMaintenanceLogs(),
    ]);
    setDevices(ds);
    setWorkOrders(wos);
    setEngineers(engs);
    setLogs(lg);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  const deviceById = useMemo(() => {
    const map = new Map<string, Device>();
    devices.forEach((d) => map.set(d.id, d));
    return map;
  }, [devices]);

  const riskMap = useMemo(() => {
    const risks = calculateAllDeviceRisks({
      devices,
      workOrders,
      logs,
    });

    const map = new Map<string, DeviceRisk>();
    risks.forEach((r) => map.set(r.deviceId, r));
    return map;
  }, [devices, workOrders, logs]);

  // const highRiskDevices = useMemo(() => {
  //   return Array.from(riskMap.values())
  //     .filter((r) => r.level === "High")
  //     .sort((a, b) => b.score - a.score);
  // }, [riskMap]);
const highRiskDevices = useMemo(() => {
  return Array.from(riskMap.values())
    .filter((r) => r.level === "High" || r.level === "Medium")
    .sort((a, b) => b.score - a.score);
}, [riskMap]);

  const now = useMemo(() => new Date(), []);
  const in7Days = useMemo(() => {
    const d = new Date(now);
    d.setDate(d.getDate() + 7);
    return d;
  }, [now]);

  const dueIn7Days = useMemo(() => {
    return workOrders.filter((w) => {
      if (!w.dueDate) return false;
      const due = new Date(w.dueDate);
      return due <= in7Days && w.status !== "Completed";
    });
  }, [workOrders, in7Days]);

  const activeStatuses = new Set(["Open", "Scheduled", "In progress", "Blocked"]);

  const workloadData = useMemo(() => {
    const counts = new Map<string, number>();

    workOrders.forEach((wo) => {
      if (!wo.assignedEngineerId || !activeStatuses.has(wo.status)) return;
      counts.set(
        wo.assignedEngineerId,
        (counts.get(wo.assignedEngineerId) ?? 0) + 1
      );
    });

    return engineers.map((eng) => ({
      name: eng.name.split(" ")[0],
      tasks: counts.get(eng.id) ?? 0,
    }));
  }, [engineers, workOrders]);

  const upcoming: UpcomingRow[] = useMemo(() => {
    return workOrders
      .filter((w) => w.status !== "Completed")
      .map((w) => {
        const dev = deviceById.get(w.deviceId);
        return {
          id: w.id,
          device: dev?.name ?? w.deviceId,
          dept: dev?.department ?? "-",
          location: dev?.location ?? "-",
          engineer: w.assignedEngineerName || w.assignedEngineerId || "Unassigned",
          due: w.dueDate ? new Date(w.dueDate).toLocaleString() : "-",
          status: w.status as UpcomingRow["status"],
        };
      })
      .sort((a, b) => {
        const ad = a.due === "-" ? Number.POSITIVE_INFINITY : new Date(a.due).getTime();
        const bd = b.due === "-" ? Number.POSITIVE_INFINITY : new Date(b.due).getTime();
        return ad - bd;
      })
      .slice(0, 6);
  }, [workOrders, deviceById]);

  const kpis = [
    {
      title: "Devices under management",
      value: String(devices.length),
      delta: "—",
      icon: Wrench,
      hint: "From Firestore",
    },
    {
      title: "Maintenance due (7 days)",
      value: String(dueIn7Days.length),
      delta: "—",
      icon: CalendarClock,
      hint: "Work orders due soon",
    },
    {
      title: "High risk alerts",
      value: String(highRiskDevices.length),
      delta: "—",
      icon: Activity,
      hint: "Predictive risk engine",
    },
    {
      title: "Engineer utilization",
      value: `${engineers.length}`,
      delta: "—",
      icon: Users,
      hint: "Live engineer records",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>

        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            className="border border-white/10 bg-white/5"
            onClick={refresh}
            disabled={loading}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </Button>
          <Button onClick={() => (window.location.href = "/work-orders")}>
            New work order
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <KpiCard key={k.title} {...k} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-white/10 bg-white/5 text-zinc-100 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Engineer workload</CardTitle>
            <CardDescription className="text-zinc-300">
              Live active-task counts per engineer.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadData} margin={{ left: 0, right: 8 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="tasks" radius={[8, 8, 0, 0]} fill="#2da093"/>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-zinc-100">
          <CardHeader>
            <CardTitle className="text-base">High risk devices</CardTitle>
            <CardDescription className="text-zinc-300">
              Devices that should be checked proactively.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {highRiskDevices.slice(0, 4).map((risk) => {
              const device = deviceById.get(risk.deviceId);
              return (
                <div
                  key={risk.deviceId}
                  className="rounded-xl border border-white/10 bg-[#FADBD4] p-3"
                >
                  <div className="text-sm font-medium">
                    {device?.name ?? risk.deviceId}
                  </div>
                  <div className="mt-1 text-xs text-zinc-300">
                    Risk score: {risk.score}
                  </div>
                  <div className="mt-1 text-xs text-zinc-400">
                    {risk.reasons[0] ?? "Needs attention."}
                  </div>
                </div>
              );
            })}

            {highRiskDevices.length === 0 && (
              <div className="text-sm text-zinc-300">No medium or high-risk devices right now.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/10 bg-white/5 text-zinc-100">
        <CardHeader>
          <CardTitle className="text-base">Upcoming maintenance</CardTitle>
          <CardDescription className="text-zinc-300">
            Live work orders from Firestore.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption className="text-zinc-100">
              Showing next {upcoming.length} tasks (live).
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Device</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Assigned engineer</TableHead>
                <TableHead>Due</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcoming.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.device}</TableCell>
                  <TableCell className="text-zinc-300">{row.dept}</TableCell>
                  <TableCell className="text-zinc-300">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {row.location}
                    </span>
                  </TableCell>
                  <TableCell className="text-zinc-300">{row.engineer}</TableCell>
                  <TableCell className="text-zinc-300">{row.due}</TableCell>
                  <TableCell className="text-right">
                    <StatusPill status={row.status} />
                  </TableCell>
                </TableRow>
              ))}

              {upcoming.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-zinc-100">
                    No upcoming work orders yet.
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

function KpiCard({
  title,
  value,
  delta,
  icon: Icon,
  hint,
}: {
  title: string;
  value: string;
  delta: string;
  icon: React.ComponentType<any>;
  hint: string;
}) {
  return (
    <Card className="border-white/10 bg-white/5 text-zinc-100">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-sm font-medium text-zinc-200">{title}</CardTitle>
          <CardDescription className="text-xs text-zinc-100">{hint}</CardDescription>
        </div>
        {/* <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/20 ring-1 ring-white/10">
          <Icon className="h-4.5 w-4.5" />
        </div> */}
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100">
          <Icon className="h-4.5 w-4.5 text-teal-700" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        <div className="mt-2 text-xs text-zinc-100">
          <span className="rounded-full bg-white/5 px-2 py-0.5 ring-1 ring-white/10">
            {delta}
          </span>
          <span className="ml-2">vs last period</span>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusPill({
  status,
}: {
  status: "Critical" | "Review" | "Due" | "Scheduled" | "In progress" | "Blocked" | "Open" | "Completed";
}) {
  const classes =
    status === "Critical"
      ? "bg-red-500/15 text-red-600 ring-red-500/30"
      : status === "Review"
      ? "bg-amber-500/15 text-amber-600 ring-amber-500/30"
      : status === "Due"
      ? "bg-purple-300/15 text-purple-700 ring-purple-500/30"
      : status === "In progress"
      ? "bg-sky-500/15 text-sky-600 ring-sky-500/30"
      : status === "Blocked"
      ? "bg-orange-500/15 text-orange-600 ring-orange-500/30"
      : status === "Open"
      ? "bg-zinc-500/15 text-zinc-600 ring-zinc-500/30"
      : "bg-emerald-500/15 text-emerald-600 ring-emerald-500/30";

  return (
    <span className={"inline-flex items-center rounded-full px-2 py-0.5 text-xs ring-1 " + classes}>
      {status}
    </span>
  );
}