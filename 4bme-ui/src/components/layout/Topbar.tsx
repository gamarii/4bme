import { Bell, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { Button } from "@/components/ui/button";

export default function Topbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="border-b border-white/10 bg-zinc-950/70 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Overview</div>
          <div className="text-xs text-zinc-100">Welcome, {user?.name}</div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => {
              signOut();
              navigate("/login");
            }}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}