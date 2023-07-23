import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [react()],
    define: { "process.env": {}, _global: {} },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    build: {
        rollupOptions: {
            external: ["@mangrovedao/mangrove.js"], // Exclude the problematic package from the build
            output: {
                strict: false,
            },
        },
        sourcemap: false,
    },
});
