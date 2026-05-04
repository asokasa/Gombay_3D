import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const galleryImages = [
  {
    src: "/background.jpg",
    alt: "3D nyomtatott referencia",
  },
  {
    src: "/nagyobb_nyomtato.png",
    alt: "3D nyomtatási referencia",
  },
  {
    src: "/Nyomtatok/Bambulab A1mini.webp",
    alt: "3D nyomtatási referencia",
  },
  {
    src: "/Nyomtatok/nagyobb_nyomtato.webp",
    alt: "3D nyomtatási referencia",
  },
];

export default function Referenciak() {
  return (
    <div className="neon-page flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-grow px-4 py-14 md:py-20">
        <section className="mx-auto max-w-6xl">
          <p className="neon-kicker">Referenciák</p>
          <h1 className="neon-heading mt-3 text-4xl font-extrabold md:text-5xl">
            Elkészült munkák neon fényben
          </h1>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {galleryImages.map((image) => (
              <figure key={image.src} className="neon-card overflow-hidden">
                <img src={image.src} alt={image.alt} className="aspect-square w-full object-cover" />
              </figure>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
