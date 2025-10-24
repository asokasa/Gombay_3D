import { useState } from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  function handleNavigate() {
    setOpen(false);
  }
  return (
    <header className="bg-white  border-b border-sky-100">
      <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
        <Link to="/" onClick={handleNavigate} className="text-2xl font-bold text-sky-600">
          <img
            src="/Logo_hatter_nelkul.webp"
            alt="Peti 3D nyomtatás logó"
            className="h-10 w-auto md:h-12"
          />
        </Link>
        <button
          className="md:hidden text-sky-800"
          onClick={() => setOpen(!open)}
          aria-label="Toggle navigation"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-6 w-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 5.25h16.5m-16.5 6h16.5m-16.5 6h16.5"
            />
          </svg>
        </button>
        <nav
          className={[
            open ? "block" : "hidden",
            "absolute left-0 right-0 top-full border-b border-sky-100 bg-white md:static md:block md:border-none",
          ].join(" ")}
        >
          <ul className="flex flex-col items-center gap-4 p-4 md:flex-row md:gap-6 md:p-0">
            <li>
              <a
                href="#features"
                className="text-sky-800 hover:text-red-500"
                onClick={handleNavigate}
              >
                Szolgáltatások
              </a>
            </li>
            <li>
              <Link
                to="/kapcsolatok"
                className="text-sky-800 hover:text-red-500"
                onClick={handleNavigate}
              >
                Kapcsolatok
              </Link>
            </li>
            <li>
              <Link
                to="/ajanlatkeres"
                className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-500"
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
