import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
// Remove Emergent badge on load
document.addEventListener('DOMContentLoaded', () => {
  const removeBadge = () => {
    const badge = document.getElementById('emergent-badge');
    if (badge) {
      badge.remove();
      return true;
    }
    return false;
  };
  
  // Try immediately and every 100ms until found
  if (!removeBadge()) {
    const interval = setInterval(() => {
      if (removeBadge()) clearInterval(interval);
    }, 100);
  }
});
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
// Remove Emergent badge on load
document.addEventListener('DOMContentLoaded', () => {
  const badge = document.getElementById('emergent-badge');
  if (badge) badge.remove();
});
);
