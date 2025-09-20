// استيراد Supabase والمصادقة
import { supabase, getCurrentStoreId, getCurrentStoreSubdomain } from './server-superbase.js';
import { protectAdminPages } from './auth-guard.js';
import { DOMAIN_CONFIG } from './domain-config.js';

// وظائف لوحة التحكم
class Dashboard {
    constructor() {
        this.init();
        this.stats = {
            orders: 0,
            products: 0,
            revenue: 0,
            customers: 0,
            ads: 0,
            shipping: 0,
            categories: 0,
            conversion: 0
        };
    }

    init() {
        this.updateTime();
        this.setupAnimations();
        this.setupEventListeners();
        // تحميل الإحصائيات بعد التحقق من المصادقة
        this.initWithAuth();
    }
    
    async initWithAuth() {
        // انتظار انتهاء حماية الصفحات من auth-guard.js
        const isProtected = await protectAdminPages();
        if (isProtected) {
            console.log('تم التحقق من المصادقة، بدء تحميل البيانات...');
            this.loadRealStatistics();
        } else {
            console.log('فشل في المصادقة، لن يتم تحميل البيانات');
        }
    }

    // تحديث الوقت الحالي
    updateTime() {
        const now = new Date();
        const timeString = now.toLocaleString('ar-DZ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        const timeElement = document.getElementById('current-time');
        if (timeElement) {
            timeElement.textContent = timeString;
        }
    }

    // إعداد التأثيرات الحركية
    setupAnimations() {
        const cards = document.querySelectorAll('.dashboard-card, .nav-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.6s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    // إعداد مستمعي الأحداث
    setupEventListeners() {
        // تأثيرات hover للكروت
        const dashboardCards = document.querySelectorAll('.dashboard-card');
        dashboardCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-5px) scale(1.02)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
            });
        });

        // تأثيرات hover لكروت التنقل
        const navCards = document.querySelectorAll('.nav-card');
        navCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-3px) scale(1.02)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
            });
        });

        // تأثيرات الأزرار
        const actionButtons = document.querySelectorAll('.action-btn');
        actionButtons.forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                btn.style.transform = 'translateY(-2px) scale(1.05)';
            });
            
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'translateY(0) scale(1)';
            });
        });
    }

    // تحميل الإحصائيات الحقيقية من قاعدة البيانات
    async loadRealStatistics() {
        console.log('بدء تحميل الإحصائيات...');
        this.showLoadingState();
        try {
            // جلب البيانات من جميع الجداول
            const [ordersData, productsData, adsData, shippingData, categoriesData] = await Promise.all([
                this.fetchOrdersData(),
                this.fetchProductsData(),
                this.fetchAdsData(),
                this.fetchShippingData(),
                this.fetchCategoriesData()
            ]);

            // فحص البيانات المحملة
            console.log('البيانات المحملة:', {
                orders: ordersData.length,
                products: productsData.length,
                ads: adsData.length,
                shipping: shippingData.length,
                categories: categoriesData.length
            });

            // حساب الإحصائيات
            this.calculateStatistics(ordersData, productsData, adsData, shippingData, categoriesData);
            // تحديث الواجهة
            this.updateDashboardUI();
            // إظهار إشعار نجاح
            this.showNotification('تم تحميل البيانات بنجاح! 🎉', 'success');
            console.log('تم تحميل الإحصائيات بنجاح.');
        } catch (error) {
            console.error('خطأ في تحميل البيانات:', error);
            this.showNotification('حدث خطأ في تحميل البيانات: ' + error.message, 'danger');
        } finally {
            this.hideLoadingState();
            console.log('تم استدعاء hideLoadingState()');
        }
    }

    // جلب بيانات الطلبات
    async fetchOrdersData() {
        try {
            const currentStoreId = await getCurrentStoreId();
            if (!currentStoreId) {
                console.error('لا يمكن تحديد معرف المتجر');
                return [];
            }

            const { data: orders, error } = await supabase
                .from('orders')
                .select('*')
                .eq('store_id', currentStoreId);
            
            if (error) {
                console.error('خطأ في جلب الطلبات:', error);
                return [];
            }
            
            console.log('الطلبات المحملة للمتجر', currentStoreId, ':', orders?.length || 0);
            return orders || [];
        } catch (error) {
            console.error('خطأ في جلب الطلبات:', error);
            return [];
        }
    }

    // جلب بيانات المنتجات
    async fetchProductsData() {
        try {
            const currentStoreId = await getCurrentStoreId();
            if (!currentStoreId) {
                console.error('لا يمكن تحديد معرف المتجر');
                return [];
            }

            const { data: products, error } = await supabase
                .from('products')
                .select('*')
                .eq('store_id', currentStoreId);
            
            if (error) {
                console.error('خطأ في جلب المنتجات:', error);
                return [];
            }
            
            console.log('المنتجات المحملة للمتجر', currentStoreId, ':', products?.length || 0);
            console.log('عينة من المنتجات:', products?.slice(0, 2));
            return products || [];
        } catch (error) {
            console.error('خطأ في جلب المنتجات:', error);
            return [];
        }
    }

    // جلب بيانات الإعلانات
    async fetchAdsData() {
        try {
            const currentStoreId = await getCurrentStoreId();
            if (!currentStoreId) {
                console.error('لا يمكن تحديد معرف المتجر');
                return [];
            }

            const { data: ads, error } = await supabase
                .from('ad_pixels')
                .select('*')
                .eq('store_id', currentStoreId);
            
            if (error) {
                console.error('خطأ في جلب الإعلانات:', error);
                return [];
            }
            
            console.log('الإعلانات المحملة للمتجر', currentStoreId, ':', ads?.length || 0);
            console.log('عينة من الإعلانات:', ads?.slice(0, 2));
            return ads || [];
        } catch (error) {
            console.error('خطأ في جلب الإعلانات:', error);
            return [];
        }
    }

    // جلب بيانات الشحن
    async fetchShippingData() {
        try {
            const currentStoreId = await getCurrentStoreId();
            if (!currentStoreId) {
                console.error('لا يمكن تحديد معرف المتجر');
                return [];
            }

            // جلب أسعار الشحن الخاصة بالمتجر
            const { data: storeShipping, error } = await supabase
                .from('store_shipping_prices')
                .select(`
                    *,
                    shipping_states (
                        id,
                        state_name
                    )
                `)
                .eq('store_id', currentStoreId);
            
            if (error) {
                console.error('خطأ في جلب بيانات الشحن:', error);
                // في حالة عدم وجود أسعار شحن مخصصة، نرجع 0
                return [];
            }
            
            console.log('أسعار الشحن للمتجر', currentStoreId, ':', storeShipping?.length || 0);
            
            // إذا لم تكن هناك أسعار شحن مخصصة للمتجر
            if (!storeShipping || storeShipping.length === 0) {
                console.log('لا توجد أسعار شحن مخصصة للمتجر');
                return [];
            }
            
            // تصفية الولايات المتاحة
            const availableStates = storeShipping.filter(shippingPrice => {
                const state = shippingPrice.shipping_states;
                if (!state) return false;
                
                const isAvailable = shippingPrice.is_available === true || 
                    shippingPrice.is_available === 'true' || 
                    shippingPrice.is_available === 1 ||
                    shippingPrice.is_available === '1';
                
                console.log(`الولاية ${state.state_name}: متاحة=${isAvailable} (من store_shipping_prices)`);
                return isAvailable;
            });
            
            console.log('الولايات المتاحة للشحن للمتجر:', availableStates.length);
            return availableStates;
        } catch (error) {
            console.error('خطأ في جلب بيانات الشحن:', error);
            return [];
        }
    }

    // جلب بيانات التصنيفات
    async fetchCategoriesData() {
        try {
            const currentStoreId = await getCurrentStoreId();
            if (!currentStoreId) {
                console.error('لا يمكن تحديد معرف المتجر');
                return [];
            }

            const { data: categories, error } = await supabase
                .from('categories')
                .select('*')
                .eq('store_id', currentStoreId);
            
            if (error) {
                console.error('خطأ في جلب التصنيفات:', error);
                return [];
            }
            
            console.log('التصنيفات المحملة للمتجر', currentStoreId, ':', categories?.length || 0);
            console.log('عينة من التصنيفات:', categories?.slice(0, 2));
            return categories || [];
        } catch (error) {
            console.error('خطأ في جلب التصنيفات:', error);
            return [];
        }
    }

    // حساب الإحصائيات
    calculateStatistics(orders, products, ads, shipping, categories) {
        // إجمالي الطلبات
        this.stats.orders = orders.length;
        
        // المنتجات المتوفرة
        this.stats.products = products.length;
        
        // إجمالي الإيرادات
        this.stats.revenue = orders.reduce((total, order) => {
            return total + (parseFloat(order.total_price) || 0);
        }, 0);
        
        // عدد العملاء الفريدين
        const uniqueCustomers = new Set(orders.map(order => order.phone_number));
        this.stats.customers = uniqueCustomers.size;
        
        // عدد الإعلانات النشطة
        this.stats.ads = ads.length;
        
        // عدد الولايات المتاحة للشحن
        this.stats.shipping = shipping.length;
        
        // عدد التصنيفات
        this.stats.categories = categories.length;
        
        // حساب معدل التحويل (نسبة الطلبات إلى المنتجات)
        this.stats.conversion = this.stats.products > 0 ? 
            Math.round((this.stats.orders / this.stats.products) * 100) : 0;
        
        console.log('الإحصائيات المحسوبة:', this.stats);
        console.log('تفاصيل البيانات:', {
            orders: orders.length,
            products: products.length,
            shipping: shipping.length,
            categories: categories.length,
            ads: ads.length
        });
    }

    // تحديث واجهة لوحة التحكم
    updateDashboardUI() {
        // تحديث كروت الإحصائيات الأساسية
        this.updateStatCard('orders', this.stats.orders);
        this.updateStatCard('products', this.stats.products);
        this.updateStatCard('revenue', this.stats.revenue);
        this.updateStatCard('customers', this.stats.customers);
        
        // تحديث كروت الإحصائيات الإضافية
        this.updateAdditionalStats();
        
        // تحديث كروت التنقل
        this.updateNavCards();
        
        // تحديث الإجراءات السريعة
        this.updateQuickActions();
        
        // تحميل البيانات التفصيلية
        this.loadDetailedData();
    }

    // تحديث الإحصائيات الإضافية
    updateAdditionalStats() {
        // تحديث إحصائيات الشحن
        const shippingElement = document.getElementById('shipping-stats');
        if (shippingElement) {
            this.animateNumber(shippingElement, 0, this.stats.shipping);
        }
        
        // تحديث إحصائيات التصنيفات
        const categoriesElement = document.getElementById('categories-stats');
        if (categoriesElement) {
            this.animateNumber(categoriesElement, 0, this.stats.categories);
        }
        
        // تحديث إحصائيات الإعلانات
        const adsElement = document.getElementById('ads-stats');
        if (adsElement) {
            this.animateNumber(adsElement, 0, this.stats.ads);
        }
        
        // تحديث معدل التحويل
        const conversionElement = document.getElementById('conversion-stats');
        if (conversionElement) {
            this.animateNumber(conversionElement, 0, this.stats.conversion, 'percentage');
        }
    }

    // تحديث كرت إحصائي
    updateStatCard(type, value) {
        const card = document.querySelector(`.dashboard-card.${type}`);
        if (!card) return;
        
        const numberElement = card.querySelector('.stat-number');
        if (numberElement) {
            this.animateNumber(numberElement, 0, value, type);
        }
    }

    // تحريك الأرقام
    animateNumber(element, start, end, type = '') {
        const duration = 1500;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const current = Math.floor(start + (end - start) * progress);
            element.textContent = this.formatNumber(current, type);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    // تنسيق الأرقام
    formatNumber(num, type = '') {
        if (type === 'revenue') {
            return 'دج' + num.toLocaleString();
        } else if (type === 'percentage') {
            return num + '%';
        } else if (num >= 1000) {
            return num.toLocaleString();
        }
        return num.toString();
    }

    // تحديث كروت التنقل
    updateNavCards() {
        // تحديث عدد المنتجات
        const productsBadge = document.querySelector('.nav-card[href="/admin/products"] .badge');
        if (productsBadge) {
            productsBadge.textContent = `${this.stats.products} منتج`;
        }
        
        // تحديث عدد الطلبات
        const ordersBadge = document.querySelector('.nav-card[href="/admin/orders"] .badge');
        if (ordersBadge) {
            ordersBadge.textContent = `${this.stats.orders} طلب`;
        }
        
        // تحديث عدد الولايات المتاحة للشحن
        const shippingBadge = document.querySelector('.nav-card[href="/admin/shipping"] .badge');
        if (shippingBadge) {
            shippingBadge.textContent = `${this.stats.shipping} ولاية`;
        }
        
        // تحديث عدد الإعلانات
        const adsBadge = document.querySelector('.nav-card[href="/admin/ads"] .badge');
        if (adsBadge) {
            adsBadge.textContent = `${this.stats.ads} إعلان نشط`;
        }
        
        // تحديث عدد التصنيفات
        const categoriesBadge = document.querySelector('.nav-card[href="/admin/categories"] .badge');
        if (categoriesBadge) {
            categoriesBadge.textContent = `${this.stats.categories} تصنيف`;
        }
    }

    // تحديث الإجراءات السريعة
    updateQuickActions() {
        // يمكن إضافة تحديثات إضافية هنا
        console.log('تم تحديث الإجراءات السريعة');
    }

    // إظهار حالة التحميل
    showLoadingState() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
        
        const statNumbers = document.querySelectorAll('.stat-number');
        statNumbers.forEach(element => {
            element.textContent = '...';
        });
    }

    // إخفاء حالة التحميل
    hideLoadingState() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
        console.log('تم إخفاء حالة التحميل');
    }

    // إظهار إشعار
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        // إزالة الإشعار تلقائياً بعد 5 ثوانٍ
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    // تحديث حالة النظام
    updateSystemStatus() {
        const status = {
            online: true,
            lastBackup: new Date().toLocaleString('ar-DZ'),
            serverLoad: Math.floor(Math.random() * 100) + 20
        };

        console.log('System Status:', status);
    }

    // جلب أحدث الطلبات
    async getRecentOrders(limit = 5) {
        try {
            const currentStoreId = await getCurrentStoreId();
            if (!currentStoreId) {
                console.error('لا يمكن تحديد معرف المتجر');
                return [];
            }

            const { data: orders, error } = await supabase
                .from('orders')
                .select('*')
                .eq('store_id', currentStoreId)
                .order('created_at', { ascending: false })
                .limit(limit);
            
            if (error) throw error;
            return orders || [];
        } catch (error) {
            console.error('خطأ في جلب الطلبات الحديثة:', error);
            return [];
        }
    }

    // جلب المنتجات الأكثر مبيعاً
    async getTopProducts(limit = 5) {
        try {
            const currentStoreId = await getCurrentStoreId();
            if (!currentStoreId) {
                console.error('لا يمكن تحديد معرف المتجر');
                return [];
            }

            const { data: products, error } = await supabase
                .from('products')
                .select('*')
                .eq('store_id', currentStoreId)
                .order('id', { ascending: false })
                .limit(limit);
            
            if (error) throw error;
            return products || [];
        } catch (error) {
            console.error('خطأ في جلب المنتجات الأكثر مبيعاً:', error);
            return [];
        }
    }

    // تحميل البيانات التفصيلية
    async loadDetailedData() {
        try {
            // تحميل أحدث الطلبات
            const recentOrders = await this.getRecentOrders(5);
            this.displayRecentOrders(recentOrders);
            
            // تحميل المنتجات الأكثر مبيعاً
            const topProducts = await this.getTopProducts(5);
            this.displayTopProducts(topProducts);
            
        } catch (error) {
            console.error('خطأ في تحميل البيانات التفصيلية:', error);
        }
    }

    // عرض أحدث الطلبات
    displayRecentOrders(orders) {
        const container = document.getElementById('recent-orders');
        if (!container) return;
        
        if (orders.length === 0) {
            container.innerHTML = `
                <div class="text-center py-3">
                    <i class="fas fa-inbox fa-2x text-muted mb-2"></i>
                    <p class="text-muted">لا توجد طلبات حديثة</p>
                </div>
            `;
            return;
        }
        
        const ordersHTML = orders.map(order => `
            <div class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                    <h6 class="mb-1">${order.full_name || 'عميل مجهول'}</h6>
                    <small class="text-muted">
                        <i class="fas fa-phone me-1"></i>
                        ${order.phone_number || 'غير محدد'}
                    </small>
                    <br>
                    <small class="text-muted">
                        <i class="fas fa-shopping-cart me-1"></i>
                        ${order.product_name || 'منتج غير محدد'}
                    </small>
                </div>
                <div class="text-end">
                    <span class="badge bg-primary rounded-pill">دج${parseFloat(order.total_price || 0).toFixed(2)}</span>
                    <br>
                    <small class="text-muted">
                        ${this.formatDate(new Date(order.created_at))}
                    </small>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = ordersHTML;
    }

    // عرض المنتجات الأكثر مبيعاً
    displayTopProducts(products) {
        const container = document.getElementById('top-products');
        if (!container) return;
        
        if (products.length === 0) {
            container.innerHTML = `
                <div class="text-center py-3">
                    <i class="fas fa-box fa-2x text-muted mb-2"></i>
                    <p class="text-muted">لا توجد منتجات متاحة</p>
                </div>
            `;
            return;
        }
        
        const productsHTML = products.map(product => `
            <div class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                    <h6 class="mb-1">${product.name || 'منتج غير محدد'}</h6>
                    <small class="text-muted">
                        <i class="fas fa-tag me-1"></i>
                        دج${parseFloat(product.price || 0).toFixed(2)}
                    </small>
                    <br>
                    <small class="text-muted">
                        <i class="fas fa-shopping-bag me-1"></i>
                        متوفر
                    </small>
                </div>
                <div class="text-end">
                    <span class="badge bg-success rounded-pill">
                        <i class="fas fa-check me-1"></i>
                        متوفر
                    </span>
                    <br>
                    <small class="text-muted">
                        ${product.available !== false ? 'متوفر' : 'غير متوفر'}
                    </small>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = productsHTML;
    }

    // تنسيق التاريخ
    formatDate(date) {
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return date.toLocaleDateString('ar-DZ', options);
    }
}

