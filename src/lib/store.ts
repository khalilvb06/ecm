import { supabase } from "@/lib/supabase";
import { getCurrentSubdomain } from "@/lib/utils";

let cachedStoreId: number | null | undefined;

export async function resolveStoreId(): Promise<number | null> {
  const sub = getCurrentSubdomain();
  if (!sub) {
    cachedStoreId = null;
    return cachedStoreId;
  }
  
  if (typeof cachedStoreId !== "undefined") return cachedStoreId;
  
  const { data, error } = await supabase
    .from("stores")
    .select("id")
    .eq("subdomain", sub)
    .is("is_active", true)
    .maybeSingle();
  if (error) {
    cachedStoreId = null;
    return cachedStoreId;
  }
  cachedStoreId = data?.id ?? null;
  return cachedStoreId;
}

export function getCachedStoreId(): number | null | undefined {
  return cachedStoreId;
}

export function clearStoreCache(): void {
  cachedStoreId = undefined;
}


