// Per-style SEO landing copy for /showcase/{id}.
// Each entry carries metadata fields plus an ordered list of body
// sections (heading + paragraphs). Body copy totals 600-800 words.

import type { StyleId } from "@/lib/design";

export type ShowcaseSection = {
  heading: string;
  paragraphs: string[];
};

export type ShowcaseFact = {
  label: string;
  value: string;
};

export type ShowcaseContent = {
  metaTitle: string;
  metaDescription: string;
  tagline: string;
  facts: ShowcaseFact[];
  sections: ShowcaseSection[];
};

export const SHOWCASE_CONTENT: Record<StyleId, ShowcaseContent> = {
  "modern-farmhouse": {
    metaTitle: "Modern Farmhouse Home Design",
    metaDescription:
      "Design a modern farmhouse custom home with Atelier — board-and-batten, a vaulted great room, and a wraparound porch, with typical square footage and lot size.",
    tagline:
      "A board-and-batten silhouette, a vaulted great room, and a porch deep enough to live on.",
    facts: [
      { label: "Typical size", value: "2,400 - 3,400 sq ft" },
      { label: "Typical lot", value: "0.3 - 2 acres" },
      { label: "Best for", value: "Families wanting open, casual living" },
    ],
    sections: [
      {
        heading: "What defines a modern farmhouse",
        paragraphs: [
          "The modern farmhouse is the most-requested custom-home style in North America, and for good reason: it reads as familiar without feeling dated. The exterior leans on a tight palette — white or warm-grey board-and-batten siding, black-framed windows, a standing-seam metal roof over the porch, and natural-wood accents at the entry. The gable forms are simple and steep, and the massing is honest: you can see how the house is put together.",
          "Inside, the style is defined by a vaulted great room that fuses kitchen, dining, and living into one volume. Exposed beams, shiplap, and a generous island anchor the space. Mudrooms, walk-in pantries, and a drop zone off the garage are treated as essential rooms rather than afterthoughts.",
        ],
      },
      {
        heading: "Size, lot, and who builds it",
        paragraphs: [
          "Most modern farmhouses land between 2,400 and 3,400 square feet across one or two stories, with three to five bedrooms. The wraparound or full-front porch wants room to breathe, so lots from a third of an acre up to a couple of acres suit the style best — semi-rural parcels and large suburban lots are the natural fit.",
          "These homes are built by production and semi-custom builders nationwide, but the version worth owning is the one a custom builder or residential designer tailors to your site, your sun angles, and the way your household actually moves through a morning.",
        ],
      },
      {
        heading: "How Atelier designs it",
        paragraphs: [
          "With Atelier, you describe the home you want in plain language. Our brief parser pulls out the style, bedroom count, square footage, and lot size, then generates a parametric floor plan with the great room, primary suite, and bedroom wing already arranged. You adjust garage bays, porch depth, and whether a study is carved out — the plan re-flows instantly.",
          "From there you get photoreal renders, a site plan placed on your lot, and transparent pricing for the consultation and design deposit. What used to take a quarter of back-and-forth becomes an afternoon, and what you hand a builder is permit-ready rather than a mood board.",
        ],
      },
    ],
  },
  "lake-home": {
    metaTitle: "Lake Home Design",
    metaDescription:
      "Design a lakefront custom home with Atelier — lake-facing glass, a walkout lower level, and a screened upper deck, sized for waterfront lots.",
    tagline:
      "Lake-facing glass, a walkout lower level, and a screened deck that follows the sun.",
    facts: [
      { label: "Typical size", value: "2,600 - 4,200 sq ft" },
      { label: "Typical lot", value: "0.25 - 1.5 acres, sloped to water" },
      { label: "Best for", value: "Waterfront and four-season retreats" },
    ],
    sections: [
      {
        heading: "What defines a lake home",
        paragraphs: [
          "A lake home is organized around a single fact: one side faces the water and the other faces the road. Every good lake-home plan pushes living spaces, glass, and decks toward the lake, and tucks the garage, entry, and service rooms toward the street. The result is a house with two distinct faces — a modest, welcoming arrival side and a wide-open lake side.",
          "The defining moves are large lake-facing windows, a walkout lower level that opens to grade as the lot falls toward the shore, and stacked outdoor rooms: an open main deck and a screened upper deck to escape evening insects. Materials trend toward cedar, stone, and dark metal that weather gracefully in a humid, sunny environment.",
        ],
      },
      {
        heading: "Size, lot, and who builds it",
        paragraphs: [
          "Lake homes typically run 2,600 to 4,200 square feet because the walkout level adds a full floor of finished space — bunk rooms, a rec room, and a wet bar are common. Lots are usually a quarter to one-and-a-half acres and slope toward the water, which is exactly what makes the walkout possible.",
          "Waterfront builds are handled by custom builders who understand shoreline setbacks, septic constraints, and the local rules that govern how close to the water you can build. That regulatory layer is why a site-specific design matters more here than almost anywhere else.",
        ],
      },
      {
        heading: "How Atelier designs it",
        paragraphs: [
          "Atelier asks where the water is and orients the plan accordingly. The brief becomes a floor plan with public rooms and the primary suite on the lake side, and the generated site plan places the footprint on your actual lot so you can see the setback to the shoreline before you commit.",
          "You tune the deck depth, the number of lower-level bedrooms, and the garage, then review photoreal renders from the dock looking back at the house. The deposit and consultation pricing are shown up front, and the package you take to a builder is detailed enough to price and permit.",
        ],
      },
    ],
  },
  "courtyard-modern": {
    metaTitle: "Courtyard Modern Home Design",
    metaDescription:
      "Design a courtyard modern custom home with Atelier — an L-shaped plan wrapped around a private central courtyard, sized for urban and infill lots.",
    tagline:
      "An L-shaped plan folded around a private courtyard that becomes the heart of the house.",
    facts: [
      { label: "Typical size", value: "2,200 - 3,600 sq ft" },
      { label: "Typical lot", value: "0.15 - 0.5 acres" },
      { label: "Best for", value: "Privacy on tight or overlooked lots" },
    ],
    sections: [
      {
        heading: "What defines courtyard modern",
        paragraphs: [
          "Courtyard modern turns a house inward. Instead of facing a yard the neighbors can see, the plan wraps an L or U shape around a private outdoor room at the center. That courtyard becomes the home's true living space — sheltered from wind and street noise, lit from every side, and visible from nearly every interior room.",
          "Architecturally the style is clean and restrained: flat or low-slope roofs, large sliding glass walls that dissolve the boundary between inside and courtyard, and a calm material palette of stucco, smooth masonry, and warm wood soffits. The drama comes from light and framed views rather than ornament.",
        ],
      },
      {
        heading: "Size, lot, and who builds it",
        paragraphs: [
          "Courtyard homes usually run 2,200 to 3,600 square feet. Because the plan is its own privacy screen, the style works beautifully on smaller lots — fifteen-hundredths of an acre to half an acre — including infill parcels surrounded by other houses. The courtyard delivers usable outdoor space even when the lot has no real backyard.",
          "These homes are built by custom builders comfortable with large glazed openings, flat-roof detailing, and the waterproofing a courtyard demands. It is a style that rewards precision in construction.",
        ],
      },
      {
        heading: "How Atelier designs it",
        paragraphs: [
          "Atelier generates the L-shaped footprint with the courtyard already positioned at the inside corner, so living, dining, and the primary suite all open onto it. You decide how deep the wings run and how much glass faces the courtyard, and the plan adjusts.",
          "The site plan drops the footprint onto your lot and shows how the courtyard captures sun through the day. Renders let you stand in that courtyard before the foundation is poured, and clear consultation-and-deposit pricing means you can move from idea to permit-ready package in a single afternoon.",
        ],
      },
    ],
  },
  "mountain-cabin": {
    metaTitle: "Mountain Cabin Home Design",
    metaDescription:
      "Design a mountain cabin custom home with Atelier — a steep-roof timber frame engineered for heavy snow load, sized for sloped alpine lots.",
    tagline:
      "A steep-roof timber frame built to shed snow and frame the ridgeline.",
    facts: [
      { label: "Typical size", value: "1,800 - 3,200 sq ft" },
      { label: "Typical lot", value: "0.5 - 5 acres, sloped" },
      { label: "Best for", value: "Alpine sites and four-season retreats" },
    ],
    sections: [
      {
        heading: "What defines a mountain cabin",
        paragraphs: [
          "A mountain cabin is shaped by climate before anything else. The steep gable roof exists to shed heavy snow rather than to hold it, deep overhangs protect walls and windows from snowmelt, and the structure is engineered for a snow load that flatlanders never think about. Done well, the cabin looks like it grew out of the slope.",
          "The interior signature is a timber frame: exposed posts and beams, a soaring great room with a stone fireplace, and large windows aimed at the best view. Materials are honest and durable — full-log or timber framing, stone bases, standing-seam metal roofing, and wood that is allowed to age.",
        ],
      },
      {
        heading: "Size, lot, and who builds it",
        paragraphs: [
          "Mountain cabins range from a compact 1,800 square feet to a roomy 3,200, often with a loft and a walkout lower level that the slope makes natural. Lots are typically half an acre to five acres, and the grade is a feature, not a flaw — it gives you the daylight basement and the elevated main-level view.",
          "These homes are built by custom builders experienced with hillside foundations, frost depth, snow loading, and the logistics of building at elevation. Access, drainage, and fire-resistant detailing all shape the design.",
        ],
      },
      {
        heading: "How Atelier designs it",
        paragraphs: [
          "Atelier takes your brief and produces a plan with the great room and primary suite oriented to the view, the entry and garage tucked uphill, and a lower level where the grade allows. You adjust stories, loft, and garage bays and watch the plan re-flow.",
          "The site plan sets the footprint on your sloped parcel so you can read the cut and fill, and photoreal renders show the cabin against its ridgeline. Transparent pricing and a permit-ready package mean less time guessing and more time building.",
        ],
      },
    ],
  },
  "coastal-cottage": {
    metaTitle: "Coastal Cottage Home Design",
    metaDescription:
      "Design a coastal cottage custom home with Atelier — elevated pilings, hurricane-rated openings, and a shaded porch, sized for shoreline lots.",
    tagline:
      "Raised on pilings, wrapped in hurricane-rated glass, and shaded by a deep porch.",
    facts: [
      { label: "Typical size", value: "1,600 - 2,800 sq ft" },
      { label: "Typical lot", value: "0.1 - 0.4 acres, coastal" },
      { label: "Best for", value: "Beachfront and barrier-island sites" },
    ],
    sections: [
      {
        heading: "What defines a coastal cottage",
        paragraphs: [
          "A coastal cottage is a small house with serious engineering. To meet flood and storm requirements, the living space is lifted onto pilings, leaving a covered ground level for parking and storage. That elevation also lifts the main rooms into the breeze and the view.",
          "The style is breezy and informal: lap or shake siding in soft colors, a metal roof, and a deep porch that shades the south-facing glass. The defining hardware is invisible until a storm — hurricane-rated impact windows and doors, properly tied-down framing, and details that survive salt air and wind-driven rain.",
        ],
      },
      {
        heading: "Size, lot, and who builds it",
        paragraphs: [
          "Coastal cottages are intentionally modest — usually 1,600 to 2,800 square feet — because beachfront lots are small and storm-rated construction rewards a compact footprint. Lots commonly run a tenth to four-tenths of an acre on barrier islands and shoreline streets.",
          "These homes are built by coastal-specialist custom builders who know flood-zone elevation certificates, wind-borne-debris codes, and the inspections that come with building near the water. The regulatory envelope is strict, which makes a precise design essential.",
        ],
      },
      {
        heading: "How Atelier designs it",
        paragraphs: [
          "Atelier reads your brief and elevates the plan, placing living spaces and the primary suite on the main level above the parking podium, with the porch on the view side. You set bedroom count, porch depth, and garage capacity, and the plan responds.",
          "The site plan positions the footprint on your coastal lot, and renders show the cottage from the beach. With consultation-and-deposit pricing visible up front, you leave with a permit-ready package built for the shoreline rather than a generic plan.",
        ],
      },
    ],
  },
  "desert-contemporary": {
    metaTitle: "Desert Contemporary Home Design",
    metaDescription:
      "Design a desert contemporary custom home with Atelier — low-slope roofs, deep overhangs, and a shaded ramada, sized for arid southwestern lots.",
    tagline:
      "Low-slope roofs, deep overhangs, and a ramada built to manage the desert sun.",
    facts: [
      { label: "Typical size", value: "2,400 - 4,000 sq ft" },
      { label: "Typical lot", value: "0.3 - 1.5 acres" },
      { label: "Best for", value: "Arid climates and dramatic horizons" },
    ],
    sections: [
      {
        heading: "What defines desert contemporary",
        paragraphs: [
          "Desert contemporary is a study in managing sun. Low-slope and flat roofs sit over deep overhangs that throw shade across the walls and windows during the hottest hours. The massing is horizontal and grounded, echoing the desert floor rather than fighting it.",
          "The signature outdoor room is the ramada — a shaded structure that extends living space into the landscape without baking in direct sun. Materials are earthy and thermally smart: smooth stucco, board-formed concrete, weathering steel, and stone, paired with strategically placed glass that frames the horizon while controlling glare and heat gain.",
        ],
      },
      {
        heading: "Size, lot, and who builds it",
        paragraphs: [
          "Desert contemporary homes typically run 2,400 to 4,000 square feet, usually single-story to keep the horizontal line intact. Lots are commonly three-tenths to one-and-a-half acres, often with long views that the design is built to capture.",
          "These homes are built by southwestern custom builders fluent in stucco systems, flat-roof drainage, and the insulation and shading strategies that keep energy costs sane in extreme heat. Orientation and overhang depth are design decisions with real utility-bill consequences.",
        ],
      },
      {
        heading: "How Atelier designs it",
        paragraphs: [
          "Atelier turns your brief into a low, horizontal plan with the ramada and main glass placed to balance view and shade. You adjust the footprint, garage, and where the outdoor rooms sit, and the plan updates immediately.",
          "The site plan places the home on your parcel and shows how overhangs and the ramada manage the sun's path. Renders let you see the house glowing at dusk, and transparent pricing plus a permit-ready package compress months of process into an afternoon.",
        ],
      },
    ],
  },
  "craftsman-bungalow": {
    metaTitle: "Craftsman Bungalow Home Design",
    metaDescription:
      "Design a craftsman bungalow custom home with Atelier — tapered columns, exposed rafter tails, and a built-in entry bench, sized for classic neighborhood lots.",
    tagline:
      "Tapered porch columns, exposed rafter tails, and built-in joinery that feels handmade.",
    facts: [
      { label: "Typical size", value: "1,500 - 2,600 sq ft" },
      { label: "Typical lot", value: "0.1 - 0.3 acres" },
      { label: "Best for", value: "Walkable neighborhoods and infill" },
    ],
    sections: [
      {
        heading: "What defines a craftsman bungalow",
        paragraphs: [
          "The craftsman bungalow is the most enduring American house style, rooted in the early-twentieth-century Arts and Crafts movement. Its grammar is instantly recognizable: a low-pitched gable roof with wide eaves, exposed rafter tails and decorative brackets, tapered columns on stone or brick piers, and a welcoming covered front porch.",
          "Inside, the style is defined by craft and built-in furniture. Window seats, bookcases, a bench at the entry, coffered ceilings, and natural-wood trim do the decorating. Rooms are efficient and connected, with the porch acting as a true extension of the living space.",
        ],
      },
      {
        heading: "Size, lot, and who builds it",
        paragraphs: [
          "Bungalows are modest by design — usually 1,500 to 2,600 square feet across one or one-and-a-half stories, often with a finished attic or bonus room under that broad roof. The compact footprint fits classic neighborhood lots of a tenth to three-tenths of an acre, which makes the style a natural fit for infill in established towns.",
          "These homes are built by custom and renovation-minded builders who value trim carpentry and know how to make a new house feel like it belongs on an old street.",
        ],
      },
      {
        heading: "How Atelier designs it",
        paragraphs: [
          "Atelier reads your brief and lays out an efficient bungalow plan with the porch, public rooms, and a practical bedroom wing already arranged. You adjust the porch, whether a study is included, and the garage, and the plan re-flows.",
          "The site plan fits the footprint to your lot, and photoreal renders show the tapered columns and deep eaves in context. With consultation-and-deposit pricing shown up front, you walk away with a permit-ready package instead of a Pinterest board.",
        ],
      },
    ],
  },
  "prairie-ranch": {
    metaTitle: "Prairie Ranch Home Design",
    metaDescription:
      "Design a prairie ranch custom home with Atelier — long, low horizontal massing with a split-bedroom layout, sized for wide single-level lots.",
    tagline:
      "A long, low horizontal line with a split-bedroom plan and single-level living.",
    facts: [
      { label: "Typical size", value: "2,000 - 3,200 sq ft" },
      { label: "Typical lot", value: "0.3 - 2 acres, wide" },
      { label: "Best for", value: "Single-level living and aging in place" },
    ],
    sections: [
      {
        heading: "What defines a prairie ranch",
        paragraphs: [
          "The prairie ranch marries the horizontal calm of Prairie-school architecture with the practicality of the single-story ranch. The roof is low and broad, the eaves are wide, and the massing stretches across the lot rather than reaching upward. The house hugs the ground.",
          "The defining interior move is the split-bedroom layout: the primary suite sits at one end of the house and the secondary bedrooms at the other, with the public rooms in between. It is single-level living done well — no stairs, generous halls, and an easy flow from the great room to a covered patio.",
        ],
      },
      {
        heading: "Size, lot, and who builds it",
        paragraphs: [
          "Prairie ranches typically run 2,000 to 3,200 square feet, all on one level. Because the plan spreads out, the style wants a wide lot — three-tenths of an acre to a couple of acres — where the long facade has room to read.",
          "These homes are built by custom builders across the Midwest and beyond, and the style is a favorite for buyers planning to age in place: the absence of stairs and the wide doorways make accessibility straightforward to design in from the start.",
        ],
      },
      {
        heading: "How Atelier designs it",
        paragraphs: [
          "Atelier turns your brief into a single-level plan with the primary suite split from the secondary bedrooms and the great room anchoring the center. You adjust garage bays, porch, and whether a study is added, and the plan responds instantly.",
          "The site plan places the long footprint on your wide lot so you can confirm the setbacks, and renders show the low horizontal line in context. Transparent pricing and a permit-ready package mean you move from brief to builder in an afternoon.",
        ],
      },
    ],
  },
  "hillside-villa": {
    metaTitle: "Hillside Villa Home Design",
    metaDescription:
      "Design a hillside villa custom home with Atelier — a stepped, multi-level plan that follows a downhill grade, sized for sloped view lots.",
    tagline:
      "A stepped, multi-level plan that descends with the slope and opens to the view.",
    facts: [
      { label: "Typical size", value: "3,000 - 5,000 sq ft" },
      { label: "Typical lot", value: "0.3 - 2 acres, steeply sloped" },
      { label: "Best for", value: "Dramatic downhill view lots" },
    ],
    sections: [
      {
        heading: "What defines a hillside villa",
        paragraphs: [
          "A hillside villa is designed to work with a slope rather than flatten it. Instead of a single pad cut violently into the grade, the plan steps down the hill in stages — entry and garage at the top, public rooms and the primary suite on the main level, and additional bedrooms or a media room on the level below.",
          "The style turns the grade into an asset. Each stepped level can have its own terrace, and the downhill face becomes a wall of glass aimed at the view. Materials lean Mediterranean or modern depending on the region, but the structural idea is constant: a layered house that grows out of the hill.",
        ],
      },
      {
        heading: "Size, lot, and who builds it",
        paragraphs: [
          "Hillside villas are usually generous, 3,000 to 5,000 square feet, because the stepped section naturally produces multiple levels. Lots run three-tenths of an acre to two acres and slope steeply — the steeper the grade, the more dramatic the result.",
          "These homes are built by custom builders experienced with retaining walls, stepped foundations, drainage, and the geotechnical work a real hillside demands. It is the most engineering-intensive style here, which is exactly why a site-specific design pays off.",
        ],
      },
      {
        heading: "How Atelier designs it",
        paragraphs: [
          "Atelier takes your brief and produces a multi-level plan with the entry uphill, public rooms and primary suite on the main level, and a lower level where the grade allows. You adjust stories, garage, and the downhill glass, and the plan re-flows.",
          "The site plan sets the stepped footprint on your sloped parcel so you can read how the house terraces down, and renders show the villa against its view. Transparent pricing and a permit-ready package replace months of uncertainty with a single afternoon of clarity.",
        ],
      },
    ],
  },
  "urban-infill": {
    metaTitle: "Urban Infill Home Design",
    metaDescription:
      "Design an urban infill custom home with Atelier — a narrow stacked plan with a rooftop terrace and a ground-floor ADU, sized for tight city lots.",
    tagline:
      "A narrow, stacked plan with a rooftop terrace and a ground-floor ADU.",
    facts: [
      { label: "Typical size", value: "1,800 - 3,000 sq ft" },
      { label: "Typical lot", value: "0.03 - 0.12 acres, narrow" },
      { label: "Best for", value: "Tight city lots and dense neighborhoods" },
    ],
    sections: [
      {
        heading: "What defines urban infill",
        paragraphs: [
          "Urban infill is the art of building a full custom home on a narrow city lot. When a parcel is too tight to spread out, the plan goes up: living spaces stack across two or three floors, and the limited footprint is used with discipline. Every square foot earns its place.",
          "The style has two signature moves. The first is the rooftop terrace — outdoor living relocated to the one part of a tight lot that is never overlooked. The second is a ground-floor accessory dwelling unit, a small separate residence that can house family, generate rent, or serve as a home office. Together they make a small lot live large.",
        ],
      },
      {
        heading: "Size, lot, and who builds it",
        paragraphs: [
          "Urban infill homes typically run 1,800 to 3,000 square feet over two or three stories. Lots are deliberately small — three-hundredths to twelve-hundredths of an acre — and often narrow, which is exactly the condition the stacked plan is built to solve.",
          "These homes are built by city-focused custom builders who navigate zero-lot-line setbacks, party-wall conditions, parking requirements, and the ADU rules that vary block by block. Local code fluency is part of the design.",
        ],
      },
      {
        heading: "How Atelier designs it",
        paragraphs: [
          "Atelier reads your brief and stacks the plan vertically, placing the ADU on the ground floor, the public rooms and primary suite above, and the terrace on the roof. You adjust stories, garage, and whether the ADU is included, and the plan responds.",
          "The site plan fits the narrow footprint to your city lot so you can confirm the tight setbacks, and renders show the home from the street and the rooftop. With pricing shown up front, you leave with a permit-ready package tuned to a dense, regulated site.",
        ],
      },
    ],
  },
};
