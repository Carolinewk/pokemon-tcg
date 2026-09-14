import { createRoot } from "react-dom/client";
import Home from "@/app/page";
import { ThemeProvider } from "@/components/theme-provider";
import "@/app/globals.css";
import "@/app/themes.css";
import "@/app/collection-theme.css";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <Home />
  </ThemeProvider>,
);
