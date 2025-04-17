import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function LoginPage({ setIsLoggedIn, setUserName }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/auth/login', form);
      const res = await axios.get('/api/auth/me');

      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userName', res.data.name);
      localStorage.setItem('userRole', res.data.role);

      setIsLoggedIn(true);
      setUserName(res.data.name);

      alert('로그인 성공!');
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.message || '로그인 실패');
    }
  };

  return (
    <div>
      <h2>로그인</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>아이디</label>
          <input type="text" name="username" value={form.username} onChange={handleChange} required />
        </div>
        <div>
          <label>비밀번호</label>
          <input type="password" name="password" value={form.password} onChange={handleChange} required />
        </div>
        <button type="submit">로그인</button>
      </form>
    </div>
  );
}

export default LoginPage;