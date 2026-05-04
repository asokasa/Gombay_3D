import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const models = [
  {
    title: "Asztali rendszerezők",
    category: "Otthon és iroda",
    description: "Kábelvezetők, tartók és kis tárolók, amelyek azonnal nyomtathatók.",
    image: "/background.jpg",
  },
  {
    title: "Műszaki segédelemek",
    category: "Prototípus és javítás",
    description: "Távtartók, burkolatminták és szerelési segédletek gyors teszteléshez.",
    image: "/nagyobb_nyomtato.png",
  },
  {
    title: "Dekor és ajándék",
    category: "Személyes tárgyak",
    description: "Letisztult, praktikus modellek ajándéknak, polcra vagy eseményekre.",
    image: "/Nyomtatok/Bambulab A1mini.webp",
  },
  {
    title: "Egyedi alapmodellek",
    category: "Testreszabható",
    description: "Kész kiindulási modellek, amelyeket méretben vagy felirattal személyre szabunk.",
    image: "/Nyomtatok/nagyobb_nyomtato.webp",
  },
];

export default function Modellek() {
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
                  <img src={model.image} alt="" className="h-40 w-full object-cover" />
                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-red-300">
                      {model.category}
                    </p>
                    <h2 className="mt-2 text-lg font-semibold text-sky-100">{model.title}</h2>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-400">
                      {model.description}
                    </p>
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
