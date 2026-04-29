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
import type { DeviceRiskSnapshot } from "@/types/deviceRiskSnapshot";

const colRef = collection(db, "deviceRiskSnapshots");

export async function createDeviceRiskSnapshot(
  input: Omit<DeviceRiskSnapshot, "id" | "createdAt">
) {
  const ref = doc(colRef);
  await setDoc(ref, {
    ...input,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function listDeviceRiskSnapshots(deviceId: string): Promise<DeviceRiskSnapshot[]> {
  const q = query(
    colRef,
    where("deviceId", "==", deviceId),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<DeviceRiskSnapshot, "id">),
  }));
}