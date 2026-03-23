import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";

import Home from "./routes/Home";
import Posts from "./routes/Posts";
import Kapcsolatok from "./routes/Kapcsolatok";
import Ajanlatkeres from "./routes/Ajanlatkeres";
import AdminLogin from "./routes/AdminLogin";
import AdminDashboard from "./routes/AdminDashboard";

const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/posts", element: <Posts /> },
  { path: "/kapcsolatok", element: <Kapcsolatok /> },
  { path: "/ajanlatkeres", element: <Ajanlatkeres /> },
  { path: "/admin", element: <AdminLogin /> },
  { path: "/admin/dashboard", element: <AdminDashboard /> },
]);
const qc = new QueryClient();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
);
