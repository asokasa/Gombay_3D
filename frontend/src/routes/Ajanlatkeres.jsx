import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, extend, useFrame, useLoader, useThree } from "@react-three/fiber";
import { useQuery } from "@tanstack/react-query";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { PremadeModelCard, PremadeModelRequestForm } from "../components/PremadeModelRequest";
import { buildPremadeModelList } from "../lib/premadeModels";
import {
  FILAMENT_ORDER,
  PRINT_PROFILE_ORDER,
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
import {
  AdditiveBlending,
  Box3,
  BoxGeometry,
  DoubleSide,
  Euler,
  Matrix4,
  MeshStandardMaterial,
  Vector3,
} from "three";

extend({ OrbitControls });

const DEFAULT_MODEL_COLOR = "#38bdf8";
const CANVAS_BACKGROUND_COLOR = "#00A3E8";
const BUILD_PLATE_COLOR = "#006EA8";
const BUILD_VOLUME_SCENE_SIZE = 12;
const SCENE_UNITS_PER_CM = BUILD_VOLUME_SCENE_SIZE / MAX_DIMENSION_CM;
const BUILD_VOLUME_CM = [MAX_DIMENSION_CM, MAX_DIMENSION_CM, MAX_DIMENSION_CM];
const FIT_EDGE_COLOR = "#00b85f";
const FIT_EDGE_GLOW_COLOR = "#28ff8f";
const FAIL_EDGE_COLOR = "#ff3355";
const DEFAULT_MODEL_ROTATION = { x: 0, y: 0, z: 0 };
const SIZE_AXIS_LABELS = [
  ["x", "X"],
  ["y", "Y"],
  ["z", "Z"],
];
const ROTATION_AXIS_LABELS = SIZE_AXIS_LABELS;

function getRotatedBoundsInfoCm(sizeCm = [], rotationDegrees = DEFAULT_MODEL_ROTATION) {
  const [x = 0, y = 0, z = 0] = sizeCm;
  const halfDimensions = [
    Math.max(0, Number(x) || 0) / 2,
    Math.max(0, Number(y) || 0) / 2,
    Math.max(0, Number(z) || 0) / 2,
  ];
  const matrix = new Matrix4().makeRotationFromEuler(
    new Euler(
      ((Number(rotationDegrees.x) || 0) * Math.PI) / 180,
      ((Number(rotationDegrees.y) || 0) * Math.PI) / 180,
      ((Number(rotationDegrees.z) || 0) * Math.PI) / 180,
      "XYZ"
    )
  );
  const min = new Vector3(Infinity, Infinity, Infinity);
  const max = new Vector3(-Infinity, -Infinity, -Infinity);
  const point = new Vector3();

  [-1, 1].forEach((xDirection) => {
    [-1, 1].forEach((yDirection) => {
      [-1, 1].forEach((zDirection) => {
        point
          .set(
            xDirection * halfDimensions[0],
            yDirection * halfDimensions[1],
            zDirection * halfDimensions[2]
          )
          .applyMatrix4(matrix);
        min.min(point);
        max.max(point);
      });
    });
  });

  if (!Number.isFinite(min.x) || !Number.isFinite(max.x)) {
    return {
      size: [0, 0, 0],
      min: [0, 0, 0],
      max: [0, 0, 0],
    };
  }

  return {
    size: [max.x - min.x, max.y - min.y, max.z - min.z],
    min: [min.x, min.y, min.z],
    max: [max.x, max.y, max.z],
  };
}

function getRotatedBoundsCm(sizeCm = [], rotationDegrees = DEFAULT_MODEL_ROTATION) {
  return getRotatedBoundsInfoCm(sizeCm, rotationDegrees).size;
}

function getFitsBuildVolume(sizeCm = []) {
  return BUILD_VOLUME_CM.every((limit, index) => (Number(sizeCm[index]) || 0) <= limit + 0.001);
}

function getInitialScalePercent(analysisResult) {
  const recommendedScale = analysisResult?.autoScale?.recommendedScale;
  const scale = Number.isFinite(recommendedScale) && recommendedScale > 0 ? recommendedScale : 1;
  return Math.round(Math.min(2, Math.max(0.05, scale)) * 100);
}

function clampNumber(value, min, max, fallback) {
  const parsed = Number(String(value).replace(",", "."));
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, parsed));
}

