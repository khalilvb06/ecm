// cumun.js - ملف مشترك للصفحات المختلفة
import { 
  initializePage, 
  getProducts, 
  getCategories, 
  getLandingProducts, 
  filterProducts as filterProductsUtil, 
  processProductImage, 
  processProductOffers,
  createUrlWithSubdomain,
  getSubdomainFromUrl,
  debounce,
  getStoreFromSubdomain
} from './store-utils.js';

// دالة للحصول على subdomain الحالي (متاحة عالمياً)
window.getCurrentSubdomain = async function() {
  return await getSubdomainFromUrl();
};

// متغيرات عامة
let allProducts = [];
let filteredProducts = [];
let allCategories = [];
let allLandingProducts = [];

// ==================== دوال عرض المنتجات ====================

// دالة لعرض المنتجات
function displayProducts(products = filteredProducts) {
  const container = document.getElementById('products-list');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (!products || products.length === 0) {
    container.innerHTML = '<div class="alert alert-info">لا توجد منتجات مطابقة للبحث</div>';
    return;
  }

  // لا حاجة لقراءة subdomain هنا

  products.forEach(product => {
    const image = processProductImage(product.image);
    const descr = product.descr ? product.descr.substring(0, 50) + '...' : '';
    const offerHtml = processProductOffers(product.offers);
    
    // إنشاء رابط المنتج بدون تمرير subdomain كـ query param
    const productUrl = `product.html?id=${product.id}`;
    
    // إظهار المنتجات المتوفرة فقط
    if (product.available !== false) {
      container.innerHTML += `
        <div class="col-lg-4 col-md-6 col-sm-6 col-6 d-flex align-items-stretch product-card" data-name="${product.name.toLowerCase()}" data-price="${product.price}">
          <div class="card h-100 w-100" style="cursor: pointer;" onclick="window.location.href='${productUrl}'">
            <div class="product-image-wrapper">
              <img src="${image}" class="card-img-top" alt="${product.name}" onerror="this.src='https://via.placeholder.com/300x200'">
            </div>
            <div class="card-body d-flex flex-column">
              <h5 class="card-title">${product.name}</h5>
              <p class="card-text flex-grow-1">${descr}</p>
              <div class="mb-2"><strong>السعر:</strong> ${product.price} دج</div>
              ${offerHtml}
              <a href="${productUrl}" class="btn btn-main mt-2" onclick="event.stopPropagation()">اطلب الآن</a>
            </div>
          </div>
        </div>
      `;
    }
  });
  
  updateSearchResults();
}

// دالة لعرض منتجات صفحات الهبوط
function displayLandingProducts(landingProducts) {
  const list = document.getElementById('landing-products-list');
  if (!list) return;
  list.innerHTML = '';

  // لا حاجة لقراءة subdomain هنا

  landingProducts.forEach(lp => {
    const image = processProductImage(lp.image);
    const descr = lp.descr ? (lp.descr.substring(0, 50) + '...') : '';
    
    // إنشاء رابط صفحة الهبوط بدون تمرير subdomain كـ query param
    const landingUrl = `landingPage.html?id=${lp.id}`;
    
    list.innerHTML += `
      <div class="col-lg-4 col-md-6 col-sm-6 col-6 d-flex align-items-stretch product-card">
        <div class="card h-100 w-100" style="cursor: pointer;" onclick="window.location.href='${landingUrl}'">
          <div class="product-image-wrapper">
            <img src="${image}" class="card-img-top" alt="${lp.name}" onerror="this.src='https://via.placeholder.com/300x200'">
          </div>
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">${lp.name}</h5>
            <p class="card-text flex-grow-1">${descr}</p>
            <div class="mb-2"><strong>السعر:</strong> ${lp.price} دج</div>
            <a href="${landingUrl}" class="btn btn-main mt-2" onclick="event.stopPropagation()">اطلب الآن</a>
          </div>
        </div>
      </div>
    `;
  });
}

