import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const CONTACT_EMAIL = "Gombay3d@gmail.com";

export default function Kapcsolatok() {
  return (
    <div className="neon-page flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-grow">
        <section className="px-4 py-14 md:py-20">
          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-center">
            <div>
              <p className="neon-kicker">Kapcsolat</p>
              <h1 className="neon-heading mt-3 text-4xl font-extrabold md:text-5xl">
                Keress minket bátran!
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-400 md:text-lg">
                Akár első 3D nyomtatásodban segítünk, akár sorozatgyártásra keresel megbízható
                partnert, mindenben segítünk.
              </p>
            </div>
            <aside className="neon-panel rounded-lg p-6">
              <h2 className="text-xl font-semibold text-sky-100">Azonnali elérés</h2>
              <div className="mt-4 space-y-4 text-sm text-slate-300">
                <p>
                  <span className="font-semibold text-sky-200">Telefon:</span> +36 80 124 124
                </p>
                <p>
                  <span className="font-semibold text-sky-200">E-mail:</span> {CONTACT_EMAIL}
                </p>
                <p>
                  <span className="font-semibold text-sky-200">Nyitvatartás:</span> Hétfő-Péntek
                  8:00 - 18:00
                </p>
              </div>
            </aside>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
