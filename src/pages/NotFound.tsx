import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import Layout from "@/components/Layout";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <Layout>
      <div className="text-center py-16">
        <h1 className="mb-4 text-6xl font-bold text-primary">404</h1>
        <p className="mb-6 text-2xl text-muted-foreground">عذراً! الصفحة غير موجودة</p>
        <p className="mb-8 text-lg text-muted-foreground">
          الصفحة التي تبحث عنها غير متوفرة أو تم نقلها
        </p>
        <Link to="/" className="primary-button inline-block">
          العودة للرئيسية
        </Link>
      </div>
    </Layout>
  );
};

export default NotFound;
