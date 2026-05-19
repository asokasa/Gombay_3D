import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden px-4 pb-12 text-white [clip-path:inset(0)] md:pb-16">
      <div className="absolute inset-0 z-0 bg-[#03050a]/78" aria-hidden="true" />
      <img
        src="/last_refined.png"
        alt=""
        className="hero-logo-glow pointer-events-none fixed left-1/2 top-1/2 z-0 h-[22rem] w-auto max-w-none -translate-x-1/2 -translate-y-1/2 md:h-[34rem]"
        aria-hidden="true"
      />
      <div className="relative z-10 min-h-screen" aria-hidden="true" />
      <div className="relative z-10 mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.05fr_0.95fr] md:items-start">
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
