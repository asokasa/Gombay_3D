import { Box3, BufferGeometry, Mesh, Raycaster, Triangle, Vector3 } from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from "three-mesh-bvh";

BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
Mesh.prototype.raycast = acceleratedRaycast;

const MAX_DIMENSION_CM = 30;
const MAX_DIMENSION_MM = MAX_DIMENSION_CM * 10;

const BASE_NOZZLE_DIAMETER_MM = 0.4;
const MIN_WALL_THRESHOLD_MM = BASE_NOZZLE_DIAMETER_MM * 2;
const SELF_INTERSECTION_THRESHOLD_MM = 0.05;

const RAD_TO_DEG = 180 / Math.PI;

export const DEFAULT_CALCULATOR_SETTINGS = {
  serviceFeeHuf: 3500,
  machineRateHufPerHour: 2800,
  fallbackMaterialCostHufPerCm3: 12.5,
  finishingCostHufPerCm2: 1.8,
  printSpeedCm3PerHour: 18,
  infillFactor: 0.22,
  minimumPrintHours: 0.4,
};

export const PRINT_PROFILES = {
  NORMAL: {
    key: "NORMAL",
    label: "Normál",
    description: "Kiegyensúlyozott részletesség és gyártási idő.",
    layerHeightMm: 0.2,
    printSpeedMultiplier: 1,
    machineCostMultiplier: 1,
  },
  DETAIL: {
    key: "DETAIL",
    label: "Részletes",
    description: "Finomabb rétegek, lassabb nyomtatással.",
    layerHeightMm: 0.1,
    printSpeedMultiplier: 0.6,
    machineCostMultiplier: 1.15,
  },
  DRAFT: {
    key: "DRAFT",
    label: "Gyors",
    description: "Vastagabb rétegek gyorsabb, egyszerűbb darabokhoz.",
    layerHeightMm: 0.3,
    printSpeedMultiplier: 1.3,
    machineCostMultiplier: 0.9,
  },
};

export const PRINT_PROFILE_ORDER = [
  PRINT_PROFILES.NORMAL,
  PRINT_PROFILES.DETAIL,
  PRINT_PROFILES.DRAFT,
];

export const FILAMENTS = {
  PLA: {
    key: "PLA",
    label: "PLA",
    description:
      "prototípusok, dekoráció, makettek, esztétikai tárgyak, kevésbé terhelhető alkatrészek.",
    temperature: "kb. 50–60 °C",
    density: 1.24,
    materialMultiplier: 1,
    machineMultiplier: 1,
    priceHufPerGram: 30,
    colors: [
      { name: "Fehér", hex: "#f8fafc" },
      { name: "Fekete", hex: "#111827" },
      { name: "Piros", hex: "#ef4444" },
    ],
  },
  PETG: {
    key: "PETG",
    label: "PETG",
    description:
      "funkcionális alkatrészek, vízzel érintkező tárgyak, burkolatok, tartósabb háztartási és műszaki kiegészítők.",
    temperature: "kb. 70–80 °C",
    density: 1.27,
    materialMultiplier: 1.1,
    machineMultiplier: 1.05,
    priceHufPerGram: 30,
    colors: [
      { name: "Átlátszó", hex: "#dbeafe" },
      { name: "Fekete", hex: "#111827" },
      { name: "Kék", hex: "#2563eb" },
    ],
  },
  TPU: {
    key: "TPU",
    label: "TPU",
    description: "hajlékony tokok, tömítések, ütéscsillapítók, gumiszerű elemek.",
    temperature: "kb. 60–80 °C",
    density: 1.21,
    materialMultiplier: 1.35,
    machineMultiplier: 1.15,
    priceHufPerGram: 50,
    colors: [
      { name: "Fekete", hex: "#111827" },
      { name: "Piros", hex: "#dc2626" },
    ],
  },
  ABS: {
    key: "ABS",
    label: "ABS",
    description:
      "mechanikai alkatrészek, burkolatok, műanyag házak, közepes terhelésű funkcionális részek.",
    temperature: "kb. 90–100 °C",
    density: 1.04,
    materialMultiplier: 1.25,
    machineMultiplier: 1.1,
    priceHufPerGram: 40,
    colors: [
      { name: "Fekete", hex: "#111827" },
      { name: "Natúr", hex: "#d6d3d1" },
    ],
  },
  ASA: {
    key: "ASA",
    label: "ASA",
    description:
      "kültéri használatra szánt alkatrészek, autóipari külső elemek, UV-álló burkolatok.",
    temperature: "kb. 95–105 °C",
    density: 1.07,
    materialMultiplier: 1.35,
    machineMultiplier: 1.15,
    priceHufPerGram: 40,
    colors: [
      { name: "Fekete", hex: "#111827" },
      { name: "Fehér", hex: "#f8fafc" },
    ],
  },
  PA: {
    key: "PA",
    label: "PA",
    description:
      "erős, rugalmas és kopásálló funkcionális alkatrészek, fogaskerekek, csapágyak, műszaki kötések.",
    temperature: "kb. 100–120 °C",
    density: 1.14,
    materialMultiplier: 1.55,
    machineMultiplier: 1.2,
    priceHufPerGram: 90,
    colors: [
      { name: "Natúr", hex: "#e7e5e4" },
      { name: "Fekete", hex: "#111827" },
    ],
  },
  PC: {
    key: "PC",
    label: "PC",
    description:
      "nagyon erős mechanikai alkatrészek, elektronikai házak, magas hőhatásnak kitett szerkezetek.",
    temperature: "kb. 110–130 °C",
    density: 1.2,
    materialMultiplier: 1.75,
    machineMultiplier: 1.25,
    priceHufPerGram: 80,
    colors: [
      { name: "Átlátszó", hex: "#e0f2fe" },
      { name: "Fekete", hex: "#111827" },
    ],
  },
};

