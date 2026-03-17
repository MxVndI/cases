import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface Preferences {
  customCursor: boolean;
  countUpAnimations: boolean;
}

interface PreferencesContextValue extends Preferences {
  setCustomCursor: (v: boolean) => void;
  setCountUpAnimations: (v: boolean) => void;
}

const defaults: Preferences = { customCursor: true, countUpAnimations: true };

function load(): Preferences {
  try {
    const raw = localStorage.getItem("ui-preferences");
    if (!raw) return defaults;
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return defaults;
  }
}

function save(prefs: Preferences) {
  localStorage.setItem("ui-preferences", JSON.stringify(prefs));
}

const PreferencesContext = createContext<PreferencesContextValue>({
  ...defaults,
  setCustomCursor: () => {},
  setCountUpAnimations: () => {},
});

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(load);

  useEffect(() => save(prefs), [prefs]);

  return (
    <PreferencesContext.Provider
      value={{
        ...prefs,
        setCustomCursor: (v) => setPrefs((p) => ({ ...p, customCursor: v })),
        setCountUpAnimations: (v) => setPrefs((p) => ({ ...p, countUpAnimations: v })),
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  return useContext(PreferencesContext);
}
