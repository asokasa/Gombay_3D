import { useEffect } from "react";

const DEFAULT_SEO = {
  title: "Gombay 3D | 3D nyomtatás és egyedi modellek",
  description:
    "Gombay 3D: precíz 3D nyomtatás, egyedi modellek, kész modellek és online ajánlatkérés.",
  noindex: false,
};

function setMeta(attribute, name, content) {
  let element = document.head.querySelector(`meta[${attribute}="${name}"]`);

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
}

function setCanonical(url) {
  let element = document.head.querySelector('link[rel="canonical"]');

  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.appendChild(element);
  }

  element.setAttribute("href", url);
}

export default function SEO({ title, description, noindex = false }) {
  useEffect(() => {
    const pageTitle = title || DEFAULT_SEO.title;
    const pageDescription = description || DEFAULT_SEO.description;
    const pageUrl = new URL(window.location.pathname, window.location.origin).href;
    const imageUrl = new URL("/last_refined_cropped.png", window.location.origin).href;

    document.title = pageTitle;
    setMeta("name", "description", pageDescription);
    setMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow");
    setMeta("property", "og:title", pageTitle);
    setMeta("property", "og:description", pageDescription);
    setMeta("property", "og:type", "website");
    setMeta("property", "og:url", pageUrl);
    setMeta("property", "og:image", imageUrl);
    setMeta("property", "og:locale", "hu_HU");
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", pageTitle);
    setMeta("name", "twitter:description", pageDescription);
    setMeta("name", "twitter:image", imageUrl);
    setCanonical(pageUrl);

    let structuredData = document.getElementById("gombay-seo-jsonld");

    if (!structuredData) {
      structuredData = document.createElement("script");
      structuredData.id = "gombay-seo-jsonld";
      structuredData.type = "application/ld+json";
      document.head.appendChild(structuredData);
    }

    structuredData.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Gombay 3D",
      url: window.location.origin,
      logo: imageUrl,
      email: "Gombay3d@gmail.com",
      description: DEFAULT_SEO.description,
    });
  }, [description, noindex, title]);

  return null;
}
