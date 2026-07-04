// Общие справочники и типы для модуля «Авансы»

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


export const ADVANCE_MONTHS = [
    { value: "1", name: "Январь" },
    { value: "2", name: "Февраль" },
    { value: "3", name: "Март" },
    { value: "4", name: "Апрель" },
    { value: "5", name: "Май" },
    { value: "6", name: "Июнь" },
    { value: "7", name: "Июль" },
    { value: "8", name: "Август" },
    { value: "9", name: "Сентябрь" },
    { value: "10", name: "Октябрь" },
    { value: "11", name: "Ноябрь" },
    { value: "12", name: "Декабрь" },
];

// Диапазон годов для селектов (бэкенд допускает 2025–2100)
export const ADVANCE_YEARS = Array.from({ length: 6 }, (_, i) => 2025 + i);

// 1 = Наличные, 2 = Карта
export const PAYMENT_METHODS = [
    { value: "1", name: "Наличные" },
    { value: "2", name: "Карта" },
];

export const paymentMethodName = (method: number) =>
    PAYMENT_METHODS.find((m) => m.value === String(method))?.name ?? "—";

export const monthName = (month: number) =>
    ADVANCE_MONTHS.find((m) => m.value === String(month))?.name ?? String(month);

export const formatSum = (amount: number = 0) =>
    new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(amount);
