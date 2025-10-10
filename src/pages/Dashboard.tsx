import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressAuto } from "@/components/ui/progress";
import { useEffect, useState } from "react";
import {
    FiShoppingBag,
    FiUsers,
    FiShoppingCart,
    FiMessageSquare,
    FiTrendingUp,
    FiTrendingDown,
} from "react-icons/fi";

const NewsItem = ({
    img,
    title,
    desc,
    time,
}: {
    img: string;
    title: string;
    desc: string;
    time: string;
}) => (
    <div className="flex items-start gap-4 py-4">
        <img
            src={img}
            alt="thumb"
            className="w-12 h-12 rounded-xl object-cover"
        />
        <div className="flex-1 min-w-0">
            <div className="text-[15px] font-semibold text-gray-900 dark:text-white truncate">
                {title}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                {desc}
            </div>
        </div>
        <div className="text-xs text-gray-400 whitespace-nowrap">{time}</div>
    </div>
);

const Dot = ({ color }: { color: string }) => (
    <span
        className={`inline-block w-2.5 h-2.5 rounded-full ${color}`}
        aria-hidden
    />
);

const TimelineItem = ({
    color,
    title,
    date,
}: {
    color: string;
    title: string;
    date: string;
}) => (
    <div className="relative pl-6 pb-6 last:pb-0">
        <span className="absolute left-0 top-0 z-50">
            <Dot color={color} />
        </span>
        <div className="text-[15px] font-semibold text-gray-900 dark:text-white">
            {title}
        </div>
        <div className="text-xs text-gray-500 mt-1">{date}</div>
        <span className="absolute left-[4.5px] top-3 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
    </div>
);

const Dashboard = () => {
    const news = [
        {
            img: "/avatar-1.webp",
            title: "Будущее возобновляемой энергетики: инновации и вызовы",
            desc: "Короткая заметка о новых тенденциях и технологиях в сфере энергии.",
            time: "2 минуты",
        },
        {
            img: "/avatar-2.webp",
            title: "Влияние ИИ на современное здравоохранение",
            desc: "Как ИИ помогает ускорять диагностику и снижать расходы.",
            time: "вчера",
        },
        {
            img: "/avatar-3.webp",
            title: "Изменение климата и продовольственная безопасность",
            desc: "Обзор рисков и мер адаптации для агросектора.",
            time: "2 дня",
        },
        {
            img: "/avatar-4.webp",
            title: "Рост удалённой работы: плюсы, вызовы и тренды",
            desc: "Как распределённые команды меняют бизнес-процессы.",
            time: "3 дня",
        },
        {
            img: "/avatar-5.webp",
            title: "Блокчейн: не только про криптовалюту",
            desc: "Практические кейсы применения технологии в компаниях.",
            time: "4 дня",
        },
    ];

    const orders = [
        {
            color: "bg-blue-500",
            title: "1983 заказа, $4220",
            date: "05 Окт 2025 21:19",
        },
        {
            color: "bg-emerald-500",
            title: "12 счетов оплачено",
            date: "04 Окт 2025 20:19",
        },
        {
            color: "bg-sky-500",
            title: "Заказ #37745 за сентябрь",
            date: "03 Окт 2025 19:19",
        },
        {
            color: "bg-amber-500",
            title: "Новый заказ #XF-2356",
            date: "02 Окт 2025 18:19",
        },
        {
            color: "bg-rose-500",
            title: "Новый заказ #XF-2346",
            date: "01 Окт 2025 17:19",
        },
        {
            color: "bg-emerald-500",
            title: "12 счетов оплачено",
            date: "04 Окт 2025 20:19",
        },
    ];
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        setTimeout(() => {
            setLoading(false);
        }, 500);
    }, []);

    if (loading) {
        return (
            <div className="h-[80vh] w-full flex justify-center items-center ">
                <div className="w-[400px]">
                    <ProgressAuto
                        durationMs={500}
                        startDelayMs={10}
                        className="h-1 rounded-full"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-10">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-gray-900">
                    Аналитика
                </h1>
            </div>
            {/* Верхние карточки аналитики */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <AnalyticsCard
                    title="Недельные продажи"
                    value="714k"
                    delta="+2.6%"
                    icon={<FiShoppingBag className="w-5 h-5" />}
                />
                <AnalyticsCard
                    title="Новые пользователи"
                    value="1.35m"
                    delta="-0.1%"
                    icon={<FiUsers className="w-5 h-5" />}
                />
                <AnalyticsCard
                    title="Заказы"
                    value="1.72m"
                    delta="+2.8%"
                    icon={<FiShoppingCart className="w-5 h-5" />}
                />
                <AnalyticsCard
                    title="Сообщения"
                    value="234"
                    delta="+3.6%"
                    icon={<FiMessageSquare className="w-5 h-5" />}
                />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-lg">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-gray-900 dark:text-white">
                            Новости
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {news.map((n, idx) => (
                                <NewsItem key={idx} {...n} />
                            ))}
                        </div>
                        <div className="flex justify-end">
                            <button className="text-sm text-gray-700 dark:text-gray-300 hover:underline inline-flex items-center gap-1">
                                Показать все <span>›</span>
                            </button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border border-gray-100 dark:border-gray-800 shadow-lg">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-gray-900 dark:text-white">
                            Лента заказов
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        {orders.map((o, i) => (
                            <TimelineItem
                                key={i}
                                color={o.color}
                                title={o.title}
                                date={o.date}
                            />
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;

// Вспомогательная карточка аналитики (градиент, иконка, тренд)
const AnalyticsCard = ({
    title,
    value,
    delta,
    icon,
}: {
    title: string;
    value: string;
    delta: string;
    icon: React.ReactNode;
}) => (
    <div
        className={`relative overflow-hidden rounded-2xl p-5 shadow-lg border border-gray-100`}
    >
        <div className="pointer-events-none absolute right-0 top-0 h-full w-2/3 opacity-[0.15]">
            <div className="h-full w-full bg-[radial-gradient(circle_12px_at_12px_12px,rgba(255,255,255,0.8)_2px,transparent_2px)]" />
        </div>
        <div className="flex items-start justify-between relative z-[1]">
            <div className="w-10 h-10 rounded-xl bg-mainbg/20  flex items-center justify-center text-maintx dark:text-white">
                {icon}
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-700/80 dark:text-gray-200">
                {delta.startsWith("-") ? (
                    <FiTrendingDown className="text-rose-500" />
                ) : (
                    <FiTrendingUp className="text-emerald-500" />
                )}
                {delta}
            </span>
        </div>
        <div className="mt-6 text-sm text-gray-700/90 dark:text-gray-300 relative z-[1]">
            {title}
        </div>
        <div className="mt-2 text-2xl font-semibold text-maintx dark:text-white relative z-[1]">
            {value}
        </div>
    </div>
);
