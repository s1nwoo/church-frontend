import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function SignupPage() {
  const [form, setForm] = useState({
    username: '',
    name: '',
    birthDate: '',
    email: '',
    password: '',
    phoneNumber: ''
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;

    // 🔒 생년월일은 숫자 8자리만 허용
    if (name === 'birthDate') {
      if (!/^\d*$/.test(value)) return; // 숫자 외 입력 차단
      if (value.length > 8) return; // 8자리 이상 제한
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.birthDate.length !== 8) {
      alert('생년월일은 8자리 숫자 (예: 19980504)로 입력해주세요.');
      return;
    }

    try {
      await axios.post('/api/auth/signup', form);
      alert('회원가입 완료!');
      navigate('/login');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || '회원가입 실패');
    }
  };

  return (
    <div>
      <h2>회원가입</h2>
      <form onSubmit={handleSubmit}>

        {/* 🔐 아이디 입력 */}
        <div>
          <label>아이디</label>
          <input
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
            required
          />
        </div>

        {/* 👤 이름 */}
        <div>
          <label>이름</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>

        {/* 🎂 생년월일 */}
        <div>
          <label>생년월일</label>
          <input
            type="text"
            name="birthDate"
            placeholder="예시: 19980504"
            value={form.birthDate}
            onChange={handleChange}
            required
          />
        </div>

        {/* 📧 이메일 */}
        <div>
          <label>이메일</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>

        {/* 🔑 비밀번호 */}
        <div>
          <label>비밀번호</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>

        {/* 📱 전화번호 */}
        <div>
          <label>전화번호</label>
          <input
            type="text"
            name="phoneNumber"
            value={form.phoneNumber}
            onChange={handleChange}
          />
        </div>

        <button type="submit">회원가입</button>
      </form>
    </div>
  );
}

export default SignupPage;
