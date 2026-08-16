# Knowledge Islands interactive website standard

## 1. Purpose

Use this implementation for a single interactive browser application such as a dashboard. It is mutually exclusive with the content implementation.

## 2. Current implementation

The application uses React, React DOM, Vite, and the official React Vite plugin. `index.html` is the application entry and loads a `src/main.tsx` or `src/main.jsx` module. `vite build` emits `dist/`; Vite's default `build.outDir` is already `dist`.

The root package scripts expose `ki:site:build` using `vite build` and `ki:site:dev` using `vite`. A `site/` workspace or flat root is valid, provided the command and output resolve within the same site root.

## 3. Static publication

The output is a client-only static application. A host serving client-side routes must provide an SPA fallback to `index.html`. That setting belongs to the hosting adapter. Server-side Worker code is not implied by React or Vite.
