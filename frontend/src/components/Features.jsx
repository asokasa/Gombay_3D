const features = [
  {
    title: "Gyors kivitelezés",
    text: "XY gépeiink a legjobbak a bizniszben.",
    img: "https://via.placeholder.com/400x300?text=Prototyping",
  },
  {
    title: "Egyedi alkatrészek",
    text: "Akár egy vagy több darabról van szó.",
    img: "https://via.placeholder.com/400x300?text=Custom+Parts",
  },
  {
    title: "Ingyenes online kalkulátor",
    text: "Nem kell napokat várnod hogy megtudd mi mennyibe kerül.",
    img: "https://via.placeholder.com/400x300?text=Store",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-16 bg-white">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-3xl font-bold text-sky-900 text-center mb-12">Amit kínálunk</h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-lg border border-sky-100 bg-sky-50 p-4 shadow-sm">
              <img src={f.img} alt="" className="h-40 w-full rounded-md object-cover" />
              <h3 className="mt-4 text-xl font-semibold text-sky-800">{f.title}</h3>
              <p className="mt-2 text-sky-700">{f.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
