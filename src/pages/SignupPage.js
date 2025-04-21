import React, { useState } from 'react';
import './SignupPage.css';

const SignupPage = () => {
  const [agreeAll, setAgreeAll] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [showError, setShowError] = useState(false);

  const handleAllChange = () => {
    const newValue = !agreeAll;
    setAgreeAll(newValue);
    setAgreeTerms(newValue);
    setAgreePrivacy(newValue);
  };

  const handleSubmit = () => {
    if (!agreeTerms || !agreePrivacy) {
      setShowError(true);
    } else {
      alert('다음 단계로 이동!');
    }
  };

  return (
    <div className="signup-page">
      <h1 className="signup-title">회원가입</h1>

      <div className="signup-steps">
        {[1, 2, 3, 4].map((step, idx) => (
          <div key={step} className="step">
            <div className={`circle ${idx === 0 ? 'active' : ''}`}>{`0${step}`}</div>
            <div className="label">
              {['약관동의', '실명확인', '추가입력정보', '가입완료'][idx]}
            </div>
          </div>
        ))}
      </div>

      <p className="signup-guide">
        방화침례교회 홈페이지의 이용약관, 개인정보보호정책에 관한 사항을 잘 읽어보시고 동의해주세요!
      </p>

      <label className="check-row">
        <input type="checkbox" checked={agreeAll} onChange={handleAllChange} />
        <span className="checkmark"></span>
        <strong>방화침례교회의 이용약관, 개인정보보호방침에 모두 동의 합니다.</strong>
      </label>

      <hr />

      <label className={`check-row ${!agreeTerms && showError ? 'invalid' : agreeTerms ? 'valid' : ''}`}>
        <input type="checkbox" checked={agreeTerms} onChange={() => setAgreeTerms(!agreeTerms)} />
        <span className="checkmark"></span>
        이용약관 동의
      </label>
      {!agreeTerms && showError && (
        <p className="check-error">필수 선택 사항입니다.</p>
      )}

      <label className={`check-row ${!agreePrivacy && showError ? 'invalid' : agreePrivacy ? 'valid' : ''}`}>
        <input type="checkbox" checked={agreePrivacy} onChange={() => setAgreePrivacy(!agreePrivacy)} />
        <span className="checkmark"></span>
        개인정보 수집 및 이용 동의
      </label>
      {!agreePrivacy && showError && (
        <p className="check-error">필수 선택 사항입니다.</p>
      )}

      <div className="signup-buttons">
        <button className="cancel-btn">취소</button>
        <button className="next-btn" onClick={handleSubmit}>다음</button>
      </div>
    </div>
  );
};

export default SignupPage;