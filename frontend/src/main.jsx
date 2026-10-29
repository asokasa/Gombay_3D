```jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

function Maintenance() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white px-6">
      <div className="text-center max-w-xl">
        <div className="text-6xl mb-6">🔧</div>

        <h1 className="text-4xl font-bold mb-4">
          Karbantartás
        </h1>

        <p className="text-lg text-gray-400 mb-3">
          A weboldal jelenleg karbantartás alatt áll.
        </p>

        <p className="text-gray-500">
          Kérjük, látogass vissza később!
        </p>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Maintenance />
  </StrictMode>
);
```
