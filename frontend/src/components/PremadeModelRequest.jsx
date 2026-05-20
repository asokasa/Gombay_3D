import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FILAMENT_ORDER } from "../lib/modelAnalysis";
import { api } from "../lib/api";
import { clampQuantity, formatPremadeCurrency, MAX_PRINT_QUANTITY } from "../lib/premadeModels";
import CardImageCarousel from "./CardImageCarousel";

export function PremadeModelCard({ model, isSelected = false, onSelect }) {
  return (
    <article
      className={[
        "neon-card flex h-full flex-col overflow-hidden rounded-lg text-left transition",
        isSelected
          ? "border-sky-300 shadow-[0_0_28px_rgba(56,189,248,0.22)]"
          : "hover:border-sky-300",
      ].join(" ")}
    >
      <CardImageCarousel
        images={model.images?.length ? model.images : [{ src: model.imageUrl, alt: model.title }]}
        title={model.title}
        className="h-56 w-full"
      />
      <button
        type="button"
        onClick={() => onSelect(model)}
        className="flex flex-1 flex-col p-5 text-left"
        aria-pressed={isSelected}
      >
        <span className="text-xl font-semibold text-sky-100">{model.title}</span>
        <span className="mt-3 flex-1 text-sm leading-relaxed text-slate-400">
          {model.description}
        </span>
        <span className="mt-5 grid gap-3 border-t border-slate-700 pt-4 text-sm text-slate-300 sm:grid-cols-2">
          <span>
            <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Ár
            </span>
            <span className="font-semibold text-sky-100">
              {formatPremadeCurrency(model.priceHuf)}
            </span>
          </span>
          <span>
            <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Méret
            </span>
            <span className="font-semibold text-sky-100">{model.size || "-"}</span>
          </span>
        </span>
        <span className="mt-5 inline-flex font-semibold text-sky-100">
          {isSelected ? "Kiválasztva" : "Ajánlatkérés ehhez"}
        </span>
      </button>
    </article>
  );
}

