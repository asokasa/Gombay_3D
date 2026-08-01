import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import LatestReferencesCarousel from "../components/LatestReferencesCarousel";
import Footer from "../components/Footer";

export default function Home() {
  const [logoFadeProgress, setLogoFadeProgress] = useState(0);

  useEffect(() => {
    function updateLogoFadeProgress() {
      const fadeDistance = Math.max(window.innerHeight * 1.15, 720);
      const progress = Math.min(1, Math.max(0, window.scrollY / fadeDistance));
      setLogoFadeProgress(progress);
    }

    updateLogoFadeProgress();
    window.addEventListener("scroll", updateLogoFadeProgress, { passive: true });
    window.addEventListener("resize", updateLogoFadeProgress);

    return () => {
      window.removeEventListener("scroll", updateLogoFadeProgress);
      window.removeEventListener("resize", updateLogoFadeProgress);
    };
  }, []);

  const logoStyle = useMemo(
    () => ({
      "--hero-logo-scale": 1 - logoFadeProgress * 0.68,
      "--hero-logo-opacity": 1 - logoFadeProgress,
    }),
    [logoFadeProgress],
  );

  return (
    <div className="neon-page flex min-h-screen flex-col">
      <Navbar overlay hideBrandUntilScrolled />
      <main className="flex-grow">
        <Hero logoStyle={logoStyle} />
        <div className="home-blur-divider mx-auto w-3/4 rounded-full" aria-hidden="true" />
        <LatestReferencesCarousel logoStyle={logoStyle} />
        <div className="home-blur-divider mx-auto w-3/4 rounded-full" aria-hidden="true" />
        <Features logoStyle={logoStyle} />
      </main>
      <Footer />
    </div>
  );
}
