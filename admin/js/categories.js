// استيراد Supabase
import { supabase, getCurrentStoreId } from './server-superbase.js';
import { convertImageToWebP } from './webp-converter.js';
import { uploadToVercelBlob, deleteFromVercelBlob } from './vercel-blob.js';
import { BLOB_CONFIG } from './config.js';

// متغيرات عامة
let categories = [];
let currentDeleteId = null;
let currentDeleteName = null;

// تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    loadCategories();
    setupEventListeners();
});

// إعداد مستمعي الأحداث
function setupEventListeners() {
    // نموذج إضافة تصنيف جديد
    document.getElementById('addCategoryForm').addEventListener('submit', handleAddCategory);
    
    // نموذج تعديل التصنيف
    document.getElementById('updateCategoryForm').addEventListener('submit', handleUpdateCategory);
}

// تحميل التصنيفات من قاعدة البيانات
async function loadCategories() {
    try {
        const storeId = await getCurrentStoreId();
        if (!storeId) {
            console.error('لا يمكن تحديد معرف المتجر');
            return;
        }

        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('store_id', storeId)
            .order('name', { ascending: true });

        if (error) {
            console.error('خطأ في تحميل التصنيفات:', error);
            return;
        }

        categories = data || [];
        displayCategories();
    } catch (error) {
        console.error('خطأ في تحميل التصنيفات:', error);
    }
}

