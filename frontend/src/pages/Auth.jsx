// src/pages/Auth.jsx
import { useState } from "react";
import { useNavigate } from "react-router";
import { api } from "../api";

export default function Auth({ onLogin }) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const endpoint = isLogin ? "/auth/signin" : "/auth/signup";
      const data = await api.post(endpoint, { name, password });

      if (data.token) {
        localStorage.setItem("token", data.token);
        onLogin(data.user);
        navigate("/");
      } else {
        // Handle validation errors or incorrect credentials
        setError(
          data.error || data.errors?.[0]?.msg || "Authentication failed",
        );
      }
    } catch  {
      setError("Server error. Please try again.");
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2 style={{ textAlign: "center", margin: 0 }}>
          {isLogin ? "Sign In" : "Sign Up"}
        </h2>

        {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}

        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="auth-input"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="auth-input"
        />

        <button type="submit" className="auth-btn">
          {isLogin ? "Sign In" : "Sign Up"}
        </button>

        <button
          type="button"
          onClick={() => setIsLogin(!isLogin)}
          className="auth-switch-btn"
        >
          Switch to {isLogin ? "Sign Up" : "Sign In"}
        </button>
      </form>
    </div>
  );
}
