import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAdminAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabaseClient";

export function OAuthCallbackPage() {
  const navigate = useNavigate();
  const loginWithGoogle = useAdminAuthStore((state) => state.loginWithGoogle);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        const accessToken = data.session?.access_token;
        if (error || !accessToken) {
          throw new Error(error?.message || "Không tìm thấy phiên đăng nhập Google.");
        }

        await loginWithGoogle(accessToken);
        await supabase.auth.signOut();
        toast.success("Đăng nhập bằng Google thành công");
        navigate("/dashboard", { replace: true });
      } catch (error) {
        await supabase.auth.signOut();
        const message = error instanceof Error ? error.message : "Đăng nhập bằng Google thất bại.";
        toast.error(message);
        navigate("/login", { replace: true });
      }
    })();
  }, [loginWithGoogle, navigate]);

  return (
    <div className="grid min-h-screen place-items-center bg-[#7655aa]">
      <div className="rounded-[8px] bg-white px-8 py-6 text-sm font-semibold text-[#5b368d] shadow-card">
        Đang xử lý đăng nhập Google...
      </div>
    </div>
  );
}
