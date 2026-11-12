import { defineConfig, transformWithEsbuild } from "vite";
import react from "@vitejs/plugin-react";

const jsxInJsPlugin = {
  name: "treat-js-files-as-jsx",
  enforce: "pre",
  async transform(code, id) {
    if (!id.match(/src[\\/].*\.js$/)) return null;
    return transformWithEsbuild(code, id, {
      loader: "jsx",
      jsx: "automatic",
    });
  },
};

export default defineConfig({
  plugins: [jsxInJsPlugin, react()],
  envPrefix: ["VITE_", "REACT_APP_"],
  server: {
    port: 3001,
    strictPort: true,
  },
  preview: {
    port: 3001,
    strictPort: true,
  },
  build: {
    outDir: "build",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "mui-vendor": ["@mui/material", "@mui/icons-material", "@emotion/react", "@emotion/styled"],
          "chart-vendor": ["chart.js", "react-chartjs-2"],
        },
      },
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        ".js": "jsx",
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.js",
  },
});
