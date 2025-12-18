import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-extra-files',
      writeBundle() {
        // 移动 popup HTML 到 dist 根目录
        const srcHtml = path.resolve(__dirname, 'dist/src/popup/index.html');
        const destHtml = path.resolve(__dirname, 'dist/popup.html');
        if (fs.existsSync(srcHtml)) fs.renameSync(srcHtml, destHtml);

        // 删除空 src 文件夹
        const srcFolder = path.resolve(__dirname, 'dist/src');
        if (fs.existsSync(srcFolder)) fs.rmSync(srcFolder, { recursive: true, force: true });

        // 拷贝 manifest.json
        // fs.copyFileSync('manifest.json', 'dist/manifest.json');
        
        // 拷贝 content.js 到 dist/
        const contentSrc = path.resolve(__dirname, 'src/content.js')
        const contentDest = path.resolve(__dirname, 'dist/content.js')
        if (fs.existsSync(contentSrc)) fs.copyFileSync(contentSrc, contentDest)

        // 拷贝 turndown.js（UMD）到 dist/
        const turndownSrc = path.resolve(__dirname, 'src/turndown.js')
        const turndownDest = path.resolve(__dirname, 'dist/turndown.js')
        if (fs.existsSync(turndownSrc)) fs.copyFileSync(turndownSrc, turndownDest)

        // 拷贝 manifest.json 到 dist/
        const manifestSrc = path.resolve(__dirname, 'manifest.json')
        const manifestDest = path.resolve(__dirname, 'dist/manifest.json')
        if (fs.existsSync(manifestSrc)) fs.copyFileSync(manifestSrc, manifestDest)
      }
    }
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: path.resolve(__dirname, 'src/popup/index.html')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    }
  }
});
