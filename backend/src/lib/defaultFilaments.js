const defaultFilaments = [
  {
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
    sortOrder: 10,
  },
  {
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
    sortOrder: 20,
  },
  {
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
    sortOrder: 30,
  },
  {
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
    sortOrder: 40,
  },
  {
    key: "ASA",
    label: "ASA",
    description: "kültéri használatra szánt alkatrészek, autóipari külső elemek, UV-álló burkolatok.",
    temperature: "kb. 95–105 °C",
    density: 1.07,
    materialMultiplier: 1.35,
    machineMultiplier: 1.15,
    priceHufPerGram: 40,
    colors: [
      { name: "Fekete", hex: "#111827" },
      { name: "Fehér", hex: "#f8fafc" },
    ],
    sortOrder: 50,
  },
  {
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
    sortOrder: 60,
  },
  {
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
    sortOrder: 70,
  },
];

export default defaultFilaments;
