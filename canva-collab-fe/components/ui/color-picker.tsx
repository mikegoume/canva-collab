"use client";

import { useState } from "react";
import { HexColorPicker } from "react-colorful";
import { VariantProps } from "class-variance-authority";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  inputRef?: React.Ref<HTMLInputElement>;
}

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

type Props = Omit<ButtonProps, "value" | "onChange" | "onBlur"> &
  ColorPickerProps;

// TODO forwardRef is deprecated in version 19 of React. You can now pass ref directly to components.
const ColorPicker = ({
  disabled,
  value,
  onChange,
  onBlur,
  name,
  className,
  inputRef,
  ...props
}: Props) => {
  const [open, setOpen] = useState(false);

  const parsedValue = value ?? "#FFFFFF";

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild disabled={disabled} onBlur={onBlur}>
        <Button
          {...props}
          className={cn("block", className)}
          name={name}
          onClick={() => {
            setOpen(true);
          }}
          size="icon"
          style={{
            backgroundColor: parsedValue,
            width: 32,
            height: 32,
          }}
          variant="outline"
        >
          <div />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full">
        <HexColorPicker color={parsedValue} onChange={onChange} />
        <Input
          maxLength={7}
          onChange={(e) => {
            onChange(e?.currentTarget?.value);
          }}
          ref={inputRef}
          value={parsedValue}
        />
      </PopoverContent>
    </Popover>
  );
};

ColorPicker.displayName = "ColorPicker";

export { ColorPicker };
