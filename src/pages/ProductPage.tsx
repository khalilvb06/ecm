import { useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowRight, ShoppingCart, Star, ChevronLeft, ChevronRight } from "lucide-react";
import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
// Removed mock locations and static delivery price in favor of DB-driven data
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { resolveStoreId } from "@/lib/store";
import { extractImages, extractColors, extractSizes, extractOffers } from "@/lib/jsonb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import LazyImage from "@/components/LazyImage";
import { parseJson } from "@/lib/jsonb";
import { getMunicipalitiesByStateId } from "@/data/dzMunicipalities";

async function fetchProduct(id: string) {
  const storeId = await resolveStoreId();
  if (!storeId) return null;
  const { data, error } = await supabase
    .from("products")
    .select("id, name, descr, price, image, colors, sizes, offers, category_id, available, pixel")
    .eq("id", Number(id))
    .eq("store_id", storeId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function fetchRelatedProducts(categoryId: number | string, excludeId: string | number) {
  const storeId = await resolveStoreId();
  if (!storeId) return [];
  const { data, error } = await supabase
    .from("products")
    .select("id, name, price, image, category_id")
    .eq("store_id", storeId)
    .eq("category_id", categoryId)
    .neq("id", excludeId)
    .is("available", true)
    .limit(8);
  if (error) throw error;
  return data ?? [];
}

async function fetchShippingStates() {
  const storeId = await resolveStoreId();
  if (!storeId) return [];
  const { data, error } = await supabase
    .from("store_shipping_prices")
    .select("state_id, home_delivery_price, office_delivery_price, is_available, shipping_states(id, state_name)")
    .eq("store_id", storeId)
    .order("state_id", { ascending: true });
  if (error) throw error;
  // Map to shape used by UI
  return (data ?? []).map((row: any) => ({
    id: row.state_id,
    state_name: row.shipping_states?.state_name ?? "",
    home_delivery_price: row.home_delivery_price,
    office_delivery_price: row.office_delivery_price,
    is_available: row.is_available,
  }));
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

async function fetchMunicipalities(stateId: number) {
  // Use local static communes dataset keyed by shipping state id
  return getMunicipalitiesByStateId(Number(stateId));
}

const ProductPage = () => {
  const { id = "" } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { data: product, isLoading: loadingProduct } = useQuery({ queryKey: ["product", id], queryFn: () => fetchProduct(id), enabled: !!id });
  const navigate = useNavigate();
  const { data: relatedProducts = [] } = useQuery({
    queryKey: ["related", product?.category_id, id],
    queryFn: () => fetchRelatedProducts(product!.category_id, id),
    enabled: !!product?.category_id && !!id,
  });

  const { data: pixelRow } = useQuery({
    queryKey: ["ad_pixel", (product as any)?.pixel],
    queryFn: () => fetchPixelById((product as any).pixel as number),
    enabled: !!(product as any)?.pixel,
  });

  useEffect(() => {
    if (!pixelRow?.pixel_code) return;

    const raw = pixelRow.pixel_code as unknown;
    const parsed = parseJson<any>(raw, raw as any);
    const codeString: string | undefined = typeof parsed === "string" ? parsed : (parsed?.code ?? parsed?.html ?? parsed?.snippet ?? undefined);

    // Extract pixel ids from many shapes (digits string, snippet, object fields)
    const collectPixelIdsFromAny = (value: any): string[] => {
      const results: string[] = [];
      const pushId = (v: any) => {
        const s = String(v || "").trim();
        if (/^\d{5,}$/.test(s)) results.push(s);
      };
      if (typeof value === "string") {
        // Pure id or snippet containing init
        if (/^\d{5,}$/.test(value.trim())) pushId(value.trim());
        const re = /fbq\(\s*['\"]init['\"]\s*,\s*['\"](\d+)['\"]\s*\)/g;
        let m: RegExpExecArray | null;
        while ((m = re.exec(value)) !== null) pushId(m[1]);
      } else if (typeof value === "number") {
        pushId(value);
      } else if (value && typeof value === "object") {
        // Common fields: id, pixel_id, pixelId, ids
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

    // Extract pixel ids from code and ensure fbq bootsrap + init
    const extractPixelIdsFromCode = (code: string): string[] => {
      const ids: string[] = [];
      const re = /fbq\(\s*['\"]init['\"]\s*,\s*['\"](\d+)['\"]\s*\)/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(code)) !== null) {
        if (m[1]) ids.push(m[1]);
      }
      return Array.from(new Set(ids));
    };

    const ensureFbqBootstrap = () => {
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
      const firstScript = document.getElementsByTagName('script')[0];
      if (firstScript && firstScript.parentNode) {
        firstScript.parentNode.insertBefore(s, firstScript);
      } else {
        (document.head || document.documentElement).appendChild(s);
      }
    };

    const pixelIds = Array.from(new Set([
      ...collectPixelIdsFromAny(parsed),
      ...(codeString ? extractPixelIdsFromCode(codeString) : []),
    ]));

    // If we couldn't parse an id and there's a snippet, fallback to injecting the raw snippet once
    if (pixelIds.length === 0 && codeString) {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.text = codeString;
      (document.head || document.documentElement).appendChild(script);
      return () => {
        try { script.parentNode?.removeChild(script); } catch {}
      };
    }

    ensureFbqBootstrap();
    const w = window as any;
    pixelIds.forEach((pid) => {
      try { w.fbq('init', pid); } catch {}
    });
    if (!pageViewTrackedRef.current) {
      setTimeout(() => {
        try { w.fbq('track', 'PageView'); pageViewTrackedRef.current = true; } catch {}
      }, 0);
    }
    try {
      if (!viewTrackedRef.current) {
        const qty = selectedOffer ? Number(selectedOffer.qty) : quantity;
        const unit = selectedOffer ? (Number(selectedOffer.price) / Number(selectedOffer.qty)) : unitPrice;
        const value = Math.round(unit * qty);
        const eventPayload: any = {
          content_ids: [String(product?.id ?? '')].filter(Boolean),
          content_type: 'product',
          content_name: String(product?.name ?? ''),
          value,
          currency: 'DZD',
          contents: [
            { id: String(product?.id ?? ''), quantity: qty, item_price: Math.round(unit) }
          ]
        };
        setTimeout(() => {
          try { w.fbq('track', 'ViewContent', eventPayload); viewTrackedRef.current = true; } catch {}
        }, 0);
      }
    } catch {}

    // No cleanup needed for fbq bootstrap
    return;
  }, [pixelRow?.pixel_code, product?.id, product?.price]);

  // Ensure ViewContent fires once per product id
  useEffect(() => {
    viewTrackedRef.current = false;
  }, [product?.id]);

  const [selectedColor, setSelectedColor] = useState("");
  const [selectedColorHex, setSelectedColorHex] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedWilaya, setSelectedWilaya] = useState(""); // stores state id as string
  const [selectedBaladiya, setSelectedBaladiya] = useState(""); // stores municipality id as string
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [deliveryMethod, setDeliveryMethod] = useState<"home" | "office">("home");
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedOfferIndex, setSelectedOfferIndex] = useState<number | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);
  const viewTrackedRef = useRef<boolean>(false);
  const pageViewTrackedRef = useRef<boolean>(false);

  const { data: states = [] } = useQuery({
    queryKey: ["shipping_states"],
    queryFn: () => fetchShippingStates(),
  });

  const { data: municipalities = [] } = useQuery({
    queryKey: ["municipalities", selectedWilaya],
    queryFn: () => fetchMunicipalities(Number(selectedWilaya)),
    enabled: !!selectedWilaya,
  });

  if (loadingProduct) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            <Skeleton className="aspect-square w-full rounded-xl" />
            <div className="space-y-6">
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold mb-4">المنتج غير موجود</h1>
          <Link to="/" className="primary-button inline-block">
            العودة للرئيسية
          </Link>
        </div>
      </Layout>
    );
  }

  const selectedState = states.find((s: any) => String(s.id) === String(selectedWilaya));
  const shippingPrice = selectedState
    ? Number(
        deliveryMethod === "home"
          ? selectedState.home_delivery_price
          : selectedState.office_delivery_price,
      )
    : 0;

  // Offers are bundle totals: [{ qty: 2, price: 4500 }] means price for both = 4500
  const offers = extractOffers((product as any).offers) as any[];
  const selectedOffer =
    selectedOfferIndex !== null && Array.isArray(offers) ? offers[selectedOfferIndex] : undefined;
  const unitPrice = Number(product.price);
  const productsTotal = selectedOffer ? Number(selectedOffer.price) : unitPrice * quantity;
  const totalPrice = productsTotal + (shippingPrice || 0);

  const isFormValid = () => {
    if (!customerName || !phoneNumber || !selectedWilaya || !selectedBaladiya) return false;
    const phoneDigits = String(phoneNumber).replace(/\D+/g, "");
    const phoneValid = /^(05|06|07)\d{8}$/.test(phoneDigits);
    if (!phoneValid) return false;
    const availableColors = extractColors((product as any).colors) || [];
    const availableSizes = extractSizes((product as any).sizes) || [];
    if (Array.isArray(availableColors) && availableColors.length > 0 && !selectedColor) return false;
    if (Array.isArray(availableSizes) && availableSizes.length > 0 && !selectedSize) return false;
    return true;
  };

  const handleSubmitOrder = async () => {
    // Validate required fields
    if (!customerName || !phoneNumber || !selectedWilaya || !selectedBaladiya) {
      toast({
        title: "خطأ في النموذج",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    // Phone must be 10 digits and start with 05/06/07
    const phoneDigits = String(phoneNumber).replace(/\D+/g, "");
    const phoneValid = /^(05|06|07)\d{8}$/.test(phoneDigits);
    if (!phoneValid) {
      toast({
        title: "رقم الهاتف غير صالح",
        description: "يجب أن يبدأ بـ 05 أو 06 أو 07 ويتكون من 10 أرقام",
        variant: "destructive",
      });
      return;
    }

    const availableColors = extractColors((product as any).colors) || [];
    if (Array.isArray(availableColors) && availableColors.length > 0 && !selectedColor) {
      toast({
        title: "خطأ في النموذج", 
        description: "يرجى اختيار اللون",
        variant: "destructive"
      });
      return;
    }

    const availableSizes = extractSizes((product as any).sizes) || [];
    if (Array.isArray(availableSizes) && availableSizes.length > 0 && !selectedSize) {
      toast({
        title: "خطأ في النموذج",
        description: "يرجى اختيار المقاس",
        variant: "destructive"
      });
      return;
    }

    // Resolve names
    const stateName = selectedState?.state_name ?? null;
    const municipality = municipalities.find((m: any) => String(m.id) === String(selectedBaladiya));
    const municipalityName = municipality?.municipality_name ?? null;

    // Offer label (if any)
    const offerLabel = selectedOffer ? `${selectedOffer.qty} بسعر ${Number(selectedOffer.price)}` : null;

    // Compose minimal address from municipality and state
    const composedAddress = [municipalityName, stateName].filter(Boolean).join(", ");

    // Insert order as per orders schema
    const storeId = await resolveStoreId();
    const { error } = await supabase.from("orders").insert({
      product_id: Number(id),
      product_name: product.name,
      product_image: primaryImage,
      full_name: customerName,
      phone_number: String(phoneNumber).replace(/\D+/g, ""),
      address: composedAddress,
      state_id: Number(selectedWilaya),
      state_name: stateName,
      shipping_type: deliveryMethod, // "home" | "office"
      color: selectedColor || null,
      color_hex: selectedColorHex || null,
      size: selectedSize || null,
      quantity: selectedOffer ? Number(selectedOffer.qty) : quantity,
      offer_label: offerLabel,
      product_price: unitPrice,
      shipping_price: shippingPrice,
      total_price: totalPrice,
      municipality_name: municipalityName,
      store_id: storeId ?? null,
    });
    if (error) {
      toast({ title: "تعذر إرسال الطلب", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "تم إرسال الطلب!", description: "سنتواصل معك قريباً لتأكيد الطلب" });
    navigate("/thank-you");
  };

  // municipalities fetched from DB via selectedWilaya

  const images: string[] = product ? extractImages(product.image) : [];

  const primaryImage = images[activeImageIndex] ?? getPrimaryImageLocal(product);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto pb-36">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 mb-8 text-sm">
          <Link to="/" className="text-muted-foreground hover:text-foreground">الرئيسية</Link>
          <ArrowRight className="w-4 h-4 text-muted-foreground rotate-180" />
          <span className="text-foreground font-medium">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-muted rounded-xl overflow-hidden relative">
              <LazyImage
                src={primaryImage}
                alt={product.name}
                className="w-full h-full object-cover"
                skeletonClassName="w-full h-full"
              />
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="السابق"
                    className="absolute top-1/2 -translate-y-1/2 left-2 bg-background/70 hover:bg-background text-foreground rounded-full p-2 border"
                    onClick={() => setActiveImageIndex((idx) => (idx - 1 + images.length) % images.length)}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="التالي"
                    className="absolute top-1/2 -translate-y-1/2 right-2 bg-background/70 hover:bg-background text-foreground rounded-full p-2 border"
                    onClick={() => setActiveImageIndex((idx) => (idx + 1) % images.length)}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {images.map((img, idx) => (
                  <button
                    key={img}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={cn(
                      "aspect-square rounded-lg overflow-hidden border",
                      activeImageIndex === idx ? "border-primary" : "hover:border-primary"
                    )}
                    aria-label={`صورة ${idx + 1}`}
                  >
                    <LazyImage src={img} alt="thumbnail" className="w-full h-full object-cover" skeletonClassName="w-full h-full" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info & Form */}
          <div className="space-y-8">
            {/* Product Details */}
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-4 text-right">{product.name}</h1>
              <div className="flex items-center justify-between mb-6">
                <div className="text-4xl font-bold text-primary">
                  {Number(product.price).toLocaleString()} دج
                </div>
                <div className="flex items-center gap-1 text-amber-500" aria-label="تقييم المنتج 4.5 من 5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                  <Star className="w-5 h-5 fill-current [clip-path:polygon(0_0,50%_0,50%_100%,0_100%)]" />
                  <span className="ms-2 inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">4.5</span>
                </div>
              </div>
              <p className="text-muted-foreground leading-relaxed text-lg">
                {product.descr}
              </p>
            </div>

            {/* Purchase Form */}
            <div ref={formRef} className="bg-card border-2 border-primary rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-bold">{product.name}</h3>
                <div className="text-2xl font-bold text-primary">{Number(product.price).toLocaleString()} دج</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Color Selection (optional if none) */}
                {(() => {
                  const colors = extractColors(product.colors);
                  return Array.isArray(colors) && colors.length > 0;
                })() && (
                  <div>
                    <div className="flex flex-wrap gap-2">
                      {extractColors(product.colors).map((color: any) => {
                        const colorName = typeof color === "string" ? color : color?.name ?? "";
                        const hex = typeof color === "object" ? color?.hex : undefined;
                        return (
                          <button
                            type="button"
                            key={colorName}
                            onClick={() => { setSelectedColor(colorName); setSelectedColorHex(hex ?? ""); }}
                            className={cn(
                              "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-transform",
                              selectedColor === colorName
                                ? "ring-2 ring-primary border-primary scale-105"
                                : "hover:border-primary/60"
                            )}
                            aria-label={colorName}
                          >
                            <span
                              className="w-6 h-6 rounded-full border"
                              style={hex ? { backgroundColor: hex } : undefined}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Size Selection (optional if none) */}
                {(() => {
                  const sizes = extractSizes(product.sizes);
                  return Array.isArray(sizes) && sizes.length > 0;
                })() && (
                  <div>
                    <div className="flex flex-wrap gap-2">
                      {extractSizes(product.sizes).map((size: string) => (
                        <button
                          type="button"
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={cn(
                            "w-10 h-10 rounded-full border text-xs font-semibold flex items-center justify-center transition-colors",
                            selectedSize === size
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background hover:bg-accent"
                          )}
                          aria-label={`المقاس ${size}`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Offers (Bundles) Selection */}
              {Array.isArray(offers) && offers.length > 0 && (
                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <RadioGroup
                      value={selectedOfferIndex !== null ? String(selectedOfferIndex) : "none"}
                      onValueChange={(val) => {
                        if (val === "none") {
                          setSelectedOfferIndex(null);
                        } else {
                          const idx = Number(val);
                          setSelectedOfferIndex(Number.isFinite(idx) ? idx : null);
                        }
                      }}
                    >
                      <label className="flex items-center gap-2 p-2 rounded-lg border hover:bg-accent cursor-pointer text-sm">
                        <RadioGroupItem value="none" id="offer-none" />
                        <div>
                          <div className="font-medium">بدون عرض</div>
                          <div className="text-xs text-muted-foreground">السعر العادي للوحدة</div>
                        </div>
                      </label>
                      {offers.map((offer: any, idx: number) => (
                        <label key={idx} className="flex items-center gap-2 p-2 rounded-lg border hover:bg-accent cursor-pointer text-sm">
                          <RadioGroupItem value={String(idx)} id={`offer-${idx}`} />
                          <div>
                            <div className="font-medium">{offer.qty} بسعر {Number(offer.price).toLocaleString()} دج</div>
                            <div className="text-xs text-muted-foreground">
                              متوسط السعر للوحدة: {(Number(offer.price) / Number(offer.qty)).toFixed(0)} دج
                            </div>
                          </div>
                        </label>
                      ))}
                    </RadioGroup>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Input
                    id="name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="👤 الاسم الكامل *"
                    className="h-10"
                  />
                </div>

                <div>
                  <Input
                    id="phone"
                    value={phoneNumber}
                    onChange={(e) => {
                      // Allow only digits and limit length to 10
                      const raw = e.target.value.replace(/\D+/g, "");
                      setPhoneNumber(raw.slice(0, 10));
                    }}
                    placeholder="📞 رقم الهاتف *"
                    inputMode="numeric"
                    pattern="^(05|06|07)\\d{8}$"
                    className="h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Select value={selectedWilaya} onValueChange={(value) => {
                    setSelectedWilaya(value);
                    setSelectedBaladiya("");
                  }}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="🗺️ الولاية *" />
                    </SelectTrigger>
                    <SelectContent>
                      {states.map((state: any) => (
                        <SelectItem key={state.id} value={String(state.id)}>{state.state_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Select 
                    value={selectedBaladiya} 
                    onValueChange={setSelectedBaladiya}
                    disabled={!selectedWilaya}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="🏙️ البلدية *" />
                    </SelectTrigger>
                    <SelectContent>
                      {municipalities.map((m: any) => (
                        <SelectItem key={m.id} value={String(m.id)}>{m.municipality_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Delivery Method & Quantity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Select value={deliveryMethod} onValueChange={(v) => setDeliveryMethod(v as any)}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="🚚 طريقة التوصيل *" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="home">توصيل إلى المنزل</SelectItem>
                      <SelectItem value="office">توصيل إلى المكتب</SelectItem>
                    </SelectContent>
                  </Select>
                  {selectedState && (
                    <p className="text-xs text-muted-foreground mt-1">
                      المنزل: {Number(selectedState.home_delivery_price).toLocaleString()} دج •
                      المكتب: {Number(selectedState.office_delivery_price).toLocaleString()} دج
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => { setSelectedOfferIndex(null); setQuantity((q) => Math.max(1, q - 1)); }} disabled={!!selectedOffer}>-</Button>
                    <Input
                      value={selectedOffer ? Number(selectedOffer.qty) : quantity}
                      onChange={(e) => {
                        const n = Number(e.target.value.replace(/\D+/g, ""));
                        setSelectedOfferIndex(null);
                        setQuantity(Number.isFinite(n) && n > 0 ? Math.min(n, 999) : 1);
                      }}
                      inputMode="numeric"
                      className="w-16 text-center h-10"
                      disabled={!!selectedOffer}
                      placeholder="🔢 الكمية"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={() => { setSelectedOfferIndex(null); setQuantity((q) => Math.min(999, q + 1)); }} disabled={!!selectedOffer}>+</Button>
                  </div>
                  {selectedOffer && (
                    <p className="text-xs text-green-600 mt-1">تم اختيار عرض: {selectedOffer.qty} بسعر {Number(selectedOffer.price).toLocaleString()} دج</p>
                  )}
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                <h4 className="font-semibold text-sm">ملخص الطلب:</h4>
                <div className="flex justify-between text-sm">
                  <span>السعر × الكمية:</span>
                  <span>
                    {(() => {
                      const qty = selectedOffer ? Number(selectedOffer.qty) : quantity;
                      const base = selectedOffer ? Number(selectedOffer.price) / Number(selectedOffer.qty) : unitPrice;
                      return `${Math.round(base).toLocaleString()} × ${qty}`;
                    })()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>سعر الشحن:</span>
                  <span>{Number(shippingPrice).toLocaleString()} دج</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t pt-1">
                  <span>الإجمالي:</span>
                  <span className="text-primary">{totalPrice.toLocaleString()} دج</span>
                </div>
              </div>

              <Button 
                onClick={handleSubmitOrder}
                className="w-full"
                size="default"
              >
                تأكيد الطلب
              </Button>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-center mb-8">منتجات ذات صلة</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </section>
        )}
      </div>
      {/* Fixed bottom confirm bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t p-3 z-50">
        <div className="max-w-6xl mx-auto">
          <Button
            className="w-full motion-safe:animate-bounce transition-transform hover:scale-[1.02]"
            size="lg"
            onClick={() => {
              if (!isFormValid()) {
                formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                toast({ title: "أكمل النموذج", description: "يرجى ملء الحقول المطلوبة قبل الإرسال" });
                return;
              }
              handleSubmitOrder();
            }}
          >
            تأكيد الطلب
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default ProductPage;

function getPrimaryImageLocal(product: any): string {
  if (typeof product?.image === "string") return product.image;
  if (Array.isArray(product?.image) && product.image.length > 0) return product.image[0];
  if (Array.isArray(product?.images) && product.images.length > 0) return product.images[0];
  if (Array.isArray(product?.image_urls) && product.image_urls.length > 0) return product.image_urls[0];
  if (typeof product?.image_url === "string") return product.image_url;
  return "/placeholder.svg";
}
