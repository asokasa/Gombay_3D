import { useState } from "react";

export default function CardImageCarousel({
  images,
  title,
  className = "aspect-square w-full",
  imageClassName = "h-full w-full object-cover",
}) {
  const imageList = (images ?? []).filter((image) => image?.src);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = imageList[activeIndex] ?? imageList[0];
  const hasMultipleImages = imageList.length > 1;

  function handleControlClick(event, nextIndex) {
    event.preventDefault();
    event.stopPropagation();
    setActiveIndex((nextIndex + imageList.length) % imageList.length);
  }

  if (!activeImage) {
    return null;
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={activeImage.src}
        alt={activeImage.alt || title}
        className={imageClassName}
        draggable="false"
      />

      {hasMultipleImages ? (
        <>
          <button
            type="button"
            onClick={(event) => handleControlClick(event, activeIndex - 1)}
            className="absolute left-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-cyan-200/60 bg-[#03050a]/75 text-lg font-bold text-cyan-50 shadow-[0_0_14px_rgba(0,149,255,0.35)] backdrop-blur transition hover:border-[#c71a3c] hover:text-red-100"
            aria-label="Előző kép"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={(event) => handleControlClick(event, activeIndex + 1)}
            className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-cyan-200/60 bg-[#03050a]/75 text-lg font-bold text-cyan-50 shadow-[0_0_14px_rgba(0,149,255,0.35)] backdrop-blur transition hover:border-[#c71a3c] hover:text-red-100"
            aria-label="Következő kép"
          >
            ›
          </button>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5" aria-hidden="true">
            {imageList.map((image, index) => (
              <span
                key={`${image.src}-${index}`}
                className={[
                  "h-1.5 rounded-full transition-all",
                  index === activeIndex
                    ? "w-5 bg-[#c71a3c] shadow-[0_0_10px_rgba(199,26,60,0.75)]"
                    : "w-1.5 bg-cyan-100/70",
                ].join(" ")}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