// عرض التصنيفات في الجدول
function displayCategories() {
    const tableBody = document.getElementById('categoriesTableBody');
    
    if (categories.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-muted">
                    <i class="fas fa-inbox me-2"></i>
                    لا توجد تصنيفات حالياً
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = categories.map(category => `
        <tr>
            <td>
                <img src="${category.image_url || 'https://via.placeholder.com/50x50?text=صورة'}" 
                     alt="${category.name}" 
                     class="category-image">
            </td>
            <td>${category.name}</td>
            <td>${formatDate(category.created_at)}</td>
            <td>
                <button class="btn btn-success btn-sm me-2" onclick="editCategory('${category.id}', '${category.name}', '${category.image_url}')">
                    <i class="fas fa-edit"></i>
                    تعديل
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteCategory('${category.id}', '${category.name}')">
                    <i class="fas fa-trash"></i>
                    حذف
                </button>
            </td>
        </tr>
    `).join('');
}

// معالجة إضافة تصنيف جديد
async function handleAddCategory(event) {
    event.preventDefault();
    
    const storeId = await getCurrentStoreId();
    if (!storeId) {
        alert('لا يمكن تحديد معرف المتجر');
        return;
    }
    
    const name = document.getElementById('categoryName').value.trim();
    const imageFile = document.getElementById('categoryImage').files[0];
    
    if (!name || !imageFile) {
        alert('يرجى ملء جميع الحقول المطلوبة');
        return;
    }

          try {
        // تحويل الصورة إلى WebP
        const webpFile = await convertImageToWebP(imageFile);
        
        // رفع الصورة إلى Supabase Storage
        const imageUrl = await uploadCategoryImage(webpFile);
        
        // إضافة التصنيف إلى قاعدة البيانات
        const { data, error } = await supabase
            .from('categories')
            .insert([
                {
                    name: name,
                    image_url: imageUrl,
                    store_id: storeId
                }
            ])
            .select();

        if (error) {
            console.error('خطأ في إضافة التصنيف:', error);
            alert('حدث خطأ في إضافة التصنيف');
            return;
        }

        // إعادة تعيين النموذج
        document.getElementById('addCategoryForm').reset();
        
        // إعادة تحميل التصنيفات
        await loadCategories();
        
        // عرض مودل النجاح
        const successModal = new bootstrap.Modal(document.getElementById('successAddModal'));
        successModal.show();
        
    } catch (error) {
        console.error('خطأ في إضافة التصنيف:', error);
        alert('حدث خطأ في إضافة التصنيف');
    }
}

// رفع صورة التصنيف إلى Vercel Blob
async function uploadCategoryImage(file) {
    try {
        const uploadResult = await uploadToVercelBlob(file, BLOB_CONFIG.FOLDERS.CATEGORIES);
        return uploadResult.url;
    } catch (error) {
        console.error('خطأ في رفع صورة التصنيف:', error);
        throw error;
    }
}

// تعديل التصنيف
function editCategory(id, name, imageUrl) {
    document.getElementById('editCategoryId').value = id;
    document.getElementById('editCategoryName').value = name;
    
    // إظهار نموذج التعديل
    document.getElementById('editCategoryForm').style.display = 'block';
    
    // التمرير إلى نموذج التعديل
    document.getElementById('editCategoryForm').scrollIntoView({ behavior: 'smooth' });
}

// إلغاء التعديل
function cancelEdit() {
    document.getElementById('editCategoryForm').style.display = 'none';
    document.getElementById('updateCategoryForm').reset();
}

// معالجة تحديث التصنيف
async function handleUpdateCategory(event) {
    event.preventDefault();
    
    const id = document.getElementById('editCategoryId').value;
    const name = document.getElementById('editCategoryName').value.trim();
    const imageFile = document.getElementById('editCategoryImage').files[0];
    
    if (!name) {
        alert('يرجى إدخال اسم التصنيف');
        return;
    }

    try {
        let imageUrl = null;
        let oldImageUrl = null;
        
        // جلب الصورة القديمة لحذفها إذا تم اختيار صورة جديدة
        if (imageFile) {
            const { data: oldCategory } = await supabase
                .from('categories')
                .select('image_url')
                .eq('id', id)
                .single();
            
            if (oldCategory && oldCategory.image_url) {
                oldImageUrl = oldCategory.image_url;
            }
            
            // تحويل الصورة إلى WebP
            const webpFile = await convertImageToWebP(imageFile);
            imageUrl = await uploadCategoryImage(webpFile);
        }
        
        // تحديث البيانات في قاعدة البيانات
        const updateData = { name: name };
        if (imageUrl) {
            updateData.image_url = imageUrl;
        }
        
        const { error } = await supabase
            .from('categories')
            .update(updateData)
            .eq('id', id);

        if (error) {
            console.error('خطأ في تحديث التصنيف:', error);
            alert('حدث خطأ في تحديث التصنيف');
            return;
        }

        // حذف الصورة القديمة من Vercel Blob
        if (oldImageUrl) {
            try {
                await deleteFromVercelBlob(oldImageUrl);
                console.log('تم حذف الصورة القديمة بنجاح');
            } catch (deleteError) {
                console.warn('فشل في حذف الصورة القديمة:', deleteError);
            }
        }

        // إخفاء نموذج التعديل
        cancelEdit();
        
        // إعادة تحميل التصنيفات
        await loadCategories();
        
        // عرض مودل النجاح
        const successModal = new bootstrap.Modal(document.getElementById('successEditModal'));
        successModal.show();
        
    } catch (error) {
        console.error('خطأ في تحديث التصنيف:', error);
        alert('حدث خطأ في تحديث التصنيف');
    }
}

// حذف التصنيف
function deleteCategory(id, name) {
    currentDeleteId = id;
    currentDeleteName = name;
    
    document.getElementById('deleteCategoryName').textContent = name;
    
    const confirmModal = new bootstrap.Modal(document.getElementById('confirmDeleteModal'));
    confirmModal.show();
}

// تأكيد الحذف
async function confirmDelete() {
    if (!currentDeleteId) return;
    
    try {
        // جلب معلومات التصنيف لحذف الصورة
        const { data: category, error: fetchError } = await supabase
            .from('categories')
            .select('image_url')
            .eq('id', currentDeleteId)
            .single();

        if (fetchError) {
            console.error('خطأ في جلب معلومات التصنيف:', fetchError);
        }

        // حذف التصنيف من قاعدة البيانات
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', currentDeleteId);

        if (error) {
            console.error('خطأ في حذف التصنيف:', error);
            alert('حدث خطأ في حذف التصنيف');
            return;
        }

        // حذف الصورة من Vercel Blob
        if (category && category.image_url) {
            try {
                await deleteFromVercelBlob(category.image_url);
                console.log('تم حذف صورة التصنيف بنجاح');
            } catch (deleteError) {
                console.warn('فشل في حذف صورة التصنيف:', deleteError);
            }
        }

        // إغلاق مودل التأكيد
        const confirmModal = bootstrap.Modal.getInstance(document.getElementById('confirmDeleteModal'));
        confirmModal.hide();
        
        // إعادة تحميل التصنيفات
        await loadCategories();
        
        // عرض مودل النجاح
        const successModal = new bootstrap.Modal(document.getElementById('successDeleteModal'));
        successModal.show();
        
        // إعادة تعيين المتغيرات
        currentDeleteId = null;
        currentDeleteName = null;
        
    } catch (error) {
        console.error('خطأ في حذف التصنيف:', error);
        alert('حدث خطأ في حذف التصنيف');
    }
}

// تنسيق التاريخ بالنمط الجزائري مع الأرقام الإنجليزية
// النتيجة: DD/MM/YYYY HH:MM (مثال: 25/12/2024 14:30)
function formatDate(dateString) {
    const date = new Date(dateString);
    
    // الحصول على اليوم والشهر والسنة
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    
    // الحصول على الساعة والدقائق
    const hours = date.getHours();
    const minutes = date.getMinutes();
    
    // تنسيق التاريخ بالنمط الجزائري (DD/MM/YYYY)
    const formattedDate = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
    
    // تنسيق الوقت
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    return `${formattedDate} ${formattedTime}`;
}

// جعل الدوال متاحة في النطاق العام
window.editCategory = editCategory;
window.cancelEdit = cancelEdit;
window.deleteCategory = deleteCategory;
window.confirmDelete = confirmDelete; 
