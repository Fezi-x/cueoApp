# Mistake Registry

| Date       | Area        | Mistake / Don't Do Again | Root Cause | Resolution / Action Taken | Status |
|------------|-------------|--------------------------|------------|---------------------------|--------|
| 2026-02-09 | Tooling / UI | Do not use NativeWind v4 CSS pipeline for this project; it caused Metro hangs and async plugin errors. Use NativeWind v2 + Tailwind 3.2.7 minimal setup. | Incompatible Tailwind async plugins with NativeWind v2/Expo config on Windows | Pinned Tailwind to 3.2.7 and removed CSS/Metro pipeline | Banned |
| 2026-02-26 | Tooling / UI | Do not move UI into new folders without updating Tailwind `content` globs; it caused all styles to drop (UI disappeared). | Tailwind config only scanned `App.tsx` and `index.ts`, so new component classes were not generated. | Added `./components/**/*.{js,jsx,ts,tsx}` to `tailwind.config.js` and restarted Metro. | Closed |
