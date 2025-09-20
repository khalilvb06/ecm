// إعدادات Vercel Blob
export const BLOB_CONFIG = {
  // Vercel Blob Token
  BLOB_READ_WRITE_TOKEN: "vercel_blob_rw_gMuQYslmLXATgAGx_ehLsyebU5p9Ob87CMEFHDUZ6FLEpxs",
  
  // معلومات إضافية
  BLOB_NAME: "dmk-pro-blob",
  
  // مجلدات الرفع
  FOLDERS: {
    PRODUCTS: "products",
    LANDING_PAGES: "landing-pages", 
    LOGO: "logo",
    CATEGORIES: "categories",
    TEST: "test"
  }
};

// دالة للتحقق من صحة الإعدادات
export function validateBlobConfig() {
  if (!BLOB_CONFIG.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN not configured');
  }
  return true;
}
