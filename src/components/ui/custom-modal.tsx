import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CustomModalProps {
    trigger?: React.ReactNode;
    title: string;
    description?: string;
    children: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    showCloseButton?: boolean;
    showTrigger?: boolean;
    triggerText?: string;
    triggerVariant?:
        | "default"
        | "destructive"
        | "outline"
        | "secondary"
        | "ghost"
        | "link";
    showFooter?: boolean;
    footerContent?: React.ReactNode;
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
    confirmBg?: string;
    confirmBgHover?: string;
    confirmVariant?:
        | "default"
        | "destructive"
        | "outline"
        | "secondary"
        | "ghost"
        | "link";
    size?: "sm" | "md" | "lg" | "xl";
    width?: string;
    height?: string;
    maxWidth?: string;
    maxHeight?: string;
    className?: string;
}

const CustomModal: React.FC<CustomModalProps> = ({
    trigger,
    title,
    children,
    open,
    onOpenChange,
    showCloseButton = true,
    showTrigger = true,
    triggerText = "Open Modal",
    triggerVariant = "default",
    showFooter = true,
    footerContent,
    onConfirm,
    onCancel,
    confirmText = "Confirm",
    cancelText = "Cancel",
    confirmVariant = "default",
    confirmBg = "bg-maintx",
    confirmBgHover = "bg-maintx/70",
    size = "md",
    width,
    height,
    maxWidth,
    maxHeight,
    className = "",
}) => {
    // Support controlled and uncontrolled modes
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = open !== undefined;
    const actualOpen = isControlled ? !!open : internalOpen;

    const handleOpenChange = (nextOpen: boolean) => {
        if (isControlled) {
            onOpenChange?.(nextOpen);
        } else {
            setInternalOpen(nextOpen);
        }
    };
    const getSizeClass = () => {
        if (width || maxWidth) {
            return "";
        }
        switch (size) {
            case "sm":
                return "max-w-sm";
            case "md":
                return "max-w-md";
            case "lg":
                return "max-w-lg";
            case "xl":
                return "max-w-xl";
            default:
                return "max-w-md";
        }
    };

    const getModalStyles = () => {
        const styles: React.CSSProperties = {};

        if (width) {
            styles.width = width;
        }
        if (height) {
            styles.height = height;
        }
        if (maxWidth) {
            styles.maxWidth = maxWidth;
        }
        if (maxHeight) {
            styles.maxHeight = maxHeight;
        }

        return styles;
    };

    const handleConfirm = () => {
        onConfirm?.();
        handleOpenChange(false);
    };

    const handleCancel = () => {
        onCancel?.();
        handleOpenChange(false);
    };

    const modalContent = (
        <Dialog open={actualOpen} onOpenChange={handleOpenChange}>
            {showTrigger && (
                <DialogTrigger asChild>
                    {trigger || (
                        <Button variant={triggerVariant}>{triggerText}</Button>
                    )}
                </DialogTrigger>
            )}
            <DialogContent
                className={`${getSizeClass()} ${className}`}
                style={getModalStyles()}
                hideClose={!showCloseButton}
            >
                <DialogHeader>
                    <DialogTitle className="text-gray-900 dark:text-white">
                        {title}
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4">{children}</div>

                {showFooter && (
                    <DialogFooter>
                        {footerContent || (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={handleCancel}
                                    className="text-gray-600 dark:text-gray-300 rounded-xl"
                                >
                                    {cancelText}
                                </Button>
                                <Button
                                    className={`rounded-xl ${confirmBg} text-white duration-300 hover:${confirmBgHover}`}
                                    variant={confirmVariant}
                                    onClick={handleConfirm}
                                >
                                    {confirmText}
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );

    return modalContent;
};

export default CustomModal;
