import React, { useState, useLayoutEffect } from "react";
import ReactDOM from "react-dom";

const GhostText = ({
  suggestion,
  target,
}: {
  suggestion: string;
  target: HTMLElement;
}) => {
  const [position, setPosition] = useState(target.getBoundingClientRect());

  useLayoutEffect(() => {
    const updatePosition = () => {
      if (target) {
        setPosition(target.getBoundingClientRect());
      }
    };

    // Update position on scroll and resize
    window.addEventListener("scroll", updatePosition);
    window.addEventListener("resize", updatePosition);

    const observer = new ResizeObserver(updatePosition);
    observer.observe(target);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, [target]);

  return ReactDOM.createPortal(
    <div
      style={{
        position: "fixed", // changed from absolute to fixed for better cross-site compatibility
        top: position.top,
        left: position.left,
        opacity: 0.6,
        pointerEvents: "none",
        font: window.getComputedStyle(target).font,
        whiteSpace: "pre-wrap", // better handling of multiline inputs
        zIndex: 2147483647, // maximum z-index to ensure visibility
      }}
    >
      {suggestion}
    </div>,
    document.body
  );
};

export default GhostText;
