import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const contacts = [
  {
    title: "Ügyfélszolgálat",
    description: "Segítünk eligazodni a szolgáltatások és a rendelés folyamata között.",
    phone: "+36 30 123 4567",
    email: "hello@peti3d.hu",
    hours: "Hétfő-Péntek: 9:00 - 17:00",
  },
  {
    title: "Technikai támogatás",
    description:
      "Ha a 3D nyomtatási fájlokkal vagy gyártással kapcsolatban van kérdésed, írj nekünk.",
    phone: "+36 70 765 4321",
    email: "support@peti3d.hu",
    hours: "Hétfő-Péntek: 8:00 - 18:00",
  },
  {
    title: "Egyedi projektek",
    description:
      "Kutatási vagy ipari projektedhez keresel partnert? Projektvezetőnk szívesen egyeztet.",
    phone: "+36 1 445 9988",
    email: "projektek@peti3d.hu",
    hours: "Hétfő-Csütörtök: 10:00 - 16:00",
  },
];

const offices = [
  {
    city: "Budapest központ",
    address: "1132 Budapest, Visegrádi utca 12.",
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
                Beszélgessünk az ötletedről
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-400 md:text-lg">
                Akár első 3D nyomtatásodban segítünk, akár sorozatgyártásra keresel megbízható
                partnert, csapatunk készen áll válaszolni minden kérdésedre.
              </p>
            </div>
            <aside className="neon-panel rounded-lg p-6">
              <h2 className="text-xl font-semibold text-sky-100">Azonnali elérés</h2>
              <div className="mt-4 space-y-4 text-sm text-slate-300">
                <p>
                  <span className="font-semibold text-sky-200">Telefon:</span> +36 80 123 123
                </p>
                <p>
                  <span className="font-semibold text-sky-200">E-mail:</span> kapcsolat@peti3d.hu
                </p>
                <p>
                  <span className="font-semibold text-sky-200">Nyitvatartás:</span> Hétfő-Péntek
                  8:00 - 18:00
                </p>
              </div>
            </aside>
          </div>
        </section>

        <section className="px-4 pb-16">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl font-semibold text-sky-100">Kapcsolattartó csapataink</h2>
            <p className="mt-3 max-w-2xl text-sm text-slate-400">
              Válaszd ki a számodra megfelelő csapatot, és mi 24 órán belül visszajelzünk.
            </p>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {contacts.map((contact) => (
                <article key={contact.title} className="neon-card flex h-full flex-col p-6">
                  <h3 className="text-lg font-semibold text-sky-100">{contact.title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-400">
                    {contact.description}
                  </p>
                  <dl className="mt-5 space-y-3 text-sm text-slate-300">
                    <div>
                      <dt className="font-medium text-slate-400">Telefon</dt>
                      <dd className="text-sky-200">{contact.phone}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-400">E-mail</dt>
                      <dd className="break-words text-sky-200">{contact.email}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-400">Elérhetőség</dt>
                      <dd>{contact.hours}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-16 md:pb-20">
          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-2xl font-semibold text-sky-100">Irodáink és műhelyeink</h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-400">
                Budapesten személyesen is találkozhatsz velünk. Előre egyeztetett időpontban
                bemutatjuk gépparkunkat, és közösen megtervezzük a következő lépéseket.
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
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d9045.343166375005!2d19.052352052227626!3d47.48954939513491!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4741dc3cea360f0f%3A0x3dce3a5fa9012576!2sBuda%20Castle!5e1!3m2!1sen!2shu!4v1758635692265!5m2!1sen!2shu"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div className="p-5 text-sm text-slate-400">
                Pontos útvonaltervet a megerősítő e-mailben küldünk.
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
