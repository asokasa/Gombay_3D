import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigate, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { api, apiBase } from "../lib/api";

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
  const [downloadingId, setDownloadingId] = useState("");
  const [downloadError, setDownloadError] = useState("");

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
      <div className="neon-page min-h-screen">
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

  async function handleDownload(item) {
    const downloadPath = item.file?.downloadPath || `/admin/quote-requests/${item.id}/download`;

    setDownloadingId(item.id);
    setDownloadError("");

    try {
      const response = await fetch(`${apiBase}${downloadPath}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        let message = response.statusText;

        if (text) {
          try {
            message = JSON.parse(text)?.error || message;
          } catch (_error) {
            message = text;
          }
        }

        throw new Error(message || "Download failed");
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = objectUrl;
      link.download = item.file?.originalName || `quote-request-${item.id}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (error) {
      setDownloadError(error.message || "Download failed");
    } finally {
      setDownloadingId("");
    }
  }

  return (
    <div className="neon-page min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <div className="neon-panel flex flex-col justify-between gap-4 rounded-lg p-6 shadow-sm ring-1 ring-slate-200 md:flex-row md:items-center">
          <div>
            <p className="text-sm text-slate-500">Admin Dashboard</p>
            <h1 className="neon-heading text-2xl font-bold">Welcome, {admin?.name || "Admin"}</h1>
            <p className="mt-1 text-sm text-slate-600">
              Signed in as <span className="font-medium text-slate-800">{admin?.username || admin?.email}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="neon-button-secondary rounded-md px-4 py-2 font-semibold transition"
          >
            Log out
          </button>
        </div>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="neon-card rounded-lg p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Total Requests</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{quoteRequests.length}</p>
          </article>
          <article className="neon-card rounded-lg p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Account</p>
            <p className="mt-2 text-lg font-semibold text-emerald-700">Authenticated</p>
          </article>
          <article className="neon-card rounded-lg p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Latest Sync</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{formatDate(new Date().toISOString())}</p>
          </article>
        </section>

        <section className="neon-panel mt-6 rounded-lg p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-sky-900">Incoming Quote Requests</h2>
          </div>

          {quoteRequestsQuery.isError ? (
            <p className="mt-4 text-sm text-red-600">{quoteRequestsQuery.error.message}</p>
          ) : null}

          {!quoteRequestsQuery.isError && downloadError ? (
            <p className="mt-4 text-sm text-red-600">{downloadError}</p>
          ) : null}

          {!quoteRequestsQuery.isError && quoteRequests.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600">No quote requests submitted yet.</p>
          ) : null}

          <div className="mt-4 space-y-4">
            {quoteRequests.map((item) => (
              <article key={item.id} className="neon-card rounded-lg border border-slate-200 bg-slate-50 p-4">
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
                      <div className="mt-2 flex flex-wrap gap-3">
                        <a
                          href={item.file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block font-medium text-sky-700 hover:text-sky-500"
                        >
                          Open Uploaded File
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDownload(item)}
                          disabled={downloadingId === item.id}
                          className="font-medium text-emerald-700 transition hover:text-emerald-600 disabled:cursor-not-allowed disabled:text-slate-400"
                        >
                          {downloadingId === item.id ? "Downloading..." : "Download File"}
                        </button>
                      </div>
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
