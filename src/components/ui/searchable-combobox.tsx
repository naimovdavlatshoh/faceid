import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComboboxOption {
    value: string;
    label: string;
}

interface SearchableComboboxProps {
    label: string;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    value: string;
    onChange: (value: string) => void;
    onSearch: (searchTerm: string) => void;
    options: ComboboxOption[];
    isLoading?: boolean;
    required?: boolean;
    className?: string;
}

export const SearchableCombobox: React.FC<SearchableComboboxProps> = ({
    label,
    placeholder = "Select option...",
    searchPlaceholder = "Поиск...",
    emptyMessage = "Ничего не найдено",
    value,
    onChange,
    onSearch,
    options,
    isLoading = false,
    required = false,
    className = "",
}) => {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const searchTimeoutRef = useRef<number | null>(null);
    const prevSearchTermRef = useRef<string>("");
    const onSearchRef = useRef(onSearch);

    // keep latest onSearch callback in ref to avoid re-running effect
    useEffect(() => {
        onSearchRef.current = onSearch;
    }, [onSearch]);

    const selectedOption = options.find((option) => option.value === value);

    // Debounced search; call onSearch("") only when user cleared (was typing before)
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (searchTerm.length >= 3) {
            searchTimeoutRef.current = window.setTimeout(() => {
                onSearchRef.current(searchTerm);
            }, 400);
        } else if (searchTerm.length === 0 && prevSearchTermRef.current.length > 0) {
            onSearchRef.current("");
        }

        prevSearchTermRef.current = searchTerm;

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchTerm]);

    const handleSearchChange = (newSearchTerm: string) => {
        setSearchTerm(newSearchTerm);
    };

    return (
        <div className={`space-y-2 ${className}`}>
            <label className="text-sm font-medium text-gray-900 ">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <Popover
                open={open}
                onOpenChange={(newOpen) => {
                    setOpen(newOpen);
                    if (!newOpen) {
                        setSearchTerm(""); // Clear search when dropdown closes
                    }
                }}
            >
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between h-12 rounded-xl hover:border-mainbg hover:bg-white"
                    >
                        {selectedOption ? selectedOption.label : placeholder}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl">
                    <Command className="rounded-xl" shouldFilter={false}>
                        <CommandInput
                            placeholder={searchPlaceholder}
                            value={searchTerm}
                            onValueChange={handleSearchChange}
                        />
                        {/* stopPropagation: чтобы scroll-lock Dialog не блокировал прокрутку списка колёсиком */}
                        <CommandList
                            onWheel={(e) => e.stopPropagation()}
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center py-6">
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    <span className="text-sm text-gray-500">
                                        Поиск...
                                    </span>
                                </div>
                            ) : options.length === 0 ? (
                                <CommandEmpty>
                                    {searchTerm.length < 3
                                        ? "Введите минимум 3 символа для поиска"
                                        : emptyMessage}
                                </CommandEmpty>
                            ) : (
                                <CommandGroup>
                                    {options.map((option) => (
                                        <CommandItem
                                            key={option.value}
                                            value={option.value}
                                            onSelect={(currentValue) => {
                                                onChange(
                                                    currentValue === value
                                                        ? ""
                                                        : currentValue
                                                );
                                                setOpen(false);
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    value === option.value
                                                        ? "opacity-100"
                                                        : "opacity-0"
                                                )}
                                            />
                                            {option.label}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
};
