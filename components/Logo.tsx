type LogoProps = {
  className?: string;
};

/** A compass-and-rooftop mark — drafting tool meets a custom home. */
export function Logo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M16 3.5 4.5 12v16.5h23V12L16 3.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M16 28.5V17m0 0 7.2-5.3M16 17l-7.2-5.3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="17" r="2.4" fill="currentColor" />
    </svg>
  );
}
