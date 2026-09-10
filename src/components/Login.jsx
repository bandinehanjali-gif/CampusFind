import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

function Login({ onLogin }) {
  const [userType, setUserType] = useState("Student");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();

      // --------------------------------
      // 1. TRY NORMAL LOGIN
      // --------------------------------

      const { data: loginData, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password,
        });

      // --------------------------------
      // 2. EXISTING USER
      // --------------------------------

      if (!loginError && loginData.user) {
        console.log("Login successful:", loginData.user);

        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", loginData.user.id)
          .maybeSingle();

        onLogin({
          type: profile?.user_type || userType,
          email: cleanEmail,
          registeredNumber: profile?.registered_number || "",
          user: loginData.user,
        });

        return;
      }

      // --------------------------------
      // 3. SECURITY CANNOT AUTO-CREATE
      // --------------------------------

      if (userType === "Security") {
        setError(
          "Security login is restricted. Please use the authorized Security account."
        );

        return;
      }

      // --------------------------------
      // 4. CREATE NEW STUDENT/FACULTY
      // --------------------------------

      console.log("User not found. Creating account...");

      const { data: functionData, error: functionError } =
        await supabase.functions.invoke("auto-create-user", {
          body: {
            email: cleanEmail,
            password: password,
            userType: userType,
          },
        });

      if (functionError) {
        console.error("Function error:", functionError);

        setError(
          functionError.message ||
            "Unable to create account."
        );

        return;
      }

      if (!functionData?.success) {
        setError(
          functionData?.message ||
            "Unable to create account."
        );

        return;
      }

      console.log("New account created.");

      // --------------------------------
      // 5. LOGIN AFTER ACCOUNT CREATION
      // --------------------------------

      const {
        data: newLoginData,
        error: newLoginError,
      } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });

      if (newLoginError || !newLoginData.user) {
        console.error(
          "Login after account creation failed:",
          newLoginError
        );

        setError(
          "Account created, but login failed. Please try again."
        );

        return;
      }

      console.log(
        "New user logged in:",
        newLoginData.user
      );

      // --------------------------------
      // 6. GET PROFILE
      // --------------------------------

      const { data: newProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", newLoginData.user.id)
        .maybeSingle();

      // --------------------------------
      // 7. SEND USER TO APP
      // --------------------------------

      onLogin({
        type: newProfile?.user_type || userType,
        email: cleanEmail,
        registeredNumber:
          newProfile?.registered_number || "",
        user: newLoginData.user,
      });
    } catch (err) {
      console.error("Login failed:", err);

      setError(
        err?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-overlay"></div>

      <div className="login-card">

        {/* LOGO */}
        <div className="login-logo">
          🎓
        </div>

        {/* TITLE */}
        <h1>CampusFind</h1>

        <p className="login-subtitle">
          Campus Lost & Found Portal
        </p>

        <p className="login-description">
          Find it. Claim it. Get it back.
        </p>

        {/* USER TYPE */}
        <div className="user-type-container">

          {/* STUDENT */}
          <button
            type="button"
            className={
              userType === "Student"
                ? "user-type-button active"
                : "user-type-button"
            }
            onClick={() => {
              setUserType("Student");
              setError("");
            }}
          >
            🎓
            <span>Student</span>
          </button>

          {/* FACULTY */}
          <button
            type="button"
            className={
              userType === "Faculty"
                ? "user-type-button active"
                : "user-type-button"
            }
            onClick={() => {
              setUserType("Faculty");
              setError("");
            }}
          >
            👨‍🏫
            <span>Faculty</span>
          </button>

          {/* SECURITY */}
          <button
            type="button"
            className={
              userType === "Security"
                ? "user-type-button active"
                : "user-type-button"
            }
            onClick={() => {
              setUserType("Security");
              setError("");
            }}
          >
            🛡️
            <span>Security</span>
          </button>

        </div>

        {/* LOGIN FORM */}
        <form onSubmit={handleSubmit}>

          {/* EMAIL */}
          <label>
            Email
          </label>

          <input
            type="email"
            placeholder={`Enter ${userType.toLowerCase()} email`}
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError("");
            }}
          />

          {/* PASSWORD */}
          <label>
            Password
          </label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError("");
            }}
          />

          {/* ERROR */}
          {error && (
            <p className="login-error">
              {error}
            </p>
          )}

          {/* LOGIN BUTTON */}
          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading
              ? "Signing In..."
              : "Sign In →"}
          </button>

        </form>

        {/* BOTTOM TEXT */}
        <p className="login-bottom-text">
          Secure Campus Lost & Found System
        </p>

      </div>
    </div>
  );
}

export default Login;