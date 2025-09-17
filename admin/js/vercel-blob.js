import { put, del } from '@vercel/blob';
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

    // رفع الملف مباشرة إلى Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
      token: token
    });

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

    // استخراج اسم الملف من الرابط
    const filename = url.split('/').pop();
    if (!filename) {
      throw new Error('لا يمكن استخراج اسم الملف من الرابط');
    }
    
    console.log(`🗑️ Deleting file: ${filename} from Vercel Blob`);

    // حذف الملف مباشرة من Vercel Blob
    await del(filename, {
      token: token
    });

    console.log(`✅ File deleted successfully: ${filename}`);
    
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
