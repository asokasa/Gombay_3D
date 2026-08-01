import { Outlet, useLocation } from "react-router-dom";
import ParticleBackground from "./ParticleBackground";
import SEO from "./SEO";

const SEO_BY_PATH = {
  "/": {
    title: "Gombay 3D | Precíz 3D nyomtatás és egyedi modellek",
    description:
      "Precíz és gyors 3D nyomtatás egyedi modellekhez, prototípusokhoz és sorozatgyártáshoz.",
  },
  "/modellek": {
    title: "Kész 3D modellek | Gombay 3D",
    description:
      "Válogass előre megtervezett, 3D nyomtatható modellek közül, és kérj ajánlatot egyszerűen.",
  },
  "/referenciak": {
    title: "3D nyomtatási referenciák | Gombay 3D",
    description:
      "Nézd meg a Gombay 3D korábbi nyomtatási munkáit, modelljeit és egyedi megoldásait.",
  },
  "/kapcsolatok": {
    title: "Kapcsolat | Gombay 3D",
    description: "Lépj kapcsolatba a Gombay 3D csapatával 3D nyomtatási és egyedi modellkéréssel.",
  },
  "/ajanlatkeres": {
    title: "Online ajánlatkérés 3D nyomtatáshoz | Gombay 3D",
    description:
      "Töltsd fel saját 3D modelledet, válassz anyagot és kérj online ajánlatot a Gombay 3D-től.",
  },
  "/posts": {
    title: "3D nyomtatás hírek és bejegyzések | Gombay 3D",
    description: "Hasznos bejegyzések és információk 3D nyomtatásról, modellezésről és gyártásról.",
  },
};

function getSeoForPath(pathname) {
  if (pathname.startsWith("/jogi/")) {
    return {
      title: "Jogi dokumentumok | Gombay 3D",
      description: "A Gombay 3D jogi és használati tájékoztatói.",
      noindex: true,
    };
  }

  return SEO_BY_PATH[pathname] || undefined;
}

export default function PublicSiteLayout() {
  const location = useLocation();

  return (
    <div className="public-particle-shell">
      <ParticleBackground />
      <div className="public-particle-content">
        <SEO {...(getSeoForPath(location.pathname) || {})} />
        <Outlet />
      </div>
    </div>
  );
}
