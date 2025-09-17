import ProductCard from "@/components/ProductCard";
import CategoryCard from "@/components/CategoryCard";
import Layout from "@/components/Layout";
import Features from "@/components/Features";
import { useEffect, useMemo } from "react";
import { parseJson } from "@/lib/jsonb";
import { extractImages } from "@/lib/jsonb";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { resolveStoreId } from "@/lib/store";
import { Link, useLocation } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import LazyImage from "@/components/LazyImage";

const PAGE_SIZE = 12;

async function fetchProductsPage(page: number) {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const storeId = await resolveStoreId();
  if (!storeId) return [];
  const { data, error } = await supabase
    .from("products")
    .select("id, name, price, image, created_at, category_id")
    .eq("store_id", storeId)
    .is("available", true)
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) throw error;
  return data ?? [];
}

async function fetchCategories() {
  const storeId = await resolveStoreId();
  if (!storeId) return [];
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, image_url")
    .eq("store_id", storeId);
  if (error) throw error;
  return data ?? [];
}

async function fetchLandingPages() {
  const storeId = await resolveStoreId();
  if (!storeId) return [];
  const { data, error } = await supabase
    .from("landing_pages")
    .select("id, name, price, image")
    .eq("store_id", storeId)
    .is("available", true)
    .order("created_at", { ascending: false })
    .limit(8);
  if (error) throw error;
  return data ?? [];
}

