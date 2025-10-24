import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";
import Navbar from "../components/Navbar";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(null);

  const loginMutation = useMutation({
    mutationFn: (payload) => api("/auth/login", { method: "POST", body: payload }),
    onSuccess: (data) => {
      setToken(data.token);
      localStorage.setItem("gombay_admin_token", data.token);
    },
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    setToken(null);
    localStorage.removeItem("gombay_admin_token");
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto flex max-w-md flex-col gap-6 px-4 py-12">
        <div>
          <h1 className="text-3xl font-bold text-sky-900">Admin bejelentkezés</h1>
          <p className="mt-2 text-slate-600">
            Jelentkezz be az admin felület eléréséhez. A sikeres bejelentkezés után egy JSON web token kerül a
            böngésződbe, amit a későbbi admin funkciókhoz használhatsz.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <label className="block text-sm font-medium text-slate-700">
            E-mail cím
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
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
            className="mt-6 w-full rounded-md bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-red-300"
          >
            {loginMutation.isPending ? "Bejelentkezés..." : "Bejelentkezés"}
          </button>

          {loginMutation.isError ? (
            <p className="mt-4 text-sm text-red-600">{loginMutation.error.message}</p>
          ) : null}
          {token ? (
            <div className="mt-4 rounded-md bg-slate-100 p-3 text-xs text-slate-700">
              <p className="font-semibold">JSON Web Token</p>
              <p className="break-all">{token}</p>
            </div>
          ) : null}
        </form>

        <p className="text-xs text-slate-500">
          Tipp: állíts be egy <code className="rounded bg-slate-200 px-1">VITE_API_BASE</code> változót a frontenden, hogy a
          megfelelő környezethez csatlakozzon.
        </p>
      </main>
    </div>
  );
}
