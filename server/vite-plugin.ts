import type { Plugin } from "vite";
import { handleApi } from "./routes";

export function apiPlugin(): Plugin {
  return {
    name: "impeccable-worlds-api",
    configureServer(server) {
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
    },
  };
}
