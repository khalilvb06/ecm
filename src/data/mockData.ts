// Mock data for the Algerian e-commerce store

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  category: string;
  colors: string[];
  sizes: string[];
  relatedProducts?: string[];
}

export interface Category {
  id: string;
  name: string;
  image: string;
  productCount: number;
}

// Algerian Wilayas and their Baladias
export const algerian_locations = {
  "الجزائر": ["الجزائر الوسطى", "سيدي امحمد", "المدنية", "حسين داي", "الحراش", "برج الكيفان"],
  "وهران": ["وهران", "السانيا", "بطيوة", "عين الترك", "حاسي بونيف", "مسرغين"],
  "قسنطينة": ["قسنطينة", "الحامة بوزيان", "زيغود يوسف", "ديدوش مراد", "عين عبيد"],
  "عنابة": ["عنابة", "البوني", "سيدي عمار", "برحال", "الحجار"],
  "باتنة": ["باتنة", "عين التوتة", "بريكة", "أريس", "تازولت"],
  "سطيف": ["سطيف", "العلمة", "بابور", "عين ولمان", "جميلة"],
  "تيزي وزو": ["تيزي وزو", "أزازقة", "درقانة", "تيقزيرت", "مقلع"],
  "بجاية": ["بجاية", "خراطة", "أقبو", "درقينة", "تاوريرت إيغيل"],
  "بشار": ["بشار", "بني ونيف", "كرزاز", "العبادلة", "تبلبالة"],
  "تبسة": ["تبسة", "بئر العاتر", "الشريعة", "نقرين", "بكارية"]
};

export const categories: Category[] = [
  {
    id: "electronics",
    name: "الإلكترونيات",
    image: "/placeholder.svg",
    productCount: 15
  },
  {
    id: "fashion",
    name: "الأزياء",
    image: "/placeholder.svg", 
    productCount: 25
  },
  {
    id: "home",
    name: "المنزل والحديقة",
    image: "/placeholder.svg",
    productCount: 18
  },
  {
    id: "sports",
    name: "الرياضة",
    image: "/placeholder.svg",
    productCount: 12
  }
];

export const products: Product[] = [
  {
    id: "1",
    name: "سماعات بلوتوث لاسلكية",
    price: 4500,
    image: "/placeholder.svg",
    description: "سماعات بلوتوث عالية الجودة مع إلغاء الضوضاء وبطارية تدوم 24 ساعة. مثالية للاستماع للموسيقى والمكالمات.",
    category: "electronics",
    colors: ["أسود", "أبيض", "أزرق"],
    sizes: [],
    relatedProducts: ["2", "3"]
  },
  {
    id: "2", 
    name: "شاحن سريع للهاتف",
    price: 1200,
    image: "/placeholder.svg",
    description: "شاحن سريع متوافق مع جميع الهواتف الذكية. شحن آمن وسريع بتقنية متقدمة.",
    category: "electronics",
    colors: ["أبيض", "أسود"],
    sizes: [],
    relatedProducts: ["1", "3"]
  },
  {
    id: "3",
    name: "قميص قطني رجالي",
    price: 2800,
    image: "/placeholder.svg", 
    description: "قميص قطني عالي الجودة، مريح وأنيق. مناسب للعمل والمناسبات الرسمية.",
    category: "fashion",
    colors: ["أزرق", "أبيض", "رمادي"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    relatedProducts: ["4", "5"]
  },
  {
    id: "4",
    name: "حقيبة نسائية أنيقة",
    price: 3500,
    image: "/placeholder.svg",
    description: "حقيبة نسائية عصرية من الجلد الطبيعي. تصميم أنيق ومساحة واسعة للاستخدام اليومي.",
    category: "fashion", 
    colors: ["أسود", "بني", "أحمر"],
    sizes: [],
    relatedProducts: ["3", "5"]
  },
  {
    id: "5",
    name: "ساعة ذكية رياضية",
    price: 6800,
    image: "/placeholder.svg",
    description: "ساعة ذكية متطورة لتتبع اللياقة البدنية والصحة. مقاومة للماء ومتوافقة مع الهواتف الذكية.",
    category: "sports",
    colors: ["أسود", "فضي", "ذهبي"],
    sizes: [],
    relatedProducts: ["1", "6"]
  },
  {
    id: "6",
    name: "طقم أدوات مطبخ",
    price: 5200,
    image: "/placeholder.svg",
    description: "طقم شامل من أدوات المطبخ عالية الجودة. مصنوع من الستانلس ستيل المقاوم للصدأ.",
    category: "home",
    colors: ["فضي"],
    sizes: [],
    relatedProducts: ["7", "8"]
  }
  ,
  {
    id: "7",
    name: "حذاء رياضي خفيف",
    price: 3900,
    image: "/placeholder.svg",
    description: "حذاء رياضي مريح وخفيف للランين والمشي اليومي.",
    category: "sports",
    colors: ["أسود", "أبيض", "أزرق"],
    sizes: ["40", "41", "42", "43", "44"],
    relatedProducts: ["5", "9"]
  },
  {
    id: "8",
    name: "مقلاة غير لاصقة 28 سم",
    price: 2500,
    image: "/placeholder.svg",
    description: "مقلاة عالية الجودة بطبقة غير لاصقة لطهي صحي وسهل التنظيف.",
    category: "home",
    colors: ["أسود"],
    sizes: [],
    relatedProducts: ["6", "10"]
  },
  {
    id: "9",
    name: "جاكيت شتوي مبطن",
    price: 7200,
    image: "/placeholder.svg",
    description: "جاكيت دافئ مبطن لمواجهة برد الشتاء بتصميم أنيق.",
    category: "fashion",
    colors: ["أسود", "كاكي", "أزرق غامق"],
    sizes: ["M", "L", "XL", "XXL"],
    relatedProducts: ["3", "4", "11"]
  },
  {
    id: "10",
    name: "خلاط كهربائي منزلي",
    price: 6100,
    image: "/placeholder.svg",
    description: "خلاط قوي متعدد السرعات لتحضير العصائر والصلصات بسهولة.",
    category: "home",
    colors: ["أبيض"],
    sizes: [],
    relatedProducts: ["6", "8", "12"]
  },
  {
    id: "11",
    name: "سماعة رأس للألعاب",
    price: 5400,
    image: "/placeholder.svg",
    description: "سماعة ألعاب بصوت محيطي وميكروفون عالي الوضوح لجلسات لعب ممتعة.",
    category: "electronics",
    colors: ["أسود", "أحمر"],
    sizes: [],
    relatedProducts: ["1", "2", "12"]
  },
  {
    id: "12",
    name: "كيبورد ميكانيكي بإضاءة RGB",
    price: 8800,
    image: "/placeholder.svg",
    description: "لوحة مفاتيح ميكانيكية بإضاءة RGB قابلة للتخصيص ومفاتيح متينة.",
    category: "electronics",
    colors: ["أسود", "أبيض"],
    sizes: [],
    relatedProducts: ["1", "11"]
  }
];

export const socialMedia = [
  { name: "فيسبوك", icon: "Facebook", url: "https://facebook.com" },
  { name: "إنستغرام", icon: "Instagram", url: "https://instagram.com" },
  { name: "واتساب", icon: "MessageCircle", url: "https://whatsapp.com" },
  { name: "تيك توك", icon: "Music", url: "https://tiktok.com" }
];

export const deliveryPrice = 800; // Fixed delivery price for Algeria