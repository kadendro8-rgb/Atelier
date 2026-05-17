import Image from "next/image";
import { ArrowUp, Check, Layers, MapPin, Ruler, Sparkles } from "lucide-react";

/** A framed mock of the Atelier workspace used as the hero visual. */
export function HeroMockup() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl shadow-black/50">
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b border-border bg-surface-2 px-4 py-3">
        <span className="size-3 rounded-full bg-surface-3" />
        <span className="size-3 rounded-full bg-surface-3" />
        <span className="size-3 rounded-full bg-surface-3" />
        <div className="ml-3 flex h-7 flex-1 items-center rounded-lg bg-ink px-4 text-xs text-muted-2">
          <span className="flex items-center gap-2">
            <Sparkles className="size-3 text-copper" />
            atelier.design/builder/hillside-residence
          </span>
        </div>
      </div>

      <div className="grid gap-px bg-border lg:grid-cols-[320px_1fr]">
        {/* Chat sidebar */}
        <div className="flex flex-col gap-4 bg-surface p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted-2">
              Design Brief
            </p>
            <span className="flex items-center gap-1.5 rounded-full bg-sage/10 px-2 py-0.5 text-[10px] text-sage">
              <span className="size-1.5 rounded-full bg-sage" />
              AI Active
            </span>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl rounded-tl-sm bg-surface-2 p-4 text-sm leading-relaxed text-muted">
              4-bed modern farmhouse, 2,900 sq ft. Single story, vaulted great
              room, primary wing separated from kids&apos; rooms.
            </div>
            <div className="ml-auto max-w-[90%] rounded-xl rounded-tr-sm bg-copper/10 p-4 text-sm leading-relaxed text-copper-bright">
              Plan, parcel fit, and 6 renders ready. Want a covered porch on the
              south elevation?
            </div>
            <div className="rounded-xl rounded-tl-sm bg-surface-2 p-4 text-sm leading-relaxed text-muted">
              Yes — wrap it around to the east side too.
            </div>
          </div>

          <div className="mt-auto">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-ink px-4 py-3">
              <span className="flex-1 text-sm text-muted-2">Describe a change...</span>
              <span className="grid size-8 place-items-center rounded-lg bg-copper text-ink transition-colors hover:bg-copper-bright">
                <ArrowUp className="size-4" />
              </span>
            </div>
          </div>
        </div>

        {/* Canvas area */}
        <div className="relative bg-surface p-5">
          <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-border">
            <Image
              src="/showcase/showcase-modern-farmhouse.jpg"
              alt="Photoreal render of a modern farmhouse generated in Atelier"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 760px"
              className="object-cover"
            />
            {/* Floating spec chips */}
            <div className="absolute left-4 top-4 flex flex-wrap gap-2">
              {[
                { icon: Ruler, label: "2,940 sq ft" },
                { icon: Layers, label: "Single story" },
                { icon: MapPin, label: "0.61 ac lot" },
              ].map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="flex items-center gap-2 rounded-lg border border-border-bright bg-ink/90 px-3 py-1.5 text-xs text-foreground backdrop-blur-sm"
                >
                  <Icon className="size-3.5 text-copper" />
                  {label}
                </span>
              ))}
            </div>
            {/* Compliance badge */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-lg border border-sage/30 bg-ink/90 px-3 py-1.5 text-xs text-sage backdrop-blur-sm">
              <Check className="size-3.5" />
              Zoning compliant
            </div>
          </div>

          {/* Render thumbnails */}
          <div className="mt-4 grid grid-cols-4 gap-3">
            {[
              { file: "showcase-lake-home.jpg", active: true },
              { file: "showcase-courtyard-modern.jpg", active: false },
              { file: "showcase-mountain-cabin.jpg", active: false },
              { file: "showcase-coastal-cottage.jpg", active: false },
            ].map(({ file, active }) => (
              <div
                key={file}
                className={`relative aspect-[4/3] cursor-pointer overflow-hidden rounded-lg border transition-all hover:border-copper/50 ${
                  active ? "border-copper ring-2 ring-copper/20" : "border-border"
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
