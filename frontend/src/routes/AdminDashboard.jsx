import { useQuery } from "@tanstack/react-query";
import { Navigate, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { api } from "../lib/api";

function formatCurrency(value) {
  if (!Number.isFinite(Number(value))) {
    return "n/a";
  }
  return new Intl.NumberFormat("hu-HU", {
    style: "currency",
    currency: "HUF",
    maximumFractionDigits: 0,
  }).format(Math.round(Number(value)));
}

function formatDate(value) {
  if (!value) {
    return "n/a";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "n/a";
  }
  return new Intl.DateTimeFormat("hu-HU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function formatSizeMb(sizeBytes) {
  if (!Number.isFinite(Number(sizeBytes))) {
    return "n/a";
  }
  return `${(Number(sizeBytes) / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDimensions(values) {
  if (!Array.isArray(values) || values.length === 0) {
    return "n/a";
  }
  return values
    .map((value) => `${Number(value).toFixed(2)} cm`)
    .join(" x ");
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("gombay_admin_token");

  const meQuery = useQuery({
    queryKey: ["admin", "me", token],
    queryFn: () => api("/auth/me", { token }),
    enabled: Boolean(token),
    retry: false,
  });

  const quoteRequestsQuery = useQuery({
    queryKey: ["admin", "quote-requests", token],
    queryFn: () => api("/admin/quote-requests", { token }),
    enabled: Boolean(token && meQuery.isSuccess),
    retry: false,
  });

  if (!token) {
    return <Navigate to="/admin" replace />;
  }

  if (meQuery.isError) {
    localStorage.removeItem("gombay_admin_token");
    return <Navigate to="/admin" replace />;
  }

  const isLoading = meQuery.isLoading || quoteRequestsQuery.isLoading;
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-12">
          <p className="text-slate-600">Loading dashboard...</p>
        </main>
      </div>
    );
  }

  const admin = meQuery.data?.admin;
  const quoteRequests = quoteRequestsQuery.data?.items ?? [];

  function handleLogout() {
    localStorage.removeItem("gombay_admin_token");
    navigate("/admin", { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-col justify-between gap-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:flex-row md:items-center">
          <div>
            <p className="text-sm text-slate-500">Admin Dashboard</p>
            <h1 className="text-2xl font-bold text-sky-900">Welcome, {admin?.name || "Admin"}</h1>
            <p className="mt-1 text-sm text-slate-600">
              Signed in as <span className="font-medium text-slate-800">{admin?.username || admin?.email}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md bg-slate-800 px-4 py-2 font-semibold text-white transition hover:bg-slate-700"
          >
            Log out
          </button>
        </div>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Total Requests</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{quoteRequests.length}</p>
          </article>
          <article className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Account</p>
            <p className="mt-2 text-lg font-semibold text-emerald-700">Authenticated</p>
          </article>
          <article className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Latest Sync</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{formatDate(new Date().toISOString())}</p>
          </article>
        </section>

        <section className="mt-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-sky-900">Incoming Quote Requests</h2>
          </div>

          {quoteRequestsQuery.isError ? (
            <p className="mt-4 text-sm text-red-600">{quoteRequestsQuery.error.message}</p>
          ) : null}

          {!quoteRequestsQuery.isError && quoteRequests.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600">No quote requests submitted yet.</p>
          ) : null}

          <div className="mt-4 space-y-4">
            {quoteRequests.map((item) => (
              <article key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{item.customer?.name || "Unnamed"}</h3>
                    <p className="text-sm text-slate-600">{item.customer?.email || "n/a"}</p>
                    <p className="text-sm text-slate-600">{item.customer?.address || "n/a"}</p>
                    {item.customer?.message ? (
                      <p className="mt-2 text-sm text-slate-700">
                        <span className="font-medium">Message:</span> {item.customer.message}
                      </p>
                    ) : null}
                  </div>
                  <div className="text-sm text-slate-600">
                    <p>
                      <span className="font-medium">Submitted:</span> {formatDate(item.createdAt)}
                    </p>
                    <p>
                      <span className="font-medium">Material:</span> {item.material?.label || "n/a"}
                    </p>
                    <p>
                      <span className="font-medium">Estimated Total:</span> {formatCurrency(item.quote?.total)}
                    </p>
                    <p>
                      <span className="font-medium">Scaled Size:</span>{" "}
                      {formatDimensions(item.scaledSizeCm || item.analysis?.sizeCm)}
                    </p>
                    <p>
                      <span className="font-medium">File Size:</span> {formatSizeMb(item.file?.sizeBytes)}
                    </p>
                    {item.file?.url ? (
                      <a
                        href={item.file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block font-medium text-sky-700 hover:text-sky-500"
                      >
                        Open Uploaded File
                      </a>
                    ) : null}
                  </div>
                </div>
                <details className="mt-3 rounded-md bg-white p-3 text-xs text-slate-700">
                  <summary className="cursor-pointer font-semibold text-slate-800">
                    Full technical details
                  </summary>
                  <pre className="mt-2 overflow-auto whitespace-pre-wrap break-words">
                    {JSON.stringify(
                      {
                        id: item.id,
                        customer: item.customer,
                        material: item.material,
                        unitOverride: item.unitOverride,
                        detectedUnitLabel: item.detectedUnitLabel,
                        scaledSizeCm: item.scaledSizeCm,
                        file: item.file,
                        analysis: item.analysis,
                        quote: item.quote,
                        status: item.status,
                        createdAt: item.createdAt,
                        updatedAt: item.updatedAt,
                      },
                      null,
                      2,
                    )}
                  </pre>
                </details>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
