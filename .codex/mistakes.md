# Mistake Registry

| Date       | Area        | Mistake / Don't Do Again | Root Cause | Resolution / Action Taken | Status |
|------------|-------------|--------------------------|------------|---------------------------|--------|
| 2026-02-09 | Tooling / UI | Do not use NativeWind v4 CSS pipeline for this project; it caused Metro hangs and async plugin errors. Use NativeWind v2 + Tailwind 3.2.7 minimal setup. | Incompatible Tailwind async plugins with NativeWind v2/Expo config on Windows | Pinned Tailwind to 3.2.7 and removed CSS/Metro pipeline | Banned |
