export function getOptimizedImageUrl(src, { width = 640, quality = "auto:eco" } = {}) {
  if (!src || !src.includes("/upload/")) {
    return src;
  }

  const [baseUrl, uploadedPath] = src.split("/upload/");
  const firstPathSegment = uploadedPath.split("/")[0] || "";

  if (firstPathSegment.startsWith("f_") || firstPathSegment.startsWith("q_") || firstPathSegment.startsWith("w_")) {
    return src;
  }

  const safeWidth = Math.max(160, Math.round(Number(width) || 640));
  return `${baseUrl}/upload/f_auto,q_${quality},w_${safeWidth},c_limit/${uploadedPath}`;
}
