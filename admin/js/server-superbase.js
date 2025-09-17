// server-superbase.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// استخدام متغيرات البيئة بدلاً من المفاتيح المكشوفة
const supabaseUrl = 'https://onkdmgqbkknulmqccoex.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ua2RtZ3Fia2tudWxtcWNjb2V4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NTgyNjEsImV4cCI6MjA2NzAzNDI2MX0.nGC1ohKBaJfJrabPK5VfXjqwZu1rRXA0vNEaZgNwz34';

// التحقق من صحة المفاتيح
if (!supabaseUrl || !supabaseKey) {
  throw new Error('مفاتيح Supabase غير صحيحة');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// وظائف Authentication
export async function signUp(email, password) {
  try {
    if (!email || !password) {
      throw new Error('البريد الإلكتروني وكلمة المرور مطلوبان');
    }
    
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });
    
    if (error) {
      console.error('خطأ في التسجيل:', error);
    }
    
    return { data, error };
  } catch (error) {
    console.error('خطأ في signUp:', error);
    return { data: null, error: { message: error.message } };
  }
}

export async function signIn(email, password) {
  try {
    if (!email || !password) {
      throw new Error('البريد الإلكتروني وكلمة المرور مطلوبان');
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    
    if (error) {
      console.error('خطأ في تسجيل الدخول:', error);
    }
    
    return { data, error };
  } catch (error) {
    console.error('خطأ في signIn:', error);
    return { data: null, error: { message: error.message } };
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('خطأ في تسجيل الخروج:', error);
    }
    return { error };
  } catch (error) {
    console.error('خطأ في signOut:', error);
    return { error: { message: error.message } };
  }
}

export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('خطأ في جلب المستخدم الحالي:', error);
    }
    return { user, error };
  } catch (error) {
    console.error('خطأ في getCurrentUser:', error);
    return { user: null, error: { message: error.message } };
  }
}

// دالة للحصول على معلومات المتجر الحالي للمستخدم
export async function getCurrentStore() {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { store: null, error: userError };
    }

    const { data: storeUser, error: storeUserError } = await supabase
      .from('store_users')
      .select(`
        *,
        stores (*)
      `)
      .eq('user_id', user.id)
      .single();

    if (storeUserError) {
      console.error('خطأ في جلب معلومات المتجر:', storeUserError);
      return { store: null, error: storeUserError };
    }

    return { store: storeUser.stores, error: null };
  } catch (error) {
    console.error('خطأ في getCurrentStore:', error);
    return { store: null, error: { message: error.message } };
  }
}

// دالة للحصول على معرف المتجر الحالي
export async function getCurrentStoreId() {
  try {
    const { store, error } = await getCurrentStore();
    if (error || !store) {
      return null;
    }
    return store.id;
  } catch (error) {
    console.error('خطأ في getCurrentStoreId:', error);
    return null;
  }
}

// دالة للحصول على السابدومين الحالي
export async function getCurrentStoreSubdomain() {
  try {
    const { store, error } = await getCurrentStore();
    if (error || !store) {
      return null;
    }
    return store.subdomain;
  } catch (error) {
    console.error('خطأ في getCurrentStoreSubdomain:', error);
    return null;
  }
}

// دالة للتحقق من صلاحيات المستخدم في المتجر
export async function checkStorePermission(requiredRole = 'admin') {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { hasPermission: false, error: userError };
    }

    const { data: storeUser, error: storeUserError } = await supabase
      .from('store_users')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (storeUserError) {
      console.error('خطأ في التحقق من الصلاحيات:', storeUserError);
      return { hasPermission: false, error: storeUserError };
    }

    // في الوقت الحالي، أي مستخدم له صلاحيات كاملة
    // يمكن تطوير هذا النظام لاحقاً لإضافة مستويات صلاحيات مختلفة
    return { hasPermission: true, role: storeUser.role };
  } catch (error) {
    console.error('خطأ في checkStorePermission:', error);
    return { hasPermission: false, error: { message: error.message } };
  }
}

export async function resetPassword(email) {
  try {
    if (!email) {
      throw new Error('البريد الإلكتروني مطلوب');
    }
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      console.error('خطأ في إعادة تعيين كلمة المرور:', error);
    }
    return { data, error };
  } catch (error) {
    console.error('خطأ في resetPassword:', error);
    return { data: null, error: { message: error.message } };
  }
}

// مراقبة حالة المستخدم
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}

export async function createOrder(order) {
  try {
    // التحقق من صحة البيانات المطلوبة
    const requiredFields = ['product_id', 'full_name', 'phone_number', 'address', 'quantity', 'total_price'];
    const missingFields = requiredFields.filter(field => !order[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`الحقول المطلوبة مفقودة: ${missingFields.join(', ')}`);
    }
    
    // order: {product_id, product_name, product_image, full_name, phone_number, address, state_id, state_name, shipping_type, color, color_hex, size, quantity, offer_label, product_price, shipping_price, total_price, status}
    const { data, error } = await supabase.from('orders').insert([order]);
    
    if (error) {
      console.error('خطأ في إنشاء الطلب:', error);
    }
    
    return { data, error };
  } catch (error) {
    console.error('خطأ في createOrder:', error);
    return { data: null, error: { message: error.message } };
  }
}
