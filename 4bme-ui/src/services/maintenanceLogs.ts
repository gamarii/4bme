import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "@/firebase/firebase";
import type { MaintenanceLog } from "@/types/maintenanceLog";

const colRef = collection(db, "maintenanceLogs");

export async function addMaintenanceLog(
  input: Omit<MaintenanceLog, "id" | "timestamp">
) {
  const ref = doc(colRef);
  await setDoc(ref, {
    ...input,
    timestamp: serverTimestamp(),
  });
  return ref.id;
}

export async function listMaintenanceLogs(): Promise<MaintenanceLog[]> {
  const q = query(colRef, orderBy("timestamp", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MaintenanceLog, "id">) }));
}

export async function listLogsByDevice(deviceId: string): Promise<MaintenanceLog[]> {
  const q = query(colRef, where("deviceId", "==", deviceId), orderBy("timestamp", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MaintenanceLog, "id">) }));
}

export async function listLogsByWorkOrder(workOrderId: string): Promise<MaintenanceLog[]> {
  const q = query(colRef, where("workOrderId", "==", workOrderId), orderBy("timestamp", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MaintenanceLog, "id">) }));
}