import imageCompression from 'browser-image-compression';

export async function compressImage(file: File): Promise<File> {
  // Skip compression for SVGs (vector, already tiny)
  if (file.type === 'image/svg+xml') {
    return file;
  }

  const options = {
    maxSizeMB: 0.1,              // Target ≤ 100KB
    maxWidthOrHeight: 1280,       // Resize to max 1280px (match cwebp script)
    useWebWorker: true,
    fileType: 'image/webp',       // Force WebP output (much smaller than PNG/JPG)
    initialQuality: 0.8,          // Quality 80% (match cwebp -q 80)
  };

  try {
    const compressed = await imageCompression(file, options);
    const originalKB = (file.size / 1024).toFixed(0);
    const compressedKB = (compressed.size / 1024).toFixed(0);
    const savings = ((1 - compressed.size / file.size) * 100).toFixed(0);

    console.log(
      `[Compress] ${file.name}: ${originalKB}KB → ${compressedKB}KB (${savings}% smaller, WebP)`
    );
    return compressed;
  } catch (error) {
    console.warn('[Compress] Failed, using original:', error);
    return file;
  }
}
