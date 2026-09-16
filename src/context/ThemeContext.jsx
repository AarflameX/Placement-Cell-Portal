import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("theme") || "system";
    } catch {
      return "system";
    }
  });

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = () => {
      let resolvedDark = false;
      if (theme === "dark") {
        resolvedDark = true;
      } else if (theme === "light") {
        resolvedDark = false;
      } else {
        // System preference
        resolvedDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      }

      setIsDark(resolvedDark);

      if (resolvedDark) {
        root.classList.add("dark");
        root.style.colorScheme = "dark";
      } else {
        root.classList.remove("dark");
        root.style.colorScheme = "light";
      }
    };

    applyTheme();

    try {
      localStorage.setItem("theme", theme);
    } catch (e) {
      console.warn("Failed to persist theme in localStorage:", e);
    }

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
