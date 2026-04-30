import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import crypto from "node:crypto";
import path from "node:path";

function readBuildLabel(): string {
  try {
    const sha = execSync("git rev-parse --short HEAD").toString().trim();
    const date = new Date().toISOString().slice(0, 10);
    return `${sha} · ${date}`;
  } catch {
    return "dev";
  }
}

// Reads `src/sw.template.js`, replaces __BUILD_VERSION__ and __APP_SHELL__
// using the post-build chunk list, and emits `dist/sw.js`.
//
// BUILD_VERSION is a sha1 of the shell paths so it changes every time the
// bundle changes — drives cache-busting in the SW's `activate` step.
function buildSwPlugin(): Plugin {
  return {
    name: "trak-sw",
    apply: "build",
    enforce: "post",
    generateBundle(_options, bundle) {
      const shellPaths = ["/", "/index.html"];
      for (const file of Object.values(bundle)) {
        const name = file.fileName;
        if (name.endsWith(".js") || name.endsWith(".css")) {
          shellPaths.push("/" + name);
        }
      }
      const version = crypto
        .createHash("sha1")
        .update(shellPaths.join("|"))
        .digest("hex")
        .slice(0, 12);
      const template = readFileSync(
        path.resolve(__dirname, "src/sw.template.js"),
        "utf8",
      );
      const source = template
        .replaceAll("__BUILD_VERSION__", version)
        .replaceAll("__APP_SHELL__", JSON.stringify(shellPaths));
      this.emitFile({ type: "asset", fileName: "sw.js", source });
    },
  };
}

export default defineConfig({
  define: {
    __BUILD_LABEL__: JSON.stringify(readBuildLabel()),
  },
  plugins: [react(), tailwindcss(), buildSwPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5174,
    proxy: {
      "/api": {
        target: "http://localhost:3002",
        changeOrigin: true,
      },
    },
  },
});
