// Utilities to safely parse jsonb columns that might arrive as arrays, objects, or stringified JSON

export function parseJson<T = unknown>(value: unknown, fallback: T): T {
  try {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if ((trimmed.startsWith("[") && trimmed.endsWith("]")) || (trimmed.startsWith("{") && trimmed.endsWith("}"))) {
        return JSON.parse(trimmed) as T;
      }
      return fallback;
    }
    if (typeof value === "object" && value !== null) {
      return value as T;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

export function extractStringArray(value: unknown): string[] {
  const parsed = parseJson<unknown>(value, value as any);
  if (Array.isArray(parsed)) {
    return parsed.filter((x) => typeof x === "string") as string[];
  }
  if (typeof parsed === "string" && parsed.length > 0) {
    return [parsed];
  }
  return [];
}

export function extractImages(value: unknown): string[] {
  const parsed = parseJson<unknown>(value, value as any);
  
  // If it's already an array of strings
  if (Array.isArray(parsed)) {
    return parsed.filter((x) => typeof x === "string" && x.trim().length > 0) as string[];
  }
  
  // If it's a single string
  if (typeof parsed === "string" && parsed.trim().length > 0) {
    // Try to parse as JSON array
    try {
      const jsonParsed = JSON.parse(parsed);
      if (Array.isArray(jsonParsed)) {
        return jsonParsed.filter((x) => typeof x === "string" && x.trim().length > 0) as string[];
      }
    } catch (e) {
      // If JSON parsing fails, return as single item if it looks like a URL
      if (parsed.includes('http') || parsed.includes('/') || parsed.includes('.')) {
        return [parsed];
      }
    }
  }
  
  // If it's an object, try to extract image fields
  if (typeof parsed === "object" && parsed !== null) {
    const obj = parsed as any;
    const images: string[] = [];
    
    // Try common image field names
    const imageFields = ['images', 'image_urls', 'urls', 'photos', 'pictures'];
    for (const field of imageFields) {
      if (Array.isArray(obj[field])) {
        images.push(...obj[field].filter((x: any) => typeof x === "string" && x.trim().length > 0));
      }
    }
    
    if (images.length > 0) return images;
  }
  
  return [];
}

export type ColorItem = { name: string; hex?: string } | string;
export function extractColors(value: unknown): ColorItem[] {
  const parsed = parseJson<unknown>(value, value as any);
  if (Array.isArray(parsed)) return parsed as ColorItem[];
  if (typeof parsed === "string" && parsed.length > 0) return [parsed as string];
  return [];
}

export function extractSizes(value: unknown): string[] {
  return extractStringArray(value);
}

export type OfferItem = { qty: number; price: number };
export function extractOffers(value: unknown): OfferItem[] {
  const parsed = parseJson<unknown>(value, value as any);
  if (Array.isArray(parsed)) return parsed as OfferItem[];
  return [];
}


