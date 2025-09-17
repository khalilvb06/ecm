import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Grid3X3, Info, ShoppingBag, Menu, Search } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useEffect, useState } from "react";
import { useSettings } from "@/hooks/useSettings";
import { Facebook, Instagram, Phone, Bot } from "lucide-react";
import { getCurrentSubdomain } from "@/lib/utils";
import { resolveStoreId } from "@/lib/store";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const navItems = [
    { path: "/", label: "الرئيسية", icon: Home },
    { path: "/categories", label: "الفئات", icon: Grid3X3 },
    { path: "/about", label: "عن المتجر", icon: Info }
  ];

  const { settings } = useSettings();

  const [storeReady, setStoreReady] = useState<boolean>(false);
  const [storeError, setStoreError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const sub = getCurrentSubdomain();
        if (!sub) {
          if (mounted) {
            setStoreError("المتجر غير موجود أو غير مفعل");
            setStoreReady(true);
          }
          return;
        }
        const id = await resolveStoreId();
        if (!id) {
          if (mounted) {
            setStoreError("المتجر غير موجود أو غير مفعل");
            setStoreReady(true);
          }
          return;
        }
        if (mounted) {
          setStoreReady(true);
        }
      } catch (error) {
        console.error("خطأ في تحميل المتجر:", error);
        if (mounted) {
          setStoreError("المتجر غير موجود أو غير مفعل");
          setStoreReady(true);
        }
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Top Promo Bar */}
      <div className="w-full bg-primary text-primary-foreground text-sm py-3">
        <div className="container mx-auto px-4 text-center font-medium">
          التوصيل السريع خلال 24 ساعة و الدفع عند الاستلام
        </div>
      </div>

      {/* Header */}
      <header className="bg-white border-b border-border shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3 relative">
            {/* Left: Search (mobile shows icon) */}
            <div className="flex-1 md:max-w-sm">
              <div className="hidden md:flex items-center gap-2 bg-muted rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-primary">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="ابحث عن منتج"
                  className="bg-transparent outline-none text-sm w-full placeholder:text-muted-foreground/70"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const q = searchQuery.trim();
                      setIsSearchOpen(false);
                      if (q.length > 0) navigate(`/?q=${encodeURIComponent(q)}`);
                    }
                  }}
                />
              </div>
              <button className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors" onClick={() => setIsSearchOpen(true)} aria-label="فتح البحث">
                <Search className="w-6 h-6" />
              </button>
            </div>

            {/* Center: Logo (mobile icon only) */}
            <Link to="/" className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0">
              {settings?.logo ? (
                <img src={settings.logo} alt={settings?.name ?? "Logo"} className="w-8 h-8 rounded" />
              ) : (
                <ShoppingBag className="w-8 h-8 text-primary" />
              )}
              <h1 className="hidden md:block text-xl font-bold text-foreground">{settings?.name ?? "متجري"}</h1>
            </Link>

            {/* Right: Desktop nav / Mobile menu */}
            {/* Desktop Navigation */}
            <nav className="hidden md:flex gap-1">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-[var(--transition-smooth)] font-medium ${
                    location.pathname === path
                      ? "bg-primary text-primary-foreground shadow-[var(--shadow-elegant)]"
                      : "text-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </Link>
              ))}
            </nav>

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <button className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors">
                  <Menu className="w-6 h-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col gap-4 mt-8">
                  <div className="flex items-center gap-2 mb-6">
                    <ShoppingBag className="w-8 h-8 text-primary" />
                    <h2 className="text-xl font-bold text-foreground">متجري</h2>
                  </div>
                  
                  {navItems.map(({ path, label, icon: Icon }) => (
                    <Link
                      key={path}
                      to={path}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-[var(--transition-smooth)] font-medium ${
                        location.pathname === path
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{label}</span>
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Mobile Search Sheet */}
      <Sheet open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <SheetContent side="top" className="h-auto">
          <div className="mt-6 mb-2">
            <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-primary">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                autoFocus
                type="text"
                placeholder="ابحث عن منتج"
                className="bg-transparent outline-none text-base w-full placeholder:text-muted-foreground/70"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const q = searchQuery.trim();
                    setIsSearchOpen(false);
                    if (q.length > 0) navigate(`/?q=${encodeURIComponent(q)}`);
                  }
                }}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {storeReady && storeError ? (
          <div className="text-center py-24">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{storeError}</h1>
            <p className="text-muted-foreground">يرجى التأكد من رابط المتجر أو تفعيل المتجر</p>
          </div>
        ) : (
          children
        )}
      </main>

      {/* Footer */}
      <footer className="bg-muted border-t border-border mt-16">
        <div className="container mx-auto px-4 py-8 pb-28">
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              {settings?.facebook_url && (
                <a href={settings.facebook_url} target="_blank" rel="noreferrer" className="text-foreground/80 hover:text-primary transition-colors" aria-label="Facebook">
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {settings?.instagram_url && (
                <a href={settings.instagram_url} target="_blank" rel="noreferrer" className="text-foreground/80 hover:text-primary transition-colors" aria-label="Instagram">
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {settings?.whatsapp_url && (
                <a href={settings.whatsapp_url} target="_blank" rel="noreferrer" className="text-foreground/80 hover:text-primary transition-colors" aria-label="WhatsApp">
                  <Phone className="w-5 h-5" />
                </a>
              )}
              {settings?.tiktok_url && (
                <a href={settings.tiktok_url} target="_blank" rel="noreferrer" className="text-foreground/80 hover:text-primary transition-colors" aria-label="TikTok">
                  <Bot className="w-5 h-5" />
                </a>
              )}
            </div>
            <p className="text-muted-foreground">© 2024 {settings?.name ?? "متجري"} - جميع الحقوق محفوظة</p>
            <p className="text-sm text-muted-foreground mt-2">{settings?.store_description ?? "تم انشائه عبر ECM"}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;