import { createServer } from "node:http";
import { createReadStream, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const args = process.argv.slice(2);

let host = "0.0.0.0";
let port = Number(process.env.PORT || 5173);

for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === "--host" && args[i + 1]) {
    host = args[i + 1].replace(/^--/, "");
    i += 1;
  } else if (arg.startsWith("--host=")) {
    host = arg.slice("--host=".length);
  } else if (arg === "--port" && args[i + 1]) {
    port = Number(args[i + 1]);
    i += 1;
  } else if (arg.startsWith("--port=")) {
    port = Number(arg.slice("--port=".length));
  } else if (/^--\d+\.\d+\.\d+\.\d+$/.test(arg)) {
    host = arg.slice(2);
  }
}

const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
};

const server = createServer((request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host}`);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname.endsWith("/")) pathname += "index.html";

  const target = normalize(join(root, pathname));
  if (!target.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  let file = target;
  try {
    const info = statSync(file);
    if (info.isDirectory()) file = join(file, "index.html");
  } catch {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "Content-Type": types[extname(file)] || "application/octet-stream"
  });
  createReadStream(file).pipe(response);
});

server.listen(port, host, () => {
  console.log(`JAM site preview: http://localhost:${port}`);
  console.log(`Network preview:  http://${host}:${port}`);
});
