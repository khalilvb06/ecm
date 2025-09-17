import Layout from "@/components/Layout";
import CategoryCard from "@/components/CategoryCard";
import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { resolveStoreId } from "@/lib/store";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 24;

async function fetchCategoriesPage(page: number) {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const storeId = await resolveStoreId();
  if (!storeId) return [];
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, image_url")
    .eq("store_id", storeId)
    .order("id", { ascending: true })
    .range(from, to);
  if (error) throw error;
  return data ?? [];
}

const CategoriesPage = () => {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["categories:infinite"],
    queryFn: ({ pageParam = 0 }) => fetchCategoriesPage(pageParam as number),
    getNextPageParam: (lastPage, allPages) => {
      const pageArray = Array.isArray(lastPage) ? lastPage : [];
      return pageArray.length >= PAGE_SIZE ? allPages.length : undefined;
    },
    initialPageParam: 0,
  });
  const categories = (data?.pages ?? []).flat();
  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4 heading-underline">جميع الفئات</h1>
          <p className="text-lg text-muted-foreground">
            اكتشف مجموعة متنوعة من المنتجات المصنفة حسب الفئة
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="product-card text-center">
                  <Skeleton className="aspect-square w-full rounded-lg mb-4" />
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-1/2 mx-auto" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              ))
            : categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
        </div>
        {!isLoading && categories.length > 0 && (
          <div className="flex justify-center mt-6">
            <button
              type="button"
              className="primary-button"
              onClick={() => fetchNextPage()}
              disabled={!hasNextPage || isFetchingNextPage}
            >
              {isFetchingNextPage ? "جاري التحميل..." : hasNextPage ? "عرض المزيد" : "لا مزيد من الفئات"}
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CategoriesPage;