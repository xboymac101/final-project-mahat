import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from '../../assets/img/logo.png';
import axios from "axios";
import classes from "./login.module.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    checkLogin();
  };

  function checkLogin() {
    axios.post('/api/auth/login', { email, password }, { withCredentials: true })
      .then((res) => {
        setTimeout(() => {
          const role = res.data.user?.role;
          if (role === "Admin" || role === "Staff") {
            window.location.href = "/admin/orders";
          } else {
            window.location.href = "/";
          }
        });
      })
      .catch((err) => {
        console.error("Login error:", err);
        const message = err.response?.data?.message || "Login failed. Please try again.";
        setError(message);
      });
  }

  return (
    <div className={classes.loginContainer}>
      <h2 className={classes.loginTitle}>Login</h2>
      <img src={logo} alt="logo" className={classes.loginLogo} />

      <form onSubmit={handleLogin} autoComplete="on">
        <label>Email</label>
        <input
          type="email"
          placeholder="Enter Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <div style={{ position: "relative" }}>
          <label>Password</label>
          <input
          type={show ? "text" : "password"}
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          style={{ width: "100%", paddingRight: "2.25rem" }}
          />
         <button
            type="button"
            onClick={() => setShow(s => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            title={show ? "Hide password" : "Show password"}
            style={{
              position: "absolute",
              right: "8px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontSize: "1rem",
              padding: "0 .25rem",
              lineHeight: 1
            }}
          >
            {show ? "🙈" : "👁️"}
          </button>
        </div>
        <button type="submit">Sign in</button>
      </form>

      {error && <p style={{ marginTop: '15px', color: 'red' }}>{error}</p>}

      <p className="login-footer">
        Don’t have an account? <a href="/signup">sign up</a>
      </p>
    </div>
  );
}