// دالة لعرض التصنيفات
function displayCategories(categories = allCategories) {
  const container = document.getElementById('categories-list');
  if (!container) return;
  
  container.innerHTML = '';

  if (!categories || categories.length === 0) {
    container.innerHTML = '<div class="alert alert-info">لا توجد تصنيفات متوفرة</div>';
    return;
  }

  // لا حاجة لقراءة subdomain هنا

  categories.forEach(category => {
    const categoryUrl = `all-products.html?category=${category.id}`;
    container.innerHTML += `
      <div class="col-lg-4 col-md-6 col-sm-6 col-6 d-flex align-items-stretch">
        <div class="card h-100 w-100" style="cursor: pointer;" onclick="window.location.href='${categoryUrl}'">
          <div class="product-image-wrapper">
            <img src="${category.image_url ? category.image_url : 'https://via.placeholder.com/300x200'}" class="card-img-top" alt="${category.name}" onerror="this.src='https://via.placeholder.com/300x200'">
          </div>
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">${category.name}</h5>
            <button class="btn btn-main mt-2" onclick="event.stopPropagation(); window.location.href='${categoryUrl}'">تصفح التصنيف</button>
          </div>
        </div>
      </div>
    `;
  });
}

// ==================== دوال الفلترة والبحث ====================

// دالة لتعبئة فلتر التصنيفات
function populateCategoryFilter() {
  const categoryFilters = [
    'category-filter',
    'mobile-category-filter', 
    'sidebar-category-filter'
  ];
  
  categoryFilters.forEach(filterId => {
    const filter = document.getElementById(filterId);
    if (!filter) return;
    
    filter.innerHTML = '<option value="">جميع التصنيفات</option>';
    
    allCategories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = category.name;
      filter.appendChild(option);
    });
  });
}

