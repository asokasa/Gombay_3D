import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, extend, useFrame, useLoader, useThree } from "@react-three/fiber";
import { useQuery } from "@tanstack/react-query";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  FILAMENT_ORDER,
  MAX_DIMENSION_CM,
  DEFAULT_CALCULATOR_SETTINGS,
  analyze3DFile,
  calculateQuote,
} from "../lib/modelAnalysis";
import { api } from "../lib/api";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Box3, DoubleSide, MeshStandardMaterial, Vector3 } from "three";

extend({ OrbitControls });

function CameraControls() {
  const controls = useRef(null);
  const { camera, gl } = useThree();
  useFrame(() => {
    controls.current?.update();
  });
  return (
    <orbitControls
      ref={controls}
      args={[camera, gl.domElement]}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.5}
      maxDistance={100}
    />
  );
}

function FitCamera({ bounds }) {
  const { camera } = useThree();
  useEffect(() => {
    if (!bounds?.length) return;
    const maxDimension = Math.max(...bounds);
    const distance = Math.max(4, maxDimension * 1.8);
    camera.position.set(distance, distance, distance);
    camera.near = 0.1;
    camera.far = Math.max(500, distance * 6);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [bounds, camera]);
  return null;
}

function StlModel({ url, viewerScale }) {
  const geometry = useLoader(STLLoader, url);
  useEffect(() => {
    geometry.center();
    geometry.computeVertexNormals();
  }, [geometry]);
  return (
    <mesh geometry={geometry} scale={viewerScale} castShadow receiveShadow>
      <meshStandardMaterial color="#38bdf8" metalness={0.2} roughness={0.6} />
    </mesh>
  );
}

function ObjModel({ url, viewerScale }) {
  const object = useLoader(OBJLoader, url);
  useEffect(() => {
    const material = new MeshStandardMaterial({
      color: "#FF0000",
      metalness: 0.15,
      roughness: 0.65,
      side: DoubleSide,
    });
    object.traverse((child) => {
      if (child.isMesh) {
        child.geometry.center();
        child.material = material;
      }
    });
    const box = new Box3().setFromObject(object);
    const center = box.getCenter(new Vector3());
    object.position.sub(center);
  }, [object]);
  return <primitive object={object} scale={viewerScale} />;
}

function GltfModel({ url, viewerScale }) {
  const gltf = useLoader(GLTFLoader, url);
  const scene = useMemo(() => gltf.scene.clone(true), [gltf]);
  useEffect(() => {
    const material = new MeshStandardMaterial({
      color: "#38bdf8",
      metalness: 0.2,
      roughness: 0.6,
      side: DoubleSide,
    });
    scene.traverse((child) => {
      if (child.isMesh) {
        child.geometry.computeVertexNormals();
        child.material = material;
      }
    });
    const box = new Box3().setFromObject(scene);
    const center = box.getCenter(new Vector3());
    scene.position.sub(center);
  }, [scene]);
  return <primitive object={scene} scale={viewerScale} />;
}

function StepPreview({ sizeCm }) {
  const [x = 0, y = 0, z = 0] = sizeCm ?? [];
  const safeX = x || 1;
  const safeY = y || 1;
  const safeZ = z || 1;
  return (
    <mesh scale={[safeX, safeY, safeZ]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#38bdf8" transparent opacity={0.4} wireframe />
    </mesh>
  );
}

function ModelPreview({ file, analysis, scaledSizeCm, quoteScale = 1 }) {
  const [objectUrl, setObjectUrl] = useState(null);
  useEffect(() => {
    if (!file) {
      setObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => {
      URL.revokeObjectURL(url);
      setObjectUrl(null);
    };
  }, [file]);

  const extension = useMemo(() => file?.name.split(".").pop()?.toLowerCase() ?? "", [file]);

  if (!file || !analysis) {
    return null;
  }

  const showBoundingBox = extension === "step" || extension === "stp";
  const bounds = scaledSizeCm?.length ? scaledSizeCm : analysis.sizeCm;
  const viewerScale = (analysis.previewScale ?? 0.1) * quoteScale;

  return (
    <div className="flex flex-col gap-3">
      <div className="h-72 w-full overflow-hidden rounded-lg border border-sky-100 bg-slate-900/95 shadow-[0_0_26px_rgba(0,149,255,0.18)] md:h-80">
        <Canvas camera={{ position: [0, 0, 12], fov: 60 }} shadows>
          <color attach="background" args={["#0f172a"]} />
          <ambientLight intensity={0.6} />
          <directionalLight intensity={0.9} position={[12, 16, 10]} castShadow />
          <Suspense fallback={null}>
            <FitCamera bounds={bounds} />
            {showBoundingBox ? (
              <StepPreview sizeCm={bounds} />
            ) : extension === "obj" ? (
              objectUrl ? (
                <ObjModel url={objectUrl} viewerScale={viewerScale} />
              ) : null
            ) : extension === "gltf" || extension === "glb" ? (
              objectUrl ? (
                <GltfModel url={objectUrl} viewerScale={viewerScale} />
              ) : null
            ) : objectUrl ? (
              <StlModel url={objectUrl} viewerScale={viewerScale} />
            ) : null}
          </Suspense>
          <CameraControls />
        </Canvas>
      </div>
      {showBoundingBox ? (
        <p className="text-xs text-slate-500">
          STEP fájlok esetén becsült méret alapján megjelenített határoló doboz látható.
        </p>
      ) : (
        <p className="text-xs text-slate-500">
          A modell előnézetében szabadon forgathatod és nagyíthatod a fájlt.
        </p>
      )}
    </div>
  );
}

const UNIT_PRESETS = [
  { value: "mm", label: "Milliméter (mm)", toMillimeter: 1 },
  { value: "cm", label: "Centiméter (cm)", toMillimeter: 10 },
  { value: "m", label: "Méter (m)", toMillimeter: 1000 },
  { value: "inch", label: "Hüvelyk (inch)", toMillimeter: 25.4 },
];

function formatNumber(value, fractionDigits = 2) {
  if (!Number.isFinite(value)) {
    return "-";
  }
  return new Intl.NumberFormat("hu-HU", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

function formatCurrency(value) {
  if (!Number.isFinite(value)) {
    return "-";
  }
  return new Intl.NumberFormat("hu-HU", {
    style: "currency",
    currency: "HUF",
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

function formatMass(value) {
  if (!Number.isFinite(value)) {
    return "-";
  }
  return `${formatNumber(value, 1)} g`;
}

function formatPricePerGram(value) {
  if (!Number.isFinite(value)) {
    return "-";
  }
  return `${formatNumber(value, 0)} Ft/g`;
}

function formatDimensionArray(values) {
  if (!values?.length) {
    return "-";
  }
  return values.map((value) => `${formatNumber(value, 2)} cm`).join(" x ");
}

function formatPercentage(value) {
  if (!Number.isFinite(value)) {
    return "-";
  }
  return `${formatNumber(value, 1)}%`;
}

function PremadeModelCatalog({ onBack }) {
  const premadeModelsQuery = useQuery({
    queryKey: ["premade-models"],
    queryFn: () => api("/premade-models"),
    retry: false,
  });
  const models = premadeModelsQuery.data?.items ?? [];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="neon-kicker">Előre elkészített modellek</p>
          <h2 className="neon-heading mt-2 text-3xl font-extrabold md:text-4xl">
            Válassz a kész modellek közül
          </h2>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="neon-button-secondary rounded-md px-4 py-2 text-sm"
        >
          Vissza
        </button>
      </div>

      {premadeModelsQuery.isLoading ? (
        <p className="text-sm text-slate-500">Modellek betöltése...</p>
      ) : null}

      {premadeModelsQuery.isError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {premadeModelsQuery.error.message}
        </p>
      ) : null}

      {!premadeModelsQuery.isLoading && !premadeModelsQuery.isError && models.length === 0 ? (
        <p className="neon-panel rounded-lg p-5 text-sm text-slate-500">
          Jelenleg nincs feltöltött előre elkészített modell.
        </p>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {models.map((model) => (
          <article key={model.id} className="neon-card flex h-full flex-col overflow-hidden">
            <img
              src={model.image?.url}
              alt={model.title}
              className="h-56 w-full object-cover"
            />
            <div className="flex flex-1 flex-col p-5">
              <h3 className="text-xl font-semibold text-sky-100">{model.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-400">
                {model.description}
              </p>
              <div className="mt-5 grid gap-3 border-t border-slate-700 pt-4 text-sm text-slate-300 sm:grid-cols-2">
                <p>
                  <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Ár
                  </span>
                  <span className="font-semibold text-sky-100">{formatCurrency(model.priceHuf)}</span>
                </p>
                <p>
                  <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Méret
                  </span>
                  <span className="font-semibold text-sky-100">{model.size}</span>
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function QuoteTypeChooser({ onSelect }) {
  return (
    <div className="mx-auto grid w-full max-w-5xl gap-5 md:grid-cols-2">
      <button
        type="button"
        onClick={() => onSelect("custom")}
        className="neon-card flex min-h-56 flex-col justify-between rounded-lg p-6 text-left transition hover:border-sky-300"
      >
        <div>
          <p className="neon-kicker">Saját modell</p>
          <h2 className="mt-3 text-2xl font-bold text-sky-100">Feltöltöm a saját 3D fájlomat</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            STL, STEP, OBJ vagy GLTF/GLB fájlból automatikus méretellenőrzés és árbecslés.
          </p>
        </div>
        <span className="mt-6 inline-flex font-semibold text-sky-100">Kalkulátor megnyitása</span>
      </button>

      <button
        type="button"
        onClick={() => onSelect("premade")}
        className="neon-card flex min-h-56 flex-col justify-between rounded-lg p-6 text-left transition hover:border-sky-300"
      >
        <div>
          <p className="neon-kicker">Előre elkészített modell</p>
          <h2 className="mt-3 text-2xl font-bold text-sky-100">Kész modellek közül választok</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Az admin felületen feltöltött modellek képpel, leírással, árral és mérettel.
          </p>
        </div>
        <span className="mt-6 inline-flex font-semibold text-sky-100">Modellek megtekintése</span>
      </button>
    </div>
  );
}

function QuoteCalculator() {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [baseAnalysis, setBaseAnalysis] = useState(null);
  const [unitOverride, setUnitOverride] = useState("auto");
  const [selectedFilament, setSelectedFilament] = useState(FILAMENT_ORDER[0].key);
  const [selectedColorHex, setSelectedColorHex] = useState("");
  const [status, setStatus] = useState({ type: "info", message: "" });
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef(null);
  const analysisRequestIdRef = useRef(0);

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

  const calculatorSettingsQuery = useQuery({
    queryKey: ["calculator-settings"],
    queryFn: () => api("/calculator-settings"),
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

  const quote = useMemo(() => {
    if (!analysis || !selectedMaterial) {
      return null;
    }
    return calculateQuote({
      analysis,
      filamentKey: selectedFilament,
      filament: selectedMaterial,
      calculatorSettings: calculatorSettingsQuery.data?.item ?? DEFAULT_CALCULATOR_SETTINGS,
    });
  }, [analysis, calculatorSettingsQuery.data, selectedFilament, selectedMaterial]);

  const scaledSizeCm = useMemo(() => {
    if (quote?.scaledSizeCm?.length) {
      return quote.scaledSizeCm;
    }
    if (analysis?.sizeCm?.length) {
      return analysis.sizeCm;
    }
    return null;
  }, [analysis, quote]);

  const detectedUnitLabel = baseAnalysis?.detectedUnit ?? analysis?.detectedUnit ?? "";

  const rawDimensionsText = formatDimensionArray(analysis?.sizeCm);
  const scaledDimensionsText = formatDimensionArray(scaledSizeCm);
  const hasWarnings = Boolean(analysis?.warnings?.length);
  const canSubmit = Boolean(
    file && analysis && quote && !loading && !sending && (!colorOptions.length || selectedColor),
  );

  function clearFileInput() {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleFileChange(event) {
    const requestId = analysisRequestIdRef.current + 1;
    analysisRequestIdRef.current = requestId;
    const selectedFile = event.target.files?.[0];
    setAnalysis(null);
    setBaseAnalysis(null);
    setUnitOverride("auto");
    if (!selectedFile) {
      setFile(null);
      clearFileInput();
      setStatus({ type: "info", message: "" });
      return;
    }
    if (selectedFile.size > 50 * 1024 * 1024) {
      setStatus({
        type: "error",
        message: "Legfeljebb 50 MB méretű fájl tölthető fel.",
      });
      setFile(null);
      clearFileInput();
      return;
    }
    setLoading(true);
    setStatus({ type: "info", message: "A fájl feldolgozása folyamatban..." });
    try {
      const result = await analyze3DFile(selectedFile);
      if (requestId !== analysisRequestIdRef.current) {
        return;
      }
      setFile(selectedFile);
      setBaseAnalysis(result);
      setAnalysis(result);
      const messageParts = ["A fájl sikeresen ellenőrizve."];
      const recommendedScale = result.autoScale?.recommendedScale;
      if (Number.isFinite(recommendedScale) && recommendedScale < 1) {
        messageParts.push(
          `A modell nagyobb a ${MAX_DIMENSION_CM} cm-es nyomtatási térnél, ${formatNumber(
            recommendedScale * 100,
            0
          )}% méretarányt használ az árbecslés. Jelezd az üzenetben, ha más méretet szeretnél.`
        );
      }
      if (result.warnings?.length) {
        messageParts.push("Ellenőrizd a lenti figyelmeztetéseket a gyártás előtt.");
      }
      if (result.detectedUnit) {
        messageParts.push(`Feltételezett egység: ${result.detectedUnit}.`);
      }
      setStatus({
        type: result.warnings?.length ? "warning" : "success",
        message: messageParts.join(" "),
      });
    } catch (error) {
      console.error(error);
      setFile(null);
      setAnalysis(null);
      setBaseAnalysis(null);
      clearFileInput();
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Ismeretlen hiba történt a fájl feldolgozása során.",
      });
    } finally {
      if (requestId === analysisRequestIdRef.current) {
        setLoading(false);
      }
    }
  }

  async function handleUnitOverrideChange(event) {
    const requestId = analysisRequestIdRef.current + 1;
    analysisRequestIdRef.current = requestId;
    const { value } = event.target;
    setUnitOverride(value);
    if (!file) {
      return;
    }
    if (value === "auto") {
      if (baseAnalysis) {
        setAnalysis(baseAnalysis);
        const messageParts = ["Automatikus egységfelismerés alkalmazva."];
        if (baseAnalysis.detectedUnit) {
          messageParts.push(`Feltételezett egység: ${baseAnalysis.detectedUnit}.`);
        }
        if (baseAnalysis.warnings?.length) {
          messageParts.push("Ellenőrizd a lenti figyelmeztetéseket a gyártás előtt.");
        }
        setStatus({
          type: baseAnalysis.warnings?.length ? "warning" : "success",
          message: messageParts.join(" "),
        });
      }
      return;
    }

    const preset = UNIT_PRESETS.find((item) => item.value === value);
    if (!preset) {
      return;
    }

    setLoading(true);
    setStatus({
      type: "info",
      message: `${preset.label} feltételezésével újraértékeljük a modellt...`,
    });

    try {
      const result = await analyze3DFile(file, { unitOverride: preset });
      if (requestId !== analysisRequestIdRef.current) {
        return;
      }
      setAnalysis(result);
      const messageParts = [`${preset.label} feltételezésével újraértékeltük a modellt.`];
      if (result.autoScale?.recommendedScale < 1) {
        messageParts.push(
          `A modell nagyobb a ${MAX_DIMENSION_CM} cm-es nyomtatási térnél, ${formatNumber(
            result.autoScale.recommendedScale * 100,
            0
          )}% méretarányt használ az árbecslés.`
        );
      }
      if (result.warnings?.length) {
        messageParts.push("Ellenőrizd a lenti figyelmeztetéseket a gyártás előtt.");
      }
      setStatus({
        type: result.warnings?.length ? "warning" : "success",
        message: messageParts.join(" "),
      });
    } catch (error) {
      console.error(error);
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Ismeretlen hiba történt a fájl újraelemzése során.",
      });
    } finally {
      if (requestId === analysisRequestIdRef.current) {
        setLoading(false);
      }
    }
  }

  function handleInputChange(event) {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (sending) {
      return;
    }
    if (!file || !analysis || !quote) {
      setStatus({
        type: "error",
        message: "Kérjük, tölts fel egy megfelelő modellt a küldés előtt.",
      });
      return;
    }
    const trimmedFormData = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      address: formData.address.trim(),
      message: formData.message.trim(),
    };
    if (!trimmedFormData.name || !trimmedFormData.email || !trimmedFormData.address) {
      setStatus({
        type: "error",
        message: "Add meg a neved, e-mail címed és címed a folytatáshoz.",
      });
      return;
    }

    const materialPayload = {
      ...selectedMaterial,
      color: selectedColor,
    };

    const payload = new FormData();
    payload.append("file", file);
    payload.append("name", trimmedFormData.name);
    payload.append("email", trimmedFormData.email);
    payload.append("address", trimmedFormData.address);
    payload.append("message", trimmedFormData.message);
    payload.append("selectedMaterial", JSON.stringify(materialPayload));
    payload.append("selectedColor", JSON.stringify(selectedColor ?? {}));
    payload.append("analysis", JSON.stringify(analysis));
    payload.append("quote", JSON.stringify(quote));
    payload.append("scaledSizeCm", JSON.stringify(scaledSizeCm ?? []));
    payload.append("unitOverride", unitOverride);
    payload.append("detectedUnitLabel", detectedUnitLabel);

    setSending(true);
    setStatus({
      type: "info",
      message: "Ajánlatkérés rögzítése folyamatban...",
    });

    try {
      await api("/quote-requests", {
        method: "POST",
        body: payload,
      });

      setStatus({
        type: "success",
        message: "Sikeresen elküldtük az ajánlatkérést. Hamarosan felvesszük veled a kapcsolatot.",
      });

      setFormData({ name: "", email: "", address: "", message: "" });
      setSelectedFilament(FILAMENT_ORDER[0].key);
      setSelectedColorHex("");
      setUnitOverride("auto");
      setFile(null);
      setAnalysis(null);
      setBaseAnalysis(null);
      analysisRequestIdRef.current += 1;
      clearFileInput();
    } catch (error) {
      console.error(error);
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

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="neon-panel rounded-lg p-5 shadow-lg backdrop-blur md:p-6">
        <h2 className="text-2xl font-semibold text-sky-900">1. Modell feltöltése</h2>
        <p className="mt-2 text-sm text-slate-600">
          Tölts fel STL, STEP, OBJ vagy GLTF/GLB fájlt. A rendszer automatikusan ellenőrzi, hogy a
          modell belefér-e a {MAX_DIMENSION_CM} x {MAX_DIMENSION_CM} x {MAX_DIMENSION_CM} cm-es
          nyomtatási térbe és feltárja az esetleges problémákat.
        </p>
        <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-sky-300 bg-sky-50/40 p-6 text-center text-sky-700 transition hover:border-sky-500 hover:bg-sky-100">
          <input
            ref={fileInputRef}
            type="file"
            accept=".stl,.STL,.obj,.OBJ,.step,.STEP,.stp,.STP,.gltf,.GLTF,.glb,.GLB"
            className="hidden"
            onChange={handleFileChange}
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="h-12 w-12"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 16.5v-9m0 0L5.25 11.25M9 7.5l3.75 3.75m-.75-7.5h3.294c.36 0 .706.128.977.36l3.432 3.015c.299.263.469.646.469 1.05V17.25A2.25 2.25 0 0117.25 19.5H6.75A2.25 2.25 0 014.5 17.25v-7.5"
            />
          </svg>
          <span className="mt-3 font-medium">
            {file ? file.name : "Kattints vagy húzd ide a fájlt"}
          </span>
          <span className="mt-1 text-xs text-slate-500">
            Maximum 50 MB, STL / STEP / OBJ / GLTF / GLB formátumok
          </span>
        </label>
        {loading ? <p className="mt-4 text-sm text-slate-600">Feldolgozás...</p> : null}
        {analysis ? (
          <div className="mt-6 space-y-6">
            <ModelPreview
              file={file}
              analysis={analysis}
              scaledSizeCm={scaledSizeCm}
              quoteScale={quote?.scale ?? 1}
            />

            <div>
              <h3 className="text-lg font-semibold text-sky-900">Filament kiválasztása</h3>
              <p className="mt-1 text-sm text-slate-600">
                Válaszd ki a felhasználási célnak megfelelő alapanyagot - a költségbecslés azonnal
                frissül.
              </p>
              {filamentsQuery.isError ? (
                <p className="mt-2 text-xs text-amber-700">
                  Az admin filamentlista nem érhető el, ezért az alapértelmezett anyagok láthatók.
                </p>
              ) : null}
              {filamentsQuery.isSuccess && filamentOptions.length === 0 ? (
                <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-sm text-amber-800">
                  Jelenleg nincs választható filament. Kérjük, vedd fel velünk a kapcsolatot.
                </p>
              ) : null}
              <div className="mt-4 grid gap-3 md:grid-cols-2">
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
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-base font-semibold text-sky-900">
                          {material.label}
                        </span>
                        <span className="text-xs font-medium text-slate-500">
                          {material.temperature}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{material.description}</p>
                      {Number.isFinite(material.priceHufPerGram) ? (
                        <span className="mt-3 text-xs font-semibold uppercase tracking-wide text-sky-700">
                          {formatPricePerGram(material.priceHufPerGram)}
                        </span>
                      ) : null}
                      {material.colors?.length ? (
                        <span className="mt-3 flex flex-wrap gap-1.5" aria-hidden="true">
                          {material.colors.slice(0, 8).map((color) => (
                            <span
                              key={`${material.key}-${color.hex}-${color.name}`}
                              className="h-4 w-4 rounded-full border border-slate-500"
                              style={{ backgroundColor: color.hex }}
                            />
                          ))}
                        </span>
                      ) : null}
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
            </div>

            {quote ? (
              <div className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="rounded-lg border border-sky-100 bg-sky-50/60 p-4 shadow-sm">
                    <h3 className="text-lg font-semibold text-sky-900">Modell adatai</h3>
                    <dl className="mt-3 space-y-2 text-sm text-slate-700">
                      <div>
                        <dt className="font-medium text-slate-600">Eredeti méret</dt>
                        <dd>{rawDimensionsText}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-slate-600">Skálázott méret</dt>
                        <dd>{scaledDimensionsText}</dd>
                      </div>
                      {quote.scale !== 1 ? (
                        <div>
                          <dt className="font-medium text-slate-600">Alkalmazott méretarány</dt>
                          <dd>{formatPercentage(quote.scale * 100)}</dd>
                        </div>
                      ) : null}
                      <div>
                        <dt className="font-medium text-slate-600">Térfogat</dt>
                        <dd>{formatNumber(quote.scaledVolumeCm3, 2)} cm3</dd>
                      </div>
                      {Number.isFinite(quote.scaledSurfaceAreaCm2) ? (
                        <div>
                          <dt className="font-medium text-slate-600">Felület</dt>
                          <dd>{formatNumber(quote.scaledSurfaceAreaCm2, 2)} cm2</dd>
                        </div>
                      ) : null}
                      <div>
                        <dt className="font-medium text-slate-600">Becsült tömeg</dt>
                        <dd>{formatMass(quote.massGrams)}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-slate-600">Fájl egysége</dt>
                        <dd>
                          <div className="mt-1 space-y-1">
                            <select
                              value={unitOverride}
                              onChange={handleUnitOverrideChange}
                              disabled={loading || sending}
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                            >
                              <option value="auto">
                                Automatikus felismerés
                                {detectedUnitLabel ? ` (${detectedUnitLabel})` : ""}
                              </option>
                              {UNIT_PRESETS.map((preset) => (
                                <option key={preset.value} value={preset.value}>
                                  {preset.label}
                                </option>
                              ))}
                            </select>
                            <p className="text-xs text-slate-500">
                              Alkalmazott egység: {analysis.rawUnit}
                            </p>
                            {detectedUnitLabel ? (
                              <p className="text-xs text-slate-500">
                                Automatikusan érzékelt egység: {detectedUnitLabel}
                              </p>
                            ) : null}
                          </div>
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-4 shadow-sm">
                    <h3 className="text-lg font-semibold text-emerald-800">Költségbecslés</h3>
                    <p className="mt-1 text-sm text-emerald-700">
                      {selectedMaterial.label} alapanyag - {selectedMaterial.temperature}
                    </p>
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
                    {Number.isFinite(quote.materialPricePerGram) ? (
                      <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                        {formatPricePerGram(quote.materialPricePerGram)}
                      </p>
                    ) : null}
                    <ul className="mt-3 space-y-1 text-sm text-emerald-800">
                      <li>Becsült nyomtatási idő: {formatNumber(quote.hours, 2)} óra</li>
                      <li>Anyagköltség: {formatCurrency(quote.materialCost)}</li>
                      <li>Gépidő költség: {formatCurrency(quote.machineCost)}</li>
                      <li>Felület utómunka: {formatCurrency(quote.finishingCost)}</li>
                      <li>Szolgáltatási alapdíj: {formatCurrency(quote.serviceFee)}</li>
                      <li className="pt-2 text-base font-semibold text-emerald-900">
                        Összesen: {formatCurrency(quote.total)}
                      </li>
                    </ul>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white/80 p-4 shadow-sm">
                    <h3 className="text-lg font-semibold text-sky-900">Ellenőrzési eredmények</h3>
                    <ul className="mt-3 space-y-2 text-sm text-slate-700">
                      <li>
                        <span className="font-medium text-slate-600">Zártság:</span>{" "}
                        {analysis.manifold?.isWatertight === false
                          ? "Nem zárt felület"
                          : analysis.manifold?.isWatertight === true
                            ? "Rendben"
                            : "Nem áll rendelkezésre adat"}
                      </li>
                      {Number.isFinite(analysis.manifold?.nonManifoldEdges) ? (
                        <li>
                          <span className="font-medium text-slate-600">Nem-manifold élek:</span>{" "}
                          {analysis.manifold.nonManifoldEdges}
                        </li>
                      ) : null}
                      {analysis.intersections ? (
                        <>
                          <li>
                            <span className="font-medium text-slate-600">Önátfedések:</span>{" "}
                            {analysis.intersections.selfIntersections}
                          </li>
                          <li>
                            <span className="font-medium text-slate-600">Vékony fal minták:</span>{" "}
                            {formatPercentage(analysis.intersections.thinWallPercentage)} (min.
                            vastagság:{" "}
                            {Number.isFinite(analysis.intersections.minWallThicknessMm)
                              ? `${formatNumber(analysis.intersections.minWallThicknessMm, 2)} mm`
                              : "n.a."}
                            )
                          </li>
                        </>
                      ) : null}
                      {analysis.overhangs ? (
                        <li>
                          <span className="font-medium text-slate-600">
                            Támaszt igénylő felület:
                          </span>{" "}
                          {formatPercentage(analysis.overhangs.percentage)}
                        </li>
                      ) : null}
                      <li>
                        <span className="font-medium text-slate-600">Normál orientáció:</span>{" "}
                        {analysis.normalsFlipped ? "Javítva" : "Rendben"}
                      </li>
                    </ul>
                  </div>
                </div>

                {hasWarnings ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-800">
                    <h4 className="text-base font-semibold">Figyelmeztetések</h4>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      {analysis.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
        {status.message ? (
          <div
            className={[
              "mt-4 rounded-lg border p-4 text-sm",
              status.type === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : status.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : status.type === "warning"
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-sky-200 bg-sky-50 text-sky-700",
            ].join(" ")}
          >
            {status.message}
          </div>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="neon-panel rounded-lg p-5 shadow-lg backdrop-blur md:p-6">
        <h2 className="text-2xl font-semibold text-sky-900">2. Kapcsolati adatok megadása</h2>
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
    </div>
  );
}

export default function Ajanlatkeres() {
  const [requestType, setRequestType] = useState("");

  return (
    <div className="neon-page flex min-h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 flex-col items-center px-4 py-10 md:py-14">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="neon-heading text-4xl font-extrabold md:text-5xl">
            Online ajánlatkérés 3D nyomtatáshoz
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Válassz saját 3D modell feltöltése és előre elkészített modell között.
          </p>
        </div>
        <section className="mt-10 w-full">
          {!requestType ? <QuoteTypeChooser onSelect={setRequestType} /> : null}

          {requestType === "custom" ? (
            <div className="space-y-6">
              <div className="mx-auto flex w-full max-w-5xl justify-start">
                <button
                  type="button"
                  onClick={() => setRequestType("")}
                  className="neon-button-secondary rounded-md px-4 py-2 text-sm"
                >
                  Vissza
                </button>
              </div>
              <QuoteCalculator />
            </div>
          ) : null}

          {requestType === "premade" ? (
            <PremadeModelCatalog onBack={() => setRequestType("")} />
          ) : null}
        </section>
      </main>
      <Footer />
    </div>
  );
}


