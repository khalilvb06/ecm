import { useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { resolveStoreId } from "@/lib/store";
import { getMunicipalitiesByStateId } from "@/data/dzMunicipalities";
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

async function fetchLanding(id: string) {
  const storeId = await resolveStoreId();
  if (!storeId) return null;
  const { data, error } = await supabase
    .from("landing_pages")
    .select("id, name, price, image, colors, sizes, offers, available, category_id, image_width")
    .eq("id", Number(id))
    .eq("store_id", storeId)
    .maybeSingle();
  if (error) throw error;
  return data;
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
  return (data ?? []).map((row: any) => ({
    id: row.state_id,
    state_name: row.shipping_states?.state_name ?? "",
    home_delivery_price: row.home_delivery_price,
    office_delivery_price: row.office_delivery_price,
    is_available: row.is_available,
  }));
}

async function fetchMunicipalities(stateId: number) {
  // Use local static communes dataset keyed by shipping state id
  return getMunicipalitiesByStateId(Number(stateId));
}

const LandingPage = () => {
  const { id = "" } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { data: landing, isLoading: loadingLanding } = useQuery({ queryKey: ["landing", id], queryFn: () => fetchLanding(id), enabled: !!id });
  const navigate = useNavigate();

  const [selectedColor, setSelectedColor] = useState("");
  const [selectedColorHex, setSelectedColorHex] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedWilaya, setSelectedWilaya] = useState("");
  const [selectedBaladiya, setSelectedBaladiya] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"home" | "office">("home");
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedOfferIndex, setSelectedOfferIndex] = useState<number | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);

  const { data: states = [] } = useQuery({ queryKey: ["shipping_states"], queryFn: () => fetchShippingStates() });
  const { data: municipalities = [] } = useQuery({
    queryKey: ["municipalities", selectedWilaya],
    queryFn: () => fetchMunicipalities(Number(selectedWilaya)),
    enabled: !!selectedWilaya,
  });

  if (loadingLanding) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto space-y-8">
          <Skeleton className="h-8 w-1/3" />
          <div className="flex justify-center">
            <Skeleton className="w-full max-w-3xl aspect-video rounded-xl" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </Layout>
    );
  }

  if (!landing) {
    return (
      <Layout>
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold mb-4">الصفحة غير موجودة</h1>
          <Link to="/" className="primary-button inline-block">العودة للرئيسية</Link>
        </div>
      </Layout>
    );
  }

  const selectedState = states.find((s: any) => String(s.id) === String(selectedWilaya));
  const shippingPrice = selectedState
    ? Number(deliveryMethod === "home" ? selectedState.home_delivery_price : selectedState.office_delivery_price)
    : 0;

  const offers = extractOffers((landing as any).offers) as any[];
  const selectedOffer = selectedOfferIndex !== null && Array.isArray(offers) ? offers[selectedOfferIndex] : undefined;
  const unitPrice = Number(landing.price);
  const productsTotal = selectedOffer ? Number(selectedOffer.price) : unitPrice * quantity;
  const totalPrice = productsTotal + (shippingPrice || 0);

  const isFormValid = () => {
    if (!customerName || !phoneNumber || !selectedWilaya || !selectedBaladiya) return false;
    const phoneDigits = String(phoneNumber).replace(/\D+/g, "");
    const phoneValid = /^(05|06|07)\d{8}$/.test(phoneDigits);
    if (!phoneValid) return false;
    const availableColors = extractColors((landing as any).colors) || [];
    const availableSizes = extractSizes((landing as any).sizes) || [];
    if (Array.isArray(availableColors) && availableColors.length > 0 && !selectedColor) return false;
    if (Array.isArray(availableSizes) && availableSizes.length > 0 && !selectedSize) return false;
    return true;
  };

  const handleSubmitOrder = async () => {
    if (!isFormValid()) {
      toast({ title: "خطأ في النموذج", description: "يرجى ملء جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }

    const stateName = selectedState?.state_name ?? null;
    const municipality = municipalities.find((m: any) => String(m.id) === String(selectedBaladiya));
    const municipalityName = municipality?.municipality_name ?? null;

    const offerLabel = selectedOffer ? `${selectedOffer.qty} بسعر ${Number(selectedOffer.price)}` : null;

    const primaryImage = getPrimaryImageLocal(landing);

    const composedAddress = [municipalityName, stateName].filter(Boolean).join(", ");

    const storeId = await resolveStoreId();
    const { error } = await supabase.from("orders").insert({
      product_id: Number(landing.id),
      product_name: landing.name,
      product_image: primaryImage,
      full_name: customerName,
      phone_number: String(phoneNumber).replace(/\D+/g, ""),
      address: composedAddress,
      state_id: Number(selectedWilaya),
      state_name: stateName,
      shipping_type: deliveryMethod,
      color: selectedColor || null,
      color_hex: selectedColorHex || null,
      size: selectedSize || null,
      quantity: selectedOffer ? Number(selectedOffer.qty) : quantity,
      offer_label: offerLabel,
      product_price: unitPrice,
      shipping_price: shippingPrice,
      total_price: totalPrice,
      municipality_id: null,
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

  const images: string[] = landing ? extractImages((landing as any).image) : [];
  const primaryImage = images[0] ?? getPrimaryImageLocal(landing);
  const imageWidth = String((landing as any).image_width || "100%");
  
  // Debug logging for images
  console.log('Landing page images:', {
    rawImage: (landing as any).image,
    extractedImages: images,
    primaryImage: primaryImage
  });

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8 pb-44">
        <nav className="flex items-center gap-2 mb-2 text-sm">
          <Link to="/" className="text-muted-foreground hover:text-foreground">الرئيسية</Link>
          <span className="text-foreground font-medium">{landing.name}</span>
        </nav>

        {/* First Image on top */}
        <div className="flex justify-center">
          <div className="rounded-xl overflow-hidden bg-muted" style={{ width: imageWidth }}>
            <LazyImage src={primaryImage} alt={landing.name} className="w-full h-auto object-cover" skeletonClassName="w-full aspect-video" />
          </div>
        </div>

        {/* Form below first image */}
        <div ref={formRef} className="bg-card border-2 border-primary rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold">{landing.name}</h1>
            <div className="text-2xl font-bold text-primary">{Number(landing.price).toLocaleString()} دج</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Color Selection (optional if none) */}
            {(() => {
              const colors = extractColors(landing.colors);
              return Array.isArray(colors) && colors.length > 0;
            })() && (
              <div>
                <div className="flex flex-wrap gap-2">
                  {extractColors(landing.colors).map((color: any) => {
                    const colorName = typeof color === "string" ? color : color?.name ?? "";
                    const hex = typeof color === "object" ? color?.hex : undefined;
                    return (
                      <button
                        type="button"
                        key={colorName}
                        onClick={() => { setSelectedColor(colorName); setSelectedColorHex(hex ?? ""); }}
                        className={cn(
                          "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-transform",
                          selectedColor === colorName ? "ring-2 ring-primary border-primary scale-105" : "hover:border-primary/60"
                        )}
                        aria-label={colorName}
                      >
                        <span className="w-6 h-6 rounded-full border" style={hex ? { backgroundColor: hex } : undefined} />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Selection (optional if none) */}
            {(() => {
              const sizes = extractSizes(landing.sizes);
              return Array.isArray(sizes) && sizes.length > 0;
            })() && (
              <div>
                <div className="flex flex-wrap gap-2">
                  {extractSizes(landing.sizes).map((size: string) => (
                    <button
                      type="button"
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={cn(
                        "w-10 h-10 rounded-full border text-xs font-semibold flex items-center justify-center transition-colors",
                        selectedSize === size ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"
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

          {/* Offers Selection */}
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
                        <div className="text-xs text-muted-foreground">متوسط السعر للوحدة: {(Number(offer.price) / Number(offer.qty)).toFixed(0)} دج</div>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              </div>
            </div>
          )}

          {/* Address & Contact */}
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
              <Select
                value={selectedWilaya}
                onValueChange={(value) => {
                  setSelectedWilaya(value);
                  setSelectedBaladiya("");
                }}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="🗺️ الولاية *" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((state: any) => (
                    <SelectItem key={state.id} value={String(state.id)}>
                      {state.state_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={selectedBaladiya} onValueChange={setSelectedBaladiya} disabled={!selectedWilaya}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="🏙️ البلدية *" />
                </SelectTrigger>
                <SelectContent>
                  {municipalities.map((m: any) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.municipality_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Delivery + Quantity */}
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
                  المنزل: {Number(selectedState.home_delivery_price).toLocaleString()} دج • المكتب: {Number(selectedState.office_delivery_price).toLocaleString()} دج
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

          {/* Summary */}
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

          <Button onClick={handleSubmitOrder} className="w-full" size="default">
            تأكيد الطلب
          </Button>
        </div>

        {/* Additional Images after form */}
        {images.length > 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-center">صور إضافية للمنتج</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.slice(1).map((image, index) => (
                <div key={index} className="rounded-xl overflow-hidden bg-muted">
                  <LazyImage 
                    src={image} 
                    alt={`${landing.name} - صورة ${index + 2}`} 
                    className="w-full h-auto object-cover" 
                    skeletonClassName="w-full aspect-square" 
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fixed bottom confirm bar CTA */}
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

export default LandingPage;

function getPrimaryImageLocal(item: any): string {
  if (!item) return "/placeholder.svg";
  
  // Try different image field formats
  if (typeof item.image === "string" && item.image.trim()) return item.image;
  if (Array.isArray(item.image) && item.image.length > 0) return item.image[0];
  if (Array.isArray(item.images) && item.images.length > 0) return item.images[0];
  if (Array.isArray(item.image_urls) && item.image_urls.length > 0) return item.image_urls[0];
  if (typeof item.image_url === "string" && item.image_url.trim()) return item.image_url;
  
  // Try to extract from JSON string
  if (typeof item.image === "string") {
    try {
      const parsed = JSON.parse(item.image);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
      if (typeof parsed === "string") return parsed;
    } catch (e) {
      // If JSON parsing fails, return the string as is if it looks like a URL
      if (item.image.includes('http') || item.image.includes('/')) {
        return item.image;
      }
    }
  }
  
  return "/placeholder.svg";
}


