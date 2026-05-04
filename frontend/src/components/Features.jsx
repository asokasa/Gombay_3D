const features = [
  {
    title: "Gyors kivitelezés",
    text: "Rövid átfutás prototípusokhoz, javításokhoz és egyedi darabokhoz.",
    img: "/Nyomtatok/Bambulab A1mini.webp",
  },
  {
    title: "Egyedi alkatrészek",
    text: "Kis szériás gyártás, méretre igazítás és használatra kész tárgyak.",
    img: "/nagyobb_nyomtato.png",
  },
  {
    title: "Online kalkulátor",
    text: "Fájlfeltöltés, modell-ellenőrzés és becsült ár egy helyen.",
    img: "/background.jpg",
  },
  {
    title: "Kész modellek",
    text: "Választható modellek ajándékhoz, irodához, műhelyhez vagy teszthez.",
    img: "/Nyomtatok/nagyobb_nyomtato.webp",
  },
];

export default function Features() {
  return (
    <section id="features" className="bg-[#03050a] py-14 md:py-20">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
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
              <img src={feature.img} alt="" className="h-40 w-full object-cover" />
              <div className="flex flex-1 flex-col p-5">
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
