import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Home, Users } from "lucide-react";
import { useAuthStore } from "@/modules/auth/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { familyApi } from "@/modules/family/api/familyApi";

type Step = "choose" | "create" | "join";

export function OnboardingPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user)!;
  const [step, setStep] = useState<Step>("choose");
  const [familyName, setFamilyName] = useState("");
  const [familyId, setFamilyId] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!familyName.trim()) { toast.error("Vui lòng nhập tên gia đình."); return; }
    setLoading(true);
    try {
      await familyApi.createFamily(familyName.trim(), user.user_id);
      toast.success("Đã tạo gia đình thành công!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể tạo gia đình.");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (!familyId.trim()) { toast.error("Vui lòng nhập ID gia đình."); return; }
    setLoading(true);
    try {
      await familyApi.joinFamilyById(familyId.trim(), user.user_id);
      toast.success("Đã tham gia gia đình thành công!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể tham gia gia đình.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#66429c] px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mb-2 text-4xl font-extrabold text-white">NATEAT</div>
          <div className="text-lg font-semibold text-white/80">Chào mừng, {user.full_name}!</div>
          <div className="mt-1 text-sm text-white/60">Để bắt đầu, hãy tạo hoặc tham gia một gia đình.</div>
        </div>

        {step === "choose" && (
          <div className="grid gap-4">
            <button
              onClick={() => setStep("create")}
              className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-lg transition hover:scale-[1.02] hover:shadow-xl"
            >
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-[#eee9f7]">
                <Home className="h-7 w-7 text-[#7655aa]" />
              </div>
              <div className="text-left">
                <div className="text-base font-extrabold text-[#3b2868]">Tạo gia đình mới</div>
                <div className="text-sm text-[#746d82]">Bắt đầu một gia đình mới và mời các thành viên.</div>
              </div>
            </button>

            <button
              onClick={() => setStep("join")}
              className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-lg transition hover:scale-[1.02] hover:shadow-xl"
            >
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-[#fff3d0]">
                <Users className="h-7 w-7 text-[#ffb11f]" />
              </div>
              <div className="text-left">
                <div className="text-base font-extrabold text-[#3b2868]">Tham gia gia đình</div>
                <div className="text-sm text-[#746d82]">Nhập ID gia đình được chia sẻ để tham gia.</div>
              </div>
            </button>
          </div>
        )}

        {step === "create" && (
          <div className="rounded-2xl bg-white p-6 shadow-lg space-y-4">
            <h2 className="text-lg font-extrabold text-[#3b2868]">Tạo gia đình mới</h2>
            <Input
              placeholder="Tên gia đình (ví dụ: Gia đình Nguyễn)"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep("choose")}>Quay lại</Button>
              <Button disabled={loading} className="flex-1 bg-[#7655aa]" onClick={handleCreate}>
                {loading ? "Đang tạo..." : "Tạo gia đình"}
              </Button>
            </div>
          </div>
        )}

        {step === "join" && (
          <div className="rounded-2xl bg-white p-6 shadow-lg space-y-4">
            <h2 className="text-lg font-extrabold text-[#3b2868]">Tham gia gia đình</h2>
            <Input
              placeholder="ID gia đình (ví dụ: family-1)"
              value={familyId}
              onChange={(e) => setFamilyId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            />
            <p className="text-xs text-[#9188a1]">Yêu cầu thành viên trong gia đình chia sẻ ID để bạn có thể tham gia.</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep("choose")}>Quay lại</Button>
              <Button disabled={loading} className="flex-1 bg-[#ffb11f]" onClick={handleJoin}>
                {loading ? "Đang tham gia..." : "Tham gia"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
