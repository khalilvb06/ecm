// إعدادات النطاق للمتاجر
export const DOMAIN_CONFIG = {
  // النطاق الأساسي للمتاجر
  BASE_DOMAIN: "localhost:8080", // يمكن تغيير هذا إلى النطاق الفعلي
  
  // بروتوكول الاتصال
  PROTOCOL: "http",
  
  // دالة لبناء URL المتجر
  buildStoreUrl: (subdomain) => {
    if (!subdomain) {
      throw new Error('Subdomain is required');
    }
    return `${DOMAIN_CONFIG.PROTOCOL}://${subdomain}.${DOMAIN_CONFIG.BASE_DOMAIN}`;
  },
  
  // دالة لبناء URL المنتج
  buildProductUrl: (subdomain, productId) => {
    if (!subdomain || !productId) {
      throw new Error('Subdomain and productId are required');
    }
    return `${DOMAIN_CONFIG.PROTOCOL}://${subdomain}.${DOMAIN_CONFIG.BASE_DOMAIN}/product/${productId}`;
  },
  
  // دالة لبناء URL صفحة الهبوط
  buildLandingPageUrl: (subdomain, landingPageId) => {
    if (!subdomain || !landingPageId) {
      throw new Error('Subdomain and landingPageId are required');
    }
    return `${DOMAIN_CONFIG.PROTOCOL}://${subdomain}.${DOMAIN_CONFIG.BASE_DOMAIN}/landing/${landingPageId}`;
  }
};

// دالة للتحقق من صحة الإعدادات
export function validateDomainConfig() {
  if (!DOMAIN_CONFIG.BASE_DOMAIN || DOMAIN_CONFIG.BASE_DOMAIN === "yourdomain.com") {
    console.warn('⚠️ يرجى تحديث BASE_DOMAIN في ملف domain-config.js إلى النطاق الفعلي');
    return false;
  }
  return true;
}
