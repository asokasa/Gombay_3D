import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { buildReferenceImageList } from "../lib/referenceImages";

const VISIBLE_REFERENCE_COUNT = 3;
const ROTATION_INTERVAL_MS = 5000;

export default function LatestReferencesCarousel({ logoStyle }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const referenceImagesQuery = useQuery({
    queryKey: ["reference-images"],
    queryFn: () => api("/reference-images"),
    retry: false,
  });

  const latestReferences = useMemo(
    () => buildReferenceImageList(referenceImagesQuery.data?.items ?? [], { limit: 5 }),
    [referenceImagesQuery.data?.items],
  );
  const shouldSlide = latestReferences.length > VISIBLE_REFERENCE_COUNT;
  const activeIndicatorIndex = latestReferences.length > 0 ? activeIndex % latestReferences.length : 0;

  const carouselItems = useMemo(
    () =>
      shouldSlide
        ? [...latestReferences, ...latestReferences.slice(0, VISIBLE_REFERENCE_COUNT)]
        : latestReferences,
    [latestReferences, shouldSlide],
  );

  useEffect(() => {
    setActiveIndex(0);
    setTransitionEnabled(false);
  }, [latestReferences.length]);

  useEffect(() => {
    if (transitionEnabled) {
      return undefined;
    }

    let secondFrameId;
    const firstFrameId = window.requestAnimationFrame(() => {
      secondFrameId = window.requestAnimationFrame(() => {
        setTransitionEnabled(true);
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrameId);
      window.cancelAnimationFrame(secondFrameId);
    };
  }, [transitionEnabled]);

  useEffect(() => {
    if (!shouldSlide) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setTransitionEnabled(true);
      setActiveIndex((currentIndex) => currentIndex + 1);
    }, ROTATION_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [latestReferences.length, shouldSlide]);

  function handleTrackTransitionEnd(event) {
    if (event.propertyName !== "transform" || !shouldSlide || activeIndex < latestReferences.length) {
      return;
    }

    setTransitionEnabled(false);
    setActiveIndex(0);
  }

  return (
    <section className="relative isolate overflow-hidden px-4 pt-12 pb-16 [clip-path:inset(0)] md:pt-12 md:pb-24">
      <img
        src="/last_refined.png"
        alt=""
        className="hero-logo-glow pointer-events-none fixed left-1/2 top-1/2 z-0 h-[22rem] w-auto max-w-none md:h-[34rem]"
        style={logoStyle}
        aria-hidden="true"
      />
      <div className="home-section-backdrop absolute inset-0 z-[1]" aria-hidden="true" />
      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="neon-kicker">Referenciák</p>
            <h2 className="neon-heading mt-2 text-3xl font-bold md:text-4xl">Legfrissebb munkák</h2>
          </div>
          <Link to="/referenciak" className="neon-button-secondary w-fit px-5 py-3 text-sm">
            Összes referencia
          </Link>
        </div>

        {referenceImagesQuery.isLoading ? (
          <p className="mb-5 text-sm text-slate-500">Referenciák betöltése...</p>
        ) : null}

        <div className="overflow-hidden">
          <div
            className={[
              "flex",
              transitionEnabled ? "transition-transform duration-700 ease-out" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{ transform: `translateX(-${activeIndex * (100 / VISIBLE_REFERENCE_COUNT)}%)` }}
            onTransitionEnd={handleTrackTransitionEnd}
          >
            {carouselItems.map((reference, index) => (
              <div key={`${reference.id ?? reference.src}-${index}`} className="shrink-0 basis-1/3 px-2.5">
                <figure className="neon-card h-full overflow-hidden">
                  <img src={reference.src} alt={reference.title} className="aspect-square w-full object-cover" />
                  <figcaption className="p-4 text-sm font-semibold text-sky-100">{reference.title}</figcaption>
                </figure>
              </div>
            ))}
          </div>
        </div>

        {shouldSlide ? (
          <div className="mt-6 flex justify-center gap-2" aria-hidden="true">
            {latestReferences.map((reference, index) => (
              <span
                key={reference.id ?? reference.src}
                className={[
                  "h-2 rounded-full transition-all duration-300",
                  index === activeIndicatorIndex
                    ? "w-8 bg-[#c71a3c] shadow-[0_0_14px_rgba(199,26,60,0.7)]"
                    : "w-2 bg-slate-600",
                ]
                  .filter(Boolean)
                  .join(" ")}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
