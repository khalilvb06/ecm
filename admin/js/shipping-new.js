import { supabase, getCurrentStoreId } from './server-superbase.js';
import { protectAdminPages } from './auth-guard.js';

// متغيرات عامة
let allStates = [];
let storeShippingPrices = [];
let currentStoreId = null;

// دالة تحميل الولايات العامة
async function fetchAllStates() {
  try {
    const { data, error } = await supabase
      .from('shipping_states')
      .select('*')
      .order('state_name');

    if (error) {
      console.error('خطأ في جلب الولايات:', error);
      // إذا لم تكن الجدول موجود، قم بإنشاء الولايات الأساسية
      await createDefaultStates();
      return;
    }

    allStates = data || [];
    
    // إذا لم تكن هناك ولايات، قم بإنشاء الولايات الأساسية
    if (allStates.length === 0) {
      await createDefaultStates();
    } else {
      displayStates();
    }
  } catch (error) {
    console.error('خطأ في جلب الولايات:', error);
  }
}

// دالة إنشاء الولايات الأساسية
async function createDefaultStates() {
  const defaultStates = [
    { state_name: 'الجزائر', home_delivery_price: 500, office_delivery_price: 300, is_available: true },
    { state_name: 'وهران', home_delivery_price: 600, office_delivery_price: 400, is_available: true },
    { state_name: 'قسنطينة', home_delivery_price: 700, office_delivery_price: 500, is_available: true },
    { state_name: 'عنابة', home_delivery_price: 800, office_delivery_price: 600, is_available: true },
    { state_name: 'باتنة', home_delivery_price: 900, office_delivery_price: 700, is_available: true },
    { state_name: 'بجاية', home_delivery_price: 750, office_delivery_price: 550, is_available: true },
    { state_name: 'سطيف', home_delivery_price: 650, office_delivery_price: 450, is_available: true },
    { state_name: 'تيزي وزو', home_delivery_price: 550, office_delivery_price: 350, is_available: true }
  ];

  try {
    const { data, error } = await supabase
      .from('shipping_states')
      .insert(defaultStates);

    if (error) {
      console.error('خطأ في إنشاء الولايات الأساسية:', error);
      return;
    }

    console.log('تم إنشاء الولايات الأساسية بنجاح');
    // إعادة تحميل البيانات
    await fetchAllStates();
  } catch (error) {
    console.error('خطأ في إنشاء الولايات الأساسية:', error);
  }
}

// دالة تحميل أسعار الشحن الخاصة بالمتجر
async function fetchStoreShippingPrices() {
  try {
    currentStoreId = await getCurrentStoreId();
    if (!currentStoreId) {
      console.error('لا يمكن تحديد معرف المتجر');
      return;
    }

    const { data, error } = await supabase
      .from('store_shipping_prices')
      .select(`
        *,
        shipping_states (
          id,
          state_name
        )
      `)
      .eq('store_id', currentStoreId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('خطأ في جلب أسعار الشحن:', error);
      return;
    }

    storeShippingPrices = data || [];
  } catch (error) {
    console.error('خطأ في جلب أسعار الشحن:', error);
  }
}

