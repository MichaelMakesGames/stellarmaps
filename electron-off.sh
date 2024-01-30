#!/usr/bin/bash
npx dot-json package.json main --delete
npx dot-json package.json type "module"
npx dot-json package.json scripts.dev "tauri dev"