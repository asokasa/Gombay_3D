import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const CONTACT_EMAIL = "Gombay3d@gmail.com";
const WORKSHOP_ADDRESS = "2119 Pécel, Ady Endre utca 6.";
const MAP_EMBED_URL =
  "https://maps.google.com/maps?hl=hu&q=2119%20P%C3%A9cel%2C%20Ady%20Endre%20utca%206&z=16&output=embed";

const offices = [
  {
    city: "Pécel műhely",
    address: WORKSHOP_ADDRESS,
    phone: "+36 1 200 3344",
  },
];

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
                  <span className="font-semibold text-sky-200">Telefon:</span> +36 80 123 123
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

        <section className="px-4 pb-16 md:pb-20">
          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-2xl font-semibold text-sky-100">Irodánk és műhelyünk</h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-400">
                
              </p>
              <ul className="mt-6 space-y-4">
                {offices.map((office) => (
                  <li key={office.city} className="neon-card p-5">
                    <h3 className="text-lg font-semibold text-sky-100">{office.city}</h3>
                    <p className="mt-1 text-sm text-slate-400">{office.address}</p>
                    <p className="mt-2 text-sm text-sky-200">Telefon: {office.phone}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="neon-panel overflow-hidden rounded-lg">
              <div className="relative aspect-video w-full bg-[#03050a]">
                <iframe
                  title="Gombay 3D térkép"
                  className="absolute inset-0 h-full w-full"
                  src={MAP_EMBED_URL}
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
