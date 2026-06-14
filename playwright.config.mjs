import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  use: {
    baseURL: process.env.LABAJ_BASE_URL || "http://127.0.0.1:48391/",
    // Le service worker met en cache le corpus et empêcherait page.route() de simuler
    // un corpus indisponible ; on le bloque pour des tests déterministes.
    serviceWorkers: "block",
  },
  webServer: {
    command: "python3 -m http.server 48391",
    url: "http://127.0.0.1:48391/",
    reuseExistingServer: true,
    stdout: "ignore",
    stderr: "pipe",
  },
});

