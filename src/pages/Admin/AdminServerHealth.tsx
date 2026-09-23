import { useEffect, useRef, useState } from "react";
import {
    SuperAdminGetServerOverview,
    SuperAdminGetServerMetrics,
    SuperAdminGetServerBackups,
    SuperAdminGetServerPhpErrors,
    SuperAdminGetServerTopProcesses,
    SuperAdminGetServerMysqlHealth,
    SuperAdminGetServerFpmStatus,
    SuperAdminGetServerAuthAttempts,
    SuperAdminGetServerNginxStats,
} from "@/services/data";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { RefreshCw, AlertTriangle } from "lucide-react";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts";
import { AdminPageHeader } from "@/components/admin/AdminTable";

interface SystemSnapshot {
    id: number;
    cpu_percent: string;
    ram_percent: string;
    ram_used_mb: number;
    ram_total_mb: number;
    swap_percent: string;
    swap_used_mb: number;
    swap_total_mb: number;
    load1: string;
    load5: string;
    load15: string;
    disk_used_percent: string;
    process_count: number;
    zombie_count: number;
    uptime_seconds: number;
    db_size_mb: string;
    detections_today: number;
    created_at: string;
}

interface Overview {
    system: SystemSnapshot | null;
    mysql: {
        uptime_seconds: number;
        threads_connected: number;
        threads_running: number;
        max_connections: number;
        connections_percent: number;
        version: string;
    };
    disk_io: { read_kbps: number; write_kbps: number } | null;
    php_version: string;
    server_time: string;
}

interface MetricPoint {
    created_at: string;
    cpu_percent: string;
    ram_percent: string;
    load1: string;
    disk_used_percent: string;
}

interface BackupFile {
    name: string;
    size_mb: number;
    mtime: string;
}

interface TopProcess {
    pid: number;
    name: string;
    cpu_percent: number;
    rss_mb: number;
}

interface TopProcessesData {
    available: boolean;
    message?: string;
    generated_at?: string;
    top_cpu?: TopProcess[];
    top_ram?: TopProcess[];
}

interface MysqlProcessRow {
    ID: string;
    USER: string;
    HOST: string;
    DB: string | null;
    COMMAND: string;
    TIME: string;
    STATE: string | null;
    INFO: string | null;
}

interface MysqlHealthData {
    processlist: MysqlProcessRow[];
    slow_log: { available: boolean; message?: string; lines?: string[] };
}

interface FpmStatusData {
    available: boolean;
    message?: string;
    result?: Record<string, string | number>;
}

interface AuthAttemptIp {
    ip: string;
    attempts: number;
    last_attempt: string;
}

interface AuthAttemptFailed {
    login: string;
    ip: string;
    user_agent: string;
    created_at: string;
}

interface AuthAttemptsData {
    hours: number;
    success_count: number;
    failed_count: number;
    top_ips: AuthAttemptIp[];
    recent_failed: AuthAttemptFailed[];
}

interface NginxStatRow {
    key: string;
    count: number;
}

interface NginxStatsData {
    day: string;
    routes: NginxStatRow[];
    ips: NginxStatRow[];
}

// "2026-09-05 20:49:34" -> Date (как локальное wall-clock; для diff зона сокращается)
const parseServerDate = (s?: string): Date | null => {
    if (!s) return null;
    const d = new Date(s.replace(" ", "T"));
    return isNaN(d.getTime()) ? null : d;
};

