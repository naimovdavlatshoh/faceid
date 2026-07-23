// Общие справочники и типы для модуля «Авансы»

import i18n from "@/i18n";

export interface Advance {
    id: number;
    object_id: number;
    object_name: string;
    faceid_user_id: number;
    employee_name: string;
    amount: number;
    payment_method: number;
    month: number;
    year: number;
    comment: string | null;
    created_at: string;
    updated_at: string;
}


// Значения месяцев; подписи берутся из словаря months.* через labelKey
export const ADVANCE_MONTHS = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    labelKey: `months.${i + 1}`,
}));

// Диапазон годов для селектов (бэкенд допускает 2025–2100)
export const ADVANCE_YEARS = Array.from({ length: 6 }, (_, i) => 2025 + i);

// 1 = Наличные, 2 = Карта
export const PAYMENT_METHODS = [
    { value: "1", labelKey: "advances.methodCash" },
    { value: "2", labelKey: "advances.methodCard" },
];

export const paymentMethodName = (method: number) => {
    const key = PAYMENT_METHODS.find((m) => m.value === String(method))?.labelKey;
    return key ? i18n.t(key) : "—";
};

export const monthName = (month: number) => i18n.t(`months.${month}`);

export const formatSum = (amount: number = 0) =>
    new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(amount);
