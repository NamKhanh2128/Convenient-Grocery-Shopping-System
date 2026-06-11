import { useEffect, useState } from "react";
import {
  PieChart as PieIcon,
  LineChart as LineIcon,
  TrendingUp,
  Award,
  Users,
} from "lucide-react";
import { adminStatsApi } from "@/api/adminStatsApi";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
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

export function StatisticsPage() {
  const [loading, setLoading] = useState(true);
  const [foodsData, setFoodsData] = useState<any[]>([]);
  const [mealsByDayData, setMealsByDayData] = useState<any[]>([]);
  const [topRecipesData, setTopRecipesData] = useState<any[]>([]);
  const [rolesData, setRolesData] = useState<any[]>([]);

  useEffect(() => {
    async function loadStats() {
      try {
        const [foods, meals, topRecs, sum] = await Promise.all([
          adminStatsApi.foodsByCategory(),
          adminStatsApi.mealsByDay(),
          adminStatsApi.topRecipes(),
          adminStatsApi.summary(),
        ]);

        setFoodsData(foods || []);
        setMealsByDayData(meals || []);
        setTopRecipesData(topRecs || []);
        
        // Roles data
        if (sum) {
          setRolesData([
            { name: "Người dùng (USER)", value: sum.totalUsers },
            { name: "Quản trị viên (ADMIN)", value: sum.totalAdmins },
          ]);
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu thống kê:", error);
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

  const ROLE_COLORS = [
    "var(--color-primary)",
    "var(--color-warning)",
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thống Kê Dữ Liệu"
        description="Báo cáo phân tích chuyên sâu về chỉ số tăng trưởng và tần suất sử dụng ứng dụng."
      />

      <div className="grid gap-6 md:grid-cols-2">


        {/* Chart 2: Meal Plan Items by Day (LineChart) */}
        <Card className="rounded-[20px] shadow-card border-border/50 bg-card overflow-hidden">
          <CardHeader className="border-b border-border/30 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600">
                <LineIcon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">Bữa Ăn Theo Ngày</CardTitle>
                <CardDescription className="text-xs">Số lượng bữa ăn được lên kế hoạch mỗi ngày (7 ngày gần nhất)</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 h-[280px]">
            {loading ? (
              <div className="h-full w-full animate-pulse flex flex-col justify-end gap-2 px-4 pb-4">
                <div className="flex items-end gap-3 h-3/4">
                  {Array.from({ length: 7 }).map((_, i) => <div key={i} className="flex-1 bg-muted rounded-t-md" style={{ height: `${30 + Math.random() * 50}%` }} />)}
                </div>
                <div className="h-3 w-full rounded bg-muted" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mealsByDayData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorActivityStats" x1="0" y1="0" x2="0" y2="1">
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

        {/* Chart 3: Food by category (PieChart) */}
        <Card className="rounded-[20px] shadow-card border-border/50 bg-card overflow-hidden">
          <CardHeader className="border-b border-border/30 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                <PieIcon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">Cơ Cấu Danh Mục Thực Phẩm</CardTitle>
                <CardDescription className="text-xs">Phân bố số lượng thực phẩm chuẩn hóa</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 h-[300px] flex items-center justify-center">
            {loading ? (
              <div className="h-full w-full animate-pulse flex flex-col justify-end gap-2 px-4 pb-4">
                <div className="flex items-end gap-3 h-3/4">
                  {Array.from({ length: 7 }).map((_, i) => <div key={i} className="flex-1 bg-muted rounded-t-md" style={{ height: `${30 + Math.random() * 50}%` }} />)}
                </div>
                <div className="h-3 w-full rounded bg-muted" />
              </div>
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
                      innerRadius={50}
                      outerRadius={75}
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
                
                {/* Legend */}
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-2 text-[10px] font-semibold text-muted-foreground w-full px-2 max-h-[20%] overflow-y-auto">
                  {foodsData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span>{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart 4: Users Roles (PieChart) */}
        <Card className="rounded-[20px] shadow-card border-border/50 bg-card overflow-hidden">
          <CardHeader className="border-b border-border/30 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">Phân Bổ Tài Khoản Người Dùng</CardTitle>
                <CardDescription className="text-xs">Tỷ lệ cơ cấu vai trò của thành viên trong hệ thống</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 h-[300px] flex items-center justify-center">
            {loading ? (
              <div className="h-full w-full animate-pulse flex flex-col justify-end gap-2 px-4 pb-4">
                <div className="flex items-end gap-3 h-3/4">
                  {Array.from({ length: 7 }).map((_, i) => <div key={i} className="flex-1 bg-muted rounded-t-md" style={{ height: `${30 + Math.random() * 50}%` }} />)}
                </div>
                <div className="h-3 w-full rounded bg-muted" />
              </div>
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
                      data={rolesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                      animationDuration={800}
                      animationEasing="ease-out"
                    >
                      {rolesData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={ROLE_COLORS[index % ROLE_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Legend */}
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-2 text-[10px] font-semibold text-muted-foreground w-full px-2 max-h-[20%] overflow-y-auto">
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

        {/* Chart 5: Top Recipes (Horizontal BarChart) */}
        <Card className="rounded-[20px] shadow-card border-border/50 bg-card overflow-hidden md:col-span-2">
          <CardHeader className="border-b border-border/30 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold">Top 5 Công Thức Phổ Biến Nhất</CardTitle>
                  <CardDescription className="text-xs">Những món ăn được các gia đình đưa vào thực đơn nhiều nhất</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                <TrendingUp className="h-3 w-3 shrink-0" />
                <span>Yêu thích</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 h-[320px]">
            {loading ? (
              <div className="h-full w-full animate-pulse flex flex-col justify-end gap-2 px-4 pb-4">
                <div className="flex items-end gap-3 h-3/4">
                  {Array.from({ length: 7 }).map((_, i) => <div key={i} className="flex-1 bg-muted rounded-t-md" style={{ height: `${30 + Math.random() * 50}%` }} />)}
                </div>
                <div className="h-3 w-full rounded bg-muted" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topRecipesData}
                  layout="vertical"
                  margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="colorPrimaryStatsTopRecs" x1="1" y1="0" x2="0" y2="0">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
                  <XAxis type="number" tickLine={false} axisLine={false} style={{ fontSize: 10, fontWeight: 600 }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    style={{ fontSize: 10, fontWeight: 600 }}
                    width={100}
                  />
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
                  <Bar dataKey="count" fill="url(#colorPrimaryStatsTopRecs)" radius={[0, 6, 6, 0]} maxBarSize={20} animationDuration={800} animationEasing="ease-out" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
export default StatisticsPage;
