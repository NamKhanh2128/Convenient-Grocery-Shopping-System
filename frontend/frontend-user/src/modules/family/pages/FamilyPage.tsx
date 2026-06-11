import { Copy, Edit2, LogOut, MailPlus, MoreHorizontal, Plus, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppModal } from "@/shared/components/AppModal";
import { ScreenHeader } from "@/shared/components/ScreenHeader";
import { familyApi, type ReceivedFamilyInvitation, type SentFamilyInvitation } from "@/modules/family/api/familyApi";
import { useAuthStore } from "@/modules/auth/store/authStore";
import type { Family, FamilyActivity, User } from "@/types";
import { relativeTime } from "@/shared/utils/date";

type ModalName = "create" | "join" | "rename" | "invite" | null;

export function FamilyPage() {
  const user = useAuthStore((state) => state.user);
  const refreshFamily = useAuthStore((state) => state.refreshFamily);
  const [currentFamily, setCurrentFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [activities, setActivities] = useState<FamilyActivity[]>([]);
  const [sentInvitations, setSentInvitations] = useState<SentFamilyInvitation[]>([]);
  const [receivedInvitations, setReceivedInvitations] = useState<ReceivedFamilyInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalName>(null);
  const [openMemberMenu, setOpenMemberMenu] = useState<string | null>(null);
  const [familyName, setFamilyName] = useState("");
  const [familyCode, setFamilyCode] = useState("");
  const [email, setEmail] = useState("");

  async function reloadFamilyState() {
    await refreshFamily();
    await reload();
  }

  async function reload() {
    setLoading(true);
    try {
      const family = await familyApi.me();
      const received = await familyApi.receivedInvitations().catch(() => []);
      setReceivedInvitations(received);
      setCurrentFamily(family);
      setFamilyName(family?.family_name ?? "");

      if (!family) {
        setMembers([]);
        setActivities([]);
        setSentInvitations([]);
        return;
      }

      const [detail, sent] = await Promise.all([familyApi.detail(family.family_id), familyApi.sentInvitations()]);
      setCurrentFamily(detail.family);
      setFamilyName(detail.family.family_name);
      setMembers(detail.members);
      setActivities(detail.activities);
      setSentInvitations(sent);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload().catch((err) => toast.error(err instanceof Error ? err.message : "Không thể tải nhóm gia đình."));
  }, []);

  async function createFamily() {
    try {
      const nextName = familyName.trim();
      if (!nextName) {
        toast.error("Tên gia đình không được để trống.");
        return;
      }

      await familyApi.createFamily(nextName, user?.user_id);
      await refreshFamily();
      await reload();
      setModal(null);
      toast.success("Đã tạo gia đình mới.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể tạo gia đình.");
    }
  }

  async function joinFamily() {
    try {
      const nextCode = familyCode.trim().toUpperCase();
      if (!nextCode) {
        toast.error("Mã gia đình không được để trống.");
        return;
      }

      await familyApi.joinFamilyById(nextCode, user?.user_id);
      await refreshFamily();
      await reload();
      setFamilyCode("");
      setModal(null);
      toast.success("Đã tham gia gia đình.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể tham gia gia đình.");
    }
  }

  async function renameFamily() {
    try {
      if (!currentFamily) return;
      const nextName = familyName.trim();
      if (!nextName) {
        toast.error("Tên gia đình không được để trống.");
        return;
      }

      await familyApi.rename(currentFamily.family_id, nextName);
      await refreshFamily();
      await reload();
      setModal(null);
      toast.success("Đã đổi tên gia đình.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể đổi tên gia đình.");
    }
  }

  async function addMember() {
    try {
      if (!currentFamily) return;
      const nextEmail = email.trim();
      if (!nextEmail) {
        toast.error("Email thành viên không được để trống.");
        return;
      }

      await familyApi.inviteByEmail(nextEmail);
      await reload();
      setEmail("");
      setModal(null);
      toast.success("Đã gửi lời mời tham gia gia đình qua email.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Không thể gửi lời mời.";
      if (msg.includes("already_invited") || msg.toLowerCase().includes("đã có lời mời")) {
        toast.error("Đã có lời mời đang chờ cho email này. Bạn có thể gửi lại từ danh sách bên dưới.");
      } else if (msg.includes("already_member") || msg.toLowerCase().includes("đã là thành viên")) {
        toast.error("Email này đã là thành viên của gia đình.");
      } else {
        toast.error(msg);
      }
    }
  }

  async function removeMember(memberId: string) {
    try {
      if (!currentFamily) return;
      const confirmed = window.confirm("Bạn có chắc muốn xóa thành viên này khỏi gia đình không?");
      if (!confirmed) return;
      await familyApi.removeMember(currentFamily.family_id, memberId);
      setOpenMemberMenu(null);
      await reloadFamilyState();
      toast.success("Đã tách thành viên khỏi gia đình.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể xóa thành viên.");
    }
  }

  async function leaveFamily() {
    const confirmed = window.confirm("Bạn có chắc muốn rời gia đình không?");
    if (!confirmed) return;

    try {
      await familyApi.leaveFamily();
      setOpenMemberMenu(null);
      await reloadFamilyState();
      toast.success("Đã rời gia đình.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể rời gia đình.");
    }
  }

  async function acceptInvitation(invitationId: number | string) {
    try {
      await familyApi.acceptInvitation(invitationId);
      await refreshFamily();
      await reload();
      toast.success("Đã chấp nhận lời mời.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể chấp nhận lời mời.");
    }
  }

  async function rejectInvitation(invitationId: number | string) {
    try {
      await familyApi.rejectInvitation(invitationId);
      await reload();
      toast.success("Đã từ chối lời mời.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể từ chối lời mời.");
    }
  }

  async function copyFamilyCode() {
    if (!currentFamily?.family_code) return;
    await navigator.clipboard.writeText(currentFamily.family_code);
    toast.success("Đã copy mã gia đình.");
  }

  function openCreateModal() {
    setFamilyName("");
    setModal("create");
  }

  function openJoinModal() {
    setFamilyCode("");
    setModal("join");
  }

  const currentMember = members.find((member) => member.user_id === user?.user_id || member.email === user?.email);
  const isCurrentAdmin = currentMember?.role === "admin";

  async function transferAdmin(member: User) {
    const confirmed = window.confirm(
      "Bạn có chắc muốn nhường quyền quản trị cho thành viên này không?\nSau khi nhường, bạn sẽ trở thành thành viên thường."
    );
    if (!confirmed) return;

    try {
      await familyApi.transferAdmin(member.user_id);
      setOpenMemberMenu(null);
      await reloadFamilyState();
      toast.success("Đã nhường quyền quản trị.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể nhường quyền quản trị.");
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-[420px] place-items-center rounded-[8px] bg-white text-sm text-[#746d82] shadow-card">
        Đang tải nhóm gia đình...
      </div>
    );
  }

  if (!currentFamily) {
    return (
      <>
        <section className="grid min-h-[520px] place-items-center rounded-[8px] bg-white px-6 text-center shadow-card">
          <div className="max-w-xl">
            <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-[#eee9f7] text-[#7655aa]">
              <Users className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-extrabold text-[#4b3178]">Bạn chưa tham gia gia đình nào</h1>
            {receivedInvitations.length > 0 && (
              <div className="mt-5 space-y-3 rounded-[8px] border bg-[#f8f6fb] p-4 text-left">
                <h2 className="font-extrabold text-[#4b3178]">Bạn có lời mời tham gia gia đình</h2>
                {receivedInvitations.map((invitation) => (
                  <div key={invitation.id} className="rounded-[8px] bg-white p-3 shadow-sm">
                    <p className="text-sm">
                      <b>Gia đình:</b> {invitation.familyName}
                    </p>
                    <p className="text-xs text-[#746d82]">
                      Người mời: {invitation.inviterName} · Mã: {invitation.familyCode}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button className="bg-[#ffb11f] text-[#4b3178]" onClick={() => acceptInvitation(invitation.id)}>
                        Chấp nhận
                      </Button>
                      <Button variant="outline" onClick={() => rejectInvitation(invitation.id)}>
                        Từ chối
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-3 text-sm leading-6 text-[#746d82]">
              Hãy tạo một gia đình mới hoặc tham gia gia đình của người khác bằng mã mời.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button className="bg-[#ffb11f] text-[#4b3178]" onClick={openCreateModal}>
                <Plus className="mr-2 h-4 w-4" />
                Tạo gia đình mới
              </Button>
              <Button variant="outline" onClick={openJoinModal}>
                Tham gia bằng mã
              </Button>
            </div>
          </div>
        </section>

        <AppModal open={modal === "create"} onOpenChange={(open) => setModal(open ? "create" : null)} type="confirm" title="Tạo gia đình mới" primaryLabel="Tạo gia đình" secondaryLabel="Đóng" onPrimary={createFamily}>
          <Input value={familyName} onChange={(event) => setFamilyName(event.target.value)} placeholder="Tên gia đình" />
        </AppModal>
        <AppModal open={modal === "join"} onOpenChange={(open) => setModal(open ? "join" : null)} type="confirm" title="Tham gia bằng mã" primaryLabel="Tham gia" secondaryLabel="Đóng" onPrimary={joinFamily}>
          <Input value={familyCode} onChange={(event) => setFamilyCode(event.target.value.toUpperCase())} placeholder="Ví dụ: FAM-8K2Q" />
        </AppModal>
      </>
    );
  }

  return (
    <>
      <ScreenHeader
        title="Nhóm gia đình"
        subtitle={`Tên gia đình: ${currentFamily.family_name}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setModal("rename")}>
              <Edit2 className="mr-2 h-4 w-4" />
              Đổi tên
            </Button>
            <Button variant="outline" onClick={copyFamilyCode} disabled={!currentFamily.family_code}>
              <Copy className="mr-2 h-4 w-4" />
              Copy mã
            </Button>
            <Button className="bg-[#ffb11f] text-[#4b3178]" onClick={() => setModal("invite")}>
              <MailPlus className="mr-2 h-4 w-4" />
              Mời thành viên
            </Button>
          </div>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          <div className="rounded-[8px] bg-white p-5 shadow-card">
            <p className="text-xs font-bold uppercase text-[#9188a1]">Mã gia đình</p>
            <div className="mt-2 flex items-center justify-between gap-3 rounded-[8px] border bg-[#f8f6fb] p-3">
              <span className="font-mono text-lg font-extrabold text-[#4b3178]">{currentFamily.family_code ?? "Chưa có mã"}</span>
              <Button variant="outline" size="icon" onClick={copyFamilyCode} disabled={!currentFamily.family_code} aria-label="Copy mã gia đình">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="rounded-[8px] bg-white p-5 shadow-card">
            <h3 className="mb-4 flex items-center gap-2 font-extrabold">
              <Users className="h-5 w-5" />
              Danh sách thành viên
            </h3>
            {members.length === 0 ? (
              <p className="py-4 text-center text-sm text-[#9188a1]">Chưa có thành viên nào.</p>
            ) : (
              <div className="space-y-2">
                {members.map((member) => {
                  const isSelf = member.user_id === user?.user_id || member.email === user?.email;
                  const isAdmin = member.role === "admin";
                  const canRemove = Boolean(isCurrentAdmin && !isSelf);
                  const canTransferAdmin = Boolean(isCurrentAdmin && !isSelf && member.role === "member");
                  const canLeave = isSelf;
                  const hasActions = canTransferAdmin || canRemove || canLeave;
                  const isMenuOpen = openMemberMenu === member.user_id;

                  return (
                  <div key={member.user_id} className="rounded-[8px] bg-[#f8f6fb] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <b className="block truncate">{member.full_name}</b>
                        <p className="truncate text-xs text-[#746d82]">{member.email}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="rounded-full bg-[#eee9f7] px-2 py-1 text-xs font-bold text-[#7655aa]">
                          {isAdmin ? "Quản trị" : "Thành viên"}
                        </span>
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setOpenMemberMenu(isMenuOpen ? null : member.user_id)}
                            aria-label="Mở menu thành viên"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                          {isMenuOpen && (
                            <div className="absolute right-0 top-9 z-20 min-w-[190px] rounded-[8px] border bg-white p-1 text-sm shadow-lg">
                              {hasActions ? (
                                <>
                                  {canTransferAdmin && (
                                    <button
                                      type="button"
                                      className="block w-full rounded-[6px] px-3 py-2 text-left font-semibold text-[#4b3178] hover:bg-[#f8f6fb]"
                                      onClick={() => transferAdmin(member)}
                                    >
                                      Nhường quyền quản trị
                                    </button>
                                  )}
                                  {canRemove && (
                                    <button
                                      type="button"
                                      className="block w-full rounded-[6px] px-3 py-2 text-left font-semibold text-red-600 hover:bg-red-50"
                                      onClick={() => removeMember(member.user_id)}
                                    >
                                      Xóa khỏi gia đình
                                    </button>
                                  )}
                                  {canLeave && (
                                    <button
                                      type="button"
                                      className="flex w-full items-center rounded-[6px] px-3 py-2 text-left font-semibold text-red-600 hover:bg-red-50"
                                      onClick={leaveFamily}
                                    >
                                      <LogOut className="mr-2 h-4 w-4" />
                                      Rời gia đình
                                    </button>
                                  )}
                                </>
                              ) : (
                                <div className="px-3 py-2 text-[#9188a1]">Không có hành động</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>

          {sentInvitations.length > 0 && (
            <div className="rounded-[8px] bg-white p-5 shadow-card">
              <h3 className="mb-4 font-extrabold">Lời mời đang chờ</h3>
              <div className="space-y-2">
                {sentInvitations.map((invitation) => (
                  <div key={invitation.id} className="rounded-[8px] bg-[#f8f6fb] p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <b className="block truncate">{invitation.fullName ?? invitation.email}</b>
                        <p className="truncate text-xs text-[#746d82]">{invitation.invitedEmail ?? invitation.email}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${
                            invitation.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                            invitation.status === 'accepted' ? 'bg-green-100 text-green-700' :
                            invitation.status === 'expired' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {invitation.status === 'pending' ? 'Đang chờ' :
                             invitation.status === 'accepted' ? 'Đã chấp nhận' :
                             invitation.status === 'expired' ? 'Hết hạn' :
                             invitation.status === 'cancelled' ? 'Đã hủy' :
                             invitation.status}
                          </span>
                          {invitation.expiresAt && invitation.status === 'pending' && (
                            <span className="text-xs text-[#9188a1]">
                              Hết hạn: {new Date(invitation.expiresAt).toLocaleDateString("vi-VN")}
                            </span>
                          )}
                        </div>
                      </div>
                      {isCurrentAdmin && invitation.status === 'pending' && (
                        <div className="flex shrink-0 gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs"
                            onClick={async () => {
                              try {
                                await familyApi.resendInvitation(invitation.id);
                                toast.success("Đã gửi lại lời mời.");
                                await reload();
                              } catch (err) {
                                toast.error(err instanceof Error ? err.message : "Không thể gửi lại.");
                              }
                            }}
                          >
                            Gửi lại
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs text-red-600 hover:bg-red-50"
                            onClick={async () => {
                              const confirmed = window.confirm("Bạn có chắc muốn hủy lời mời này không?");
                              if (!confirmed) return;
                              try {
                                await familyApi.cancelInvitation(invitation.id);
                                toast.success("Đã hủy lời mời.");
                                await reload();
                              } catch (err) {
                                toast.error(err instanceof Error ? err.message : "Không thể hủy.");
                              }
                            }}
                          >
                            Hủy
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-[8px] bg-white p-5 shadow-card">
          <h3 className="font-extrabold">Hoạt động gia đình</h3>
          <div className="mt-4 space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="rounded-[8px] border p-3">
                <b>{members.find((item) => item.user_id === activity.user_id)?.full_name ?? "Thành viên"}</b>
                <p className="text-sm">{activity.message}</p>
                <p className="text-xs text-[#9188a1]">{relativeTime(activity.created_at)}</p>
              </div>
            ))}
          </div>
          {activities.length === 0 && <p className="mt-4 text-sm text-[#746d82]">Chưa có hoạt động gia đình từ backend.</p>}
        </div>
      </section>

      <AppModal open={modal === "rename"} onOpenChange={(open) => setModal(open ? "rename" : null)} type="confirm" title="Đổi tên gia đình" primaryLabel="Lưu" secondaryLabel="Đóng" onPrimary={renameFamily}>
        <Input value={familyName} onChange={(event) => setFamilyName(event.target.value)} placeholder="Tên gia đình" />
      </AppModal>
      <AppModal open={modal === "invite"} onOpenChange={(open) => setModal(open ? "invite" : null)} type="confirm" title="Mời thành viên" primaryLabel="Thêm" secondaryLabel="Đóng" onPrimary={addMember}>
        <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email thành viên" />
      </AppModal>
    </>
  );
}
