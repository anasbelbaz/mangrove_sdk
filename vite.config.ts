import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const isProduction = process.env.NODE_ENV === "production";

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
            external: isProduction ? [] : ["@mangrovedao/mangrove.js"],
            // Exclude the problematic package from the build
            output: {
                strict: false,
            },
        },
        sourcemap: false,
    },
});
