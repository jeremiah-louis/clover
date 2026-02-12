"use client"

import * as SelectPrimitive from "@radix-ui/react-select"
import * as React from "react"

import { cn } from "@/utils"
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "@radix-ui/react-icons"

const overlayContentBase = "z-50 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg"
const overlayMaxHeight = "max-h-[var(--radix-select-content-available-height)]"
const overlayAnimation = "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
const overlaySlideIn = "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
const overlayItemBase = "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 text-sm outline-none"
const overlayItemHover = "hover:bg-accent"
const overlayItemFocus = "focus:bg-accent focus:text-accent-foreground"
const overlayItemDisabled = "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
const overlayItemTransition = "transition-colors"
const overlayItemIndicator = "absolute left-2 flex h-3.5 w-3.5 items-center justify-center"
const overlayLabel = "px-2 py-1.5 text-sm font-semibold"
const overlaySeparator = "-mx-1 my-1 h-px bg-border"

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-9 w-full items-center justify-between gap-2 rounded-[10px] border border-input bg-background px-3 py-2 text-start text-sm text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-[3px] focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50 data-placeholder:text-muted-foreground/70 [&>span]:min-w-0",
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDownIcon
        width={16}
        height={16}
        strokeWidth={2}
        className="shrink-0 text-muted-foreground/80"
      />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "absolute top-0 left-0 right-0 z-10 flex cursor-default items-center justify-center h-6 bg-linear-to-b from-popover via-popover/80 to-transparent animate-in fade-in-0 duration-150",
      className,
    )}
    {...props}
  >
    <ChevronUpIcon
      width={16}
      height={16}
      strokeWidth={2}
      className="shrink-0 text-muted-foreground/80"
    />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "absolute bottom-0 left-0 right-0 z-10 flex cursor-default items-center justify-center h-6 bg-linear-to-t from-popover via-popover/80 to-transparent animate-in fade-in-0 duration-150",
      className,
    )}
    {...props}
  >
    <ChevronDownIcon
      width={16}
      height={16}
      strokeWidth={2}
      className="shrink-0 text-muted-foreground/80"
    />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        overlayContentBase,
        overlayMaxHeight,
        overlayAnimation,
        overlaySlideIn,
        "dark relative",
        position === "popper" &&
          "min-w-(--radix-select-trigger-width) data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className,
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "py-1 max-h-[inherit] overflow-y-auto",
          position === "popper" && "h-(--radix-select-trigger-height)",
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn(overlayLabel, className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => {
  // Check if children contains a description (has data-desc attribute)
  const hasDescription = React.Children.toArray(children).some(
    (child) =>
      React.isValidElement(child) &&
      (child.props as Record<string, unknown>)?.["data-desc"] !== undefined,
  )

  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        // Use shared overlay item styles with left padding for check indicator
        overlayItemBase,
        overlayItemHover,
        overlayItemFocus,
        overlayItemDisabled,
        overlayItemTransition,
        "pl-7 pr-1.5",
        hasDescription ? "min-h-auto py-2 items-start" : "items-center",
        className,
      )}
      {...props}
    >
      <span className={cn(overlayItemIndicator, hasDescription && "mt-0.5")}>
        <SelectPrimitive.ItemIndicator>
          <CheckIcon
            width={16}
            height={16}
            strokeWidth={2}
            className="shrink-0 text-muted-foreground/80"
          />
        </SelectPrimitive.ItemIndicator>
      </span>

      <SelectPrimitive.ItemText className="flex flex-col gap-0.5">
        {children}
      </SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
})
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn(overlaySeparator, className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