// دالة فلترة المنتجات المحلية
function filterProducts() {
  const searchInput = document.getElementById('search-input');
  const searchModalInput = document.getElementById('search-modal-input');
  const searchTerm = (searchInput ? searchInput.value : '') || (searchModalInput ? searchModalInput.value : '');
  const categoryId = document.getElementById('category-filter')?.value || '';
  const priceRange = document.getElementById('price-filter')?.value || '';
  const sortBy = document.getElementById('sort-filter')?.value || 'newest';

  // فلترة بالاسم
  let filtered = allProducts.filter(product => {
    if (!searchTerm) return true;
    const searchTermLower = searchTerm.toLowerCase();
    const nameMatch = product.name.toLowerCase().includes(searchTermLower);
    const descMatch = product.descr ? product.descr.toLowerCase().includes(searchTermLower) : false;
    return nameMatch || descMatch;
  });

  // فلترة بالتصنيف
  if (categoryId) {
    filtered = filtered.filter(product => product.category_id == categoryId);
  }

  // فلترة بالسعر
  if (priceRange) {
    const [min, max] = priceRange.split('-').map(Number);
    filtered = filtered.filter(product => {
      const price = Number(product.price);
      if (priceRange === '10000+') {
        return price >= 10000;
      }
      return price >= min && price <= max;
    });
  }

  // الترتيب
  filtered.sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return b.id - a.id;
      case 'oldest':
        return a.id - b.id;
      case 'price-low':
        return Number(a.price) - Number(b.price);
      case 'price-high':
        return Number(b.price) - Number(a.price);
      case 'name-asc':
        return a.name.localeCompare(b.name, 'ar');
      case 'name-desc':
        return b.name.localeCompare(a.name, 'ar');
      default:
        return 0;
    }
  });

  filteredProducts = filtered;
  displayProducts();

  // تحديث URL عند تغيير فلتر التصنيف
  const urlParams = new URLSearchParams(window.location.search);
  
  if (categoryId) {
    urlParams.set('category', categoryId);
  } else {
    urlParams.delete('category');
  }
  
  const newUrl = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ''}`;
  window.history.replaceState({}, '', newUrl);

  // إظهار نتائج البحث
  const searchResults = document.getElementById('search-results');
  if (searchResults) {
    if (searchTerm || categoryId || priceRange) {
      searchResults.style.display = 'block';
    } else {
      searchResults.style.display = 'none';
    }
  }
}

// دالة تحديث نتائج البحث
function updateSearchResults() {
  const resultsCount = document.getElementById('results-count');
  if (!resultsCount) return;
  
  const count = filteredProducts.length;
  const categoryFilter = document.getElementById('category-filter');
  const categoryId = categoryFilter ? categoryFilter.value : '';
  
  let resultText = `تم العثور على <strong>${count}</strong> منتج`;
  
  // إضافة اسم التصنيف إذا كان محدداً
  if (categoryId) {
    const selectedCategory = allCategories.find(cat => cat.id == categoryId);
    if (selectedCategory) {
      resultText = `تم العثور على <strong>${count}</strong> منتج في تصنيف <strong>${selectedCategory.name}</strong>`;
    }
  }
  
  resultsCount.innerHTML = resultText;
}

// دالة فلترة المنتجات حسب التصنيف
function filterByCategory(categoryId, categoryName) {
  // الانتقال إلى صفحة المنتجات مع فلتر التصنيف
  window.location.href = `all-products.html?category=${categoryId}`;
}

// ==================== دوال إعداد الأحداث ====================

// دالة لإعداد البحث والفلترة
function setupSearchAndFilter() {
  const searchInput = document.getElementById('search-input');
  const searchModalInput = document.getElementById('search-modal-input');
  const categoryFilter = document.getElementById('category-filter');
  const priceFilter = document.getElementById('price-filter');
  const sortFilter = document.getElementById('sort-filter');
  const clearFilters = document.getElementById('clear-filters');

  // البحث بالاسم
  if (searchInput) {
    searchInput.addEventListener('input', debounce(filterProducts, 300));
  }
  
  if (searchModalInput) {
    searchModalInput.addEventListener('input', debounce(filterProducts, 300));
  }

  // فلترة بالتصنيف
  if (categoryFilter) {
    categoryFilter.addEventListener('change', () => {
      categoryFilter.style.transform = 'scale(1.05)';
      setTimeout(() => {
        categoryFilter.style.transform = 'scale(1)';
      }, 200);
      
      filterProducts();
    });
  }

  // فلترة بالسعر
  if (priceFilter) {
    priceFilter.addEventListener('change', filterProducts);
  }

  // الترتيب
  if (sortFilter) {
    sortFilter.addEventListener('change', filterProducts);
  }

  // إعادة تعيين الفلاتر
  if (clearFilters) {
    clearFilters.addEventListener('click', async () => {
      if (searchInput) searchInput.value = '';
      if (searchModalInput) searchModalInput.value = '';
      if (categoryFilter) categoryFilter.value = '';
      if (priceFilter) priceFilter.value = '';
      if (sortFilter) sortFilter.value = 'newest';
      filteredProducts = [...allProducts];
      await displayProducts();
      const searchResults = document.getElementById('search-results');
      if (searchResults) searchResults.style.display = 'none';
      
      // إزالة معامل category من URL
      const urlParams = new URLSearchParams(window.location.search);
      urlParams.delete('category');
      const newUrl = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ''}`;
      window.history.replaceState({}, '', newUrl);
      
      clearFilters.style.transform = 'rotate(360deg)';
      setTimeout(() => {
        clearFilters.style.transform = 'rotate(0deg)';
      }, 300);
    });
  }

  // إعداد معالجات الأحداث للفلاتر في مودل الهاتف
  setupMobileFilterEvents();
  
  // إعداد معالجات الأحداث للفلاتر في السايد بار
  setupSidebarFilterEvents();
}

// دالة إعداد معالجات الأحداث للفلاتر في مودل الهاتف
function setupMobileFilterEvents() {
  const mobileClearFilters = document.getElementById('mobile-clear-filters');
  
  if (mobileClearFilters) {
    mobileClearFilters.addEventListener('click', () => {
      clearMobileFilters();
      
      mobileClearFilters.style.transform = 'rotate(360deg)';
      setTimeout(() => {
        mobileClearFilters.style.transform = 'rotate(0deg)';
      }, 300);
    });
  }
}

// دالة إعداد معالجات الأحداث للفلاتر في السايد بار
function setupSidebarFilterEvents() {
  const sidebarClearFilters = document.getElementById('sidebar-clear-filters');
  
  if (sidebarClearFilters) {
    sidebarClearFilters.addEventListener('click', () => {
      clearSidebarFilters();
      
      sidebarClearFilters.style.transform = 'rotate(360deg)';
      setTimeout(() => {
        sidebarClearFilters.style.transform = 'rotate(0deg)';
      }, 300);
    });
  }
}

