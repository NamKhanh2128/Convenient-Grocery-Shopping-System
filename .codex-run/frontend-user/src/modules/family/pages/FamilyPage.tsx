import { Hash, MailPlus, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/modules/auth/store/authStore";
import { ScreenHeader } from "@/shared/components/ScreenHeader";
import { AppModal } from "@/shared/components/AppModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { familyApi } from "@/modules/family/api/familyApi";
import { shoppingApi, type ShoppingListDetail } from "@/modules/shopping/api/shoppingApi";
import type { FamilyActivity, User } from "@/types";
import { relativeTime } from "@/shared/utils/date";

export function FamilyPage() {
  const family = useAuthStore((state) => state.family)!;
  const user = useAuthStore((state) => state.user)!;
  const [members, setMembers] = useState<User[]>([]);
  const [activities, setActivities] = useState<FamilyActivity[]>([]);
  const [shoppingTasks, setShoppingTasks] = useState<ShoppingListDetail[]>([]);
  const [email, setEmail] = useState("");
  const [memberId, setMemberId] = useState("");
  const [addByIdOpen, setAddByIdOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [incomingOpen, setIncomingOpen] = useState(false);

  async function reload() {
    const [familyData, lists] = await Promise.all([familyApi.detail(family.family_id), shoppingApi.list(family.family_id)]);
    setMembers(familyData.members);
    setActivities(familyData.activities);
    setShoppingTasks(lists.filter((list) => list.status !== "DONE"));
  }

  useEffect(() => { void reload(); }, [family.family_id]);

  async function addMember() {
    await familyApi.addMember(family.family_id, email);
    setEmail("");
    toast.success("Đã gửi lời mời/thêm thành viên vào gia đình.");
    await reload();
  }

  async function addMemberById() {
    try {
      await familyApi.addMemberById(family.family_id, memberId.trim());
      setMemberId("");
      setAddByIdOpen(false);
      toast.success("Đã thêm thành viên vào gia đình.");
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể thêm thành viên.");
    }
  }

  async function respondTask(shoppingListId: string, status: "accepted" | "rejected") {
    await familyApi.respondShoppingTask(family.family_id, shoppingListId, user.user_id, status);
    toast.success(status === "accepted" ? "Đã nhận nhiệm vụ mua hàng." : "Đã từ chối nhiệm vụ mua hàng.");
    await reload();
  }

  async function reassignTask(shoppingListId: string, userId: string) {
    await familyApi.assignShoppingTask(family.family_id, shoppingListId, userId, user.user_id);
    toast.success("Đã phân công lại nhiệm vụ mua hàng.");
    await reload();
  }

  function getActivityStatusText(status?: string) {
    if (!status) return "đã xong";
    const statusMap: Record<string, string> = {
      done: "đã xong",
      accepted: "đã nhận",
      rejected: "đã từ chối",
      pending: "đang chờ",
    };
    return statusMap[status] ?? status;
  }

  return (
    <>
      <ScreenHeader
        title="Nhóm gia đình"
        subtitle={`${family.family_name}. Quản lý thành viên, mua sắm và hoạt động gia đình.`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setAddByIdOpen(true)}><Hash className="mr-2 h-4 w-4" />Thêm bằng mã</Button>
            <Button className="bg-[#ffb11f]" onClick={() => setInviteOpen(true)}><MailPlus className="mr-2 h-4 w-4" />Mời thành viên</Button>
          </div>
        }
      />
      <section className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <div className="space-y-6">
          <div className="rounded-[8px] bg-white p-5 shadow-card">
            <h3 className="mb-4 flex items-center gap-2 font-extrabold"><Users /> Thành viên</h3>
            {members.length === 0 ? (
              <p className="py-4 text-center text-sm text-[#9188a1]">Chưa có thành viên nào.</p>
            ) : (
              <div className="space-y-2">
                {members.map((member, index) => (
                  <div key={member.user_id} className="rounded-[8px] bg-[#f8f6fb] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <b>{member.full_name}</b>
                        <p className="text-xs text-[#746d82]">{member.email}</p>
                        <p className="mt-0.5 text-[10px] font-mono text-[#9188a1]">Mã: {member.user_id}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="rounded-full bg-[#eee9f7] px-2 py-1 text-xs font-bold text-[#7655aa]">{index === 0 ? "Quản trị" : "Thành viên"}</span>
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">Đã tham gia</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button variant="outline" className="mt-4 w-full" onClick={() => setIncomingOpen(true)}>Xem lời mời tham gia</Button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[8px] bg-white p-5 shadow-card">
            <h3 className="font-extrabold">Phân công mua hàng</h3>
            <div className="mt-4 space-y-3">
              {shoppingTasks.map((task) => (
                <div key={task.shopping_list_id} className="rounded-[8px] border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <b>{task.title}</b>
                      <p className="text-xs text-[#746d82]">{task.items.length} mặt hàng · Được giao: {members.find((member) => member.user_id === task.assigned_user_id)?.full_name ?? "Chưa phân công"}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={() => respondTask(task.shopping_list_id, "accepted")}>Nhận mua</Button>
                      <Button variant="outline" onClick={() => respondTask(task.shopping_list_id, "rejected")}>Từ chối</Button>
                      <Select value={task.assigned_user_id ?? ""} onValueChange={(value) => reassignTask(task.shopping_list_id, value)}>
                        <SelectTrigger className="w-44"><SelectValue placeholder="Chọn người nhận" /></SelectTrigger>
                        <SelectContent>{members.map((member) => <SelectItem key={member.user_id} value={member.user_id}>{member.full_name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
              {shoppingTasks.length === 0 && <p className="text-sm text-[#746d82]">Không có nhiệm vụ mua hàng đang mở.</p>}
            </div>
          </div>

          <div className="rounded-[8px] bg-white p-5 shadow-card">
            <h3 className="font-extrabold">Hoạt động gia đình</h3>
            <div className="mt-4 space-y-3">{activities.map((activity) => <div key={activity.id} className="rounded-[8px] border p-3"><b>{members.find((item) => item.user_id === activity.user_id)?.full_name ?? "Thành viên"}</b><p className="text-sm">{activity.message}</p><p className="text-xs text-[#9188a1]">{relativeTime(activity.created_at)} · {getActivityStatusText(activity.status)}</p></div>)}</div>
          </div>
        </div>
      </section>
      <AppModal open={inviteOpen} onOpenChange={setInviteOpen} type="confirm" title="Gửi lời mời" primaryLabel="Gửi lời mời" secondaryLabel="Đóng" onPrimary={addMember}>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Nhập email thành viên" />
      </AppModal>
      <AppModal open={addByIdOpen} onOpenChange={setAddByIdOpen} type="confirm" title="Thêm thành viên bằng mã" primaryLabel="Thêm" secondaryLabel="Đóng" onPrimary={addMemberById}>
        <div className="space-y-2">
          <p className="text-sm text-[#746d82]">Nhập mã người dùng của người bạn muốn thêm vào gia đình.</p>
          <Input value={memberId} onChange={(e) => setMemberId(e.target.value)} placeholder="Ví dụ: user-1, user-2" />
          <p className="text-xs text-[#9188a1]">Mã người dùng có thể xem trong hồ sơ thành viên.</p>
        </div>
      </AppModal>
      <AppModal open={incomingOpen} onOpenChange={setIncomingOpen} type="info" title="Lời mời tham gia gia đình" primaryLabel="Chấp nhận" secondaryLabel="Từ chối" onPrimary={() => toast.success("Đã chấp nhận lời mời.")}>
        Bạn có lời mời tham gia một nhóm gia đình.
      </AppModal>
    </>
  );
}
