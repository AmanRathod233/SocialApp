import React, { useState } from 'react';
import { Link,useNavigate } from 'react-router-dom';
import axios from '../../utils/axios'; // Make sure axios is configured properly

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate(); // ✅

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post('/auth/login', {
        email,
        password,
      });

      console.log('✅ Login success:', res.data);
      setMessage('Login successful!');
      
      // Optionally store token if needed
      localStorage.setItem('token', res.data.token);

      // ✅ Redirect to home
      navigate('/home');
    } catch (err) {
      console.error('❌ Login error:', err.response?.data?.message || err.message);
      setMessage('Invalid email or password');
    }
  };

  return (
    <div style={styles.container}>
      <h2>Login</h2>
      <form onSubmit={handleLogin} style={styles.form}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={styles.input}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={styles.input}
        />
        <button type="submit" style={styles.button}>Login</button>
      </form>

      {message && <p style={styles.message}>{message}</p>}

      <p style={styles.linkText}>
        New here? <Link to="/register">Create an account</Link>
      </p>
    </div>
  );
};


const styles = {
  container: { maxWidth: '400px', margin: '100px auto', textAlign: 'center' },
  form: { display: 'flex', flexDirection: 'column', gap: '10px' },
  input: { padding: '10px', fontSize: '16px' },
  button: { padding: '10px', fontSize: '16px', background: '#333', color: '#fff' },
  message: { marginTop: '15px', color: 'green', fontWeight: 'bold' },
  linkText: { marginTop: '10px' },
};

export default Login;
