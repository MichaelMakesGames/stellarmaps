#!/usr/bin/bash
npx dot-json package.json main "./out/main/index.js"
npx dot-json package.json type "commonjs"
npx dot-json package.json scripts.dev "electron-vite dev --watch"