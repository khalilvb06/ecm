import { useParams, Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { resolveStoreId } from "@/lib/store";
import { Skeleton } from "@/components/ui/skeleton";

async function fetchCategory(id: string) {
  const storeId = await resolveStoreId();
  if (!storeId) return null;
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, image_url")
    .eq("id", id)
    .eq("store_id", storeId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

const PAGE_SIZE = 12;

async function fetchCategoryProductsPage(id: string, page: number) {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const storeId = await resolveStoreId();
  if (!storeId) return [];
  const { data, error } = await supabase
    .from("products")
    .select("id, name, price, image, category_id")
    .eq("store_id", storeId)
    .eq("category_id", Number(id))
    .is("available", true)
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) throw error;
  return data ?? [];
}

const CategoryPage = () => {
  const { id = "" } = useParams<{ id: string }>();
  const { data: category } = useQuery({
    queryKey: ["category", id],
    queryFn: () => fetchCategory(id),
    enabled: !!id,
  });
  const { data: productsPages, isLoading: loadingProducts, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["category:products", id],
    queryFn: ({ pageParam = 0 }) => fetchCategoryProductsPage(id, pageParam as number),
    getNextPageParam: (lastPage, allPages) => (lastPage.length === PAGE_SIZE ? allPages.length : undefined),
    enabled: !!id,
    initialPageParam: 0,
  });
  const categoryProducts = (productsPages?.pages ?? []).flat();

  if (!category) {
    return (
      <Layout>
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold mb-4">الفئة غير موجودة</h1>
          <Link to="/categories" className="primary-button inline-block">
            العودة للفئات
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 mb-8 text-sm">
          <Link to="/" className="text-muted-foreground hover:text-foreground">الرئيسية</Link>
          <ArrowRight className="w-4 h-4 text-muted-foreground rotate-180" />
          <Link to="/categories" className="text-muted-foreground hover:text-foreground">الفئات</Link>
          <ArrowRight className="w-4 h-4 text-muted-foreground rotate-180" />
          <span className="text-foreground font-medium">{category.name}</span>
        </nav>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">{category.name}</h1>
          <p className="text-lg text-muted-foreground">منتجات متاحة في هذه الفئة</p>
        </div>

        {loadingProducts ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="product-card">
                <Skeleton className="aspect-square w-full rounded-lg mb-4" />
                <div className="space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : categoryProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="flex justify-center mt-6">
              <button
                type="button"
                className="primary-button"
                onClick={() => fetchNextPage()}
                disabled={!hasNextPage || isFetchingNextPage}
              >
                {isFetchingNextPage ? "جاري التحميل..." : hasNextPage ? "عرض المزيد" : "لا مزيد من المنتجات"}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground mb-6">
              لا توجد منتجات في هذه الفئة حالياً
            </p>
            <Link to="/" className="primary-button inline-block">
              تصفح المنتجات الأخرى
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CategoryPage;