import * as React from "react";

import { cn } from "@/lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
    value?: number;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
    ({ className, value = 0, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                "relative h-2 w-full overflow-hidden rounded-full bg-gray-200 ",
                className
            )}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.min(Math.max(value, 0), 100)}
            {...props}
        >
            <div
                className="h-full bg-maintx transition-all"
                style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
            />
        </div>
    )
);
Progress.displayName = "Progress";

export { Progress };

interface ProgressAutoProps extends Omit<ProgressProps, "value"> {
    durationMs?: number;
    startDelayMs?: number;
}

export const ProgressAuto = React.forwardRef<HTMLDivElement, ProgressAutoProps>(
    ({ className, durationMs = 1500, startDelayMs = 0, ...props }, ref) => {
        const [value, setValue] = React.useState(0);
        const startRef = React.useRef<number | null>(null);
        const rafRef = React.useRef<number | null>(null);

        React.useEffect(() => {
            let timeoutId: number | null = null;

            const tick = (ts: number) => {
                if (startRef.current === null) startRef.current = ts;
                const elapsed = ts - startRef.current;
                const pct = Math.min((elapsed / durationMs) * 100, 100);
                setValue(pct);
                if (pct < 100) {
                    rafRef.current = requestAnimationFrame(tick);
                }
            };

            const start = () => {
                rafRef.current = requestAnimationFrame(tick);
            };

            if (startDelayMs > 0) {
                // @ts-ignore - setTimeout returns number in browser env
                timeoutId = window.setTimeout(start, startDelayMs);
            } else {
                start();
            }

            return () => {
                if (rafRef.current !== null)
                    cancelAnimationFrame(rafRef.current);
                if (timeoutId !== null) window.clearTimeout(timeoutId);
            };
        }, [durationMs, startDelayMs]);

        return (
            <Progress
                ref={ref}
                value={value}
                className={className}
                {...props}
            />
        );
    }
);
ProgressAuto.displayName = "ProgressAuto";