const FILAMENT_ORDER = [
  FILAMENTS.PLA,
  FILAMENTS.PETG,
  FILAMENTS.TPU,
  FILAMENTS.ABS,
  FILAMENTS.ASA,
  FILAMENTS.PA,
  FILAMENTS.PC,
];

const STL_LOADER = new STLLoader();
const OBJ_LOADER = new OBJLoader();
const GLTF_LOADER = new GLTFLoader();

const TEMP_TRIANGLE = new Triangle();
const TEMP_VEC_A = new Vector3();
const TEMP_VEC_B = new Vector3();
const TEMP_VEC_C = new Vector3();
const TEMP_NORMAL = new Vector3();
const UP_DIRECTION = new Vector3(0, 1, 0);

function loadStlGeometry(arrayBuffer) {
  return STL_LOADER.parse(arrayBuffer);
}

function loadObjGeometry(text) {
  const root = OBJ_LOADER.parse(text);
  const geometries = [];
  root.updateMatrixWorld(true);
  root.traverse((child) => {
    if (child.isMesh && child.geometry) {
      const geom = child.geometry.clone();
      geom.applyMatrix4(child.matrixWorld);
      geometries.push(geom);
    }
  });
  if (!geometries.length) {
    throw new Error("Az OBJ fájl nem tartalmaz feldolgozható hálót.");
  }
  return BufferGeometryUtils.mergeGeometries(geometries, false);
}

function loadGltfGeometry(arrayBuffer) {
  return new Promise((resolve, reject) => {
    GLTF_LOADER.parse(
      arrayBuffer,
      "",
      (gltf) => {
        const geometries = [];
        gltf.scene.updateMatrixWorld(true);
        gltf.scene.traverse((child) => {
          if (child.isMesh && child.geometry) {
            const geom = child.geometry.clone();
            geom.applyMatrix4(child.matrixWorld);
            geometries.push(geom);
          }
        });
        if (!geometries.length) {
          reject(new Error("A GLTF/GLB fájl nem tartalmaz háló adatot."));
          return;
        }
        resolve(BufferGeometryUtils.mergeGeometries(geometries, false));
      },
      (error) => {
        reject(
          error instanceof Error
            ? error
            : new Error("A GLTF fájl feldolgozása közben hiba történt.")
        );
      }
    );
  });
}

