import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const LEGAL_DOCUMENTS = [
  {
    title: "Impresszum",
    description: "A weboldal üzemeltetőjére és szolgáltatójára vonatkozó adatok.",
    path: "/jogi/impresszum",
  },
  {
    title: "Adatkezelési tájékoztató",
    description: "Tájékoztatás a személyes adatok kezeléséről és védelméről.",
    path: "/jogi/adatkezelesi-tajekoztato",
  },
  {
    title: "Általános használati útmutató",
    description: "A weboldal és az online ajánlatkérés használatának alapjai.",
    path: "/jogi/altalanos-hasznalati-utmutato",
  },
  {
    title: "Általános szerződési feltételek",
    description: "A szolgáltatások igénybevételének és megrendelésének feltételei.",
    path: "/jogi/altalanos-szerzodesi-feltetelek",
  },
];

export default function LegalNoticeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const previousPathRef = useRef(location.pathname);

  useEffect(() => {
    setIsOpen(true);
  }, []);

  useEffect(() => {
    const previousPath = previousPathRef.current;
    const returnedFromLegalDocument =
      previousPath.startsWith("/jogi/") && !location.pathname.startsWith("/jogi/");

    if (returnedFromLegalDocument) {
      setIsOpen(true);
    }

    previousPathRef.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  function handleAccept() {
    setIsOpen(false);
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-notice-title"
    >
      <div className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-sky-400/40 bg-slate-950 p-6 text-slate-100 shadow-[0_0_60px_rgba(14,165,233,0.2)] md:p-8">
        <p className="neon-kicker">Fontos tájékoztatás</p>
        <h2 id="legal-notice-title" className="mt-2 text-2xl font-bold text-sky-100 md:text-3xl">
          Sütik és jogi dokumentumok
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">
          A weboldal használata előtt kérjük, tekintsd át az alábbi tájékoztatókat. A folytatáshoz
          kattints az elfogadás gombra.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {LEGAL_DOCUMENTS.map((document) => (
            <Link
              to={document.path}
              onClick={() => setIsOpen(false)}
              key={document.title}
              className="block rounded-xl border border-slate-700 bg-slate-900/80 p-4 transition hover:border-cyan-300 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-300"
            >
              <h3 className="font-semibold text-sky-100">{document.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{document.description}</p>
              <span className="mt-3 inline-block text-xs font-bold uppercase tracking-wide text-cyan-300">
                Dokumentum megnyitása →
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-7 flex justify-end">
          <button
            type="button"
            onClick={handleAccept}
            className="rounded-lg border-2 border-cyan-100 bg-[#00f5d4] px-5 py-3 text-sm font-black tracking-wide text-[#00141a] shadow-[0_0_28px_rgba(0,245,212,0.8)] transition duration-200 hover:scale-[1.04] hover:bg-[#8ffff0] hover:shadow-[0_0_42px_rgba(0,245,212,1)] focus:outline-none focus:ring-4 focus:ring-cyan-200 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            Elfogadom és folytatom
          </button>
        </div>
      </div>
    </div>
  );
}
