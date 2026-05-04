import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section
      className="relative isolate overflow-hidden bg-cover bg-center px-4 py-16 text-white md:py-24"
      style={{ backgroundImage: "url('/background.jpg')" }}
    >
      <div className="absolute inset-0 bg-[#03050a]/78" aria-hidden="true" />
      <div
        className="absolute inset-0 opacity-60"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(0,149,255,.18) 1px, transparent 1px), linear-gradient(0deg, rgba(255,45,85,.10) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />

      <div className="relative mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.05fr_0.95fr] md:items-center">
        <div className="max-w-3xl">
          <p className="neon-kicker">Gombay 3D</p>
          <h1 className="neon-heading mt-4 text-4xl font-extrabold md:text-6xl">
            3D nyomtatás neon pontossággal
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-200 md:text-lg">
            Prototípusok, egyedi alkatrészek és kész modellek gyors gyártása sötét, precíz,
            technikai hangulatban.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/ajanlatkeres" className="neon-button px-6 py-3">
              Ajánlatkérés
            </Link>
            <a href="#features" className="neon-button-secondary px-6 py-3">
              Szolgáltatások
            </a>
          </div>
        </div>

        <div className="neon-panel overflow-hidden rounded-lg">
          <img
            src="/nagyobb_nyomtato.png"
            alt="3D nyomtató munka közben"
            className="h-72 w-full object-cover md:h-96"
          />
        </div>
      </div>
    </section>
  );
}
