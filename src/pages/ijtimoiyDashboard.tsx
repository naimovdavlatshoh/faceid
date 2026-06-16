import { cn } from "@/lib/utils";
// import { Badge } from "@/components/ui/badge";
import { useMemo, useState, useEffect } from "react";
import {
    FiUsers,
    FiUserCheck,
    FiClock,
    FiUserX,
    FiGrid,
    FiAlertTriangle,
    FiAward,
} from "react-icons/fi";
import { Loader2 } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Link } from "react-router-dom";
import { GetDashboardAttendance } from "@/services/data";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Cell,
    LineChart,
    Line,
    PieChart,
    Pie,
    Legend,
} from "recharts";

/* ----------------------------- Типы ответа API ---------------------------- */

type DashboardSummary = {
    date_from: string;
    date_to: string;
    is_single_day: boolean;
    objects_count: number;
    employees_total: number;
    on_time: number;
    late: number;
    absent: number;
    attendance_rate: number;
    punctuality_rate: number;
};

type DashboardObject = {
    object_id: number;
    object_name: string;
    employees_count: number;
    on_time: number;
    late: number;
    absent: number;
    no_shift: number;
    attendance_rate: number;
    punctuality_rate: number;
};

type DayDetail = {
    date: string;
    late: Array<{
        name: string;
        position: string;
        object_name: string;
        time: string;
    }>;
    absent: Array<{ name: string; position: string; object_name: string }>;
    no_shift: Array<{ name: string; position: string; object_name: string }>;
};

type TrendPoint = {
    date: string;
    attendance_rate: number;
    punctuality_rate: number;
    on_time: number;
    late: number;
    absent: number;
};

type ViolatorRow = {
    faceid_user_id: number;
    name: string;
    position: string;
    object_name: string;
    late: number;
    absent: number;
    total: number;
    work_days: number;
};

type PerfectRow = {
    faceid_user_id: number;
    name: string;
    position: string;
    object_name: string;
    work_days: number;
};

type DashboardData = {
    summary: DashboardSummary;
    objects: DashboardObject[];
    day_detail?: DayDetail;
    trend?: TrendPoint[];
    violators?: {
        by_late: ViolatorRow[];
        by_absent: ViolatorRow[];
        by_total: ViolatorRow[];
    };
    perfect?: PerfectRow[];
};

/* ------------------------------- Палитра ---------------------------------- */
// Берём из tailwind.config: mainbg/maintx + семантика опоздал/не пришёл.
const COLORS = {
    onTime: "#16a34a", // green-600 — вовремя (было #078dee)
    late: "#f59e0b",
    absent: "#ef4444",
    accent: "#4dacff",
    grid: "#e5e7eb",
    axis: "#9ca3af",
};

/* ------------------------------ Утилиты дат ------------------------------- */

const formatDateForApi = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
};

const today = (): string => formatDateForApi(new Date());

const ruDate = (iso: string): string => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    try {
        return new Intl.DateTimeFormat("ru-RU", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        }).format(d);
    } catch {
        return iso;
    }
};

const ruDateShort = (iso: string): string => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    try {
        return new Intl.DateTimeFormat("ru-RU", {
            day: "2-digit",
            month: "short",
        }).format(d);
    } catch {
        return iso;
    }
};

/* --------------------------- Мелкие компоненты ---------------------------- */

const StatCard = ({
    label,
    value,
    helper,
    icon: Icon,
    accent,
}: {
    label: string;
    value: string | number;
    helper?: string;
    icon: React.ComponentType<{ className?: string }>;
    accent: string;
}) => (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className={cn("w-fit rounded-2xl p-3", accent)}>
            <Icon className="h-6 w-6" />
        </div>
        <p className="mt-4 text-sm uppercase tracking-wide text-gray-400">
            {label}
        </p>
        <div className="mt-1 flex items-end gap-2">
            <span className="text-3xl font-semibold text-gray-900">
                {value}
            </span>
            {helper && (
                <span className="pb-1 text-sm text-gray-500">{helper}</span>
            )}
        </div>
    </div>
);

