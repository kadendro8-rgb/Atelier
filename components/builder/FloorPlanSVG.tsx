import type { FloorPlan, RoomTone } from "@/lib/design";

const toneFill: Record<RoomTone, string> = {
  public: "rgba(210,138,85,0.16)",
  private: "rgba(143,161,131,0.14)",
  service: "rgba(66,58,44,0.55)",
  primary: "rgba(210,138,85,0.30)",
  outdoor: "rgba(143,161,131,0.07)",
};

const toneText: Record<RoomTone, string> = {
  public: "#ecab78",
  private: "#a9bd9d",
  service: "#a89e8c",
  primary: "#ecab78",
  outdoor: "#8fa183",
};

export function FloorPlanSVG({ plan }: { plan: FloorPlan }) {
  const pad = 10;

  return (
    <svg
      viewBox={`${-pad} ${-pad} ${plan.width + pad * 2} ${plan.height + pad * 2}`}
      className="h-full w-full"
      role="img"
      aria-label={`Generated floor plan, ${plan.level}`}
    >
      <rect
        x={-pad}
        y={-pad}
        width={plan.width + pad * 2}
        height={plan.height + pad * 2}
        fill="#100e0b"
      />
      {plan.rooms.map((room) => {
        const showLabel = room.w > 46 && room.h > 24;
        return (
          <g key={room.id}>
            <rect
              x={room.x}
              y={room.y}
              width={room.w}
              height={room.h}
              fill={toneFill[room.tone]}
              stroke="#423a2c"
              strokeWidth={2}
              strokeDasharray={room.tone === "outdoor" ? "6 4" : undefined}
            />
            {showLabel && (
              <text
                x={room.x + room.w / 2}
                y={room.y + room.h / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={room.h < 40 ? 11 : 13}
                fill={toneText[room.tone]}
                style={{ fontWeight: 500 }}
              >
                {room.label}
              </text>
            )}
          </g>
        );
      })}
      <rect
        x={0}
        y={0}
        width={plan.width}
        height={plan.height}
        fill="none"
        stroke="#5a4f3a"
        strokeWidth={4}
      />
    </svg>
  );
}
