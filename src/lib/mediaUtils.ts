/**
 * Utility to convert absolute backend media URLs to local proxy relative paths.
 * This is necessary to bypass Cloudflare Bot protection WAF rules which block
 * direct requests from client browsers / Vercel without x-vercel-signature header.
 */
export function getMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  // If the url is already relative or a blob/data URI, return it as-is
  if (url.startsWith('/') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  try {
    const parsed = new URL(url);
    if (parsed.pathname.startsWith('/media/')) {
      return parsed.pathname; // returns "/media/..."
    }
  } catch (e) {
    // Fallback if URL parsing fails but contains /media/
    const mediaIdx = url.indexOf('/media/');
    if (mediaIdx !== -1) {
      return url.substring(mediaIdx);
    }
  }

  return url;
}

/**
 * Utility to compress an image client-side using HTML5 Canvas.
 * Resizes the image to fit within maxWidth/maxHeight and outputs a WebP image.
 * Resilient to errors by falling back to the original file if compression fails.
 */
export function compressImage(
  file: File,
  maxWidth: number = 1080,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve) => {
    // If the file is not an image, return it as-is
    if (!file.type.startsWith('image/')) {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
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

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(file); // Fallback to original file
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Convert blob to File
              const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
              const compressedFile = new File([blob], `${nameWithoutExt}.webp`, {
                type: 'image/webp',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file); // Fallback to original file
            }
          },
          'image/webp',
          quality
        );
      };
      img.onerror = () => resolve(file); // Fallback
    };
    reader.onerror = () => resolve(file); // Fallback
  });
}
