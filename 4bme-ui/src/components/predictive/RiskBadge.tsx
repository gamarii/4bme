import type { DeviceRiskLevel } from "@/types/deviceRisk";

export default function RiskBadge({ level }: { level: DeviceRiskLevel }) {
  const classes =
    level === "High"
      ? "bg-red-500/15 text-red-700 ring-red-500/30"
      : level === "Medium"
      ? "bg-amber-300/15 text-amber-600 ring-amber-500/30"
      : "bg-emerald-300/15 text-emerald-600 ring-emerald-500/30";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ring-1 ${classes}`}
    >
      {level}
    </span>
  );
}