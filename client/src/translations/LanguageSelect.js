import { useContext } from "react";
import { LanguageContext } from "../contexts/LanguageContext";
import { getActiveLanguage, Language, t } from "./utils";
import { Select, MenuItem } from "@mui/material";

export const LanguageSelect = () => {
  const languageContext = useContext(LanguageContext);
  const handleLanguageChange = (language) => {
    languageContext.setActiveLanguage(language);
    localStorage.setItem("language", language);
  };
  return (
    <div style={{ maxWidth: "120px" }}>
      <Select
        labelId="language-select-label"
        id="language-select"
        defaultValue={getActiveLanguage()}
        value={getActiveLanguage()}
        onChange={(e) => handleLanguageChange(e.target.value)}
      >
        <MenuItem value={Language.English}>{t("english")}</MenuItem>
        <MenuItem value={Language.Polish}>{t("polish")}</MenuItem>
      </Select>
    </div>
  );
};
