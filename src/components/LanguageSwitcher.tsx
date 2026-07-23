import { useTranslation } from "react-i18next";
import { Globe, Check } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { SUPPORTED_LANGUAGES, type Language } from "@/i18n";

const LABELS: Record<Language, string> = {
    ru: "Русский",
    uz: "O‘zbekcha",
};

const SHORT: Record<Language, string> = {
    ru: "RU",
    uz: "UZ",
};

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();
    const current = (i18n.language as Language) in LABELS
        ? (i18n.language as Language)
        : "ru";

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className="flex items-center gap-1.5 px-2.5 h-8 rounded-lg text-[13px] font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                    <Globe className="w-4 h-4 text-slate-500" />
                    {SHORT[current]}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {SUPPORTED_LANGUAGES.map((lng) => (
                    <DropdownMenuItem
                        key={lng}
                        className="flex items-center justify-between gap-6"
                        onClick={() => i18n.changeLanguage(lng)}
                    >
                        <span>{LABELS[lng]}</span>
                        <Check
                            className={cn(
                                "w-4 h-4 text-blue-600",
                                current === lng ? "opacity-100" : "opacity-0"
                            )}
                        />
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default LanguageSwitcher;
