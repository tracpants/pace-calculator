import { defineConfig } from 'vite';

export default defineConfig({
	build: {
		target: 'es2020',
		sourcemap: true,
		chunkSizeWarningLimit: 500,
		rollupOptions: {
			output: {
				manualChunks: {
					vendor: ['lucide', 'canvas-confetti', 'notyf', 'dompurify']
				}
			}
		}
	},
	server: {
		port: 5173,
		strictPort: false,
		open: true
	},
	preview: {
		port: 4173,
		strictPort: false
	}
});
