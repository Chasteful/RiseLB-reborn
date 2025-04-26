import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  base: './', 
  build: {
    outDir: path.resolve('E:/Program Files/Minecraft/Modpacks/.minecraft/versions/LiquidBounce Nextgen/LiquidBounce/themes/1.5.6.042625_RC'),
    emptyOutDir: true,
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: "modern"
      }
    }
  }
})