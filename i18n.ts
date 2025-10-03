import i18next from "i18next";
import { initReactI18next } from "react-i18next";

// Importe tes fichiers générés par i18next-scanner
import fr from "./src/locales/fr.json";
import en from "./src/locales/en.json";
import zh from "./src/locales/zh.json";

i18next.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
    zh: { translation: zh },
  },
  lng: "fr", // langue par défaut au boot
  fallbackLng: "fr",
  ns: ["translation"],
  defaultNS: "translation",
  interpolation: { escapeValue: false },
  returnNull: false,
  returnEmptyString: false,
});

export default i18next;
