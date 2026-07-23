import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ru from "./locales/ru";
import uz from "./locales/uz";

export const SUPPORTED_LANGUAGES = ["ru", "uz"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

const STORAGE_KEY = "lang";

const getInitialLanguage = (): Language => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && (SUPPORTED_LANGUAGES as readonly string[]).includes(saved)) {
        return saved as Language;
    }
    return "ru";
};

i18n.use(initReactI18next).init({
    resources: {
        ru: { translation: ru },
        uz: { translation: uz },
    },
    lng: getInitialLanguage(),
    fallbackLng: "ru",
    interpolation: {
        escapeValue: false,
    },
});

i18n.on("languageChanged", (lng) => {
    localStorage.setItem(STORAGE_KEY, lng);
    document.documentElement.setAttribute("lang", lng);
});

document.documentElement.setAttribute("lang", i18n.language);

export default i18n;
