import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, extend, useFrame, useLoader, useThree } from "@react-three/fiber";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  FILAMENT_ORDER,
  MAX_DIMENSION_CM,
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

function ModelPreview({ file, analysis, scaledSizeCm }) {
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
  const viewerScale = analysis.previewScale ?? 0.1;

  return (
    <div className="flex flex-col gap-3">
      <div className="h-80 w-full overflow-hidden rounded-xl border border-sky-100 bg-slate-900/95">
        <Canvas camera={{ position: [0, 0, 12], fov: 60 }} shadows>
          <color attach="background" args={["#0f172a"]} />
          <ambientLight intensity={0.6} />
          <directionalLight intensity={0.9} position={[12, 16, 10]} castShadow />
          <Suspense fallback={null}>
            <FitCamera bounds={bounds} />
            {showBoundingBox ? (
              <StepPreview sizeCm={analysis.sizeCm} />
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
          STEP fÃ¡jlok esetÃ©n becsÃ¼lt mÃ©ret alapjÃ¡n megjelenÃ­tett hatÃ¡rolÃ³ doboz lÃ¡thatÃ³.
        </p>
      ) : (
        <p className="text-xs text-slate-500">
          A modell elÅ‘nÃ©zetÃ©ben szabadon forgathatod Ã©s nagyÃ­thatod a fÃ¡jlt.
        </p>
      )}
    </div>
  );
}

const UNIT_PRESETS = [
  { value: "mm", label: "MillimÃ©ter (mm)", toMillimeter: 1 },
  { value: "cm", label: "CentimÃ©ter (cm)", toMillimeter: 10 },
  { value: "m", label: "MÃ©ter (m)", toMillimeter: 1000 },
  { value: "inch", label: "HÃ¼velyk (inch)", toMillimeter: 25.4 },
];

