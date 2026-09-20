import type { Plugin, PreviewServer, ViteDevServer } from "vite";
import { handleApi } from "./routes";

function attachApi(server: ViteDevServer | PreviewServer): void {
  server.middlewares.use((req, res, next) => {
    void handleApi(req, res)
      .then((handled) => {
        if (!handled) next();
      })
      .catch((error: unknown) => {
        if (!res.headersSent) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          const message = error instanceof Error ? error.message : "Internal error.";
          res.end(JSON.stringify({ error: message }));
        }
      });
  });
}

export function apiPlugin(): Plugin {
  return {
    name: "impeccable-worlds-api",
    configureServer: attachApi,
    configurePreviewServer: attachApi,
  };
}
