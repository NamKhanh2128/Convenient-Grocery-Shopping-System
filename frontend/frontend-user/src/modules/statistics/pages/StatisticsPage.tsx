import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart2, Flame, Leaf, ShoppingCart, Trash2, TrendingUp } from "lucide-react";
import { useAuthStore } from "@/modules/auth/store/authStore";
import { ScreenHeader } from "@/shared/components/ScreenHeader";
import { statisticsApi, type CategoryStat, type DailyActivity, type ExpiredItem, type FoodTrend } from "../api/statisticsApi";

const COLORS = ["#7655aa", "#ffb11f", "#66c2a5", "#fc8d62", "#8da0cb", "#e78ac3"];

type Tab = "overview" | "consumption" | "waste";

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
  const [categoryBar, setCategoryBar] = useState<CategoryStat[]>([]);
  const [trends, setTrends] = useState<{ mostUsed: FoodTrend[]; leastUsed: FoodTrend[] } | null>(null);
  const [waste, setWaste] = useState<{ expiredItems: ExpiredItem[]; activeCount: number; expiredCount: number; wasteRatio: number } | null>(null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [ov, daily, catBar, tr, ws] = await Promise.all([
          statisticsApi.getOverview(family.family_id),
          statisticsApi.getDailyActivity(family.family_id),
          statisticsApi.getCategoryBar(family.family_id),
          statisticsApi.getFoodTrends(family.family_id),
          statisticsApi.getWasteReport(family.family_id),
        ]);
        setOverview(ov);
        setDailyData(daily);
        setCategoryBar(catBar);
        setTrends(tr);
        setWaste(ws);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không tải được dữ liệu thống kê");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [family.family_id]);

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
                <h3 className="mb-4 font-extrabold text-[#3b2868]">Tiêu thụ theo danh mục</h3>
                {categoryBar.length === 0 ? (
                  <p className="py-8 text-center text-sm text-[#9188a1]">Chưa có dữ liệu tiêu thụ.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={categoryBar}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0edf7" />
                      <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Số lượng">
                        {categoryBar.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
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
                <StatCard icon={<Leaf className="h-6 w-6 text-white" />} label="Còn sử dụng được" value={waste.activeCount} color="bg-green-500" />
                <StatCard icon={<Trash2 className="h-6 w-6 text-white" />} label="Đã hết hạn" value={waste.expiredCount} color="bg-red-400" />
                <StatCard icon={<BarChart2 className="h-6 w-6 text-white" />} label="Tỷ lệ lãng phí" value={`${waste.wasteRatio}%`} color="bg-amber-400" />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-[8px] bg-white p-5 shadow-card">
                  <h3 className="mb-4 font-extrabold text-[#3b2868]">Biểu đồ sử dụng vs lãng phí</h3>
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
                  <h3 className="mb-3 font-extrabold text-[#3b2868]">Thực phẩm đã hết hạn</h3>
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
                              {item.quantity} · {item.location} · Hết {item.expiry_date}
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
