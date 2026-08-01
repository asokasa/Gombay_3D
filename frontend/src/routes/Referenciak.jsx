import { useQuery } from "@tanstack/react-query";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CardImageCarousel from "../components/CardImageCarousel";
import { api } from "../lib/api";
import { buildReferenceImageList } from "../lib/referenceImages";

export default function Referenciak() {
  const referenceImagesQuery = useQuery({
    queryKey: ["reference-images"],
    queryFn: () => api("/reference-images"),
    retry: false,
  });
  const galleryImages = buildReferenceImageList(referenceImagesQuery.data?.items ?? []);

  return (
    <div className="neon-page flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-grow px-4 py-14 md:py-20">
        <section className="mx-auto max-w-6xl">
          <p className="neon-kicker">Referenciák</p>
          <h1 className="neon-heading mt-3 text-4xl font-extrabold md:text-5xl">
            Elkészült munkák
          </h1>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {galleryImages.map((image) => (
              <figure key={image.src} className="neon-card overflow-hidden">
                <CardImageCarousel
                  images={image.images}
                  title={image.title}
                  className="mx-auto aspect-[4/3] w-full max-w-[22rem]"
                  imageWidth={480}
                  imageQuality="auto:eco"
                />
                <figcaption className="p-4 text-center text-lg font-semibold text-sky-100">
                  {image.title}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
