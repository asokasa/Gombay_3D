export const MAX_PRINT_QUANTITY = 999;

export const fallbackPremadeModels = [
  {
    id: "fallback-organizers",
    title: "Asztali rendszerezők",
    description: "Kábelvezetők, tartók és kis tárolók, amelyek azonnal nyomtathatók.",
    image: "/background.jpg",
    priceHuf: 2500,
    size: "12 x 8 x 4 cm",
  },
  {
    id: "fallback-technical",
    title: "Műszaki segédelemek",
    description: "Távtartók, burkolatminták és szerelési segédletek gyors teszteléshez.",
    image: "/nagyobb_nyomtato.png",
    priceHuf: 3200,
    size: "10 x 10 x 6 cm",
  },
  {
    id: "fallback-decor",
    title: "Dekor és ajándék",
    description: "Letisztult, praktikus modellek ajándéknak, polcra vagy eseményekre.",
    image: "/Nyomtatok/Bambulab A1mini.webp",
    priceHuf: 4500,
    size: "15 x 12 x 8 cm",
  },
  {
    id: "fallback-custom-base",
    title: "Egyedi alapmodellek",
    description: "Kész kiindulási modellek, amelyeket méretben vagy felirattal személyre szabunk.",
    image: "/Nyomtatok/nagyobb_nyomtato.webp",
    priceHuf: 5900,
    size: "18 x 12 x 10 cm",
  },
];

export function clampQuantity(value, fallback = 1) {
  const parsed = Number(String(value).replace(",", "."));
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(MAX_PRINT_QUANTITY, Math.max(1, Math.trunc(parsed)));
}

export function formatPremadeCurrency(value) {
  if (!Number.isFinite(Number(value))) {
    return "Ár egyeztetés szerint";
  }

  return new Intl.NumberFormat("hu-HU", {
    style: "currency",
    currency: "HUF",
    maximumFractionDigits: 0,
  }).format(Math.round(Number(value)));
}

function normalizePremadeImages(model, title) {
  const sourceImages =
    Array.isArray(model.images) && model.images.length > 0
      ? model.images
      : model.image
        ? [model.image]
        : [];

  return sourceImages
    .map((image, index) => {
      const src = typeof image === "string" ? image : image.url || image.src;

      return {
        id:
          typeof image === "string"
            ? `${src}-${index}`
            : image.publicId || image.url || image.src || `${title}-${index}`,
        src,
        alt: title,
      };
    })
    .filter((image) => image.src);
}

export function normalizePremadeModel(model, fallbackId) {
  const title = model.title || "Kész modell";
  const images = normalizePremadeImages(model, title);
  const imageUrl = images[0]?.src;

  return {
    id: model.id || fallbackId || model.title,
    title,
    description: model.description || "",
    image: model.image,
    images,
    imageUrl: imageUrl || "/background.jpg",
    priceHuf: Number(model.priceHuf),
    size: model.size || "",
    availableMaterialKeys: Array.isArray(model.availableMaterialKeys)
      ? model.availableMaterialKeys
      : null,
  };
}

export function buildPremadeModelList(uploadedModels = []) {
  const sourceModels = uploadedModels.length > 0 ? uploadedModels : fallbackPremadeModels;
  return sourceModels.map((model, index) => normalizePremadeModel(model, `premade-${index}`));
}
