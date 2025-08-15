import { useEffect, useState } from "react";

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    return (localStorage.getItem("theme") as "light" | "dark") ?? "light";
  });

  useEffect(() => {
    const updateTheme = () => {
      const storedTheme = localStorage.getItem("theme") as
        | "light"
        | "dark"
        | null;
      if (storedTheme) {
        setTheme(storedTheme);
      } else {
        // Fallback: leer la clase del DOM
        const isDark = document.documentElement.classList.contains("dark");
        setTheme(isDark ? "dark" : "light");
      }
    };

    // Escuchar cambios en localStorage
    window.addEventListener("storage", updateTheme);

    // Observar cambios en la clase del DOM
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains("dark");
      const currentTheme = isDark ? "dark" : "light";
      setTheme(currentTheme);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      window.removeEventListener("storage", updateTheme);
      observer.disconnect();
    };
  }, []);

  return theme;
}
