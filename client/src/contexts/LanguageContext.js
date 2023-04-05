import { createContext } from "react";
import { Language } from "../translations/utils";

export const LanguageContext = createContext({
  activeLanguage: Language.English,
  setActiveLanguage: (language) => {},
});
