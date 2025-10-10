import React from "react";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface BreadcrumbItem {
    label: string;
    href?: string;
    isActive?: boolean;
}

interface CustomBreadcrumbProps {
    items: BreadcrumbItem[];
    className?: string;
}

const CustomBreadcrumb: React.FC<CustomBreadcrumbProps> = ({
    items,
    className = "",
}) => {
    return (
        <Breadcrumb className={className}>
            <BreadcrumbList>
                {items.map((item, index) => (
                    <React.Fragment key={index}>
                        <BreadcrumbItem>
                            {item.isActive ? (
                                <BreadcrumbPage className="text-maintx dark:text-white font-normal">
                                    {item.label}
                                </BreadcrumbPage>
                            ) : (
                                <BreadcrumbLink
                                    href={item.href || "#"}
                                    className="text-gray-500 font-light hover:underline dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                >
                                    {item.label}
                                </BreadcrumbLink>
                            )}
                        </BreadcrumbItem>
                        {index < items.length - 1 && <BreadcrumbSeparator />}
                    </React.Fragment>
                ))}
            </BreadcrumbList>
        </Breadcrumb>
    );
};

export default CustomBreadcrumb;
