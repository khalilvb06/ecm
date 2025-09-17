import { Facebook, Instagram, MessageCircle, Music } from "lucide-react";
import Layout from "@/components/Layout";
import { socialMedia } from "@/data/mockData";
import Features from "@/components/Features";
import { useSettings } from "@/hooks/useSettings";

const AboutPage = () => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "Facebook":
        return Facebook;
      case "Instagram":
        return Instagram;
      case "MessageCircle":
        return MessageCircle;
      case "Music":
        return Music;
      default:
        return MessageCircle;
    }
  };

  const { settings } = useSettings();

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-6 heading-underline">عن متجرنا</h1>
        </div>

        <div className="bg-card border border-border rounded-xl p-8 mb-8 product-card">
          <div className="prose prose-lg max-w-none text-foreground text-center">
            {settings?.store_description ? (
              <p className="text-xl leading-relaxed mb-6">{settings.store_description}</p>
            ) : (
              <p className="text-xl leading-relaxed mb-6">
                مرحباً بكم في متجرنا الإلكتروني، وجهتكم المفضلة للتسوق عبر الإنترنت في الجزائر. 
                نحن نقدم مجموعة واسعة من المنتجات عالية الجودة بأسعار منافسة مع خدمة الدفع عند الاستلام.
              </p>
            )}
            
            <h2 className="text-2xl font-bold mb-4">لماذا تختارنا؟</h2>
            <ul className="list-disc list-inside space-y-3 text-lg mb-6 text-right">
              <li>منتجات أصلية ومضمونة الجودة</li>
              <li>أسعار تنافسية ومناسبة للجميع</li>
              <li>خدمة الدفع عند الاستلام في جميع أنحاء الجزائر</li>
              <li>توصيل سريع وآمن</li>
              <li>خدمة عملاء متميزة</li>
              <li>ضمان الإرجاع والاستبدال</li>
            </ul>

            <h2 className="text-2xl font-bold mb-4">رؤيتنا</h2>
            <p className="text-lg leading-relaxed mb-6">
              نسعى لأن نكون الخيار الأول للمتسوقين الجزائريين عبر الإنترنت، من خلال تقديم تجربة تسوق 
              مميزة وموثوقة تلبي احتياجاتهم وتفوق توقعاتهم.
            </p>

            <h2 className="text-2xl font-bold mb-4">مميزاتنا</h2>
            <Features />
          </div>
        </div>

        {/* Social Media Links */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-8">تابعونا على وسائل التواصل الاجتماعي</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {socialMedia.map((social) => {
              const Icon = getIcon(social.icon);
              return (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-3 bg-card border border-border rounded-xl px-6 py-6 hover:shadow-[var(--shadow-elegant)] transition-[var(--transition-smooth)] group"
                >
                  <Icon className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                  <span className="font-medium text-foreground">{social.name}</span>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AboutPage;