// LoginPage.js
import React, { useState } from 'react';
import '../Styles/LoginPage.css';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    // Implement login logic here
    console.log(username, password);
  };

  return (
    <div className="login-container">
      <div className="image-part"> </div>
      <div className="login-form-container">
        <form onSubmit={handleLogin} className="login-form">
          <h2 className="login-header">Sign in</h2>
          <div className="input-group">
            <input
              type="text"
              id="username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <label htmlFor="username">Username</label>
          </div>
          <div className="input-group">
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <label htmlFor="password">Password</label>
          </div>
          <div className="login-footer">
            <button type="submit" className="login-button">Sign In</button>
          </div>
          <div className="signup-link">
            Not a member? <a href="/signup">Sign up now</a>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