function sanitizeGeometry(geometry) {
  const cloned = geometry.clone();
  cloned.deleteAttribute("color");
  cloned.deleteAttribute("uv");
  cloned.deleteAttribute("tangent");
  const merged = BufferGeometryUtils.mergeVertices(cloned, 1e-4);
  merged.computeVertexNormals();
  merged.computeBoundingBox();
  merged.computeBoundingSphere();
  return merged;
}

function inferUnits(sizeVector) {
  const maxDimension = Math.max(sizeVector.x, sizeVector.y, sizeVector.z);
  if (maxDimension === 0) {
    return {
      inferredUnit: "ismeretlen",
      toMillimeter: 1,
      autoScale: 1,
    };
  }

  // STL/OBJ/GLTF files are unitless. Most slicer-ready exports are millimeters;
  // tiny coordinate ranges are the common exception for meter-based CAD exports.
  if (maxDimension < 1) {
    return {
      inferredUnit: "méter",
      toMillimeter: 1000,
      autoScale: 1000,
    };
  }

  return {
    inferredUnit: "milliméter",
    toMillimeter: 1,
    autoScale: 1,
  };
}

function getTriangleCount(geometry) {
  const index = geometry.getIndex();
  if (index) {
    return index.count / 3;
  }
  return geometry.getAttribute("position").count / 3;
}

function forEachTriangle(geometry, callback) {
  const index = geometry.getIndex();
  const position = geometry.getAttribute("position");
  if (!position) return;
  const array = position.array;
  const indices = index ? index.array : null;

  const count = index ? index.count : position.count;
  for (let i = 0; i < count; i += 3) {
    const ia = indices ? indices[i] : i;
    const ib = indices ? indices[i + 1] : i + 1;
    const ic = indices ? indices[i + 2] : i + 2;
    TEMP_VEC_A.fromArray(array, ia * 3);
    TEMP_VEC_B.fromArray(array, ib * 3);
    TEMP_VEC_C.fromArray(array, ic * 3);
    callback(TEMP_VEC_A, TEMP_VEC_B, TEMP_VEC_C, ia, ib, ic, i / 3);
  }
}

function getTriangleAt(geometry, triangleIndex, target = TEMP_TRIANGLE) {
  const position = geometry.getAttribute("position");
  const index = geometry.getIndex();
  if (!position) return null;
  const indices = index ? index.array : null;
  const ia = indices ? indices[triangleIndex * 3] : triangleIndex * 3;
  const ib = indices ? indices[triangleIndex * 3 + 1] : triangleIndex * 3 + 1;
  const ic = indices ? indices[triangleIndex * 3 + 2] : triangleIndex * 3 + 2;
  target.a.fromArray(position.array, ia * 3);
  target.b.fromArray(position.array, ib * 3);
  target.c.fromArray(position.array, ic * 3);
  return target;
}

function computeSurfaceAreaAndVolume(geometry) {
  let area = 0;
  let signedVolume = 0;

  forEachTriangle(geometry, (a, b, c) => {
    TEMP_VEC_B.copy(b).sub(a);
    TEMP_VEC_C.copy(c).sub(a);
    TEMP_NORMAL.copy(TEMP_VEC_B).cross(TEMP_VEC_C);
    const triangleArea = TEMP_NORMAL.length() * 0.5;
    area += triangleArea;
    signedVolume += a.dot(TEMP_NORMAL) / 6;
  });

  return { area, signedVolume };
}

function flipGeometryOrientation(geometry) {
  const index = geometry.getIndex();
  if (index) {
    const array = index.array;
    for (let i = 0; i < array.length; i += 3) {
      const tmp = array[i + 1];
      array[i + 1] = array[i + 2];
      array[i + 2] = tmp;
    }
  } else {
    const position = geometry.getAttribute("position");
    const array = position.array;
    for (let i = 0; i < array.length; i += 9) {
      // swap b és c pont
      const bx = array[i + 3];
      const by = array[i + 4];
      const bz = array[i + 5];
      array[i + 3] = array[i + 6];
      array[i + 4] = array[i + 7];
      array[i + 5] = array[i + 8];
      array[i + 6] = bx;
      array[i + 7] = by;
      array[i + 8] = bz;
    }
  }
  geometry.computeVertexNormals();
}

