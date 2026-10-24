import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      // In local dev, proxy /api to FastAPI on :8500 or :8000 if VITE_API_URL is empty
      proxy: env.VITE_API_URL ? undefined : { "/api": "http://localhost:8000" }
    }
  };
});