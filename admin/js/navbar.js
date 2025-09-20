import { getCurrentStoreSubdomain } from './server-superbase.js';
import { DOMAIN_CONFIG } from './domain-config.js';

// Define a reusable admin navbar web component
class AdminNavbar extends HTMLElement {
  connectedCallback() {
    const current = (location.pathname.split('/').pop() || '').toLowerCase();
    // Remove .html extension if present for comparison
    const currentPage = current.replace('.html', '');

    const isActive = (pageName) => currentPage === pageName.toLowerCase();

    // Styles are now provided by css/navbar.css included on each page

    // Build navbar HTML (keeps desktop navbar + mobile offcanvas)
    this.innerHTML = `
<nav class="navbar navbar-expand-lg main-navbar sticky-top">
  <div class="container">
    <a class="navbar-brand d-flex align-items-center gap-2" href="/admin/dashboard">
      <span style="font-size:1.7rem;">🛒</span> متجر إلكتروني
    </a>
    <button class="navbar-toggler" type="button" data-bs-toggle="offcanvas" data-bs-target="#mobileMenu" aria-controls="mobileMenu">
      <span class="navbar-toggler-icon"></span>
    </button>

    <div class="collapse navbar-collapse d-none d-lg-block" id="navbarNav">
      <ul class="navbar-nav me-auto mb-2 mb-lg-0">
        <li class="nav-item"><a class="nav-link ${isActive('dashboard') ? 'active' : ''}" href="/admin/dashboard"><span>🏠</span> لوحة التحكم</a></li>
        <li class="nav-item"><a class="nav-link ${isActive('products') ? 'active' : ''}" href="/admin/products"><span>🛍️</span> المنتجات</a></li>
        <li class="nav-item"><a class="nav-link ${isActive('categories') ? 'active' : ''}" href="/admin/categories"><span>🏷️</span> التصنيفات</a></li>
        <li class="nav-item"><a class="nav-link ${isActive('addLandingPage') ? 'active' : ''}" href="/admin/addLandingPage"><span>📄</span> صفحات الهبوط</a></li>
        <li class="nav-item"><a class="nav-link ${isActive('orders') ? 'active' : ''}" href="/admin/orders"><span>🛒</span> الطلبات</a></li>
        <li class="nav-item"><a class="nav-link ${isActive('shipping') || isActive('shipping-new') ? 'active' : ''}" href="/admin/shipping-new"><span>🚚</span> الشحن</a></li>
        <li class="nav-item"><a class="nav-link ${isActive('ads') ? 'active' : ''}" href="/admin/ads"><span>📢</span> الإعلانات</a></li>
        <li class="nav-item"><a class="nav-link ${isActive('sitting') ? 'active' : ''}" href="/admin/sitting"><span>⚙️</span> الإعدادات</a></li>
        <li class="nav-item">
          <a class="nav-link btn btn-light text-dark px-3 py-2 rounded-3 ms-2" href="#" onclick="viewStore()" style="background-color: #4a4141 !important; border: 1px solid #dee2e6;">
            <span>🏪</span> عرض المتجر
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link btn btn-danger text-white px-3 py-2 rounded-3 ms-2" href="#" data-logout-link style="background-color: #dc3545 !important; border: 1px solid #dc3545;">
            <span>🚪</span> تسجيل الخروج
          </a>
        </li>
      </ul>
    </div>

    <div class="offcanvas offcanvas-start text-bg-dark d-lg-none" tabindex="-1" id="mobileMenu" aria-labelledby="mobileMenuLabel">
      <div class="offcanvas-header">
        <h5 class="offcanvas-title" id="mobileMenuLabel">القائمة</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Close"></button>
      </div>
      <div class="offcanvas-body">
        <ul class="navbar-nav">
          <li class="nav-item"><a class="nav-link ${isActive('dashboard') ? 'active' : ''}" href="/admin/dashboard">🏠 لوحة التحكم</a></li>
          <li class="nav-item"><a class="nav-link ${isActive('products') ? 'active' : ''}" href="/admin/products">🛍️ المنتجات</a></li>
          <li class="nav-item"><a class="nav-link ${isActive('categories') ? 'active' : ''}" href="/admin/categories">🏷️ التصنيفات</a></li>
          <li class="nav-item"><a class="nav-link ${isActive('addLandingPage') ? 'active' : ''}" href="/admin/addLandingPage">📄 صفحات الهبوط</a></li>
          <li class="nav-item"><a class="nav-link ${isActive('orders') ? 'active' : ''}" href="/admin/orders">🛒 الطلبات</a></li>
          <li class="nav-item"><a class="nav-link ${isActive('shipping') || isActive('shipping-new') ? 'active' : ''}" href="/admin/shipping-new">🚚 الشحن</a></li>
          <li class="nav-item"><a class="nav-link ${isActive('ads') ? 'active' : ''}" href="/admin/ads">📢 الإعلانات</a></li>
          <li class="nav-item"><a class="nav-link ${isActive('sitting') ? 'active' : ''}" href="/admin/sitting">⚙️ الإعدادات</a></li>
          <li class="nav-item mt-2"><a class="btn btn-light w-100" href="#" onclick="viewStore()">🏪 عرض المتجر</a></li>
          <li class="nav-item mt-2"><a class="btn btn-danger w-100 text-white" href="#" data-logout-link>🚪 تسجيل الخروج</a></li>
        </ul>
      </div>
    </div>
  </div>
</nav>`;

    // Hook logout if global logout() exists
    const logoutLinks = this.querySelectorAll('[data-logout-link]');
    logoutLinks.forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        try { if (typeof window.logout === 'function') window.logout(); } catch (_) {}
      });
    });
  }
}

customElements.define('admin-navbar', AdminNavbar);

// Make viewStore available globally across all admin pages (used by navbar button)
window.viewStore = async function () {
  try {
    const subdomain = await getCurrentStoreSubdomain();
    if (!subdomain) {
      alert('لا يمكن تحديد السابدومين للمتجر');
      return;
    }
    const url = DOMAIN_CONFIG.buildStoreUrl(subdomain);
    window.open(url, '_blank');
  } catch (error) {
    console.error('خطأ في عرض المتجر:', error);
    alert('حدث خطأ أثناء فتح المتجر');
  }
};


