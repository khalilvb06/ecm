import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getCurrentSubdomain } from "@/lib/utils";

type ButtonColorJson =
  | { bg?: string; fg?: string }
  | { background?: string; foreground?: string }
  | { h?: number; s?: number; l?: number; hf?: number; sf?: number; lf?: number }
  | null;

export type StoreSettings = {
  id: number;
  name: string | null;
  logo: string | null;
  btncolor: ButtonColorJson;
  facebook_url: string | null;
  instagram_url: string | null;
  whatsapp_url: string | null;
  tiktok_url: string | null;
  store_description: string | null;
};

type SettingsContextValue = {
  settings: StoreSettings | null;
  isLoading: boolean;
  error: string | null;
};

const SettingsContext = createContext<SettingsContextValue>({ settings: null, isLoading: true, error: null });

function parseColorToHsl(color: string): string | null {
  if (!color) return null;
  const trimmed = color.trim();
  // If already hsl(css)
  if (trimmed.startsWith("hsl(")) {
    return trimmed.replace(/^hsl\((.*)\)$/i, "$1");
  }
  // hex #rrggbb or #rgb
  if (trimmed.startsWith("#")) {
    const hex = trimmed.slice(1);
    const expand = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
    if (!/^([0-9a-fA-F]{6})$/.test(expand)) return null;
    const r = parseInt(expand.slice(0, 2), 16) / 255;
    const g = parseInt(expand.slice(2, 4), 16) / 255;
    const b = parseInt(expand.slice(4, 6), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0; const l = (max + min) / 2;
    const d = max - min;
    const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
    if (d !== 0) {
      switch (max) {
        case r: h = ((g - b) / d) % 6; break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h *= 60; if (h < 0) h += 360;
    }
    return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  }
  // rgb(a)
  const rgbMatch = trimmed.match(/^rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*(\d*\.?\d+))?\)$/i);
  if (rgbMatch) {
    const r = Math.min(255, parseInt(rgbMatch[1], 10)) / 255;
    const g = Math.min(255, parseInt(rgbMatch[2], 10)) / 255;
    const b = Math.min(255, parseInt(rgbMatch[3], 10)) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0; const l = (max + min) / 2;
    const d = max - min;
    const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
    if (d !== 0) {
      switch (max) {
        case r: h = ((g - b) / d) % 6; break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h *= 60; if (h < 0) h += 360;
    }
    return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  }
  return null;
}

function applyButtonColors(btn: ButtonColorJson) {
  const root = document.documentElement;
  if (!btn) return;
  // Object form with bg/fg or background/foreground
  const bg = (btn as any).bg ?? (btn as any).background ?? (btn as any).backgroundColor;
  const fg = (btn as any).fg ?? (btn as any).foreground ?? (btn as any).textColor;
  const hasHslTriplet = typeof (btn as any).h === "number" && typeof (btn as any).s === "number" && typeof (btn as any).l === "number";
  if (hasHslTriplet) {
    const { h, s, l, hf, sf, lf } = btn as any;
    root.style.setProperty("--primary", `${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%`);
    if (typeof hf === "number" && typeof sf === "number" && typeof lf === "number") {
      root.style.setProperty("--primary-foreground", `${Math.round(hf)} ${Math.round(sf)}% ${Math.round(lf)}%`);
    }
    return;
  }
  const bgHsl = typeof bg === "string" ? parseColorToHsl(bg) : null;
  const fgHsl = typeof fg === "string" ? parseColorToHsl(fg) : null;
  if (bgHsl) root.style.setProperty("--primary", bgHsl);
  if (fgHsl) root.style.setProperty("--primary-foreground", fgHsl);
}

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setIsLoading(true);
        const sub = getCurrentSubdomain();
        if (!sub) {
          if (isMounted) {
            setSettings(null);
            setError("المتجر غير موجود أو غير مفعل");
            setIsLoading(false);
          }
          return;
        }
        
        const { data: storeRow, error: storeErr } = await supabase
          .from("stores")
          .select("id")
          .eq("subdomain", sub)
          .is("is_active", true)
          .maybeSingle();
        if (storeErr) throw storeErr;
        
        const storeIdFilter = storeRow?.id ?? null;
        if (!storeIdFilter) {
          if (isMounted) {
            setSettings(null);
            setError("المتجر غير موجود أو غير مفعل");
            setIsLoading(false);
          }
          return;
        }
        
        const { data, error } = await supabase
          .from("store_settings")
          .select("id, name, logo, btncolor, facebook_url, instagram_url, whatsapp_url, tiktok_url, store_description, main_pixel, store_id")
          .eq("store_id", storeIdFilter)
          .maybeSingle();
        if (error) throw error;
        if (isMounted && data) {
          setSettings(data as StoreSettings);
          applyButtonColors((data as StoreSettings).btncolor ?? null);
        }
      } catch (e: any) {
        if (isMounted) setError(e?.message ?? "Failed to load settings");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo<SettingsContextValue>(() => ({ settings, isLoading, error }), [settings, isLoading, error]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export function useSettings() {
  return useContext(SettingsContext);
}


