import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button, type ButtonProps } from '@/components/ui/button';

export interface ToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export function Toolbar({ className, children, ...props }: ToolbarProps) {
    return (
        <div
            className={cn('flex items-center gap-2', className)}
            {...props}
        >
            {children}
        </div>
    );
}

export interface ToolbarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export function ToolbarGroup({ className, children, ...props }: ToolbarGroupProps) {
    return (
        <div
            className={cn(
                'flex items-center bg-popover/60 shadow-sm rounded-xl backdrop-blur-md border border-border/50 overflow-hidden',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

export interface ToolbarItemProps extends ButtonProps {
    active?: boolean;
}

export const ToolbarItem = React.forwardRef<HTMLButtonElement, ToolbarItemProps>(
    ({ className, variant = 'ghost', size = 'sm', active, ...props }, ref) => {
        return (
            <Button
                ref={ref}
                variant={variant}
                size={size}
                className={cn(
                    'rounded-none h-12 px-5 min-w-12 hover:bg-accent hover:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground focus-visible:z-10',
                    active && 'bg-accent text-accent-foreground',
                    className
                )}
                {...props}
            />
        );
    }
);
ToolbarItem.displayName = 'ToolbarItem';

export function ToolbarLabel({ className, children, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
    return (
        <span
            className={cn('px-5 h-12 flex items-center min-w-12 text-base font-medium text-popover-foreground', className)}
            {...props}
        >
            {children}
        </span>
    );
}

export function ToolbarSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn('w-[1px] bg-border/50 h-8 my-1.5', className)}
            {...props}
        />
    );
}