async function fetchStoreSettings() {
  const storeId = await resolveStoreId();
  if (!storeId) return null;
  const { data, error } = await supabase
    .from("store_settings")
    .select("id, main_pixel, store_id")
    .eq("store_id", storeId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function fetchPixelById(pixelId: number) {
  const { data, error } = await supabase
    .from("ad_pixels")
    .select("id, pixel_name, pixel_code")
    .eq("id", Number(pixelId))
    .maybeSingle();
  if (error) throw error;
  return data;
}

function getLandingPrimaryImage(item: any): string {
  const images = extractImages(item?.image);
  if (Array.isArray(images) && images.length > 0) return images[0];
  if (typeof item?.image_url === "string") return item.image_url;
  if (Array.isArray(item?.images) && item.images.length > 0) return item.images[0];
  if (Array.isArray(item?.image_urls) && item.image_urls.length > 0) return item.image_urls[0];
  return "/placeholder.svg";
}

const Index = () => {
  const {
    data: productsPages,
    isLoading: loadingProducts,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["products:home"],
    queryFn: ({ pageParam = 0 }) => fetchProductsPage(pageParam as number),
    getNextPageParam: (lastPage, allPages) => (lastPage.length === PAGE_SIZE ? allPages.length : undefined),
    initialPageParam: 0,
  });
  const products = useMemo(() => (productsPages?.pages ?? []).flat(), [productsPages]);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const q = (searchParams.get("q") ?? "").trim();
  const filteredProducts = useMemo(() => {
    if (!q) return products;
    const lower = q.toLowerCase();
    return products.filter((p: any) => String(p?.name ?? "").toLowerCase().includes(lower));
  }, [products, q]);
  const { data: categories = [], isLoading: loadingCategories } = useQuery({ queryKey: ["categories:all"], queryFn: fetchCategories });
  const { data: landingPages = [], isLoading: loadingLanding } = useQuery({ queryKey: ["landing_pages:home"], queryFn: fetchLandingPages });
  const { data: settings } = useQuery({ queryKey: ["store_settings:main"], queryFn: fetchStoreSettings });
  const { data: mainPixel } = useQuery({
    queryKey: ["ad_pixel:main", (settings as any)?.main_pixel],
    queryFn: () => fetchPixelById((settings as any).main_pixel as number),
    enabled: !!(settings as any)?.main_pixel,
  });

  const pageViewTrackedRef = (window as any).__homePageViewTrackedRef || { current: false };
  (window as any).__homePageViewTrackedRef = pageViewTrackedRef;

  useEffect(() => {
    if (!mainPixel?.pixel_code) return;
    const raw = mainPixel.pixel_code as unknown;
    const parsed = parseJson<any>(raw, raw as any);
    const codeString: string | undefined = typeof parsed === "string" ? parsed : (parsed?.code ?? parsed?.html ?? parsed?.snippet ?? undefined);

    const collectPixelIdsFromAny = (value: any): string[] => {
      const results: string[] = [];
      const pushId = (v: any) => {
        const s = String(v || "").trim();
        if (/^\d{5,}$/.test(s)) results.push(s);
      };
      if (typeof value === "string") {
        if (/^\d{5,}$/.test(value.trim())) pushId(value.trim());
        const re = /fbq\(\s*["']init["']\s*,\s*["'](\d+)["']\s*\)/g;
        let m: RegExpExecArray | null;
        while ((m = re.exec(value)) !== null) pushId(m[1]);
      } else if (typeof value === "number") {
        pushId(value);
      } else if (value && typeof value === "object") {
        pushId(value.id);
        pushId(value.pixel_id);
        pushId(value.pixelId);
        if (Array.isArray(value.ids)) value.ids.forEach(pushId);
        if (value.code || value.html || value.snippet) {
          collectPixelIdsFromAny(String(value.code || value.html || value.snippet)).forEach(pushId);
        }
      }
      return Array.from(new Set(results));
    };

    const extractPixelIdsFromCode = (code: string): string[] => {
      const ids: string[] = [];
      const re = /fbq\(\s*["']init["']\s*,\s*["'](\d+)["']\s*\)/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(code)) !== null) {
        if (m[1]) ids.push(m[1]);
      }
      return Array.from(new Set(ids));
    };

    const ensureFbqBootstrap = () => {
      try {
        const w = window as any;
        if (typeof w.fbq === "function") return;
        const fbqShim: any = function() {
          (fbqShim as any).callMethod ? (fbqShim as any).callMethod.apply(fbqShim, arguments) : (fbqShim as any).queue.push(arguments);
        };
        (fbqShim as any).push = fbqShim;
        (fbqShim as any).loaded = true;
        (fbqShim as any).version = '2.0';
        (fbqShim as any).queue = [];
        w.fbq = fbqShim;
        w._fbq = fbqShim;
        const s = document.createElement('script');
        s.async = true;
        s.src = 'https://connect.facebook.net/en_US/fbevents.js';
        s.onerror = () => console.warn('Failed to load Facebook pixel script');
        const firstScript = document.getElementsByTagName('script')[0];
        if (firstScript && firstScript.parentNode) {
          firstScript.parentNode.insertBefore(s, firstScript);
        } else {
          (document.head || document.documentElement).appendChild(s);
        }
      } catch (error) {
        console.warn('Failed to bootstrap Facebook pixel:', error);
      }
    };

    const pixelIds = Array.from(new Set([
      ...collectPixelIdsFromAny(parsed),
      ...(codeString ? extractPixelIdsFromCode(codeString) : []),
    ]));

    if (pixelIds.length === 0 && codeString) {
      try {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.text = codeString;
        (document.head || document.documentElement).appendChild(script);
        return () => {
          try { script.parentNode?.removeChild(script); } catch {}
        };
      } catch (error) {
        console.warn('Failed to execute pixel code:', error);
      }
    }

    ensureFbqBootstrap();
    const w = window as any;
    pixelIds.forEach((pid) => { try { w.fbq('init', pid); } catch {} });
    if (!pageViewTrackedRef.current) {
      setTimeout(() => {
        try { w.fbq('track', 'PageView'); pageViewTrackedRef.current = true; } catch {}
      }, 0);
    }

    return;
  }, [mainPixel?.pixel_code]);

  return (
    <Layout>
      <div className="space-y-12">
        {/* New Hero Titles */}
        <section className="text-center px-4">
          <h1 className="text-2xl md:text-5xl leading-tight font-extrabold mb-6 heading-underline break-words mx-auto max-w-3xl">
            منتجاتنا أصلية و ذات جودة عالية
          </h1>
          <p className="mt-2 text-muted-foreground text-base md:text-lg">تصفح قائمة المنتجات الأكثر رواجا</p>
        </section>
        {/* Products Section */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-8 heading-underline">منتجاتنا المميزة</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {loadingProducts
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="product-card">
                    <Skeleton className="aspect-square w-full rounded-lg mb-4" />
                    <div className="space-y-3">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-6 w-1/3" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                ))
              : (filteredProducts ?? []).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
          </div>
          {!loadingProducts && (filteredProducts ?? []).length > 0 && (
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
          )}
        </section>

        {/* Categories Section */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-8 heading-underline">تسوق حسب الفئة</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {loadingCategories
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="product-card text-center">
                    <Skeleton className="aspect-square w-full rounded-lg mb-4" />
                    <div className="space-y-3">
                      <Skeleton className="h-6 w-1/2 mx-auto" />
                      <Skeleton className="h-4 w-1/3 mx-auto" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                ))
              : (categories ?? []).map((category) => (
                  <CategoryCard key={category.id} category={category} />
                ))}
          </div>
        </section>

        {/* Landing Pages Section */}
        {(loadingLanding || ((landingPages ?? []).length > 0)) && (
          <section>
            <h2 className="text-2xl md:text-3xl font-bold mb-8 heading-underline">منتجات بصفحات هبوط</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {loadingLanding
                ? Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="product-card">
                      <Skeleton className="aspect-square w-full rounded-lg mb-4" />
                      <div className="space-y-3">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-6 w-1/3" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    </div>
                  ))
                : (landingPages ?? []).map((lp: any) => (
                    <Link key={lp.id} to={`/landing/${lp.id}`} className="product-card group no-underline block">
                      <div className="aspect-square bg-muted rounded-lg mb-4 overflow-hidden">
                        <LazyImage
                          src={getLandingPrimaryImage(lp)}
                          alt={lp.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          skeletonClassName="w-full h-full"
                        />
                      </div>
                      <div className="space-y-3">
                        <h3 className="font-semibold text-lg text-foreground line-clamp-2">{lp.name}</h3>
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold text-primary">{Number(lp.price).toLocaleString()} دج</span>
                        </div>
                        <span className="primary-button w-full text-center block">اعرض الصفحة</span>
                      </div>
                    </Link>
                  ))}
            </div>
          </section>
        )}

        {/* Features Section */}
        <Features />
      </div>
    </Layout>
  );
};

export default Index;
