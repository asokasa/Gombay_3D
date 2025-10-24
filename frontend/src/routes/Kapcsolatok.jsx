import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const contacts = [
  {
    title: "Ügyfélszolgálat",
    description: "Segítünk eligazodni a szolgáltatásaink és a rendelés folyamata között.",
    phone: "+36 30 123 4567",
    email: "hello@peti3d.hu",
    hours: "Hétfő–Péntek: 9:00 – 17:00",
  },
  {
    title: "Technikai támogatás",
    description:
      "Ha a 3D nyomtatási fájlokkal vagy gyártással kapcsolatban van kérdésed, vedd fel velünk a kapcsolatot.",
    phone: "+36 70 765 4321",
    email: "support@peti3d.hu",
    hours: "Hétfő–Péntek: 8:00 – 18:00",
  },
  {
    title: "Egyedi projektek",
    description:
      "Kutatási vagy ipari projektedhez keresel partnert? Projektvezetőnk szívesen egyeztet veled.",
    phone: "+36 1 445 9988",
    email: "projektek@peti3d.hu",
    hours: "Hétfő–Csütörtök: 10:00 – 16:00",
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
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />
      <main className="flex-grow">
        <section className="bg-gradient-to-r from-sky-900 via-sky-700 to-sky-500 text-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-16 md:flex-row md:items-center">
            <div className="md:w-2/3">
              <p className="text-sm uppercase tracking-widest text-white/80">Kapcsolat</p>
              <h1 className="mt-2 text-4xl font-extrabold md:text-5xl">
                Beszélgessünk az ötletedről!
              </h1>
              <p className="mt-4 max-w-2xl text-base text-white/90 md:text-lg">
                Akár első 3D nyomtatásodban segítünk, akár sorozatgyártásra keresel megbízható
                partnert, csapatunk készen áll válaszolni minden kérdésedre. Válassz az
                elérhetőségeink közül, vagy látogass el valamelyik irodánkba személyes
                konzultációra.
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-lg md:w-1/3">
              <h2 className="text-xl font-semibold">Azonnali elérés</h2>
              <div className="mt-4 space-y-4 text-sm text-white/90">
                <p>
                  <span className="font-semibold">Telefon:</span> +36 80 123 123
                </p>
                <p>
                  <span className="font-semibold">E-mail:</span> kapcsolat@peti3d.hu
                </p>
                <p>
                  <span className="font-semibold">Nyitvatartás:</span> Hétfő–Péntek 8:00 – 18:00
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <h2 className="text-2xl font-semibold text-sky-900">Kapcsolattartó csapataink</h2>
            <p className="mt-3 text-sm text-slate-600">
              Válaszd ki a számodra megfelelő csapatot, és mi 24 órán belül visszajelzünk.
            </p>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {contacts.map((contact) => (
                <article
                  key={contact.title}
                  className="flex h-full flex-col rounded-2xl border border-sky-100 bg-white p-6 shadow-sm"
                >
                  <h3 className="text-lg font-semibold text-sky-900">{contact.title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">
                    {contact.description}
                  </p>
                  <dl className="mt-4 space-y-2 text-sm text-slate-700">
                    <div>
                      <dt className="font-medium text-slate-500">Telefon</dt>
                      <dd className="text-sky-800">{contact.phone}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-500">E-mail</dt>
                      <dd className="text-sky-800">{contact.email}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-500">Elérhetőség</dt>
                      <dd>{contact.hours}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-100">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="grid gap-10 md:grid-cols-2 md:items-center">
              <div>
                <h2 className="text-2xl font-semibold text-sky-900">Irodáink és műhelyeink</h2>
                <p className="mt-4 text-sm leading-relaxed text-slate-600">
                  Budapesten találkozhatsz velünk személyesen. Előre egyeztetett időpontban örömmel
                  bemutatjuk gépparkunkat, és közösen megtervezzük a következő lépéseket.
                </p>
                <ul className="mt-6 space-y-4">
                  {offices.map((office) => (
                    <li
                      key={office.city}
                      className="rounded-xl border border-sky-100 bg-white p-5 shadow-sm"
                    >
                      <h3 className="text-lg font-semibold text-sky-900">{office.city}</h3>
                      <p className="mt-1 text-sm text-slate-600">{office.address}</p>
                      <p className="mt-2 text-sm text-sky-800">Telefon: {office.phone}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-lg">
                <div className="relative aspect-video w-full bg-slate-200">
                  <iframe
                    title="Peti3D - Térkép"
                    className="absolute inset-0 h-full w-full"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d9045.343166375005!2d19.052352052227626!3d47.48954939513491!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4741dc3cea360f0f%3A0x3dce3a5fa9012576!2sBuda%20Castle!5e1!3m2!1sen!2shu!4v1758635692265!5m2!1sen!2shu"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
                <div className="p-6 text-sm text-slate-600">
                  Pontos útvonaltervet a megerősítő e-mailben küldünk…
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
