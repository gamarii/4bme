import { Link, useLocation } from "react-router-dom";
import {
  LayoutGrid,
  Wrench,
  ClipboardList,
  ShieldCheck,
  Users,
  CalendarClock,
  ScrollText,
  TriangleAlert,
} from "lucide-react";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutGrid },
  { to: "/devices", label: "Devices", icon: Wrench },
  { to: "/work-orders", label: "Work Orders", icon: ClipboardList },
  { to: "/recommendations", label: "Recommendations", icon: Users },
  { to: "/schedule", label: "Schedule", icon: CalendarClock },
  { to: "/predictive-alerts", label: "Predictive Alerts", icon: TriangleAlert },
  { to: "/audit-logs", label: "Audit Logs", icon: ScrollText }];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="hidden w-72 border-r border-white/10 bg-[#D2FFF5] p-4 lg:block">
      {/* <div className="text-lg font-bold tracking-tight">4BME</div> */}

    <div className="flex items-end gap-1 px-3">
  <span className="text-4xl font-bold leading-none text-teal-600">
    4
  </span>
  
  <div className="relative flex flex-col pb-1">
    <span className="text-2xl font-bold tracking-tight text-white uppercase">
      <span className="">B</span>me
    </span>
    {/* The Thin Accent Line */}
  {/* <div className="h-[2px] w-full bg-black" /> */}
  </div>
</div>
      <nav className="mt-8 grid gap-1">
        {nav.map((item) => {
          const active =
            item.to === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.to);

          const Icon = item.icon;

          return (
            <Link
              key={item.to}
              to={item.to}
              className={
                "flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition " +
                (active
                  ? "bg-white/10 font-bold text-white ring-1 ring-white/10"
                  : "text-zinc-300 font-semibold hover:bg-white/5")
              }
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}