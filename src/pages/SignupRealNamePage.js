import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignupRealNamePage.css'; // 이 CSS를 사용할 것

const SignupRealNamePage = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [birth, setBirth] = useState('');
  const [phone, setPhone] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isNameValid = name !== '' && /^[가-힣ㄱ-ㅎㅏ-ㅣ]+$/.test(name);
  const isBirthValid = birth !== '' && /^\d{8}$/.test(birth);
  const isPhoneValid = phone !== '' && /^\d{11}$/.test(phone);
  const isCodeInputValid = inputCode !== '' && /^\d{6}$/.test(inputCode);

  const handleNameChange = (e) => {
    const value = e.target.value;
    if (/^[가-힣ㄱ-ㅎㅏ-ㅣ]*$/.test(value)) setName(value);
  };

  const handleBirthChange = (e) => {
    setBirth(e.target.value.replace(/\D/g, '').slice(0, 8));
  };

  const handlePhoneChange = (e) => {
    setPhone(e.target.value.replace(/\D/g, '').slice(0, 11));
  };

  const handleCodeChange = (e) => {
    setInputCode(e.target.value.replace(/\D/g, '').slice(0, 6));
  };

  const handleSendCode = () => {
    if (!isPhoneValid) {
      alert('유효한 휴대전화 번호를 입력해주세요.');
      return;
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setAuthCode(code);
    alert(`인증번호: ${code}`);
  };

  const handleVerify = () => {
    if (!authCode) {
      alert('먼저 인증번호를 발송해주세요.');
      return;
    }
    if (inputCode === authCode) {
      setIsVerified(true);
      alert('인증이 완료되었습니다.');
    } else {
      setIsVerified(false);
      alert('인증번호가 일치하지 않습니다.');
    }
  };

  const handleBack = () => {
    navigate('/signup');
  };

  const handleNext = () => {
    setSubmitted(true);
    if (!(isNameValid && isBirthValid && isPhoneValid && isVerified)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    navigate('/signup/extra', {
      state: { name, birth, phone },
    });
  };

  return (
    <div className="signup-page page-container">
      <h1 className="signup-title">회원가입</h1>

      <div className="signup-steps">
        {['약관동의', '실명확인', '추가입력정보', '가입완료'].map((label, idx) => (
          <div key={idx} className={`step ${idx === 1 ? 'active' : ''}`}>
            <div className="circle">{`0${idx + 1}`}</div>
            <div className="label">{label}</div>
          </div>
        ))}
      </div>

      <p className="signup-guide">본인 인증을 위해 이름과 생년월일, 휴대폰 번호를 입력해주세요.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* 이름 */}
        <div className={`input-wrapper ${submitted && !isNameValid ? 'invalid' : isNameValid ? 'valid' : ''}`}>
          <input
            type="text"
            placeholder="이름"
            value={name}
            onChange={handleNameChange}
            className="realname-input"
          />
          {submitted && !isNameValid && <p className="input-error">필수 입력 정보입니다.</p>}
        </div>

        {/* 생년월일 */}
        <div className={`input-wrapper ${submitted && !isBirthValid ? 'invalid' : isBirthValid ? 'valid' : ''}`}>
          <input
            type="text"
            placeholder="생년월일 (예: 19920928)"
            value={birth}
            onChange={handleBirthChange}
            className="realname-input"
          />
          {submitted && !isBirthValid && <p className="input-error">필수 입력 정보입니다.</p>}
        </div>

        {/* 휴대폰 */}
        <div className={`input-wrapper ${submitted && !isPhoneValid ? 'invalid' : isPhoneValid ? 'valid' : ''}`}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="휴대폰 번호"
              value={phone}
              onChange={handlePhoneChange}
              className="realname-input"
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="next-btn"
              style={{ width: '130px', height: '44px' }}
              onClick={handleSendCode}
            >
              인증받기
            </button>
          </div>
          {submitted && !isPhoneValid && <p className="input-error">필수 입력 정보입니다.</p>}
        </div>

        {/* 인증번호 */}
        <div className={`input-wrapper ${submitted && !isCodeInputValid ? 'invalid' : isVerified ? 'valid' : ''}`}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="인증번호 입력"
              value={inputCode}
              onChange={handleCodeChange}
              className="realname-input"
              style={{ flex: 1 }}
              disabled={isVerified}
            />
            <button
              type="button"
              className="next-btn"
              style={{ width: '130px', height: '44px' }}
              onClick={handleVerify}
              disabled={isVerified}
            >
              인증확인
            </button>
          </div>
          {submitted && !isCodeInputValid && <p className="input-error">필수 입력 정보입니다.</p>}
          {isVerified && <p className="verified-text">✅ 인증이 완료되었습니다.</p>}
        </div>
      </div>

      <div className="signup-buttons">
        <button className="cancel-btn" onClick={handleBack}>이전</button>
        <button className="next-btn" onClick={handleNext}>다음</button>
      </div>
    </div>
  );
};

export default SignupRealNamePage;
