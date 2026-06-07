import { Plus } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function SplashPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = window.setTimeout(() => navigate("/login", { replace: true }), 650);
    return () => window.clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="grid min-h-screen place-items-center bg-[#7655aa] text-white">
      <div className="text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#ffb11f] shadow-lg"><Plus className="h-9 w-9" /></div>
        <h1 className="mt-5 text-4xl font-extrabold tracking-wide">NATEAT</h1>
        <div className="mx-auto mt-5 h-2 w-48 overflow-hidden rounded-full bg-white/20">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-white" />
        </div>
        <p className="mt-4 text-sm text-white/75">Checking JWT token, refresh token and profile...</p>
      </div>
    </div>
  );
}
