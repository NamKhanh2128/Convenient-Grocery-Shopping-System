import { useEffect, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart2, CalendarClock, CheckCircle2, ChevronLeft, ChevronRight, Flame, Leaf, ListChecks, ShoppingCart, Trash2, TrendingUp } from "lucide-react";
import { useAuthStore } from "@/modules/auth/store/authStore";
import { ScreenHeader } from "@/shared/components/ScreenHeader";
import {
  statisticsApi,
  type CategoryStat,
  type DailyActivity,
  type ExpiredItem,
  type FoodQuantityStat,
  type FoodTrend,
  type PurchaseTrend,
  type ShoppingListStats,
  type WastedEvent,
} from "../api/statisticsApi";

const COLORS = ["#7655aa", "#ffb11f", "#66c2a5", "#fc8d62", "#8da0cb", "#e78ac3"];

type Tab = "overview" | "consumption" | "waste";

function formatDateRange(from: string, to: string): string {
  if (!from || !to) return "";
  const fmt = (iso: string) => {
    const [, m, d] = iso.split("-");
    return `${d}/${m}`;
  };
  return `${fmt(from)} - ${fmt(to)}`;
}

function formatQuantity(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, "");
}

function FoodQuantityList({ items, emptyText, tone }: { items: FoodQuantityStat[]; emptyText: string; tone: "used" | "wasted" | "neutral" }) {
  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-[#9188a1]">{emptyText}</p>;
  }
  const bg = tone === "used" ? "bg-green-50" : tone === "wasted" ? "bg-red-50" : "bg-[#f8f6fb]";
  const badge = tone === "used" ? "bg-green-100 text-green-700" : tone === "wasted" ? "bg-red-100 text-red-600" : "bg-[#ede7f6] text-[#7655aa]";
  return (
    <div className="space-y-2 max-h-72 overflow-y-auto">
      {items.map((item) => (
        <div key={`${item.food_name}-${item.unit}`} className={`flex items-center gap-3 rounded-[8px] ${bg} px-3 py-2`}>
          <span className="text-xl">{item.icon}</span>
          <div className="flex-1">
            <div className="text-sm font-bold">{item.food_name}</div>
            <div className="text-xs text-[#9188a1]">{item.category}</div>
          </div>
          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${badge}`}>
            {formatQuantity(item.total_quantity)} {item.unit}
          </span>
        </div>
      ))}
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="flex items-center gap-4 rounded-[8px] bg-white p-4 shadow-card">
      <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${color}`}>{icon}</div>
      <div>
        <div className="text-2xl font-extrabold text-[#3b2868]">{value}</div>
        <div className="text-sm font-semibold text-[#746d82]">{label}</div>
        {sub && <div className="text-xs text-[#9188a1]">{sub}</div>}
      </div>
    </div>
  );
}

export function StatisticsPage() {
  const family = useAuthStore((s) => s.family)!;
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<Awaited<ReturnType<typeof statisticsApi.getOverview>> | null>(null);
  const [dailyData, setDailyData] = useState<DailyActivity[]>([]);
  const [purchaseTrend, setPurchaseTrend] = useState<PurchaseTrend>({ categories: [], days: [], from: "", to: "" });
  const [weekOffset, setWeekOffset] = useState(0);
  const [purchaseTrendLoading, setPurchaseTrendLoading] = useState(false);
  const [categoryBar, setCategoryBar] = useState<CategoryStat[]>([]);
  const [trends, setTrends] = useState<{ mostUsed: FoodTrend[]; leastUsed: FoodTrend[] } | null>(null);
  const [consumptionByFood, setConsumptionByFood] = useState<FoodQuantityStat[]>([]);
  const [wasteByFood, setWasteByFood] = useState<FoodQuantityStat[]>([]);
  const [purchaseTrendByFood, setPurchaseTrendByFood] = useState<FoodQuantityStat[]>([]);
  const [fridgeStockByFood, setFridgeStockByFood] = useState<FoodQuantityStat[]>([]);
  const [shoppingListStats, setShoppingListStats] = useState<ShoppingListStats | null>(null);
  const [waste, setWaste] = useState<{
    expiredItems: ExpiredItem[];
    activeCount: number;
    expiredCount: number;
    wasteRatio: number;
    wastedCount: number;
    usedCount: number;
    wastedEvents: WastedEvent[];
  } | null>(null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [ov, daily, purchases, purchasesByFood, catBar, tr, ws, cbf, wbf, sls, fsbf] = await Promise.all([
          statisticsApi.getOverview(family.family_id),
          statisticsApi.getDailyActivity(family.family_id),
          statisticsApi.getPurchaseTrend(family.family_id, 0),
          statisticsApi.getPurchaseTrendByFood(family.family_id, 0),
          statisticsApi.getCategoryBar(family.family_id),
          statisticsApi.getFoodTrends(family.family_id),
          statisticsApi.getWasteReport(family.family_id),
          statisticsApi.getConsumptionByFood(family.family_id),
          statisticsApi.getWasteByFood(family.family_id),
          statisticsApi.getShoppingListStats(family.family_id),
          statisticsApi.getFridgeStockByFood(family.family_id),
        ]);
        setOverview(ov);
        setDailyData(daily);
        setPurchaseTrend(purchases);
        setPurchaseTrendByFood(purchasesByFood);
        setWeekOffset(0);
        setCategoryBar(catBar);
        setTrends(tr);
        setWaste(ws);
        setConsumptionByFood(cbf);
        setWasteByFood(wbf);
        setShoppingListStats(sls);
        setFridgeStockByFood(fsbf);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không tải được dữ liệu thống kê");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [family.family_id]);

  const skipNextWeekFetch = useRef(true);
  useEffect(() => {
    if (skipNextWeekFetch.current) {
      // The initial load (weekOffset 0) already fetched this — avoid an
      // immediate duplicate request right after mount.
      skipNextWeekFetch.current = false;
      return;
    }
    let cancelled = false;
    async function loadWeek() {
      setPurchaseTrendLoading(true);
      try {
        const [purchases, purchasesByFood] = await Promise.all([
          statisticsApi.getPurchaseTrend(family.family_id, weekOffset),
          statisticsApi.getPurchaseTrendByFood(family.family_id, weekOffset),
        ]);
        if (!cancelled) {
          setPurchaseTrend(purchases);
          setPurchaseTrendByFood(purchasesByFood);
        }
      } catch {
        // keep showing the previous week's data on failure
      } finally {
        if (!cancelled) setPurchaseTrendLoading(false);
      }
    }
    void loadWeek();
    return () => { cancelled = true; };
  }, [weekOffset, family.family_id]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Tổng quan" },
    { key: "consumption", label: "Tiêu thụ" },
    { key: "waste", label: "Lãng phí" },
  ];

  return (
    <>
      <ScreenHeader
        title="Thống kê"
        subtitle="Phân tích tiêu thụ thực phẩm, xu hướng và báo cáo lãng phí của gia đình."
      />

      <div className="mb-6 flex rounded-xl border bg-white p-1 shadow-sm w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-4 py-2 text-sm font-bold transition ${tab === t.key ? "bg-[#ffbd2c] text-[#4b3178]" : "text-[#9188a1] hover:text-[#7655aa]"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="rounded-[8px] border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
          {error}
        </div>
      ) : loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-[8px] bg-white shadow-card" />
          ))}
        </div>
      ) : (
        <>
          {tab === "overview" && overview && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard icon={<BarChart2 className="h-6 w-6 text-white" />} label="Thực phẩm trong tủ" value={overview.totalFridgeItems} color="bg-[#7655aa]" />
                <StatCard icon={<Trash2 className="h-6 w-6 text-white" />} label="Đã hết hạn" value={overview.expiredCount} sub={`${overview.wastePercentage}% tổng số`} color="bg-red-400" />
                <StatCard icon={<ShoppingCart className="h-6 w-6 text-white" />} label="Danh sách mua sắm" value={overview.shoppingListCount} color="bg-[#ffb11f]" />
                <StatCard icon={<Leaf className="h-6 w-6 text-white" />} label="Thực đơn đã lên" value={overview.mealPlanCount} color="bg-green-500" />
              </div>

              {shoppingListStats && (
                <div className="rounded-[8px] bg-white p-5 shadow-card">
                  <h3 className="mb-4 flex items-center gap-2 font-extrabold text-[#3b2868]">
                    <ListChecks className="h-5 w-5 text-[#7655aa]" />
                    Danh sách mua sắm
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-4">
                    <div className="rounded-xl bg-[#f8f6fb] p-3 text-center">
                      <div className="text-xl font-extrabold text-[#3b2868]">{shoppingListStats.total}</div>
                      <div className="text-xs text-[#9188a1]">Đã tạo</div>
                    </div>
                    <div className="rounded-xl bg-green-50 p-3 text-center">
                      <div className="flex items-center justify-center gap-1 text-xl font-extrabold text-green-700">
                        <CheckCircle2 className="h-4 w-4" />
                        {shoppingListStats.completed}
                      </div>
                      <div className="text-xs text-[#9188a1]">Hoàn thành</div>
                    </div>
                    <div className="rounded-xl bg-amber-50 p-3 text-center">
                      <div className="text-xl font-extrabold text-amber-600">{shoppingListStats.active}</div>
                      <div className="text-xs text-[#9188a1]">Chưa hoàn thành</div>
                    </div>
                    <div className="rounded-xl bg-[#f8f6fb] p-3 text-center">
                      <div className="text-xl font-extrabold text-[#7655aa]">{shoppingListStats.completionRate}%</div>
                      <div className="text-xs text-[#9188a1]">Tỷ lệ hoàn thành</div>
                    </div>
                  </div>
                  <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-[#f0edf7]">
                    <div
                      className="h-full rounded-full bg-green-500 transition-all"
                      style={{ width: `${shoppingListStats.completionRate}%` }}
                    />
                  </div>
                  {shoppingListStats.cancelled > 0 && (
                    <p className="mt-2 text-xs text-[#9188a1]">{shoppingListStats.cancelled} danh sách đã hủy</p>
                  )}
                </div>
              )}

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-[8px] bg-white p-5 shadow-card">
                  <h3 className="mb-4 flex items-center gap-2 font-extrabold text-[#3b2868]">
                    <TrendingUp className="h-5 w-5 text-[#7655aa]" />
                    Hoạt động 7 ngày qua
                  </h3>
                  {dailyData.length === 0 ? (
                    <p className="py-8 text-center text-sm text-[#9188a1]">Chưa có dữ liệu hoạt động.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={dailyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0edf7" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip />
                        <Line type="monotone" dataKey="count" stroke="#7655aa" strokeWidth={2} dot={{ fill: "#7655aa" }} name="Hoạt động" />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="rounded-[8px] bg-white p-5 shadow-card">
                  <h3 className="mb-4 font-extrabold text-[#3b2868]">Phân loại thực phẩm</h3>
                  {overview.categoryDistribution.length === 0 ? (
                    <p className="py-8 text-center text-sm text-[#9188a1]">Tủ lạnh đang trống.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={overview.categoryDistribution} dataKey="count" nameKey="category" cx="50%" cy="50%" outerRadius={80} label={({ name }) => name}>
                          {overview.categoryDistribution.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="rounded-[8px] bg-white p-5 shadow-card">
                <h3 className="mb-1 font-extrabold text-[#3b2868]">Thực phẩm trong tủ theo từng loại</h3>
                <p className="mb-3 text-xs text-[#9188a1]">Số lượng hiện có của mỗi thực phẩm, theo đơn vị riêng của nó — chi tiết hơn biểu đồ phân loại ở trên.</p>
                <FoodQuantityList items={fridgeStockByFood} emptyText="Tủ lạnh đang trống." tone="neutral" />
              </div>

              <div className="rounded-[8px] bg-white p-5 shadow-card">
                <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="flex items-center gap-2 font-extrabold text-[#3b2868]">
                    <CalendarClock className="h-5 w-5 text-[#7655aa]" />
                    Thực phẩm đã mua theo thời gian
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setWeekOffset((w) => w - 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border bg-white shadow-sm transition hover:bg-[#f1edf7]"
                      aria-label="Tuần trước"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="min-w-[120px] text-center text-xs font-semibold text-[#5b368d]">
                      {formatDateRange(purchaseTrend.from, purchaseTrend.to)}
                    </span>
                    <button
                      onClick={() => setWeekOffset((w) => w + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border bg-white shadow-sm transition hover:bg-[#f1edf7]"
                      aria-label="Tuần sau"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    {weekOffset !== 0 && (
                      <button
                        onClick={() => setWeekOffset(0)}
                        className="rounded-lg border bg-white px-2 py-1 text-xs font-semibold text-[#7655aa] shadow-sm transition hover:bg-[#f1edf7]"
                      >
                        Tuần này
                      </button>
                    )}
                  </div>
                </div>
                <p className="mb-3 text-xs text-[#9188a1]">Số mặt hàng đã mua mỗi ngày, chia theo danh mục (mỗi sản phẩm tính 1, không cộng dồn số lượng vì đơn vị khác nhau).</p>
                {purchaseTrendLoading ? (
                  <div className="h-[240px] animate-pulse rounded-lg bg-[#f8f6fb]" />
                ) : purchaseTrend.days.every((d) => d.total === 0) ? (
                  <p className="py-8 text-center text-sm text-[#9188a1]">Chưa có dữ liệu mua sắm trong tuần này.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={purchaseTrend.days}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0edf7" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip formatter={(value, name) => [`${value} mặt hàng`, name]} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      {purchaseTrend.categories.map((cat, i) => (
                        <Bar key={cat} dataKey={cat} stackId="purchases" fill={COLORS[i % COLORS.length]} radius={i === purchaseTrend.categories.length - 1 ? [4, 4, 0, 0] : undefined} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="rounded-[8px] bg-white p-5 shadow-card">
                <h3 className="mb-1 font-extrabold text-[#3b2868]">Thực phẩm đã mua theo từng loại (tuần này)</h3>
                <p className="mb-3 text-xs text-[#9188a1]">Số lượng thực tế đã mua cho mỗi thực phẩm trong tuần đang xem ở trên, theo đơn vị riêng của nó.</p>
                {purchaseTrendLoading ? (
                  <div className="h-24 animate-pulse rounded-lg bg-[#f8f6fb]" />
                ) : (
                  <FoodQuantityList items={purchaseTrendByFood} emptyText="Chưa có dữ liệu mua sắm trong tuần này." tone="neutral" />
                )}
              </div>

              {overview.wastePercentage > 20 && (
                <div className="rounded-[8px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  <strong>Gợi ý:</strong> Bạn đang lãng phí <strong>{overview.wastePercentage}%</strong> thực phẩm. Hãy kiểm tra tủ lạnh và sử dụng thực phẩm gần hết hạn sớm hơn.
                </div>
              )}
            </div>
          )}

          {tab === "consumption" && trends && (
            <div className="space-y-6">
              <div className="rounded-[8px] bg-white p-5 shadow-card">
                <h3 className="mb-1 font-extrabold text-[#3b2868]">Tiêu thụ theo danh mục</h3>
                <p className="mb-3 text-xs text-[#9188a1]">Số lần đã dùng/nấu mỗi danh mục (đơn vị: lần) — không cộng dồn số lượng vì mỗi món có đơn vị khác nhau (kg, quả, gói...).</p>
                {categoryBar.length === 0 ? (
                  <p className="py-8 text-center text-sm text-[#9188a1]">Chưa có dữ liệu tiêu thụ. Hãy bấm "Dùng" trong tủ lạnh hoặc đánh dấu "Đã nấu" để bắt đầu ghi nhận.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={categoryBar}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0edf7" />
                      <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} unit=" lần" />
                      <Tooltip formatter={(value) => [`${value} lần`, "Đã dùng"]} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Số lần đã dùng">
                        {categoryBar.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="rounded-[8px] bg-white p-5 shadow-card">
                <h3 className="mb-1 font-extrabold text-[#3b2868]">Lượng tiêu thụ theo từng thực phẩm (30 ngày)</h3>
                <p className="mb-3 text-xs text-[#9188a1]">Tổng số lượng thực tế đã dùng/nấu cho mỗi thực phẩm, theo đơn vị riêng của nó (kg, quả, củ, gói...).</p>
                <FoodQuantityList items={consumptionByFood} emptyText='Chưa có dữ liệu. Hãy bấm "Dùng" trong tủ lạnh hoặc đánh dấu "Đã nấu" để bắt đầu ghi nhận.' tone="used" />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-[8px] bg-white p-5 shadow-card">
                  <h3 className="mb-3 flex items-center gap-2 font-extrabold text-[#3b2868]">
                    <Flame className="h-5 w-5 text-orange-500" />
                    Dùng thường xuyên
                  </h3>
                  {trends.mostUsed.filter((f) => f.count > 0).length === 0 ? (
                    <p className="py-4 text-center text-sm text-[#9188a1]">Chưa có dữ liệu.</p>
                  ) : (
                    <div className="space-y-2">
                      {trends.mostUsed.filter((f) => f.count > 0).map((food) => (
                        <div key={food.food_id} className="flex items-center gap-3 rounded-[8px] bg-orange-50 px-3 py-2">
                          <span className="text-xl">{food.icon}</span>
                          <div className="flex-1">
                            <div className="text-sm font-bold">{food.food_name}</div>
                            <div className="text-xs text-[#9188a1]">{food.category}</div>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700">🔥 {food.count} lần</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-[8px] bg-white p-5 shadow-card">
                  <h3 className="mb-3 font-extrabold text-[#3b2868]">Ít dùng</h3>
                  {trends.leastUsed.length === 0 ? (
                    <p className="py-4 text-center text-sm text-[#9188a1]">Tất cả thực phẩm đều được dùng.</p>
                  ) : (
                    <div className="space-y-2">
                      {trends.leastUsed.map((food) => (
                        <div key={food.food_id} className="flex items-center gap-3 rounded-[8px] bg-[#f8f6fb] px-3 py-2">
                          <span className="text-xl">{food.icon}</span>
                          <div className="flex-1">
                            <div className="text-sm font-bold">{food.food_name}</div>
                            <div className="text-xs text-[#9188a1]">{food.category}</div>
                          </div>
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-500">Ít dùng</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[8px] border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                <strong>Gợi ý thông minh:</strong> Bạn tiêu thụ nhiều <strong>Thịt cá</strong> hơn <strong>Rau củ</strong>. Hãy cân bằng chế độ ăn để tốt hơn cho sức khỏe.
              </div>
            </div>
          )}

          {tab === "waste" && waste && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard icon={<Leaf className="h-6 w-6 text-white" />} label="Đã sử dụng (30 ngày)" sub='Bấm "Dùng" hoặc nấu xong' value={waste.usedCount} color="bg-green-500" />
                <StatCard icon={<Trash2 className="h-6 w-6 text-white" />} label="Đã vứt bỏ (30 ngày)" sub='Bấm "Xóa" trong tủ lạnh' value={waste.wastedCount} color="bg-red-400" />
                <StatCard icon={<BarChart2 className="h-6 w-6 text-white" />} label="Tỷ lệ lãng phí" sub="Vứt bỏ + hết hạn / tổng xử lý" value={`${waste.wasteRatio}%`} color="bg-amber-400" />
              </div>

              <div className="rounded-[8px] bg-white p-5 shadow-card">
                <h3 className="mb-1 font-extrabold text-[#3b2868]">Lãng phí theo từng thực phẩm (30 ngày)</h3>
                <p className="mb-3 text-xs text-[#9188a1]">Tổng số lượng đã vứt bỏ hoặc để hết hạn cho mỗi thực phẩm, theo đơn vị riêng của nó (kg, quả, củ, gói...).</p>
                <FoodQuantityList items={wasteByFood} emptyText="Chưa lãng phí thực phẩm nào!" tone="wasted" />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-[8px] bg-white p-5 shadow-card">
                  <h3 className="mb-1 font-extrabold text-[#3b2868]">Sử dụng vs Vứt bỏ (30 ngày)</h3>
                  <p className="mb-3 text-xs text-[#9188a1]">Tính từ hành động thật: bấm "Dùng"/nấu xong = sử dụng; bấm "Xóa" thực phẩm = vứt bỏ.</p>
                  {waste.usedCount + waste.wastedCount === 0 ? (
                    <p className="py-8 text-center text-sm text-[#9188a1]">Chưa có hoạt động nào trong 30 ngày qua.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Đã sử dụng", value: waste.usedCount },
                            { name: "Đã vứt bỏ", value: waste.wastedCount },
                          ]}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                        >
                          <Cell fill="#66c2a5" />
                          <Cell fill="#fc8d62" />
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} lần`, ""]} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="rounded-[8px] bg-white p-5 shadow-card">
                  <h3 className="mb-3 font-extrabold text-[#3b2868]">Đã vứt bỏ gần đây</h3>
                  {waste.wastedEvents.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-8 text-center">
                      <span className="text-4xl">✅</span>
                      <p className="text-sm font-semibold text-green-700">Chưa vứt bỏ thực phẩm nào trong 30 ngày qua!</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {waste.wastedEvents.map((ev) => (
                        <div key={ev.event_id} className="flex items-center gap-3 rounded-[8px] bg-red-50 px-3 py-2">
                          <span className="text-xl">{ev.icon}</span>
                          <div className="flex-1">
                            <div className="text-sm font-bold">{ev.food_name}</div>
                            <div className="text-xs text-[#9188a1]">{formatQuantity(ev.quantity)} {ev.unit} · Vứt ngày {ev.wasted_date}</div>
                          </div>
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">Đã vứt</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-[8px] bg-white p-5 shadow-card">
                  <h3 className="mb-4 font-extrabold text-[#3b2868]">Trạng thái tủ lạnh hiện tại</h3>
                  {waste.activeCount + waste.expiredCount === 0 ? (
                    <p className="py-8 text-center text-sm text-[#9188a1]">Tủ lạnh đang trống.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Còn dùng được", value: waste.activeCount },
                            { name: "Đã hết hạn", value: waste.expiredCount },
                          ]}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                        >
                          <Cell fill="#66c2a5" />
                          <Cell fill="#fc8d62" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="rounded-[8px] bg-white p-5 shadow-card">
                  <h3 className="mb-3 font-extrabold text-[#3b2868]">Thực phẩm đã hết hạn (chưa xóa)</h3>
                  {waste.expiredItems.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-8 text-center">
                      <span className="text-4xl">✅</span>
                      <p className="text-sm font-semibold text-green-700">Không có thực phẩm hết hạn!</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {waste.expiredItems.map((item) => (
                        <div key={item.fridge_item_id} className="flex items-center gap-3 rounded-[8px] bg-red-50 px-3 py-2">
                          <span className="text-xl">{item.icon}</span>
                          <div className="flex-1">
                            <div className="text-sm font-bold">{item.food_name}</div>
                            <div className="text-xs text-[#9188a1]">
                              {formatQuantity(item.quantity)} {item.unit} · {item.location} · Hết {item.expiry_date}
                            </div>
                          </div>
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">Hết hạn</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {waste.wasteRatio > 0 && (
                <div className="rounded-[8px] border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  <strong>Cảnh báo:</strong> Bạn đang lãng phí <strong>{waste.wasteRatio}%</strong> thực phẩm. Kiểm tra thực phẩm sắp hết hạn và lên kế hoạch bữa ăn để giảm lãng phí.
                </div>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}
