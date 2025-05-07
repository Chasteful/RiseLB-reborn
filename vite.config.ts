// vite.config.ts
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import rawPlugin from 'vite-plugin-raw';
import path from 'path'

export default defineConfig({
  plugins: [
    svelte(),
   
    rawPlugin({

      match: /\.frag$/
    }),
  ],
  base: './',
  build: {
    outDir: path.resolve('E:/Program Files/Minecraft/Modpacks/.minecraft/versions/LiquidBounce Nextgen/LiquidBounce/themes/1.6.1'),
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
