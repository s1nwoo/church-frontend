// src/components/SignupPage.js
import React, { useState } from 'react';
import axios from 'axios';

function SignupPage() {
  const [form, setForm] = useState({
    name: '',
    birthDate: '',
    email: '',
    password: '',
    phoneNumber: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post('/api/auth/signup', form);
      alert(res.data); // "회원가입이 완료되었습니다."
      window.location.href = '/'; // 또는 /login
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "회원가입 실패");
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>회원가입</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>이름</label>
          <input name="name" value={form.name} onChange={handleChange} required />
        </div>
        <div>
          <label>생년월일</label>
          <input type="date" name="birthDate" value={form.birthDate} onChange={handleChange} required />
        </div>
        <div>
          <label>이메일</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} required />
        </div>
        <div>
          <label>비밀번호</label>
          <input type="password" name="password" value={form.password} onChange={handleChange} required />
        </div>
        <div>
          <label>전화번호</label>
          <input name="phoneNumber" value={form.phoneNumber} onChange={handleChange} />
        </div>
        <button type="submit">회원가입</button>
      </form>
    </div>
  );
}

export default SignupPage;
