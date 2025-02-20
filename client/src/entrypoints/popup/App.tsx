import React from "react";
import { useState } from "react";
import reactLogo from "@/assets/react.svg";
import wxtLogo from "/wxt.svg";
import "./App.css";
import ShadcnButton from "../../src/components/ShadcnButton";
const App: React.FC = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-sans">Welcome to GhostType AI</h1>
      <ShadcnButton>Click Me</ShadcnButton>
      <div>
        <a href="https://wxt.dev" target="_blank">
          <img src={wxtLogo} className="logo" alt="WXT logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>WXT + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the WXT and React logos to learn more
      </p>
    </div>
  );
};

export default App;
