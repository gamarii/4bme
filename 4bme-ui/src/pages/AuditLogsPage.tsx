import { useEffect, useState } from "react";
import { fetchAuditLogs } from "@/lib/api";
import type { AuditLogEntry } from "@/types/audit";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatTimestamp(value: AuditLogEntry["timestamp"]) {
  if (!value) return "-";

  if (typeof value === "string") return new Date(value).toLocaleString();
  if (value instanceof Date) return value.toLocaleString();
  if (typeof value === "object" && "_seconds" in value && value._seconds) {
    return new Date(value._seconds * 1000).toLocaleString();
  }
  return "-";
}

export default function AuditLogsPage() {
  const [rows, setRows] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function refresh() {
    try {
      setLoading(true);
      setError("");
      const data = await fetchAuditLogs();
      setRows(data);
    } catch (err: any) {
      setError(err.message || "Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold">Audit Logs</h2>
          <p className="text-sm text-zinc-300">
            Review approvals, overrides, schedule confirmations, and predictive actions.
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

      <Card className="border-white/10 bg-white/5 text-zinc-100">
        <CardHeader>
          <CardTitle>Recent actions</CardTitle>
          <CardDescription className="text-zinc-300">
            Latest 100 supervisor decision events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-zinc-300">Loading…</div>
          ) : error ? (
            <div className="text-sm text-red-300">{error}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Engineer</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Supervisor</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-zinc-100">{row.taskId}</TableCell>
                    <TableCell className="text-zinc-300">{row.action}</TableCell>
                    <TableCell className="text-zinc-300">
                      {row.selectedEngineerName || row.selectedEngineerId || "-"}
                    </TableCell>
                    <TableCell className="text-zinc-300">{row.reason || "-"}</TableCell>
                    <TableCell className="text-zinc-300">{row.supervisorId || "-"}</TableCell>
                    <TableCell className="text-zinc-300">
                      {formatTimestamp(row.timestamp)}
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-zinc-300">
                      No audit logs yet.
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