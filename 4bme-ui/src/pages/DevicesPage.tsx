import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Device } from "@/types/device";
import { createDevice, listDevices } from "@/services/devices";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function DevicesPage() {
  const [rows, setRows] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");

  async function refresh() {
    setLoading(true);
    const data = await listDevices();
    setRows(data);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold">Devices</h2>
          <p className="text-sm text-zinc-100">Create and maintain your asset registry.</p>
        </div>
        <Button onClick={refresh} variant="secondary" className="border border-white/10 bg-white/5">
          Refresh
        </Button>
      </div>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-base text-zinc-100">Add device</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3 text-zinc-100">
          <div className="grid gap-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="border-white/10 bg-black/20" />
          </div>
          <div className="grid gap-2">
            <Label>Department</Label>
            <Input value={department} onChange={(e) => setDepartment(e.target.value)} className="border-white/10 bg-black/20" />
          </div>
          <div className="grid gap-2">
            <Label>Location</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} className="border-white/10 bg-black/20" />
          </div>

          <div className="md:col-span-3 flex justify-end">
            <Button
              onClick={async () => {
                if (!name || !department || !location) return;
                await createDevice({
                  name,
                  department,
                  location,
                  status: "Active",
                  criticality: "Medium",
                });
                setName("");
                setDepartment("");
                setLocation("");
                await refresh();
              }}
            >
              Create device
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-base text-zinc-100">All devices</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-zinc-100">Loading…</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criticality</TableHead>
                  <TableHead className="text-right">Open</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium text-zinc-300">{d.name}</TableCell>
                    <TableCell className="text-zinc-300">{d.department}</TableCell>
                    <TableCell className="text-zinc-300">{d.location}</TableCell>
                    <TableCell className="text-zinc-300">{d.status}</TableCell>
                    <TableCell className="text-zinc-300">{d.criticality}</TableCell>
                    <TableCell className="text-right">
                      <Link className="underline text-zinc-100" to={`/devices/${d.id}`}>
                        Details
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}