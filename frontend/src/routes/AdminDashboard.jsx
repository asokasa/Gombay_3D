import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigate, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { api, apiBase } from "../lib/api";

const FILTERS = [
  { key: "active", label: "Active" },
  { key: "approved", label: "Approved" },
  { key: "archived", label: "Archived" },
  { key: "all", label: "All" },
];

const STATUS_LABELS = {
  new: "New",
  in_progress: "In progress",
  approved: "Approved",
  done: "Done",
  archived: "Archived",
};

const STATUS_CLASSES = {
  new: "bg-sky-100 text-sky-800 ring-sky-200",
  in_progress: "bg-amber-100 text-amber-800 ring-amber-200",
  approved: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  done: "bg-slate-200 text-slate-800 ring-slate-300",
  archived: "bg-zinc-200 text-zinc-700 ring-zinc-300",
};

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
  const queryClient = useQueryClient();
  const token = localStorage.getItem("gombay_admin_token");
  const [downloadingId, setDownloadingId] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const [filter, setFilter] = useState("active");
  const [referenceForm, setReferenceForm] = useState({ title: "", image: null });
  const [modelForm, setModelForm] = useState({
    title: "",
    description: "",
    priceHuf: "",
    size: "",
    image: null,
  });
  const [referenceFileInputKey, setReferenceFileInputKey] = useState(0);
  const [modelFileInputKey, setModelFileInputKey] = useState(0);

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

  const referenceImagesQuery = useQuery({
    queryKey: ["reference-images"],
    queryFn: () => api("/reference-images"),
    enabled: Boolean(token && meQuery.isSuccess),
    retry: false,
  });

  const premadeModelsQuery = useQuery({
    queryKey: ["premade-models"],
    queryFn: () => api("/premade-models"),
    enabled: Boolean(token && meQuery.isSuccess),
    retry: false,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) =>
      api(`/admin/quote-requests/${id}/status`, {
        method: "PATCH",
        body: { status },
        token,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "quote-requests", token] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) =>
      api(`/admin/quote-requests/${id}`, {
        method: "DELETE",
        token,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "quote-requests", token] });
    },
  });

  const createReferenceMutation = useMutation({
    mutationFn: (payload) => {
      const body = new FormData();
      body.append("title", payload.title);
      body.append("image", payload.image);

      return api("/admin/reference-images", {
        method: "POST",
        body,
        token,
      });
    },
    onSuccess: () => {
      setReferenceForm({ title: "", image: null });
      setReferenceFileInputKey((value) => value + 1);
      queryClient.invalidateQueries({ queryKey: ["reference-images"] });
    },
  });

  const deleteReferenceMutation = useMutation({
    mutationFn: (id) =>
      api(`/admin/reference-images/${id}`, {
        method: "DELETE",
        token,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reference-images"] });
    },
  });

  const createModelMutation = useMutation({
    mutationFn: (payload) => {
      const body = new FormData();
      body.append("title", payload.title);
      body.append("description", payload.description);
      body.append("priceHuf", payload.priceHuf);
      body.append("size", payload.size);
      body.append("image", payload.image);

      return api("/admin/premade-models", {
        method: "POST",
        body,
        token,
      });
    },
    onSuccess: () => {
      setModelForm({ title: "", description: "", priceHuf: "", size: "", image: null });
      setModelFileInputKey((value) => value + 1);
      queryClient.invalidateQueries({ queryKey: ["premade-models"] });
    },
  });

  const deleteModelMutation = useMutation({
    mutationFn: (id) =>
      api(`/admin/premade-models/${id}`, {
        method: "DELETE",
        token,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["premade-models"] });
    },
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
  const referenceImages = referenceImagesQuery.data?.items ?? [];
  const premadeModels = premadeModelsQuery.data?.items ?? [];
  const visibleQuoteRequests = quoteRequests.filter((item) => {
    if (filter === "active") {
      return item.status !== "archived";
    }

    if (filter === "approved") {
      return item.status === "approved";
    }

    if (filter === "archived") {
      return item.status === "archived";
    }

    return true;
  });
  const activeCount = quoteRequests.filter((item) => item.status !== "archived").length;
  const approvedCount = quoteRequests.filter((item) => item.status === "approved").length;
  const archivedCount = quoteRequests.filter((item) => item.status === "archived").length;
  const pendingActionId = updateStatusMutation.isPending
    ? updateStatusMutation.variables?.id
    : deleteMutation.isPending
      ? deleteMutation.variables
      : "";

  function handleLogout() {
    localStorage.removeItem("gombay_admin_token");
    navigate("/admin", { replace: true });
  }

  function updateStatus(item, status) {
    if (item.status === status) {
      return;
    }

    updateStatusMutation.mutate({ id: item.id, status });
  }

  function handleDelete(item) {
    const customerName = item.customer?.name || "this quote";
    const confirmed = window.confirm(`Delete ${customerName}'s quote request permanently?`);

    if (!confirmed) {
      return;
    }

    deleteMutation.mutate(item.id);
  }

  function handleReferenceSubmit(event) {
    event.preventDefault();

    if (!referenceForm.title.trim() || !referenceForm.image) {
      return;
    }

    createReferenceMutation.mutate(referenceForm);
  }

  function handleModelSubmit(event) {
    event.preventDefault();

    if (
      !modelForm.title.trim() ||
      !modelForm.description.trim() ||
      !modelForm.priceHuf ||
      !modelForm.size.trim() ||
      !modelForm.image
    ) {
      return;
    }

    createModelMutation.mutate(modelForm);
  }

  function handleReferenceDelete(item) {
    const confirmed = window.confirm(`Delete reference image "${item.title}" permanently?`);

    if (!confirmed) {
      return;
    }

    deleteReferenceMutation.mutate(item.id);
  }

  function handleModelDelete(item) {
    const confirmed = window.confirm(`Delete model "${item.title}" permanently?`);

    if (!confirmed) {
      return;
    }

    deleteModelMutation.mutate(item.id);
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
          } catch {
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
            <p className="text-sm text-slate-500">Active Requests</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{activeCount}</p>
            <p className="mt-1 text-xs text-slate-500">{quoteRequests.length} total</p>
          </article>
          <article className="neon-card rounded-lg p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Approved</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-700">{approvedCount}</p>
          </article>
          <article className="neon-card rounded-lg p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Archived</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{archivedCount}</p>
          </article>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="neon-panel rounded-lg p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-col justify-between gap-2 md:flex-row md:items-start">
              <div>
                <p className="text-sm text-slate-500">Referenciak Gallery</p>
                <h2 className="text-xl font-semibold text-sky-900">Upload Reference Image</h2>
              </div>
              <p className="text-sm font-semibold text-slate-500">{referenceImages.length} images</p>
            </div>

            <form className="mt-4 space-y-4" onSubmit={handleReferenceSubmit}>
              <label className="block text-sm font-medium text-slate-700">
                Short title
                <input
                  type="text"
                  value={referenceForm.title}
                  onChange={(event) => setReferenceForm((value) => ({ ...value, title: event.target.value }))}
                  maxLength={120}
                  required
                  className="mt-1 rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Image
                <input
                  key={referenceFileInputKey}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                  onChange={(event) =>
                    setReferenceForm((value) => ({
                      ...value,
                      image: event.target.files?.[0] || null,
                    }))
                  }
                  required
                  className="mt-1 rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
                />
              </label>
              <button
                type="submit"
                disabled={createReferenceMutation.isPending}
                className="neon-button rounded-md px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                {createReferenceMutation.isPending ? "Uploading..." : "Upload Reference"}
              </button>
            </form>

            {createReferenceMutation.isError ? (
              <p className="mt-4 text-sm text-red-600">{createReferenceMutation.error.message}</p>
            ) : null}
            {deleteReferenceMutation.isError ? (
              <p className="mt-4 text-sm text-red-600">{deleteReferenceMutation.error.message}</p>
            ) : null}
            {referenceImagesQuery.isError ? (
              <p className="mt-4 text-sm text-red-600">{referenceImagesQuery.error.message}</p>
            ) : null}

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {referenceImages.map((item) => (
                <article key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <img
                    src={item.image?.url}
                    alt={item.title}
                    className="aspect-square w-full rounded-md object-cover"
                  />
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-sm font-semibold text-slate-800">{item.title}</p>
                    <button
                      type="button"
                      onClick={() => handleReferenceDelete(item)}
                      disabled={deleteReferenceMutation.isPending && deleteReferenceMutation.variables === item.id}
                      className="shrink-0 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {deleteReferenceMutation.isPending && deleteReferenceMutation.variables === item.id
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="neon-panel rounded-lg p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-col justify-between gap-2 md:flex-row md:items-start">
              <div>
                <p className="text-sm text-slate-500">Modellek Page</p>
                <h2 className="text-xl font-semibold text-sky-900">Upload Model Listing</h2>
              </div>
              <p className="text-sm font-semibold text-slate-500">{premadeModels.length} models</p>
            </div>

            <form className="mt-4 space-y-4" onSubmit={handleModelSubmit}>
              <label className="block text-sm font-medium text-slate-700">
                Title
                <input
                  type="text"
                  value={modelForm.title}
                  onChange={(event) => setModelForm((value) => ({ ...value, title: event.target.value }))}
                  maxLength={120}
                  required
                  className="mt-1 rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Short description
                <textarea
                  value={modelForm.description}
                  onChange={(event) =>
                    setModelForm((value) => ({ ...value, description: event.target.value }))
                  }
                  maxLength={400}
                  rows={3}
                  required
                  className="mt-1 rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  Price HUF
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={modelForm.priceHuf}
                    onChange={(event) => setModelForm((value) => ({ ...value, priceHuf: event.target.value }))}
                    required
                    className="mt-1 rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Size
                  <input
                    type="text"
                    value={modelForm.size}
                    onChange={(event) => setModelForm((value) => ({ ...value, size: event.target.value }))}
                    maxLength={80}
                    placeholder="12 x 8 x 4 cm"
                    required
                    className="mt-1 rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
                  />
                </label>
              </div>
              <label className="block text-sm font-medium text-slate-700">
                Image
                <input
                  key={modelFileInputKey}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                  onChange={(event) =>
                    setModelForm((value) => ({
                      ...value,
                      image: event.target.files?.[0] || null,
                    }))
                  }
                  required
                  className="mt-1 rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
                />
              </label>
              <button
                type="submit"
                disabled={createModelMutation.isPending}
                className="neon-button rounded-md px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                {createModelMutation.isPending ? "Uploading..." : "Upload Model"}
              </button>
            </form>

            {createModelMutation.isError ? (
              <p className="mt-4 text-sm text-red-600">{createModelMutation.error.message}</p>
            ) : null}
            {deleteModelMutation.isError ? (
              <p className="mt-4 text-sm text-red-600">{deleteModelMutation.error.message}</p>
            ) : null}
            {premadeModelsQuery.isError ? (
              <p className="mt-4 text-sm text-red-600">{premadeModelsQuery.error.message}</p>
            ) : null}

            <div className="mt-5 space-y-3">
              {premadeModels.map((item) => (
                <article key={item.id} className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <img
                    src={item.image?.url}
                    alt={item.title}
                    className="h-20 w-20 shrink-0 rounded-md object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-600">
                      {formatCurrency(item.priceHuf)} · {item.size}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-600">{item.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleModelDelete(item)}
                    disabled={deleteModelMutation.isPending && deleteModelMutation.variables === item.id}
                    className="self-start rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {deleteModelMutation.isPending && deleteModelMutation.variables === item.id
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="neon-panel mt-6 rounded-lg p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <h2 className="text-xl font-semibold text-sky-900">Incoming Quote Requests</h2>
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Quote filters">
              {FILTERS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                  className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                    filter === item.key
                      ? "bg-sky-700 text-white shadow-sm"
                      : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                  }`}
                  aria-selected={filter === item.key}
                  role="tab"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {quoteRequestsQuery.isError ? (
            <p className="mt-4 text-sm text-red-600">{quoteRequestsQuery.error.message}</p>
          ) : null}

          {updateStatusMutation.isError ? (
            <p className="mt-4 text-sm text-red-600">{updateStatusMutation.error.message}</p>
          ) : null}

          {deleteMutation.isError ? (
            <p className="mt-4 text-sm text-red-600">{deleteMutation.error.message}</p>
          ) : null}

          {!quoteRequestsQuery.isError && downloadError ? (
            <p className="mt-4 text-sm text-red-600">{downloadError}</p>
          ) : null}

          {!quoteRequestsQuery.isError && visibleQuoteRequests.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600">No quote requests in this view.</p>
          ) : null}

          <div className="mt-4 space-y-4">
            {visibleQuoteRequests.map((item) => (
              <article key={item.id} className="neon-card rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-900">{item.customer?.name || "Unnamed"}</h3>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                          STATUS_CLASSES[item.status] || STATUS_CLASSES.new
                        }`}
                      >
                        {STATUS_LABELS[item.status] || item.status || "New"}
                      </span>
                    </div>
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
                      <div className="mt-2 flex flex-wrap items-center gap-3">
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
                <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
                  <button
                    type="button"
                    onClick={() => updateStatus(item, "approved")}
                    disabled={pendingActionId === item.id || item.status === "approved"}
                    className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {pendingActionId === item.id && updateStatusMutation.variables?.status === "approved"
                      ? "Approving..."
                      : "Approve"}
                  </button>
                  {item.status === "archived" ? (
                    <button
                      type="button"
                      onClick={() => updateStatus(item, "new")}
                      disabled={pendingActionId === item.id}
                      className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
                    >
                      Restore
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => updateStatus(item, "archived")}
                      disabled={pendingActionId === item.id}
                      className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
                    >
                      {pendingActionId === item.id && updateStatusMutation.variables?.status === "archived"
                        ? "Archiving..."
                        : "Archive"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    disabled={pendingActionId === item.id}
                    className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {pendingActionId === item.id && deleteMutation.variables === item.id ? "Deleting..." : "Delete"}
                  </button>
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