function analyzeManifoldEdges(geometry) {
  const edgeMap = new Map();
  const keyFor = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);
  forEachTriangle(geometry, (_, __, ___, ia, ib, ic) => {
    const edges = [
      [ia, ib],
      [ib, ic],
      [ic, ia],
    ];
    for (const [a, b] of edges) {
      const key = keyFor(a, b);
      edgeMap.set(key, (edgeMap.get(key) ?? 0) + 1);
    }
  });
  let nonManifoldEdges = 0;
  for (const count of edgeMap.values()) {
    if (count !== 2) {
      nonManifoldEdges += 1;
    }
  }
  return { nonManifoldEdges, isWatertight: nonManifoldEdges === 0 };
}

function analyzeOverhangs(geometry) {
  const overhangAngles = [];
  const overhangThreshold = Math.cos(((90 + 45) * Math.PI) / 180);
  forEachTriangle(geometry, (a, b, c) => {
    TEMP_TRIANGLE.set(a, b, c);
    TEMP_TRIANGLE.getNormal(TEMP_NORMAL);
    const length = TEMP_NORMAL.length();
    if (length === 0) return;
    TEMP_NORMAL.divideScalar(length);
    const dot = TEMP_NORMAL.dot(UP_DIRECTION);
    if (dot < overhangThreshold) {
      const angle = Math.acos(Math.max(-1, Math.min(1, dot))) * RAD_TO_DEG;
      overhangAngles.push(angle);
    }
  });
  const ratio = overhangAngles.length / Math.max(1, getTriangleCount(geometry));
  return {
    ratio,
    percentage: ratio * 100,
    maxAngle: overhangAngles.length ? Math.max(...overhangAngles) : 0,
    averageAngle: overhangAngles.length
      ? overhangAngles.reduce((sum, value) => sum + value, 0) / overhangAngles.length
      : 0,
    requiresSupport: ratio > 0.05,
  };
}

function analyzeSelfIntersectionsAndWalls(geometry, unitToMillimeter) {
  geometry.computeBoundsTree({ strategy: 0 });
  const mesh = new Mesh(geometry);
  const raycaster = new Raycaster();
  raycaster.firstHitOnly = true;

  const triangleCount = getTriangleCount(geometry);
  const sampleCount = Math.min(300, triangleCount);
  const sampled = new Set();
  let selfIntersections = 0;
  let thinWallHits = 0;
  let minWallThickness = Infinity;

  const forwardOrigin = new Vector3();
  const backwardOrigin = new Vector3();
  const direction = new Vector3();
  const centroid = new Vector3();

  let attempts = 0;
  while (sampled.size < sampleCount && attempts < triangleCount * 2) {
    attempts += 1;
    const triIndex = Math.floor(Math.random() * triangleCount);
    if (sampled.has(triIndex)) continue;
    sampled.add(triIndex);
    const triangle = getTriangleAt(geometry, triIndex, TEMP_TRIANGLE);
    if (!triangle) {
      continue;
    }
    triangle.getNormal(direction);
    const len = direction.length();
    if (len === 0) {
      continue;
    }
    direction.divideScalar(len);
    centroid
      .copy(triangle.a)
      .add(triangle.b)
      .add(triangle.c)
      .multiplyScalar(1 / 3);
    forwardOrigin.copy(centroid).addScaledVector(direction, 1e-4);
    backwardOrigin.copy(centroid).addScaledVector(direction, -1e-4);

    raycaster.set(forwardOrigin, direction);
    const forwardHit = raycaster.intersectObject(mesh, true)?.[0];

    raycaster.set(backwardOrigin, direction.clone().negate());
    const backwardHit = raycaster.intersectObject(mesh, true)?.[0];

    if (forwardHit) {
      const distanceMm = forwardHit.distance * unitToMillimeter;
      if (distanceMm < SELF_INTERSECTION_THRESHOLD_MM) {
        selfIntersections += 1;
      }
    }

    if (forwardHit && backwardHit) {
      const thicknessMm = (forwardHit.distance + backwardHit.distance) * unitToMillimeter;
      if (Number.isFinite(thicknessMm)) {
        minWallThickness = Math.min(minWallThickness, thicknessMm);
        if (thicknessMm < MIN_WALL_THRESHOLD_MM) {
          thinWallHits += 1;
        }
      }
    }
  }

  geometry.disposeBoundsTree();

  const thinWallRatio = sampleCount ? thinWallHits / sampleCount : 0;
  return {
    samples: sampleCount,
    thinWallHits,
    thinWallRatio,
    thinWallPercentage: thinWallRatio * 100,
    selfIntersections,
    minWallThicknessMm: Number.isFinite(minWallThickness) ? minWallThickness : null,
  };
}

