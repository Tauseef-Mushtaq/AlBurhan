import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  /** Whether the async operation this button triggers is in flight. */
  isLoading: boolean;
  /** Label shown (with a spinner) while isLoading is true, e.g. "Saving…". */
  loadingLabel: string;
  children: React.ReactNode;
}

/**
 * Wraps the existing Button with the one pending pattern used everywhere
 * in the app: spinner + pending label, disabled (and inert to repeated
 * clicks/duplicate submissions), aria-busy so assistive tech knows too.
 * Any `disabled` passed in is combined with isLoading rather than
 * overridden, so a button can still be disabled for other reasons
 * (validation, permissions) independent of the pending state.
 */
export const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ isLoading, loadingLabel, children, disabled, className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        className={cn(className)}
        {...props}
      >
        {isLoading ? (
          <>
            <Spinner className="h-4 w-4" />
            {loadingLabel}
          </>
        ) : (
          children
        )}
      </Button>
    );
  }
);
LoadingButton.displayName = "LoadingButton";