const formatUptime = (seconds?: number): string => {
    if (!seconds || seconds < 0) return "—";
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}д ${h}ч ${m}м`;
};

// Цвет по занятости (%): <70 зелёный, <90 жёлтый, иначе красный
const usageColor = (pct: number) =>
    pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500";

const UsageCard = ({
    label,
    percent,
    sub,
}: {
    label: string;
    percent: number;
    sub?: string;
}) => (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
        <div className="flex items-center justify-between">
            <span className="text-[12px] text-slate-500">{label}</span>
            <span className="text-[15px] font-semibold text-slate-900">
                {percent.toFixed(1)}%
            </span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
            <div
                className={cn("h-full transition-all", usageColor(percent))}
                style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
            />
        </div>
        {sub && <p className="text-[11px] text-slate-400 mt-1.5">{sub}</p>}
    </div>
);

const StatCard = ({
    label,
    value,
    sub,
}: {
    label: string;
    value: string;
    sub?: string;
}) => (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
        <span className="text-[12px] text-slate-500">{label}</span>
        <p className="text-[18px] font-semibold text-slate-900 mt-1 leading-tight">
            {value}
        </p>
        {sub && <p className="text-[11px] text-slate-400 mt-1">{sub}</p>}
    </div>
);

const ProcessTable = ({ rows }: { rows: TopProcess[] }) =>
    rows.length === 0 ? (
        <p className="text-[13px] text-slate-400">Нет данных</p>
    ) : (
        <table className="w-full text-[12px]">
            <thead>
                <tr className="text-left text-slate-400">
                    <th className="font-normal pb-1">PID</th>
                    <th className="font-normal pb-1">Процесс</th>
                    <th className="font-normal pb-1 text-right">CPU %</th>
                    <th className="font-normal pb-1 text-right">RAM МБ</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {rows.map((p) => (
                    <tr key={p.pid}>
                        <td className="py-1 text-slate-500 font-mono">{p.pid}</td>
                        <td className="py-1 text-slate-700 font-mono truncate">
                            {p.name}
                        </td>
                        <td className="py-1 text-right text-slate-700">
                            {p.cpu_percent.toFixed(1)}
                        </td>
                        <td className="py-1 text-right text-slate-700">
                            {p.rss_mb.toFixed(1)}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

const RankedList = ({ rows }: { rows: NginxStatRow[] }) =>
    rows.length === 0 ? (
        <p className="text-[13px] text-slate-400">Нет данных</p>
    ) : (
        <div className="divide-y divide-slate-100">
            {rows.map((row) => (
                <div
                    key={row.key}
                    className="flex items-center justify-between py-1.5 gap-2"
                >
                    <span className="text-[12px] font-mono text-slate-700 truncate">
                        {row.key}
                    </span>
                    <span className="text-[12px] text-slate-400 whitespace-nowrap">
                        {row.count}
                    </span>
                </div>
            ))}
        </div>
    );

const AdminServerHealth = () => {
    const [overview, setOverview] = useState<Overview | null>(null);
    const [points, setPoints] = useState<MetricPoint[]>([]);
    const [range, setRange] = useState<"day" | "week">("day");
    const [backups, setBackups] = useState<BackupFile[]>([]);
    const [backupsMsg, setBackupsMsg] = useState<string | null>(null);
    const [phpErrors, setPhpErrors] = useState<string[]>([]);
    const [errorLines, setErrorLines] = useState(50);
    const [topProcesses, setTopProcesses] = useState<TopProcessesData | null>(null);
    const [mysqlHealth, setMysqlHealth] = useState<MysqlHealthData | null>(null);
    const [fpmStatus, setFpmStatus] = useState<FpmStatusData | null>(null);
    const [authAttempts, setAuthAttempts] = useState<AuthAttemptsData | null>(null);
    const [authHours, setAuthHours] = useState(24);
    const [nginxStats, setNginxStats] = useState<NginxStatsData | null>(null);
    const [nginxDay, setNginxDay] = useState(() =>
        new Date().toISOString().slice(0, 10)
    );
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const rangeRef = useRef(range);
    rangeRef.current = range;
    const authHoursRef = useRef(authHours);
    authHoursRef.current = authHours;
    const nginxDayRef = useRef(nginxDay);
    nginxDayRef.current = nginxDay;

    const loadOverview = async () => {
        const data = await SuperAdminGetServerOverview();
        setOverview(data);
    };

    const loadMetrics = async (r: "day" | "week") => {
        const data = await SuperAdminGetServerMetrics(r);
        setPoints(data?.points ?? []);
    };

    const loadBackups = async () => {
        const data = await SuperAdminGetServerBackups();
        const res = data?.result;
        if (res?.available === false) {
            setBackups([]);
            setBackupsMsg(res?.message ?? "Каталог бэкапов недоступен");
        } else {
            setBackups(res?.files ?? []);
            setBackupsMsg(null);
        }
    };

    const loadPhpErrors = async (lines: number) => {
        const data = await SuperAdminGetServerPhpErrors(lines);
        setPhpErrors(data?.result ?? []);
    };

    const loadTopProcesses = async () => {
        const data = await SuperAdminGetServerTopProcesses();
        setTopProcesses(data);
    };

    const loadMysqlHealth = async () => {
        const data = await SuperAdminGetServerMysqlHealth();
        setMysqlHealth(data);
    };

    const loadFpmStatus = async () => {
        const data = await SuperAdminGetServerFpmStatus();
        setFpmStatus(data);
    };

    const loadAuthAttempts = async (hours: number) => {
        const data = await SuperAdminGetServerAuthAttempts(hours);
        setAuthAttempts(data);
    };

    const loadNginxStats = async (day: string) => {
        const data = await SuperAdminGetServerNginxStats(day);
        setNginxStats(data);
    };

    // Полная загрузка (первый вход + ручное обновление)
    const loadAll = async () => {
        setRefreshing(true);
        try {
            await Promise.all([
                loadOverview(),
                loadMetrics(rangeRef.current),
                loadBackups(),
                loadPhpErrors(errorLines),
                loadTopProcesses(),
                loadMysqlHealth(),
                loadFpmStatus(),
                loadAuthAttempts(authHoursRef.current),
                loadNginxStats(nginxDayRef.current),
            ]);
        } catch {
            toast.error("Не удалось загрузить данные сервера");
        } finally {
            setRefreshing(false);
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAll();
        // Автообновление обзора + графиков + текущих снимков раз в 30 сек
        // (данные на бэке — раз в 5 мин). Попытки входа и nginx-статистику
        // в автообновление не включаем — грузятся по смене параметра/вручную.
        const id = setInterval(() => {
            loadOverview().catch(() => {});
            loadMetrics(rangeRef.current).catch(() => {});
            loadTopProcesses().catch(() => {});
            loadMysqlHealth().catch(() => {});
            loadFpmStatus().catch(() => {});
        }, 30000);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Смена диапазона графика
    useEffect(() => {
        if (!loading) loadMetrics(range).catch(() => {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [range]);

    // Смена числа строк лога
    useEffect(() => {
        if (!loading) loadPhpErrors(errorLines).catch(() => {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [errorLines]);

    // Смена окна попыток входа
    useEffect(() => {
        if (!loading) loadAuthAttempts(authHours).catch(() => {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authHours]);

    // Смена дня nginx-статистики
    useEffect(() => {
        if (!loading) loadNginxStats(nginxDay).catch(() => {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nginxDay]);

    const system = overview?.system ?? null;

    // Свежесть данных cron: server_time - created_at
    const staleMinutes = (() => {
        const st = parseServerDate(overview?.server_time);
        const ca = parseServerDate(system?.created_at);
        if (!st || !ca) return null;
        return (st.getTime() - ca.getTime()) / 60000;
    })();
    const cronStale = staleMinutes !== null && staleMinutes > 10;

    // Данные для графиков
    const chartData = points.map((p) => {
        const d = parseServerDate(p.created_at);
        const label = d
            ? range === "day"
                ? `${String(d.getHours()).padStart(2, "0")}:${String(
                      d.getMinutes()
                  ).padStart(2, "0")}`
                : `${String(d.getDate()).padStart(2, "0")}.${String(
                      d.getMonth() + 1
                  ).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(
                      d.getMinutes()
                  ).padStart(2, "0")}`
            : p.created_at;
        return {
            label,
            cpu: parseFloat(p.cpu_percent),
            ram: parseFloat(p.ram_percent),
            disk: parseFloat(p.disk_used_percent),
            load1: parseFloat(p.load1),
        };
    });

    const phpLineClass = (line: string) => {
        if (/fatal/i.test(line) || /error/i.test(line)) return "text-red-600";
        if (/warning/i.test(line)) return "text-amber-600";
        return "text-slate-500";
    };

    return (
        <div className="space-y-5 pb-8">
            <AdminPageHeader
                title="Сервер"
                subtitle="Состояние сервера: нагрузка, история, бэкапы БД, ошибки PHP"
                extra={
                    <div className="flex items-center gap-2">
                        {overview?.server_time && (
                            <span className="text-[11px] text-slate-400">
                                {overview.server_time}
                            </span>
                        )}
                        <button
                            onClick={loadAll}
                            disabled={refreshing}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 text-[13px] hover:bg-slate-50 disabled:opacity-50 transition-colors"
                        >
                            <RefreshCw
                                className={cn(
                                    "w-3.5 h-3.5",
                                    refreshing && "animate-spin"
                                )}
                            />
                            Обновить
                        </button>
                    </div>
                }
            />

            {cronStale && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-3 text-[13px]">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    Сбор метрик, похоже, остановлен: последний снимок{" "}
                    {system?.created_at} (
                    {staleMinutes ? Math.round(staleMinutes) : "?"} мин назад).
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center h-52 bg-white rounded-xl border border-slate-200/80">
                    <div className="w-7 h-7 rounded-full border-2 border-slate-200 border-t-blue-500 animate-spin" />
                </div>
            ) : !system ? (
                <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-8 text-center text-slate-500 text-[13px]">
                    Ожидание сбора данных — cron ещё не отработал.
                </div>
            ) : (
                <>
                    {/* Карточки метрик */}
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <UsageCard
                            label="CPU"
                            percent={parseFloat(system.cpu_percent)}
                        />
                        <UsageCard
                            label="RAM"
                            percent={parseFloat(system.ram_percent)}
                            sub={`${system.ram_used_mb} / ${system.ram_total_mb} МБ`}
                        />
                        <UsageCard
                            label="Своп"
                            percent={parseFloat(system.swap_percent)}
                            sub={`${system.swap_used_mb} / ${system.swap_total_mb} МБ`}
                        />
                        <UsageCard
                            label="Диск"
                            percent={parseFloat(system.disk_used_percent)}
                        />
                        <StatCard
                            label="Диск I/O (чтение / запись)"
                            value={
                                overview?.disk_io
                                    ? `${overview.disk_io.read_kbps.toFixed(
                                          1
                                      )} / ${overview.disk_io.write_kbps.toFixed(
                                          1
                                      )} КБ/с`
                                    : "—"
                            }
                        />
                        <StatCard
                            label="Load average (1 / 5 / 15)"
                            value={`${system.load1} / ${system.load5} / ${system.load15}`}
                        />
                        <StatCard
                            label="Аптайм ОС"
                            value={formatUptime(system.uptime_seconds)}
                        />
                        <StatCard
                            label="Процессы"
                            value={String(system.process_count)}
                            sub={
                                system.zombie_count > 0
                                    ? `Зомби: ${system.zombie_count}`
                                    : "Зомби: 0"
                            }
                        />
                        <StatCard
                            label="Размер БД"
                            value={`${parseFloat(system.db_size_mb).toFixed(1)} МБ`}
                        />
                        <StatCard
                            label="Детекций за сегодня"
                            value={String(system.detections_today)}
                        />
                        <StatCard
                            label="MySQL"
                            value={overview?.mysql?.version ?? "—"}
                            sub={`Выполняется: ${
                                overview?.mysql?.threads_running ?? "—"
                            } · аптайм ${formatUptime(
                                overview?.mysql?.uptime_seconds
                            )}`}
                        />
                        <UsageCard
                            label="Соединения MySQL"
                            percent={overview?.mysql?.connections_percent ?? 0}
                            sub={`${overview?.mysql?.threads_connected ?? "—"} / ${
                                overview?.mysql?.max_connections ?? "—"
                            }`}
                        />
                        <StatCard
                            label="PHP"
                            value={overview?.php_version ?? "—"}
                        />
                        <StatCard
                            label="Снимок метрик"
                            value={system.created_at.slice(11, 16)}
                            sub={system.created_at.slice(0, 10)}
                        />
                    </div>

                    {/* Графики */}
                    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-[14px] font-semibold text-slate-900">
                                История нагрузки
                            </h2>
                            <div className="inline-flex rounded-lg bg-slate-100 p-0.5">
                                {(["day", "week"] as const).map((r) => (
                                    <button
                                        key={r}
                                        onClick={() => setRange(r)}
                                        className={cn(
                                            "px-3 py-1 text-[12px] font-medium rounded-md transition-colors",
                                            range === r
                                                ? "bg-white text-slate-900 shadow-sm"
                                                : "text-slate-500 hover:text-slate-700"
                                        )}
                                    >
                                        {r === "day" ? "24 часа" : "7 дней"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {chartData.length === 0 ? (
                            <p className="text-[13px] text-slate-400 text-center py-12">
                                Нет данных за период
                            </p>
                        ) : (
                            <div className="space-y-6">
                                <div>
                                    <p className="text-[12px] text-slate-500 mb-2">
                                        CPU / RAM / Диск, %
                                    </p>
                                    <ResponsiveContainer width="100%" height={260}>
                                        <LineChart data={chartData}>
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                stroke="#f1f5f9"
                                            />
                                            <XAxis
                                                dataKey="label"
                                                tick={{ fontSize: 11, fill: "#94a3b8" }}
                                                minTickGap={40}
                                            />
                                            <YAxis
                                                domain={[0, 100]}
                                                tick={{ fontSize: 11, fill: "#94a3b8" }}
                                                width={32}
                                            />
                                            <Tooltip />
                                            <Legend />
                                            <Line
                                                type="monotone"
                                                dataKey="cpu"
                                                name="CPU %"
                                                stroke="#3b82f6"
                                                dot={false}
                                                strokeWidth={2}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="ram"
                                                name="RAM %"
                                                stroke="#8b5cf6"
                                                dot={false}
                                                strokeWidth={2}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="disk"
                                                name="Диск %"
                                                stroke="#f59e0b"
                                                dot={false}
                                                strokeWidth={2}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                                <div>
                                    <p className="text-[12px] text-slate-500 mb-2">
                                        Load average (1 мин)
                                    </p>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <LineChart data={chartData}>
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                stroke="#f1f5f9"
                                            />
                                            <XAxis
                                                dataKey="label"
                                                tick={{ fontSize: 11, fill: "#94a3b8" }}
                                                minTickGap={40}
                                            />
                                            <YAxis
                                                tick={{ fontSize: 11, fill: "#94a3b8" }}
                                                width={32}
                                            />
                                            <Tooltip />
                                            <Line
                                                type="monotone"
                                                dataKey="load1"
                                                name="Load 1m"
                                                stroke="#10b981"
                                                dot={false}
                                                strokeWidth={2}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Топ процессов */}
                    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
                        <h2 className="text-[14px] font-semibold text-slate-900 mb-3">
                            Топ процессов
                        </h2>
                        {!topProcesses?.available ? (
                            <p className="text-[13px] text-slate-400">
                                {topProcesses?.message ??
                                    "Снэпшот ещё не собран"}
                            </p>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <p className="text-[12px] text-slate-500 mb-2">
                                        По CPU
                                    </p>
                                    <ProcessTable
                                        rows={topProcesses.top_cpu ?? []}
                                    />
                                </div>
                                <div>
                                    <p className="text-[12px] text-slate-500 mb-2">
                                        По RAM
                                    </p>
                                    <ProcessTable
                                        rows={topProcesses.top_ram ?? []}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* MySQL — активные запросы */}
                    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
                        <h2 className="text-[14px] font-semibold text-slate-900 mb-3">
                            MySQL — активные запросы
                        </h2>
                        {!mysqlHealth || mysqlHealth.processlist.length === 0 ? (
                            <p className="text-[13px] text-slate-400 mb-4">
                                Нет долгих активных запросов
                            </p>
                        ) : (
                            <div className="overflow-x-auto mb-4">
                                <table className="w-full text-[12px] min-w-[640px]">
                                    <thead>
                                        <tr className="text-left text-slate-400">
                                            <th className="font-normal pb-1 pr-3">
                                                ID
                                            </th>
                                            <th className="font-normal pb-1 pr-3">
                                                User
                                            </th>
                                            <th className="font-normal pb-1 pr-3">
                                                DB
                                            </th>
                                            <th className="font-normal pb-1 pr-3 text-right">
                                                Время, с
                                            </th>
                                            <th className="font-normal pb-1 pr-3">
                                                State
                                            </th>
                                            <th className="font-normal pb-1">
                                                Запрос
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {mysqlHealth.processlist.map((row) => (
                                            <tr key={row.ID}>
                                                <td className="py-1 pr-3 text-slate-500 font-mono">
                                                    {row.ID}
                                                </td>
                                                <td className="py-1 pr-3 text-slate-700">
                                                    {row.USER}
                                                </td>
                                                <td className="py-1 pr-3 text-slate-700">
                                                    {row.DB ?? "—"}
                                                </td>
                                                <td className="py-1 pr-3 text-right text-slate-700">
                                                    {row.TIME}
                                                </td>
                                                <td className="py-1 pr-3 text-slate-500">
                                                    {row.STATE ?? "—"}
                                                </td>
                                                <td className="py-1 text-slate-600 font-mono truncate max-w-[320px]">
                                                    {row.INFO ?? "—"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <p className="text-[12px] text-slate-500 mb-2">
                            Slow query log
                        </p>
                        {!mysqlHealth?.slow_log?.available ? (
                            <p className="text-[13px] text-slate-400">
                                {mysqlHealth?.slow_log?.message ?? "Недоступно"}
                            </p>
                        ) : (mysqlHealth.slow_log.lines?.length ?? 0) === 0 ? (
                            <p className="text-[13px] text-slate-400">
                                Лог пуст
                            </p>
                        ) : (
                            <div className="max-h-[240px] overflow-auto rounded-lg bg-slate-50 border border-slate-100 p-3 space-y-0.5">
                                {mysqlHealth.slow_log.lines?.map((line, i) => (
                                    <p
                                        key={i}
                                        className="text-[11px] font-mono text-slate-500 whitespace-pre-wrap break-all"
                                    >
                                        {line}
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* php-fpm */}
                    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
                        <h2 className="text-[14px] font-semibold text-slate-900 mb-3">
                            php-fpm
                        </h2>
                        {!fpmStatus?.available ? (
                            <p className="text-[13px] text-slate-400">
                                {fpmStatus?.message ??
                                    "Статус php-fpm недоступен"}
                            </p>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {Object.entries(fpmStatus.result ?? {}).map(
                                    ([key, value]) => {
                                        const alert =
                                            key === "max children reached" &&
                                            Number(value) > 0;
                                        return (
                                            <div
                                                key={key}
                                                className={cn(
                                                    "rounded-lg border px-3 py-2",
                                                    alert
                                                        ? "bg-red-50 border-red-200"
                                                        : "bg-slate-50 border-slate-100"
                                                )}
                                            >
                                                <p className="text-[11px] text-slate-500">
                                                    {key}
                                                </p>
                                                <p
                                                    className={cn(
                                                        "text-[14px] font-semibold",
                                                        alert
                                                            ? "text-red-600"
                                                            : "text-slate-900"
                                                    )}
                                                >
                                                    {String(value)}
                                                </p>
                                            </div>
                                        );
                                    }
                                )}
                            </div>
                        )}
                    </div>

                    {/* Бэкапы */}
                    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
                        <h2 className="text-[14px] font-semibold text-slate-900 mb-3">
                            Бэкапы БД
                        </h2>
                        {backupsMsg ? (
                            <p className="text-[13px] text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                                {backupsMsg}
                            </p>
                        ) : backups.length === 0 ? (
                            <p className="text-[13px] text-slate-400">
                                Бэкапы не найдены
                            </p>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {backups.map((b) => (
                                    <div
                                        key={b.name}
                                        className="flex items-center justify-between py-2 gap-3"
                                    >
                                        <span className="text-[12px] font-mono text-slate-700 truncate">
                                            {b.name}
                                        </span>
                                        <span className="text-[12px] text-slate-400 whitespace-nowrap">
                                            {b.size_mb} МБ · {b.mtime}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Ошибки PHP */}
                    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-[14px] font-semibold text-slate-900">
                                Ошибки PHP
                            </h2>
                            <select
                                value={errorLines}
                                onChange={(e) => setErrorLines(Number(e.target.value))}
                                className="h-8 text-[12px] border border-slate-200 rounded-lg px-2 text-slate-600 bg-white"
                            >
                                <option value={50}>50 строк</option>
                                <option value={100}>100 строк</option>
                                <option value={300}>300 строк</option>
                            </select>
                        </div>
                        {phpErrors.length === 0 ? (
                            <p className="text-[13px] text-slate-400">
                                Лог пуст или недоступен
                            </p>
                        ) : (
                            <div className="max-h-[400px] overflow-auto rounded-lg bg-slate-50 border border-slate-100 p-3 space-y-1">
                                {phpErrors.map((line, i) => (
                                    <p
                                        key={i}
                                        className={cn(
                                            "text-[11px] font-mono whitespace-pre-wrap break-all",
                                            phpLineClass(line)
                                        )}
                                    >
                                        {line}
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Попытки входа */}
                    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-[14px] font-semibold text-slate-900">
                                Попытки входа
                            </h2>
                            <select
                                value={authHours}
                                onChange={(e) =>
                                    setAuthHours(Number(e.target.value))
                                }
                                className="h-8 text-[12px] border border-slate-200 rounded-lg px-2 text-slate-600 bg-white"
                            >
                                <option value={24}>24 часа</option>
                                <option value={168}>7 дней</option>
                                <option value={720}>30 дней</option>
                            </select>
                        </div>
                        {authAttempts && (
                            <>
                                <div className="grid gap-3 sm:grid-cols-2 mb-4">
                                    <StatCard
                                        label="Успешных входов"
                                        value={String(
                                            authAttempts.success_count
                                        )}
                                    />
                                    <StatCard
                                        label="Неудачных попыток"
                                        value={String(
                                            authAttempts.failed_count
                                        )}
                                    />
                                </div>
                                <div className="grid gap-4 lg:grid-cols-2">
                                    <div>
                                        <p className="text-[12px] text-slate-500 mb-2">
                                            Топ IP по неудачным попыткам
                                        </p>
                                        {authAttempts.top_ips.length === 0 ? (
                                            <p className="text-[13px] text-slate-400">
                                                Нет данных
                                            </p>
                                        ) : (
                                            <div className="divide-y divide-slate-100">
                                                {authAttempts.top_ips.map(
                                                    (row) => (
                                                        <div
                                                            key={row.ip}
                                                            className="flex items-center justify-between py-1.5 gap-2"
                                                        >
                                                            <span
                                                                className={cn(
                                                                    "text-[12px] font-mono",
                                                                    row.attempts >=
                                                                        10
                                                                        ? "text-red-600 font-semibold"
                                                                        : "text-slate-700"
                                                                )}
                                                            >
                                                                {row.ip}
                                                            </span>
                                                            <span className="text-[12px] text-slate-400 whitespace-nowrap">
                                                                {row.attempts}{" "}
                                                                попыток ·{" "}
                                                                {
                                                                    row.last_attempt
                                                                }
                                                            </span>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-[12px] text-slate-500 mb-2">
                                            Последние неудачные попытки
                                        </p>
                                        {authAttempts.recent_failed.length ===
                                        0 ? (
                                            <p className="text-[13px] text-slate-400">
                                                Нет данных
                                            </p>
                                        ) : (
                                            <div className="max-h-[220px] overflow-auto divide-y divide-slate-100">
                                                {authAttempts.recent_failed.map(
                                                    (row, i) => (
                                                        <div
                                                            key={i}
                                                            className="py-1.5 text-[12px]"
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-mono text-slate-700">
                                                                    {row.login}
                                                                </span>
                                                                <span className="text-slate-400">
                                                                    {
                                                                        row.created_at
                                                                    }
                                                                </span>
                                                            </div>
                                                            <div className="text-[11px] text-slate-400 truncate">
                                                                {row.ip} ·{" "}
                                                                {
                                                                    row.user_agent
                                                                }
                                                            </div>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Статистика nginx */}
                    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-[14px] font-semibold text-slate-900">
                                Статистика nginx
                            </h2>
                            <input
                                type="date"
                                value={nginxDay}
                                onChange={(e) => setNginxDay(e.target.value)}
                                className="h-8 text-[12px] border border-slate-200 rounded-lg px-2 text-slate-600 bg-white"
                            />
                        </div>
                        {!nginxStats ||
                        (nginxStats.routes.length === 0 &&
                            nginxStats.ips.length === 0) ? (
                            <p className="text-[13px] text-slate-400">
                                Нет данных за день (лог не настроен или пуст)
                            </p>
                        ) : (
                            <div className="grid gap-4 lg:grid-cols-2">
                                <div>
                                    <p className="text-[12px] text-slate-500 mb-2">
                                        Топ маршрутов
                                    </p>
                                    <RankedList rows={nginxStats.routes} />
                                </div>
                                <div>
                                    <p className="text-[12px] text-slate-500 mb-2">
                                        Топ IP
                                    </p>
                                    <RankedList rows={nginxStats.ips} />
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminServerHealth;
