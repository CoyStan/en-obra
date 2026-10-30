// Tiny static server for the exported web build (single-page app fallback).
//
//   node scripts/serve-web.mjs [dir] [port]
import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".ttf": "font/ttf",
};

export async function serve(dir, port = 0) {
  const root = resolve(dir);
  const server = createServer((req, res) => {
    let path = join(root, decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname));
    if (existsSync(path) && statSync(path).isDirectory()) path = join(path, "index.html");
    const file = path.startsWith(root) && existsSync(path) && statSync(path).isFile() ? path : join(root, "index.html");
    if (!existsSync(file)) {
      res.writeHead(404).end("Not found");
      return;
    }
    res.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" });
    res.end(readFileSync(file));
  });
  await new Promise((done) => server.listen(port, "127.0.0.1", done));
  return { server, url: `http://127.0.0.1:${server.address().port}` };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [dir = "dist", port = "4173"] = process.argv.slice(2);
  const { url } = await serve(dir, Number(port));
  console.log(`Serving ${dir} at ${url}`);
}
