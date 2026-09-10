import { useState } from "react";
import { supabase } from "./lib/supabaseClient";

import Login from "./components/login.jsx";
import Dashboard from "./components/Dashboard.jsx";
import ReportLost from "./components/reportlost.jsx";
import ReportFound from "./components/reportfound.jsx";
import SearchFound from "./components/SearchFound.jsx";
import TrackLost from "./components/TrackLost.jsx";
import SecurityDashboard from "./components/SecurityDashboard.jsx";

import "./App.css";

function App() {
  console.log(
    "Supabase connected:",
    supabase
  );

  // ==========================================
  // CURRENT USER
  // ==========================================

  const [user, setUser] = useState(null);

  // ==========================================
  // CURRENT PAGE
  // ==========================================

  const [page, setPage] =
    useState("dashboard");

  // ==========================================
  // LOGIN
  // ==========================================

  function handleLogin(userData) {
    console.log(
      "Login successful:",
      userData
    );

    setUser(userData);

    setPage("dashboard");
  }

  // ==========================================
  // LOGOUT
  // ==========================================

  async function handleLogout() {
    try {
      console.log(
        "Logging out..."
      );

      const { error } =
        await supabase.auth.signOut();

      if (error) {
        console.error(
          "Logout error:",
          error
        );
      }

      setUser(null);
      setPage("dashboard");

    } catch (error) {
      console.error(
        "Logout failed:",
        error
      );

      setUser(null);
      setPage("dashboard");
    }
  }

  // ==========================================
  // LOGIN PAGE
  // ==========================================

  if (!user) {
    return (
      <Login
        onLogin={handleLogin}
      />
    );
  }

  // ==========================================
  // SECURITY DASHBOARD
  // ==========================================

  if (user.type === "Security") {
    return (
      <div className="app">

        {/* =====================================
            SECURITY NAVBAR
        ===================================== */}

        <nav className="navbar">

          <div
            className="navbar-logo"
            onClick={() =>
              setPage("dashboard")
            }
          >
            🎓 CampusFind
          </div>

          <div className="navbar-right">

            <span className="user-info">
              🛡️ Security
              {" • "}
              {user.registeredNumber ||
                user.email ||
                "Security"}
            </span>

            <button
              className="logout-button"
              onClick={handleLogout}
            >
              Logout
            </button>

          </div>

        </nav>

        {/* =====================================
            SECURITY DASHBOARD
        ===================================== */}

        <SecurityDashboard
          setPage={setPage}
          user={user}
        />

      </div>
    );
  }

  // ==========================================
  // NORMAL STUDENT / FACULTY WEBSITE
  // ==========================================

  return (
    <div className="app">

      {/* =====================================
          NAVBAR
      ===================================== */}

      <nav className="navbar">

        {/* LOGO */}

        <div
          className="navbar-logo"
          onClick={() =>
            setPage("dashboard")
          }
        >
          🎓 CampusFind
        </div>

        {/* USER INFORMATION */}

        <div className="navbar-right">

          <span className="user-info">
            {user.type}
            {" • "}
            {user.registeredNumber ||
              user.email ||
              "User"}
          </span>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </nav>

      {/* =====================================
          DASHBOARD
      ===================================== */}

      {page === "dashboard" && (
        <Dashboard
          setPage={setPage}
          user={user}
        />
      )}

      {/* =====================================
          REPORT LOST
      ===================================== */}

      {page === "lost" && (
        <ReportLost
          user={user}
          setPage={setPage}
        />
      )}

      {/* =====================================
          REPORT FOUND
      ===================================== */}

      {page === "found" && (
        <ReportFound
          setPage={setPage}
        />
      )}

      {/* =====================================
          SEARCH FOUND
      ===================================== */}

      {page === "search" && (
        <SearchFound
          setPage={setPage}
        />
      )}

      {/* =====================================
          TRACK LOST
      ===================================== */}

      {page === "track" && (
        <TrackLost
          setPage={setPage}
        />
      )}

    </div>
  );
}

export default App;