// ==================== دوال تحميل البيانات ====================

// دالة تحميل البيانات للصفحة الرئيسية
async function loadData() {
  const subdomain = await getSubdomainFromUrl();
  
  // جلب معلومات المتجر أولاً
  const store = await getStoreFromSubdomain(subdomain);
  if (!store) {
    console.error('Store not found for subdomain:', subdomain);
    return;
  }
  
  // جلب التصنيفات
  allCategories = await getCategories(store.id);
  populateCategoryFilter();
  
  // جلب المنتجات
  allProducts = await getProducts(store.id);
  filteredProducts = [...allProducts];
  displayProducts();
  
  // جلب منتجات صفحات الهبوط
  allLandingProducts = await getLandingProducts(store.id);
  const section = document.getElementById('landing-products-section');
  if (section && allLandingProducts.length > 0) {
    section.style.display = 'block';
    displayLandingProducts(allLandingProducts);
  }
  
  // إعداد البحث والفلترة
  setupSearchAndFilter();
}

// دالة تحميل البيانات لصفحة التصنيفات
async function loadCategoriesData() {
  const subdomain = await getSubdomainFromUrl();
  
  // جلب معلومات المتجر أولاً
  const store = await getStoreFromSubdomain(subdomain);
  if (!store) {
    console.error('Store not found for subdomain:', subdomain);
    return;
  }
  
  // جلب التصنيفات
  allCategories = await getCategories(store.id);
  displayCategories();
}

// دالة تحميل البيانات لصفحة كل المنتجات
async function loadAllProductsData() {
  const subdomain = await getSubdomainFromUrl();
  
  // جلب معلومات المتجر أولاً
  const store = await getStoreFromSubdomain(subdomain);
  if (!store) {
    console.error('Store not found for subdomain:', subdomain);
    return;
  }
  
  // جلب التصنيفات
  allCategories = await getCategories(store.id);
  populateCategoryFilter();
  
  // جلب المنتجات
  allProducts = await getProducts(store.id);
  filteredProducts = [...allProducts];
  
  // التحقق من وجود معامل category في URL
  const urlParams = new URLSearchParams(window.location.search);
  const categoryId = urlParams.get('category');
  
  if (categoryId) {
    // تطبيق فلتر التصنيف تلقائياً
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
      categoryFilter.value = categoryId;
    }
    
    // فلترة المنتجات حسب التصنيف
    filteredProducts = allProducts.filter(product => product.category_id == categoryId);
  }
  
  displayProducts();
  
  // جلب منتجات صفحات الهبوط
  allLandingProducts = await getLandingProducts(store.id);
  const section = document.getElementById('landing-products-section');
  if (section && allLandingProducts.length > 0) {
    section.style.display = 'block';
    displayLandingProducts(allLandingProducts);
  }
  
  // إعداد البحث والفلترة
  setupSearchAndFilter();
}

// ==================== دوال مودل الفلترة ====================

// دوال مودل الفلترة
function openFilterModal() {
  const modal = document.getElementById('filter-modal');
  modal.classList.add('active');
  syncFilterValues();
}

function closeFilterModal() {
  const modal = document.getElementById('filter-modal');
  modal.classList.remove('active');
}

function syncFilterValues() {
  const categoryFilter = document.getElementById('category-filter');
  const priceFilter = document.getElementById('price-filter');
  const sortFilter = document.getElementById('sort-filter');
  
  const mobileCategoryFilter = document.getElementById('mobile-category-filter');
  const mobilePriceFilter = document.getElementById('mobile-price-filter');
  const mobileSortFilter = document.getElementById('mobile-sort-filter');
  
  if (categoryFilter && mobileCategoryFilter) {
    mobileCategoryFilter.value = categoryFilter.value;
  }
  if (priceFilter && mobilePriceFilter) {
    mobilePriceFilter.value = priceFilter.value;
  }
  if (sortFilter && mobileSortFilter) {
    mobileSortFilter.value = sortFilter.value;
  }
}