const SectionCard = ({
    title,
    subtitle,
    children,
    className,
}: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    className?: string;
}) => (
    <div
        className={cn(
            "rounded-2xl md:rounded-3xl border border-mainbg/20 bg-white p-4 md:p-6 shadow-sm min-w-0",
            className
        )}
    >
        <div className="mb-4">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                {title}
            </h2>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        {children}
    </div>
);

// Цвет процента: зелёный/жёлтый/красный по порогам.
const rateColor = (rate: number): string => {
    if (rate >= 80) return "text-green-600";
    if (rate >= 50) return "text-amber-600";
    return "text-red-600";
};

/* ------------------------------ Тултипы ----------------------------------- */

const ObjectTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const o = payload[0].payload as DashboardObject;
    return (
        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-md">
            <p className="font-semibold text-gray-900">{o.object_name}</p>
            <p className="text-green-600">Вовремя: {o.on_time}</p>
            <p className="text-amber-600">Опоздали: {o.late}</p>
            <p className="text-red-600">Не пришли: {o.absent}</p>
            <p className="mt-1 font-medium text-gray-700">
                Посещаемость: {o.attendance_rate}%
            </p>
        </div>
    );
};

const TrendTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    return (
        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-md">
            <p className="font-semibold text-gray-900">{ruDate(label)}</p>
            {payload.map((p: any) => (
                <p key={p.dataKey} style={{ color: p.color }}>
                    {p.name}: {p.value}%
                </p>
            ))}
        </div>
    );
};

/* ------------------------------ Основной --------------------------------- */

