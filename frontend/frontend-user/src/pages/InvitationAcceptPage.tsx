import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { CheckCircle, Clock, XCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/modules/auth/store/authStore";
import { familyApi, type InvitationTokenInfo } from "@/modules/family/api/familyApi";

type PageState = "loading" | "valid" | "invalid" | "expired" | "accepting" | "success" | "error";

export function InvitationAcceptPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const user = useAuthStore((s) => s.user);
  const refreshFamily = useAuthStore((s) => s.refreshFamily);

  const [state, setState] = useState<PageState>("loading");
  const [invitationInfo, setInvitationInfo] = useState<InvitationTokenInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setState("invalid");
      setErrorMessage("Link mời không hợp lệ. Không tìm thấy mã token.");
      return;
    }

    familyApi
      .getInvitationByToken(token)
      .then((info) => {
        setInvitationInfo(info);
        setState("valid");
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "Lời mời không tồn tại hoặc đã hết hạn.";
        if (msg.toLowerCase().includes("hết hạn") || msg.toLowerCase().includes("expired")) {
          setState("expired");
        } else {
          setState("invalid");
        }
        setErrorMessage(msg);
      });
  }, [token]);

  async function handleAccept() {
    if (!user) {
      // Not logged in — redirect to login with a return-to parameter
      const returnTo = encodeURIComponent(`/invitations/accept?token=${token}`);
      navigate(`/login?returnTo=${returnTo}`);
      return;
    }

    setState("accepting");
    try {
      await familyApi.acceptInvitationByToken(token);
      await refreshFamily();
      setState("success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Không thể chấp nhận lời mời.";
      setErrorMessage(msg);
      setState("error");
      toast.error(msg);
    }
  }

  if (state === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8f6fb] px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#7655aa] border-t-transparent" />
          <p className="text-[#746d82]">Đang kiểm tra lời mời...</p>
        </div>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8f6fb] px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#4b3178]">Tham gia thành công!</h1>
          <p className="mt-2 text-[#746d82]">
            Bạn đã gia nhập gia đình <b>{invitationInfo?.familyName}</b> thành công.
          </p>
          <Button
            className="mt-6 w-full bg-[#7655aa] text-white"
            onClick={() => navigate("/dashboard")}
          >
            Đến trang chủ
          </Button>
        </div>
      </div>
    );
  }

  if (state === "expired") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8f6fb] px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <Clock className="h-10 w-10 text-amber-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#4b3178]">Lời mời đã hết hạn</h1>
          <p className="mt-2 text-[#746d82]">
            Link mời này đã hết hạn. Hãy liên hệ quản trị viên của gia đình để được gửi lại lời mời.
          </p>
          <Button
            variant="outline"
            className="mt-6 w-full"
            onClick={() => navigate(user ? "/dashboard" : "/login")}
          >
            {user ? "Về trang chủ" : "Đăng nhập"}
          </Button>
        </div>
      </div>
    );
  }

  if (state === "invalid" || state === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8f6fb] px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#4b3178]">Lời mời không hợp lệ</h1>
          <p className="mt-2 text-[#746d82]">{errorMessage || "Link mời này không tồn tại hoặc đã được sử dụng."}</p>
          <Button
            variant="outline"
            className="mt-6 w-full"
            onClick={() => navigate(user ? "/dashboard" : "/login")}
          >
            {user ? "Về trang chủ" : "Đăng nhập"}
          </Button>
        </div>
      </div>
    );
  }

  // state === "valid" or "accepting"
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8f6fb] px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#eee9f7]">
            <Users className="h-9 w-9 text-[#7655aa]" />
          </div>
          <div className="text-4xl font-extrabold text-[#4b3178]">NATEAT</div>
        </div>

        <div className="rounded-xl border border-[#eee9f7] bg-[#f8f6fb] p-5 text-center">
          <p className="text-sm text-[#746d82]">
            <b>{invitationInfo?.inviterName}</b> đã mời bạn tham gia gia đình
          </p>
          <h2 className="mt-1 text-xl font-extrabold text-[#4b3178]">{invitationInfo?.familyName}</h2>
          {invitationInfo?.expiresAt && (
            <p className="mt-2 text-xs text-[#9188a1]">
              Hết hạn: {new Date(invitationInfo.expiresAt).toLocaleDateString("vi-VN")}
            </p>
          )}
        </div>

        {invitationInfo?.invitedEmail && (
          <p className="mt-4 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800">
            ⚠️ Lời mời này dành cho <b>{invitationInfo.invitedEmail}</b>. Hãy đăng nhập bằng đúng email đó.
          </p>
        )}

        {user ? (
          <div className="mt-6 space-y-3">
            <p className="text-center text-sm text-[#746d82]">
              Bạn đang đăng nhập là <b>{user.email}</b>.
            </p>
            <Button
              className="w-full bg-[#7655aa] text-white"
              disabled={state === "accepting"}
              onClick={handleAccept}
              id="btn-accept-invitation"
            >
              {state === "accepting" ? "Đang xử lý..." : "Chấp nhận tham gia gia đình"}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/dashboard")}
            >
              Từ chối
            </Button>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            <p className="text-center text-sm text-[#746d82]">
              Hãy đăng nhập hoặc tạo tài khoản để chấp nhận lời mời này.
            </p>
            <Button
              className="w-full bg-[#7655aa] text-white"
              onClick={handleAccept}
              id="btn-login-to-accept"
            >
              Đăng nhập để chấp nhận
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                const returnTo = encodeURIComponent(`/invitations/accept?token=${token}`);
                navigate(`/register?returnTo=${returnTo}`);
              }}
              id="btn-register-to-accept"
            >
              Đăng ký tài khoản mới
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
