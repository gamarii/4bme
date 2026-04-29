import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchRecommendations, submitDecision } from "@/lib/api";
import type { RecommendationOption } from "@/types/recommendation";
import { useAuth } from "@/auth/AuthContext";
import { getWorkOrder } from "@/services/workOrders";
import { getDevice } from "@/services/devices";
import type { WorkOrder } from "@/types/workOrder";
import type { Device } from "@/types/device";

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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type PendingAction = {
  action: "approve" | "reject" | "override" | "select_alternative";
  engineerId?: string;
  engineerName?: string;
};

function buildDefaultSkills(device?: Device | null, workOrder?: WorkOrder | null) {
  const raw = [
    device?.name,
    device?.model,
    device?.department,
    device?.location,
    workOrder?.description,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const suggestions = [
    "ventilator",
    "icu",
    "calibration",
    "infusion pump",
    "defibrillator",
    "emergency",
    "battery",
    "ct scanner",
    "radiology",
    "imaging",
    "sterilizer",
    "cssd",
    "preventive maintenance",
  ];

  return suggestions.filter((s) => raw.includes(s.split(" ")[0]));
}

export default function AssignmentRecommendationsPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const taskIdFromUrl = searchParams.get("taskId") || "";
  const deviceIdFromUrl = searchParams.get("deviceId") || "";

  const [taskId, setTaskId] = useState(taskIdFromUrl);
  const [deviceName, setDeviceName] = useState("");
  const [deviceType, setDeviceType] = useState("");
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState("");

  const [recommended, setRecommended] = useState<RecommendationOption | null>(null);
  const [alternatives, setAlternatives] = useState<RecommendationOption[]>([]);
  const [selectedEngineerId, setSelectedEngineerId] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [successTitle, setSuccessTitle] = useState("Success");
  const [successDescription, setSuccessDescription] = useState("");

  useEffect(() => {
    async function hydrateFromQuery() {
      if (!taskIdFromUrl) return;

      const wo = await getWorkOrder(taskIdFromUrl);
      setWorkOrder(wo);
      if (wo) setTaskId(wo.id);

      const resolvedDeviceId = deviceIdFromUrl || wo?.deviceId;
      if (resolvedDeviceId) {
        const dev = await getDevice(resolvedDeviceId);

        setDeviceName(dev?.name ?? "");
        setDeviceType((dev?.model || dev?.name || "").toLowerCase());
        setLocation(dev?.department || dev?.location || "");

        const inferredSkills = buildDefaultSkills(dev, wo);
        setSkills(inferredSkills.join(", "));
      }
    }

    hydrateFromQuery();
  }, [taskIdFromUrl, deviceIdFromUrl]);

  const backLink = useMemo(() => {
    if (taskId) return `/work-orders/${taskId}`;
    return "/work-orders";
  }, [taskId]);

  async function getRecommendations() {
    try {
      setLoading(true);
      setMessage("");
      setSuccessDialogOpen(false);

      const result = await fetchRecommendations({
        taskId,
        deviceName,
        deviceType,
        location,
        urgency: "high",
        requiredSkills: skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });

      setRecommended(result.recommended);
      setAlternatives(result.alternatives);
    } catch (err: any) {
      setMessage(err.message || "Failed to generate recommendations.");
    } finally {
      setLoading(false);
    }
  }

  function openActionDialog(
    action: "approve" | "reject" | "override" | "select_alternative",
    engineerId?: string,
    engineerName?: string
  ) {
    setPendingAction({ action, engineerId, engineerName });
    setDialogOpen(true);
  }

  function clearRecommendationView() {
    setRecommended(null);
    setAlternatives([]);
    setPendingAction(null);
    setSelectedEngineerId("");
    setOverrideReason("");
  }

  function buildSuccessMessage(action: PendingAction["action"], engineerName?: string) {
    if (action === "approve") {
      return {
        title: "Recommendation approved",
        description: `${engineerName || "The recommended engineer"} has been assigned successfully.`,
      };
    }

    if (action === "reject") {
      return {
        title: "Recommendation rejected",
        description: "The current recommendation has been rejected successfully.",
      };
    }

    if (action === "select_alternative") {
      return {
        title: "Alternative selected",
        description: `${engineerName || "The selected engineer"} has been assigned successfully.`,
      };
    }

    return {
      title: "Override saved",
      description: "The assignment override was saved successfully.",
    };
  }

  async function confirmPendingAction() {
    if (!pendingAction) return;

    const actionToRun = pendingAction.action;
    const engineerIdToRun = pendingAction.engineerId;
    const engineerNameToRun = pendingAction.engineerName;
    const reasonToRun =
      actionToRun === "override" ? overrideReason.trim() : undefined;

    try {
      setMessage("");

      await submitDecision({
        taskId,
        action: actionToRun,
        selectedEngineerId: engineerIdToRun,
        supervisorId: user?.uid || "supervisor_demo",
        reason: reasonToRun,
      });

      const success = buildSuccessMessage(actionToRun, engineerNameToRun);

      setDialogOpen(false);
      clearRecommendationView();

      setSuccessTitle(success.title);
      setSuccessDescription(success.description);
      setSuccessDialogOpen(true);

      setMessage(`Action "${actionToRun}" saved successfully.`);
    } catch (err: any) {
      setMessage(err.message || "Action failed.");
    }
  }

  function getDialogText() {
    if (!pendingAction) {
      return {
        title: "Confirm action",
        description: "Are you sure?",
      };
    }

    if (pendingAction.action === "approve") {
      return {
        title: "Approve recommendation?",
        description: `This will assign ${
          pendingAction.engineerName || "the recommended engineer"
        } to this work order and remove the current recommendation from the screen.`,
      };
    }

    if (pendingAction.action === "reject") {
      return {
        title: "Reject recommendation?",
        description:
          "This will reject the current recommendation and remove it from the screen.",
      };
    }

    if (pendingAction.action === "select_alternative") {
      return {
        title: "Assign alternative engineer?",
        description: `This will assign ${
          pendingAction.engineerName || "the selected alternative engineer"
        } to this work order and remove the current recommendation from the screen.`,
      };
    }

    return {
      title: "Override recommendation?",
      description:
        "This will override the current recommendation, assign the entered engineer, and remove the recommendation from the screen.",
    };
  }

  const dialogText = getDialogText();

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">AI Recommendations</h2>
          <p className="mt-1 text-sm text-zinc-300">
            Recommend the best engineer, review alternatives, and keep supervisors in control.
          </p>
        </div>
        <Link to={backLink} className="text-sm underline text-zinc-100">
          Back to work order
        </Link>
      </div>

      <Card className="border-white/10 bg-white/5 text-zinc-100">
        <CardHeader>
          <CardTitle>Recommendation Request</CardTitle>
          <CardDescription className="text-zinc-300">
            {workOrder
              ? "Loaded from the selected work order."
              : "Enter task details to generate engineer recommendations."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label>Task ID</Label>
            <Input value={taskId} onChange={(e) => setTaskId(e.target.value)} />
          </div>

          <div className="grid gap-2">
            <Label>Device Name</Label>
            <Input value={deviceName} onChange={(e) => setDeviceName(e.target.value)} />
          </div>

          <div className="grid gap-2">
            <Label>Device Type</Label>
            <Input value={deviceType} onChange={(e) => setDeviceType(e.target.value)} />
          </div>

          <div className="grid gap-2">
            <Label>Location / Department</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>

          <div className="grid gap-2 md:col-span-2">
            <Label>Required Skills (comma separated)</Label>
            <Input value={skills} onChange={(e) => setSkills(e.target.value)} />
          </div>

          <div className="md:col-span-2">
            <Button onClick={getRecommendations} disabled={loading || !taskId}>
              {loading ? "Generating..." : "Generate Recommendation"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {recommended && (
        <Card className="border-white/10 bg-white/5 text-zinc-100">
          <CardHeader>
            <CardTitle>Main Recommendation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-lg font-semibold">{recommended.engineerName}</div>
            <div className="text-sm text-zinc-300">Score: {recommended.totalScore}</div>
            <div className="text-sm text-zinc-300">
              Skill Match: {recommended.breakdown.skillMatch} | Workload:{" "}
              {recommended.breakdown.workload} | Proximity: {recommended.breakdown.proximity}
            </div>
            <div className="text-sm text-zinc-300">{recommended.explanation}</div>

            <div className="flex gap-2">
              <Button
                onClick={() =>
                  openActionDialog(
                    "approve",
                    recommended.engineerId,
                    recommended.engineerName
                  )
                }
              >
                Approve
              </Button>
              <Button
                variant="secondary"
                className="border border-white/10 bg-white/5"
                onClick={() =>
                  openActionDialog(
                    "reject",
                    recommended.engineerId,
                    recommended.engineerName
                  )
                }
              >
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {alternatives.length > 0 && (
        <Card className="border-white/10 bg-white/5 text-zinc-100">
          <CardHeader>
            <CardTitle>Alternative Engineers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alternatives.map((alt) => (
              <div key={alt.engineerId} className="rounded-xl border border-white/10 p-3">
                <div className="font-medium">{alt.engineerName}</div>
                <div className="text-sm text-zinc-300">Score: {alt.totalScore}</div>
                <div className="text-xs text-zinc-300">{alt.explanation}</div>
                <Button
                  className="mt-2"
                  variant="secondary"
                  onClick={() =>
                    openActionDialog(
                      "select_alternative",
                      alt.engineerId,
                      alt.engineerName
                    )
                  }
                >
                  Select This Engineer
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="border-white/10 bg-white/5 text-zinc-100">
        <CardHeader>
          <CardTitle>Override Assignment</CardTitle>
          <CardDescription className="text-zinc-300">
            Assign a different engineer with a required reason.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2">
            <Label>Engineer ID</Label>
            <Input
              value={selectedEngineerId}
              onChange={(e) => setSelectedEngineerId(e.target.value)}
              placeholder="e.g. eng_4"
            />
          </div>

          <div className="grid gap-2">
            <Label>Override Reason</Label>
            <Input
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="Why are you overriding the AI recommendation?"
            />
          </div>

          <Button onClick={() => openActionDialog("override", selectedEngineerId)}>
            Override Assignment
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent className="border-white/10 bg-zinc-950 text-zinc-100">
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogText.title}</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-300">
              {dialogText.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-white text-black hover:bg-zinc-200"
              onClick={confirmPendingAction}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {successDialogOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6 text-zinc-100 shadow-2xl">
            <h3 className="text-lg font-semibold">{successTitle}</h3>
            <p className="mt-2 text-sm text-zinc-300">{successDescription}</p>

            <div className="mt-6 flex justify-end">
              <Button onClick={() => setSuccessDialogOpen(false)}>OK</Button>
            </div>
          </div>
        </div>
      )}

      {message && <div className="text-sm text-emerald-300">{message}</div>}
    </div>
  );
}