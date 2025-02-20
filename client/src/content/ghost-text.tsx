import React, { useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/utils";

interface GhostTextProps {
  suggestion: string;
  targetElement: HTMLElement;
  onAccept: () => void;
}

export const GhostText: React.FC<GhostTextProps> = ({
  suggestion,
  targetElement,
  onAccept,
}) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [style, setStyle] = useState<React.CSSProperties>({});

  useLayoutEffect(() => {
    const updatePosition = () => {
      const rect = targetElement.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(targetElement);

      // Calculate cursor position
      const textContent =
        targetElement.value || targetElement.textContent || "";
      const cursorPosition =
        "selectionStart" in targetElement
          ? targetElement.selectionStart || 0
          : textContent.length;

      // Create a temporary span to measure text width
      const span = document.createElement("span");
      span.style.visibility = "hidden";
      span.style.position = "absolute";
      span.style.whiteSpace = "pre";
      span.style.font = computedStyle.font;
      span.textContent = textContent.substring(0, cursorPosition);
      document.body.appendChild(span);

      const textWidth = span.getBoundingClientRect().width;
      document.body.removeChild(span);

      setPosition({
        top: rect.top + window.scrollY,
        left: rect.left + textWidth,
      });

      setStyle({
        font: computedStyle.font,
        lineHeight: computedStyle.lineHeight,
        backgroundColor: computedStyle.backgroundColor,
        color: "gray",
      });
    };

    updatePosition();

    const observer = new ResizeObserver(updatePosition);
    observer.observe(targetElement);

    window.addEventListener("scroll", updatePosition);
    window.addEventListener("resize", updatePosition);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, [targetElement]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab" && suggestion) {
        e.preventDefault();
        onAccept();
      }
    };

    targetElement.addEventListener("keydown", handleKeyDown);
    return () => targetElement.removeEventListener("keydown", handleKeyDown);
  }, [suggestion, onAccept, targetElement]);

  if (!suggestion) return null;

  return createPortal(
    <div
      className={cn(
        "fixed pointer-events-none select-none z-50",
        "transition-opacity duration-150"
      )}
      style={{
        ...style,
        ...position,
        opacity: 0.6,
      }}
    >
      {suggestion}
    </div>,
    document.body
  );
};
