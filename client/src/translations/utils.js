import polish from "./polish.json";
import english from "./english.json";

export const Language = {
  English: "english",
  Polish: "polish",
};

export const getActiveLanguage = () =>
  localStorage.getItem("language") ?? Language.English;

export const t = (key) =>
  getActiveLanguage() === Language.English ? english[key] : polish[key];
