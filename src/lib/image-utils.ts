/**
 * Utility functions to process, compress and validate uploaded document photos
 * on the client side before saving to Firestore.
 */

export interface UploadedDocument {
  dataUrl: string;
  fileName: string;
  fileSizeKb: number;
  uploadedAt: string;
}

export async function compressAndConvertImage(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.78
): Promise<UploadedDocument> {
  return new Promise((resolve, reject) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please select a valid image file (JPEG, PNG, or WebP).'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio scaling
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
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Unable to initialize image processor canvas.'));
          return;
        }

        // Fill white background for transparent PNGs
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Compress to JPEG format for optimal size
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        const approxSizeKb = Math.round((compressedDataUrl.length * 3) / 4 / 1024);

        resolve({
          dataUrl: compressedDataUrl,
          fileName: file.name,
          fileSizeKb: approxSizeKb,
          uploadedAt: new Date().toISOString()
        });
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for processing.'));
      };

      img.src = readerEvent.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Error reading image file.'));
    };

    reader.readAsDataURL(file);
  });
}
