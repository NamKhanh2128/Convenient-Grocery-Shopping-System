import { AlertCircle, CheckCircle2, Clock, Flame, Lightbulb, Play, Refrigerator, ScrollText, ShoppingCart, Star } from "lucide-react";
import { useT } from "@/shared/store/languageStore";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/modules/auth/store/authStore";
import { fridgeApi, type FridgeRow } from "@/modules/fridge/api/fridgeApi";
import { recipeApi, type RecipeDetail } from "@/modules/recipe/api/recipeApi";
import { shoppingApi, type ShoppingListDetail } from "@/modules/shopping/api/shoppingApi";
import { mealApi } from "@/modules/meal-plan/api/mealApi";
import { familyApi } from "@/modules/family/api/familyApi";
import type { FamilyActivity, MealPlanGroup, RecipeSuggestion, User } from "@/types";
import { daysUntil, formatDate, relativeTime, todayIso } from "@/shared/utils/date";
import { Button } from "@/components/ui/button";
import { AppModal } from "@/shared/components/AppModal";

export function DashboardPage() {
  const user = useAuthStore((state) => state.user)!;
  const family = useAuthStore((state) => state.family);
  const [fridge, setFridge] = useState<FridgeRow[]>([]);
  const [shopping, setShopping] = useState<ShoppingListDetail[]>([]);
  const [meals, setMeals] = useState<MealPlanGroup[]>([]);
  const [recipes, setRecipes] = useState<RecipeDetail[]>([]);
  const [suggestions, setSuggestions] = useState<RecipeSuggestion[]>([]);
  const [activities, setActivities] = useState<FamilyActivity[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [activityDetail, setActivityDetail] = useState<FamilyActivity | null>(null);
  const t = useT();

  useEffect(() => {
    if (!family) return;
    void Promise.all([
      fridgeApi.list(family.family_id).then(setFridge),
      shoppingApi.list(family.family_id).then(setShopping),
      mealApi.grouped(family.family_id).then(setMeals),
      recipeApi.list().then(setRecipes),
      recipeApi.suggestions(family.family_id).then(setSuggestions),
      familyApi.detail(family.family_id).then((data) => {
        setActivities([...data.activities].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 4));
        setMembers(data.members);
      }),
    ]);
  }, [family]);

  if (!family) {
    return (
      <div className="grid min-h-[calc(100vh-120px)] place-items-center rounded-[20px] bg-white p-8 text-center">
        <div>
          <h1 className="text-2xl font-extrabold text-[#5b368d]">Chưa có dữ liệu gia đình</h1>
          <p className="mt-2 text-sm text-[#746d82]">Vui lòng đăng nhập lại để tải thông tin người dùng.</p>
        </div>
      </div>
    );
  }

  const suggestion = suggestions[0];
  const activeList = shopping.find((list) => list.status === "DRAFT") ?? shopping[0];
  const expiring = fridge.filter((item) => daysUntil(item.expiry_date) <= 4).sort((a, b) => daysUntil(a.expiry_date) - daysUntil(b.expiry_date));

  function expiryLabel(days: number): string {
    if (days < 0) return "Đã hết hạn";
    if (days === 0) return "Hôm nay";
    return `${days} ngày`;
  }
  const todayMeals = meals.filter((item) => item.meal_date === todayIso());

  const mealCards = useMemo(() => todayMeals.map((meal) => ({
    meal,
    recipes: meal.recipe_ids.map((id) => recipes.find((recipe) => recipe.recipe_id === id)).filter(Boolean) as RecipeDetail[],
  })), [todayMeals, recipes]);

  const boughtCount = activeList?.items.filter((item) => item.item_status === "COMPLETED").length ?? 0;
  const progress = activeList?.items.length ? Math.round((boughtCount / activeList.items.length) * 100) : 0;

  return (
    <div className="-mx-4 -my-7 min-h-[calc(100vh-68px)] bg-[#66429c] px-4 pb-12 pt-8 sm:px-8">
      <section className="mx-auto max-w-[1324px]">
        <div className="mb-8 text-white">
          <h1 className="text-4xl font-extrabold tracking-normal md:text-5xl">Chào {user.full_name}!</h1>
          <p className="mt-4 text-lg text-white/72">Tủ lạnh: {fridge.length} món · {expiring.length} sắp hết hạn · {suggestions.length} món gợi ý hôm nay</p>
        </div>

        {suggestion && (
          <div className="relative overflow-hidden rounded-[28px] border border-white/12 bg-[#8468b0]/78 p-7 text-white shadow-[0_22px_55px_rgba(45,27,72,0.25)]">
            <div className="absolute left-[12%] top-[46%] h-36 w-36 rounded-full bg-white/7" />
            <div className="absolute left-[39%] top-0 h-44 w-44 rounded-full bg-[#c58b7f]/35" />
            <div className="relative grid gap-7 lg:grid-cols-[1.25fr_180px_445px] lg:items-center">
              <div>
                <span className="inline-flex rounded-full bg-[#b98493] px-5 py-2 text-xs font-extrabold uppercase tracking-wide">Gợi ý hôm nay</span>
                <h2 className="mt-5 max-w-xl text-4xl font-extrabold leading-tight">{suggestion.recipe.recipe_name}<br />từ nguyên liệu sẵn có</h2>
                <div className="mt-5 space-y-2 text-base">
                  <div className="flex gap-2"><CheckCircle2 className="h-5 w-5 text-[#34d77b]" />Có sẵn: {suggestion.available_food_ids.map((id) => fridge.find((f) => f.food_id === id)?.food.food_name).filter(Boolean).join(", ") || "Đang kiểm tra"}</div>
                  <div className="flex gap-2"><AlertCircle className="h-5 w-5 text-[#ff5d75]" />Còn thiếu: {suggestion.missing.map((item) => item.food.food_name).join(", ") || "Đủ nguyên liệu"}</div>
                </div>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Button asChild className="h-12 rounded-[10px] bg-[#ffad1f] px-7 font-bold hover:bg-[#f2a21a]"><Link to={`/recipes/${suggestion.recipe.recipe_id}`}>Xem công thức</Link></Button>
                </div>
              </div>
              <div className="space-y-6 border-l border-white/10 pl-6">
                <Metric icon={<Clock />} label="THỜI GIAN" value={`${suggestion.recipe.time_minutes} phút`} />
                <Metric icon={<Flame />} label="CALO" value={`${suggestion.recipe.calories} kcal`} />
                <Metric icon={<Star />} label="ĐỘ KHÓ" value={suggestion.recipe.difficulty} green />
              </div>
              <div className="relative overflow-hidden rounded-[20px] bg-black shadow-[0_22px_45px_rgba(0,0,0,0.3)]">
                <img className="h-[290px] w-full object-cover opacity-85" src={suggestion.recipe.image_url || ""} alt={suggestion.recipe.recipe_name} onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://placehold.co/400x300/7655AA/white?text=${encodeURIComponent(suggestion.recipe.recipe_name)}`; }} />
                <div className="absolute right-5 top-5 text-xs font-semibold">Món ăn ngon mỗi ngày</div>
                <div className="absolute bottom-20 left-6 text-2xl font-extrabold">{suggestion.recipe.recipe_name}</div>
                <button type="button" onClick={() => { window.location.href = `/recipes/${suggestion.recipe.recipe_id}`; }} className="absolute bottom-8 left-6 inline-flex items-center gap-2 rounded-full bg-[#22c972] px-5 py-2 text-sm font-bold"><Play className="h-4 w-4 fill-current" /> Xem hướng dẫn</button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_434px]">
          <section className="rounded-[20px] bg-[#ded7eb] p-6 shadow-card">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#9188a1]">{t("mealPlanSection")}</div>
            <h2 className="mt-2 text-xl font-extrabold">Thực đơn hôm nay</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {mealCards.map(({ meal, recipes: mealRecipes }) => (
                <div key={`${meal.meal_date}-${meal.meal_type}`} className="overflow-hidden rounded-[12px] bg-white shadow-sm">
                  <div className="relative h-36">
                    <img className="h-full w-full object-cover" src={mealRecipes[0]?.image_url || ""} alt={mealRecipes[0]?.recipe_name} onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://placehold.co/400x300/9B59B6/white?text=${encodeURIComponent(mealRecipes[0]?.recipe_name ?? "Món ăn")}`; }} />
                    <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-bold">{meal.meal_type}</span>
                    <span className="absolute bottom-3 right-3 rounded-full bg-[#36c977] px-3 py-1 text-xs font-bold text-white">Kế hoạch</span>
                    <div className="absolute bottom-3 left-3 right-24 truncate font-extrabold text-white drop-shadow">{mealRecipes.map((r) => r.recipe_name).join(", ")}</div>
                  </div>
                  <div className="space-y-1 p-3 text-xs text-[#766d86]">
                    <div>{members.length || 1} người</div>
                    <div>{meal.meal_type === "Trưa" ? "11:30" : meal.meal_type === "Tối" ? "18:00" : "Chưa đặt giờ"}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="space-y-5">
            {activeList && (
              <section className="rounded-[20px] bg-white p-6 shadow-card">
                <div className="flex items-center gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#4e6cf2] text-white"><ShoppingCart /></div>
                  <div><h3 className="text-lg font-extrabold">{activeList.title}</h3><p className="text-xs text-[#9188a1]">{activeList.items.length} items</p></div>
                </div>
                <div className="mt-6 flex items-center justify-between text-xs"><span className="text-[#9188a1]">{t("progress")}</span><b>{progress}%</b></div>
                <div className="mt-2 h-2 rounded-full bg-[#e8edf5]"><div className="h-full rounded-full bg-gradient-to-r from-[#3488ed] to-[#2ecf78]" style={{ width: `${progress}%` }} /></div>
                <div className="mt-6 space-y-3">
                  {activeList.items.slice(0, 5).map((item) => (
                    <div key={item.id} className={`flex items-center gap-3 rounded-[12px] px-4 py-3 ${item.item_status === "COMPLETED" ? "bg-[#f0f2f7] text-[#9a93a6] line-through" : "bg-white ring-1 ring-[#ebe8f0]"}`}>
                      <span className={`grid h-6 w-6 place-items-center rounded-full ${item.item_status === "COMPLETED" ? "bg-[#31c875] text-white" : "border border-[#d4d0dc]"}`}>{item.item_status === "COMPLETED" && "✓"}</span>
                      <span>{item.food.icon}</span>
                      <b className="text-sm">{item.food.food_name} ({item.quantity}{item.food.unit})</b>
                    </div>
                  ))}
                </div>
                <Link to={`/shopping/${activeList.shopping_list_id}`} className="mt-6 block rounded-[12px] bg-gradient-to-r from-[#3488ed] to-[#5659f0] py-3 text-center text-sm font-bold text-white">Xem tất cả</Link>
              </section>
            )}
            <section className="rounded-[20px] bg-white p-6 shadow-card">
              <div className="mb-4 flex items-center justify-between"><b className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-red-500" />Sắp hết hạn</b><Link to="/fridge" className="text-xs font-bold text-[#7655aa]">Mở tủ lạnh</Link></div>
              <div className="space-y-3">
                {expiring.slice(0, 2).map((item) => { const days = daysUntil(item.expiry_date); return <div key={item.fridge_item_id} className="flex items-center gap-3 rounded-[12px] bg-[#fff0f1] p-3"><span className="text-2xl">{item.food.icon}</span><div className="flex-1"><b>{item.food.food_name}</b><p className="text-xs text-[#9a5f66]">Hết hạn: {formatDate(item.expiry_date)}</p></div><span className={`rounded-[8px] px-3 py-2 text-xs font-bold text-white ${days < 0 ? "bg-[#6b7280]" : "bg-[#ef3d3d]"}`}>{expiryLabel(days)}</span></div>; })}
              </div>
            </section>
          </aside>
        </div>

        {/* Smart Insights */}
        {(expiring.length > 0 || fridge.length === 0) && (
          <section className="mt-6 rounded-[20px] bg-gradient-to-r from-[#7655aa] to-[#9b7cc9] p-6 text-white shadow-card">
            <div className="mb-4 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-[#ffbd2c]" />
              <span className="text-sm font-extrabold uppercase tracking-wide">Gợi ý thông minh</span>
            </div>
            <div className="space-y-3">
              {expiring.length > 0 && (
                <div className="flex items-start gap-3 rounded-xl bg-white/15 p-3">
                  <span className="mt-0.5 text-xl">⏰</span>
                  <p className="text-sm">
                    Sử dụng <strong>{expiring[0]?.food.food_name}</strong> trước ngày <strong>{expiring[0] ? expiring[0].expiry_date : ""}</strong> để tránh lãng phí.
                  </p>
                </div>
              )}
              {expiring.length > 2 && (
                <div className="flex items-start gap-3 rounded-xl bg-white/15 p-3">
                  <span className="mt-0.5 text-xl">🗑️</span>
                  <p className="text-sm">
                    Bạn có <strong>{expiring.length} thực phẩm</strong> sắp hết hạn. Lên kế hoạch bữa ăn để giảm lãng phí.
                  </p>
                </div>
              )}
              {fridge.length === 0 && (
                <div className="flex items-start gap-3 rounded-xl bg-white/15 p-3">
                  <span className="mt-0.5 text-xl">🛒</span>
                  <p className="text-sm">Tủ lạnh đang trống! Hãy tạo danh sách mua sắm để bổ sung thực phẩm.</p>
                </div>
              )}
            </div>
          </section>
        )}

        <section className="mt-6 rounded-[20px] bg-white p-6 shadow-card lg:w-[calc(100%-458px)]">
          <div className="inline-flex rounded-full bg-[#f0ecfb] px-3 py-1 text-xs font-bold text-[#7655aa]">{t("activityFeed")}</div>
          <h2 className="mt-4 text-xl font-extrabold">{t("activityFeed")}</h2>
          <p className="text-sm text-[#746d82]">{t("activityFeedSub")}</p>
          <div className="relative mt-6 space-y-4 pl-14">
            <div className="absolute bottom-0 left-6 top-2 w-px bg-[#e6e0ef]" />
            {activities.map((activity) => {
              const member = members.find((item) => item.user_id === activity.user_id);
              return (
                <button key={activity.id} type="button" onClick={() => setActivityDetail(activity)} className="relative w-full rounded-[14px] border border-[#eee9f5] p-4 text-left transition hover:border-[#cfc3e4] hover:bg-[#faf8fd]">
                  <div className="absolute -left-[46px] grid h-9 w-9 place-items-center rounded-full border-2 border-[#ffbd2c] bg-white"><ActivityIcon type={activity.action_type} /></div>
                  <div className="flex justify-between gap-3"><div><b className="text-[#e0a323]">{member?.full_name ?? "Thành viên"}</b> <span className="rounded-full bg-[#f5f3f8] px-2 py-1 text-xs text-[#9188a1]">thành viên</span></div><span className="text-xs text-[#9188a1]">{relativeTime(activity.created_at)}</span></div>
                  <p className="mt-2 text-sm">{activity.message}</p>
                </button>
              );
            })}
          </div>
        </section>
      </section>
      <AppModal open={Boolean(activityDetail)} onOpenChange={(open) => !open && setActivityDetail(null)} type="info" title="Chi tiết hoạt động" secondaryLabel="Đóng">
        {activityDetail && (
          <div className="space-y-2 text-sm">
            <DetailRow label={t("actorLabel")} value={members.find((item) => item.user_id === activityDetail.user_id)?.full_name ?? "Thành viên"} />
            <DetailRow label={t("actionLabel")} value={activityDetail.message} />
            <DetailRow label={t("targetLabel")} value={activityDetail.target ?? activityDetail.action_type} />
            <DetailRow label={t("quantityLabel")} value={activityDetail.quantity ? String(activityDetail.quantity) : "-"} />
            <DetailRow label={t("timestampLabel")} value={formatDate(activityDetail.created_at)} />
            <DetailRow label={t("statusLabel")} value={activityDetail.status ?? "done"} />
          </div>
        )}
      </AppModal>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 rounded-lg bg-[#f8f6fb] px-3 py-2">
      <span className="font-semibold text-[#746d82]">{label}</span>
      <span className="text-right text-[#3d3051]">{value}</span>
    </div>
  );
}

function Metric({ icon, label, value, green }: { icon: React.ReactNode; label: string; value: string; green?: boolean }) {
  return <div>{<span className="inline-flex h-4 w-4 align-middle [&_svg]:h-4 [&_svg]:w-4">{icon}</span>} <span className="text-xs font-bold text-white/55">{label}</span><div className={`mt-1 text-lg font-extrabold ${green ? "text-[#3cdd83]" : ""}`}>{value}</div></div>;
}

function ActivityIcon({ type }: { type: string }) {
  if (type === "shopping") return <ShoppingCart className="h-4 w-4 text-[#e0a323]" />;
  if (type === "fridge") return <Refrigerator className="h-4 w-4 text-[#4ba8ef]" />;
  return <ScrollText className="h-4 w-4 text-[#31c875]" />;
}
