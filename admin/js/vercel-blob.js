import { BLOB_CONFIG, validateBlobConfig } from './config.js';

// دالة لرفع الصور إلى Vercel Blob مباشرة من الـ frontend
export async function uploadToVercelBlob(file, folder = 'images') {
  try {
    // التحقق من صحة الإعدادات
    validateBlobConfig();
    
    const token = BLOB_CONFIG.BLOB_READ_WRITE_TOKEN;

    // إنشاء اسم فريد للملف
    const timestamp = Date.now();
    const filename = `${folder}/${timestamp}_${file.name}`;

    console.log(`📤 Uploading file: ${filename} to Vercel Blob`);

    // رفع الملف مباشرة إلى Vercel Blob عبر REST API
    const response = await fetch(`https://blob.vercel-storage.com/${encodeURIComponent(filename)}`, {
      method: 'PUT',
      headers: {
        'x-vercel-blobs-token': token,
        'Authorization': `Bearer ${token}`,
        'content-type': file.type || 'application/octet-stream',
        'x-vercel-blob-access': 'public'
      },
      body: file
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Vercel Blob upload failed (${response.status}): ${text}`);
    }

    const blob = await response.json();

    console.log(`✅ File uploaded successfully: ${blob.url}`);

    return {
      url: blob.url,
      filename: filename
    };
  } catch (error) {
    console.error('خطأ في رفع الصورة إلى Vercel Blob:', error);
    throw error;
  }
}

// دالة لحذف الصورة من Vercel Blob مباشرة من الـ frontend
export async function deleteFromVercelBlob(url) {
  try {
    // التحقق من صحة الإعدادات
    validateBlobConfig();
    
    const token = BLOB_CONFIG.BLOB_READ_WRITE_TOKEN;

    // استخراج المسار الكامل للملف من الرابط (folder/name.ext)
    let pathname = '';
    try {
      const u = new URL(url);
      pathname = u.pathname.startsWith('/') ? u.pathname.slice(1) : u.pathname;
    } catch (_) {
      // في حال لم يكن الرابط صالحاً، نعود للطريقة القديمة مع تحذير
      const parts = url.split('://');
      pathname = parts.length > 1 ? parts[1].split('/').slice(1).join('/') : url.split('/').slice(3).join('/');
    }
    if (!pathname) {
      throw new Error('لا يمكن استخراج مسار الملف من الرابط');
    }
    
    console.log(`🗑️ Deleting file: ${pathname} from Vercel Blob`);

    // حذف الملف مباشرة من Vercel Blob عبر REST API
    const response = await fetch(`https://blob.vercel-storage.com/${encodeURIComponent(pathname)}`, {
      method: 'DELETE',
      headers: {
        'x-vercel-blobs-token': token,
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Vercel Blob delete failed (${response.status}): ${text}`);
    }

    console.log(`✅ File deleted successfully: ${pathname}`);
    
    return true;
  } catch (error) {
    console.error('خطأ في حذف الصورة من Vercel Blob:', error);
    throw error;
  }
}

// دالة لرفع عدة صور دفعة واحدة
export async function uploadMultipleToVercelBlob(files, folder = 'images') {
  try {
    const uploadPromises = files.map(file => uploadToVercelBlob(file, folder));
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('خطأ في رفع الصور المتعددة:', error);
    throw error;
  }
}

// دالة لحذف عدة صور دفعة واحدة
export async function deleteMultipleFromVercelBlob(urls) {
  try {
    const deletePromises = urls.map(url => deleteFromVercelBlob(url));
    const results = await Promise.all(deletePromises);
    return results;
  } catch (error) {
    console.error('خطأ في حذف الصور المتعددة:', error);
    throw error;
  }
}
