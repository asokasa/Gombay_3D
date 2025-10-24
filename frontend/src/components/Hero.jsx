import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section
      className="relative isolate flex items-center justify-center bg-cover bg-center px-4 py-20 text-center"
      style={{ backgroundImage: "url('/background.jpg')" }}
    >
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl">
        <div className="mx-auto max-w-3xl rounded-3xl bg-blue/40 px-8 py-10 text-white  backdrop-blur-md  ">
          <h1 className="text-4xl font-extrabold md:text-6xl">
            Tedd kézzelfoghatóvá a gondolataidat!
          </h1>
          <p className="mt-4 text-lg text-white/90">
            Prémium minőségű 3D nyomtatás minden ötletedhez.
          </p>
          <Link
            to="/ajanlatkeres"
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-500"
          >
            Ajánlatkérés
          </Link>
        </div>
      </div>
    </section>
  );
}
