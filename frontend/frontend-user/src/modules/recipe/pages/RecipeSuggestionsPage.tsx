import { AlertCircle, CheckCircle2, ChefHat, ShoppingCart } from "lucide-react";

import { useEffect, useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import { toast } from "sonner";

import { useAuthStore } from "@/modules/auth/store/authStore";

import { missingToShoppingItems, recipeApi } from "@/modules/recipe/api/recipeApi";

import { useShoppingStore } from "@/modules/shopping/store/shoppingStore";

import { todayIso } from "@/shared/utils/date";

import { ScreenHeader } from "@/shared/components/ScreenHeader";

import { Button } from "@/components/ui/button";

import type { RecipeSuggestion } from "@/types";



export function RecipeSuggestionsPage() {

  const family = useAuthStore((state) => state.family)!;

  const user = useAuthStore((state) => state.user)!;

  const navigate = useNavigate();

  const [suggestions, setSuggestions] = useState<RecipeSuggestion[]>([]);

  const [loading, setLoading] = useState(true);

  const [busyId, setBusyId] = useState<string | null>(null);

  const createShoppingList = useShoppingStore((state) => state.create);



  useEffect(() => {

    setLoading(true);

    void recipeApi

      .suggestions(family.family_id)

      .then(setSuggestions)

      .catch((e) => toast.error(e instanceof Error ? e.message : "Không tải được gợi ý"))

      .finally(() => setLoading(false));

  }, [family.family_id]);



  async function createShopping(recipeId: string) {

    const item = suggestions.find((row) => row.recipe.recipe_id === recipeId);

    if (!item?.missing.length) {

      toast.error("Không thiếu nguyên liệu để tạo danh sách mua.");

      return;

    }

    setBusyId(recipeId);

    try {

      const list = await createShoppingList({

        family_id: family.family_id,

        title: `Mua thêm cho: ${item.recipe.recipe_name}`,

        plan_date: todayIso(),

        list_type: "daily",

        created_by: user.user_id,

        items: missingToShoppingItems(item.missing),

      });

      toast.success(`Đã thêm ${item.missing.length} thực phẩm thiếu vào danh sách mua sắm.`);

      navigate("/shopping", { state: { highlightId: list.shopping_list_id } });

    } catch (e) {

      toast.error(e instanceof Error ? e.message : "Không thể tạo danh sách mua");

    } finally {

      setBusyId(null);

    }

  }



  return (

    <>

      <ScreenHeader

        title="Gợi ý từ tủ lạnh"

        subtitle="Món có thể nấu dựa trên nguyên liệu đang có — ưu tiên món thiếu ít nhất"

      />

      {loading ? (

        <div className="rounded-[8px] bg-white p-8 text-center shadow-card">Đang phân tích tủ lạnh...</div>

      ) : (

        <div className="grid gap-4">

          {suggestions.map((item) => (

            <section key={item.recipe.recipe_id} className="rounded-[8px] bg-white p-5 shadow-card">

              <div className="flex flex-wrap items-start justify-between gap-4">

                <div className="min-w-[240px] flex-1">

                  <Link to={`/recipes/${item.recipe.recipe_id}`} className="text-xl font-extrabold hover:text-[#7655aa]">

                    {item.recipe.recipe_name}

                  </Link>

                  <p className="mt-1 text-sm text-muted-foreground">{item.recipe.description}</p>

                  <div className="mt-2 flex flex-wrap gap-3 text-xs">

                    <span className="flex items-center gap-1 text-[#31c875]">

                      <CheckCircle2 className="h-3.5 w-3.5" />

                      Có: {item.available_food_ids.length} loại

                    </span>

                    <span className="flex items-center gap-1 text-[#ff5d75]">

                      <AlertCircle className="h-3.5 w-3.5" />

                      Thiếu: {item.missing.length} loại

                    </span>

                    <span className="flex items-center gap-1 text-muted-foreground">

                      <ChefHat className="h-3.5 w-3.5" />

                      {item.recipe.time_minutes} phút

                    </span>

                  </div>

                  {item.missing.length > 0 && (

                    <p className="mt-2 text-sm text-[#746d82]">

                      Cần mua: {item.missing.map((m) => m.food.food_name).join(", ")}

                    </p>

                  )}

                </div>

                <div className="flex flex-wrap gap-2">

                  <Button asChild variant="outline">

                    <Link to={`/recipes/${item.recipe.recipe_id}`}>Xem công thức</Link>

                  </Button>

                  {item.missing.length > 0 && (

                    <Button

                      className="bg-[#ffb11f]"

                      disabled={busyId === item.recipe.recipe_id}

                      onClick={() => void createShopping(item.recipe.recipe_id)}

                    >

                      <ShoppingCart className="mr-2 h-4 w-4" />

                      Tạo list mua

                    </Button>

                  )}

                </div>

              </div>

            </section>

          ))}

        </div>

      )}

      {!loading && suggestions.length === 0 && (

        <div className="rounded-[8px] bg-white p-8 text-center shadow-card">

          Chưa có gợi ý — hãy thêm nguyên liệu vào tủ lạnh hoặc tạo công thức mới.

        </div>

      )}

    </>

  );

}

