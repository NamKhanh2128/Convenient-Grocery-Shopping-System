import { type FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  Save,
  ArrowLeft,
  Loader2,
  BookOpen,
  Plus,
  Trash2,
  ListOrdered,
  ChefHat,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import type { Food } from "@/types";
import { adminRecipeApi } from "@/api/adminRecipeApi";
import { adminFoodApi } from "@/api/adminFoodApi";
import { difficultyOptions } from "@/constants/options";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RecipeFormPageProps {
  mode: "create" | "edit";
}

interface IngredientItem {
  food_id: string;
  quantity: number;
}

export function RecipeFormPage({ mode }: RecipeFormPageProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // States
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [foods, setFoods] = useState<Food[]>([]);

  // Form Fields
  const [recipeName, setRecipeName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [timeMinutes, setTimeMinutes] = useState<number>(30);
  const [calories, setCalories] = useState<number>(350);
  const [difficulty, setDifficulty] = useState("Dễ làm");

  // Dynamic lists
  const [instructions, setInstructions] = useState<string[]>([""]);
  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);

  // Load Foods list & old recipe if edit mode
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const foodsData = await adminFoodApi.list();
        setFoods(foodsData);

        if (mode === "edit" && id) {
          const recipe = await adminRecipeApi.getById(id);
          setRecipeName(recipe.recipe_name);
          setDescription(recipe.description);
          setImageUrl(recipe.image_url || "");
          setTimeMinutes(recipe.time_minutes);
          setCalories(recipe.calories);
          setDifficulty(recipe.difficulty);
          setInstructions(recipe.instructions.length > 0 ? recipe.instructions : [""]);
          setIngredients(
            recipe.ingredients.map((ing) => ({
              food_id: ing.food_id,
              quantity: ing.quantity,
            }))
          );
        }
      } catch (error) {
        toast.error("Không thể tải dữ liệu.");
        navigate("/recipes");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [mode, id, navigate]);

  // Instructions management
  const handleAddStep = () => {
    setInstructions([...instructions, ""]);
  };

  const handleRemoveStep = (idx: number) => {
    const next = instructions.filter((_, i) => i !== idx);
    setInstructions(next.length === 0 ? [""] : next);
  };

  const handleStepChange = (idx: number, val: string) => {
    const next = [...instructions];
    next[idx] = val;
    setInstructions(next);
  };

  const handleMoveStep = (idx: number, direction: "up" | "down") => {
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === instructions.length - 1) return;

    const next = [...instructions];
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    const temp = next[idx]!;
    next[idx] = next[targetIdx]!;
    next[targetIdx] = temp;
    setInstructions(next);
  };

  // Ingredients management
  const handleAddIngredient = () => {
    if (foods.length === 0) return;
    const firstFoodId = foods[0]?.food_id || "";
    setIngredients([...ingredients, { food_id: firstFoodId, quantity: 100 }]);
  };

  const handleRemoveIngredient = (idx: number) => {
    setIngredients(ingredients.filter((_, i) => i !== idx));
  };

  const handleIngredientChange = (idx: number, key: keyof IngredientItem, val: any) => {
    const next = [...ingredients];
    const item = next[idx]!;
    if (key === "quantity") {
      item.quantity = Number(val);
    } else {
      item.food_id = String(val);
    }
    setIngredients(next);
  };

  // Submit form
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!recipeName.trim()) {
      toast.error("Vui lòng nhập tên công thức.");
      return;
    }

    const validSteps = instructions.map((s) => s.trim()).filter(Boolean);
    if (validSteps.length === 0) {
      toast.error("Vui lòng thêm ít nhất 1 bước thực hiện.");
      return;
    }

    if (ingredients.length === 0) {
      toast.error("Vui lòng cấu hình ít nhất 1 nguyên liệu.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        recipe_name: recipeName,
        description,
        image_url: imageUrl || undefined,
        time_minutes: timeMinutes,
        calories: calories,
        difficulty,
        instructions: validSteps,
      };

      if (mode === "create") {
        await adminRecipeApi.create(payload, ingredients);
        toast.success("Thêm công thức mới thành công!");
      } else if (mode === "edit" && id) {
        await adminRecipeApi.update(id, payload, ingredients);
        toast.success("Cập nhật công thức thành công!");
      }
      navigate("/recipes");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Đã xảy ra lỗi.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const breadcrumbs = [
    { label: "Quản lý công thức", to: "/recipes" },
    { label: mode === "create" ? "Thêm mới" : "Chỉnh sửa" },
  ];

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto animate-pulse">
        <div className="rounded-[20px] bg-card/60 p-6 shadow-card border border-border/40">
          <div className="h-4 w-1/3 rounded-lg bg-muted mb-2" />
          <div className="h-8 w-2/3 rounded-lg bg-muted mb-2" />
          <div className="h-3 w-1/2 rounded-lg bg-muted" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[20px] bg-card/60 p-6 shadow-card border border-border/40 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3 w-1/4 rounded bg-muted" />
                <div className="h-10 w-full rounded-[8px] bg-muted" />
              </div>
            ))}
          </div>
          <div className="space-y-6">
            <div className="rounded-[20px] bg-card/60 p-6 shadow-card border border-border/40 h-[250px]">
              <div className="h-4 w-1/3 rounded bg-muted mb-4" />
              <div className="h-3 w-full rounded bg-muted mb-2" />
              <div className="h-3 w-2/3 rounded bg-muted" />
            </div>
            <div className="rounded-[20px] bg-card/60 p-6 shadow-card border border-border/40 h-[250px]">
              <div className="h-4 w-1/3 rounded bg-muted mb-4" />
              <div className="h-3 w-full rounded bg-muted mb-2" />
              <div className="h-3 w-2/3 rounded bg-muted" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title={mode === "create" ? "Tạo Công Thức Mới" : "Cập Nhật Công Thức"}
        description={
          mode === "create"
            ? "Thêm một công thức món ăn mới đầy đủ thành phần dinh dưỡng và hướng dẫn chế biến chi tiết."
            : "Chỉnh sửa quy trình thực hiện, thành phần nguyên liệu hoặc hình ảnh của món ăn."
        }
        breadcrumbs={breadcrumbs}
      />

      <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
        {/* Left Column: General info card */}
        <div className="space-y-6 md:sticky md:top-[88px] self-start">
          <Card className="rounded-[20px] border-border/50 bg-card shadow-card overflow-hidden">
            <CardHeader className="border-b border-border/40 pb-4 flex flex-row items-center gap-3">
              <div className={`p-2 rounded-xl text-white ${mode === "create" ? "bg-primary" : "bg-[#ffb11f]"}`}>
                <ChefHat className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">Thông tin chung</CardTitle>
                <CardDescription className="text-xs">Thiết lập các chỉ số mô tả món ăn cơ bản.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {/* Recipe Name */}
              <div className="space-y-1.5">
                <Label htmlFor="recipe_name" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Tên món ăn <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="recipe_name"
                  placeholder="Ví dụ: Phở gà Hà Nội, Sườn xào chua ngọt..."
                  value={recipeName}
                  onChange={(e) => setRecipeName(e.target.value)}
                  className="h-10 rounded-[8px] font-sans"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Mô tả ngắn món ăn
                </Label>
                <Textarea
                  id="description"
                  placeholder="Nhập giới thiệu tóm tắt hương vị hoặc đặc điểm món ăn..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="rounded-xl min-h-[80px]"
                />
              </div>

              {/* Image URL */}
              <div className="space-y-1.5">
                <Label htmlFor="image_url" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Đường dẫn ảnh món ăn (URL)
                </Label>
                <Input
                  id="image_url"
                  placeholder="https://example.com/images/dish.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="h-10 rounded-[8px] font-sans"
                />
                {imageUrl && (
                  <div className="mt-2.5 h-32 w-full overflow-hidden rounded-xl border border-border/50 bg-muted flex items-center justify-center">
                    <img
                      src={imageUrl}
                      alt="Xem trước món ăn"
                      className="h-full w-full object-cover transition-all duration-300 hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Time & Calories */}
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="time" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Thời gian chuẩn bị
                  </Label>
                  <div className="relative">
                    <Input
                      id="time"
                      type="number"
                      value={timeMinutes}
                      onChange={(e) => setTimeMinutes(Number(e.target.value))}
                      className="h-10 rounded-[8px] font-sans pr-12"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-bold text-muted-foreground">phút</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="calories" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Giá trị dinh dưỡng
                  </Label>
                  <div className="relative">
                    <Input
                      id="calories"
                      type="number"
                      value={calories}
                      onChange={(e) => setCalories(Number(e.target.value))}
                      className="h-10 rounded-[8px] font-sans pr-12"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-bold text-muted-foreground">kcal</span>
                  </div>
                </div>
              </div>

              {/* Difficulty */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Mức độ chuẩn bị <span className="text-destructive">*</span>
                </Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger className="h-10 rounded-[8px] border-border bg-card font-semibold text-sm">
                    <SelectValue placeholder="Chọn độ khó..." />
                  </SelectTrigger>
                  <SelectContent>
                    {difficultyOptions.map((diff) => (
                      <SelectItem key={diff} value={diff} className="font-semibold text-xs">
                        {diff}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Steps & Ingredients */}
        <div className="space-y-6 flex flex-col">
          {/* Dynamic Ingredients Card */}
          <Card className="rounded-[20px] border-border/50 bg-card shadow-card overflow-hidden">
            <CardHeader className="border-b border-border/40 pb-4 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl text-white bg-teal-500">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">Thành phần nguyên liệu</CardTitle>
                  <CardDescription className="text-xs">
                    Lên danh sách nguyên liệu và định lượng tương ứng.
                  </CardDescription>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddIngredient}
                className="h-8 rounded-[8px] border-border bg-card text-xs font-bold hover:bg-teal-500/10 text-teal-600"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Thêm món
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              {ingredients.length === 0 ? (
                <div className="py-8 text-center text-xs font-bold text-muted-foreground border border-dashed border-border rounded-xl">
                  Chưa có nguyên liệu nào. Nhấp thêm nguyên liệu phía trên để thiết lập!
                </div>
              ) : (
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {ingredients.map((ing, idx) => {
                    const selectedFood = foods.find((f) => f.food_id === ing.food_id);
                    return (
                      <div key={idx} className="flex items-center gap-2 border-b border-border/40 pb-2 last:border-0 last:pb-0">
                        {/* Food Picker */}
                        <div className="flex-1 min-w-[130px]">
                          <Select
                            value={ing.food_id}
                            onValueChange={(val) => handleIngredientChange(idx, "food_id", val)}
                          >
                            <SelectTrigger className="h-9 rounded-[8px] border-border bg-card text-xs font-semibold">
                              <SelectValue placeholder="Chọn thực phẩm..." />
                            </SelectTrigger>
                            <SelectContent>
                              {foods.map((food) => (
                                <SelectItem key={food.food_id} value={food.food_id} className="text-xs">
                                  {food.icon} {food.food_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Quantity input */}
                        <div className="relative w-[110px] shrink-0">
                          <Input
                            type="number"
                            value={ing.quantity}
                            onChange={(e) => handleIngredientChange(idx, "quantity", e.target.value)}
                            className="h-9 rounded-[8px] text-xs font-semibold text-center pr-8"
                          />
                          <span className="absolute right-2.5 top-2 text-[10px] font-bold text-muted-foreground whitespace-nowrap">
                            {selectedFood?.unit ?? "g"}
                          </span>
                        </div>

                        {/* Remove button */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveIngredient(idx)}
                          className="h-9 w-9 text-destructive hover:bg-destructive/10 shrink-0"
                          title="Xóa nguyên liệu này"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dynamic Instructions Card */}
          <Card className="rounded-[20px] border-border/50 bg-card shadow-card overflow-hidden flex-1 flex flex-col justify-between">
            <div>
              <CardHeader className="border-b border-border/40 pb-4 flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl text-white bg-purple-500">
                    <ListOrdered className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold">Các bước thực hiện</CardTitle>
                    <CardDescription className="text-xs">
                      Hướng dẫn từng bước chế biến cụ thể và trực quan.
                    </CardDescription>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddStep}
                  className="h-8 rounded-[8px] border-border bg-card text-xs font-bold hover:bg-purple-500/10 text-purple-600"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Thêm bước
                </Button>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {instructions.map((step, idx) => (
                    <div key={idx} className="flex gap-2 items-start group">
                      {/* Step Indicator */}
                      <span className="h-8 w-8 rounded-full bg-purple-500/10 text-purple-600 flex items-center justify-center font-extrabold text-xs shrink-0">
                        {idx + 1}
                      </span>

                      {/* Step Input */}
                      <Textarea
                        value={step}
                        onChange={(e) => handleStepChange(idx, e.target.value)}
                        placeholder={`Mô tả bước thực hiện số ${idx + 1}...`}
                        className="rounded-xl min-h-[50px] flex-1 text-xs py-2"
                      />

                      {/* Step sorters */}
                      <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveStep(idx, "up")}
                          className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-30"
                          title="Lên trên"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === instructions.length - 1}
                          onClick={() => handleMoveStep(idx, "down")}
                          className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-30"
                          title="Xuống dưới"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Remove button */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={instructions.length === 1}
                        onClick={() => handleRemoveStep(idx)}
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0"
                        title="Xóa bước này"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </div>

            {/* Bottom Form Actions */}
            <div className="p-5 border-t border-border/40 bg-muted/10 flex items-center justify-end gap-3 rounded-b-[20px]">
              <Button
                type="button"
                variant="outline"
                className="rounded-[8px] h-10 px-4 flex items-center gap-1.5"
                onClick={() => navigate("/recipes")}
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lại
              </Button>

              <Button
                type="submit"
                disabled={saving}
                className="bg-[#7655aa] hover:bg-[#67489a] font-bold rounded-[8px] text-white flex items-center gap-1.5 h-10 px-5 transition-all duration-200"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <Save className="h-4 w-4 text-white" />
                )}
                {mode === "create" ? "Tạo công thức" : "Cập nhật"}
              </Button>
            </div>
          </Card>
        </div>
      </form>
    </div>
  );
}
export default RecipeFormPage;
