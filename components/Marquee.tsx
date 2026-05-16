type MarqueeProps = {
  items: string[];
  reverse?: boolean;
};

/**
 * Seamless CSS-keyframe marquee. The track is duplicated so a -50%
 * translate produces a loop with no visible seam.
 */
export function Marquee({ items, reverse = false }: MarqueeProps) {
  const track = (
    <ul
      className="flex shrink-0 items-center gap-10 px-5"
      aria-hidden={reverse ? "true" : undefined}
    >
      {items.map((item, i) => (
        <li key={i} className="flex items-center gap-10 whitespace-nowrap">
          <span className="text-sm font-medium tracking-wide text-muted">
            {item}
          </span>
          <span className="size-1 rounded-full bg-copper/60" />
        </li>
      ))}
    </ul>
  );

  return (
    <div className="group relative flex w-full overflow-hidden py-5 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div
        className={`flex ${reverse ? "animate-marquee-rev" : "animate-marquee"} group-hover:[animation-play-state:paused] motion-reduce:animate-none`}
      >
        {track}
        {track}
      </div>
    </div>
  );
}
