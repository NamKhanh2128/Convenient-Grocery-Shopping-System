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
  Globe,
} from "lucide-react";
import type { Unit, FoodCategory } from "@/types";
import { adminRecipeApi, type IngredientInput, type RecipePayload } from "@/api/adminRecipeApi";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  name: string;
  quantity: number;
  unit_id: number | null;
  category_id: number | null;
}

const NO_CATEGORY = "none";

export function RecipeFormPage({ mode }: RecipeFormPageProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // States
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);
  const [categories, setCategories] = useState<FoodCategory[]>([]);

  // Form Fields
  const [nameVi, setNameVi] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [description, setDescription] = useState("");
  const [prepTime, setPrepTime] = useState<number>(15);
  const [cookTime, setCookTime] = useState<number>(30);
  const [servings, setServings] = useState<number>(4);
  const [isPublic, setIsPublic] = useState(true);

  // Dynamic lists
  const [instructions, setInstructions] = useState<string[]>([""]);
  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);

  // Load reference data (units/categories) & old recipe if edit mode
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [unitsData, categoriesData] = await Promise.all([
          adminRecipeApi.getUnits(),
          adminRecipeApi.getCategories(),
        ]);
        setUnits(unitsData);
        setCategories(categoriesData);

        if (mode === "edit" && id) {
          const recipe = await adminRecipeApi.getById(Number(id));
          setNameVi(recipe.name_vi);
          setNameEn(recipe.name_en);
          setDescription(recipe.description ?? "");
          setPrepTime(recipe.prep_time ?? 0);
          setCookTime(recipe.cook_time ?? 0);
          setServings(recipe.servings ?? 0);
          setIsPublic(recipe.is_public ?? true);
          const steps = recipe.instructions ? recipe.instructions.split("\n") : [];
          setInstructions(steps.length > 0 ? steps : [""]);
          setIngredients(
            recipe.ingredients.map((ing) => ({
              name: ing.name,
              quantity: ing.quantity,
              unit_id: ing.unit_id,
              category_id: ing.category_id,
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
    if (units.length === 0) {
      toast.error("Hệ thống chưa có đơn vị tính nào để lựa chọn.");
      return;
    }
    setIngredients([...ingredients, { name: "", quantity: 1, unit_id: units[0]?.id ?? null, category_id: null }]);
  };

  const handleRemoveIngredient = (idx: number) => {
    setIngredients(ingredients.filter((_, i) => i !== idx));
  };

  const handleIngredientChange = (idx: number, key: keyof IngredientItem, val: string) => {
    const next = [...ingredients];
    const item = { ...next[idx]! };
    if (key === "quantity") {
      item.quantity = Number(val);
    } else if (key === "unit_id") {
      item.unit_id = val ? Number(val) : null;
    } else if (key === "category_id") {
      item.category_id = val === NO_CATEGORY ? null : Number(val);
    } else {
      item.name = val;
    }
    next[idx] = item;
    setIngredients(next);
  };

  // Submit form
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!nameVi.trim() || !nameEn.trim()) {
      toast.error("Vui lòng nhập tên công thức (Tiếng Việt và Tiếng Anh).");
      return;
    }

    const validSteps = instructions.map((s) => s.trim()).filter(Boolean);
    if (validSteps.length === 0) {
      toast.error("Vui lòng thêm ít nhất 1 bước thực hiện.");
      return;
    }

    if (ingredients.length === 0) {
      toast.error("Vui lòng thêm ít nhất 1 nguyên liệu.");
      return;
    }

    for (const ing of ingredients) {
      if (!ing.name.trim()) {
        toast.error("Vui lòng nhập tên cho tất cả nguyên liệu.");
        return;
      }
      if (!ing.unit_id) {
        toast.error(`Vui lòng chọn đơn vị tính cho nguyên liệu "${ing.name}".`);
        return;
      }
    }

    setSaving(true);

    try {
      const ingredientPayload: IngredientInput[] = ingredients.map((ing) => ({
        name: ing.name.trim(),
        quantity: ing.quantity,
        unit_id: ing.unit_id as number,
        category_id: ing.category_id,
      }));

      if (mode === "create") {
        const payload: RecipePayload = {
          name_vi: nameVi.trim(),
          name_en: nameEn.trim(),
          description: description.trim() || null,
          instructions: validSteps.join("\n"),
          prep_time: prepTime,
          cook_time: cookTime,
          servings: servings,
          is_public: isPublic,
          created_by: null,
        };
        await adminRecipeApi.create(payload, ingredientPayload);
        toast.success("Thêm công thức mới thành công!");
      } else if (mode === "edit" && id) {
        const payload: Partial<RecipePayload> = {
          name_vi: nameVi.trim(),
          name_en: nameEn.trim(),
          description: description.trim() || null,
          instructions: validSteps.join("\n"),
          prep_time: prepTime,
          cook_time: cookTime,
          servings: servings,
          is_public: isPublic,
        };
        await adminRecipeApi.update(Number(id), payload, ingredientPayload);
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
            : "Chỉnh sửa quy trình thực hiện, thành phần nguyên liệu hoặc thông tin chung của món ăn."
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
              {/* Recipe Name (VI) */}
              <div className="space-y-1.5">
                <Label htmlFor="name_vi" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Tên món ăn (Tiếng Việt) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name_vi"
                  placeholder="Ví dụ: Phở gà Hà Nội..."
                  value={nameVi}
                  onChange={(e) => setNameVi(e.target.value)}
                  className="h-10 rounded-[8px] font-sans"
                />
              </div>

              {/* Recipe Name (EN) */}
              <div className="space-y-1.5">
                <Label htmlFor="name_en" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Tên món ăn (Tiếng Anh) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name_en"
                  placeholder="E.g.: Hanoi chicken noodle soup..."
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
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

              {/* Prep & Cook time */}
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="prep_time" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Thời gian chuẩn bị
                  </Label>
                  <div className="relative">
                    <Input
                      id="prep_time"
                      type="number"
                      min={0}
                      value={prepTime}
                      onChange={(e) => setPrepTime(Number(e.target.value))}
                      className="h-10 rounded-[8px] font-sans pr-12"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-bold text-muted-foreground">phút</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cook_time" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Thời gian nấu
                  </Label>
                  <div className="relative">
                    <Input
                      id="cook_time"
                      type="number"
                      min={0}
                      value={cookTime}
                      onChange={(e) => setCookTime(Number(e.target.value))}
                      className="h-10 rounded-[8px] font-sans pr-12"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-bold text-muted-foreground">phút</span>
                  </div>
                </div>
              </div>

              {/* Servings */}
              <div className="space-y-1.5">
                <Label htmlFor="servings" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Khẩu phần ăn
                </Label>
                <div className="relative">
                  <Input
                    id="servings"
                    type="number"
                    min={0}
                    value={servings}
                    onChange={(e) => setServings(Number(e.target.value))}
                    className="h-10 rounded-[8px] font-sans pr-16"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-muted-foreground">phần ăn</span>
                </div>
              </div>

              {/* Visibility */}
              <div className="flex items-center gap-2.5 py-2 border-t border-border/40">
                <Checkbox
                  id="is_public"
                  checked={isPublic}
                  onCheckedChange={(checked) => setIsPublic(Boolean(checked))}
                />
                <Label htmlFor="is_public" className="text-xs font-bold text-foreground cursor-pointer select-none flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-emerald-600" />
                  Công khai cho tất cả người dùng
                </Label>
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
                    Lên danh sách nguyên liệu, định lượng và đơn vị tính tương ứng.
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
                <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                  {ingredients.map((ing, idx) => (
                    <div key={idx} className="space-y-2 border border-border/40 rounded-xl p-3">
                      <div className="flex items-center gap-2">
                        {/* Ingredient name */}
                        <Input
                          placeholder="Tên nguyên liệu (vd: Thịt bò)..."
                          value={ing.name}
                          onChange={(e) => handleIngredientChange(idx, "name", e.target.value)}
                          className="flex-1 h-9 rounded-[8px] text-xs font-semibold"
                        />
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

                      <div className="grid grid-cols-3 gap-2">
                        {/* Quantity input */}
                        <Input
                          type="number"
                          min={0}
                          placeholder="Số lượng"
                          value={ing.quantity}
                          onChange={(e) => handleIngredientChange(idx, "quantity", e.target.value)}
                          className="h-9 rounded-[8px] text-xs font-semibold text-center"
                        />

                        {/* Unit picker (required) */}
                        <Select
                          value={ing.unit_id !== null ? String(ing.unit_id) : ""}
                          onValueChange={(val) => handleIngredientChange(idx, "unit_id", val)}
                        >
                          <SelectTrigger className="h-9 rounded-[8px] border-border bg-card text-xs font-semibold">
                            <SelectValue placeholder="Đơn vị *" />
                          </SelectTrigger>
                          <SelectContent>
                            {units.map((unit) => (
                              <SelectItem key={unit.id} value={String(unit.id)} className="text-xs">
                                {unit.symbol} ({unit.name})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Category picker (optional) */}
                        <Select
                          value={ing.category_id !== null ? String(ing.category_id) : NO_CATEGORY}
                          onValueChange={(val) => handleIngredientChange(idx, "category_id", val)}
                        >
                          <SelectTrigger className="h-9 rounded-[8px] border-border bg-card text-xs font-semibold">
                            <SelectValue placeholder="Danh mục" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NO_CATEGORY} className="text-xs">
                              Không phân loại
                            </SelectItem>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={String(cat.id)} className="text-xs">
                                {cat.name_vi}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
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
