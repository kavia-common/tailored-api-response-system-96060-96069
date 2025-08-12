import React, { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import "./App.css";

import Navbar from "./components/Navbar";
import LoginModal from "./components/LoginModal";
import SettingsModal from "./components/SettingsModal";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import ApiExplorer from "./pages/ApiExplorer";

// PUBLIC_INTERFACE
function App() {
  /** Main application: navigation, theming, routes, and modal management. */
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [loginOpen, setLoginOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    /** Toggle between light and dark theme. */
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <div className="app-root">
      <Navbar onOpenLogin={() => setLoginOpen(true)} onOpenSettings={() => setSettingsOpen(true)} />
      <main className="main">
        <Routes>
          <Route path="/" element={<Dashboard onRequestLogin={() => setLoginOpen(true)} />} />
          <Route path="/profile" element={<Profile onRequestLogin={() => setLoginOpen(true)} />} />
          <Route path="/api" element={<ApiExplorer onRequestLogin={() => setLoginOpen(true)} />} />
        </Routes>
      </main>

      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        theme={theme}
        onChangeTheme={setTheme}
        toggleTheme={toggleTheme}
      />
    </div>
  );
}

export default App;
