import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function GYIK() {
  const faqs = [
    {
      question: "Mennyi idő alatt készül el a rendelés?",
      answer:
        "A rendelés elkészítési ideje általában 1–3 munkanap, a termék és a rendelés mennyiségétől függően.",
    },
    {
      question: "Milyen filamentekkel dolgoztok?",
      answer:
        "Többféle filamenttel dolgozunk, többek között PLA, PETG, ABS, TPU és egyéb műszaki alapanyagokkal.",
    },
    {
      question: "Van lehetőség egyedi 3D nyomtatásra?",
      answer:
        "Igen. Egyedi 3D modellek nyomtatását is vállaljuk. Ha van saját modelled, küldd el nekünk, és segítünk a megvalósításban.",
    },
    {
      question: "Milyen formátumban küldhetem el a 3D modellt?",
      answer:
        "A leggyakrabban használt STL, STEP és 3MF formátumokat is elfogadjuk.",
    },
    {
      question: "Van lehetőség személyes átvételre?",
      answer:
        "Igen, személyes átvételre is van lehetőség az egyeztetett időpontban.",
    },
    {
      question: "Hogyan tudok kapcsolatba lépni veletek?",
      answer:
        "A Kapcsolat oldalon található elérhetőségeinken keresztül tudsz kapcsolatba lépni velünk.",
    },
  ];

  return (
    <div className="neon-page flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-grow px-4 pt-20 pb-20">
        <div className="mx-auto max-w-4xl">
          <p className="neon-kicker">GYIK</p>

          <h1 className="neon-heading mt-3 text-4xl font-extrabold md:text-5xl">
            Gyakran ismételt kérdések
          </h1>

          <p className="mt-5 text-slate-400">
            A leggyakrabban felmerülő kérdések és válaszok.
          </p>

          <div className="mt-10 space-y-4">
            {faqs.map((faq, index) => (
              <details
                key={index}
                className="rounded-xl border border-white/10 bg-white/5 p-5"
              >
                <summary className="cursor-pointer font-semibold text-white">
                  {faq.question}
                </summary>

                <p className="mt-4 leading-7 text-slate-400">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
