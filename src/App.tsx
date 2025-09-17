import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import StaticRedirect from "@/components/StaticRedirect";
const Index = lazy(() => import("./pages/Index"));
const ProductPage = lazy(() => import("./pages/ProductPage"));
const CategoriesPage = lazy(() => import("./pages/CategoriesPage"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ThankYou = lazy(() => import("./pages/ThankYou"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
import { SettingsProvider } from "@/hooks/useSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <SettingsProvider>
        <BrowserRouter>
          <Suspense fallback={<div className="container mx-auto p-6"><div className="animate-pulse space-y-4"><div className="h-8 w-1/3 bg-muted rounded" /><div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{Array.from({ length: 8 }).map((_, i) => (<div key={i} className="aspect-square bg-muted rounded-lg" />))}</div></div></div>}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/product/:id" element={<ProductPage />} />
              <Route path="/landing/:id" element={<LandingPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/category/:id" element={<CategoryPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/thank-you" element={<ThankYou />} />
              {/* Admin static pages */}
              <Route path="/admin" element={<StaticRedirect to="/admin/dashboard.html" />} />
              <Route path="/admin/login" element={<StaticRedirect to="/admin/login.html" />} />
              <Route path="/admin/dashboard" element={<StaticRedirect to="/admin/dashboard.html" />} />
              <Route path="/admin/orders" element={<StaticRedirect to="/admin/orders.html" />} />
              <Route path="/admin/products" element={<StaticRedirect to="/admin/products.html" />} />
              <Route path="/admin/categories" element={<StaticRedirect to="/admin/categories.html" />} />
              <Route path="/admin/ads" element={<StaticRedirect to="/admin/ads.html" />} />
              <Route path="/admin/shipping" element={<StaticRedirect to="/admin/shipping.html" />} />
              <Route path="/admin/settings" element={<StaticRedirect to="/admin/sitting.html" />} />
              <Route path="/admin/landing/add" element={<StaticRedirect to="/admin/addLandingPage.html" />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </SettingsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
