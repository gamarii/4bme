import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/firebase";

const colRef = collection(db, "auditLogs");

export async function createAuditLog(entry: {
  taskId: string;
  action: string;
  selectedEngineerId?: string | null;
  selectedEngineerName?: string | null;
  supervisorId?: string | null;
  reason?: string | null;
  deviceId?: string | null;
}) {
  await addDoc(colRef, {
    ...entry,
    timestamp: serverTimestamp(),
  });
}