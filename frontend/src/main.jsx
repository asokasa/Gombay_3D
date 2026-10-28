import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ReactLenis } from "lenis/react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import "lenis/dist/lenis.css";

import PublicSiteLayout from "./components/PublicSiteLayout";
import Home from "./routes/Home";
import Posts from "./routes/Posts";
import Kapcsolatok from "./routes/Kapcsolatok";
import Ajanlatkeres from "./routes/Ajanlatkeres";
import Modellek from "./routes/Modellek";
import GYIK from "./routes/GYIK";
import Referenciak from "./routes/Referenciak";
import AdminLogin from "./routes/AdminLogin";
import AdminDashboard from "./routes/AdminDashboard";
import LegalDocument from "./routes/LegalDocument";

const router = createBrowserRouter([
  {
    element: <PublicSiteLayout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/posts", element: <Posts /> },
      { path: "/modellek", element: <Modellek /> },
      { path: "/gyik", element: <GYIK /> },
      { path: "/referenciak", element: <Referenciak /> },
      { path: "/kapcsolatok", element: <Kapcsolatok /> },
      { path: "/ajanlatkeres", element: <Ajanlatkeres /> },
      { path: "/jogi/:documentKey", element: <LegalDocument /> },
    ],
  },
  { path: "/admin", element: <AdminLogin /> },
  { path: "/admin/dashboard", element: <AdminDashboard /> },
]);
const qc = new QueryClient();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={qc}>
      <ReactLenis root options={{ anchors: true }}>
        <RouterProvider router={router} />
      </ReactLenis>
    </QueryClientProvider>
  </StrictMode>
);
