import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignupPage.css';

const SignupPage = () => {
  const [agreeAll, setAgreeAll] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [showError, setShowError] = useState(false);

  const navigate = useNavigate();

  const handleAllChange = () => {
    const newValue = !agreeAll;
    setAgreeAll(newValue);
    setAgreeTerms(newValue);
    setAgreePrivacy(newValue);
  };

    const handleCancel = () => {
        navigate('/');
    };

  const handleSubmit = () => {
    if (!agreeTerms || !agreePrivacy) {
      setShowError(true);
    } else {
      navigate('/signup/realname');
    }
  };

  const termsText = `제 1 조 (목적)
이 약관은 방화침례교회 홈페이지에서 제공하는 모든 자료의 이용 조건 및 절차, 권리와 의무를 규정합니다.

제 2 조 (이용약관의 명시, 효력 및 개정)
1. 교회는 이 약관의 내용을 홈페이지 초기화면에 게시합니다.
2. 교회는 관계법령을 위반하지 않는 범위 내에서 이 약관을 개정할 수 있으며, 개정 시 사전 공지합니다.
3. 변경된 약관에 동의하지 않는 경우 회원은 서비스 이용을 중단하고 탈퇴할 수 있습니다.`;

  const privacyText = `수집하는 개인정보 항목 및 수집방법
1. 수집항목: 이름, 생년월일, 연락처, 이메일
2. 수집목적: 회원 식별 및 커뮤니케이션
3. 보유기간: 회원 탈퇴 시까지`;

  return (
    <div className="signup-page page-container">
      <h1 className="signup-title">회원가입</h1>

      <div className="signup-steps">
        {['약관동의', '실명확인', '추가입력정보', '가입완료'].map((label, idx) => (
          <div key={idx} className={`step ${idx === 0 ? 'active' : ''}`}>
            <div className="circle">{`0${idx + 1}`}</div>
            <div className="label">{label}</div>
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

      {/* 약관 개별 동의 */}
      <label className={`check-row ${!agreeTerms && showError ? 'invalid' : agreeTerms ? 'valid' : ''}`}>
        <input type="checkbox" checked={agreeTerms} onChange={() => setAgreeTerms(!agreeTerms)} />
        <span className="checkmark"></span>
        이용약관 동의
      </label>
      {!agreeTerms && showError && (
        <p className="check-error">필수 선택 사항입니다.</p>
      )}
      <textarea className="terms-box" readOnly value={termsText} />

      <label className={`check-row ${!agreePrivacy && showError ? 'invalid' : agreePrivacy ? 'valid' : ''}`}>
        <input type="checkbox" checked={agreePrivacy} onChange={() => setAgreePrivacy(!agreePrivacy)} />
        <span className="checkmark"></span>
        개인정보처리방침 동의
      </label>
      {!agreePrivacy && showError && (
        <p className="check-error">필수 선택 사항입니다.</p>
      )}
      <textarea className="terms-box" readOnly value={privacyText} />

      <div className="signup-buttons">
        <button className="cancel-btn" onClick={handleCancel}>취소</button>
        <button className="next-btn" onClick={handleSubmit}>다음</button>
      </div>
    </div>
  );
};

export default SignupPage;