function getInitialSizeCm(analysisResult) {
  const scale = getInitialScalePercent(analysisResult) / 100;
  return (analysisResult?.sizeCm ?? []).map((value) => Number(value) * scale);
}

function getBestPrintableRotation(sizeCm = []) {
  const dimensions = sizeCm.map((value) => Math.max(0, Number(value) || 0));
  if (dimensions.length < 3 || dimensions.every((value) => value === 0)) {
    return DEFAULT_MODEL_ROTATION;
  }

  const shortestAxisIndex = dimensions.indexOf(Math.min(...dimensions));
  if (shortestAxisIndex === 0) {
    return { x: 0, y: 0, z: 90 };
  }
  if (shortestAxisIndex === 2) {
    return { x: 90, y: 0, z: 0 };
  }
  return DEFAULT_MODEL_ROTATION;
}

function getAxisScaleFactors(originalSizeCm = [], targetSizeCm = []) {
  return [0, 1, 2].map((index) => {
    const original = Number(originalSizeCm[index]);
    const target = Number(targetSizeCm[index]);
    if (!Number.isFinite(original) || original <= 0 || !Number.isFinite(target)) {
      return 1;
    }
    return Math.max(0.001, target / original);
  });
}

function getAverageScalePercent(originalSizeCm = [], targetSizeCm = []) {
  const scaleFactors = getAxisScaleFactors(originalSizeCm, targetSizeCm);
  const averageScale = scaleFactors.reduce((sum, value) => sum + value, 0) / scaleFactors.length;
  return Math.round(Math.min(2, Math.max(0.05, averageScale)) * 100);
}

function resizeAnalysisForModel(analysis, targetSizeCm) {
  if (!analysis || !targetSizeCm?.length) {
    return analysis;
  }

  const scaleFactors = getAxisScaleFactors(analysis.sizeCm, targetSizeCm);
  const [scaleX, scaleY, scaleZ] = scaleFactors;
  const volumeScale = scaleX * scaleY * scaleZ;
  const surfaceScale = (scaleX * scaleY + scaleX * scaleZ + scaleY * scaleZ) / 3;
  const sizeMm = targetSizeCm.map((value) => value * 10);

  return {
    ...analysis,
    sizeCm: targetSizeCm,
    sizeMm,
    volumeCm3: Number.isFinite(analysis.volumeCm3) ? analysis.volumeCm3 * volumeScale : 0,
    volumeMm3: Number.isFinite(analysis.volumeMm3) ? analysis.volumeMm3 * volumeScale : 0,
    surfaceAreaCm2: Number.isFinite(analysis.surfaceAreaCm2)
      ? analysis.surfaceAreaCm2 * surfaceScale
      : analysis.surfaceAreaCm2,
    surfaceAreaMm2: Number.isFinite(analysis.surfaceAreaMm2)
      ? analysis.surfaceAreaMm2 * surfaceScale
      : analysis.surfaceAreaMm2,
    autoScale: {
      ...(analysis.autoScale ?? {}),
      recommendedScale: 1,
      maxAllowableScale: getFitsBuildVolume(targetSizeCm)
        ? 1
        : Math.min(
            ...targetSizeCm.map((value, index) => BUILD_VOLUME_CM[index] / Math.max(0.001, value))
          ),
      scaledSizeCm: targetSizeCm,
    },
    resize: {
      originalSizeCm: analysis.sizeCm,
      targetSizeCm,
      scaleFactors,
    },
  };
}

