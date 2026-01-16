// src/pages/ProfilePage.js
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './ProfilePage.css';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, login } = useContext(AuthContext);

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    username: '',
    name: '',
    birthDate: '',
    email: '',
    phoneNumber: '',
    gender: '',
    password: '',
    confirmPassword: ''
  });

  // ✅ axios 기본 헤더 설정 (JWT 토큰 포함)
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  // ✅ 로그인 체크 - user가 로드될 때까지 기다림
  useEffect(() => {
    // localStorage에 토큰이 있으면 user가 로드될 때까지 기다림
    const token = localStorage.getItem('accessToken');
    if (!token) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    // user가 null이고 loading이 false인 경우에만 로그인 페이지로 이동
    if (!user && !loading) {
      // AuthContext가 로드되는 동안 잠시 대기
      const timer = setTimeout(() => {
        if (!user) {
          alert('로그인이 필요합니다.');
          navigate('/login');
        }
      }, 500); // 0.5초 대기 후 체크

      return () => clearTimeout(timer);
    }
  }, [user, loading, navigate]);

  // 내 정보 불러오기
  useEffect(() => {
    const fetchMyInfo = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // ✅ Authorization 헤더에 JWT 토큰 포함
        const res = await axios.get('/api/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const userData = res.data;

        setForm({
          username: userData.username || '',
          name: userData.name || '',
          birthDate: userData.birthDate || '',
          email: userData.email || '',
          phoneNumber: userData.phoneNumber || '',
          gender: userData.gender || '',
          password: '',
          confirmPassword: ''
        });
      } catch (err) {
        console.error('Error fetching profile:', err);
        console.error('Error response:', err.response?.data);

        // 401 에러인 경우에만 로그인 페이지로 이동
        if (err.response?.status === 401) {
          alert('세션이 만료되었습니다. 다시 로그인해주세요.');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          navigate('/login');
        } else {
          alert('정보를 불러오는 중 오류가 발생했습니다.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMyInfo();
  }, []); // ✅ 의존성 배열에서 user 제거

  const handleChange = (key, value) => {
    // 전화번호는 숫자만 입력 가능
    if (key === 'phoneNumber') {
      value = value.replace(/[^0-9]/g, '');
    }
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 필수 필드 검사
    if (!form.name || !form.birthDate || !form.email || !form.gender) {
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }

    // 비밀번호 변경 시 확인
    if (form.password || form.confirmPassword) {
      if (form.password !== form.confirmPassword) {
        alert('비밀번호가 일치하지 않습니다.');
        return;
      }
      if (form.password.length < 4) {
        alert('비밀번호는 최소 4자 이상이어야 합니다.');
        return;
      }
    }

    try {
      const token = localStorage.getItem('accessToken');

      const updateData = {
        username: form.username,
        name: form.name,
        birthDate: form.birthDate,
        email: form.email,
        phoneNumber: form.phoneNumber,
        gender: form.gender
      };

      // 비밀번호가 입력된 경우에만 추가
      if (form.password) {
        updateData.password = form.password;
      }

      // ✅ Authorization 헤더에 JWT 토큰 포함
      const res = await axios.put('/api/profile', updateData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // AuthContext 업데이트
      const updatedUser = {
        ...user,
        name: res.data.name,
        email: res.data.email,
        username: res.data.username
      };
      login(updatedUser);

      alert('정보가 수정되었습니다.');
      setIsEditing(false);

      // 비밀번호 필드 초기화
      setForm(prev => ({
        ...prev,
        password: '',
        confirmPassword: ''
      }));
    } catch (err) {
      console.error('Error updating profile:', err);
      console.error('Error response:', err.response?.data);
      const errorMsg = err.response?.data?.error || '정보 수정 중 오류가 발생했습니다.';
      alert(errorMsg);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // 비밀번호 필드만 초기화
    setForm(prev => ({
      ...prev,
      password: '',
      confirmPassword: ''
    }));
  };

  if (loading) {
    return (
      <div className="profile-page page-container">
        <div className="profile-container">
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page page-container">
      <div className="profile-container">
        <h2 className="profile-title">내 정보</h2>

        <div className="profile-top">
          {!isEditing ? (
            <button
              className="edit-btn"
              onClick={() => setIsEditing(true)}
            >
              수정
            </button>
          ) : (
            <button
              className="cancel-btn"
              onClick={handleCancel}
            >
              취소
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="username">
                아이디 <span className="required">*</span>
              </label>
              <input
                id="username"
                type="text"
                value={form.username}
                onChange={(e) => handleChange('username', e.target.value)}
                disabled={!isEditing}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="name">
                이름 <span className="required">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                disabled={!isEditing}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="birthDate">
                생년월일 <span className="required">*</span>
              </label>
              <input
                id="birthDate"
                type="text"
                placeholder="YYYY-MM-DD"
                value={form.birthDate}
                onChange={(e) => handleChange('birthDate', e.target.value)}
                disabled={!isEditing}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="gender">
                성별 <span className="required">*</span>
              </label>
              <select
                id="gender"
                value={form.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                disabled={!isEditing}
                required
              >
                <option value="">선택</option>
                <option value="남자">남자</option>
                <option value="여자">여자</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">
                이메일 <span className="required">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                disabled={!isEditing}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phoneNumber">전화번호</label>
              <input
                id="phoneNumber"
                type="tel"
                placeholder="01012345678"
                value={form.phoneNumber}
                onChange={(e) => handleChange('phoneNumber', e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </div>

          {isEditing && (
            <>
              <div className="password-section">
                <h3>비밀번호 변경 (선택)</h3>
                <p className="section-note">비밀번호를 변경하지 않으려면 비워두세요.</p>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="password">새 비밀번호</label>
                  <input
                    id="password"
                    type="password"
                    placeholder="변경하지 않으려면 비워두세요"
                    value={form.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">새 비밀번호 확인</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    placeholder="새 비밀번호를 다시 입력하세요"
                    value={form.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="save-btn">
                  저장
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;