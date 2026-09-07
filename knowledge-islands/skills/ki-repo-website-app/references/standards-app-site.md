# Knowledge Islands interactive website standard

## 1. Purpose

Use this implementation for a single interactive browser application such as a dashboard. It is mutually exclusive with the content implementation.

## 2. Current implementation

The application uses React, React DOM, Vite, and the official React Vite plugin. An `index.html` application entry loads a `src/main.tsx` or `src/main.jsx` module. `vite build` emits `dist/`; Vite's default `build.outDir` is already `dist`.

The selected site's package scripts expose `build` using `vite build` and `dev` using `vite`. `ki-repo-website` alone selects the root: `apps/site` by default, `.` explicitly for a flat repository, or another safe relative override. `[skills.ki-repo-website-app]` remains keyless. The repository root package exposes the public `ki:site:*` aliases and delegates them to these local scripts.

Dependencies, Vite configuration, `index.html`, `src/main.*`, scripts, and `dist/` all resolve from that one root. Root-level or sibling manifests and configurations do not satisfy the app contract when another root is selected.

## 3. Static publication

The output is a client-only static application. A host serving client-side routes must provide an SPA fallback to `index.html`. That setting belongs to the hosting adapter. Server-side Worker code is not implied by React or Vite.

## 4. Application rendered test

An interactive application must be rendered by its own test suite, in whatever forms it has — read-only or editing, populated or empty — rather than only being reasoned about through the modules beneath it. A suite that exercises the model and never builds the tree cannot see faults that exist only once the tree is built: a control drawn inside a layer that takes no pointer events, a helper referenced above the line that declares it, or a hook whose order changes with a prop.

Rendering to static markup is enough and is the cheaper default. `react-dom/server` is already present wherever React is, so it needs no DOM environment and no additional dependency; the component throws either way. Reach for a DOM only when the assertion genuinely needs one, such as measuring layout or dispatching events.

Do not substitute a lint rule for this. A use-before-declaration rule does not fire when the call sits inside a closure, even where that closure is invoked synchronously, so it reports nothing while the application throws on first paint.

## 5. Test pattern matches the file

Where the site declares a test include, the pattern must cover the component file extension as well as the module one — `.tsx` alongside `.ts` for a React application, or `.jsx` alongside `.js` for a JavaScript one.

This matters because of how the omission fails. A pattern matching only `.ts` does not error on a `.tsx` test: it silently collects nothing and the suite reports every other test as passing. The signal the reader takes from the green run is exactly the signal that the missing test file removes, so the omission is invisible when it matters most.
