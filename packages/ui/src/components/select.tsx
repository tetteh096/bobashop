"use client";

import { Select as SelectPrimitive } from "@base-ui/react/select";
import { cn } from "@bobashop/ui/lib/utils";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import * as React from "react";

export type SelectOption<V extends string = string> = {
  value: V;
  label: React.ReactNode;
  /** Optional muted text on the right, such as a count. */
  hint?: React.ReactNode;
};

/**
 * An accessible, styled replacement for <select>: keyboard navigation, typeahead and
 * screen-reader support come from Base UI; the look matches the storefront.
 */
function Select<V extends string>({
  value,
  onValueChange,
  options,
  "aria-label": ariaLabel,
  className,
  popupClassName,
  icon,
}: {
  value: V;
  onValueChange: (value: V) => void;
  options: SelectOption<V>[];
  "aria-label": string;
  className?: string;
  popupClassName?: string;
  icon?: React.ReactNode;
}) {
  const items = React.useMemo(
    () => options.map((o) => ({ value: o.value, label: o.label })),
    [options]
  );

  return (
    <SelectPrimitive.Root
      items={items}
      value={value}
      onValueChange={(next) => {
        if (next !== null) onValueChange(next as V);
      }}
    >
      <SelectPrimitive.Trigger
        aria-label={ariaLabel}
        className={cn(
          "inline-flex items-center justify-between gap-2 border border-ink bg-transparent px-4 py-2 min-h-11 text-[15px] text-ink outline-none transition-colors cursor-pointer",
          "hover:border-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 data-[popup-open]:border-ink",
          className
        )}
      >
        {icon}
        <SelectPrimitive.Value className="truncate" />
        <SelectPrimitive.Icon className="shrink-0 transition-transform data-[popup-open]:rotate-180">
          <ChevronDownIcon className="size-4" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner sideOffset={8} alignItemWithTrigger={false} className="z-[70] outline-none">
          <SelectPrimitive.Popup
            className={cn(
              "min-w-[var(--anchor-width)] max-h-[min(var(--available-height),22rem)] overflow-y-auto border border-line bg-card p-1 text-ink shadow-[0_16px_40px_-12px_rgba(15,30,41,0.35)] outline-none",
              "origin-[var(--transform-origin)] transition-[transform,opacity] duration-150 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
              popupClassName
            )}
          >
            <SelectPrimitive.List>
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 text-[15px] outline-none select-none cursor-pointer",
                    "data-[highlighted]:bg-tint data-[selected]:font-semibold data-[selected]:text-brand"
                  )}
                >
                  <span className="flex size-4 shrink-0 items-center justify-center">
                    <SelectPrimitive.ItemIndicator>
                      <CheckIcon className="size-4" />
                    </SelectPrimitive.ItemIndicator>
                  </span>
                  <SelectPrimitive.ItemText className="flex-1 whitespace-nowrap">{option.label}</SelectPrimitive.ItemText>
                  {option.hint !== undefined && <span className="text-xs text-gray-400">{option.hint}</span>}
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.List>
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

export { Select };