function formatWarnings({
  nonManifoldEdges,
  isWatertight,
  normalsFlipped,
  intersections,
  overhangs,
  autoScale,
}) {
  const warnings = [];
  if (isWatertight === false) {
    warnings.push("A modell nem teljesen zárt: egyes élekhez nem pontosan két lap kapcsolódik.");
  }
  if (Number.isFinite(nonManifoldEdges) && nonManifoldEdges > 0) {
    warnings.push(
      `${nonManifoldEdges} darab él nem két lappal osztozik, ez problémát okozhat a nyomtatásnál.`
    );
  }
  if (normalsFlipped) {
    warnings.push("A felületi normálokat fel kellett cserélni a helyes orientáció érdekében.");
  }
  if (intersections?.selfIntersections > 0) {
    warnings.push(
      "A BVH alapú vizsgálat átfedő felületeket talált, érdemes hálójavítást futtatni."
    );
  }
  if (intersections?.thinWallHits > 0) {
    warnings.push(
      `A falvastagság mintavételezés ${intersections.thinWallHits} alkalommal a ${MIN_WALL_THRESHOLD_MM.toFixed(
        2
      )} mm-es küszöb alatt volt.`
    );
  }
  if (overhangs?.requiresSupport) {
    warnings.push("Számos felület 45°-nál nagyobb lejtésű, nagy valószínűséggel támasz szükséges.");
  }
  if (autoScale?.recommendedScale < 1) {
    warnings.push(
      "A modell nagyobb, mint a nyomtatási tér – automatikus méretezést javasolunk a beféréshez."
    );
  }
  return warnings;
}

