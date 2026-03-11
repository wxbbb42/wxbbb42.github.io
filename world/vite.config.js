import { defineConfig } from 'vite'

export default defineConfig({
  base: '/world/dist/',
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
  assetsInclude: ['**/*.glb'],
  server: {
    open: true,
  },
})
