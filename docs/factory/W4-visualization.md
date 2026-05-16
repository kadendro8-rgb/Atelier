# W4 — Visualization Worker

See `docs/factory.md` for factory rules and quality gates.

**Mission:** Make the 3D output beautiful enough that a builder pays $349/mo
to show a client a render of their actual home on their actual lot.

**Owns:** `app/builder/3d/page.tsx`, `app/builder/renders/page.tsx`,
`components/Viewport3D.tsx`, `lib/three/` (extrude, materials, lighting,
terrain, neighbors, pathtrace).

**Done means:**
- Walls extrude with CSG door/window cutouts; slab + roof per brief.
- 30 PBR material presets, click-to-apply.
- Sun from SunCalc + time-of-day slider; HDRI environment with fallback.
- Terrain mesh + extruded neighbors from W2 data.
- 6 camera presets; path-traced 4K render saved to Storage.
- 60fps on M1, 30fps on 5-year Windows.

**Initial backlog:**
1. R3F scene mount.
2. Wall extrusion from `PlanGraph.walls[]`.
3. CSG cutouts via `three-bvh-csg`.
4. Roof geometry.
5. Default PBR materials.
6. SunCalc sun + shadows.
7. Time-of-day slider.
8. HDRI lazy-load.
9. Camera presets.
10. Terrain + neighbors from W2.
11. Material library panel.
12. Path-traced render button.

**Status note:** a CORE `Viewport3D` + `buildScene` (extruded massing, orbit
camera) is implemented. Remaining: CSG, materials, lighting, terrain, renders.