function applyMobileFilters() {
  const mobileCategoryFilter = document.getElementById('mobile-category-filter');
  const mobilePriceFilter = document.getElementById('mobile-price-filter');
  const mobileSortFilter = document.getElementById('mobile-sort-filter');
  
  const categoryFilter = document.getElementById('category-filter');
  const priceFilter = document.getElementById('price-filter');
  const sortFilter = document.getElementById('sort-filter');
  
  if (categoryFilter && mobileCategoryFilter) {
    categoryFilter.value = mobileCategoryFilter.value;
  }
  if (priceFilter && mobilePriceFilter) {
    priceFilter.value = mobilePriceFilter.value;
  }
  if (sortFilter && mobileSortFilter) {
    sortFilter.value = mobileSortFilter.value;
  }
  
  filterProducts();
  closeFilterModal();
}

function clearMobileFilters() {
  const mobileCategoryFilter = document.getElementById('mobile-category-filter');
  const mobilePriceFilter = document.getElementById('mobile-price-filter');
  const mobileSortFilter = document.getElementById('mobile-sort-filter');
  const searchModalInput = document.getElementById('search-modal-input');
  
  if (mobileCategoryFilter) mobileCategoryFilter.value = '';
  if (mobilePriceFilter) mobilePriceFilter.value = '';
  if (mobileSortFilter) mobileSortFilter.value = 'newest';
  if (searchModalInput) searchModalInput.value = '';
  
  // إعادة تعيين الفلاتر الرئيسية أيضاً
  const categoryFilter = document.getElementById('category-filter');
  const priceFilter = document.getElementById('price-filter');
  const sortFilter = document.getElementById('sort-filter');
  const searchInput = document.getElementById('search-input');
  
  if (categoryFilter) categoryFilter.value = '';
  if (priceFilter) priceFilter.value = '';
  if (sortFilter) sortFilter.value = 'newest';
  if (searchInput) searchInput.value = '';
  
  // إعادة تعيين المنتجات
  filteredProducts = [...allProducts];
  displayProducts();
  
  // إزالة معامل category من URL
  const urlParams = new URLSearchParams(window.location.search);
  urlParams.delete('category');
  const newUrl = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ''}`;
  window.history.replaceState({}, '', newUrl);
}

// ==================== دوال السايد بار ====================

// دوال الفلاتر في السايد بار
function toggleSidebarFilters() {
  const sidebarFilters = document.getElementById('sidebar-filters');
  const toggleBtn = document.querySelector('.sidebar-filter-toggle .btn');
  
  if (sidebarFilters.classList.contains('show')) {
    sidebarFilters.classList.remove('show');
    toggleBtn.innerHTML = '<i class="bi bi-funnel"></i> إظهار الفلاتر';
    toggleBtn.classList.remove('btn-primary');
    toggleBtn.classList.add('btn-outline-primary');
  } else {
    sidebarFilters.classList.add('show');
    toggleBtn.innerHTML = '<i class="bi bi-funnel-fill"></i> إخفاء الفلاتر';
    toggleBtn.classList.remove('btn-outline-primary');
    toggleBtn.classList.add('btn-primary');
    
    syncSidebarFilterValues();
  }
}

function syncSidebarFilterValues() {
  const categoryFilter = document.getElementById('category-filter');
  const priceFilter = document.getElementById('price-filter');
  const sortFilter = document.getElementById('sort-filter');
  
  const sidebarCategoryFilter = document.getElementById('sidebar-category-filter');
  const sidebarPriceFilter = document.getElementById('sidebar-price-filter');
  const sidebarSortFilter = document.getElementById('sidebar-sort-filter');
  
  if (categoryFilter && sidebarCategoryFilter) {
    sidebarCategoryFilter.value = categoryFilter.value;
  }
  if (priceFilter && sidebarPriceFilter) {
    sidebarPriceFilter.value = priceFilter.value;
  }
  if (sortFilter && sidebarSortFilter) {
    sidebarSortFilter.value = sortFilter.value;
  }
}

async function applySidebarFilters() {
  const sidebarCategoryFilter = document.getElementById('sidebar-category-filter');
  const sidebarPriceFilter = document.getElementById('sidebar-price-filter');
  const sidebarSortFilter = document.getElementById('sidebar-sort-filter');
  
  const categoryFilter = document.getElementById('category-filter');
  const priceFilter = document.getElementById('price-filter');
  const sortFilter = document.getElementById('sort-filter');
  
  if (categoryFilter && sidebarCategoryFilter) {
    categoryFilter.value = sidebarCategoryFilter.value;
  }
  if (priceFilter && sidebarPriceFilter) {
    priceFilter.value = sidebarPriceFilter.value;
  }
  if (sortFilter && sidebarSortFilter) {
    sortFilter.value = sidebarSortFilter.value;
  }
  
  await filterProducts();
  closeSidebar();
}

function clearSidebarFilters() {
  const sidebarCategoryFilter = document.getElementById('sidebar-category-filter');
  const sidebarPriceFilter = document.getElementById('sidebar-price-filter');
  const sidebarSortFilter = document.getElementById('sidebar-sort-filter');
  
  if (sidebarCategoryFilter) sidebarCategoryFilter.value = '';
  if (sidebarPriceFilter) sidebarPriceFilter.value = '';
  if (sidebarSortFilter) sidebarSortFilter.value = 'newest';
  
  // إعادة تعيين الفلاتر الرئيسية أيضاً
  const categoryFilter = document.getElementById('category-filter');
  const priceFilter = document.getElementById('price-filter');
  const sortFilter = document.getElementById('sort-filter');
  const searchInput = document.getElementById('search-input');
  const searchModalInput = document.getElementById('search-modal-input');
  
  if (categoryFilter) categoryFilter.value = '';
  if (priceFilter) priceFilter.value = '';
  if (sortFilter) sortFilter.value = 'newest';
  if (searchInput) searchInput.value = '';
  if (searchModalInput) searchModalInput.value = '';
  
  // إعادة تعيين المنتجات
  filteredProducts = [...allProducts];
  displayProducts();
  
  // إزالة معامل category من URL
  const urlParams = new URLSearchParams(window.location.search);
  urlParams.delete('category');
  const newUrl = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ''}`;
  window.history.replaceState({}, '', newUrl);
}

