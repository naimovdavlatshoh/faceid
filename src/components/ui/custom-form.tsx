import React, { useState } from "react";
import { Input } from "@/components/ui/input";
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
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { DatePicker } from "@/components/ui/date-picker";

// Custom Input Component
interface CustomInputProps {
    label: string;
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    type?: "text" | "email" | "password" | "number";
    required?: boolean;
    className?: string;
}

export const CustomInput: React.FC<CustomInputProps> = ({
    label,
    placeholder,
    value,
    onChange,
    type = "text",
    required = false,
    className = "",
}) => {
    return (
        <div className={`space-y-2 ${className}`}>
            <label className="text-sm font-medium text-gray-900 ">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <Input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full h-12 rounded-xl"
            />
        </div>
    );
};

// Custom Combobox Component
interface ComboboxOption {
    value: string;
    label: string;
}

interface CustomComboboxProps {
    label: string;
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    options: ComboboxOption[];
    required?: boolean;
    className?: string;
}

export const CustomCombobox: React.FC<CustomComboboxProps> = ({
    label,
    placeholder = "Select option...",
    value,
    onChange,
    options,
    required = false,
    className = "",
}) => {
    const [open, setOpen] = useState(false);

    const selectedOption = options.find((option) => option.value === value);

    return (
        <div className={`space-y-2 ${className}`}>
            <label className="text-sm font-medium text-gray-900 ">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <Popover open={open} onOpenChange={setOpen}>
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
                        <CommandInput placeholder="Search..." />
                        <CommandList>
                            <CommandEmpty>No option found.</CommandEmpty>
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
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
};

// Custom Date Picker Component
interface CustomDatePickerProps {
    label: string;
    value: Date | undefined;
    onChange: (date: Date | undefined) => void;
    placeholder?: string;
    required?: boolean;
    className?: string;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
    label,
    value,
    onChange,
    placeholder = "Pick a date",
    required = false,
    className = "",
}) => {
    return (
        <div className={`space-y-2 ${className}`}>
            <label className="text-sm font-medium text-gray-900 ">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <DatePicker
                date={value}
                onSelect={onChange}
                placeholder={placeholder}
                className="w-full h-12 rounded-xl"
            />
        </div>
    );
};

// Custom Textarea Component
interface CustomTextareaProps {
    label: string;
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    rows?: number;
    required?: boolean;
    className?: string;
}

export const CustomTextarea: React.FC<CustomTextareaProps> = ({
    label,
    placeholder,
    value,
    onChange,
    rows = 3,
    required = false,
    className = "",
}) => {
    return (
        <div className={`space-y-2 ${className}`}>
            <label className="text-sm font-medium text-gray-900 ">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={rows}
                className="flex min-h-[120px] w-full rounded-xl focus:ring-0 focus:border-mainbg hover:border-mainbg transition-colors border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            />
        </div>
    );
};