function analyzePreparedGeometry(geometry, options = {}) {
  geometry.computeBoundingBox();
  const boundingBox = geometry.boundingBox ?? new Box3();
  const sizeVector = new Vector3();
  boundingBox.getSize(sizeVector);

  const unitInference = inferUnits(sizeVector);
  const override = options.unitOverride;
  const appliedUnit = override?.toMillimeter
    ? {
        inferredUnit: override.label ?? "kézi beállítás",
        toMillimeter: override.toMillimeter,
      }
    : unitInference;
  const unitLabel = override?.label
    ? `${override.label} (kézi beállítás)`
    : unitInference.inferredUnit;
  const unitToMillimeter = appliedUnit.toMillimeter;
  const unitToCentimeter = unitToMillimeter / 10;

  const sizeMm = sizeVector.clone().multiplyScalar(unitToMillimeter);
  const sizeCm = sizeMm.clone().multiplyScalar(0.1);

  const rawMaxDimension = Math.max(sizeVector.x, sizeVector.y, sizeVector.z);
  const maxDimensionMm = Math.max(sizeMm.x, sizeMm.y, sizeMm.z);
  const maxAllowableScale = MAX_DIMENSION_MM / Math.max(1, maxDimensionMm);
  const recommendedScale = Math.min(1, maxAllowableScale);

  const { area, signedVolume } = computeSurfaceAreaAndVolume(geometry);
  let normalsFlipped = false;
  let volume = signedVolume;
  if (volume < 0) {
    flipGeometryOrientation(geometry);
    const updated = computeSurfaceAreaAndVolume(geometry);
    volume = Math.abs(updated.signedVolume);
    normalsFlipped = true;
  }

  const surfaceAreaMm2 = area * unitToMillimeter ** 2;
  const volumeMm3 = Math.abs(volume) * unitToMillimeter ** 3;
  const surfaceAreaCm2 = surfaceAreaMm2 / 100;
  const volumeCm3 = volumeMm3 / 1000;

  const manifold = analyzeManifoldEdges(geometry);
  const overhangs = analyzeOverhangs(geometry);
  const intersections = analyzeSelfIntersectionsAndWalls(geometry, unitToMillimeter);

  const previewScale = rawMaxDimension > 0 ? 12 / rawMaxDimension : 0.1;
  const autoScale = {
    recommendedScale,
    maxAllowableScale,
    scaledSizeCm: sizeCm.clone().multiplyScalar(recommendedScale),
  };

  const warnings = formatWarnings({
    ...manifold,
    normalsFlipped,
    intersections,
    overhangs,
    autoScale,
  });

  return {
    sizeCm: [sizeCm.x, sizeCm.y, sizeCm.z],
    sizeMm: [sizeMm.x, sizeMm.y, sizeMm.z],
    rawUnit: unitLabel,
    detectedUnit: unitInference.inferredUnit,
    unitScaleToMm: unitToMillimeter,
    unitScaleToCm: unitToCentimeter,
    volumeCm3,
    surfaceAreaCm2,
    surfaceAreaMm2,
    volumeMm3,
    manifold,
    normalsFlipped,
    overhangs,
    intersections,
    autoScale,
    warnings,
    previewScale,
  };
}

async function analyzeStep(file, options = {}) {
  const text = await file.text();
  const regex =
    /CARTESIAN_POINT\s*\([^,]*,\s*\(([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)[^\d]+([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)[^\d]+([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)/gi;
  const points = [];
  let match;
  while ((match = regex.exec(text))) {
    points.push([parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3])]);
  }
  if (!points.length) {
    throw new Error(
      "A STEP fájlból nem sikerült koordinátákat kinyerni – kérjük, exportálj háló formátumba (STL/OBJ/GLTF)."
    );
  }
  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;
  for (const [x, y, z] of points) {
    if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (z < minZ) minZ = z;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      if (z > maxZ) maxZ = z;
    }
  }
  if (
    !Number.isFinite(minX) ||
    !Number.isFinite(minY) ||
    !Number.isFinite(minZ) ||
    !Number.isFinite(maxX) ||
    !Number.isFinite(maxY) ||
    !Number.isFinite(maxZ)
  ) {
    throw new Error("A STEP fájl koordinátái hibásak.");
  }
  const override = options.unitOverride;
  const unitToMillimeter = override?.toMillimeter ?? 1;
  const unitLabel = override?.label ? `${override.label} (kézi beállítás)` : "milliméter (becsült)";
  const size = [maxX - minX, maxY - minY, maxZ - minZ];
  const sizeMm = size.map((value) => Math.abs(value) * unitToMillimeter);
  const sizeCm = sizeMm.map((value) => value / 10);
  const maxDimension = Math.max(...sizeCm);
  const autoScaleFactor = Math.min(1, MAX_DIMENSION_CM / Math.max(1, maxDimension));
  const boundingBoxVolumeCm3 = sizeCm[0] * sizeCm[1] * sizeCm[2];
  const boundingBoxSurfaceAreaCm2 =
    2 * (sizeCm[0] * sizeCm[1] + sizeCm[0] * sizeCm[2] + sizeCm[1] * sizeCm[2]);
  return {
    sizeCm,
    sizeMm,
    rawUnit: unitLabel,
    detectedUnit: "milliméter (becsült)",
    unitScaleToMm: unitToMillimeter,
    unitScaleToCm: unitToMillimeter / 10,
    volumeCm3: boundingBoxVolumeCm3,
    surfaceAreaCm2: boundingBoxSurfaceAreaCm2,
    surfaceAreaMm2: boundingBoxSurfaceAreaCm2 * 100,
    volumeMm3: boundingBoxVolumeCm3 * 1000,
    manifold: { nonManifoldEdges: null, isWatertight: null },
    normalsFlipped: false,
    overhangs: null,
    intersections: null,
    autoScale: {
      recommendedScale: autoScaleFactor,
      maxAllowableScale: autoScaleFactor,
      scaledSizeCm: sizeCm.map((value) => value * autoScaleFactor),
    },
    warnings: [
      "STEP fájl esetén csak közelítő méretet tudtunk meghatározni. Teljes elemzéshez exportálj háló formátumba.",
    ],
    previewScale: Math.max(0.1, 12 / Math.max(1, maxDimension * 10)),
  };
}

async function loadAndAnalyzeMesh(file, extension, options = {}) {
  let geometry;
  if (extension === "stl") {
    const buffer = await file.arrayBuffer();
    geometry = loadStlGeometry(buffer);
  } else if (extension === "obj") {
    const text = await file.text();
    geometry = loadObjGeometry(text);
  } else if (extension === "gltf" || extension === "glb") {
    const buffer = await file.arrayBuffer();
    geometry = await loadGltfGeometry(buffer);
  } else {
    throw new Error("Nem támogatott háló formátum.");
  }

  const sanitized = sanitizeGeometry(geometry);
  return analyzePreparedGeometry(sanitized, options);
}

export async function analyze3DFile(file, options = {}) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension) {
    throw new Error("Ismeretlen fájlkiterjesztés.");
  }

  if (["stl", "obj", "gltf", "glb"].includes(extension)) {
    return loadAndAnalyzeMesh(file, extension, options);
  }

  if (["step", "stp"].includes(extension)) {
    return analyzeStep(file, options);
  }

  throw new Error("A rendszer csak STL, OBJ, GLTF/GLB vagy STEP/STP formátumú fájlokat fogad el.");
}

