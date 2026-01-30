import { cn } from "@sglara/cn";
import { forwardRef } from "react";
import "./NumberInput.css"

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  onFocus?: () => void;
  className?: string;
  onNavigate?: (direction: "up" | "down" | "left" | "right") => void;
  onSelectExtend?: (dir: "up" | "down" | "left" | "right") => void;
  onActivate?: () => void;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ value, onChange, onFocus, className, onNavigate, onSelectExtend, onActivate }, ref) => {

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowUp") {
        if (e.shiftKey) {
          onSelectExtend?.("up");
        } else {
          onNavigate?.("up");
        }
        e.preventDefault();
      } else if (e.key === "ArrowDown" || e.key === "Enter") {
        if (e.shiftKey) {
          onSelectExtend?.("down");
        } else {
          onNavigate?.("down");
        }
        e.preventDefault();
      } else if (e.key === "ArrowLeft") {
        if (e.shiftKey) {
          onSelectExtend?.("left");
        } else {
          onNavigate?.("left");
        }
        e.preventDefault();
      } else if (e.key === "ArrowRight") {
        if (e.shiftKey) {
          onSelectExtend?.("right");
        } else {
          onNavigate?.("right");
        }
        e.preventDefault();
      }
    };

    const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.value.length > 1 && e.target.value[0] === "0") {
        e.target.value = e.target.value.slice(1);
      }
      onChange(parseInt(e.target.value) || 0);
    };

    return (
      <input
        ref={ref}
        type="number"
        min={0}
        max={12}
        value={value}
        onChange={handleOnChange}
        onFocus={(e) => {e.target.select(); onFocus ? onFocus() : null}}
        onKeyDown={handleKeyDown}
        className={cn(
          "focus:outline-none focus:ring-2 focus:ring-cyan-600",
          className,
        )}

      />
    );
  }
);

NumberInput.displayName = "NumberInput";