function CameraControls({ targetY = 0 }) {
  const controls = useRef(null);
  const { camera, gl } = useThree();
  useEffect(() => {
    if (!controls.current) return;
    controls.current.target.set(0, targetY, 0);
    controls.current.update();
  }, [targetY]);
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

function FitCamera({ sceneExtent, targetY = 0 }) {
  const { camera } = useThree();
  useEffect(() => {
    const maxDimension = Math.max(1, sceneExtent);
    const distance = Math.max(4, maxDimension * 1.8);
    camera.position.set(distance, targetY + distance * 0.72, distance);
    camera.near = 0.1;
    camera.far = Math.max(500, distance * 6);
    camera.lookAt(0, targetY, 0);
    camera.updateProjectionMatrix();
  }, [camera, sceneExtent, targetY]);
  return null;
}

function StlModel({ url, viewerScale, modelColor }) {
  const geometry = useLoader(STLLoader, url);
  useEffect(() => {
    geometry.center();
    geometry.computeVertexNormals();
  }, [geometry]);
  return (
    <mesh geometry={geometry} scale={viewerScale} castShadow receiveShadow>
      <meshStandardMaterial color={modelColor} metalness={0.2} roughness={0.6} />
    </mesh>
  );
}

function ObjModel({ url, viewerScale, modelColor }) {
  const object = useLoader(OBJLoader, url);
  useEffect(() => {
    object.traverse((child) => {
      if (child.isMesh) {
        child.geometry.center();
      }
    });
    const box = new Box3().setFromObject(object);
    const center = box.getCenter(new Vector3());
    object.position.sub(center);
  }, [object]);

  useEffect(() => {
    const material = new MeshStandardMaterial({
      color: modelColor,
      metalness: 0.15,
      roughness: 0.65,
      side: DoubleSide,
    });
    object.traverse((child) => {
      if (child.isMesh) {
        child.material = material;
      }
    });
    return () => {
      material.dispose();
    };
  }, [modelColor, object]);

  return <primitive object={object} scale={viewerScale} />;
}

function GltfModel({ url, viewerScale, modelColor }) {
  const gltf = useLoader(GLTFLoader, url);
  const scene = useMemo(() => gltf.scene.clone(true), [gltf]);
  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.geometry.computeVertexNormals();
      }
    });
    const box = new Box3().setFromObject(scene);
    const center = box.getCenter(new Vector3());
    scene.position.sub(center);
  }, [scene]);

  useEffect(() => {
    const material = new MeshStandardMaterial({
      color: modelColor,
      metalness: 0.2,
      roughness: 0.6,
      side: DoubleSide,
    });
    scene.traverse((child) => {
      if (child.isMesh) {
        child.material = material;
      }
    });
    return () => {
      material.dispose();
    };
  }, [modelColor, scene]);

  return <primitive object={scene} scale={viewerScale} />;
}

