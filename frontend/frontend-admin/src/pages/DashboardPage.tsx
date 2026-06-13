import { useEffect, useState } from "react";
import {
  Users,
  UtensilsCrossed,
  BookOpen,
  Users2,
  Activity,
  Loader2,
  Shield,
  Award,
  ShoppingBag,
  CalendarDays,
} from "lucide-react";
import { adminStatsApi, type SummaryData } from "@/api/adminStatsApi";
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
  BarChart,
  Bar,
} from "recharts";
import { useT } from "@/store/languageStore";

export function DashboardPage() {
  const t = useT();
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [foodsData, setFoodsData] = useState<{ name: string; value: number }[]>([]);
  const [mealsByDayData, setMealsByDayData] = useState<{ date: string; count: number }[]>([]);
  const [topRecipesData, setTopRecipesData] = useState<{ name: string; count: number }[]>([]);
  const [rolesData, setRolesData] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [families, setFamilies] = useState<Awaited<ReturnType<typeof adminStatsApi.getFamilies>>>([]);
  const [familiesOpen, setFamiliesOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const handleOpenFamilies = async () => {
    setFamiliesOpen(true);
    setModalLoading(true);
    try {
      setFamilies(await adminStatsApi.getFamilies());
    } catch (error) {
      console.error("Lỗi khi tải danh sách gia đình:", error);
    } finally {
      setModalLoading(false);
    }
  };

  useEffect(() => {
    async function loadStats() {
      try {
        const [sum, foods, meals, topRecs] = await Promise.all([
          adminStatsApi.summary(),
          adminStatsApi.foodsByCategory(),
          adminStatsApi.mealsByDay(),
          adminStatsApi.topRecipes(),
        ]);
        setSummary(sum);
        setFoodsData(foods || []);
        setMealsByDayData(meals || []);
        setTopRecipesData(topRecs || []);
        setRolesData([
          { name: "Người dùng (USER)", value: sum.totalUsers },
          { name: "Quản trị viên (ADMIN)", value: sum.totalAdmins },
        ]);
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
  const ROLE_COLORS = ["var(--color-primary)", "var(--color-warning)"];

  const tooltipStyle = {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(8px)",
    borderRadius: "16px",
    border: "1px solid rgba(0, 0, 0, 0.05)",
    boxShadow: "var(--shadow-card)",
    fontSize: "12px",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thống Kê Hệ Thống"
        description="Theo dõi hiệu suất, chỉ số tăng trưởng và phân tích dữ liệu hoạt động của NAT-EAT."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t("statTotalUsers")}
          value={loading ? "..." : summary?.totalUsers ?? 0}
          icon={Users}
          color="primary"
          to="/users"
        />
        <StatCard
          title="Quản trị viên"
          value={loading ? "..." : summary?.totalAdmins ?? 0}
          icon={Shield}
          color="warning"
          to="/users"
        />
        <StatCard
          title={t("statTotalFoods")}
          value={loading ? "..." : summary?.totalFoods ?? 0}
          icon={UtensilsCrossed}
          color="success"
          to="/foods"
        />
        <StatCard
          title={t("statTotalRecipes")}
          value={loading ? "..." : summary?.totalRecipes ?? 0}
          icon={BookOpen}
          color="warning"
          to="/recipes"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t("statTotalFamilies")}
          value={loading ? "..." : summary?.totalFamilies ?? 0}
          icon={Users2}
          color="primary"
          onClick={handleOpenFamilies}
        />
        <StatCard
          title="Kế hoạch bữa ăn"
          value={loading ? "..." : summary?.totalMealPlans ?? 0}
          icon={CalendarDays}
          color="success"
        />
        <StatCard
          title="Danh sách mua sắm đang hoạt động"
          value={loading ? "..." : summary?.activeShopping ?? 0}
          icon={ShoppingBag}
          color="destructive"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
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
          <CardContent className="pt-4 h-[280px] flex items-center justify-center">
            {loading ? (
              <div className="text-xs text-muted-foreground">Đang tải biểu đồ...</div>
            ) : (
              <div className="relative w-full h-full flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height="80%">
                  <PieChart>
                    <ChartTooltip contentStyle={tooltipStyle} />
                    <Pie
                      data={foodsData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {foodsData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
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

        <Card className="rounded-[20px] shadow-card border-border/50 bg-card overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">Phân Bổ Tài Khoản</CardTitle>
                <CardDescription className="text-xs">Tỷ lệ vai trò người dùng trong hệ thống</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 h-[280px] flex items-center justify-center">
            {loading ? (
              <div className="text-xs text-muted-foreground">Đang tải biểu đồ...</div>
            ) : (
              <div className="relative w-full h-full flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height="80%">
                  <PieChart>
                    <ChartTooltip contentStyle={tooltipStyle} />
                    <Pie
                      data={rolesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {rolesData.map((_, index) => (
                        <Cell key={`role-${index}`} fill={ROLE_COLORS[index % ROLE_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-1 text-[10px] font-semibold text-muted-foreground">
                  {rolesData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ROLE_COLORS[index % ROLE_COLORS.length] }} />
                      <span>{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[20px] shadow-card border-border/50 bg-card overflow-hidden md:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">Bữa Ăn Theo Ngày</CardTitle>
                <CardDescription className="text-xs">Số bữa ăn được lên kế hoạch mỗi ngày (7 ngày gần nhất)</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 h-[260px]">
            {loading ? (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">Đang tải biểu đồ...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mealsByDayData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} style={{ fontSize: 10, fontWeight: 600 }} />
                  <YAxis tickLine={false} axisLine={false} style={{ fontSize: 10, fontWeight: 600 }} />
                  <ChartTooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="count" stroke="var(--chart-1)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[20px] shadow-card border-border/50 bg-card overflow-hidden md:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
                <Award className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">Top 5 Công Thức Phổ Biến</CardTitle>
                <CardDescription className="text-xs">Món ăn được đưa vào thực đơn nhiều nhất</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 h-[300px]">
            {loading ? (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">Đang tải biểu đồ...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topRecipesData} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
                  <XAxis type="number" tickLine={false} axisLine={false} style={{ fontSize: 10, fontWeight: 600 }} />
                  <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} style={{ fontSize: 10, fontWeight: 600 }} width={100} />
                  <ChartTooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" fill="var(--color-primary)" radius={[0, 6, 6, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

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
              <div className="py-8 text-center text-xs font-semibold text-muted-foreground">Không có dữ liệu gia đình.</div>
            ) : (
              <div className="border border-border/40 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#fbfacb]/80 border-b border-border/40">
                    <tr>
                      <th className="p-3 font-bold">Tên hộ gia đình</th>
                      <th className="p-3 font-bold">Người tạo</th>
                      <th className="p-3 font-bold">Email</th>
                      <th className="p-3 font-bold text-center">Thành viên</th>
                    </tr>
                  </thead>
                  <tbody>
                    {families.map((f) => (
                      <tr key={f.id} className="border-b border-border/20 last:border-0 hover:bg-muted/40">
                        <td className="p-3 font-bold">{f.name}</td>
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