const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<DashboardData | null>(null);

    const [dateFrom, setDateFrom] = useState<string>(today());
    const [dateTo, setDateTo] = useState<string>(today());
    const [objectId, setObjectId] = useState<string>("all");

    const fromValue = useMemo(() => {
        const p = new Date(dateFrom);
        return Number.isNaN(p.getTime()) ? undefined : p;
    }, [dateFrom]);

    const toValue = useMemo(() => {
        const p = new Date(dateTo);
        return Number.isNaN(p.getTime()) ? undefined : p;
    }, [dateTo]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await GetDashboardAttendance(
                    dateFrom,
                    dateTo,
                    objectId === "all" ? undefined : Number(objectId)
                );
                setData(res);
            } catch (err: any) {
                setError(
                    err?.response?.data?.error ||
                        err?.response?.data?.message ||
                        "Не удалось загрузить данные дашборда"
                );
            } finally {
                setLoading(false);
            }
        };
        const t = setTimeout(fetchData, 100);
        return () => clearTimeout(t);
    }, [dateFrom, dateTo, objectId]);

    // Объекты для рейтинга: сортировка уже сделана на бэке, но подстрахуемся.
    const objectsSorted = useMemo(() => {
        if (!data) return [];
        return [...data.objects].sort(
            (a, b) => b.attendance_rate - a.attendance_rate
        );
    }, [data]);

    // Данные пирога для дневного режима.
    const pieData = useMemo(() => {
        if (!data) return [];
        const s = data.summary;
        return [
            { name: "Вовремя", value: s.on_time, color: COLORS.onTime },
            { name: "Опоздали", value: s.late, color: COLORS.late },
            { name: "Не пришли", value: s.absent, color: COLORS.absent },
        ].filter((x) => x.value > 0);
    }, [data]);

    const handleFrom = (d: Date | undefined) => {
        if (!d) return;
        const iso = formatDateForApi(d);
        setDateFrom(iso);
        // если "до" раньше нового "от" — подтягиваем
        if (dateTo < iso) setDateTo(iso);
    };

    const handleTo = (d: Date | undefined) => {
        if (!d) return;
        setDateTo(formatDateForApi(d));
    };

    /* ------------------------------ Состояния ----------------------------- */

    if (loading) {
        return (
            <div className="h-[80vh] w-full flex justify-center items-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-mainbg" />
                    <p className="text-gray-500 text-sm">Загрузка данных...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-[80vh] w-full flex flex-col justify-center items-center">
                <p className="text-red-500 text-lg mb-4">{error}</p>
                <button
                    onClick={() => {
                        setDateFrom(today());
                        setDateTo(today());
                        setObjectId("all");
                    }}
                    className="px-4 py-2 bg-maintx text-white rounded-lg hover:bg-maintx/80"
                >
                    Попробовать снова
                </button>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="h-[80vh] w-full flex justify-center items-center">
                <p className="text-gray-500 text-lg">
                    Нет данных для отображения
                </p>
            </div>
        );
    }

    const { summary } = data;
    const isSingle = summary.is_single_day;

    return (
        <div className="space-y-4 md:space-y-6 pb-6 md:pb-10">
            {/* Шапка с фильтрами */}
            <div className="rounded-2xl md:rounded-3xl border border-mainbg/30 bg-gradient-to-br from-white via-blue-50 to-white p-4 md:p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="min-w-0">
                        <p className="text-xs md:text-sm uppercase tracking-widest text-gray-400">
                            Обзор посещаемости
                        </p>
                        <h1 className="text-xl md:text-3xl font-semibold text-gray-900">
                            {isSingle
                                ? ruDate(summary.date_from)
                                : `${ruDate(summary.date_from)} — ${ruDate(
                                      summary.date_to
                                  )}`}
                        </h1>
                        <p className="text-gray-500">
                            {isSingle
                                ? "Статистика за день по всем объектам"
                                : "Сводная статистика за период"}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-end gap-3">
                        <div className="flex flex-col gap-1">
                            <span className="text-xs uppercase tracking-wide text-gray-400">
                                С даты
                            </span>
                            <DatePicker
                                date={fromValue}
                                onSelect={handleFrom}
                                placeholder="С"
                                className="min-w-[150px]"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-xs uppercase tracking-wide text-gray-400">
                                По дату
                            </span>
                            <DatePicker
                                date={toValue}
                                onSelect={handleTo}
                                placeholder="По"
                                className="min-w-[150px]"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-xs uppercase tracking-wide text-gray-400">
                                Объект
                            </span>
                            <Select
                                value={objectId}
                                onValueChange={setObjectId}
                            >
                                <SelectTrigger className="min-w-[180px]">
                                    <SelectValue placeholder="Объект" />
                                </SelectTrigger>
                                <SelectContent className="max-w-[280px]">
                                    <SelectItem value="all">
                                        Все объекты
                                    </SelectItem>
                                    {data.objects.map((o) => (
                                        <SelectItem
                                            key={o.object_id}
                                            value={String(o.object_id)}
                                        >
                                            <span
                                                className="block max-w-[230px] truncate"
                                                title={o.object_name}
                                            >
                                                {o.object_name}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI-карточки */}
            <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
                <StatCard
                    label="Объектов"
                    value={summary.objects_count}
                    icon={FiGrid}
                    accent="bg-mainbg/10 text-maintx"
                />
                <StatCard
                    label="Сотрудников"
                    value={summary.employees_total}
                    icon={FiUsers}
                    accent="bg-light-blue/10 text-light-blue-600"
                />
                <StatCard
                    label="Посещаемость"
                    value={`${summary.attendance_rate}%`}
                    helper={`${summary.on_time + summary.late} из ${
                        summary.employees_total
                    }`}
                    icon={FiUserCheck}
                    accent="bg-green-100 text-green-600"
                />
                <StatCard
                    label="Пунктуальность"
                    value={`${summary.punctuality_rate}%`}
                    helper={`${summary.on_time} вовремя`}
                    icon={FiClock}
                    accent="bg-amber-100 text-amber-600"
                />
                <StatCard
                    label="Не пришли"
                    value={summary.absent}
                    icon={FiUserX}
                    accent="bg-red-100 text-red-600"
                />
            </div>

            {/* Рейтинг объектов */}
            <SectionCard
                title="Рейтинг объектов"
                subtitle="Отсортировано по посещаемости — сверху лучшие"
            >
                <div
                    style={{
                        width: "100%",
                        height: Math.max(objectsSorted.length * 44 + 40, 200),
                    }}
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            layout="vertical"
                            data={objectsSorted}
                            margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
                            barSize={18}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                horizontal={false}
                                stroke={COLORS.grid}
                            />
                            <XAxis
                                type="number"
                                tick={{ fontSize: 11, fill: COLORS.axis }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                type="category"
                                dataKey="object_name"
                                width={140}
                                tick={{ fontSize: 11, fill: COLORS.axis }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                content={<ObjectTooltip />}
                                cursor={{ fill: "rgba(77,172,255,0.06)" }}
                            />
                            <Bar
                                dataKey="on_time"
                                stackId="a"
                                fill={COLORS.onTime}
                                name="Вовремя"
                                radius={[4, 0, 0, 4]}
                            />
                            <Bar
                                dataKey="late"
                                stackId="a"
                                fill={COLORS.late}
                                name="Опоздали"
                            />
                            <Bar
                                dataKey="absent"
                                stackId="a"
                                fill={COLORS.absent}
                                name="Не пришли"
                                radius={[0, 4, 4, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                    <Legendish color={COLORS.onTime} label="Вовремя" />
                    <Legendish color={COLORS.late} label="Опоздали" />
                    <Legendish color={COLORS.absent} label="Не пришли" />
                </div>
            </SectionCard>

            {/* Таблица объектов с процентами + пометка про терминал */}
            <SectionCard
                title="Показатели по объектам"
                subtitle="Посещаемость и пунктуальность каждого объекта"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 text-left text-gray-400">
                                <th className="py-2 pr-4 font-medium">
                                    Объект
                                </th>
                                <th className="py-2 px-2 font-medium text-center">
                                    Сотр.
                                </th>
                                <th className="py-2 px-2 font-medium text-center text-green-600">
                                    Вовремя
                                </th>
                                <th className="py-2 px-2 font-medium text-center text-amber-600">
                                    Опозд.
                                </th>
                                <th className="py-2 px-2 font-medium text-center text-red-600">
                                    Не приш.
                                </th>
                                <th className="py-2 px-2 font-medium text-center">
                                    Посещ.
                                </th>
                                <th className="py-2 pl-2 font-medium text-center">
                                    Пункт.
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {objectsSorted.map((o) => {
                                const present = o.on_time + o.late;
                                const noData =
                                    present === 0 && o.employees_count > 0;
                                return (
                                    <tr
                                        key={o.object_id}
                                        className="border-b border-gray-50 hover:bg-blue-50/40 cursor-pointer"
                                        onClick={() =>
                                            setObjectId(String(o.object_id))
                                        }
                                    >
                                        <td className="py-2 pr-4">
                                            <span className="font-medium text-gray-800">
                                                {o.object_name}
                                            </span>
                                            {noData && (
                                                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                                                    <FiAlertTriangle className="h-3 w-3" />
                                                    проверьте терминал
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-2 px-2 text-center text-gray-600">
                                            {o.employees_count}
                                        </td>
                                        <td className="py-2 px-2 text-center text-green-600">
                                            {o.on_time}
                                        </td>
                                        <td className="py-2 px-2 text-center text-amber-600">
                                            {o.late}
                                        </td>
                                        <td className="py-2 px-2 text-center text-red-600">
                                            {o.absent}
                                        </td>
                                        <td
                                            className={cn(
                                                "py-2 px-2 text-center font-semibold",
                                                rateColor(o.attendance_rate)
                                            )}
                                        >
                                            {o.attendance_rate}%
                                        </td>
                                        <td
                                            className={cn(
                                                "py-2 pl-2 text-center font-semibold",
                                                rateColor(o.punctuality_rate)
                                            )}
                                        >
                                            {o.punctuality_rate}%
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </SectionCard>

            {/* ---------- Дневной режим: пирог + списки ---------- */}
            {isSingle && data.day_detail && (
                <div className="grid gap-4 lg:grid-cols-3">
                    <SectionCard title="Структура дня">
                        {pieData.length === 0 ? (
                            <EmptyHint text="Нет отметок за этот день" />
                        ) : (
                            <div style={{ width: "100%", height: 240 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={55}
                                            outerRadius={85}
                                            paddingAngle={2}
                                        >
                                            {pieData.map((e) => (
                                                <Cell
                                                    key={e.name}
                                                    fill={e.color}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </SectionCard>

                    <SectionCard
                        title="Опоздавшие"
                        subtitle={`${data.day_detail.late.length} чел.`}
                    >
                        <NameList
                            empty="Опоздавших нет"
                            items={data.day_detail.late.map((l) => ({
                                key: l.name,
                                name: l.name,
                                position: l.position,
                                object_name: l.object_name,
                                right: l.time,
                                rightClass: "text-amber-600",
                            }))}
                        />
                    </SectionCard>

                    <SectionCard
                        title="Не пришли"
                        subtitle={`${data.day_detail.absent.length} чел.`}
                    >
                        <NameList
                            empty="Все на месте"
                            items={data.day_detail.absent.map((a, i) => ({
                                key: `${a.name}-${i}`,
                                name: a.name,
                                position: a.position,
                                object_name: a.object_name,
                            }))}
                        />
                    </SectionCard>
                </div>
            )}

            {/* Смена не назначена — отдельной секцией, если есть */}
            {isSingle &&
                data.day_detail &&
                data.day_detail.no_shift.length > 0 && (
                    <SectionCard
                        title="Смена не назначена"
                        subtitle={`${data.day_detail.no_shift.length} чел. — не учитываются в проценте`}
                    >
                        <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
                            {data.day_detail.no_shift.map((n, i) => (
                                <div
                                    key={`${n.name}-${i}`}
                                    className="rounded-lg px-2 py-1.5 hover:bg-gray-50"
                                >
                                    <p className="truncate text-sm font-medium text-gray-800">
                                        {n.name}
                                    </p>
                                    <PersonMeta
                                        position={n.position}
                                        objectName={n.object_name}
                                    />
                                </div>
                            ))}
                        </div>
                    </SectionCard>
                )}

            {/* ---------- Режим периода: тренд + нарушители + образцовые ---------- */}
            {!isSingle && (
                <>
                    {data.trend && data.trend.length > 0 && (
                        <SectionCard
                            title="Динамика посещаемости"
                            subtitle="Процент по дням периода"
                        >
                            <div style={{ width: "100%", height: 280 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={data.trend}
                                        margin={{
                                            top: 8,
                                            right: 16,
                                            left: 0,
                                            bottom: 0,
                                        }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke={COLORS.grid}
                                        />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={ruDateShort}
                                            tick={{
                                                fontSize: 11,
                                                fill: COLORS.axis,
                                            }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            domain={[0, 100]}
                                            tick={{
                                                fontSize: 11,
                                                fill: COLORS.axis,
                                            }}
                                            axisLine={false}
                                            tickLine={false}
                                            unit="%"
                                        />
                                        <Tooltip content={<TrendTooltip />} />
                                        <Line
                                            type="monotone"
                                            dataKey="attendance_rate"
                                            name="Посещаемость"
                                            stroke={COLORS.onTime}
                                            strokeWidth={2}
                                            dot={{ r: 3 }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="punctuality_rate"
                                            name="Пунктуальность"
                                            stroke={COLORS.late}
                                            strokeWidth={2}
                                            strokeDasharray="5 4"
                                            dot={{ r: 3 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                                <Legendish
                                    color={COLORS.onTime}
                                    label="Посещаемость"
                                />
                                <Legendish
                                    color={COLORS.late}
                                    label="Пунктуальность"
                                />
                            </div>
                        </SectionCard>
                    )}

                    {data.violators && (
                        <div className="grid gap-4 lg:grid-cols-3">
                            <SectionCard
                                title="Частые опоздания"
                                subtitle="Топ по числу опозданий"
                            >
                                <ViolatorList
                                    rows={data.violators.by_late}
                                    metric="late"
                                    empty="Опозданий нет"
                                />
                            </SectionCard>
                            <SectionCard
                                title="Частые неявки"
                                subtitle="Топ по числу отсутствий"
                            >
                                <ViolatorList
                                    rows={data.violators.by_absent}
                                    metric="absent"
                                    empty="Неявок нет"
                                />
                            </SectionCard>
                            <SectionCard
                                title="Группа риска"
                                subtitle="По сумме нарушений"
                            >
                                <ViolatorList
                                    rows={data.violators.by_total}
                                    metric="total"
                                    empty="Нарушений нет"
                                />
                            </SectionCard>
                        </div>
                    )}

                    {data.perfect && data.perfect.length > 0 && (
                        <SectionCard
                            title="Образцовые сотрудники"
                            subtitle="0 опозданий и 0 неявок за период"
                        >
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                {data.perfect.map((p) => (
                                    <Link
                                        key={p.faceid_user_id}
                                        to={`/users/report/${p.faceid_user_id}`}
                                        className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 hover:bg-green-50/50 transition-colors"
                                    >
                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-green-600">
                                            <FiAward className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-gray-800">
                                                {p.name}
                                            </p>
                                            <PersonMeta
                                                position={p.position}
                                                objectName={`${p.object_name} · ${p.work_days} дн.`}
                                            />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </SectionCard>
                    )}
                </>
            )}
        </div>
    );
};

/* --------------------------- Вспомогательные UI --------------------------- */

const Legendish = ({ color, label }: { color: string; label: string }) => (
    <span className="flex items-center gap-1.5">
        <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ background: color }}
        />
        {label}
    </span>
);

const EmptyHint = ({ text }: { text: string }) => (
    <div className="flex h-40 items-center justify-center text-sm text-gray-400">
        {text}
    </div>
);

// Должность + объект под именем: обрезаем в одну строку, полный текст — в title.
const PersonMeta = ({
    position,
    objectName,
}: {
    position?: string;
    objectName?: string;
}) => {
    const parts = [position, objectName].filter(Boolean) as string[];
    if (parts.length === 0) return null;
    const full = parts.join(" · ");
    return (
        <p className="truncate text-xs text-gray-500" title={full}>
            {full}
        </p>
    );
};

const NameList = ({
    items,
    empty,
}: {
    items: Array<{
        key: string | number;
        name: string;
        position?: string;
        object_name?: string;
        right?: string;
        rightClass?: string;
    }>;
    empty: string;
}) => {
    if (items.length === 0) return <EmptyHint text={empty} />;
    return (
        <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
            {items.map((it) => (
                <div
                    key={it.key}
                    className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50"
                >
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-800">
                            {it.name}
                        </p>
                        <PersonMeta
                            position={it.position}
                            objectName={it.object_name}
                        />
                    </div>
                    {it.right && (
                        <span
                            className={cn(
                                "shrink-0 text-sm font-medium",
                                it.rightClass ?? "text-gray-500"
                            )}
                        >
                            {it.right}
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
};

const ViolatorList = ({
    rows,
    metric,
    empty,
}: {
    rows: ViolatorRow[];
    metric: "late" | "absent" | "total";
    empty: string;
}) => {
    if (!rows || rows.length === 0) return <EmptyHint text={empty} />;
    const metricColor =
        metric === "late"
            ? "text-amber-600"
            : metric === "absent"
            ? "text-red-600"
            : "text-gray-900";
    const metricLabel =
        metric === "late"
            ? "опозд."
            : metric === "absent"
            ? "неявок"
            : "всего";
    return (
        <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
            {rows.map((r, i) => (
                <Link
                    key={r.faceid_user_id}
                    to={`/users/report/${r.faceid_user_id}`}
                    className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-gray-50"
                >
                    <span className="w-5 shrink-0 text-center text-xs font-semibold text-gray-400">
                        {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-800">
                            {r.name}
                        </p>
                        <PersonMeta
                            position={r.position}
                            objectName={`${r.object_name} · ${r.work_days} раб. дн.`}
                        />
                    </div>
                    <span
                        className={cn(
                            "shrink-0 text-sm font-semibold",
                            metricColor
                        )}
                    >
                        {r[metric]} {metricLabel}
                    </span>
                </Link>
            ))}
        </div>
    );
};

export default Dashboard;