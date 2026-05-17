# Atelier — Foundation Brief

*The unified, Mac-native design powerhouse. One application. One price.
Built to be the best instrument in the industry, and to stay that way.*

---

## 1. What Atelier is

Atelier replaces Adobe Creative Suite, Vectorworks, and Autodesk with a
single, Apple-Silicon-native application. Drawing, painting, page layout,
BIM, precision drafting, parametric 3D, lighting design, and site work are
not separate products — they are **Studios**: workspace presets over one
document model. Move an object from Draw into Build and it keeps its
identity. There is one binary, one file format, one mental model.

It is a **professional instrument**, and it is priced like one:

> **$7,500 — one-time, perpetual, Professional license.**
> You own the version you bought, forever. No subscription. No seat
> audits. No license server deciding whether you may open your own work
> tomorrow.

That number is not an apology. A firm running the incumbents today pays
that *every year* — Creative Cloud Pro at ~$840/yr per seat, AutoCAD at
~$2,030/yr, the AEC Collection at ~$3,675/yr — and pays it again next
year, and owns nothing at the end of it. Atelier asks once. The headline
price *is* the value proposition: pay one time what the industry currently
rents you annually, and keep it.

This supersedes the consumer/perpetual tiers sketched in the original
research report — $7,500 is the flagship Professional license, the number
the product is built and positioned around. Education and a genuine free
personal tier still exist beneath it; they are funnels, not the product.

## 2. The principle — move fast, lose nothing

The incumbents got slow. Illustrator's pen-snap bug has lived in the
tracker since 2020. After Effects expressions still have no native
baking, a request open since 2010. Photoshop's undo history still does
not survive closing the document. These are not hard problems. They are
*unowned* problems — the byproduct of a decade of subscription revenue
arriving whether the software improved or not.

Atelier's advantage is the opposite posture. Its development is run as an
**AI agent factory**: specialized agents continuously survey the field for
the fastest, cleanest, newest way to perform every operation in the
product — and fold those improvements in on a cadence no annual release
train can match. The product *learns its own craft in public*, every week.

But speed is worthless if it costs the soul of the thing. So the factory
operates under one non-negotiable constraint:

> **Improve the product without ever losing its roots, its touch, or its
> elegance.**

Every change must make Atelier faster, clearer, or more capable *and*
leave it feeling like the same calm, considered instrument it was the day
before. The agent factory is allowed to make Atelier quicker. It is never
allowed to make Atelier louder, more cluttered, or less itself. New
techniques are adopted; the original taste is preserved. That is the
whole discipline — relentless improvement, zero drift.

## 3. How Atelier is built on pre-existing software — the doctrine

A $7,500 professional product cannot be a rebranded copy of someone
else's app. It also should not reinvent geometry kernels that the world
has already spent thirty years perfecting. The line between those two is
the **build doctrine**, and it has three rules.

### Rule 1 — Link the libraries. Do not rebrand the apps.

Atelier is built on best-in-class, **permissively licensed** open-source
*libraries* — linked into Atelier's own code, behind Atelier's own UI:

| Library | Role | License |
|---|---|---|
| **OpenCASCADE (OCCT)** | Solid modeling / geometry kernel | LGPL 2.1 + linking exception |
| **openNURBS** | NURBS + `.3dm` interchange | MIT-style |
| **IfcOpenShell** | IFC 2x3 / 4 / 4.3 BIM interop | LGPL |
| **OpenSubdiv** | Subdivision surfaces | Apache-2.0 |
| **Embree** | CPU ray tracing | Apache-2.0 |
| **resvg / cgltf / ufbx / tinyobjloader** | SVG, glTF, FBX-read, OBJ | MPL-2.0 / MIT |
| **Pixar OpenUSD** | USD / USDZ | Apache-2.0 |

This is not white-labeling — it is the normal, legitimate engineering of
every serious CAD product (FreeCAD, BRL-CAD, KiCad and others stand on
the same OCCT foundation). Atelier is the application, the renderer, the
document model, the experience. The libraries are the proven mathematics
underneath. Each one carries its required attribution in the About box.

### Rule 2 — License the commercial SDKs. Do not pirate, do not skip.

Some formats are closed and only reachable through a paid commercial SDK.
The DWG/DXF/DGN family is the important one:

- **ODA Drawings SDK** — Open Design Alliance, Sustaining tier,
  ~$7,500 first year / ~$4,500 recurring. A signed commercial agreement.
- **ODA BimRv add-on** (RVT) — deferred to v2 if budget allows.

These cannot be downloaded and rebranded. They are procured under
contract. The legal operating rules are absolute and already settled law:
never use "DWG", "AutoCAD", "Revit", "Photoshop", or any incumbent
trademark in Atelier's name, icon, or trade dress; never write a
watermark into output; carry the ODA attribution boilerplate. Atelier
*reads and writes* Autodesk's formats flawlessly — it never pretends to
*be* Autodesk.

### Rule 3 — Never adopt anything that poisons the model.

The thing that looks like the shortcut — taking a finished open-source
*application* (FreeCAD, Blender, Krita, Inkscape) and reskinning it — is
the one move Atelier will never make. Those apps are **GPL-licensed**.
Shipping a rebranded GPL application would force *all* of Atelier to
become GPL: full source disclosure, no proprietary perpetual license to
sell, and **no Apple App Store distribution** — the GPL is incompatible
with it. White-labeling a GPL app would destroy the $7,500 product on
contact. The same is true of GPL-licensed DWG libraries (LibreDWG,
libdxfrw); they are excluded for exactly this reason.

**The doctrine in one line:** link the permissive libraries, license the
commercial SDKs, write the application ourselves, and never let a viral
license — or a competitor's trademark — touch the binary.

## 4. Why the doctrine protects the price *and* the customer

The $7,500 license only means something if the promises behind it hold:
your files open forever, in open formats; the software runs fully
offline; nothing you make is used to train a model; there is no audit
firm and no license server. Every one of those promises depends on
Atelier owning its own code. A GPL-tainted binary cannot make the
perpetual-license promise. A pirated SDK cannot make the
won't-get-you-sued promise. The build doctrine is not legal
housekeeping — it is the structural reason the price is honest.

When a decision is genuinely close, the rule from the original spec
still governs: **lose revenue before losing trust.**

## 5. Status & next step

- **Environment:** Atelier's desktop build is a native macOS / iPadOS /
  iOS effort (C++20 kernel, Swift/SwiftUI, Metal renderer). It cannot be
  built or verified in a Linux CI container. It requires a Mac
  development environment or `macos-15-arm64` CI runners.
- **This repository** remains the Atelier web product, positioned as the
  marketing and onboarding surface for the desktop application.
- **Phase 0, when a Mac environment is available:** scaffold the Xcode
  workspace, the CMake C++20 kernel, and the Cargo sync crates; integrate
  the Rule 1 libraries as dependencies; stand up CI; record ADR-0001
  (stack), ADR-0002 (no Mac Catalyst), ADR-0003 (OCCT over Parasolid for
  v1). No desktop code is written before that environment exists.

This document is the record of the foundation and the build doctrine. It
changes only through a superseding revision — never silently.
