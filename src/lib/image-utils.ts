/**
 * GVCN Pro - Image Utility Functions
 * Nén và tối ưu hóa hình ảnh tải lên từ thiết bị của giáo viên,
 * giúp Base64 luôn nhẹ (~30KB-70KB), an toàn cho LocalStorage và Supabase.
 */

export const DEFAULT_FALLBACK_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=500&auto=format&fit=crop&q=80';

/**
 * Nén tệp hình ảnh phía Client sử dụng HTML5 Canvas
 * Tự động scale theo maxWidth / maxHeight và xuất ra WebP hoặc JPEG chất lượng tối ưu.
 */
export function compressImageFile(
  file: File,
  maxWidth = 600,
  maxHeight = 600,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Tệp tải lên không phải là định dạng hình ảnh hợp lệ'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không thể đọc tệp ảnh'));
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Không thể tải dữ liệu ảnh'));
      img.onload = () => {
        let { width, height } = img;

        // Giữ nguyên tỷ lệ, thu nhỏ nếu vượt quá giới hạn
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(readerEvent.target?.result as string);
          return;
        }

        // Vẽ ảnh mịn màng với imageSmoothingEnabled
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Thử xuất WebP trước (dung lượng nhẹ hơn 30%), nếu trình duyệt không hỗ trợ thì fallback sang JPEG
        try {
          const webpData = canvas.toDataURL('image/webp', quality);
          if (webpData.startsWith('data:image/webp')) {
            resolve(webpData);
            return;
          }
        } catch {
          // Bỏ qua nếu lỗi
        }

        try {
          const jpegData = canvas.toDataURL('image/jpeg', quality);
          resolve(jpegData);
        } catch {
          resolve(readerEvent.target?.result as string);
        }
      };

      img.src = readerEvent.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Kiểm tra xem chuỗi có phải là URL hình ảnh hoặc Data URI hợp lệ hay không
 */
export function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.startsWith('data:image/')) return true;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) return true;
  return false;
}
