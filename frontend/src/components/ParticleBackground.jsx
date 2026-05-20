import { useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

let particlesEngineInitPromise;

const particleOptions = {
  key: "basic",
  name: "Basic",
  fullScreen: {
    enable: false,
  },
  fpsLimit: 60,
  particles: {
    number: {
      value: 80,
      density: {
        enable: true,
      },
    },
    color: {
      value: "#76CEF7",
      animation: {
        enable: false,
        speed: 20,
        sync: true,
      },
    },
    shape: {
      type: "circle",
    },
    opacity: {
      value: 0.5,
    },
    size: {
      value: {
        min: 1,
        max: 3,
      },
    },
    links: {
      enable: true,
      distance: 150,
      color: "#76CEF7",
      opacity: 0.4,
      width: 1,
    },
    move: {
      enable: true,
      speed: 1.5,
    },
  },
  interactivity: {
    events: {
      onHover: {
        enable: true,
        mode: "repulse",
      },
      onClick: {
        enable: true,
        mode: "push",
      },
      resize: true,
    },
    modes: {
      repulse: {
        distance: 200,
      },
      push: {
        quantity: 4,
      },
    },
  },
  background: {
    color: {
      value: "transparent",
    },
    opacity: 0,
  },
  detectRetina: true,
};

export default function ParticleBackground() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    initParticlesEngine((engine) => {
      particlesEngineInitPromise ??= loadSlim(engine);
      return particlesEngineInitPromise;
    }).then(() => {
      if (!cancelled) {
        setIsReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!isReady) {
    return null;
  }

  return <Particles id="site-particles" className="site-particles" options={particleOptions} />;
}