export function PremadeModelRequestForm({ model, onBack }) {
  const [selectedFilament, setSelectedFilament] = useState(FILAMENT_ORDER[0].key);
  const [selectedColorHex, setSelectedColorHex] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState({ type: "info", message: "" });
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    message: "",
  });

  const filamentsQuery = useQuery({
    queryKey: ["filaments"],
    queryFn: () => api("/filaments"),
    retry: false,
  });

  const filamentOptions = useMemo(() => {
    if (filamentsQuery.isSuccess) {
      return filamentsQuery.data?.items ?? [];
    }
    return FILAMENT_ORDER;
  }, [filamentsQuery.data, filamentsQuery.isSuccess]);

  const selectedMaterial = useMemo(
    () => filamentOptions.find((item) => item.key === selectedFilament) ?? filamentOptions[0],
    [filamentOptions, selectedFilament]
  );
  const colorOptions = useMemo(() => selectedMaterial?.colors ?? [], [selectedMaterial]);
  const selectedColor = useMemo(() => {
    if (!colorOptions.length) {
      return null;
    }
    return colorOptions.find((item) => item.hex === selectedColorHex) ?? colorOptions[0];
  }, [colorOptions, selectedColorHex]);

  useEffect(() => {
    if (!selectedMaterial && filamentOptions.length) {
      setSelectedFilament(filamentOptions[0].key);
      return;
    }
    if (selectedMaterial && !filamentOptions.some((item) => item.key === selectedMaterial.key)) {
      setSelectedFilament(filamentOptions[0]?.key ?? FILAMENT_ORDER[0].key);
    }
  }, [filamentOptions, selectedMaterial]);

  useEffect(() => {
    if (!colorOptions.length) {
      setSelectedColorHex("");
      return;
    }
    if (!colorOptions.some((item) => item.hex === selectedColorHex)) {
      setSelectedColorHex(colorOptions[0].hex);
    }
  }, [colorOptions, selectedColorHex]);

  useEffect(() => {
    setStatus({ type: "info", message: "" });
    setQuantity(1);
  }, [model?.id]);

  const unitPrice = Number.isFinite(Number(model?.priceHuf)) ? Number(model.priceHuf) : null;
  const totalPrice = unitPrice === null ? null : unitPrice * quantity;
  const canSubmit = Boolean(
    model &&
      selectedMaterial &&
      formData.name.trim() &&
      formData.email.trim() &&
      formData.address.trim() &&
      (!colorOptions.length || selectedColor) &&
      !sending
  );

  function handleInputChange(event) {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) {
      setStatus({
        type: "error",
        message: "Add meg a modellt, anyagot, darabszámot és a kapcsolati adatokat.",
      });
      return;
    }

    const materialPayload = {
      ...selectedMaterial,
      color: selectedColor,
    };
    const quote = {
      requestType: "premade",
      quantity,
      unitPriceHuf: unitPrice,
      total: totalPrice,
      modelTitle: model.title,
      modelId: model.id,
    };

    setSending(true);
    setStatus({ type: "info", message: "Ajánlatkérés rögzítése folyamatban..." });

    try {
      await api("/quote-requests", {
        method: "POST",
        body: {
          requestType: "premade",
          name: formData.name.trim(),
          email: formData.email.trim(),
          address: formData.address.trim(),
          message: formData.message.trim(),
          selectedMaterial: materialPayload,
          selectedColor: selectedColor ?? {},
          premadeModel: {
            id: model.id,
            title: model.title,
            description: model.description,
            priceHuf: model.priceHuf,
            size: model.size,
            image: model.image,
          },
          quote,
        },
      });

      setStatus({
        type: "success",
        message: "Sikeresen elküldtük az ajánlatkérést. Hamarosan felvesszük veled a kapcsolatot.",
      });
      setFormData({ name: "", email: "", address: "", message: "" });
      setQuantity(1);
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Hiba történt az ajánlatkérés rögzítése során. Kérjük, próbáld meg később újra.",
      });
    } finally {
      setSending(false);
    }
  }

  if (!model) {
    return null;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="neon-panel rounded-lg p-5 shadow-lg backdrop-blur md:p-6"
    >
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <p className="neon-kicker">Kiválasztott modell</p>
          <h2 className="mt-2 text-2xl font-semibold text-sky-900">{model.title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            {model.description}
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-700">
            <span className="rounded-md bg-sky-50 px-3 py-2 ring-1 ring-sky-100">
              {formatPremadeCurrency(model.priceHuf)} / db
            </span>
            {model.size ? (
              <span className="rounded-md bg-sky-50 px-3 py-2 ring-1 ring-sky-100">
                {model.size}
              </span>
            ) : null}
          </div>
        </div>
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="neon-button-secondary rounded-md px-4 py-2 text-sm"
          >
            Másik modell
          </button>
        ) : null}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <h3 className="text-lg font-semibold text-sky-900">Anyag és darabszám</h3>
          {filamentsQuery.isError ? (
            <p className="mt-2 text-xs text-amber-700">
              Az admin filamentlista nem érhető el, ezért az alapértelmezett anyagok láthatók.
            </p>
          ) : null}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {filamentOptions.map((material) => {
              const isActive = material.key === selectedFilament;
              return (
                <button
                  key={material.key}
                  type="button"
                  onClick={() => {
                    setSelectedFilament(material.key);
                    setSelectedColorHex(material.colors?.[0]?.hex ?? "");
                  }}
                  className={[
                    "flex h-full flex-col rounded-lg border p-4 text-left transition",
                    isActive
                      ? "border-sky-400 bg-sky-100/70 shadow"
                      : "border-slate-200 bg-white/70 hover:border-sky-300 hover:bg-sky-50/60",
                  ].join(" ")}
                >
                  <span className="text-base font-semibold text-sky-900">{material.label}</span>
                  <span className="mt-2 text-sm text-slate-600">{material.description}</span>
                </button>
              );
            })}
          </div>

          {colorOptions.length ? (
            <div className="mt-5">
              <h4 className="text-sm font-semibold text-sky-900">Szín kiválasztása</h4>
              <div className="mt-2 flex flex-wrap gap-2">
                {colorOptions.map((color) => {
                  const isActive = selectedColor?.hex === color.hex;
                  return (
                    <button
                      key={`${color.hex}-${color.name}`}
                      type="button"
                      onClick={() => setSelectedColorHex(color.hex)}
                      className={[
                        "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition",
                        isActive
                          ? "border-sky-300 bg-sky-100/70 text-sky-900 shadow"
                          : "border-slate-200 bg-white/70 text-slate-700 hover:border-sky-300",
                      ].join(" ")}
                    >
                      <span
                        className="h-5 w-5 rounded-full border border-slate-500"
                        style={{ backgroundColor: color.hex }}
                        aria-hidden="true"
                      />
                      {color.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <label className="mt-5 flex max-w-xs flex-col text-sm font-semibold text-sky-900">
            Darabszám
            <input
              type="number"
              min="1"
              max={MAX_PRINT_QUANTITY}
              step="1"
              value={quantity}
              onChange={(event) => setQuantity(clampQuantity(event.target.value, quantity))}
              disabled={sending}
              className="mt-2 rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-medium text-slate-800 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </label>
        </div>

        <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-emerald-800">Összesítés</h3>
          <dl className="mt-3 space-y-2 text-sm text-emerald-800">
            <div>
              <dt className="font-medium text-emerald-700">Modell</dt>
              <dd>{model.title}</dd>
            </div>
            <div>
              <dt className="font-medium text-emerald-700">Anyag</dt>
              <dd>{selectedMaterial?.label || "-"}</dd>
            </div>
            <div>
              <dt className="font-medium text-emerald-700">Darabszám</dt>
              <dd>{quantity} db</dd>
            </div>
          </dl>
          {selectedColor ? (
            <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800">
              <span
                className="h-4 w-4 rounded-full border border-emerald-900/40"
                style={{ backgroundColor: selectedColor.hex }}
                aria-hidden="true"
              />
              {selectedColor.name}
            </p>
          ) : null}
          <p className="mt-5 text-sm font-medium text-emerald-700">Becsült ár</p>
          <p className="mt-1 text-3xl font-extrabold text-emerald-900">
            {formatPremadeCurrency(totalPrice)}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-emerald-700">
            A végleges ajánlatot a kiválasztott anyag és készlet alapján erősítjük meg.
          </p>
        </div>
      </div>

      <div className="mt-8 border-t border-slate-200 pt-6">
        <h3 className="text-2xl font-semibold text-sky-900">Kapcsolati adatok megadása</h3>
        <p className="mt-2 text-sm text-slate-600">
          Add meg az elérhetőségedet, hogy kollégánk felvehessen veled a kapcsolatot.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="flex flex-col text-sm font-medium text-slate-700">
            Név
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="mt-1 rounded-md border border-slate-200 bg-white/90 px-3 py-2 text-slate-800 focus:border-sky-400 focus:outline-none"
              required
            />
          </label>
          <label className="flex flex-col text-sm font-medium text-slate-700">
            E-mail
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="mt-1 rounded-md border border-slate-200 bg-white/90 px-3 py-2 text-slate-800 focus:border-sky-400 focus:outline-none"
              required
            />
          </label>
        </div>
        <label className="mt-4 flex flex-col text-sm font-medium text-slate-700">
          Számlázási cím
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            className="mt-1 rounded-md border border-slate-200 bg-white/90 px-3 py-2 text-slate-800 focus:border-sky-400 focus:outline-none"
            required
          />
        </label>
        <label className="mt-4 flex flex-col text-sm font-medium text-slate-700">
          Megjegyzés (opcionális)
          <textarea
            name="message"
            rows={4}
            value={formData.message}
            onChange={handleInputChange}
            className="mt-1 rounded-md border border-slate-200 bg-white/90 px-3 py-2 text-slate-800 focus:border-sky-400 focus:outline-none"
            placeholder="Röviden írd le az elvárásaidat, anyagtípust, határidőt."
          />
        </label>
      </div>

      {status.message ? (
        <div
          className={[
            "mt-4 rounded-lg border p-4 text-sm",
            status.type === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : status.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-sky-200 bg-sky-50 text-sky-700",
          ].join(" ")}
        >
          {status.message}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={!canSubmit}
        className={[
          "mt-6 inline-flex w-full items-center justify-center rounded-md px-6 py-3 font-semibold text-white transition sm:w-auto",
          canSubmit ? "bg-red-600 hover:bg-red-500" : "cursor-not-allowed bg-red-400",
        ].join(" ")}
      >
        {sending ? "Küldés folyamatban..." : "Ajánlatkérés elküldése"}
      </button>
    </form>
  );
}
