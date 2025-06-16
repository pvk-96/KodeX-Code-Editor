import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

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
