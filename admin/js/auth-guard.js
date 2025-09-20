import { supabase, getCurrentStore, checkStorePermission } from './server-superbase.js';

// قائمة الصفحات الإدارية التي تحتاج مصادقة (بدون امتداد .html)
const ADMIN_PAGES = [
  'dashboard',
  'products', 
  'addLandingPage',
  'orders',
  'ads',
  'categories',
  'shipping',
  'shipping-new',
  'sitting'
];

// دالة للتحقق من أن الصفحة الحالية هي صفحة إدارية
function isAdminPage() {
  const currentPage = window.location.pathname.split('/').pop() || 'index';
  // إزالة امتداد .html إذا كان موجوداً
  const cleanPage = currentPage.replace('.html', '');
  console.log('الصفحة الحالية:', cleanPage);
  
  // تجنب حماية صفحة تسجيل الدخول
  if (cleanPage === 'login') {
    console.log('صفحة تسجيل الدخول - لا حاجة للحماية');
    return false;
  }
  
  const isAdmin = ADMIN_PAGES.includes(cleanPage);
  console.log('هل هي صفحة إدارية؟', isAdmin);
  return isAdmin;
}

// دالة للتوجيه إلى صفحة تسجيل الدخول
function redirectToLogin() {
  console.log('بدء إعادة التوجيه إلى صفحة تسجيل الدخول...');
  // حفظ الصفحة الحالية للعودة إليها بعد تسجيل الدخول
  const currentPage = window.location.pathname.split('/').pop() || 'index';
  const cleanPage = currentPage.replace('.html', '');
  sessionStorage.setItem('redirectAfterLogin', cleanPage);
  console.log('تم حفظ الصفحة الحالية:', cleanPage);
  
  // التوجيه إلى صفحة تسجيل الدخول فوراً
  window.location.href = '/admin/login';
}

// دالة للتحقق من المصادقة مع timeout
async function checkAuthWithTimeout() {
  try {
    // إضافة timeout للاتصال بـ Supabase (أطول لتوافق الهاتف والشبكات البطيئة)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), 12000);
    });
    
    const authPromise = supabase.auth.getUser();
    
    const { data: { user }, error } = await Promise.race([authPromise, timeoutPromise]);
    
    if (error) {
      console.error('خطأ في التحقق من المصادقة:', error);
      return { user: null, error };
    }
    
    return { user, error: null };
  } catch (error) {
    console.error('خطأ في الاتصال أو timeout:', error);
    return { user: null, error };
  }
}

// دالة لحماية الصفحات الإدارية
async function protectAdminPages() {
  console.log('=== بدء حماية الصفحات الإدارية ===');
  
  if (isAdminPage()) {
    console.log('صفحة إدارية مكتشفة، التحقق من المصادقة...');
    
    const { user, error } = await checkAuthWithTimeout();
    
    if (error || !user) {
      console.log('المصادقة فشلت، إعادة التوجيه فوراً...');
      redirectToLogin();
      return false;
    }
    
    // التحقق من وجود متجر للمستخدم
    const { store, error: storeError } = await getCurrentStore();
    if (storeError || !store) {
      console.log('المستخدم ليس مرتبطاً بأي متجر، إعادة التوجيه...');
      redirectToLogin();
      return false;
    }
    
    // التحقق من الصلاحيات
    const { hasPermission } = await checkStorePermission('admin');
    if (!hasPermission) {
      console.log('المستخدم ليس لديه صلاحيات كافية، إعادة التوجيه...');
      redirectToLogin();
      return false;
    }
    
    console.log('المصادقة ناجحة، يمكن الوصول للصفحة');
    console.log('معلومات المستخدم:', user.email);
    console.log('معلومات المتجر:', store.name);
    return true;
  } else {
    console.log('هذه ليست صفحة إدارية، لا حاجة للمصادقة');
    return true;
  }
}

// بدء الحماية مرة واحدة فقط عند تحميل السكريبت
console.log('=== بدء تحميل auth-guard.js ===');
console.log('الرابط الحالي:', window.location.href);
console.log('المسار الحالي:', window.location.pathname);
console.log('بدء حماية الصفحات (استدعاء واحد)...');
protectAdminPages();

// تصدير الدوال للاستخدام في ملفات أخرى
export { protectAdminPages, isAdminPage }; 
