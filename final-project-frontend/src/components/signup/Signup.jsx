import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import classes from "./signup.module.css";
export default function Signup() {
const [name, setName] = useState("");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [error, setError] = useState("");
const navigate = useNavigate();

function checkSignup() {
    axios.post('/api/auth/register', {
        name, 
        email, 
        password ,
        role: "Regular"
      })
      .then((res) => {
        setError(res.data.message);
     
        navigate('/books');
      })
      .catch((err) => {
       setError(err.response.data.message);
      });
    
  }
  return (
    <div className={classes.signupContainer}>
      <h2 className={classes.signupTitle}>Sign Up</h2>
      <img src="/logo.png" alt="logo" className={classes.signupLogo} />
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
        onChange={(e) => setPassword(e.target.value)}
        type="password" 
        id="password" 
        name="password" 
        value={password} 
        placeholder="Create a password"
        required
       
        />
        {error && <p style={{ marginTop: '15px', color: 'red' }}>{error}</p>}
        <button type="submit">Sign up</button>
      </form>

        {error && <p style={{ marginTop: '15px', color: 'green' }}>{error}</p>}

      <p className="login-footer">
        Already have an account? <a href="/">Login</a>
      </p>
    </div>

  )
}