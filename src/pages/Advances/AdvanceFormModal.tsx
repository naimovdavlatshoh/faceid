import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import CustomModal from "@/components/ui/custom-modal";
import { CustomTextarea } from "@/components/ui/custom-form";
import { Input } from "@/components/ui/input";
import { SearchableCombobox } from "@/components/ui/searchable-combobox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    CreateAdvance,
    UpdateAdvance,
    GetDataSimple,
    PostSimple,
} from "@/services/data";
import {
    ADVANCE_MONTHS,
    ADVANCE_YEARS,
    PAYMENT_METHODS,
    type Advance,
} from "./advancesConstants";

interface EmployeeOption {
    faceid_user_id: number;
    name: string;
    position_name?: string;
}

interface AdvanceFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    advance: Advance | null; // null → создание, объект → редактирование
}

const now = new Date();

// "500000" → "500 000" для отображения; в состоянии храним только цифры
const groupThousands = (digits: string) =>
    digits ? new Intl.NumberFormat("ru-RU").format(Number(digits)) : "";

const AdvanceFormModal = ({
    open,
    onOpenChange,
    onSuccess,
    advance,
}: AdvanceFormModalProps) => {
    const { t } = useTranslation();
    const isEdit = !!advance;

    const [employeeId, setEmployeeId] = useState("");
    const [amount, setAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("1");
    const [month, setMonth] = useState(String(now.getMonth() + 1));
    const [year, setYear] = useState(String(now.getFullYear()));
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [employees, setEmployees] = useState<EmployeeOption[]>([]);
    const [loadingEmployees, setLoadingEmployees] = useState(false);

    const fetchEmployees = async () => {
        try {
            setLoadingEmployees(true);
            const data = await GetDataSimple(
                `api/faceid/users/list?page=1&limit=100&object_id=1`
            );
            setEmployees(data?.result || []);
        } catch (error) {
            console.error("Error fetching employees:", error);
            setEmployees([]);
        } finally {
            setLoadingEmployees(false);
        }
    };

    const searchEmployees = async (keyword: string) => {
        if (keyword.length < 3) {
            fetchEmployees();
            return;
        }
        try {
            setLoadingEmployees(true);
            const response = await PostSimple(
                `api/faceid/user/search?keyword=${encodeURIComponent(keyword)}`,
                {}
            );
            setEmployees(response.data?.result || []);
        } catch (error) {
            console.error("Error searching employees:", error);
            toast.error(t("advances.searchError"));
            setEmployees([]);
        } finally {
            setLoadingEmployees(false);
        }
    };

    // Инициализация полей при открытии
    useEffect(() => {
        if (!open) return;
        fetchEmployees();
        if (advance) {
            setEmployeeId(String(advance.faceid_user_id));
            setAmount(String(advance.amount));
            setPaymentMethod(String(advance.payment_method));
            setMonth(String(advance.month));
            setYear(String(advance.year));
            setComment(advance.comment || "");
            // гарантируем, что текущий сотрудник есть в списке опций
            setEmployees((prev) =>
                prev.some((e) => e.faceid_user_id === advance.faceid_user_id)
                    ? prev
                    : [
                          {
                              faceid_user_id: advance.faceid_user_id,
                              name: advance.employee_name,
                          },
                          ...prev,
                      ]
            );
        } else {
            setEmployeeId("");
            setAmount("");
            setPaymentMethod("1");
            setMonth(String(now.getMonth() + 1));
            setYear(String(now.getFullYear()));
            setComment("");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, advance]);

    const handleEmployeeSearch = (term: string) => {
        if (term.length < 3) fetchEmployees();
        else searchEmployees(term);
    };

    const handleSubmit = async () => {
        const amountNum = Number(amount);
        if (!employeeId) {
            toast.error(t("advances.chooseEmployee"));
            return;
        }
        if (!amountNum || amountNum < 1) {
            toast.error(t("advances.enterAmount"));
            return;
        }
        if (comment.length > 255) {
            toast.error(t("advances.commentTooLong"));
            return;
        }

        const payload = {
            faceid_user_id: Number(employeeId),
            amount: amountNum,
            payment_method: Number(paymentMethod),
            month: Number(month),
            year: Number(year),
            comment: comment.trim() || undefined,
        };

        try {
            setIsSubmitting(true);
            if (isEdit && advance) {
                await UpdateAdvance(advance.id, payload);
                toast.success(t("advances.updated"));
            } else {
                await CreateAdvance(payload);
                toast.success(t("advances.added"));
            }
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error("Error saving advance:", error);
            toast.error(
                error?.response?.data?.error ||
                    error?.response?.data?.message ||
                    t("advances.saveError")
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <CustomModal
            showTrigger={false}
            open={open}
            onOpenChange={onOpenChange}
            title={isEdit ? t("advances.editTitle") : t("advances.addTitle")}
            onConfirm={handleSubmit}
            onCancel={() => onOpenChange(false)}
            confirmText={
                isSubmitting
                    ? t("common.saving")
                    : isEdit
                      ? t("common.save")
                      : t("common.add")
            }
            cancelText={t("common.cancel")}
            confirmBg="bg-maintx"
            confirmBgHover="bg-maintx/80"
            size="md"
        >
            <div className="space-y-4">
                <SearchableCombobox
                    label={t("advances.employee")}
                    placeholder={t("advances.selectEmployee")}
                    searchPlaceholder={t("advances.searchEmployeePlaceholder")}
                    emptyMessage={t("advances.employeeNotFound")}
                    value={employeeId}
                    onChange={setEmployeeId}
                    onSearch={handleEmployeeSearch}
                    options={employees.map((e) => ({
                        value: String(e.faceid_user_id),
                        label: `${e.name}${e.position_name ? ` (${e.position_name})` : ""}`,
                    }))}
                    isLoading={loadingEmployees}
                    required
                />

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900">
                        {t("advances.amountLabel")}
                        <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                        <Input
                            inputMode="numeric"
                            placeholder={t("advances.amountPlaceholder")}
                            value={groupThousands(amount)}
                            onChange={(e) =>
                                setAmount(e.target.value.replace(/\D/g, ""))
                            }
                            className="w-full h-12 rounded-xl pr-12"
                        />
                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                            {t("common.sum")}
                        </span>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900">
                        {t("advances.methodLabel")}
                        <span className="text-red-500 ml-1">*</span>
                    </label>
                    <Select
                        value={paymentMethod}
                        onValueChange={setPaymentMethod}
                    >
                        <SelectTrigger className="w-full h-12 rounded-xl">
                            <SelectValue placeholder={t("advances.methodPlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                            {PAYMENT_METHODS.map((m) => (
                                <SelectItem key={m.value} value={m.value}>
                                    {t(m.labelKey)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-900">
                            {t("advances.month")}
                            <span className="text-red-500 ml-1">*</span>
                        </label>
                        <Select value={month} onValueChange={setMonth}>
                            <SelectTrigger className="w-full h-12 rounded-xl">
                                <SelectValue placeholder={t("advances.monthPlaceholder")} />
                            </SelectTrigger>
                            <SelectContent>
                                {ADVANCE_MONTHS.map((m) => (
                                    <SelectItem key={m.value} value={m.value}>
                                        {t(m.labelKey)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-900">
                            {t("advances.year")}
                            <span className="text-red-500 ml-1">*</span>
                        </label>
                        <Select value={year} onValueChange={setYear}>
                            <SelectTrigger className="w-full h-12 rounded-xl">
                                <SelectValue placeholder={t("advances.yearPlaceholder")} />
                            </SelectTrigger>
                            <SelectContent>
                                {ADVANCE_YEARS.map((y) => (
                                    <SelectItem key={y} value={String(y)}>
                                        {y}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <CustomTextarea
                    label={t("advances.commentLabel")}
                    placeholder={t("advances.commentPlaceholder")}
                    value={comment}
                    onChange={setComment}
                    rows={2}
                />
            </div>
        </CustomModal>
    );
};

export default AdvanceFormModal;
