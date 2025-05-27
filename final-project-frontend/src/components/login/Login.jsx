import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import classes from "./login.module.css";
export default function Login({setIsLoggedIn}) {
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [error, setError] = useState("");
const navigate = useNavigate();


const handleLogin = (e) => {
    e.preventDefault();
    checkLogin();
  };

  function checkLogin() {
    axios.post('/api/auth/login', {
        email,
        password
      })
      .then((res) => {
        setError(res.data.message);
        setIsLoggedIn(true);
        navigate('/books');
      })
      .catch((err) => {
       setError(err.response.data.message);
      });
    
  }

  return (
    <div className={classes.loginContainer}>
      <h2 className={classes.loginTitle}>Login</h2>
      <img src="/logo.png" alt="logo" className={classes.loginLogo} />

      <form onSubmit={handleLogin}>
        <label> Email</label>
        <input
          type="email"
          placeholder="Enter Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label>Password</label>
        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">Sign in</button>
      </form>

      {error && <p style={{ marginTop: '15px', color: 'red' }}>{error}</p>}

      <p className="login-footer">
        Don’t have an account? <a href="/signup">sign up</a>
      </p>
    </div>
  );
}