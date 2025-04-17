// src/components/BiblePracticePage.js

import React, { useEffect, useState } from 'react';
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

  // 1) 책 목록 한 번만 불러오기
  useEffect(() => {
    getBibleBooks()
      .then(setBooks)
      .catch(err => console.error('책 목록 불러오기 실패', err));
  }, []);

  // 2) 책을 선택하면: 저장된 진행 위치 조회 → 해당 위치 구절 불러오기
  useEffect(() => {
    if (!selectedBook) return;

    getBibleProgress(selectedBook)
      .then(progress => {
        const { chapter, verse } = progress;
        setCurrentChapter(chapter);
        setCurrentVerseNumber(verse);
        fetchAndReset(selectedBook, chapter, verse);
      })
      .catch(err => {
        console.error('진행 위치 불러오기 실패', err);
        // 기본값 1:1 로 시작
        setCurrentChapter(1);
        setCurrentVerseNumber(1);
        fetchAndReset(selectedBook, 1, 1);
      });
  }, [selectedBook]);

  // 구절 불러오고 입력창 초기화
  const fetchAndReset = (bookCode, chap, verse) => {
    getVerse(bookCode, chap, verse)
      .then(data => {
        setCurrentVerse(data);
        setInput('');
        setIsCorrect(false);
      })
      .catch(err => console.error('구절 불러오기 실패', err));
  };

  // 입력 체크
  const handleInputChange = e => {
    const val = e.target.value;
    setInput(val);
    if (!currentVerse) return;
    setIsCorrect(val === currentVerse.text);
  };

  // “다음” 버튼 또는 Enter 키 → 진행 위치 저장 후 다음 구절 로드
    const handleNextVerse = async () => {
      if (!isCorrect) return;

      const next = currentVerseNumber + 1;

      try {
        // ✅ '다음 절 번호'를 저장 (즉, 다음에 시작할 위치)
        await saveBibleProgress(
          selectedBook,
          currentChapter,
          next
        );

        setCurrentVerseNumber(next);
        fetchAndReset(selectedBook, currentChapter, next);
      } catch (err) {
        console.error('진행 위치 저장 실패', err);
        alert('진행 위치 저장 중 오류가 발생했습니다.');
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
        onKeyDown={e => {
          if (e.key === 'Enter') handleNextVerse();
        }}
        placeholder="본문을 그대로 입력하세요"
        style={{ width: '100%', padding: '0.5rem', fontSize: '1rem' }}
      />

      {/* 5. 다음 절 버튼 */}
      <div style={{ marginTop: '1rem' }}>
        <button onClick={handleNextVerse} disabled={!isCorrect}>
          다음 절 ▶
        </button>
      </div>
    </div>
  );
}

export default BiblePracticePage;
