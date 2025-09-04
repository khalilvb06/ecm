// store-utils.js - ملف موحد للدوال المشتركة بين الصفحات
import { supabase } from './server-superbase.js';

// متغيرات عامة
let currentStore = null;
let storeSettings = null;

// دالة لجلب معلومات المتجر من subdomain
export async function getStoreFromSubdomain(subdomain = 'default') {
  try {
    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .select('id, name, subdomain, domain, is_active')
      .eq('subdomain', subdomain)
      .eq('is_active', true)
      .single();
    
    if (storeError || !storeData) {
      console.error('Store not found for subdomain:', subdomain);
      return null;
    }
    
    currentStore = storeData;
    return storeData;
  } catch (error) {
    console.error('Error fetching store:', error);
    return null;
  }
}

// دالة لجلب إعدادات المتجر
export async function getStoreSettings(storeId) {
  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('*')
      .eq('store_id', storeId)
      .single();

    if (error) {
      console.error('Error fetching store settings:', error);
      return null;
    }

    storeSettings = data;
    return data;
  } catch (error) {
    console.error('Error fetching store settings:', error);
    return null;
  }
}

// دالة لتطبيق إعدادات المتجر على الصفحة
export function applyStoreSettings(settings) {
  if (!settings) return;

  // تطبيق لون الأزرار
  if (settings.btncolor) {
    let backgroundColor = '#007bff';
    let textColor = '#ffffff';
    
    if (typeof settings.btncolor === 'object') {
      backgroundColor = settings.btncolor.backgroundColor || '#007bff';
      textColor = settings.btncolor.textColor || '#ffffff';
    } else if (typeof settings.btncolor === 'string') {
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
      .search-modal-btn-submit {
        background: ${backgroundColor} !important;
        color: ${textColor} !important;
      }
      .search-modal-btn-submit:hover {
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
    const storeNameElements = document.querySelectorAll('#store-name, #welcome-store-name, #footer-store-name, #main-store-name, #store-name-display, #contact-store-name');
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

  // تطبيق وصف المتجر
  const descriptionElement = document.getElementById('store-description');
  if (descriptionElement && settings.store_description) {
    const hasValidDescription = settings.store_description && 
                              typeof settings.store_description === 'string' && 
                              settings.store_description.trim() !== '' && 
                              settings.store_description !== 'null' && 
                              settings.store_description !== 'undefined';
    
    if (hasValidDescription) {
      descriptionElement.innerHTML = settings.store_description.replace(/\n/g, '<br>');
    } else {
      descriptionElement.innerHTML = `
        مرحباً بكم في <strong>${settings.name || 'متجرنا'}</strong>! نحن متجر إلكتروني متخصص في تقديم أفضل المنتجات بأعلى جودة وأفضل الأسعار.
        <br><br>
        نحرص على تقديم خدمة عملاء متميزة وتوصيل سريع وآمن لجميع أنحاء البلاد. نضمن لكم الجودة والموثوقية في كل منتج نقدمه.
        <br><br>
        نسعى دائماً لتطوير خدماتنا وتوسيع منتجاتنا لتلبية احتياجاتكم المختلفة. شكراً لثقتكم بنا!
      `;
    }
  }
}

// دالة لتطبيق روابط وسائل التواصل الاجتماعي
export function applySocialMediaLinks(settings) {
  const socialIconsContainer = document.getElementById('social-media-icons');
  const socialSection = document.getElementById('social-media-section');
  const socialGrid = document.getElementById('social-media-grid');
  
  if (!socialIconsContainer) return;
  
  let hasAnySocialLink = false;
  let socialCards = '';
  
  // تطبيق روابط وسائل التواصل الاجتماعي في الفوتر
  if (socialIconsContainer) {
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
        let whatsappUrl = settings.whatsapp_url;
        if (!whatsappUrl.startsWith('https://wa.me/') && !whatsappUrl.startsWith('http://wa.me/')) {
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

  // إضافة بطاقات وسائل التواصل الاجتماعي في صفحة about-us
  if (socialSection && socialGrid) {
    // إضافة بطاقة الفيسبوك
    if (settings.facebook_url && settings.facebook_url.trim()) {
      socialCards += `
        <a href="${settings.facebook_url}" class="social-card" target="_blank" rel="noopener noreferrer">
          <div class="social-icon-large">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Facebook_Logo_%282019%29.png/1024px-Facebook_Logo_%282019%29.png" alt="Facebook">
          </div>
          <div class="social-name">فيسبوك</div>
          <div class="social-link">
            تابعنا على فيسبوك
          </div>
        </a>
      `;
      hasAnySocialLink = true;
    }
    
    // إضافة بطاقة الانستقرام
    if (settings.instagram_url && settings.instagram_url.trim()) {
      socialCards += `
        <a href="${settings.instagram_url}" class="social-card" target="_blank" rel="noopener noreferrer">
          <div class="social-icon-large">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Instagram_logo_2016.svg/198px-Instagram_logo_2016.svg.png?20210403190622" alt="Instagram">
          </div>
          <div class="social-name">انستقرام</div>
          <div class="social-link">
            تابعنا على انستقرام
          </div>
        </a>
      `;
      hasAnySocialLink = true;
    }
    
    // إضافة بطاقة الواتساب
    if (settings.whatsapp_url && settings.whatsapp_url.trim()) {
      let whatsappUrl = settings.whatsapp_url;
      if (!whatsappUrl.startsWith('https://wa.me/') && !whatsappUrl.startsWith('http://wa.me/')) {
        const phoneNumber = whatsappUrl.replace(/[\s\-\(\)]/g, '');
        whatsappUrl = `https://wa.me/${phoneNumber}`;
      }
      
      socialCards += `
        <a href="${whatsappUrl}" class="social-card" target="_blank" rel="noopener noreferrer">
          <div class="social-icon-large">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/2062095_application_chat_communication_logo_whatsapp_icon.svg/105px-2062095_application_chat_communication_logo_whatsapp_icon.svg.png?20220531073934" alt="WhatsApp">
          </div>
          <div class="social-name">واتساب</div>
          <div class="social-link">
            تواصل معنا عبر واتساب
          </div>
        </a>
      `;
      hasAnySocialLink = true;
    }
    
    // إضافة بطاقة التيك توك
    if (settings.tiktok_url && settings.tiktok_url.trim()) {
      socialCards += `
        <a href="${settings.tiktok_url}" class="social-card" target="_blank" rel="noopener noreferrer">
          <div class="social-icon-large">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Ionicons_logo-tiktok.svg/768px-Ionicons_logo-tiktok.svg.png" alt="TikTok">
          </div>
          <div class="social-name">تيك توك</div>
          <div class="social-link">
            تابعنا على تيك توك
          </div>
        </a>
      `;
      hasAnySocialLink = true;
    }
    
    // إظهار أو إخفاء قسم وسائل التواصل الاجتماعي
    if (hasAnySocialLink) {
      socialGrid.innerHTML = socialCards;
      socialSection.style.display = 'block';
    } else {
      socialSection.style.display = 'none';
    }
  }
}

// دالة لجلب التصنيفات
export async function getCategories(storeId) {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, image_url')
      .eq('store_id', storeId)
      .order('id', { ascending: false });

    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

// دالة لجلب المنتجات
export async function getProducts(storeId, options = {}) {
  try {
    let query = supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId)
      .eq('available', true);

    // فلترة بالتصنيف إذا تم تحديده
    if (options.categoryId) {
      query = query.eq('category_id', options.categoryId);
    }

    // ترتيب المنتجات
    if (options.sortBy) {
      switch (options.sortBy) {
        case 'newest':
          query = query.order('id', { ascending: false });
          break;
        case 'oldest':
          query = query.order('id', { ascending: true });
          break;
        case 'price-low':
          query = query.order('price', { ascending: true });
          break;
        case 'price-high':
          query = query.order('price', { ascending: false });
          break;
        case 'name-asc':
          query = query.order('name', { ascending: true });
          break;
        case 'name-desc':
          query = query.order('name', { ascending: false });
          break;
        default:
          query = query.order('id', { ascending: false });
      }
    } else {
      query = query.order('id', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

// دالة لجلب منتجات صفحات الهبوط
export async function getLandingProducts(storeId) {
  try {
    const { data, error } = await supabase
      .from('landing_pages')
      .select('*')
      .eq('store_id', storeId)
      .eq('available', true)
      .order('id', { ascending: false });

    if (error) {
      console.error('Error fetching landing products:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching landing products:', error);
    return [];
  }
}

// دالة لفلترة المنتجات
export function filterProducts(products, filters = {}) {
  let filtered = [...products];

  // فلترة بالاسم
  if (filters.searchTerm) {
    const searchTerm = filters.searchTerm.toLowerCase();
    filtered = filtered.filter(product => {
      const nameMatch = product.name.toLowerCase().includes(searchTerm);
      const descMatch = product.descr ? product.descr.toLowerCase().includes(searchTerm) : false;
      return nameMatch || descMatch;
    });
  }

  // فلترة بالتصنيف
  if (filters.categoryId) {
    filtered = filtered.filter(product => product.category_id == filters.categoryId);
  }

  // فلترة بالسعر
  if (filters.priceRange) {
    const [min, max] = filters.priceRange.split('-').map(Number);
    filtered = filtered.filter(product => {
      const price = Number(product.price);
      if (filters.priceRange === '10000+') {
        return price >= 10000;
      }
      return price >= min && price <= max;
    });
  }

  return filtered;
}

// دالة لمعالجة الصور
export function processProductImage(imageData) {
  let image = 'https://via.placeholder.com/300x200';
  
  // التحقق من وجود البيانات وأنها نص
  if (!imageData || typeof imageData !== 'string') {
    return image;
  }
  
  try {
    if (imageData.startsWith('[')) {
      const images = JSON.parse(imageData);
      if (images && Array.isArray(images) && images.length > 0) {
        image = images[0];
      }
    } else {
      image = imageData;
    }
  } catch(e) {
    // في حالة فشل تحليل JSON، استخدم البيانات كما هي
    image = imageData;
  }
  
  return image;
}

// دالة لمعالجة العروض
export function processProductOffers(offersData) {
  let offers = [];
  try { 
    offers = offersData ? JSON.parse(offersData) : []; 
  } catch(e) { 
    offers = []; 
  }
  
  let offerHtml = '';
  if (offers.length > 0) {
    offerHtml = `<div class="mt-2"><span class="badge bg-warning text-dark">عرض خاص: ${offers[0].qty} قطعة بـ ${offers[0].price} دج</span></div>`;
  }
  
  return offerHtml;
}

// دوال التنقل والتفاعل
export function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  
  sidebar.classList.toggle('open');
  overlay.classList.toggle('active');
}

export function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  
  sidebar.classList.remove('open');
  overlay.classList.remove('active');
}

export function openSearchModal() {
  const searchModal = document.getElementById('search-modal');
  const input = document.getElementById('search-modal-input');
  
  searchModal.classList.add('active');
  setTimeout(() => {
    input.focus();
  }, 100);
}

export function closeSearchModal() {
  const searchModal = document.getElementById('search-modal');
  const input = document.getElementById('search-modal-input');
  
  searchModal.classList.remove('active');
  input.value = '';
}

export function performModalSearch() {
  const input = document.getElementById('search-modal-input');
  const searchTerm = input.value.trim();
  
  if (searchTerm) {
    // إعادة توجيه إلى صفحة المنتجات مع مصطلح البحث
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('search', searchTerm);
    window.location.href = currentUrl.toString();
  }
}

// دالة debounce للبحث
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// دالة لإنشاء رابط مع subdomain
export function createUrlWithSubdomain(path, subdomain) {
  const url = new URL(path, window.location.origin);
  // لم نعد نضيف subdomain كـ query param لأن القراءة تتم من hostname
  return url.toString();
}

// دالة جديدة للحصول على subdomain من serverless function
export async function getSubdomainFromServer() {
  try {
    const response = await fetch('/api/subdomain');
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.subdomain) {
        console.log('Subdomain from server:', data.subdomain);
        return data.subdomain;
      }
    }
  } catch (error) {
    console.log('Error fetching subdomain from server, falling back to client-side detection:', error);
  }
  return null;
}

// دالة لاستخراج subdomain من hostname مع fallback للـ query param
export async function getSubdomainFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const querySub = urlParams.get('subdomain');
  if (querySub && querySub.trim()) return querySub.trim();

  // محاولة الحصول من serverless function أولاً
  const serverSubdomain = await getSubdomainFromServer();
  if (serverSubdomain) {
    return serverSubdomain;
  }

  // Fallback للكود القديم
  const host = window.location.hostname;
  const parts = host.split('.');

  // دعم vercel.app: project.vercel.app أو store.project.vercel.app
  if (host.endsWith('.vercel.app')) {
    // project.vercel.app → لا يوجد subdomain متجر
    if (parts.length === 3) return 'default';
    // store.project.vercel.app → subdomain المتجر هو الأجزاء قبل project.vercel.app
    if (parts.length > 3) return parts.slice(0, parts.length - 3).join('.');
    return 'default';
  }

  // دومين مخصص: store.domain.com أو multi.part.domain.com
  if (parts.length > 2) return parts.slice(0, -2).join('.');
  return 'default';
}

// دالة لتهيئة الصفحة
export async function initializePage() {
  try {
    // إظهار مودل التحميل
    const loadingModal = document.getElementById('loading-modal');
    if (loadingModal) {
      loadingModal.style.display = 'flex';
    }

    // جلب subdomain
    const subdomain = await getSubdomainFromUrl();
    
    // جلب معلومات المتجر
    const store = await getStoreFromSubdomain(subdomain);
    if (!store) {
      throw new Error('Store not found');
    }

    // جلب إعدادات المتجر
    const settings = await getStoreSettings(store.id);
    if (settings) {
      // تطبيق الإعدادات
      applyStoreSettings(settings);
      applySocialMediaLinks(settings);
    }

    // إضافة الدوال للـ window object
    window.toggleSidebar = toggleSidebar;
    window.closeSidebar = closeSidebar;
    window.openSearchModal = openSearchModal;
    window.closeSearchModal = closeSearchModal;
    window.performModalSearch = performModalSearch;

    // إخفاء مودل التحميل
    if (loadingModal) {
      loadingModal.style.display = 'none';
    }

    return { store, settings };
  } catch (error) {
    console.error('Error initializing page:', error);
    
    // إخفاء مودل التحميل في حالة الخطأ
    const loadingModal = document.getElementById('loading-modal');
    if (loadingModal) {
      loadingModal.style.display = 'none';
    }
    
    return null;
  }
}

// تصدير المتغيرات العامة
export { currentStore, storeSettings };
