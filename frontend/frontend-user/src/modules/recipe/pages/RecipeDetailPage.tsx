import { ChefHat, Clock, Edit, Flame, Heart, PackageMinus, ShoppingCart, Star, Users } from "lucide-react";

import { useEffect, useState, type ReactNode } from "react";

import { useNavigate, useParams } from "react-router-dom";

import { toast } from "sonner";

import { useAuthStore } from "@/modules/auth/store/authStore";

import { ScreenHeader } from "@/shared/components/ScreenHeader";

import { AppModal } from "@/shared/components/AppModal";

import { Button } from "@/components/ui/button";

import { missingToShoppingItems, recipeApi, type RecipeDetail } from "@/modules/recipe/api/recipeApi";

import { useShoppingStore } from "@/modules/shopping/store/shoppingStore";

import type { RecipeSuggestion } from "@/types";

import { todayIso } from "@/shared/utils/date";



export function RecipeDetailPage() {

  const { id } = useParams();

  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user)!;

  const family = useAuthStore((state) => state.family)!;

  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);

  const [suggestion, setSuggestion] = useState<RecipeSuggestion | null>(null);

  const [busy, setBusy] = useState(false);

  const [cookingOpen, setCookingOpen] = useState(false);

  const [cookingStep, setCookingStep] = useState(0);

  const createShoppingList = useShoppingStore((state) => state.create);

  useEffect(() => {

    if (!id) return;

    void Promise.all([

      recipeApi.detail(id, family.family_id),

      recipeApi.getMissing(id, family.family_id),

    ]).then(([recipeData, missingData]) => {

      setRecipe(recipeData);

      setSuggestion({

        recipe: missingData.recipe,

        available_food_ids: missingData.available_food_ids,

        missing: missingData.missing,

      });

    }).catch(() => {

      void recipeApi.detail(id, family.family_id).then(setRecipe);

    });

  }, [id, family.family_id]);



  async function handleMarkCooked() {

    if (!recipe) return;

    if (hasMissing) {

      toast.error(

        `Tủ lạnh chưa đủ nguyên liệu. Thiếu: ${suggestion?.missing.map((item) => item.food.food_name).join(", ") || "một số món"}. Hãy mua thêm hoặc bổ sung tủ lạnh trước.`,

      );

      return;

    }

    setBusy(true);

    try {

      await recipeApi.markCooked(family.family_id, recipe.recipe_id);

      toast.success("Đã nấu ăn và cập nhật lại nguyên liệu trong tủ lạnh.");

    } catch (error) {

      toast.error(error instanceof Error ? error.message : "Không thể cập nhật tủ lạnh");

    } finally {

      setBusy(false);

    }

  }



  async function handleCreateShoppingList() {

    if (!recipe) return;

    setBusy(true);

    try {

      let missing = suggestion?.missing ?? [];

      if (!missing.length) {

        const fresh = await recipeApi.getMissing(recipe.recipe_id, family.family_id);

        missing = fresh.missing;

        setSuggestion({

          recipe: fresh.recipe,

          available_food_ids: fresh.available_food_ids,

          missing: fresh.missing,

        });

      }

      if (!missing.length) {

        toast.error("Không thiếu nguyên liệu để tạo danh sách mua.");

        return;

      }

      const list = await createShoppingList({

        family_id: family.family_id,

        title: `Mua thêm cho: ${recipe.recipe_name}`,

        plan_date: todayIso(),

        list_type: "daily",

        created_by: user.user_id,

        items: missingToShoppingItems(missing),

      });

      toast.success(`Đã thêm ${missing.length} thực phẩm thiếu vào danh sách mua sắm.`);

      navigate("/shopping", { state: { highlightId: list.shopping_list_id } });

    } catch (error) {

      toast.error(error instanceof Error ? error.message : "Không thể tạo danh sách mua");

    } finally {

      setBusy(false);

    }

  }



  async function handleToggleFavorite() {

    if (!recipe) return;

    const next = !recipe.is_favorite;

    try {

      await recipeApi.toggleFavorite(recipe.recipe_id, next);

      setRecipe({ ...recipe, is_favorite: next });

      toast.success(next ? "Đã thêm vào yêu thích" : "Đã bỏ yêu thích");

    } catch (error) {

      toast.error(error instanceof Error ? error.message : "Không thể cập nhật yêu thích");

    }

  }



  function startCooking() {

    setCookingStep(0);

    setCookingOpen(true);

  }



  if (!recipe) return <ScreenHeader title="Đang tải công thức" />;



  const canEdit = recipe.loai_quyen !== "SYSTEM";

  const hasMissing = (suggestion?.missing.length ?? 0) > 0;

  const steps = recipe.instructions;

  const isLastStep = cookingStep >= steps.length - 1;



  return (

    <>

      <ScreenHeader

        title={recipe.recipe_name}

        subtitle={recipe.description}

        actions={

          <div className="flex flex-wrap gap-2">

            <Button variant="outline" onClick={() => void handleToggleFavorite()}>

              <Heart className={recipe.is_favorite ? "mr-2 h-4 w-4 fill-red-500 text-red-500" : "mr-2 h-4 w-4"} />

              {recipe.is_favorite ? "Đã thích" : "Yêu thích"}

            </Button>

            {canEdit && (

              <Button variant="outline" onClick={() => navigate(`/recipes/edit/${recipe.recipe_id}`)}>

                <Edit className="mr-2 h-4 w-4" />

                Sửa

              </Button>

            )}

            <Button disabled={busy} onClick={() => void handleMarkCooked()} className="bg-[#31c875]">

              <PackageMinus className="mr-2 h-4 w-4" />

              Sau khi nấu

            </Button>

          </div>

        }

      />

      <section className="grid gap-6 lg:grid-cols-[420px_1fr]">

        <img

          className="h-80 w-full rounded-[8px] object-cover shadow-card"

          src={recipe.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800"}

          alt={recipe.recipe_name}

        />

        <div className="rounded-[8px] bg-white p-6 shadow-card">

          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">

            <Metric icon={<Clock className="h-4 w-4" />} label="Thời gian" value={`${recipe.time_minutes} phút`} />

            <Metric icon={<Flame className="h-4 w-4" />} label="Calo" value={`${recipe.calories} kcal`} />

            <Metric icon={<Star className="h-4 w-4" />} label="Độ khó" value={recipe.difficulty} />

            <Metric icon={<Users className="h-4 w-4" />} label="Khẩu phần" value={`${recipe.khau_phan ?? 2} người`} />

          </div>



          <h3 className="font-extrabold">Nguyên liệu</h3>

          <ul className="mt-3 space-y-2">

            {recipe.ingredients.map((item) => (

              <li key={item.id} className="rounded-[8px] bg-[#f8f6fb] p-3">

                {item.food.icon} {item.food.food_name}: {item.quantity} {item.food.unit}

              </li>

            ))}

          </ul>

          <div className="mt-4 rounded-[8px] bg-[#fbfacb] p-3 text-sm">

            <b>Gợi ý mua thêm:</b>{" "}

            {suggestion?.missing.map((item) => item.food.food_name).join(", ") || "Không thiếu nguyên liệu"}

          </div>

          {hasMissing && (

            <Button

              className="mt-3 bg-[#ffb11f]"

              disabled={busy}

              onClick={() => void handleCreateShoppingList()}

            >

              <ShoppingCart className="mr-2 h-4 w-4" />

              Tạo danh sách mua thiếu

            </Button>

          )}

          <h3 className="mt-6 font-extrabold">Hướng dẫn chế biến</h3>

          <ol className="mt-3 space-y-2">

            {recipe.instructions.map((step, index) => (

              <li key={`${index}-${step}`} className="flex gap-3">

                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#7655aa] text-xs font-bold text-white">

                  {index + 1}

                </span>

                {step}

              </li>

            ))}

          </ol>

          <Button className="mt-6 bg-[#ffb11f]" onClick={startCooking}>

            <ChefHat className="mr-2 h-4 w-4" />

            Bắt đầu nấu

          </Button>

        </div>

      </section>



      <AppModal

        open={cookingOpen}

        onOpenChange={setCookingOpen}

        type="confirm"

        title={`Bước ${cookingStep + 1}/${steps.length}`}

        primaryLabel={isLastStep ? "Hoàn tất nấu" : "Bước tiếp"}

        secondaryLabel={cookingStep > 0 ? "Quay lại" : "Đóng"}

        onPrimary={() => {

          if (isLastStep) {

            setCookingOpen(false);

            void handleMarkCooked();

          } else {

            setCookingStep((s) => s + 1);

          }

        }}

        onSecondary={() => {

          if (cookingStep > 0) setCookingStep((s) => s - 1);

          else setCookingOpen(false);

        }}

      >

        <div className="space-y-3">

          <p className="text-base leading-relaxed">{steps[cookingStep]}</p>

          <div className="h-2 rounded-full bg-[#eee9f7]">

            <div

              className="h-full rounded-full bg-[#7655aa] transition-all"

              style={{ width: `${((cookingStep + 1) / steps.length) * 100}%` }}

            />

          </div>

        </div>

      </AppModal>

    </>

  );

}



function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {

  return (

    <div className="rounded-[8px] bg-[#f8f6fb] p-3 text-center">

      <div className="mx-auto mb-1 flex justify-center text-[#7655aa]">{icon}</div>

      <div className="text-xs text-muted-foreground">{label}</div>

      <div className="text-sm font-bold">{value}</div>

    </div>

  );

}

