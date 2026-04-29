

import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/firebase/firebase";
import type { WorkOrder, WorkOrderStatus } from "@/types/workOrder";

const colRef = collection(db, "workOrders");

export async function createWorkOrder(
  input: Omit<WorkOrder, "id" | "createdAt" | "updatedAt" | "completedAt">
) {
  const ref = doc(colRef);
  await setDoc(ref, {
    ...input,
    source: input.source ?? "Manual",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    completedAt: null,
  });
  return ref.id;
}

export async function updateWorkOrder(id: string, patch: Partial<WorkOrder>) {
  const ref = doc(db, "workOrders", id);
  await updateDoc(ref, { ...patch, updatedAt: serverTimestamp() });
}

export async function setWorkOrderStatus(id: string, status: WorkOrderStatus) {
  const ref = doc(db, "workOrders", id);
  const patch: any = { status, updatedAt: serverTimestamp() };
  if (status === "Completed") patch.completedAt = serverTimestamp();
  await updateDoc(ref, patch);
}

export async function getWorkOrder(id: string): Promise<WorkOrder | null> {
  const ref = doc(db, "workOrders", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<WorkOrder, "id">) };
}

export async function listWorkOrders(): Promise<WorkOrder[]> {
  const q = query(colRef, orderBy("updatedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<WorkOrder, "id">) }));
}

export async function listWorkOrdersByDevice(deviceId: string): Promise<WorkOrder[]> {
  const q = query(colRef, where("deviceId", "==", deviceId), orderBy("updatedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<WorkOrder, "id">) }));
}