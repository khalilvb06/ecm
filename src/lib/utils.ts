import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getCurrentSubdomain(hostname?: string): string | null {
  const host = (hostname || (typeof window !== "undefined" ? window.location.hostname : "")).toLowerCase();
  if (!host) return null;
  // If it's an IP or localhost, no subdomain
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return null;
  // Support *.localhost for local development (e.g., store1.localhost)
  if (host === "localhost") return null;
  if (host.endsWith(".localhost")) {
    const label = host.slice(0, -".localhost".length);
    const sub = label.split(":")[0];
    return sub || null;
  }
  const hostnameOnly = host.split(":")[0];
  const parts = hostnameOnly.split(".");
  if (parts.length < 3) return null; // e.g. example.com
  return parts[0] || null; // sub.example.com -> sub
}

export function isAdminPath(pathname?: string): boolean {
  const path = pathname || (typeof window !== "undefined" ? window.location.pathname : "");
  return path.startsWith("/admin");
}
