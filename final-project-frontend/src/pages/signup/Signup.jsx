import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import classes from "./signup.module.css";
import logo from '../../assets/img/logo.png';
export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  function checkSignup(e) {
    e.preventDefault();


    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setSuccess("");
      return;
    }

 
    axios.post('/api/auth/register', {
      name,
      email,
      password,
      role: "Regular"
    })
    .then((res) => {
      setSuccess(res.data.message);
      setError("");

      setTimeout(() => {
        navigate('/');
      }, 2000);
    })
    .catch((err) => {
      setError(err.response?.data?.message || "Signup failed.");
      setSuccess("");
    });
  }

  return (
    <div className={classes.signupContainer}>
      <h2 className={classes.signupTitle}>Sign Up</h2>
      <img src={logo} alt="logo" className={classes.signupLogo} />

      <form onSubmit={checkSignup}>
        <label>Name</label>
        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <label>Email</label>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label>Password</label>
        <input
          type="password"
          placeholder="Create password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <label>Confirm Password</label>
        <input
          type="password"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        {error && <div className={classes.errorBox}>{error}</div>}
        {success && <div className={classes.successBox}>{success}</div>}

        <button className="SignupButton" type="submit">Sign up</button>
      </form>

      <p className="login-footer">
        Already have an account? <a href="/">Login</a>
      </p>
    </div>
  );
}
