import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/firebase/firebase";
import type { PartsRequest, PartsStatus } from "@/types/partsRequest";

const colRef = collection(db, "partsRequests");

export async function createPartsRequest(input: Omit<PartsRequest, "id" | "updatedAt">) {
  const ref = doc(colRef);
  await setDoc(ref, { ...input, updatedAt: serverTimestamp() });
  return ref.id;
}

export async function updatePartsStatus(id: string, status: PartsStatus) {
  const ref = doc(db, "partsRequests", id);
  await updateDoc(ref, { status, updatedAt: serverTimestamp() });
}

export async function listPartsByWorkOrder(workOrderId: string): Promise<PartsRequest[]> {
  const q = query(colRef, where("workOrderId", "==", workOrderId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PartsRequest, "id">) }));
}