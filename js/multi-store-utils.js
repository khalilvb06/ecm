// Multi-Store System Utilities
// أدوات نظام متعدد المتاجر

// دالة مساعدة لاستخراج subdomain من hostname مع fallback للـ query parameter
function getSubdomain() {
  const urlParams = new URLSearchParams(window.location.search);
  const querySub = urlParams.get('subdomain');
  if (querySub && querySub.trim()) return querySub.trim();

  const host = window.location.hostname;
  const parts = host.split('.');

  // دعم vercel.app: project.vercel.app أو store.project.vercel.app
  if (host.endsWith('.vercel.app')) {
    if (parts.length === 3) return 'default';
    if (parts.length > 3) return parts.slice(0, parts.length - 3).join('.');
    return 'default';
  }

  // دومين مخصص: store.domain.com
  if (parts.length > 2) return parts.slice(0, -2).join('.');
  return 'default';
}

// دالة مساعدة لجلب معلومات المتجر عبر subdomain
async function getStoreBySubdomain() {
  const subdomain = await getSubdomain();
  console.log('Subdomain detected:', subdomain);
  
  try {
    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .select('id, name, subdomain')
      .eq('subdomain', subdomain)
      .single();
    
    if (storeError) {
      console.error('Error fetching store by subdomain:', storeError);
      console.error('Error details:', {
        message: storeError.message,
        details: storeError.details,
        hint: storeError.hint,
        code: storeError.code
      });
      return null;
    }
    
    if (!storeData) {
      console.error('Store not found for subdomain:', subdomain);
      return null;
    }
    
    console.log('Store found:', storeData);
    return storeData;
  } catch (err) {
    console.error('Exception while fetching store:', err);
    return null;
  }
}

// دالة مساعدة لجلب إعدادات المتجر
async function getStoreSettings(storeId) {
  console.log('Attempting to fetch store settings for store_id:', storeId);
  
  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('*')
      .eq('store_id', storeId)
      .single();
    
    if (error) {
      console.error('Error loading store settings:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return null;
    }
    
    console.log('Store settings loaded successfully:', data);
    return data;
  } catch (err) {
    console.error('Exception while loading store settings:', err);
    return null;
  }
}

// دالة مساعدة لجلب المنتجات للمتجر
async function getProductsByStore(storeId) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', storeId)
    .order('id', { ascending: false });
  
  if (error) {
    console.error('Error loading products:', error);
    return [];
  }
  
  return data || [];
}

// دالة مساعدة لجلب التصنيفات للمتجر
async function getCategoriesByStore(storeId) {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, image_url')
    .eq('store_id', storeId)
    .order('id', { ascending: false });
  
  if (error) {
    console.error('Error loading categories:', error);
    return [];
  }
  
  return data || [];
}

// دالة مساعدة لجلب صفحات الهبوط للمتجر
async function getLandingPagesByStore(storeId) {
  const { data, error } = await supabase
    .from('landing_pages')
    .select('*')
    .eq('store_id', storeId)
    .order('id', { ascending: false });
  
  if (error) {
    console.error('Error loading landing pages:', error);
    return [];
  }
  
  return data || [];
}

