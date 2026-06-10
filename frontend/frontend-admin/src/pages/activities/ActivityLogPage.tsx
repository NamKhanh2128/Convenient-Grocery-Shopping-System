import { useEffect, useState, useMemo, useCallback } from "react";
import { Calendar } from "lucide-react";
import { toast } from "sonner";
import { adminActivityApi, type FamilyActivityWithDetails } from "@/api/adminActivityApi";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { FilterBar, type FilterConfig } from "@/components/shared/FilterBar";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";

export function ActivityLogPage() {
  // States
  const [activities, setActivities] = useState<FamilyActivityWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Load Data
  const loadActivities = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminActivityApi.list();
      setActivities(data);
    } catch (error) {
      toast.error("Không thể tải nhật ký hoạt động hệ thống.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  // Reset page
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterAction]);

  // Filtering
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      const matchesSearch =
        (act.user_name && act.user_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (act.family_name && act.family_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (act.message && act.message.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesAction = filterAction === "ALL" || act.action_type === filterAction;

      return matchesSearch && matchesAction;
    });
  }, [activities, searchQuery, filterAction]);

  // Pagination slicing
  const paginatedActivities = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredActivities.slice(start, start + pageSize);
  }, [filteredActivities, currentPage, pageSize]);

  // Filter Configuration
  const filterConfigs: FilterConfig[] = [
    {
      key: "action",
      label: "Loại tương tác",
      value: filterAction,
      onChange: setFilterAction,
      options: [
        { label: "Tất cả tương tác", value: "ALL" },
        { label: "Tủ lạnh (Fridge)", value: "fridge" },
        { label: "Mua sắm (Shopping)", value: "shopping" },
        { label: "Thực đơn (Meal)", value: "meal" },
        { label: "Công thức (Recipe)", value: "recipe" },
        { label: "Gia đình (Family)", value: "family" },
      ],
    },
  ];

  // Column definitions
  const columns: Column<FamilyActivityWithDetails>[] = useMemo(
    () => [
      {
        key: "user_name",
        header: "Người thực hiện",
        sortable: true,
        render: (row) => (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-[#eee9f7] border border-primary/20 text-[#7655aa] flex items-center justify-center font-bold text-xs shrink-0">
              {row.user_name?.charAt(0).toUpperCase() ?? "U"}
            </div>
            <div>
              <div className="font-bold text-xs text-foreground">{row.user_name}</div>
              <div className="text-[10px] text-muted-foreground">{row.user_email}</div>
            </div>
          </div>
        ),
      },
      {
        key: "family_name",
        header: "Hộ gia đình",
        sortable: true,
        render: (row) => <span className="font-bold text-xs text-foreground/80">{row.family_name}</span>,
      },
      {
        key: "user_role",
        header: "Vai trò",
        sortable: true,
        render: (row) => {
          const isAdmin = row.user_role === "ADMIN";
          return (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                isAdmin
                  ? "bg-[#eee9f7] text-[#7655aa] border-[#7655aa]/20"
                  : "bg-teal-500/10 text-teal-600 border-teal-500/20"
              }`}
            >
              {isAdmin ? "Quản trị viên" : "Người dùng"}
            </span>
          );
        },
      },
      {
        key: "action_type",
        header: "Mảng nghiệp vụ",
        sortable: true,
        render: (row) => {
          const actionColors: Record<string, string> = {
            fridge: "bg-teal-500/10 text-teal-600 border-teal-500/20",
            shopping: "bg-amber-500/10 text-amber-600 border-amber-500/20",
            meal: "bg-purple-500/10 text-purple-600 border-purple-500/20",
            recipe: "bg-rose-500/10 text-rose-600 border-rose-500/20",
            family: "bg-sky-500/10 text-sky-600 border-sky-500/20",
          };
          const colorClass = actionColors[row.action_type] || "bg-slate-500/10 text-slate-600 border-slate-500/20";
          const labelMap: Record<string, string> = {
            fridge: "Tủ lạnh",
            shopping: "Mua sắm",
            meal: "Thực đơn",
            recipe: "Công thức",
            family: "Gia đình",
          };

          return (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${colorClass}`}>
              {labelMap[row.action_type] || row.action_type}
            </span>
          );
        },
      },
      {
        key: "message",
        header: "Nội dung hoạt động chi tiết",
        render: (row) => (
          <div>
            <div className="text-xs font-semibold text-foreground/80">{row.message}</div>
            {row.target && row.target !== row.message && (
              <div className="text-[10px] text-primary font-bold mt-0.5">Đối tượng: {row.target}</div>
            )}
          </div>
        ),
      },
      {
        key: "created_at",
        header: "Thời gian",
        sortable: true,
        render: (row) => {
          const time = new Date(row.created_at).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          });
          const date = new Date(row.created_at).toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          });

          return (
            <span className="font-semibold text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 opacity-60 text-primary" />
              {`${time} - ${date}`}
            </span>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nhật Ký Kiểm Toán"
        description="Ghi nhận lịch sử toàn bộ các tương tác và hoạt động vận hành của người dùng trên toàn hệ thống NAT-EAT."
      />

      {/* Controls */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Tìm kiếm theo họ tên người dùng, hộ gia đình hoặc nội dung hoạt động..."
            className="flex-1"
          />
        </div>

        <FilterBar filters={filterConfigs} onClearAll={() => setFilterAction("ALL")} />
      </div>

      {/* Data Table */}
      <div className="relative">
        <DataTable
          data={paginatedActivities}
          columns={columns}
          getRowId={(row) => row.id}
          loading={loading}
          emptyMessage="Không tìm thấy nhật ký tương tác nào phù hợp với bộ lọc."
        />

        <Pagination
          total={filteredActivities.length}
          page={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>
    </div>
  );
}

export default ActivityLogPage;
