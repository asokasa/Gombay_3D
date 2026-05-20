import { Outlet } from "react-router-dom";
import ParticleBackground from "./ParticleBackground";

export default function PublicSiteLayout() {
  return (
    <div className="public-particle-shell">
      <ParticleBackground />
      <div className="public-particle-content">
        <Outlet />
      </div>
    </div>
  );
}