function StepPreview({ sizeCm, modelColor }) {
  const [x = 0, y = 0, z = 0] = sizeCm ?? [];
  const safeX = (x || 1) * SCENE_UNITS_PER_CM;
  const safeY = (y || 1) * SCENE_UNITS_PER_CM;
  const safeZ = (z || 1) * SCENE_UNITS_PER_CM;
  return (
    <mesh scale={[safeX, safeY, safeZ]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={modelColor} transparent opacity={0.4} wireframe />
    </mesh>
  );
}

function BuildVolumeCuboid({ fitsBuildVolume }) {
  const edgeColor = fitsBuildVolume ? FIT_EDGE_COLOR : FAIL_EDGE_COLOR;
  const buildVolumeSceneSize = BUILD_VOLUME_CM.map((value) => value * SCENE_UNITS_PER_CM);
  const [width, height, depth] = buildVolumeSceneSize;
  const edgeGeometry = useMemo(() => new BoxGeometry(width, height, depth), [depth, height, width]);

  return (
    <group position={[0, height / 2, 0]}>
      <mesh position={[0, -height / 2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color={BUILD_PLATE_COLOR} roughness={0.82} metalness={0.04} />
      </mesh>
      <mesh>
        <boxGeometry args={buildVolumeSceneSize} />
        <meshBasicMaterial
          color={edgeColor}
          transparent
          opacity={0.045}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[edgeGeometry]} />
        <lineBasicMaterial color={edgeColor} transparent opacity={1} linewidth={2} />
      </lineSegments>
      <lineSegments scale={1.01}>
        <edgesGeometry args={[edgeGeometry]} />
        <lineBasicMaterial
          color={fitsBuildVolume ? FIT_EDGE_GLOW_COLOR : edgeColor}
          transparent
          opacity={0.52}
          linewidth={4}
        />
      </lineSegments>
      <lineSegments scale={1.028}>
        <edgesGeometry args={[edgeGeometry]} />
        <lineBasicMaterial
          color={fitsBuildVolume ? FIT_EDGE_GLOW_COLOR : edgeColor}
          transparent
          opacity={0.24}
          linewidth={8}
        />
      </lineSegments>
    </group>
  );
}

function ModelPreview({
  file,
  analysis,
  modelSizeCm,
  axisScaleFactors,
  modelRotation = DEFAULT_MODEL_ROTATION,
  rotatedSizeCm,
  fitsBuildVolume = true,
  modelColor = DEFAULT_MODEL_COLOR,
}) {
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
  const showBoundingBox = extension === "step" || extension === "stp";
  const safeAxisScaleFactors = axisScaleFactors?.length ? axisScaleFactors : [1, 1, 1];
  const meshBaseScale = (analysis?.unitScaleToCm ?? 0.1) * SCENE_UNITS_PER_CM;
  const meshScale = safeAxisScaleFactors.map((value) => meshBaseScale * value);
  const objectRotation = [
    ((Number(modelRotation.x) || 0) * Math.PI) / 180,
    ((Number(modelRotation.y) || 0) * Math.PI) / 180,
    ((Number(modelRotation.z) || 0) * Math.PI) / 180,
  ];
  const previewSizeCm = modelSizeCm?.length ? modelSizeCm : analysis?.sizeCm;
  const rotatedBoundsInfo = useMemo(
    () => getRotatedBoundsInfoCm(previewSizeCm ?? [], modelRotation),
    [modelRotation, previewSizeCm]
  );
  const objectFloorOffsetScene = -rotatedBoundsInfo.min[1] * SCENE_UNITS_PER_CM;
  const objectCenterYScene =
    objectFloorOffsetScene +
    ((rotatedBoundsInfo.min[1] + rotatedBoundsInfo.max[1]) / 2) * SCENE_UNITS_PER_CM;
  const sceneExtent = Math.max(
    BUILD_VOLUME_SCENE_SIZE,
    ...((rotatedSizeCm?.length ? rotatedSizeCm : BUILD_VOLUME_CM).map(
      (value) => value * SCENE_UNITS_PER_CM
    ) ?? [])
  );
  const cameraTargetY = objectCenterYScene;

  if (!file || !analysis) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="mx-auto aspect-square w-full max-w-[28rem] overflow-hidden rounded-lg border border-sky-100 bg-sky-100 shadow-[0_0_26px_rgba(0,149,255,0.18)]">
        <Canvas camera={{ position: [0, 0, 12], fov: 60 }} shadows>
          <color attach="background" args={[CANVAS_BACKGROUND_COLOR]} />
          <ambientLight intensity={0.6} />
          <directionalLight intensity={0.9} position={[12, 16, 10]} castShadow />
          <BuildVolumeCuboid fitsBuildVolume={fitsBuildVolume} />
          <Suspense fallback={null}>
            <FitCamera sceneExtent={sceneExtent} targetY={cameraTargetY} />
            <group position={[0, objectFloorOffsetScene, 0]} rotation={objectRotation}>
              {showBoundingBox ? (
                <StepPreview sizeCm={modelSizeCm ?? analysis.sizeCm} modelColor={modelColor} />
              ) : extension === "obj" ? (
                objectUrl ? (
                  <ObjModel url={objectUrl} viewerScale={meshScale} modelColor={modelColor} />
                ) : null
              ) : extension === "gltf" || extension === "glb" ? (
                objectUrl ? (
                  <GltfModel url={objectUrl} viewerScale={meshScale} modelColor={modelColor} />
                ) : null
              ) : objectUrl ? (
                <StlModel url={objectUrl} viewerScale={meshScale} modelColor={modelColor} />
              ) : null}
            </group>
          </Suspense>
          <CameraControls targetY={cameraTargetY} />
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

const INFILL_PERCENT_OPTIONS = Array.from({ length: 21 }, (_item, index) => index * 5);
const DEFAULT_INFILL_PERCENT = 20;
const DEFAULT_PRINT_PROFILE_KEY = PRINT_PROFILE_ORDER[0].key;
const MAX_PRINT_QUANTITY = 999;

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

function formatPrintTime(hours) {
  if (!Number.isFinite(hours)) {
    return "-";
  }
  const totalMinutes = Math.max(1, Math.round(hours * 60));
  const hourValue = Math.floor(totalMinutes / 60);
  const minuteValue = totalMinutes % 60;
  if (!hourValue) {
    return `${minuteValue} perc`;
  }
  return minuteValue ? `${hourValue} óra ${minuteValue} perc` : `${hourValue} óra`;
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
  const [selectedModel, setSelectedModel] = useState(null);
  const premadeModelsQuery = useQuery({
    queryKey: ["premade-models"],
    queryFn: () => api("/premade-models"),
    retry: false,
  });
  const models = buildPremadeModelList(premadeModelsQuery.data?.items ?? []);

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
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          Az admin modellek nem érhetők el, ezért az alapértelmezett modellek láthatók.
        </p>
      ) : null}

      {!premadeModelsQuery.isLoading && models.length === 0 ? (
        <p className="neon-panel rounded-lg p-5 text-sm text-slate-500">
          Jelenleg nincs feltöltött előre elkészített modell.
        </p>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {models.map((model) => (
          <PremadeModelCard
            key={model.id}
            model={model}
            isSelected={selectedModel?.id === model.id}
            onSelect={setSelectedModel}
          />
        ))}
      </div>

      {selectedModel ? (
        <PremadeModelRequestForm model={selectedModel} onBack={() => setSelectedModel(null)} />
      ) : null}
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
  const [selectedPrintProfileKey, setSelectedPrintProfileKey] = useState(DEFAULT_PRINT_PROFILE_KEY);
  const [selectedInfillPercent, setSelectedInfillPercent] = useState(DEFAULT_INFILL_PERCENT);
  const [printQuantity, setPrintQuantity] = useState(1);
  const [modelScalePercent, setModelScalePercent] = useState(100);
  const [modelSizeCm, setModelSizeCm] = useState(null);
  const [modelRotation, setModelRotation] = useState(DEFAULT_MODEL_ROTATION);
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

  const modelScale = Math.max(0.05, modelScalePercent / 100);
  const activeModelSizeCm = useMemo(() => {
    if (modelSizeCm?.length) {
      return modelSizeCm;
    }
    if (!analysis?.sizeCm?.length) {
      return null;
    }
    return analysis.sizeCm.map((value) => value * modelScale);
  }, [analysis, modelScale, modelSizeCm]);
  const axisScaleFactors = useMemo(
    () => getAxisScaleFactors(analysis?.sizeCm ?? [], activeModelSizeCm ?? []),
    [activeModelSizeCm, analysis]
  );
  const resizedAnalysis = useMemo(
    () => resizeAnalysisForModel(analysis, activeModelSizeCm),
    [activeModelSizeCm, analysis]
  );
  const rotatedModelSizeCm = useMemo(
    () => getRotatedBoundsCm(activeModelSizeCm ?? [], modelRotation),
    [activeModelSizeCm, modelRotation]
  );
  const fitsBuildVolume = useMemo(
    () => Boolean(activeModelSizeCm?.length) && getFitsBuildVolume(rotatedModelSizeCm),
    [activeModelSizeCm, rotatedModelSizeCm]
  );

  const quote = useMemo(() => {
    if (!resizedAnalysis || !selectedMaterial) {
      return null;
    }
    const calculatedQuote = calculateQuote({
      analysis: resizedAnalysis,
      filamentKey: selectedFilament,
      filament: selectedMaterial,
      calculatorSettings: calculatorSettingsQuery.data?.item ?? DEFAULT_CALCULATOR_SETTINGS,
      infillPercent: selectedInfillPercent,
      printProfileKey: selectedPrintProfileKey,
      quantity: printQuantity,
      scale: 1,
    });
    return {
      ...calculatedQuote,
      axisScaleFactors,
      buildVolumeCm: BUILD_VOLUME_CM,
      fitsPrinter: fitsBuildVolume,
      modelRotationDegrees: modelRotation,
      rotatedSizeCm: rotatedModelSizeCm,
    };
  }, [
    axisScaleFactors,
    calculatorSettingsQuery.data,
    fitsBuildVolume,
    modelRotation,
    printQuantity,
    resizedAnalysis,
    rotatedModelSizeCm,
    selectedFilament,
    selectedInfillPercent,
    selectedMaterial,
    selectedPrintProfileKey,
  ]);

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
    file && analysis && quote && !loading && !sending && (!colorOptions.length || selectedColor)
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
      setModelSizeCm(null);
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
      setModelSizeCm(null);
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
      setModelScalePercent(getInitialScalePercent(result));
      setModelSizeCm(getInitialSizeCm(result));
      setModelRotation(getBestPrintableRotation(result.sizeCm));
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
      setModelSizeCm(null);
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
        setModelScalePercent(getInitialScalePercent(baseAnalysis));
        setModelSizeCm(getInitialSizeCm(baseAnalysis));
        setModelRotation(getBestPrintableRotation(baseAnalysis.sizeCm));
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
      setModelScalePercent(getInitialScalePercent(result));
      setModelSizeCm(getInitialSizeCm(result));
      setModelRotation(getBestPrintableRotation(result.sizeCm));
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

  function handleUniformScaleChange(value) {
    const nextScalePercent = clampNumber(value, 5, 200, modelScalePercent);
    setModelScalePercent(nextScalePercent);
    if (analysis?.sizeCm?.length) {
      const nextScale = nextScalePercent / 100;
      setModelSizeCm(analysis.sizeCm.map((dimension) => dimension * nextScale));
    }
  }

  function handleModelSizeChange(axisIndex, value) {
    const currentSize = activeModelSizeCm?.length
      ? activeModelSizeCm
      : analysis?.sizeCm?.length
        ? analysis.sizeCm
        : [1, 1, 1];
    const nextSize = currentSize.map((dimension, index) =>
      index === axisIndex ? clampNumber(value, 0.1, 200, dimension) : dimension
    );
    setModelSizeCm(nextSize);
    setModelScalePercent(getAverageScalePercent(analysis?.sizeCm ?? [], nextSize));
  }

  function handlePrintQuantityChange(value) {
    setPrintQuantity(Math.trunc(clampNumber(value, 1, MAX_PRINT_QUANTITY, printQuantity)));
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
      setSelectedPrintProfileKey(DEFAULT_PRINT_PROFILE_KEY);
      setSelectedInfillPercent(DEFAULT_INFILL_PERCENT);
      setPrintQuantity(1);
      setModelScalePercent(100);
      setModelSizeCm(null);
      setModelRotation(DEFAULT_MODEL_ROTATION);
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
              modelSizeCm={activeModelSizeCm}
              axisScaleFactors={axisScaleFactors}
              modelRotation={modelRotation}
              rotatedSizeCm={quote?.rotatedSizeCm ?? rotatedModelSizeCm}
              fitsBuildVolume={quote?.fitsPrinter ?? fitsBuildVolume}
              modelColor={selectedColor?.hex ?? DEFAULT_MODEL_COLOR}
            />

            <div className="rounded-lg border border-sky-100 bg-sky-50/60 p-4 shadow-sm">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                <div>
                  <h3 className="text-lg font-semibold text-sky-900">Nyomtatási tér</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    A kocka a legnagyobb nyomtatónk {formatDimensionArray(BUILD_VOLUME_CM)}-es
                    munkaterét mutatja.
                  </p>
                </div>
                <span
                  className={[
                    "inline-flex rounded-md px-3 py-2 text-sm font-bold uppercase tracking-wide",
                    fitsBuildVolume
                      ? "bg-emerald-400/20 text-emerald-200 ring-1 ring-emerald-300/50"
                      : "bg-red-500/20 text-red-200 ring-1 ring-red-300/50",
                  ].join(" ")}
                >
                  {fitsBuildVolume ? "Belefér" : "Nem fér bele"}
                </span>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                <label className="flex flex-col text-sm font-semibold text-sky-900">
                  Méretarány: {modelScalePercent}%
                  <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_6rem] sm:items-center">
                    <input
                      type="range"
                      min="5"
                      max="200"
                      step="1"
                      value={modelScalePercent}
                      onChange={(event) => handleUniformScaleChange(event.target.value)}
                      disabled={loading || sending}
                    />
                    <input
                      type="number"
                      min="5"
                      max="200"
                      step="1"
                      value={modelScalePercent}
                      onChange={(event) => handleUniformScaleChange(event.target.value)}
                      disabled={loading || sending}
                      className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800"
                      aria-label="Méretarány százalékban"
                    />
                  </div>
                  <span className="mt-1 text-xs font-normal text-slate-500">
                    Húzd kisebbre vagy nagyobbra a modellt a nyomtatási térben.
                  </span>
                </label>

                <div>
                  <p className="text-sm font-semibold text-sky-900">Méret tengelyenként</p>
                  <div className="mt-2 grid gap-3 sm:grid-cols-3">
                    {SIZE_AXIS_LABELS.map((item, index) => {
                      const label = item[1];
                      return (
                        <label
                          key={label}
                          className="flex flex-col text-xs font-semibold text-slate-600"
                        >
                          {label} méret (cm)
                          <input
                            type="number"
                            min="0.1"
                            max="200"
                            step="0.1"
                            value={(Number(activeModelSizeCm?.[index]) || 0).toFixed(1)}
                            onChange={(event) => handleModelSizeChange(index, event.target.value)}
                            disabled={loading || sending}
                            className="mt-2 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800"
                            aria-label={`${label} tengely mérete centiméterben`}
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-sky-900">Forgatás</p>
                  <div className="mt-2 grid gap-3 sm:grid-cols-3">
                    {ROTATION_AXIS_LABELS.map(([axis, label]) => (
                      <label
                        key={axis}
                        className="flex flex-col text-xs font-semibold text-slate-600"
                      >
                        {label}: {modelRotation[axis]}°
                        <input
                          type="number"
                          min="-180"
                          max="180"
                          step="1"
                          value={modelRotation[axis]}
                          onChange={(event) =>
                            setModelRotation((current) => ({
                              ...current,
                              [axis]: clampNumber(event.target.value, -180, 180, current[axis]),
                            }))
                          }
                          disabled={loading || sending}
                          className="mt-2 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800"
                          aria-label={`${label} tengely forgatás fokban`}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-sky-900">Anyag kiválasztása</h3>
              <p className="mt-1 text-sm text-slate-600">
                Válaszd ki a felhasználási célnak megfelelő alapanyagot és színt.
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

              <div className="mt-6 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
                <fieldset>
                  <legend className="text-sm font-semibold text-sky-900">
                    Nyomtatási beállítás
                  </legend>
                  <div className="mt-2 grid gap-3 sm:grid-cols-3">
                    {PRINT_PROFILE_ORDER.map((profile) => {
                      const isActive = selectedPrintProfileKey === profile.key;
                      return (
                        <button
                          key={profile.key}
                          type="button"
                          onClick={() => setSelectedPrintProfileKey(profile.key)}
                          className={[
                            "flex min-h-28 flex-col rounded-lg border p-3 text-left transition",
                            isActive
                              ? "border-sky-400 bg-sky-100/70 shadow"
                              : "border-slate-200 bg-white/70 hover:border-sky-300 hover:bg-sky-50/60",
                          ].join(" ")}
                        >
                          <span className="text-sm font-semibold text-sky-900">
                            {profile.label}
                          </span>
                          <span className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {formatNumber(profile.layerHeightMm, 1)} mm réteg
                          </span>
                          <span className="mt-2 text-xs leading-relaxed text-slate-600">
                            {profile.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                  <label className="flex flex-col text-sm font-semibold text-sky-900">
                    Kitöltés
                    <select
                      value={selectedInfillPercent}
                      onChange={(event) => setSelectedInfillPercent(Number(event.target.value))}
                      disabled={loading || sending}
                      className="mt-2 rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-medium text-slate-800 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                    >
                      {INFILL_PERCENT_OPTIONS.map((value) => (
                        <option key={value} value={value}>
                          {value}%
                        </option>
                      ))}
                    </select>
                    <span className="mt-2 text-xs font-normal leading-relaxed text-slate-500">
                      A legtöbb dísz- és prototípus modellhez a 15-25% körüli érték elég.
                    </span>
                  </label>

                  <label className="flex flex-col text-sm font-semibold text-sky-900">
                    Darabszám
                    <input
                      type="number"
                      min="1"
                      max={MAX_PRINT_QUANTITY}
                      step="1"
                      value={printQuantity}
                      onChange={(event) => handlePrintQuantityChange(event.target.value)}
                      disabled={loading || sending}
                      className="mt-2 rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-medium text-slate-800 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      aria-label="Nyomtatandó darabszám"
                    />
                    <span className="mt-2 text-xs font-normal leading-relaxed text-slate-500">
                      Ugyanebből a modellből ennyi darabot kérsz.
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {quote ? (
              <div className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-lg border border-sky-100 bg-sky-50/60 p-4 shadow-sm">
                    <h3 className="text-lg font-semibold text-sky-900">Modell adatai</h3>
                    <dl className="mt-3 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                      <div>
                        <dt className="font-medium text-slate-600">Modell méretei</dt>
                        <dd>{rawDimensionsText}</dd>
                      </div>
                      {quote.scale !== 1 ? (
                        <div>
                          <dt className="font-medium text-slate-600">Nyomtatási méret</dt>
                          <dd>
                            {scaledDimensionsText} ({formatPercentage(quote.scale * 100)})
                          </dd>
                        </div>
                      ) : null}
                      <div>
                        <dt className="font-medium text-slate-600">Forgatott befoglaló méret</dt>
                        <dd>{formatDimensionArray(quote.rotatedSizeCm)}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-slate-600">Darabszám</dt>
                        <dd>{quote.quantity} db</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-slate-600">Box térfogat / db</dt>
                        <dd>{formatNumber(quote.scaledVolumeCm3, 2)} cm3</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-slate-600">Anyag térfogata összesen</dt>
                        <dd>{formatNumber(quote.effectiveVolumeCm3, 2)} cm3</dd>
                      </div>
                      {Number.isFinite(quote.scaledSurfaceAreaCm2) ? (
                        <div>
                          <dt className="font-medium text-slate-600">Felület</dt>
                          <dd>{formatNumber(quote.scaledSurfaceAreaCm2, 2)} cm2</dd>
                        </div>
                      ) : null}
                      <div>
                        <dt className="font-medium text-slate-600">Becsült tömeg összesen</dt>
                        <dd>{formatMass(quote.massGrams)}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-slate-600">Nyomtatási idő összesen</dt>
                        <dd>{formatPrintTime(quote.hours)}</dd>
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
                    <h3 className="text-lg font-semibold text-emerald-800">Összesítés</h3>
                    <dl className="mt-3 space-y-2 text-sm text-emerald-800">
                      <div>
                        <dt className="font-medium text-emerald-700">Anyag</dt>
                        <dd>{selectedMaterial.label}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-emerald-700">Rétegvastagság</dt>
                        <dd>
                          {quote.printProfile.label},{" "}
                          {formatNumber(quote.printProfile.layerHeightMm, 1)} mm
                        </dd>
                      </div>
                      <div>
                        <dt className="font-medium text-emerald-700">Darabszám</dt>
                        <dd>{quote.quantity} db</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-emerald-700">Kitöltés</dt>
                        <dd>{formatPercentage(quote.infillPercent ?? selectedInfillPercent)}</dd>
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
                      {formatCurrency(quote.total)}
                    </p>
                    {quote.quantity > 1 ? (
                      <p className="mt-2 text-xs leading-relaxed text-emerald-700">
                        {quote.quantity} db-ra számolva, egyszeri szolgáltatási díjjal.
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs leading-relaxed text-emerald-700">
                      A végleges ajánlatot a feltöltött modell gyárthatósági ellenőrzése után
                      erősítjük meg.
                    </p>
                  </div>
                </div>

                {hasWarnings ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-800">
                    <h4 className="text-base font-semibold">Gyártási megjegyzések</h4>
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

      <form
        onSubmit={handleSubmit}
        className="neon-panel rounded-lg p-5 shadow-lg backdrop-blur md:p-6"
      >
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
