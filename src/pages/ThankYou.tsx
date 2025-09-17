import Layout from "@/components/Layout";
import { Link } from "react-router-dom";
import { useEffect } from "react";

const ThankYou = () => {
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    } catch {
      window.scrollTo(0, 0);
    }
  }, []);
  return (
    <Layout>
      <div className="max-w-3xl mx-auto py-24 text-center space-y-6">
        <h1 className="text-3xl md:text-4xl font-bold">شكراً لك! ✅</h1>
        <p className="text-muted-foreground text-lg">
          تم استلام طلبك بنجاح. سنتواصل معك قريباً لتأكيد الطلب وترتيب التوصيل.
        </p>
        <div className="pt-4 flex items-center justify-center gap-3">
          <Link to="/" className="primary-button">العودة إلى الصفحة الرئيسية</Link>
        </div>
      </div>
    </Layout>
  );
};

export default ThankYou;