// عرض الولايات العامة مع أسعار الشحن
function displayStates() {
  const tableBody = document.getElementById('statesTableBody');
  if (!tableBody) return;

  tableBody.innerHTML = '';

  allStates.forEach((state) => {
    // البحث عن سعر الشحن الخاص بالمتجر لهذه الولاية
    const storePrice = storeShippingPrices.find(sp => sp.state_id === state.id);
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${state.state_name}</td>
      <td>
        ${storePrice ? `${storePrice.home_delivery_price} دج` : 
          `<span class="text-muted">غير محدد</span>`}
      </td>
      <td>
        ${storePrice ? `${storePrice.office_delivery_price} دج` : 
          `<span class="text-muted">غير محدد</span>`}
      </td>
      <td>
        <span class="badge ${storePrice && storePrice.is_available ? 'bg-success' : 'bg-danger'}">
          ${storePrice && storePrice.is_available ? 'متاح' : 'غير متاح'}
        </span>
      </td>
      <td>
        <button class="btn btn-sm btn-primary" onclick="editStateShipping(${state.id})">
          <i class="fas fa-edit"></i> تعديل الأسعار
        </button>
        ${storePrice ? `
          <button class="btn btn-sm btn-danger ms-1" onclick="deleteStoreShippingPrice(${storePrice.id})">
            <i class="fas fa-trash"></i> حذف
          </button>
        ` : ''}
      </td>
    `;
    tableBody.appendChild(row);
  });
}


// دالة تعديل أسعار الشحن لولاية معينة
window.editStateShipping = async function(stateId) {
  const state = allStates.find(s => s.id === stateId);
  if (!state) return;

  // التحقق من وجود سعر شحن للمتجر لهذه الولاية
  const existingPrice = storeShippingPrices.find(sp => sp.state_id === stateId);
  
  const modal = new bootstrap.Modal(document.getElementById('editShippingModal'));
  const modalBody = document.getElementById('editShippingModalBody');
  
  modalBody.innerHTML = `
    <form id="shippingPriceForm">
      <input type="hidden" id="stateId" value="${stateId}">
      <input type="hidden" id="shippingPriceId" value="${existingPrice?.id || ''}">
      
      <div class="mb-3">
        <label class="form-label">الولاية</label>
        <input type="text" class="form-control" value="${state.state_name}" readonly>
      </div>
      
      <div class="row">
        <div class="col-md-6">
          <label class="form-label">سعر التوصيل إلى المنزل (دج)</label>
          <input type="number" class="form-control" id="homePrice" 
                 value="${existingPrice?.home_delivery_price || ''}" 
                 min="0" step="0.01" required>
        </div>
        <div class="col-md-6">
          <label class="form-label">سعر التوصيل إلى المكتب (دج)</label>
          <input type="number" class="form-control" id="officePrice" 
                 value="${existingPrice?.office_delivery_price || ''}" 
                 min="0" step="0.01" required>
        </div>
      </div>
      
      <div class="mb-3">
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="isAvailable" 
                 ${existingPrice?.is_available !== false ? 'checked' : ''}>
          <label class="form-check-label" for="isAvailable">
            متاح للتوصيل
          </label>
        </div>
      </div>
      
      <div class="text-end">
        <button type="button" class="btn btn-secondary me-2" data-bs-dismiss="modal">إلغاء</button>
        <button type="submit" class="btn btn-primary">حفظ</button>
      </div>
    </form>
  `;
  
  modal.show();
  
  // إضافة مستمع للنموذج
  document.getElementById('shippingPriceForm').addEventListener('submit', handleSaveShippingPrice);
};

// دالة حفظ أسعار الشحن
async function handleSaveShippingPrice(event) {
  event.preventDefault();
  
  if (!currentStoreId) {
    alert('لا يمكن تحديد معرف المتجر');
    return;
  }
  
  const stateId = document.getElementById('stateId').value;
  const shippingPriceId = document.getElementById('shippingPriceId').value;
  const homePrice = parseFloat(document.getElementById('homePrice').value);
  const officePrice = parseFloat(document.getElementById('officePrice').value);
  const isAvailable = document.getElementById('isAvailable').checked;
  
  if (isNaN(homePrice) || isNaN(officePrice)) {
    alert('يرجى إدخال أسعار صحيحة');
    return;
  }
  
  try {
    const data = {
      store_id: currentStoreId,
      state_id: parseInt(stateId),
      home_delivery_price: homePrice,
      office_delivery_price: officePrice,
      is_available: isAvailable
    };
    
    let result;
    if (shippingPriceId) {
      // تحديث سعر موجود
      result = await supabase
        .from('store_shipping_prices')
        .update(data)
        .eq('id', shippingPriceId);
    } else {
      // إضافة سعر جديد
      result = await supabase
        .from('store_shipping_prices')
        .insert([data]);
    }
    
    if (result.error) {
      console.error('خطأ في حفظ أسعار الشحن:', result.error);
      alert('حدث خطأ أثناء حفظ أسعار الشحن: ' + result.error.message);
      return;
    }
    
    // إغلاق المودال وتحديث البيانات
    const modal = bootstrap.Modal.getInstance(document.getElementById('editShippingModal'));
    modal.hide();
    
    // تحديث البيانات
    await fetchStoreShippingPrices();
    displayStates(); // تحديث العرض مباشرة
    
    alert('تم حفظ أسعار الشحن بنجاح');
    
  } catch (error) {
    console.error('خطأ في حفظ أسعار الشحن:', error);
    alert('حدث خطأ أثناء حفظ أسعار الشحن: ' + error.message);
  }
}


// دالة حذف سعر شحن
window.deleteStoreShippingPrice = async function(shippingPriceId) {
  if (!confirm('هل أنت متأكد من حذف سعر الشحن لهذه الولاية؟')) {
    return;
  }
  
  try {
    const { error } = await supabase
      .from('store_shipping_prices')
      .delete()
      .eq('id', shippingPriceId);
    
    if (error) {
      console.error('خطأ في حذف سعر الشحن:', error);
      alert('حدث خطأ أثناء حذف سعر الشحن: ' + error.message);
      return;
    }
    
    // تحديث البيانات
    await fetchStoreShippingPrices();
    displayStates(); // تحديث العرض مباشرة
    
    alert('تم حذف سعر الشحن بنجاح');
    
  } catch (error) {
    console.error('خطأ في حذف سعر الشحن:', error);
    alert('حدث خطأ أثناء حذف سعر الشحن: ' + error.message);
  }
};

// تهيئة الصفحة
document.addEventListener('DOMContentLoaded', async function() {
  const isProtected = await protectAdminPages();
  if (isProtected) {
    console.log('تم التحقق من المصادقة، بدء تحميل بيانات الشحن...');
    await fetchAllStates();
    await fetchStoreShippingPrices();
    displayStates(); // عرض البيانات بعد التحميل
  } else {
    console.log('فشل في المصادقة، لن يتم تحميل بيانات الشحن');
  }
});