// دالة مساعدة لتطبيق إعدادات المتجر
function applyStoreSettings(settings) {
  if (!settings) return;
  
  // تطبيق لون الأزرار
  if (settings.btncolor) {
    let backgroundColor = '#007bff';
    let textColor = '#ffffff';
    
    // التعامل مع البيانات الجديدة والقديمة
    if (typeof settings.btncolor === 'object') {
      backgroundColor = settings.btncolor.backgroundColor || '#007bff';
      textColor = settings.btncolor.textColor || '#ffffff';
    } else if (typeof settings.btncolor === 'string') {
      // للتوافق مع البيانات القديمة
      backgroundColor = settings.btncolor;
      textColor = '#ffffff';
    }
    
    const style = document.createElement('style');
    style.textContent = `
      :root {
        --button-color: ${backgroundColor};
        --button-text-color: ${textColor};
      }
      .btn-main {
        background: ${backgroundColor} !important;
        color: ${textColor} !important;
        border-radius: 25px;
        font-weight: bold;
        transition: background 0.2s;
      }
      .btn-main:hover {
        background: ${backgroundColor} !important;
        color: ${textColor} !important;
        opacity: 0.9;
      }
      .title-underline {
        background: ${backgroundColor} !important;
      }
      .section-title {
        border-bottom: 3px solid ${backgroundColor} !important;
      }
      .top-banner {
        background: ${backgroundColor} !important;
        color: ${textColor} !important;
      }
      .nav-links a:hover {
        color: ${backgroundColor} !important;
      }
      .search-input:focus {
        border-color: ${backgroundColor} !important;
        box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1) !important;
      }
      .search-btn {
        background: ${backgroundColor} !important;
        color: ${textColor} !important;
      }
      .search-btn:hover {
        background: ${backgroundColor} !important;
        opacity: 0.9;
      }
      .menu-btn {
        background: ${backgroundColor} !important;
        color: ${textColor} !important;
      }
      .menu-btn:hover {
        background: ${backgroundColor} !important;
        opacity: 0.9;
      }
      .logo-underline {
        background: ${backgroundColor} !important;
      }
      .sidebar-nav a:hover {
        background: ${backgroundColor} !important;
        color: ${textColor} !important;
      }
      .search-modal-btn {
        background: ${backgroundColor} !important;
        color: ${textColor} !important;
      }
      .search-modal-btn:hover {
        background: ${backgroundColor} !important;
        opacity: 0.9;
      }
    `;
    document.head.appendChild(style);
  }
  
  // تطبيق لون النص
  if (settings.textcolor) {
    document.body.style.color = settings.textcolor;
  }
  
  // تطبيق اسم المتجر
  if (settings.name) {
    const storeNameElements = document.querySelectorAll('#store-name, #welcome-store-name, #footer-store-name, #main-store-name');
    storeNameElements.forEach(element => {
      element.textContent = settings.name;
    });
  }
  
  // تطبيق الشعار
  if (settings.logo) {
    const logoElements = document.querySelectorAll('#store-logo');
    logoElements.forEach(element => {
      element.src = settings.logo;
    });
  }
  
  // تطبيق لون الهيدر والفوتر
  if (settings.headercolor) {
    document.querySelectorAll('.main-header').forEach(el => {
      el.style.backgroundColor = settings.headercolor;
    });
    document.querySelectorAll('.main-footer').forEach(el => {
      el.style.backgroundColor = settings.headercolor;
    });
  }
  
  // تطبيق روابط وسائل التواصل الاجتماعي
  applySocialMediaLinks(settings);
}

// دالة مساعدة لتطبيق روابط وسائل التواصل الاجتماعي
function applySocialMediaLinks(settings) {
  const socialIconsContainer = document.getElementById('social-media-icons');
  if (!socialIconsContainer) return;
  
  let hasAnySocialLink = false;
  
  // تطبيق رابط الفيسبوك
  if (settings.facebook_url && settings.facebook_url.trim()) {
    const facebookIcon = socialIconsContainer.querySelector('.facebook-icon');
    if (facebookIcon) {
      facebookIcon.href = settings.facebook_url;
      facebookIcon.style.display = 'inline-block';
      hasAnySocialLink = true;
    }
  }
  
  // تطبيق رابط الانستقرام
  if (settings.instagram_url && settings.instagram_url.trim()) {
    const instagramIcon = socialIconsContainer.querySelector('.instagram-icon');
    if (instagramIcon) {
      instagramIcon.href = settings.instagram_url;
      instagramIcon.style.display = 'inline-block';
      hasAnySocialLink = true;
    }
  }
  
  // تطبيق رابط الواتساب
  if (settings.whatsapp_url && settings.whatsapp_url.trim()) {
    const whatsappIcon = socialIconsContainer.querySelector('.whatsapp-icon');
    if (whatsappIcon) {
      // تنسيق رابط الواتساب
      let whatsappUrl = settings.whatsapp_url;
      if (!whatsappUrl.startsWith('https://wa.me/') && !whatsappUrl.startsWith('http://wa.me/')) {
        // إزالة الرموز والمسافات من رقم الهاتف
        const phoneNumber = whatsappUrl.replace(/[\s\-\(\)]/g, '');
        whatsappUrl = `https://wa.me/${phoneNumber}`;
      }
      whatsappIcon.href = whatsappUrl;
      whatsappIcon.style.display = 'inline-block';
      hasAnySocialLink = true;
    }
  }
  
  // تطبيق رابط التيك توك
  if (settings.tiktok_url && settings.tiktok_url.trim()) {
    const tiktokIcon = socialIconsContainer.querySelector('.tiktok-icon');
    if (tiktokIcon) {
      tiktokIcon.href = settings.tiktok_url;
      tiktokIcon.style.display = 'inline-block';
      hasAnySocialLink = true;
    }
  }
  
  // إظهار أو إخفاء حاوية الأيقونات
  if (hasAnySocialLink) {
    socialIconsContainer.style.display = 'block';
  } else {
    socialIconsContainer.style.display = 'none';
  }
}

// تصدير الدوال للاستخدام في الصفحات الأخرى
window.MultiStoreUtils = {
  getSubdomain,
  getStoreBySubdomain,
  getStoreSettings,
  getProductsByStore,
  getCategoriesByStore,
  getLandingPagesByStore,
  applyStoreSettings,
  applySocialMediaLinks
};
