import { useEffect, useState } from "react";
import {
  Users,
  UtensilsCrossed,
  BookOpen,
  Users2,
  Activity,
  Loader2,
} from "lucide-react";
import { adminStatsApi } from "@/api/adminStatsApi";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { useT } from "@/store/languageStore";

interface StatsSummary {
  totalUsers: number;
  totalAdmins: number;
  totalFoods: number;
  totalRecipes: number;
  totalFamilies: number;
  totalMealPlans: number;
  activeShopping: number;
}

export function DashboardPage() {
  const t = useT();
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [foodsData, setFoodsData] = useState<any[]>([]);
  const [mealsByDayData, setMealsByDayData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // States for detailed popup modals
  const [families, setFamilies] = useState<any[]>([]);
  const [familiesOpen, setFamiliesOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const handleOpenFamilies = async () => {
    setFamiliesOpen(true);
    setModalLoading(true);
    try {
      const data = await adminStatsApi.getFamilies();
      setFamilies(data);
    } catch (error) {
      console.error("Lỗi khi tải danh sách gia đình:", error);
    } finally {
      setModalLoading(false);
    }
  };

  useEffect(() => {
    async function loadStats() {
      try {
        const [sum, foods, meals] = await Promise.all([
          adminStatsApi.summary(),
          adminStatsApi.foodsByCategory(),
          adminStatsApi.mealsByDay(),
        ]);
        setSummary(sum);
        setFoodsData(foods || []);
        setMealsByDayData(meals || []);
      } catch (error) {
        console.error("Lỗi khi tải thống kê:", error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const COLORS = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tổng Quan Hệ Thống"
        description="Số liệu tổng hợp thời gian thực và biểu đồ phân tích hoạt động của NAT-EAT."
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t("statTotalUsers")}
          value={loading ? "..." : summary?.totalUsers ?? 0}
          icon={Users}
          color="primary"
          trend={{ value: 12, label: "so với tuần trước", positive: true }}
          to="/users"
        />
        <StatCard
          title={t("statTotalFoods")}
          value={loading ? "..." : summary?.totalFoods ?? 0}
          icon={UtensilsCrossed}
          color="success"
          trend={{ value: 4, label: "danh mục mới thêm", positive: true }}
          to="/foods"
        />
        <StatCard
          title={t("statTotalRecipes")}
          value={loading ? "..." : summary?.totalRecipes ?? 0}
          icon={BookOpen}
          color="warning"
          trend={{ value: 8, label: "được yêu thích", positive: true }}
          to="/recipes"
        />
        <StatCard
          title={t("statTotalFamilies")}
          value={loading ? "..." : summary?.totalFamilies ?? 0}
          icon={Users2}
          color="primary"
          trend={{ value: 15, label: "gia đình tham gia mới", positive: true }}
          onClick={handleOpenFamilies}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">

        {/* Pie Chart: Food Categories */}
        <Card className="rounded-[20px] shadow-card border-border/50 bg-card overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
                <UtensilsCrossed className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">Phân Loại Thực Phẩm</CardTitle>
                <CardDescription className="text-xs">Cơ cấu thực phẩm theo danh mục</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 h-[260px] flex items-center justify-center">
            {loading ? (
              <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">Đang tải biểu đồ...</div>
            ) : (
              <div className="relative w-full h-full flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height="80%">
                  <PieChart>
                    <ChartTooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        backdropFilter: "blur(8px)",
                        borderRadius: "16px",
                        border: "1px solid rgba(0, 0, 0, 0.05)",
                        boxShadow: "var(--shadow-card)",
                        fontSize: "12px",
                      }}
                    />
                    <Pie
                      data={foodsData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                      animationDuration={800}
                      animationEasing="ease-out"
                    >
                      {foodsData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Custom Legend */}
                <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mt-1 text-[10px] font-semibold text-muted-foreground max-h-[20%] overflow-y-auto w-full px-2">
                  {foodsData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span>{entry.name} ({entry.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Line Chart: Meal Plan Items by Day */}
        <Card className="rounded-[20px] shadow-card border-border/50 bg-card overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">Bữa Ăn Theo Ngày</CardTitle>
                <CardDescription className="text-xs">Số lượng bữa ăn được lên kế hoạch mỗi ngày (7 ngày gần nhất)</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 h-[260px]">
            {loading ? (
              <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">Đang tải biểu đồ...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mealsByDayData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} style={{ fontSize: 10, fontWeight: 600 }} />
                  <YAxis tickLine={false} axisLine={false} style={{ fontSize: 10, fontWeight: 600 }} />
                  <ChartTooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      backdropFilter: "blur(8px)",
                      borderRadius: "16px",
                      border: "1px solid rgba(0, 0, 0, 0.05)",
                      boxShadow: "var(--shadow-card)",
                      fontSize: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="var(--chart-1)"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 1 }}
                    activeDot={{ r: 6 }}
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Families Detail Dialog */}
      <Dialog open={familiesOpen} onOpenChange={setFamiliesOpen}>
        <DialogContent className="rounded-[20px] max-w-2xl bg-card border border-border/50">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-primary">
              <Users2 className="h-5 w-5" /> Danh Sách Hộ Gia Đình
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 max-h-[400px] overflow-y-auto">
            {modalLoading ? (
              <div className="flex h-32 items-center justify-center gap-2 text-muted-foreground text-sm font-semibold">
                <Loader2 className="h-5 w-5 animate-spin" /> Đang tải dữ liệu...
              </div>
            ) : families.length === 0 ? (
              <div className="py-8 text-center text-xs font-semibold text-muted-foreground">
                Không có dữ liệu gia đình.
              </div>
            ) : (
              <div className="border border-border/40 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#fbfacb]/80 border-b border-border/40">
                    <tr>
                      <th className="p-3 font-bold text-foreground">Tên hộ gia đình</th>
                      <th className="p-3 font-bold text-foreground">Người đại diện (Creator)</th>
                      <th className="p-3 font-bold text-foreground">Email người tạo</th>
                      <th className="p-3 font-bold text-foreground text-center">Số thành viên</th>
                    </tr>
                  </thead>
                  <tbody>
                    {families.map((f) => (
                      <tr key={f.id} className="border-b border-border/20 last:border-0 hover:bg-muted/40 transition">
                        <td className="p-3 font-bold text-foreground">{f.name}</td>
                        <td className="p-3 font-semibold text-muted-foreground">{f.creator_name}</td>
                        <td className="p-3 font-semibold text-muted-foreground">{f.creator_email}</td>
                        <td className="p-3 font-bold text-center text-primary">{f.member_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
export default DashboardPage;
