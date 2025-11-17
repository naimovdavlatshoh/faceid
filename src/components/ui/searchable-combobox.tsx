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

    const selectedOption = options.find((option) => option.value === value);

    // Debounced search
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (searchTerm.length >= 3) {
            searchTimeoutRef.current = window.setTimeout(() => {
                console.log("Calling onSearch with:", searchTerm);
                onSearch(searchTerm);
            }, 500); // Increased delay to 500ms
        } else if (searchTerm.length === 0) {
            // When search is cleared, fetch all positions
            console.log("Calling onSearch with empty string");
            onSearch("");
        }

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchTerm, onSearch]);

    const handleSearchChange = (newSearchTerm: string) => {
        console.log("⌨️ Search input changed:", newSearchTerm);
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
                    <Command className="rounded-xl">
                        <CommandInput
                            placeholder="Поиск должностей..."
                            value={searchTerm}
                            onValueChange={handleSearchChange}
                        />
                        <CommandList>
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
                                        : "Должности не найдены"}
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
