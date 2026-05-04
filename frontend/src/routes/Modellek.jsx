import { useQuery } from "@tanstack/react-query";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { api } from "../lib/api";

const fallbackModels = [
  {
    title: "Asztali rendszerezők",
    description: "Kábelvezetők, tartók és kis tárolók, amelyek azonnal nyomtathatók.",
    image: "/background.jpg",
    priceHuf: 2500,
    size: "12 x 8 x 4 cm",
  },
  {
    title: "Műszaki segédelemek",
    description: "Távtartók, burkolatminták és szerelési segédletek gyors teszteléshez.",
    image: "/nagyobb_nyomtato.png",
    priceHuf: 3200,
    size: "10 x 10 x 6 cm",
  },
  {
    title: "Dekor és ajándék",
    description: "Letisztult, praktikus modellek ajándéknak, polcra vagy eseményekre.",
    image: "/Nyomtatok/Bambulab A1mini.webp",
    priceHuf: 4500,
    size: "15 x 12 x 8 cm",
  },
  {
    title: "Egyedi alapmodellek",
    description: "Kész kiindulási modellek, amelyeket méretben vagy felirattal személyre szabunk.",
    image: "/Nyomtatok/nagyobb_nyomtato.webp",
    priceHuf: 5900,
    size: "18 x 12 x 10 cm",
  },
];

function formatCurrency(value) {
  if (!Number.isFinite(Number(value))) {
    return "Ár egyeztetés szerint";
  }

  return new Intl.NumberFormat("hu-HU", {
    style: "currency",
    currency: "HUF",
    maximumFractionDigits: 0,
  }).format(Math.round(Number(value)));
}

export default function Modellek() {
  const premadeModelsQuery = useQuery({
    queryKey: ["premade-models"],
    queryFn: () => api("/premade-models"),
    retry: false,
  });
  const uploadedModels = premadeModelsQuery.data?.items ?? [];
  const models =
    uploadedModels.length > 0
      ? uploadedModels.map((item) => ({
          title: item.title,
          description: item.description,
          image: item.image?.url,
          priceHuf: item.priceHuf,
          size: item.size,
        }))
      : fallbackModels;

  return (
    <div className="neon-page flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-grow">
        <section className="px-4 py-14 md:py-20">
          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[1.05fr_0.95fr] md:items-center">
            <div>
              <p className="neon-kicker">Modellek</p>
              <h1 className="neon-heading mt-3 text-4xl font-extrabold md:text-5xl">
                Előre megtervezett 3D nyomtatható modellek
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-400 md:text-lg">
                Válogass kész modellötletekből, amelyeket gyorsan gyártásba tudunk adni, vagy
                igény szerint finomhangolunk a felhasználáshoz.
              </p>
            </div>
            <div className="neon-panel overflow-hidden rounded-lg">
              <img
                src="/nagyobb_nyomtato.png"
                alt="3D nyomtató munka közben"
                className="h-72 w-full object-cover"
              />
            </div>
          </div>
        </section>

        <section className="px-4 pb-16 md:pb-20">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {models.map((model) => (
                <article key={model.title} className="neon-card flex h-full flex-col overflow-hidden">
                  <img src={model.image} alt={model.title} className="h-40 w-full object-cover" />
                  <div className="flex flex-1 flex-col p-5">
                    <h2 className="text-lg font-semibold text-sky-100">{model.title}</h2>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-400">
                      {model.description}
                    </p>
                    <div className="mt-4 space-y-1 border-t border-slate-700 pt-4 text-sm text-slate-300">
                      <p>
                        <span className="font-semibold text-sky-100">Ár:</span>{" "}
                        {formatCurrency(model.priceHuf)}
                      </p>
                      <p>
                        <span className="font-semibold text-sky-100">Méret:</span> {model.size}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
