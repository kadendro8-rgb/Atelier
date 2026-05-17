# W5 — Output Worker

See `docs/factory.md` for factory rules and quality gates.

**Mission:** Produce the artifacts that prove this isn't a toy — PDF sheet sets
that print to scale, DWG that opens in AutoCAD, IFC4 that imports into Revit,
GLB that opens in Blender.

**Owns:** `app/builder/sheets/page.tsx`, `lib/sheets/engine.ts`,
`lib/sheets/templates/`, `lib/io/` (exportPDF, exportDWG, exportIFC, exportGLB,
scaleBar, northArrow, titleBlock).

**Done means:**
- "Generate sheet set" → multi-page PDF in < 60s, prints at scale (1/4"=1').
- AIA line weights; sheets A-100 … A-501.
- DWG opens cleanly in AutoCAD 2024+ with correct layers.
- IFC4 passes the buildingSMART validator and imports into Revit/ArchiCAD.
- GLB opens in Blender/Sketchfab with materials.

**Initial backlog:**
1. Title block component.
2. Viewport component (source view + scale + crop).
3. A-101 main level template.
4. `@react-pdf/renderer` multi-page composition.
5. DXF writer with AIA layers.
6. IFC4 STEP-21 writer.
7. Test against AutoCAD / ArchiCAD / Revit / Blender.
8. "Generate sheet set" entry point + downloads UI.

**Status note:** `generateSheetSet` (data model), real DWG export, and a minimal
IFC4 writer are implemented. Remaining: PDF rendering, GLB, the sheets UI.
