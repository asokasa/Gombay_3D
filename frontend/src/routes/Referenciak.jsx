import { useQuery } from "@tanstack/react-query";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { api } from "../lib/api";

const fallbackGalleryImages = [
  {
    src: "/background.jpg",
    title: "3D nyomtatott referencia",
  },
  {
    src: "/nagyobb_nyomtato.png",
    title: "3D nyomtatási referencia",
  },
  {
    src: "/Nyomtatok/Bambulab A1mini.webp",
    title: "Bambulab referencia",
  },
  {
    src: "/Nyomtatok/nagyobb_nyomtato.webp",
    title: "Nagyobb nyomtató referencia",
  },
];

export default function Referenciak() {
  const referenceImagesQuery = useQuery({
    queryKey: ["reference-images"],
    queryFn: () => api("/reference-images"),
    retry: false,
  });
  const uploadedImages = referenceImagesQuery.data?.items ?? [];
  const galleryImages =
    uploadedImages.length > 0
      ? uploadedImages.map((item) => ({
          src: item.image?.url,
          title: item.title,
        }))
      : fallbackGalleryImages;

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
                <img src={image.src} alt={image.title} className="aspect-square w-full object-cover" />
                <figcaption className="p-4 text-sm font-semibold text-sky-100">{image.title}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
