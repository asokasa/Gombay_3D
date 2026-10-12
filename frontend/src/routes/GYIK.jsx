import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function GYIK() {
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
            Ez a GYIK oldal.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
