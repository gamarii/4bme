import { Router } from "express";
import { db } from "../firebaseAdmin.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { taskId, action, selectedEngineerId, supervisorId, reason } = req.body;

    if (action === "override" && !reason) {
      return res.status(400).json({
        message: "Override reason is required.",
      });
    }

    const workOrderRef = db.collection("workOrders").doc(taskId);
    const workOrderSnap = await workOrderRef.get();

    if (!workOrderSnap.exists) {
      return res.status(404).json({ message: "Work order not found" });
    }

    let assignedEngineerName: string | null = null;

    if (selectedEngineerId) {
      const engineerSnap = await db.collection("engineers").doc(selectedEngineerId).get();
      if (engineerSnap.exists) {
        assignedEngineerName = (engineerSnap.data()?.name as string) ?? null;
      }
    }

    if (
      action === "approve" ||
      action === "select_alternative" ||
      action === "override"
    ) {
      await workOrderRef.update({
        assignedEngineerId: selectedEngineerId ?? null,
        assignedEngineerName,
        status: "Scheduled",
        assignedAt: new Date(),
        updatedAt: new Date(),
      });
    }

    if (action === "reject") {
      await workOrderRef.update({
        assignedEngineerId: null,
        assignedEngineerName: null,
        status: "Open",
        updatedAt: new Date(),
      });
    }

    const auditEntry = {
      taskId,
      action,
      selectedEngineerId: selectedEngineerId ?? null,
      selectedEngineerName: assignedEngineerName,
      supervisorId,
      reason: reason ?? null,
      timestamp: new Date(),
    };

    await db.collection("auditLogs").add(auditEntry);

    res.json({
      success: true,
      audit: auditEntry,
    });
  } catch (err: any) {
    res.status(500).json({
      message: err.message || "Server error",
    });
  }
});

router.get("/", async (_req, res) => {
  try {
    const snap = await db
      .collection("auditLogs")
      .orderBy("timestamp", "desc")
      .limit(100)
      .get();

    const rows = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(rows);
  } catch (err: any) {
    res.status(500).json({
      message: err.message || "Failed to load audit logs",
    });
  }
});

export default router;