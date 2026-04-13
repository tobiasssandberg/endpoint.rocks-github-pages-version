const SKIP_TYPES = ["image/svg+xml", "image/gif"];
const DEFAULT_MAX_WIDTH = 1600;
const DEFAULT_QUALITY = 0.82;
const SKIP_BELOW_BYTES = 100 * 1024; // 100 KB

interface OptimizeOptions {
  maxWidth?: number;
  quality?: number;
}

export async function optimizeImage(
  file: File,
  options?: OptimizeOptions
): Promise<File> {
  if (SKIP_TYPES.includes(file.type) || file.size < SKIP_BELOW_BYTES) {
    return file;
  }

  const maxWidth = options?.maxWidth ?? DEFAULT_MAX_WIDTH;
  const quality = options?.quality ?? DEFAULT_QUALITY;

  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;

  if (width > maxWidth) {
    height = Math.round((height * maxWidth) / width);
    width = maxWidth;
  }

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  // Try WebP first, fall back to JPEG
  let blob = await canvas.convertToBlob({ type: "image/webp", quality });
  let ext = "webp";

  if (blob.type !== "image/webp") {
    blob = await canvas.convertToBlob({ type: "image/jpeg", quality });
    ext = "jpg";
  }

  const name = file.name.replace(/\.[^.]+$/, "") + "." + ext;
  return new File([blob], name, { type: blob.type });
}
