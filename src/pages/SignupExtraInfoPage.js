import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './SignupExtraInfoPage.css';

const SignupExtraInfoPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { name = '', birth = '', phone = '' } = location.state || {};

  useEffect(() => {
    if (!name || !birth || !phone) {
      alert('잘못된 접근입니다.');
      navigate('/signup');
    }
  }, [name, birth, phone, navigate]);

  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gender, setGender] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const isUserIdValid = /^[a-zA-Z]{4,}$/.test(userId);
  const isEmailValid = /.+@.+\..+/.test(email);
  const isPasswordValid = password.length >= 8;
  const isPasswordMatch = password === confirmPassword && confirmPassword !== '';
  const isGenderSelected = gender !== '';



  const handleSignup = async () => {
    setSubmitted(true);
    if (!(isUserIdValid && isEmailValid && isPasswordValid && isPasswordMatch && isGenderSelected)) return;

    try {
      const data = {
        username: userId,
        name,
        birthDate: birth,
        phoneNumber: phone,
        email,
        password,
        gender,
      };

      await axios.post('/api/auth/signup', data);
      alert('회원가입이 완료되었습니다.');
      navigate('/login');
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

      <div className="input-group">
        <input type="text" value={name} readOnly className="login-input" placeholder="이름" />
        <input type="text" value={birth} readOnly className="login-input" placeholder="생년월일" />
        <input type="text" value={phone} readOnly className="login-input" placeholder="휴대폰번호" />

        <div className={`input-wrapper ${submitted && (!userId ? 'invalid' : isUserIdValid ? 'valid' : 'invalid')}`}>
          <input
            type="text"
            placeholder="아이디"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="login-input"
          />
          {submitted && !userId && <p className="input-error">필수 입력 정보입니다.</p>}
          {submitted && userId && !isUserIdValid && <p className="input-error">영문 4자 이상 입력해주세요.</p>}
        </div>

        <div className={`input-wrapper ${submitted && (!email ? 'invalid' : isEmailValid ? 'valid' : 'invalid')}`}>
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="login-input"
          />
          {submitted && !email && <p className="input-error">필수 입력 정보입니다.</p>}
          {submitted && email && !isEmailValid && <p className="input-error">올바른 이메일 형식이 아닙니다.</p>}
        </div>

        <div className={`input-wrapper ${submitted && (!password ? 'invalid' : isPasswordValid ? 'valid' : 'invalid')}`}>
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
          />
          {submitted && !password && <p className="input-error">필수 입력 정보입니다.</p>}
          {submitted && password && !isPasswordValid && <p className="input-error">8자 이상 입력해주세요.</p>}
        </div>

        <div className={`input-wrapper ${submitted && (!confirmPassword ? 'invalid' : isPasswordMatch ? 'valid' : 'invalid')}`}>
          <input
            type="password"
            placeholder="비밀번호 확인"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="login-input"
          />
          {submitted && !confirmPassword && <p className="input-error">필수 입력 정보입니다.</p>}
          {submitted && confirmPassword && !isPasswordMatch && <p className="input-error">비밀번호가 일치하지 않습니다.</p>}
        </div>

        <div className={`input-wrapper ${submitted && !isGenderSelected ? 'invalid' : ''}`}>
          <div className="gender-buttons">
            <button
              type="button"
              className={`gender-button ${gender === '남자' ? 'selected' : ''}`}
              onClick={() => setGender('남자')}
            >
              남자
            </button>
            <button
              type="button"
              className={`gender-button ${gender === '여자' ? 'selected' : ''}`}
              onClick={() => setGender('여자')}
            >
              여자
            </button>
          </div>
          {submitted && !isGenderSelected && <p className="input-error">필수 입력 정보입니다.</p>}
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
