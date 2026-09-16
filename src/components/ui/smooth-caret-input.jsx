import { useState, useRef, useEffect } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "motion/react";

const PASSWORD_CHAR =
  typeof navigator !== "undefined" && navigator.userAgent.match(/firefox|fxios/i)
    ? "\u25CF"
    : "\u2022";

/**
 * SmoothCaretInput
 *
 * Implements a silky smooth animated custom caret that glides fluidly as the user types,
 * using spring physics from motion/react and exact sub-pixel font metric calculation.
 */
export function SmoothCaretInput({
  value,
  defaultValue = "",
  onChange,
  onFocus,
  onBlur,
  placeholder = "Search...",
  type = "text",
  className = "",
  wrapperClassName = "",
  icon = null,
  clearable = false,
  onClear,
  id,
  name,
  autoComplete,
  disabled = false,
  ...props
}) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const inputValue = isControlled ? String(value ?? "") : internalValue;

  const caretX = useMotionValue(0);
  const caretOpacity = useMotionValue(0);
  const prefersReducedMotion = useReducedMotion();

  const springCaretX = useSpring(
    caretX,
    prefersReducedMotion
      ? { stiffness: 10000, damping: 100, mass: 0.1 }
      : { stiffness: 500, damping: 30, mass: 0.5 }
  );

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const measureRef = useRef(null);

  const syncMeasureSpan = () => {
    const input = inputRef.current;
    const measureSpan = measureRef.current;
    if (!input || !measureSpan) return;

    const styles = window.getComputedStyle(input);
    const isPassword = input.type === "password";

    let fontSize = styles.fontSize;
    if (
      PASSWORD_CHAR === "\u2022" &&
      isPassword &&
      typeof navigator !== "undefined" &&
      !navigator.userAgent.match(/chrome|chromium|crios/i)
    ) {
      fontSize = `${parseFloat(fontSize) + 6.25}px`;
    }

    measureSpan.style.font = `${styles.fontStyle} ${styles.fontWeight} ${fontSize} ${styles.fontFamily}`;
    measureSpan.style.letterSpacing = styles.letterSpacing;
    measureSpan.style.fontFeatureSettings = styles.fontFeatureSettings;
    measureSpan.style.fontVariationSettings = styles.fontVariationSettings;
  };

  const measurePrefixWidth = (text) => {
    const input = inputRef.current;
    const measureSpan = measureRef.current;
    if (!input || !measureSpan) return null;

    syncMeasureSpan();
    measureSpan.textContent = text;

    const paddingLeft =
      parseFloat(window.getComputedStyle(input).paddingLeft) || 0;

    return text.length > 0
      ? measureSpan.offsetWidth + paddingLeft
      : paddingLeft - 1;
  };

  const scrollCaretIntoView = (target, absoluteWidth) => {
    const styles = window.getComputedStyle(target);
    const paddingLeft = parseFloat(styles.paddingLeft) || 0;
    const paddingRight = parseFloat(styles.paddingRight) || 0;
    const maxScroll = Math.max(0, target.scrollWidth - target.clientWidth);
    const visibleRight = target.scrollLeft + target.clientWidth - paddingRight;
    const visibleLeft = target.scrollLeft + paddingLeft;

    if (absoluteWidth > visibleRight) {
      target.scrollLeft = Math.min(
        absoluteWidth - target.clientWidth + paddingRight,
        maxScroll
      );
      return;
    }

    if (absoluteWidth < visibleLeft) {
      target.scrollLeft = Math.max(0, absoluteWidth - paddingLeft);
    }
  };

  const getCaretIndex = (target) => {
    const selectionStart = target.selectionStart ?? 0;
    const selectionEnd = target.selectionEnd ?? 0;

    if (selectionStart === selectionEnd) {
      return selectionStart;
    }

    return target.selectionDirection === "backward"
      ? selectionStart
      : selectionEnd;
  };

  const updateCaretFromInput = (target) => {
    if (!target) return;
    const selectionStart = target.selectionStart ?? 0;
    const selectionEnd = target.selectionEnd ?? 0;
    const hasSelection = selectionStart !== selectionEnd;
    const caretIndex = getCaretIndex(target);
    const isPassword = target.type === "password";
    const textBeforeCaret = isPassword
      ? PASSWORD_CHAR.repeat(caretIndex)
      : (target.value || "").slice(0, caretIndex);

    const absoluteWidth = measurePrefixWidth(textBeforeCaret);
    if (absoluteWidth === null) return;

    scrollCaretIntoView(target, absoluteWidth);

    const styles = window.getComputedStyle(target);
    const paddingLeft = parseFloat(styles.paddingLeft) || 0;
    const paddingRight = parseFloat(styles.paddingRight) || 0;
    const caretPosition = absoluteWidth - target.scrollLeft;
    const minX = paddingLeft - 1;
    const maxX = target.clientWidth - paddingRight;
    const isCaretVisible =
      caretPosition >= minX && caretPosition <= maxX + 1;

    caretX.set(Math.min(caretPosition, maxX));

    if (!isCaretVisible || hasSelection || document.activeElement !== target) {
      caretOpacity.set(0);
      return;
    }

    caretOpacity.set(1);
  };

  const updateCaretRef = useRef(updateCaretFromInput);
  const caretOpacityRef = useRef(caretOpacity);

  useEffect(() => {
    updateCaretRef.current = updateCaretFromInput;
    caretOpacityRef.current = caretOpacity;
  });

  useEffect(() => {
    const input = inputRef.current;
    if (input && document.activeElement === input) {
      updateCaretRef.current?.(input);
    }
  }, [inputValue, type]);

  useEffect(() => {
    const input = inputRef.current;
    const container = containerRef.current;
    if (!input || !container) return;

    const updateCaretIfFocused = () => {
      if (document.activeElement === input) {
        updateCaretRef.current(input);
      }
    };

    const handleSelectionChange = () => {
      if (document.activeElement !== input) return;
      requestAnimationFrame(() => {
        if (document.activeElement === input) {
          updateCaretRef.current(input);
        }
      });
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.addEventListener("loadingdone", updateCaretIfFocused);
      void document.fonts.ready.then(updateCaretIfFocused);
    }
    input.addEventListener("scroll", updateCaretIfFocused);

    let resizeObserver = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(updateCaretIfFocused);
      resizeObserver.observe(container);
    }

    updateCaretIfFocused();

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      if (typeof document !== "undefined" && document.fonts) {
        document.fonts.removeEventListener("loadingdone", updateCaretIfFocused);
      }
      input.removeEventListener("scroll", updateCaretIfFocused);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, []);

  return (
    <div
      className={`group relative flex items-center w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 transition-all duration-150 focus-within:border-neutral-500 dark:focus-within:border-neutral-400 focus-within:ring-1 focus-within:ring-neutral-400/30 ${wrapperClassName}`}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Optional Leading Icon */}
      {icon && (
        <div className="pointer-events-none pl-3.5 pr-0 text-neutral-400 dark:text-neutral-500 flex items-center shrink-0">
          {icon}
        </div>
      )}

      {/* Grid Container for Input, Hidden Measure Span, and Caret */}
      <div
        ref={containerRef}
        className="relative grid grid-cols-1 flex-1 items-center overflow-hidden p-0"
        style={{ caretColor: "transparent" }}
      >
        <input
          {...props}
          ref={inputRef}
          id={id}
          name={name}
          type={type}
          value={inputValue}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          onChange={(e) => {
            if (!isControlled) setInternalValue(e.target.value);
            onChange?.(e);
            requestAnimationFrame(() => {
              updateCaretRef.current(e.target);
            });
          }}
          onFocus={(e) => {
            updateCaretRef.current(e.target);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            caretOpacityRef.current.set(0);
            onBlur?.(e);
          }}
          className={`col-start-1 col-end-2 row-start-1 row-end-2 w-full bg-transparent px-3.5 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 outline-none caret-transparent disabled:opacity-50 ${className}`}
        />

        <span
          ref={measureRef}
          aria-hidden="true"
          className="pointer-events-none invisible absolute top-0 left-0 whitespace-pre"
        />

        <motion.div
          aria-hidden="true"
          className="pointer-events-none col-start-1 col-end-2 row-start-1 row-end-2 h-[1.15em] w-[2px] self-center rounded-full bg-neutral-900 dark:bg-neutral-100 z-10"
          style={{ x: springCaretX, opacity: caretOpacity }}
        />
      </div>

      {/* Clear Button */}
      {clearable && inputValue && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!isControlled) setInternalValue("");
            onChange?.({
              target: { value: "", name },
              currentTarget: { value: "", name },
            });
            onClear?.();
            inputRef.current?.focus();
            caretOpacityRef.current.set(0);
          }}
          className="pr-3 text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300 transition-colors cursor-pointer"
        >
          <span className="sr-only">Clear</span>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default SmoothCaretInput;

