import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), tailwindcss()],
	server: {
		host: "0.0.0.0",
		allowedHosts: [
			"ypocsd8on8dv0gn09tpoyyzw.46.202.171.145.sslip.io",
			".46.202.171.145.sslip.io",
		],
		port: 5173,
		strictPort: true,
		hmr: {
			host: "localhost",
			clientPort: 5173,
		},
		watch: {
			usePolling: true,
			interval: 100,
		},
		proxy: {
			"/api": {
				target: "http://localhost:3000",
				changeOrigin: true,
			},
		},
	},
})
