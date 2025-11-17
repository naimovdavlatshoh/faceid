import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { MdSearch, MdClose } from "react-icons/md";

interface SearchInputProps {
    placeholder?: string;
    value?: string;
    onChange?: (value: string) => void;
    className?: string;
    onSearch?: (value: string) => void;
}

const SearchInput: React.FC<SearchInputProps> = ({
    placeholder = "Search...",
    value: controlledValue,
    onChange,
    className = "",
    onSearch,
}) => {
    const [internalValue, setInternalValue] = useState("");

    const isControlled = controlledValue !== undefined;
    const value = isControlled ? controlledValue : internalValue;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        if (isControlled) {
            onChange?.(newValue);
        } else {
            setInternalValue(newValue);
        }
    };

    const handleClear = () => {
        if (isControlled) {
            onChange?.("");
        } else {
            setInternalValue("");
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            onSearch?.(value);
        }
    };

    return (
        <div className={cn("relative w-full", className)}>
            <div className="relative w-full ">
                {/* Search Icon */}
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MdSearch className="h-6 w-6 text-gray-400 " />
                </div>

                {/* Input Field */}
                <input
                    type="text"
                    value={value}
                    onChange={handleChange}
                    onKeyPress={handleKeyPress}
                    placeholder={placeholder}
                    className={cn(
                        "w-full pl-12 pr-10 py-4 border border-gray-200 ",
                        "bg-white  text-gray-900 ",
                        "rounded-xl outline-none focus:outline-none focus:ring-0 focus:ring-offset-0",
                        "placeholder-gray-500 ",
                        "transition-colors duration-200"
                    )}
                />

                {/* Clear Button (X icon) - only show when there's text */}
                {value && value.length > 0 && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center rounded-r-2xl transition-colors"
                    >
                        <MdClose className="h-4 w-4 text-gray-400  hover:text-gray-600 " />
                    </button>
                )}
            </div>
        </div>
    );
};

export default SearchInput;
