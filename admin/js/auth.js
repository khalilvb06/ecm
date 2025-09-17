import { supabase, getCurrentStore, getCurrentStoreId, checkStorePermission } from './server-superbase.js';

// دالة للتحقق من حالة تسجيل الدخول مع timeout
export async function checkAuth() {
  try {
    // إضافة timeout للاتصال (2 ثانية فقط)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), 5000);
    });
    
    const authPromise = supabase.auth.getUser();
    const { data: { user }, error } = await Promise.race([authPromise, timeoutPromise]);
    
    if (error) {
      console.error('خطأ في التحقق من المصادقة:', error);
      redirectToLogin();
      return false;
    }
    
    if (!user) {
      console.log('المستخدم غير مسجل دخوله');
      redirectToLogin();
      return false;
    }
    
    console.log('المستخدم مسجل دخوله:', user.email);
    return true;
  } catch (error) {
    console.error('خطأ في التحقق من المصادقة:', error);
    redirectToLogin();
    return false;
  }
}

// دالة للتوجيه إلى صفحة تسجيل الدخول
function redirectToLogin() {
  // حفظ الصفحة الحالية للعودة إليها بعد تسجيل الدخول
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  sessionStorage.setItem('redirectAfterLogin', currentPage);
  
  // التوجيه إلى صفحة تسجيل الدخول فوراً
  window.location.href = 'login.html';
}

// دالة لتسجيل الخروج
export async function logout() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('خطأ في تسجيل الخروج:', error);
      return false;
    }
    
    // مسح البيانات المحفوظة
    localStorage.removeItem('rememberedEmail');
    localStorage.removeItem('rememberMe');
    sessionStorage.clear();
    
    // التوجيه إلى صفحة تسجيل الدخول
    window.location.href = 'login.html';
    return true;
  } catch (error) {
    console.error('خطأ في تسجيل الخروج:', error);
    return false;
  }
}

// دالة للحصول على معلومات المستخدم
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('خطأ في الحصول على معلومات المستخدم:', error);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('خطأ في الحصول على معلومات المستخدم:', error);
    return null;
  }
}

// دالة للحصول على معلومات المتجر الحالي
export async function getCurrentStoreInfo() {
  try {
    const { store, error } = await getCurrentStore();
    if (error) {
      console.error('خطأ في الحصول على معلومات المتجر:', error);
      return null;
    }
    return store;
  } catch (error) {
    console.error('خطأ في الحصول على معلومات المتجر:', error);
    return null;
  }
}

// دالة للحصول على معرف المتجر الحالي
export async function getCurrentStoreIdInfo() {
  try {
    const storeId = await getCurrentStoreId();
    return storeId;
  } catch (error) {
    console.error('خطأ في الحصول على معرف المتجر:', error);
    return null;
  }
}

// دالة لإضافة زر تسجيل الخروج للصفحة
export function addLogoutButton() {
  // البحث عن عنصر القائمة أو إضافة زر تسجيل الخروج
  const navbar = document.querySelector('.navbar, .main-header, header');
  if (navbar) {
    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'btn btn-outline-light btn-sm ms-2';
    logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt me-1"></i>تسجيل الخروج';
    logoutBtn.onclick = logout;
    
    // إضافة الزر إلى القائمة
    const navContainer = navbar.querySelector('.navbar-nav, .d-flex, .container');
    if (navContainer) {
      navContainer.appendChild(logoutBtn);
    } else {
      navbar.appendChild(logoutBtn);
    }
  }
}

// دالة لإضافة معلومات المستخدم والمتجر للصفحة
export async function addUserInfo() {
  const user = await getCurrentUser();
  const store = await getCurrentStoreInfo();
  
  if (user) {
    // إضافة اسم المستخدم في مكان مناسب
    const userInfoElements = document.querySelectorAll('.user-info, .current-user');
    userInfoElements.forEach(element => {
      element.textContent = user.email || 'المدير';
    });
  }
  
  if (store) {
    // إضافة اسم المتجر في مكان مناسب
    const storeInfoElements = document.querySelectorAll('.store-info, .current-store');
    storeInfoElements.forEach(element => {
      element.textContent = store.name || 'المتجر';
    });
  }
}

// دالة لتهيئة المصادقة في الصفحة
export async function initAuth() {
  console.log('بدء تهيئة المصادقة...');
  
  // التحقق من حالة تسجيل الدخول
  const isAuthenticated = await checkAuth();
  
  if (isAuthenticated) {
    console.log('المصادقة ناجحة، إضافة عناصر الواجهة...');
    
    // إضافة زر تسجيل الخروج
    addLogoutButton();
    
    // إضافة معلومات المستخدم
    await addUserInfo();
    
    // إضافة مستمع لتغيير حالة المصادقة
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        console.log('تم تسجيل الخروج، التوجيه إلى صفحة تسجيل الدخول...');
        redirectToLogin();
      }
    });
    
    return true;
  }
  
  return false;
}

// دالة للتحقق من الصلاحيات
export async function checkPermissions(requiredRole = 'admin') {
  try {
    const { hasPermission, role } = await checkStorePermission(requiredRole);
    return hasPermission;
  } catch (error) {
    console.error('خطأ في التحقق من الصلاحيات:', error);
    return false;
  }
}

// تصدير الدوال للاستخدام في الملفات الأخرى
export default {
  checkAuth,
  logout,
  getCurrentUser,
  addLogoutButton,
  addUserInfo,
  initAuth,
  checkPermissions
}; 
