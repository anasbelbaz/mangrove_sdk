import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const isProduction = process.env.NODE_ENV === "production";

export default defineConfig({
    plugins: [react()],
    define: isProduction ? {} : { "process.env": {} },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});