// ==================== إضافة الدوال للـ window object ====================

// دالة البحث في المودل
function performModalSearch() {
  const searchModalInput = document.getElementById('search-modal-input');
  const searchInput = document.getElementById('search-input');
  
  if (searchModalInput && searchInput) {
    searchInput.value = searchModalInput.value;
  }
  
  filterProducts();
  closeSearchModal();
}

// دالة إغلاق مودل البحث
function closeSearchModal() {
  const modal = document.getElementById('search-modal');
  if (modal) {
    modal.classList.remove('active');
  }
}

// دالة فتح مودل البحث
function openSearchModal() {
  const modal = document.getElementById('search-modal');
  if (modal) {
    modal.classList.add('active');
    const searchInput = document.getElementById('search-modal-input');
    if (searchInput) {
      searchInput.focus();
    }
  }
}

// إضافة الدوال للـ window object
window.filterByCategory = filterByCategory;
window.openFilterModal = openFilterModal;
window.closeFilterModal = closeFilterModal;
window.openSearchModal = openSearchModal;
window.closeSearchModal = closeSearchModal;
window.performModalSearch = performModalSearch;
window.applyMobileFilters = applyMobileFilters;
window.toggleSidebarFilters = toggleSidebarFilters;
window.applySidebarFilters = applySidebarFilters;

// دوال السايد بار
window.toggleSidebar = function() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  
  if (sidebar && overlay) {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
  }
};

window.closeSidebar = function() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  
  if (sidebar && overlay) {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
  }
};

window.syncSidebarFilterValues = syncSidebarFilterValues;
window.syncFilterValues = syncFilterValues;
window.clearMobileFilters = clearMobileFilters;
window.clearSidebarFilters = clearSidebarFilters;

// ==================== تهيئة الصفحات ====================

// تهيئة الصفحة الرئيسية
document.addEventListener('DOMContentLoaded', async () => {
  await initializePage();
  
  // تحديد نوع الصفحة وتحميل البيانات المناسبة
  const currentPage = window.location.pathname;
  
  if (currentPage.includes('index.html') || currentPage === '/') {
    await loadData();
  } else if (currentPage.includes('category.html')) {
    await loadCategoriesData();
  } else if (currentPage.includes('all-products.html')) {
    await loadAllProductsData();
  }
  // صفحة about-us لا تحتاج لتحميل بيانات إضافية
});
