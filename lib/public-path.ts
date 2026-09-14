const basePath = import.meta.env?.BASE_URL || "/";

export function publicPath(path: string) {
  return basePath + path.replace(/^\/+/, "");
}

export const relayOrigin = import.meta.env?.VITE_RELAY_ORIGIN || "";
