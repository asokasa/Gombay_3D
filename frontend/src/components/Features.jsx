const features = [
  {
    title: "Gyors kivitelezés",
    text: "Rövid átfutás prototípusokhoz, javításokhoz és egyedi darabokhoz.",
    img: "/Gyors_kivitelezés.png",
  },
  {
    title: "Egyedi alkatrészek",
    text: "Kis szériás gyártás, méretre igazítás és használatra kész tárgyak.",
    img: "/Egyedi__alkatrészek_cutout.png",
  },
  {
    title: "Online kalkulátor",
    text: "Fájlfeltöltés, modell-ellenőrzés és becsült ár egy helyen.",
    img: "/Online_kalkulator.png",
  },
  {
    title: "Kész modellek",
    text: "Választható modellek ajándékhoz, irodához, műhelyhez vagy teszthez.",
    img: "/Kesz_modellek.png",
  },
];

export default function Features({ logoStyle }) {
  return (
    <section
      id="features"
      className="relative isolate overflow-hidden pt-12 pb-14 [clip-path:inset(0)] md:pt-12 md:pb-20"
    >
      <img
        src="/last_refined.png"
        alt=""
        className="hero-logo-glow pointer-events-none fixed left-1/2 top-1/2 z-0 h-[22rem] w-auto max-w-none md:h-[34rem]"
        style={logoStyle}
        aria-hidden="true"
      />
      <div className="home-section-backdrop absolute inset-0 z-[1]" aria-hidden="true" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="neon-kicker">Szolgáltatások</p>
            <h2 className="neon-heading mt-2 text-3xl font-bold md:text-4xl">Amit kínálunk</h2>
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-slate-400">
            Precíz, gyors és átlátható 3D nyomtatás ötlettől az elkészült tárgyig.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <article key={feature.title} className="neon-card flex h-full flex-col overflow-hidden">
              <div className="flex aspect-square w-full items-center justify-center bg-[#050812] p-3">
                <img src={feature.img} alt="" className="h-full w-full object-contain" />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h3 className="text-lg font-semibold text-sky-100">{feature.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-400">{feature.text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
