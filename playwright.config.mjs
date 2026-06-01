import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  use: {
    baseURL: process.env.LABAJ_BASE_URL || "http://127.0.0.1:48391/",
  },
  webServer: {
    command: "python3 -m http.server 48391",
    url: "http://127.0.0.1:48391/",
    reuseExistingServer: true,
    stdout: "ignore",
    stderr: "pipe",
  },
});

