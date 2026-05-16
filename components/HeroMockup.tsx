import Image from "next/image";
import { ArrowUp, Check, Layers, MapPin, Ruler } from "lucide-react";

/** A framed mock of the Atelier workspace used as the hero visual. */
export function HeroMockup() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border-bright bg-surface shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)]">
      {/* window chrome */}
      <div className="flex items-center gap-2 border-b border-border bg-surface-2 px-4 py-3">
        <span className="size-3 rounded-full bg-[#3a3329]" />
        <span className="size-3 rounded-full bg-[#3a3329]" />
        <span className="size-3 rounded-full bg-[#3a3329]" />
        <div className="ml-3 flex h-6 flex-1 items-center rounded-md bg-ink px-3 text-[11px] text-muted-2">
          atelier.design/builder/hillside-residence
        </div>
      </div>

      <div className="grid gap-px bg-border lg:grid-cols-[300px_1fr]">
        {/* chat sidebar */}
        <div className="flex flex-col gap-3 bg-surface p-4">
          <p className="text-[11px] uppercase tracking-[0.15em] text-muted-2">
            Design brief
          </p>
          <div className="rounded-lg rounded-tl-sm bg-surface-2 p-3 text-xs leading-relaxed text-muted">
            4-bed modern farmhouse, 2,900 sq ft. Single story, vaulted great
            room, primary wing separated from the kids&apos; rooms.
          </div>
          <div className="ml-auto max-w-[85%] rounded-lg rounded-tr-sm bg-copper/15 p-3 text-xs leading-relaxed text-copper-bright">
            Plan, parcel fit, and 6 renders ready. Want a covered porch on the
            south elevation?
          </div>
          <div className="rounded-lg rounded-tl-sm bg-surface-2 p-3 text-xs leading-relaxed text-muted">
            Yes — wrap it around to the east too.
          </div>
          <div className="mt-auto flex items-center gap-2 rounded-full border border-border bg-ink px-3 py-2">
            <span className="flex-1 text-xs text-muted-2">Describe a change…</span>
            <span className="grid size-6 place-items-center rounded-full bg-copper text-ink">
              <ArrowUp className="size-3.5" />
            </span>
          </div>
        </div>

        {/* canvas */}
        <div className="relative bg-surface p-4">
          <div className="relative aspect-[16/10] overflow-hidden rounded-lg border border-border">
            <Image
              src="/showcase/showcase-modern-farmhouse.jpg"
              alt="Photoreal render of a modern farmhouse generated in Atelier"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 760px"
              className="object-cover"
            />
            {/* floating spec chips */}
            <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
              {[
                { icon: Ruler, label: "2,940 sq ft" },
                { icon: Layers, label: "Single story" },
                { icon: MapPin, label: "Parcel: 0.61 ac" },
              ].map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="flex items-center gap-1.5 rounded-full border border-border-bright bg-ink/85 px-2.5 py-1 text-[11px] text-foreground backdrop-blur"
                >
                  <Icon className="size-3 text-copper" />
                  {label}
                </span>
              ))}
            </div>
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full border border-sage/40 bg-ink/85 px-2.5 py-1 text-[11px] text-sage backdrop-blur">
              <Check className="size-3" />
              Zoning: compliant
            </div>
          </div>

          {/* render thumbnails */}
          <div className="mt-3 grid grid-cols-4 gap-2">
            {[
              "showcase-lake-home.jpg",
              "showcase-courtyard-modern.jpg",
              "showcase-mountain-cabin.jpg",
              "showcase-coastal-cottage.jpg",
            ].map((file, i) => (
              <div
                key={file}
                className={`relative aspect-[4/3] overflow-hidden rounded-md border ${
                  i === 0 ? "border-copper" : "border-border"
                }`}
              >
                <Image
                  src={`/showcase/${file}`}
                  alt=""
                  fill
                  sizes="160px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
