import { Link, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const DOCUMENTS = {
  impresszum: {
    title: "Impresszum",
    description: "A weboldal üzemeltetőjére és szolgáltatójára vonatkozó adatok.",
  },
  "adatkezelesi-tajekoztato": {
    title: "Adatkezelési tájékoztató",
    description: "Tájékoztatás a személyes adatok kezeléséről és védelméről.",
  },
  "altalanos-hasznalati-utmutato": {
    title: "Általános használati útmutató",
    description: "A weboldal és az online ajánlatkérés használatának alapjai.",
  },
  "altalanos-szerzodesi-feltetelek": {
    title: "Általános szerződési feltételek",
    description: "A szolgáltatások igénybevételének és megrendelésének feltételei.",
  },
};

export default function LegalDocument() {
  const { documentKey } = useParams();
  const document = DOCUMENTS[documentKey];

  if (!document) {
    return (
      <div className="neon-page flex min-h-screen flex-col">
        <Navbar />
        <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-4 py-16">
          <h1 className="neon-heading text-4xl font-extrabold">Dokumentum nem található</h1>
          <Link to="/" className="mt-6 font-semibold text-cyan-300 hover:text-cyan-200">
            Vissza a főoldalra
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="neon-page flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 px-4 py-14 md:py-20">
        <article className="neon-panel mx-auto max-w-4xl rounded-2xl p-6 md:p-10">
          <p className="neon-kicker">Jogi dokumentum</p>
          <h1 className="neon-heading mt-3 text-4xl font-extrabold md:text-5xl">
            {document.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
            {document.description}
          </p>
          <Link
            to="/"
            className="mt-8 inline-flex rounded-lg border border-cyan-300/60 px-4 py-2 text-sm font-bold text-cyan-200 transition hover:bg-cyan-300/10"
          >
            Vissza a főoldalra
          </Link>
        </article>
      </main>
      <Footer />
    </div>
  );
}