function formatNumber(value, fractionDigits = 2) {
  if (!Number.isFinite(value)) {
    return "â€”";
  }
  return new Intl.NumberFormat("hu-HU", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

function formatCurrency(value) {
  if (!Number.isFinite(value)) {
    return "â€”";
  }
  return new Intl.NumberFormat("hu-HU", {
    style: "currency",
    currency: "HUF",
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

function formatMass(value) {
  if (!Number.isFinite(value)) {
    return "â€”";
  }
  return `${formatNumber(value, 1)} g`;
}

function formatPricePerGram(value) {
  if (!Number.isFinite(value)) {
    return "â€”";
  }
  return `${formatNumber(value, 0)} Ft/g`;
}

function formatDimensionArray(values) {
  if (!values?.length) {
    return "â€”";
  }
  return values.map((value) => `${formatNumber(value, 2)} cm`).join(" Ã— ");
}

function formatPercentage(value) {
  if (!Number.isFinite(value)) {
    return "â€”";
  }
  return `${formatNumber(value, 1)}%`;
}

function QuoteCalculator() {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [baseAnalysis, setBaseAnalysis] = useState(null);
  const [unitOverride, setUnitOverride] = useState("auto");
  const [selectedFilament, setSelectedFilament] = useState(FILAMENT_ORDER[0].key);
  const [status, setStatus] = useState({ type: "info", message: "" });
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    message: "",
  });

  const quote = useMemo(() => {
    if (!analysis) {
      return null;
    }
    return calculateQuote({ analysis, filamentKey: selectedFilament });
  }, [analysis, selectedFilament]);

  const scaledSizeCm = useMemo(() => {
    if (quote?.scaledSizeCm?.length) {
      return quote.scaledSizeCm;
    }
    if (analysis?.sizeCm?.length) {
      return analysis.sizeCm;
    }
    return null;
  }, [analysis, quote]);

  const selectedMaterial = useMemo(
    () => FILAMENT_ORDER.find((item) => item.key === selectedFilament) ?? FILAMENT_ORDER[0],
    [selectedFilament]
  );

  const detectedUnitLabel = baseAnalysis?.detectedUnit ?? analysis?.detectedUnit ?? "";

  const rawDimensionsText = formatDimensionArray(analysis?.sizeCm);
  const scaledDimensionsText = formatDimensionArray(scaledSizeCm);
  const hasWarnings = Boolean(analysis?.warnings?.length);

  async function handleFileChange(event) {
    const selectedFile = event.target.files?.[0];
    setAnalysis(null);
    setBaseAnalysis(null);
    setUnitOverride("auto");
    if (!selectedFile) {
      setFile(null);
      setStatus({ type: "info", message: "" });
      return;
    }
    if (selectedFile.size > 50 * 1024 * 1024) {
      setStatus({
        type: "error",
        message: "Legfeljebb 50 MB mÃ©retÅ± fÃ¡jl tÃ¶lthetÅ‘ fel.",
      });
      setFile(null);
      return;
    }
    setLoading(true);
    setStatus({ type: "info", message: "A fÃ¡jl feldolgozÃ¡sa folyamatban..." });
    try {
      const result = await analyze3DFile(selectedFile);
      setFile(selectedFile);
      setBaseAnalysis(result);
      setAnalysis(result);
      const messageParts = ["A fÃ¡jl sikeresen ellenÅ‘rizve."];
      const recommendedScale = result.autoScale?.recommendedScale;
      if (Number.isFinite(recommendedScale) && recommendedScale < 1) {
        messageParts.push(
          `A modell nagyobb a ${MAX_DIMENSION_CM} cm-es nyomtatÃ¡si tÃ©rnÃ©l, ${formatNumber(
            recommendedScale * 100,
            0
          )}% mÃ©retarÃ¡nyt javaslunk. KÃ©rjÃ¼k, jelezd a kÃ­vÃ¡nt mÃ©retet az Ã¼zenetben.`
        );
      }
      if (result.warnings?.length) {
        messageParts.push("EllenÅ‘rizd a lenti figyelmeztetÃ©seket a gyÃ¡rtÃ¡s elÅ‘tt.");
      }
      if (result.detectedUnit) {
        messageParts.push(`FeltÃ©telezett egysÃ©g: ${result.detectedUnit}.`);
      }
      setStatus({
        type: result.warnings?.length ? "warning" : "success",
        message: messageParts.join(" "),
      });
    } catch (error) {
      console.error(error);
      setFile(null);
      setAnalysis(null);
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Ismeretlen hiba tÃ¶rtÃ©nt a fÃ¡jl feldolgozÃ¡sa sorÃ¡n.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleUnitOverrideChange(event) {
    const { value } = event.target;
    setUnitOverride(value);
    if (!file) {
      return;
    }
    if (value === "auto") {
      if (baseAnalysis) {
        setAnalysis(baseAnalysis);
        const messageParts = ["Automatikus egysÃ©gfelismerÃ©s alkalmazva."];
        if (baseAnalysis.detectedUnit) {
          messageParts.push(`FeltÃ©telezett egysÃ©g: ${baseAnalysis.detectedUnit}.`);
        }
        if (baseAnalysis.warnings?.length) {
          messageParts.push("EllenÅ‘rizd a lenti figyelmeztetÃ©seket a gyÃ¡rtÃ¡s elÅ‘tt.");
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
      message: `${preset.label} feltÃ©telezÃ©sÃ©vel ÃºjraÃ©rtÃ©keljÃ¼k a modellt...`,
    });

    try {
      const result = await analyze3DFile(file, { unitOverride: preset });
      setAnalysis(result);
      const messageParts = [`${preset.label} feltÃ©telezÃ©sÃ©vel ÃºjraÃ©rtÃ©keltÃ¼k a modellt.`];
      if (result.autoScale?.recommendedScale < 1) {
        messageParts.push(
          `A modell nagyobb a ${MAX_DIMENSION_CM} cm-es nyomtatÃ¡si tÃ©rnÃ©l, ${formatNumber(
            result.autoScale.recommendedScale * 100,
            0
          )}% mÃ©retarÃ¡nyt javaslunk.`
        );
      }
      if (result.warnings?.length) {
        messageParts.push("EllenÅ‘rizd a lenti figyelmeztetÃ©seket a gyÃ¡rtÃ¡s elÅ‘tt.");
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
            : "Ismeretlen hiba tÃ¶rtÃ©nt a fÃ¡jl ÃºjraelemzÃ©se sorÃ¡n.",
      });
    } finally {
      setLoading(false);
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
    if (!formData.name || !formData.email || !formData.address) {
      setStatus({
        type: "error",
        message: "Add meg a neved, e-mail címed és címed a folytatáshoz.",
      });
      return;
    }

    const payload = new FormData();
    payload.append("file", file);
    payload.append("name", formData.name.trim());
    payload.append("email", formData.email.trim());
    payload.append("address", formData.address.trim());
    payload.append("message", formData.message.trim());
    payload.append("selectedMaterial", JSON.stringify(selectedMaterial));
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
      setUnitOverride("auto");
      setFile(null);
      setAnalysis(null);
      setBaseAnalysis(null);
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
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="rounded-2xl bg-white/80 p-6 shadow-lg backdrop-blur">
        <h2 className="text-2xl font-semibold text-sky-900">1. Modell feltÃ¶ltÃ©se</h2>
        <p className="mt-2 text-sm text-slate-600">
          TÃ¶lts fel STL, STEP, OBJ vagy GLTF/GLB fÃ¡jlt. A rendszer automatikusan ellenÅ‘rzi, hogy a
          modell belefÃ©r-e a {MAX_DIMENSION_CM} Ã— {MAX_DIMENSION_CM} Ã— {MAX_DIMENSION_CM} cm-es
          nyomtatÃ¡si tÃ©rbe Ã©s feltÃ¡rja az esetleges problÃ©mÃ¡kat.
        </p>
        <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-sky-300 bg-sky-50/40 p-6 text-center text-sky-700 transition hover:border-sky-500 hover:bg-sky-100">
          <input
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
            {file ? file.name : "Kattints vagy hÃºzd ide a fÃ¡jlt"}
          </span>
          <span className="mt-1 text-xs text-slate-500">
            Maximum 50 MB, STL / STEP / OBJ / GLTF / GLB formÃ¡tumok
          </span>
        </label>
        {loading ? <p className="mt-4 text-sm text-slate-600">FeldolgozÃ¡s...</p> : null}
        {analysis ? (
          <div className="mt-6 space-y-6">
            <ModelPreview file={file} analysis={analysis} scaledSizeCm={scaledSizeCm} />

            <div>
              <h3 className="text-lg font-semibold text-sky-900">Filament kivÃ¡lasztÃ¡sa</h3>
              <p className="mt-1 text-sm text-slate-600">
                VÃ¡laszd ki a felhasznÃ¡lÃ¡si cÃ©lnak megfelelÅ‘ alapanyagot â€“ a kÃ¶ltsÃ©gbecslÃ©s azonnal
                frissÃ¼l.
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {FILAMENT_ORDER.map((material) => {
                  const isActive = material.key === selectedFilament;
                  return (
                    <button
                      key={material.key}
                      type="button"
                      onClick={() => setSelectedFilament(material.key)}
                      className={[
                        "flex h-full flex-col rounded-xl border p-4 text-left transition",
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
                    </button>
                  );
                })}
              </div>
            </div>

            {quote ? (
              <div className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-4 shadow-sm">
                    <h3 className="text-lg font-semibold text-sky-900">Modell adatai</h3>
                    <dl className="mt-3 space-y-2 text-sm text-slate-700">
                      <div>
                        <dt className="font-medium text-slate-600">Eredeti mÃ©ret</dt>
                        <dd>{rawDimensionsText}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-slate-600">SkÃ¡lÃ¡zott mÃ©ret</dt>
                        <dd>{scaledDimensionsText}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-slate-600">TÃ©rfogat</dt>
                        <dd>{formatNumber(quote.scaledVolumeCm3, 2)} cmÂ³</dd>
                      </div>
                      {Number.isFinite(quote.scaledSurfaceAreaCm2) ? (
                        <div>
                          <dt className="font-medium text-slate-600">FelÃ¼let</dt>
                          <dd>{formatNumber(quote.scaledSurfaceAreaCm2, 2)} cmÂ²</dd>
                        </div>
                      ) : null}
                      <div>
                        <dt className="font-medium text-slate-600">BecsÃ¼lt tÃ¶meg</dt>
                        <dd>{formatMass(quote.massGrams)}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-slate-600">FÃ¡jl egysÃ©ge</dt>
                        <dd>
                          <div className="mt-1 space-y-1">
                            <select
                              value={unitOverride}
                              onChange={handleUnitOverrideChange}
                              disabled={loading || sending}
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                            >
                              <option value="auto">
                                Automatikus felismerÃ©s
                                {detectedUnitLabel ? ` (${detectedUnitLabel})` : ""}
                              </option>
                              {UNIT_PRESETS.map((preset) => (
                                <option key={preset.value} value={preset.value}>
                                  {preset.label}
                                </option>
                              ))}
                            </select>
                            <p className="text-xs text-slate-500">
                              Alkalmazott egysÃ©g: {analysis.rawUnit}
                            </p>
                            {detectedUnitLabel ? (
                              <p className="text-xs text-slate-500">
                                Automatikusan Ã©rzÃ©kelt egysÃ©g: {detectedUnitLabel}
                              </p>
                            ) : null}
                          </div>
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4 shadow-sm">
                    <h3 className="text-lg font-semibold text-emerald-800">KÃ¶ltsÃ©gbecslÃ©s</h3>
                    <p className="mt-1 text-sm text-emerald-700">
                      {selectedMaterial.label} alapanyag â€“ {selectedMaterial.temperature}
                    </p>
                    {Number.isFinite(quote.materialPricePerGram) ? (
                      <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                        {formatPricePerGram(quote.materialPricePerGram)}
                      </p>
                    ) : null}
                    <ul className="mt-3 space-y-1 text-sm text-emerald-800">
                      <li>BecsÃ¼lt nyomtatÃ¡si idÅ‘: {formatNumber(quote.hours, 2)} Ã³ra</li>
                      <li>AnyagkÃ¶ltsÃ©g: {formatCurrency(quote.materialCost)}</li>
                      <li>GÃ©pidÅ‘ kÃ¶ltsÃ©g: {formatCurrency(quote.machineCost)}</li>
                      <li>FelÃ¼let utÃ³munka: {formatCurrency(quote.finishingCost)}</li>
                      <li>SzolgÃ¡ltatÃ¡si alapdÃ­j: {formatCurrency(quote.serviceFee)}</li>
                      <li className="pt-2 text-base font-semibold text-emerald-900">
                        Ã–sszesen: {formatCurrency(quote.total)}
                      </li>
                    </ul>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                    <h3 className="text-lg font-semibold text-sky-900">EllenÅ‘rzÃ©si eredmÃ©nyek</h3>
                    <ul className="mt-3 space-y-2 text-sm text-slate-700">
                      <li>
                        <span className="font-medium text-slate-600">ZÃ¡rtsÃ¡g:</span>{" "}
                        {analysis.manifold?.isWatertight === false
                          ? "Nem zÃ¡rt felÃ¼let"
                          : analysis.manifold?.isWatertight === true
                            ? "Rendben"
                            : "Nem Ã¡ll rendelkezÃ©sre adat"}
                      </li>
                      {Number.isFinite(analysis.manifold?.nonManifoldEdges) ? (
                        <li>
                          <span className="font-medium text-slate-600">Nem-manifold Ã©lek:</span>{" "}
                          {analysis.manifold.nonManifoldEdges}
                        </li>
                      ) : null}
                      {analysis.intersections ? (
                        <>
                          <li>
                            <span className="font-medium text-slate-600">Ã–nÃ¡tfedÃ©sek:</span>{" "}
                            {analysis.intersections.selfIntersections}
                          </li>
                          <li>
                            <span className="font-medium text-slate-600">VÃ©kony fal mintÃ¡k:</span>{" "}
                            {formatPercentage(analysis.intersections.thinWallPercentage)} (min.
                            vastagsÃ¡g:{" "}
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
                            TÃ¡maszt igÃ©nylÅ‘ felÃ¼let:
                          </span>{" "}
                          {formatPercentage(analysis.overhangs.percentage)}
                        </li>
                      ) : null}
                      <li>
                        <span className="font-medium text-slate-600">NormÃ¡l orientÃ¡ciÃ³:</span>{" "}
                        {analysis.normalsFlipped ? "JavÃ­tva" : "Rendben"}
                      </li>
                    </ul>
                  </div>
                </div>

                {hasWarnings ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-800">
                    <h4 className="text-base font-semibold">FigyelmeztetÃ©sek</h4>
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
              "mt-4 rounded-xl border p-4 text-sm",
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

      <form onSubmit={handleSubmit} className="rounded-2xl bg-white/80 p-6 shadow-lg backdrop-blur">
        <h2 className="text-2xl font-semibold text-sky-900">2. Kapcsolati adatok megadÃ¡sa</h2>
        <p className="mt-2 text-sm text-slate-600">
          Add meg az elÃ©rhetÅ‘sÃ©gedet, hogy kollÃ©gÃ¡nk felvehessen veled a kapcsolatot.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="flex flex-col text-sm font-medium text-slate-700">
            NÃ©v
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="mt-1 rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-slate-800 focus:border-sky-400 focus:outline-none"
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
              className="mt-1 rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-slate-800 focus:border-sky-400 focus:outline-none"
              required
            />
          </label>
        </div>
        <label className="mt-4 flex flex-col text-sm font-medium text-slate-700">
          SzÃ¡mlÃ¡zÃ¡si cÃ­m
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            className="mt-1 rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-slate-800 focus:border-sky-400 focus:outline-none"
            required
          />
        </label>
        <label className="mt-4 flex flex-col text-sm font-medium text-slate-700">
          MegjegyzÃ©s (opcionÃ¡lis)
          <textarea
            name="message"
            rows={4}
            value={formData.message}
            onChange={handleInputChange}
            className="mt-1 rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-slate-800 focus:border-sky-400 focus:outline-none"
            placeholder="RÃ¶viden Ã­rd le az elvÃ¡rÃ¡saidat, anyagtÃ­pust, hatÃ¡ridÅ‘t."
          />
        </label>
        <button
          type="submit"
          disabled={sending}
          className={[
            "mt-6 inline-flex items-center justify-center rounded-lg px-6 py-3 font-semibold text-white transition",
            sending ? "cursor-not-allowed bg-red-400" : "bg-red-600 hover:bg-red-500",
          ].join(" ")}
        >
          {sending ? "KÃ¼ldÃ©s folyamatban..." : "AjÃ¡nlatkÃ©rÃ©s elkÃ¼ldÃ©se"}
        </button>
      </form>
    </div>
  );
}

export default function Ajanlatkeres() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-sky-50 via-white to-sky-100">
      <Navbar />
      <main className="flex flex-1 flex-col items-center px-4 py-12">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="text-4xl font-extrabold text-sky-900 md:text-5xl">
            Online ajÃ¡nlatkÃ©rÃ©s 3D nyomtatÃ¡shoz
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            TÃ¶ltsd fel a modelled, ellenÅ‘rizd a gyÃ¡rtÃ¡si paramÃ©tereket Ã©s kÃ¼ldd el nekÃ¼nk a
            rÃ©szleteket nÃ©hÃ¡ny kattintÃ¡ssal.
          </p>
        </div>
        <section className="mt-10 w-full">
          <QuoteCalculator />
        </section>
      </main>
      <Footer />
    </div>
  );
}


