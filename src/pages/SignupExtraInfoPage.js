import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './SignupPage.css';

const SignupExtraInfoPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { name = '', birth = '', phone = '' } = location.state || {};

  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignup = async () => {
    try {
      if (password !== confirmPassword) {
        alert('비밀번호가 일치하지 않습니다.');
        return;
      }

      const data = {
        username: userId,
        name,
        birthDate: birth,
        phoneNumber: phone,
        email,
        password,
        gender,
      };

      const response = await axios.post('/api/auth/signup', data);

      alert('회원가입이 완료되었습니다.');
      navigate('/login'); // 혹은 홈으로
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || '회원가입 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="signup-page">
      <h1 className="signup-title">회원가입</h1>

      <div className="signup-steps">
        {['약관동의', '실명확인', '추가입력정보', '가입완료'].map((label, idx) => (
          <div key={idx} className={`step ${idx === 2 ? 'active' : ''}`}>
            <div className="circle">{`0${idx + 1}`}</div>
            <div className="label">{label}</div>
          </div>
        ))}
      </div>

      <p className="signup-guide">추가 정보를 입력하고 가입을 완료해주세요.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <input type="text" value={name} readOnly className="login-input" placeholder="이름" />
        <input type="text" value={birth} readOnly className="login-input" placeholder="생년월일" />
        <input type="text" value={phone} readOnly className="login-input" placeholder="휴대폰번호" />

        <input
          type="text"
          placeholder="아이디"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="login-input"
        />

        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="login-input"
        />

        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="login-input"
        />

        <input
          type="password"
          placeholder="비밀번호 확인"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="login-input"
        />

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className={`login-input ${gender === '남자' ? 'selected' : ''}`}
            onClick={() => setGender('남자')}
          >
            남자
          </button>
          <button
            type="button"
            className={`login-input ${gender === '여자' ? 'selected' : ''}`}
            onClick={() => setGender('여자')}
          >
            여자
          </button>
        </div>
      </div>

      <div className="signup-buttons">
        <button className="cancel-btn" onClick={() => navigate(-1)}>이전</button>
        <button className="next-btn" onClick={handleSignup}>가입완료</button>
      </div>
    </div>
  );
};

export default SignupExtraInfoPage;
