import { useEffect, useState, useMemo, useCallback } from "react";
import { Eye, Trash2, ShieldAlert, Users } from "lucide-react";
import { toast } from "sonner";
import { adminFamilyApi, type FamilyWithMembers } from "@/api/adminFamilyApi";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";

export function FamilyListPage() {
  // States
  const [families, setFamilies] = useState<FamilyWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Dialog States
  const [viewTarget, setViewTarget] = useState<FamilyWithMembers | null>(null);
  const [viewMembers, setViewMembers] = useState<FamilyWithMembers["members"]>([]);
  const [viewMembersLoading, setViewMembersLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FamilyWithMembers | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Load Data
  const loadFamilies = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFamilyApi.list();
      setFamilies(data);
    } catch (error) {
      toast.error("Không thể tải danh sách nhóm gia đình.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFamilies();
  }, [loadFamilies]);

  // Reset pagination when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Filtered & Paginated Data
  const filteredFamilies = useMemo(() => {
    return families.filter((f) => {
      const matchesSearch =
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(f.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.creator_name && f.creator_name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesSearch;
    });
  }, [families, searchQuery]);

  const paginatedFamilies = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredFamilies.slice(start, start + pageSize);
  }, [filteredFamilies, currentPage, pageSize]);

  // Delete family group
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await adminFamilyApi.delete(deleteTarget.id);
      toast.success(`Đã xóa nhóm gia đình "${deleteTarget.name}" thành công!`);
      setDeleteTarget(null);
      await loadFamilies();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Đã xảy ra lỗi khi xóa.";
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewMembers = async (family: FamilyWithMembers) => {
    setViewTarget(family);
    setViewMembersLoading(true);
    setViewMembers([]);
    try {
      const members = await adminFamilyApi.getMembers(family.id);
      setViewMembers(members);
    } catch {
      toast.error("Không thể tải danh sách thành viên.");
    } finally {
      setViewMembersLoading(false);
    }
  };

  // Column definitions for the families list
  const columns: Column<FamilyWithMembers>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Tên nhóm gia đình",
        sortable: true,
        render: (row) => (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#eee9f7] border border-primary/20 text-primary flex items-center justify-center font-bold">
              <Users className="h-5 w-5 text-[#7655aa]" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-foreground">
                {row.name}
              </div>
              <div className="text-xs text-muted-foreground">ID: {row.id}</div>
            </div>
          </div>
        ),
      },
      {
        key: "creator_name",
        header: "Người tạo nhóm / Đại diện",
        sortable: true,
        render: (row) => (
          <span className="font-semibold text-xs text-foreground/80">
            {row.creator_name ?? "—"}
          </span>
        ),
      },
      {
        key: "members_count",
        header: "Số lượng thành viên",
        sortable: true,
        render: (row) => (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#eee9f7] text-[#7655aa] border border-[#7655aa]/20">
            {row.member_count ?? row.members?.length ?? 0} thành viên
          </span>
        ),
      },
      {
        key: "actions",
        header: "Thao tác",
        render: (row) => (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-blue-600 hover:bg-blue-500/15"
              onClick={() => handleViewMembers(row)}
              title="Xem danh sách thành viên"
            >
              <Eye className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:bg-destructive/15"
              onClick={() => setDeleteTarget(row)}
              title="Xóa nhóm gia đình"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [handleViewMembers]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản Lý Nhóm Gia Đình"
        description="Quản lý thông tin, thành viên và các dữ liệu liên quan của các nhóm gia đình trên hệ thống."
      />

      {/* Control Panel */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Tìm kiếm theo tên nhóm gia đình, ID hoặc tên người đại diện..."
          className="flex-1"
        />
      </div>

      {/* Data Table */}
      <div className="relative">
        <DataTable
          data={paginatedFamilies}
          columns={columns}
          getRowId={(row) => String(row.id)}
          loading={loading}
          emptyMessage="Không tìm thấy nhóm gia đình nào phù hợp với bộ lọc."
        />

        <Pagination
          total={filteredFamilies.length}
          page={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Dialog: View Members */}
      <Dialog
        open={Boolean(viewTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setViewTarget(null);
            setViewMembers([]);
          }
        }}
      >
        <DialogContent className="max-w-md bg-white rounded-2xl shadow-xl border border-border/40 p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-[#5b368d] flex items-center gap-2">
              <Users className="h-5 w-5 text-[#ffb11f]" />
              Thành viên - {viewTarget?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Danh sách chi tiết các thành viên thuộc nhóm gia đình này.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
            {viewMembersLoading ? (
              <div className="text-center py-6 text-sm text-muted-foreground">Đang tải thành viên...</div>
            ) : viewMembers.length > 0 ? (
              viewMembers.map((member) => {
                const isCreator = member.user_id === viewTarget?.created_by;
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-border/40 hover:bg-[#faf8fd] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-[#eee9f7] border border-primary/20 text-[#7655aa] flex items-center justify-center font-bold text-xs">
                        {member.full_name?.charAt(0).toUpperCase() ?? "U"}
                      </div>
                      <div>
                        <div className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
                          {member.full_name ?? "Người dùng ẩn danh"}
                          {isCreator && (
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-[#ffb11f]/20 text-[#b27200] border border-[#ffb11f]/30">
                              Chủ nhóm
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{member.email ?? "—"}</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#eee9f7] text-[#7655aa] border border-[#7655aa]/20">
                      {member.role?.toUpperCase() === "ADMIN" ? "Quản trị viên" : "Người dùng"}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-sm text-muted-foreground">
                Không có thành viên nào trong nhóm này.
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <DialogClose asChild>
              <Button className="bg-[#7655aa] hover:bg-[#67489a] text-white font-bold rounded-lg px-4 h-9">
                Đóng
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Delete Family */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Xóa nhóm gia đình "${deleteTarget?.name}"?`}
        description={
          <div className="space-y-3">
            <p>Hành động này không thể hoàn tác. Việc xóa nhóm gia đình sẽ đồng thời dọn sạch:</p>
            <ul className="list-disc list-inside text-xs pl-2 space-y-1 text-muted-foreground">
              <li>Mọi liên kết thành viên nhóm gia đình</li>
              <li>Toàn bộ thực phẩm đang lưu trữ trong tủ lạnh của nhóm</li>
              <li>Danh sách mua sắm và các sản phẩm cần mua liên quan</li>
              <li>Kế hoạch bữa ăn đã lập</li>
              <li>Nhật ký hoạt động của nhóm gia đình</li>
            </ul>
            <div className="flex items-center gap-2 p-3 bg-rose-500/10 text-xs font-bold text-destructive rounded-xl border border-destructive/20 mt-2">
              <ShieldAlert className="h-4 w-4 shrink-0 animate-bounce" />
              <span>Cảnh báo: Tất cả dữ liệu của nhóm gia đình này sẽ bị loại bỏ hoàn toàn khỏi hệ thống!</span>
            </div>
          </div>
        }
        primaryLabel="Xóa vĩnh viễn"
        type="destructive"
        onConfirm={handleDelete}
        isLoading={actionLoading}
      />
    </div>
  );
}

export default FamilyListPage;
