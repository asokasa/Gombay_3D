import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { PremadeModelCard, PremadeModelRequestForm } from "../components/PremadeModelRequest";
import { buildPremadeModelList } from "../lib/premadeModels";
import { api } from "../lib/api";

export default function Modellek() {
  const [selectedModel, setSelectedModel] = useState(null);
  const premadeModelsQuery = useQuery({
    queryKey: ["premade-models"],
    queryFn: () => api("/premade-models"),
    retry: false,
  });
  const models = buildPremadeModelList(premadeModelsQuery.data?.items ?? []);

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
                Válogass kész modellötletekből, amelyeket gyorsan gyártásba tudunk adni, vagy igény
                szerint finomhangolunk a felhasználáshoz.
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
          <div className="mx-auto max-w-6xl space-y-8">
            {premadeModelsQuery.isLoading ? (
              <p className="text-sm text-slate-500">Modellek betöltése...</p>
            ) : null}

            {premadeModelsQuery.isError ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                Az admin modellek nem érhetők el, ezért az alapértelmezett modellek láthatók.
              </p>
            ) : null}

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {models.map((model) => (
                <PremadeModelCard
                  key={model.id}
                  model={model}
                  isSelected={selectedModel?.id === model.id}
                  onSelect={setSelectedModel}
                />
              ))}
            </div>

            {selectedModel ? (
              <PremadeModelRequestForm
                model={selectedModel}
                onBack={() => setSelectedModel(null)}
              />
            ) : null}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