// تهيئة لوحة التحكم عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    const dashboard = new Dashboard();
    
    // تحديث الوقت كل ثانية
    setInterval(() => {
        dashboard.updateTime();
    }, 1000);
    
    // تحديث حالة النظام كل 30 ثانية
    setInterval(() => {
        dashboard.updateSystemStatus();
    }, 30000);
    
    // تحديث البيانات كل 5 دقائق
    setInterval(() => {
        dashboard.loadRealStatistics();
    }, 300000);
    
    // إضافة مستمعي الأحداث للأزرار
    const quickActionButtons = document.querySelectorAll('.action-btn');
    quickActionButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // إضافة تأثير النقر
            btn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                btn.style.transform = 'scale(1)';
            }, 150);
        });
    });
});

// وظائف مساعدة إضافية
const DashboardUtils = {
    // تحويل التاريخ إلى نص عربي
    formatDate(date) {
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        };
        return date.toLocaleDateString('ar-DZ', options);
    },

    // حساب النسبة المئوية
    calculatePercentage(current, previous) {
        if (previous === 0) return 100;
        return Math.round(((current - previous) / previous) * 100);
    },

    // تنسيق العملة
    formatCurrency(amount, currency = 'DZD') {
        return new Intl.NumberFormat('ar-DZ', {
            style: 'currency',
            currency: currency
        }).format(amount);
    },

    // إنشاء رسوم بيانية بسيطة (يمكن تطويرها لاحقاً)
    createSimpleChart(containerId, data, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // هنا يمكن إضافة مكتبة رسوم بيانية مثل Chart.js
        console.log('Chart data:', data);
    }
};

// دالة عرض المتجر
window.viewStore = async function() {
    try {
        // الحصول على السابدومين الحالي
        const subdomain = await getCurrentStoreSubdomain();
        if (!subdomain) {
            alert('لا يمكن تحديد السابدومين للمتجر');
            return;
        }
        
        // فتح المتجر في نافذة جديدة عبر السابدومين الصحيح
        const url = DOMAIN_CONFIG.buildStoreUrl(subdomain);
        window.open(url, '_blank');
    } catch (error) {
        console.error('خطأ في عرض المتجر:', error);
        alert('حدث خطأ أثناء فتح المتجر');
    }
};

// تصدير الكلاسات للاستخدام في ملفات أخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Dashboard, DashboardUtils };
}