export function calculateQuote({
  analysis,
  filamentKey,
  filament: filamentOverride,
  calculatorSettings,
  infillPercent,
  printProfileKey,
  printProfile: printProfileOverride,
  quantity,
  scale,
}) {
  const filament = filamentOverride ?? FILAMENTS[filamentKey] ?? FILAMENTS.PLA;
  const printProfile =
    printProfileOverride ?? PRINT_PROFILES[printProfileKey] ?? PRINT_PROFILES.NORMAL;
  const settings = {
    ...DEFAULT_CALCULATOR_SETTINGS,
    ...(calculatorSettings ?? {}),
  };
  const recommendedScale = analysis?.autoScale?.recommendedScale;
  const quoteScale =
    Number.isFinite(scale) && scale > 0
      ? scale
      : Number.isFinite(recommendedScale) && recommendedScale > 0
        ? recommendedScale
        : 1;
  const scaledVolumeCm3 = (analysis?.volumeCm3 ?? 0) * quoteScale ** 3;
  const scaledSurfaceAreaCm2 = Number.isFinite(analysis?.surfaceAreaCm2)
    ? analysis.surfaceAreaCm2 * quoteScale ** 2
    : null;
  const scaledSizeCm = (analysis?.sizeCm ?? []).map((value) => value * quoteScale);

  const serviceFeeHuf = Math.max(0, Number(settings.serviceFeeHuf) || 0);
  const machineRateHufPerHour = Math.max(0, Number(settings.machineRateHufPerHour) || 0);
  const fallbackMaterialCostHufPerCm3 = Math.max(
    0,
    Number(settings.fallbackMaterialCostHufPerCm3) || 0
  );
  const finishingCostHufPerCm2 = Math.max(0, Number(settings.finishingCostHufPerCm2) || 0);
  const printSpeedMultiplier = Math.max(0.01, Number(printProfile.printSpeedMultiplier) || 1);
  const machineCostMultiplier = Math.max(0, Number(printProfile.machineCostMultiplier) || 1);
  const printSpeedCm3PerHour =
    Math.max(0.01, Number(settings.printSpeedCm3PerHour) || 0) * printSpeedMultiplier;
  const selectedInfillPercent = Number.isFinite(Number(infillPercent))
    ? Math.min(100, Math.max(0, Number(infillPercent)))
    : null;
  const infillFactor =
    selectedInfillPercent === null
      ? Math.min(1, Math.max(0, Number(settings.infillFactor) || 0))
      : selectedInfillPercent / 100;
  const shellVolumeFactor = selectedInfillPercent === null ? 0 : 0.08;
  const effectiveInfillFactor = Math.min(
    1,
    shellVolumeFactor + (1 - shellVolumeFactor) * infillFactor
  );
  const minimumPrintHours = Math.max(0, Number(settings.minimumPrintHours) || 0);
  const selectedQuantity = Number.isFinite(Number(quantity))
    ? Math.min(999, Math.max(1, Math.trunc(Number(quantity))))
    : 1;

  const singleEffectiveVolumeCm3 = scaledVolumeCm3 * effectiveInfillFactor;
  const singleHours = Math.max(minimumPrintHours, singleEffectiveVolumeCm3 / printSpeedCm3PerHour);
  const effectiveVolumeCm3 = singleEffectiveVolumeCm3 * selectedQuantity;
  const hours = singleHours * selectedQuantity;

  const density = filament.density ?? 1.24;
  const singleMassGrams = singleEffectiveVolumeCm3 * density;
  const massGrams = singleMassGrams * selectedQuantity;
  const pricePerGram = filament.priceHufPerGram;

  const fallbackMaterialCost =
    singleEffectiveVolumeCm3 * fallbackMaterialCostHufPerCm3 * (filament.materialMultiplier ?? 1);
  const singleMaterialCost = Number.isFinite(pricePerGram)
    ? singleMassGrams * pricePerGram
    : fallbackMaterialCost;
  const materialCost = singleMaterialCost * selectedQuantity;
  const singleMachineCost =
    singleHours * machineRateHufPerHour * (filament.machineMultiplier ?? 1) * machineCostMultiplier;
  const machineCost = singleMachineCost * selectedQuantity;
  const singleFinishingCost = Number.isFinite(scaledSurfaceAreaCm2)
    ? scaledSurfaceAreaCm2 * finishingCostHufPerCm2
    : 0;
  const finishingCost = singleFinishingCost * selectedQuantity;
  const singleItemSubtotal = singleMaterialCost + singleMachineCost + singleFinishingCost;
  const total = serviceFeeHuf + singleItemSubtotal * selectedQuantity;

  return {
    filament,
    printProfile,
    quantity: selectedQuantity,
    scale: quoteScale,
    scaledVolumeCm3,
    scaledSurfaceAreaCm2,
    scaledSizeCm,
    effectiveVolumeCm3,
    hours,
    materialCost,
    machineCost,
    finishingCost,
    serviceFee: serviceFeeHuf,
    total,
    massGrams,
    singleItem: {
      scaledVolumeCm3,
      scaledSurfaceAreaCm2,
      effectiveVolumeCm3: singleEffectiveVolumeCm3,
      hours: singleHours,
      materialCost: singleMaterialCost,
      machineCost: singleMachineCost,
      finishingCost: singleFinishingCost,
      subtotal: singleItemSubtotal,
      massGrams: singleMassGrams,
    },
    materialPricePerGram: Number.isFinite(pricePerGram) ? pricePerGram : null,
    infillPercent: selectedInfillPercent,
    infillFactor,
    effectiveInfillFactor,
    calculatorSettings: {
      serviceFeeHuf,
      machineRateHufPerHour,
      fallbackMaterialCostHufPerCm3,
      finishingCostHufPerCm2,
      printSpeedCm3PerHour,
      infillFactor,
      minimumPrintHours,
    },
  };
}

export { MAX_DIMENSION_CM, FILAMENT_ORDER };
