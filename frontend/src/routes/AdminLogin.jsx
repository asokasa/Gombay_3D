import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Navigate, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import Navbar from "../components/Navbar";

const LOGIN_ERROR_MESSAGES = {
  "Invalid email or password": "Hibás e-mail, felhasználónév vagy jelszó.",
  "Failed to fetch": "Nem sikerült kapcsolódni a szerverhez.",
};

function formatLoginError(error) {
  const message = error?.message;
  return LOGIN_ERROR_MESSAGES[message] || "Nem sikerült belépni. Ellenőrizd az adatokat.";
}

export default function AdminLogin() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(null);
  const existingToken = localStorage.getItem("gombay_admin_token");

  const loginMutation = useMutation({
    mutationFn: (payload) => api("/auth/login", { method: "POST", body: payload }),
    onSuccess: (data) => {
      setToken(data.token);
      localStorage.setItem("gombay_admin_token", data.token);
      navigate("/admin/dashboard", { replace: true });
    },
  });

  if (existingToken) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    setToken(null);
    localStorage.removeItem("gombay_admin_token");
    loginMutation.mutate({ identifier, password });
  };

  return (
    <div className="neon-page min-h-screen">
      <Navbar />
      <main className="mx-auto flex max-w-md flex-col gap-6 px-4 py-12">
        <div>
          <h1 className="neon-heading text-3xl font-bold">Admin belépés</h1>
          <p className="mt-2 text-slate-600">
            Jelentkezz be az admin felület használatához. Sikeres belépés után a böngésző
            eltárolja a jogosultsági tokent a további admin műveletekhez.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="neon-panel rounded-lg p-6 shadow-sm ring-1 ring-slate-200">
          <label className="block text-sm font-medium text-slate-700">
            Felhasználónév vagy e-mail
            <input
              type="text"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </label>

          <label className="mt-4 block text-sm font-medium text-slate-700">
            Jelszó
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </label>

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="neon-button mt-6 w-full px-4 py-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loginMutation.isPending ? "Belépés..." : "Belépés"}
          </button>

          {loginMutation.isError ? (
            <p className="mt-4 text-sm text-red-600">{formatLoginError(loginMutation.error)}</p>
          ) : null}
          {token ? (
            <div className="mt-4 rounded-md bg-slate-100 p-3 text-xs text-slate-700">
              <p className="font-semibold">Belépési token</p>
              <p className="break-all">{token}</p>
            </div>
          ) : null}
        </form>

        <p className="text-xs text-slate-500">
          Tipp: állítsd be a <code className="rounded bg-slate-200 px-1">VITE_API_BASE</code>{" "}
          változót a frontend környezetben, ha másik backend címet szeretnél használni.
        </p>
      </main>
    </div>
  );
}
