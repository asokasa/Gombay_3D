import { useState } from "react";
import { Link, NavLink } from "react-router-dom";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  function handleNavigate() {
    setOpen(false);
  }

  const navLinkBase =
    "neon-nav-link block rounded-md px-4 py-3 text-sm font-semibold uppercase tracking-wide transition md:px-2 md:py-2";

  const navLinkClass = ({ isActive }) =>
    [navLinkBase, isActive ? "is-active" : ""].filter(Boolean).join(" ");

  return (
    <header className="sticky top-0 z-50 border-b border-cyan-400/25 bg-[#05070d]/90 shadow-[0_0_28px_rgba(0,149,255,0.22)] backdrop-blur-xl">
      <div className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" onClick={handleNavigate} className="flex items-center">
          <img
            src="/last_refined_cropped.png"
            alt="Gombay 3D logo"
            className="h-10 w-auto drop-shadow-[0_0_14px_rgba(0,149,255,0.75)] md:h-12"
          />
        </Link>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-cyan-400/40 bg-cyan-400/10 text-cyan-100 shadow-[0_0_16px_rgba(0,149,255,0.26)] transition hover:border-red-400/70 hover:text-red-200 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle navigation menu"
          aria-expanded={open}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-6 w-6"
          >
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 5.25h16.5m-16.5 6h16.5m-16.5 6h16.5"
              />
            )}
          </svg>
        </button>

        <nav
          className={[
            open ? "block" : "hidden",
            "absolute left-4 right-4 top-[calc(100%+0.75rem)] z-50 rounded-lg border border-cyan-400/30 bg-[#070b14]/95 p-2 shadow-[0_0_30px_rgba(0,149,255,0.28)] backdrop-blur-xl md:static md:block md:border-none md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-0",
          ].join(" ")}
        >
          <ul className="flex flex-col items-stretch gap-1 md:flex-row md:items-center md:gap-3">
            <li>
              <NavLink to="/modellek" className={navLinkClass} onClick={handleNavigate}>
                Modellek
              </NavLink>
            </li>
            <li>
              <NavLink to="/referenciak" className={navLinkClass} onClick={handleNavigate}>
                Referenciák
              </NavLink>
            </li>
            <li>
              <NavLink to="/kapcsolatok" className={navLinkClass} onClick={handleNavigate}>
                Kapcsolatok
              </NavLink>
            </li>
            <li>
              <Link
                to="/ajanlatkeres"
                className="mt-1 inline-flex w-full items-center justify-center rounded-md border border-red-400/80 bg-red-500 px-4 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-[0_0_20px_rgba(255,45,85,0.4)] transition hover:bg-red-400 md:mt-0 md:w-auto md:py-2"
                onClick={handleNavigate}
              >
                Ajánlatkérés
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
