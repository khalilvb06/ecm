import { Flame, Handshake, ShieldCheck, Headset } from "lucide-react";

const FEATURES = [
  {
    icon: Flame,
    title: "توصيل سريع من 1/3 أيام",
    subtitle: "خطوات سهلة وبسيطة",
  },
  {
    icon: Handshake,
    title: "تخلّص كي توصلك السلعة",
    subtitle: "إشتري بكل ثقة وأمان",
  },
  {
    icon: ShieldCheck,
    title: "إستبدال وإسترجاع مجاني",
    subtitle: "حقك 100% مضمون!",
  },
  {
    icon: Headset,
    title: "خدمة زبائن VIP",
    subtitle: "من 9 صباحًا إلى 8 مساءً",
  },
];

const Features = () => {
  return (
    <section>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {FEATURES.map(({ icon: Icon, title, subtitle }) => (
          <div key={title} className="product-card text-center flex flex-col items-center gap-2 py-6">
            <Icon className="w-12 h-12 text-foreground/80" />
            <h3 className="text-lg font-extrabold tracking-tight text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Features;


