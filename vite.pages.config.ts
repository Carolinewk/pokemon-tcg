import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const projectDirectory = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig(({ command }) => {
  const relay = process.env.POKETABLE_RELAY_ORIGIN?.replace(/\/+$/, "") || "";
  if (command === "build") {
    if (!relay) {
      throw new Error(
        "Set POKETABLE_RELAY_ORIGIN to your public multiplayer backend before building for GitHub Pages.",
      );
    }
    const url = new URL(relay);
    if (
      url.origin !== relay ||
      (url.protocol !== "https:" &&
        !(url.protocol === "http:" && url.hostname === "localhost"))
    ) {
      throw new Error(
        "POKETABLE_RELAY_ORIGIN must be an HTTPS origin without a path.",
      );
    }
  }

  return {
    root: fileURLToPath(new URL("./github-pages", import.meta.url)),
    publicDir: fileURLToPath(new URL("./public", import.meta.url)),
    base: process.env.POKETABLE_BASE_PATH || "./",
    plugins: [react()],
    resolve: {
      alias: { "@": projectDirectory },
      dedupe: ["react", "react-dom"],
    },
    define: {
      "import.meta.env.VITE_RELAY_ORIGIN": JSON.stringify(relay),
    },
    build: {
      outDir: fileURLToPath(new URL("./dist-pages", import.meta.url)),
      emptyOutDir: true,
    },
  };
});
