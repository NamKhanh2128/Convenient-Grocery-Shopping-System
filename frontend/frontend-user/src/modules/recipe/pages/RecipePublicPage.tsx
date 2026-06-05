import { ChefHat, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { recipeApi, type RecipeDetail } from "@/modules/recipe/api/recipeApi";
import { ScreenHeader } from "@/shared/components/ScreenHeader";
import { Input } from "@/components/ui/input";

export function RecipePublicPage() {
  const [recipes, setRecipes] = useState<RecipeDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    void recipeApi
      .listPublic()
      .then(setRecipes)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Không tải được công thức công khai"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = recipes.filter((r) =>
    !search.trim() || r.recipe_name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <>
      <ScreenHeader
        title="Khám phá công thức"
        subtitle="Công thức hệ thống — mọi người đều có thể xem"
        actions={
          <Link to="/recipes" className="text-sm font-semibold text-[#7655aa] hover:underline">
            Công thức của tôi →
          </Link>
        }
      />
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Tìm món..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {loading ? (
        <div className="rounded-[8px] bg-white p-8 text-center shadow-card">Đang tải...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((recipe) => (
            <article key={recipe.recipe_id} className="overflow-hidden rounded-[8px] bg-white shadow-card">
              <Link to={`/recipes/${recipe.recipe_id}`}>
                <img
                  className="h-44 w-full object-cover"
                  src={recipe.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800"}
                  alt={recipe.recipe_name}
                />
              </Link>
              <div className="p-4">
                <Link to={`/recipes/${recipe.recipe_id}`} className="font-extrabold hover:text-[#7655aa]">
                  {recipe.recipe_name}
                </Link>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{recipe.description}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <ChefHat className="h-3.5 w-3.5" />
                  {recipe.time_minutes} phút · {recipe.calories} kcal · {recipe.difficulty}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      {!loading && filtered.length === 0 && (
        <div className="rounded-[8px] bg-white p-8 text-center shadow-card">Không có công thức phù hợp.</div>
      )}
    </>
  );
}
