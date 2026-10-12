import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const faqItems = [
  {
    question: "1. Kérdés helye",
    answer: "Ide írd majd be az első kérdésre a választ.",
  },
  {
    question: "2. Kérdés helye",
    answer: "Ide írd majd be a második kérdésre a választ.",
  },
  {
    question: "3. Kérdés helye",
    answer: "Ide írd majd be a harmadik kérdésre a választ.",
  },
  {
    question: "4. Kérdés helye",
    answer: "Ide írd majd be a negyedik kérdésre a választ.",
  },
  {
    question: "5. Kérdés helye",
    answer: "Ide írd majd be az ötödik kérdésre a választ.",
  },
  {
    question: "6. Kérdés helye",
    answer: "Ide írd majd be a hatodik kérdésre a választ.",
  },
  {
    question: "7. Kérdés helye",
    answer: "Ide írd majd be a hetedik kérdésre a választ.",
  },
  {
    question: "8. Kérdés helye",
    answer: "Ide írd majd be a nyolcadik kérdésre a választ.",
  },
  {
    question: "9. Kérdés helye",
    answer: "Ide írd majd be a kilencedik kérdésre a választ.",
  },
  {
    question: "10. Kérdés helye",
    answer: "Ide írd majd be a tizedik kérdésre a választ.",
  },
];

export default function GYIK() {
  const [openItems, setOpenItems] = useState([]);

  const toggleItem = (index) => {
    setOpenItems((previous) =>
      previous.includes(index)
        ? previous.filter((item) => item !== index)
        : [...previous, index]
    );
  };

  return (
    <div className="neon-page flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-grow">
        <section className="px-4 pt-14 pb-12 md:pt-20 md:pb-12">
          <div className="mx-auto max-w-4xl">
            <p className="neon-kicker">GYIK</p>

            <h1 className="neon-heading mt-3 text-4xl font-extrabold md:text-5xl">
              Gyakran ismételt kérdések
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-400 md:text-lg">
              Itt megtalálod a leggyakoribb kérdésekre adott válaszokat.
              Ha valamit nem találsz, vedd fel velünk a kapcsolatot!
            </p>
          </div>
        </section>

        <div
          className="home-blur-divider mx-auto mb-12 w-3/4 rounded-full"
          aria-hidden="true"
        />

        <section className="px-4 pb-16 md:pb-20">
          <div className="mx-auto max-w-4xl space-y-4">
            {faqItems.map((item, index) => {
              const isOpen = openItems.includes(index);

              return (
                <div
                  key={index}
                  className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]"
                >
                  <button
                    type="button"
                    onClick={() => toggleItem(index)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-white/[0.04]"
                  >
                    <span className="font-semibold text-white">
                      {item.question}
                    </span>

                    <span className="text-xl text-slate-400">
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="border-t border-white/10 px-5 py-4">
                      <p className="whitespace-pre-line text-sm leading-relaxed text-slate-400 md:text-base">
                        {item.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
