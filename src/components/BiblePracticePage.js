// src/components/BiblePracticePage.js

import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getBibleBooks,
  getBibleProgress,
  getVerse,
  saveBibleProgress
} from '../api/BiblePracticeApi';

function BiblePracticePage() {
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState('');
  const [currentChapter, setCurrentChapter] = useState(1);
  const [currentVerseNumber, setCurrentVerseNumber] = useState(1);
  const [currentVerse, setCurrentVerse] = useState(null);
  const [input, setInput] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      if (!isLoggedIn) {
        navigate('/login'); // ✅ 비회원이면 로그인 페이지로 리다이렉트
      }
    }, []);
    
  const lockRef = useRef(false);             // 호출 중 복귀 방지
  const lastInvokeRef = useRef(0);           // 스로틀 타임스탬프
  const THROTTLE_DELAY = 300;                // 최소 300ms 간격

  // 1) 책 목록 로드
  useEffect(() => {
    getBibleBooks()
      .then(setBooks)
      .catch(err => console.error('책 목록 불러오기 실패', err));
  }, []);

  // 2) 책 선택 시 진행 위치 로드
  useEffect(() => {
    if (!selectedBook) return;
    getBibleProgress(selectedBook)
      .then(({ chapter, verse }) => {
        setCurrentChapter(chapter);
        setCurrentVerseNumber(verse);
        fetchAndReset(selectedBook, chapter, verse);
      })
      .catch(err => {
        console.error('진행 위치 불러오기 실패', err);
        setCurrentChapter(1);
        setCurrentVerseNumber(1);
        fetchAndReset(selectedBook, 1, 1);
      });
  }, [selectedBook]);

  // 구절 호출 & 입력창 초기화
  const fetchAndReset = (bookCode, chap, verse) => {
    getVerse(bookCode, chap, verse)
      .then(data => {
        setCurrentVerse(data);
        setInput('');
        setIsCorrect(false);
      })
      .catch(err => console.error('구절 불러오기 실패', err));
  };

  // 입력값 비교
  const handleInputChange = e => {
    const val = e.target.value;
    setInput(val);
    if (!currentVerse) return;
    setIsCorrect(val === currentVerse.text);
  };

  // 다음 절 저장 + 호출 (중복/스킵 방지)
  const handleNextVerse = async () => {
    if (!isCorrect) return;

    const now = Date.now();
    if (lockRef.current || now - lastInvokeRef.current < THROTTLE_DELAY) {
      return;
    }
    lockRef.current = true;
    lastInvokeRef.current = now;
    setIsSubmitting(true);

    const next = currentVerseNumber + 1;
    try {
      await saveBibleProgress(selectedBook, currentChapter, next);
      setCurrentVerseNumber(next);
      fetchAndReset(selectedBook, currentChapter, next);
    } catch (err) {
      console.error('진행 위치 저장 실패', err);
      alert('진행 위치 저장 중 오류가 발생했습니다.');
    } finally {
      lockRef.current = false;
      setIsSubmitting(false);
    }
  };

  // 엔터키 처리
  const handleKeyDown = e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNextVerse();
    }
  };

  // 오타 비교 렌더링
  const renderComparison = () => {
    if (!currentVerse) return null;
    return (
      <div style={{ marginTop: '1rem', fontSize: '1.2rem' }}>
        {currentVerse.text.split('').map((ch, i) => {
          let color = 'gray';
          if (input[i] === ch) color = 'green';
          else if (input[i] && input[i] !== ch) color = 'red';
          return (
            <span key={i} style={{ color }}>
              {ch}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>✍️ 성경 타자 연습</h2>

      {/* 1. 책 선택 */}
      <div style={{ marginBottom: '1rem' }}>
        <label>성경 책 선택: </label>
        <select
          value={selectedBook}
          onChange={e => setSelectedBook(e.target.value)}
          disabled={isSubmitting}
        >
          <option value="">-- 선택 --</option>
          {books.map((b, i) => (
            <option key={i} value={b.abbr}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {/* 2. 현재 구절 표시 */}
      {currentVerse && (
        <div style={{ marginBottom: '1rem' }}>
          <h4>
            {currentChapter}장 {currentVerse.verse}절:
          </h4>
          <p>{currentVerse.text}</p>
        </div>
      )}

      {/* 3. 오타 비교 */}
      {renderComparison()}

      {/* 4. 입력창 */}
      <input
        type="text"
        value={input}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="본문을 그대로 입력하세요"
        style={{ width: '100%', padding: '0.5rem', fontSize: '1rem' }}
        disabled={isSubmitting}
      />

      {/* 5. 다음 절 버튼 */}
      <div style={{ marginTop: '1rem' }}>
        <button onClick={handleNextVerse} disabled={!isCorrect || isSubmitting}>
          다음 절 ▶
        </button>
      </div>
    </div>
  );
}

export default BiblePracticePage;
