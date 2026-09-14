const pagesOrigin = "https://carolinewk.github.io";

export function relayOriginAllowed(request: Request) {
  const origin = request.headers.get("origin");
  return (
    !origin || origin === new URL(request.url).origin || origin === pagesOrigin
  );
}

export function relayHeaders(request: Request) {
  const headers = new Headers({ "Cache-Control": "no-store", Vary: "Origin" });
  const origin = request.headers.get("origin");
  if (origin && relayOriginAllowed(request)) {
    headers.set("Access-Control-Allow-Origin", origin);
  }
  return headers;
}
