import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "@/modules/auth/store/authStore";
import { recipeApi } from "@/modules/recipe/api/recipeApi";
import { useRecipeStore } from "@/modules/recipe/store/recipeStore";
import { foodApi } from "@/shared/api/foodApi";
import { ScreenHeader } from "@/shared/components/ScreenHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Food } from "@/types";

type IngredientRow = {
  ten_nguyen_lieu: string;
  so_luong: string;
  don_vi: string;
  thuc_pham_id?: string;
  food_select: string;
};

const emptyIngredient = (): IngredientRow => ({
  ten_nguyen_lieu: "",
  so_luong: "",
  don_vi: "g",
  food_select: "manual",
});

export function RecipeFormPage() {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const isEdit = Boolean(editId);
  const family = useAuthStore((state) => state.family)!;
  const categories = useRecipeStore((state) => state.categories);
  const loadCategories = useRecipeStore((state) => state.load);

  const [foods, setFoods] = useState<Food[]>([]);
  const [loadingRecipe, setLoadingRecipe] = useState(isEdit);
  const [tieuDe, setTieuDe] = useState("");
  const [moTa, setMoTa] = useState("");
  const [huongDan, setHuongDan] = useState("");
  const [thoiGian, setThoiGian] = useState("30");
  const [khauPhan, setKhauPhan] = useState("2");
  const [hinhAnh, setHinhAnh] = useState("");
  const [danhMucId, setDanhMucId] = useState("");
  const [loaiQuyen, setLoaiQuyen] = useState<"PRIVATE" | "FAMILY">("PRIVATE");
  const [ingredients, setIngredients] = useState<IngredientRow[]>([emptyIngredient()]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void loadCategories(family.family_id);
    void foodApi.list().then(setFoods);
  }, [family.family_id, loadCategories]);

  useEffect(() => {
    if (!editId) return;
    setLoadingRecipe(true);
    void recipeApi
      .detail(editId, family.family_id)
      .then((recipe) => {
        if (recipe.loai_quyen === "SYSTEM") {
          toast.error("Không thể sửa công thức hệ thống.");
          navigate(`/recipes/${editId}`);
          return;
        }
        setTieuDe(recipe.recipe_name);
        setMoTa(recipe.description);
        setHuongDan(recipe.instructions.join("\n"));
        setThoiGian(String(recipe.time_minutes));
        setKhauPhan(String(recipe.khau_phan ?? 2));
        setHinhAnh(recipe.image_url || "");
        setDanhMucId(recipe.danh_muc_id || "");
        setLoaiQuyen(recipe.loai_quyen === "FAMILY" ? "FAMILY" : "PRIVATE");
        setIngredients(
          recipe.ingredients.length
            ? recipe.ingredients.map((item) => {
                const numericFood = /^\d+$/.test(item.food_id);
                return {
                  ten_nguyen_lieu: item.food.food_name,
                  so_luong: String(item.quantity || ""),
                  don_vi: item.food.unit,
                  thuc_pham_id: numericFood ? item.food_id : undefined,
                  food_select: numericFood ? item.food_id : "manual",
                };
              })
            : [emptyIngredient()],
        );
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Không tải được công thức");
        navigate("/recipes");
      })
      .finally(() => setLoadingRecipe(false));
  }, [editId, family.family_id, navigate]);

  function updateIngredient(index: number, patch: Partial<IngredientRow>) {
    const next = [...ingredients];
    next[index] = { ...next[index], ...patch };
    setIngredients(next);
  }

  function handleFoodSelect(index: number, value: string) {
    if (value === "manual") {
      updateIngredient(index, { food_select: "manual", thuc_pham_id: undefined });
      return;
    }
    const food = foods.find((item) => item.food_id === value);
    if (!food) return;
    updateIngredient(index, {
      food_select: value,
      thuc_pham_id: /^\d+$/.test(food.food_id) ? food.food_id : undefined,
      ten_nguyen_lieu: food.food_name,
      don_vi: food.unit,
    });
  }

  function buildPayload() {
    return {
      tieu_de: tieuDe.trim(),
      mo_ta: moTa.trim(),
      huong_dan: huongDan.trim(),
      thoi_gian_phut: Number(thoiGian) || 30,
      khau_phan: Number(khauPhan) || 2,
      hinh_anh_url: hinhAnh.trim() || undefined,
      danh_muc_id: danhMucId || undefined,
      loai_quyen: loaiQuyen,
      nguyen_lieu: ingredients
        .filter((row) => row.ten_nguyen_lieu.trim())
        .map((row) => ({
          ten_nguyen_lieu: row.ten_nguyen_lieu.trim(),
          so_luong: Number(row.so_luong) || undefined,
          don_vi: row.don_vi || undefined,
          thuc_pham_id: row.thuc_pham_id,
        })),
    };
  }

  async function handleSubmit() {
    if (!tieuDe.trim() || !huongDan.trim()) {
      toast.error("Vui lòng nhập tiêu đề và hướng dẫn nấu.");
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      const recipe = isEdit && editId
        ? await recipeApi.update(editId, payload, family.family_id)
        : await recipeApi.create(payload, family.family_id);
      toast.success(isEdit ? "Đã cập nhật công thức" : "Đã tạo công thức");
      navigate(`/recipes/${recipe.recipe_id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu công thức");
    } finally {
      setSaving(false);
    }
  }

  if (loadingRecipe) {
    return <ScreenHeader title="Đang tải công thức..." />;
  }

  return (
    <>
      <ScreenHeader
        title={isEdit ? "Sửa công thức" : "Thêm công thức"}
        subtitle="Lưu công thức riêng hoặc chia sẻ với gia đình"
      />
      <div className="mx-auto max-w-3xl space-y-4 rounded-[8px] bg-white p-6 shadow-card">
        <Input placeholder="Tiêu đề *" value={tieuDe} onChange={(e) => setTieuDe(e.target.value)} />
        <Textarea placeholder="Mô tả ngắn" value={moTa} onChange={(e) => setMoTa(e.target.value)} />
        <Textarea
          placeholder="Hướng dẫn nấu (mỗi bước một dòng) *"
          rows={6}
          value={huongDan}
          onChange={(e) => setHuongDan(e.target.value)}
        />
        <div className="grid gap-3 md:grid-cols-2">
          <Input type="number" placeholder="Thời gian (phút)" value={thoiGian} onChange={(e) => setThoiGian(e.target.value)} />
          <Input type="number" placeholder="Khẩu phần" value={khauPhan} onChange={(e) => setKhauPhan(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Input placeholder="URL hình ảnh (https://...)" value={hinhAnh} onChange={(e) => setHinhAnh(e.target.value)} />
          {hinhAnh.trim() && (
            <img
              src={hinhAnh}
              alt="Xem trước"
              className="h-40 w-full max-w-sm rounded-[8px] object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          )}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Select value={danhMucId || "none"} onValueChange={(v) => setDanhMucId(v === "none" ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Danh mục" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Không chọn</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.ten}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={loaiQuyen} onValueChange={(v) => setLoaiQuyen(v as "PRIVATE" | "FAMILY")}>
            <SelectTrigger>
              <SelectValue placeholder="Quyền riêng tư" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PRIVATE">Riêng tư</SelectItem>
              <SelectItem value="FAMILY">Gia đình</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <h3 className="mb-2 font-bold">Nguyên liệu</h3>
          <div className="space-y-2">
            {ingredients.map((row, index) => (
              <div key={index} className="grid gap-2 md:grid-cols-[180px_1fr_100px_100px_40px]">
                <Select value={row.food_select} onValueChange={(v) => handleFoodSelect(index, v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn thực phẩm" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Nhập tay</SelectItem>
                    {foods.map((food) => (
                      <SelectItem key={food.food_id} value={food.food_id}>
                        {food.icon} {food.food_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Tên nguyên liệu"
                  value={row.ten_nguyen_lieu}
                  disabled={row.food_select !== "manual"}
                  onChange={(e) => updateIngredient(index, { ten_nguyen_lieu: e.target.value })}
                />
                <Input
                  placeholder="SL"
                  value={row.so_luong}
                  onChange={(e) => updateIngredient(index, { so_luong: e.target.value })}
                />
                <Input
                  placeholder="Đơn vị"
                  value={row.don_vi}
                  onChange={(e) => updateIngredient(index, { don_vi: e.target.value })}
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setIngredients(ingredients.filter((_, i) => i !== index))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            className="mt-2"
            onClick={() => setIngredients([...ingredients, emptyIngredient()])}
          >
            <Plus className="mr-2 h-4 w-4" />
            Thêm nguyên liệu
          </Button>
        </div>

        <div className="flex gap-2 pt-2">
          <Button className="bg-[#31c875]" disabled={saving} onClick={() => void handleSubmit()}>
            {saving ? "Đang lưu..." : isEdit ? "Cập nhật" : "Lưu công thức"}
          </Button>
          <Button variant="outline" onClick={() => navigate(isEdit && editId ? `/recipes/${editId}` : "/recipes")}>
            Hủy
          </Button>
        </div>
      </div>
    </>
  );
}
