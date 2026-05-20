export const fallbackReferenceImages = [
  {
    src: "/background.jpg",
    title: "3D nyomtatott referencia",
  },
  {
    src: "/nagyobb_nyomtato.png",
    title: "3D nyomtat\u00e1si referencia",
  },
  {
    src: "/Nyomtatok/Bambulab A1mini.webp",
    title: "Bambulab referencia",
  },
  {
    src: "/Nyomtatok/nagyobb_nyomtato.webp",
    title: "Nagyobb nyomtat\u00f3 referencia",
  },
];

function normalizeReferenceImages(item, title) {
  const sourceImages =
    Array.isArray(item.images) && item.images.length > 0
      ? item.images
      : item.image
        ? [item.image]
        : item.src
          ? [{ url: item.src }]
          : [];

  return sourceImages
    .map((image, index) => {
      const src = typeof image === "string" ? image : image.url || image.src;

      return {
        id: typeof image === "string" ? `${src}-${index}` : image.publicId || image.url || image.src || `${title}-${index}`,
        src,
        alt: title,
      };
    })
    .filter((image) => image.src);
}

export function buildReferenceImageList(items = [], { limit } = {}) {
  const uploadedImages = items
    .map((item) => {
      const title = item.title || "3D nyomtatott referencia";
      const images = normalizeReferenceImages(item, title);

      return {
        id: item.id ?? images[0]?.src ?? title,
        src: images[0]?.src,
        images,
        title,
        createdAt: item.createdAt,
      };
    })
    .filter((image) => image.src);

  const sourceImages =
    uploadedImages.length > 0
      ? uploadedImages
      : fallbackReferenceImages.map((item) => ({
          ...item,
          id: item.src,
          images: normalizeReferenceImages(item, item.title),
        }));

  return typeof limit === "number" ? sourceImages.slice(0, limit) : sourceImages;
}
