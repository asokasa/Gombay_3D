import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";

export default function Navbar({ overlay = false, hideBrandUntilScrolled = false }) {
  const [open, setOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 24);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function handleNavigate() {
    setOpen(false);
  }

  const navLinkBase = "neon-nav-link text-sm font-semibold uppercase tracking-wide";

  const navLinkClass = ({ isActive }) =>
    [navLinkBase, isActive ? "is-active" : ""].filter(Boolean).join(" ");

  return (
    <>
      <header
        className={[
          "site-navbar",
          isScrolled ? "is-scrolled" : "",
          hideBrandUntilScrolled ? "hide-brand-until-scrolled" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="site-navbar-inner">
          <Link to="/" onClick={handleNavigate} className="site-navbar-brand flex items-center">
            <img
              src="/last_refined_cropped.png"
              alt="Gombay 3D logo"
              className="h-10 w-auto drop-shadow-[0_0_14px_rgba(0,149,255,0.75)] md:h-12"
            />
          </Link>

          <button
            type="button"
            className="site-navbar-toggle inline-flex h-11 w-11 items-center justify-center rounded-md border border-cyan-400/40 bg-cyan-400/10 text-cyan-100 shadow-[0_0_16px_rgba(0,149,255,0.26)] transition hover:border-red-400/70 hover:text-red-200 md:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Toggle navigation menu"
            aria-expanded={open}
            aria-controls="primary-navigation"
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
            id="primary-navigation"
            aria-label="Primary navigation"
            className={["site-navbar-nav", open ? "is-open" : ""].filter(Boolean).join(" ")}
          >
            <ul className="flex flex-col items-stretch gap-1 md:flex-row md:items-center md:gap-3">
              <li>
                <NavLink to="/modellek" className={navLinkClass} onClick={handleNavigate}>
                  Modellek
                </NavLink>
              </li>
              <li>
                <NavLink to="/gyik" className={navLinkClass} onClick={handleNavigate}>
                  GYIK
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
      {!overlay ? <div className="site-navbar-spacer" aria-hidden="true" /> : null}
    </>
  );
}
