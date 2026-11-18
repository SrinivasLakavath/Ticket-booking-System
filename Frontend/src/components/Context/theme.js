import { createContext, useContext, useEffect, useState } from "react";

export const ThemeContext = createContext({
    theme: 'cineseat',
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (!saved || saved === 'luxury' || saved === 'dark') return 'cineseat';
    return saved;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'cineseat' ? 'light' : 'cineseat'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default function useTheme() {
    return useContext(ThemeContext);
}
