import React from "react";
import { Slot } from "@radix-ui/react-slot";
import clsx from "clsx";

interface ButtonProps {
  children: React.ReactNode;
  className?: string;
}

const ShadcnButton: React.FC<ButtonProps> = ({ children, className }) => {
  return (
    <Slot
      className={clsx(
        "px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600",
        className
      )}
    >
      {children}
    </Slot>
  );
};

export default ShadcnButton;
