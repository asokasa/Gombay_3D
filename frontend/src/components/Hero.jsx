import { Link } from "react-router-dom";

export default function Hero({ logoStyle }) {
  return (
    <section className="relative isolate overflow-hidden px-4 pb-12 text-white [clip-path:inset(0)] md:pb-16">
      <img
        src="/last_refined.png"
        alt=""
        className="hero-logo-glow pointer-events-none fixed left-1/2 top-1/2 z-0 h-[22rem] w-auto max-w-none md:h-[34rem]"
        style={logoStyle}
        aria-hidden="true"
      />
      <div className="home-hero-backdrop absolute z-[1]" aria-hidden="true" />
      <div className="relative z-10 min-h-screen" aria-hidden="true" />
      <div className="relative z-10 mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.05fr_0.95fr] md:items-start">
        <div className="max-w-3xl">
          <p className="neon-kicker">Gombay 3D</p>
          <h1 className="neon-heading mt-4 text-4xl font-extrabold md:text-6xl">
            Precíz és gyors 3D nyomtatás!
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-200 md:text-lg">
            Nincs 3D nyomtatója, de szeretne valami megfoghatót csinálni?
            Alkatrészre lenne szüksége, de nem találni sehol?

          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/ajanlatkeres" className="neon-button px-6 py-3">
              Ajánlatkérés
            </Link>
          </div>
        </div>

        <div className="flex min-h-72 items-center justify-center md:min-h-96 md:translate-x-8 lg:translate-x-12">
          <img
            src="/nagyobb_nyomtato_cutout.png"
            alt="3D nyomtató munka közben"
            className="h-72 w-full object-contain drop-shadow-[0_0_28px_rgba(0,149,255,0.22)] md:h-96"
          />
        </div>
      </div>
    </section>
  );
}
