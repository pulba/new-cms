/**
 * Utility for Cloudinary image optimization.
 * Injects parameters like f_auto, q_auto, w_X, c_fill on the fly 
 * without modifying the original URL in the database.
 */

export function getOptimizedMediaUrl(url: string | null | undefined, width: number = 300): string | undefined {
  if (!url) return undefined;
  if (!url.includes('res.cloudinary.com')) return url;

  // Example original: https://res.cloudinary.com/demo/image/upload/v1234567890/folder/file.jpg
  // Example optimized: https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_300,c_fill/v1234567890/folder/file.jpg

  const uploadIndex = url.indexOf('/upload/');
  if (uploadIndex === -1) return url;

  // Check if transformations already exist (e.g. contains '/upload/f_auto' or '/upload/w_')
  // We don't want to double transform.
  const prefix = url.substring(0, uploadIndex + 8); // includes '/upload/'
  const suffix = url.substring(uploadIndex + 8);

  if (suffix.startsWith('f_') || suffix.startsWith('w_') || suffix.startsWith('q_') || suffix.startsWith('c_')) {
    return url;
  }

  return `${prefix}f_auto,q_auto,w_${width},c_fill/${suffix}`;
}
