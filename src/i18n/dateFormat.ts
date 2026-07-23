import i18n from "./index";

// 0 (Sunday) → 7, чтобы совпадать со словарём days (1=Пн … 7=Вс)
const weekdayKey = (date: Date) => {
    const d = date.getDay();
    return d === 0 ? 7 : d;
};

// «23 июля 2026» (ru) / «23 Iyul 2026» (uz)
export const formatFullDate = (date: Date): string => {
    if (i18n.language === "uz") {
        return `${date.getDate()} ${i18n.t(`months.${date.getMonth() + 1}`)} ${date.getFullYear()}`;
    }
    return new Intl.DateTimeFormat("ru-RU", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    }).format(date);
};

// «23 июля» (ru) / «23 Iyul» (uz)
export const formatDayMonth = (date: Date): string => {
    if (i18n.language === "uz") {
        return `${date.getDate()} ${i18n.t(`months.${date.getMonth() + 1}`)}`;
    }
    return new Intl.DateTimeFormat("ru-RU", {
        day: "numeric",
        month: "long",
    }).format(date);
};

// «среда» (ru) / «Chorshanba» (uz)
export const formatWeekday = (date: Date): string => {
    if (i18n.language === "uz") {
        return i18n.t(`days.full.${weekdayKey(date)}`);
    }
    return new Intl.DateTimeFormat("ru-RU", { weekday: "long" }).format(date);
};
