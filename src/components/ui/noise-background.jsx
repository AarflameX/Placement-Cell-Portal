import { useId } from "react";

/**
 * NoiseBackground (Aceternity UI specification)
 *
 * Renders an elegant noise-textured gradient outline / border around a solid card,
 * matching the modern Bento / Aceternity design aesthetic.
 *
 * The noise gradient is visible only as a crisp 1.5px perimeter outline,
 * while the card body remains a solid, clean, professional background.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to place inside the card
 * @param {string[]} [props.gradientColors] - Colors for the ambient perimeter gradient points
 * @param {number} [props.noiseIntensity] - Opacity of the noise texture (default: 0.22)
 * @param {string} [props.containerClassName] - Classes applied to the outer outline container
 * @param {string} [props.className] - Classes applied to the inner card content wrapper
 * @param {string} [props.innerClassName] - Solid background and border styling for the inner card
 * @param {string} [props.borderWidth] - Thickness of the outline gap (default: 'p-[1.5px]')
 */
export function NoiseBackground({
  children,
  gradientColors = [
    "rgba(215, 135, 150, 0.55)", // subtle muted rose / coral
    "rgba(235, 190, 140, 0.55)", // warm champagne / amber
    "rgba(145, 160, 210, 0.5)",  // soft slate periwinkle
  ],
  noiseIntensity = 0.29,
  containerClassName = "",
  className = "",
  innerClassName = "bg-white dark:bg-[#121215]",
  borderWidth = "p-[6px]",
  animate = true,
  ...props
}) {
  const filterId = useId().replace(/:/g, "_");

  const color1 = gradientColors[0] || "rgba(215, 135, 150, 0.55)";
  const color2 = gradientColors[1] || "rgba(235, 190, 140, 0.55)";
  const color3 = gradientColors[2] || "rgba(145, 160, 210, 0.5)";

  const animationClass = animate
    ? "animate-ambient-drift motion-reduce:animate-none"
    : "";

  return (
    <div
      className={`relative ${borderWidth} rounded-2xl md:rounded-3xl overflow-hidden bg-neutral-200/70 dark:bg-[#18181c] ${containerClassName}`}
      {...props}
    >
      {/* Ambient Gradient Outline Underlay with Slow Tranquil Drift */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {/* Light Mode Underlay: Clean, luminous pastel glow */}
        <div
          className={`absolute -inset-[35%] opacity-90 blur-[6px] dark:hidden transition-opacity duration-300 ${animationClass}`}
          style={{
            background: `radial-gradient(circle at 15% 15%, rgba(240, 135, 155, 0.55) 0%, transparent 60%),
                         radial-gradient(circle at 85% 20%, rgba(245, 185, 105, 0.55) 0%, transparent 60%),
                         radial-gradient(circle at 50% 90%, rgba(145, 170, 240, 0.5) 0%, transparent 65%),
                         linear-gradient(135deg, rgba(250, 251, 254, 0.95), rgba(235, 240, 248, 0.95))`,
          }}
        />

        {/* Dark Mode Underlay: Deep obsidian luminous aura */}
        <div
          className={`absolute -inset-[35%] opacity-95 blur-[6px] hidden dark:block transition-opacity duration-300 ${animationClass}`}
          style={{
            background: `radial-gradient(circle at 15% 15%, ${color1} 0%, transparent 60%),
                         radial-gradient(circle at 85% 20%, ${color2} 0%, transparent 60%),
                         radial-gradient(circle at 50% 90%, ${color3} 0%, transparent 65%),
                         linear-gradient(135deg, rgba(22, 22, 26, 0.7), rgba(15, 15, 18, 0.85))`,
          }}
        />
      </div>

      {/* SVG Noise Texture Overlay on the Outline (10% reduced intensity) */}
      <svg
        className="pointer-events-none absolute inset-0 z-1 h-full w-full mix-blend-multiply dark:mix-blend-color-dodge select-none"
        style={{ opacity: noiseIntensity }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id={`noise-${filterId}`}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#noise-${filterId})`} />
      </svg>

      {/* Inner Solid Card Body (Opaque, isolating content from the gradient) */}
      <div
        className={`relative z-10 w-full h-full rounded-xl md:rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs text-neutral-900 dark:text-neutral-100 ${innerClassName} ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

export default NoiseBackground;
