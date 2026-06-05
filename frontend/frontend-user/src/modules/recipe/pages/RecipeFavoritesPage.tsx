import { ChefHat, Heart } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "@/modules/auth/store/authStore";
import { useRecipeStore } from "@/modules/recipe/store/recipeStore";
import { ScreenHeader } from "@/shared/components/ScreenHeader";
import { Button } from "@/components/ui/button";

export function RecipeFavoritesPage() {
  const family = useAuthStore((state) => state.family)!;
  const { favorites, loading, error, loadFavorites, toggleFavorite } = useRecipeStore();

  useEffect(() => {
    void loadFavorites(family.family_id);
  }, [family.family_id, loadFavorites]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  return (
    <>
      <ScreenHeader
        title="Công thức yêu thích"
        subtitle="Các món bạn đã lưu để nấu lại nhanh"
        actions={
          <Button asChild variant="outline">
            <Link to="/recipes">Xem tất cả</Link>
          </Button>
        }
      />

      {loading ? (
        <div className="rounded-[8px] bg-white p-8 text-center shadow-card">Đang tải...</div>
      ) : favorites.length === 0 ? (
        <div className="rounded-[8px] bg-white p-8 text-center shadow-card">
          Chưa có công thức yêu thích. Nhấn <Heart className="inline h-4 w-4 text-red-500" /> trên danh sách công thức để lưu.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {favorites.map((recipe) => (
            <article key={recipe.recipe_id} className="overflow-hidden rounded-[8px] bg-white shadow-card">
              <Link to={`/recipes/${recipe.recipe_id}`}>
                <img
                  className="h-44 w-full object-cover"
                  src={recipe.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800"}
                  alt={recipe.recipe_name}
                />
              </Link>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <Link to={`/recipes/${recipe.recipe_id}`} className="font-extrabold hover:text-[#7655aa]">
                    {recipe.recipe_name}
                  </Link>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => void toggleFavorite(recipe.recipe_id, false, family.family_id)}
                  >
                    <Heart className="fill-red-500 text-red-500" />
                  </Button>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{recipe.description}</p>
                <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                  <ChefHat className="h-3.5 w-3.5" />
                  {recipe.time_minutes} phút · {recipe.ingredients.length} nguyên liệu
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
