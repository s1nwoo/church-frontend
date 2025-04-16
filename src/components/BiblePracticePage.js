import React, { useEffect, useState } from 'react';
import axios from 'axios';

function BiblePracticePage() {
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState('');
  const [currentVerse, setCurrentVerse] = useState(null);
  const [input, setInput] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [currentChapter, setCurrentChapter] = useState(1);
  const [currentVerseNumber, setCurrentVerseNumber] = useState(1);

  // 책 목록 불러오기
  useEffect(() => {
    axios.get('/api/bible-practice/books')
      .then(res => setBooks(res.data))
      .catch(err => console.error('책 목록 불러오기 실패', err));
  }, []);

  // 책 선택 시 1장 1절 자동 로딩
  useEffect(() => {
    if (selectedBook) {
      setCurrentChapter(1);
      setCurrentVerseNumber(1);
      fetchVerse(selectedBook, 1, 1);
    }
  }, [selectedBook]);

  // 구절 불러오기 함수
  const fetchVerse = (bookCode, chapter, verse) => {
    axios.get(`/api/bible-practice/verse?bookCode=${bookCode}&chapter=${chapter}&verse=${verse}`)
      .then(res => {
        setCurrentVerse(res.data);
        setInput('');
        setIsCorrect(false);
      })
      .catch(err => console.error('구절 불러오기 실패', err));
  };

  // 입력 변경 시 오타 체크
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);

    if (currentVerse) {
      const answer = currentVerse.text;
      const isMatch = value === answer;
      setIsCorrect(isMatch);
    }
  };

  // 다음 구절로 이동
  const handleNextVerse = () => {
    const nextVerse = currentVerseNumber + 1;
    setCurrentVerseNumber(nextVerse);
    fetchVerse(selectedBook, currentChapter, nextVerse);
  };

  // 실시간 비교 결과를 HTML로 반환
  const renderComparison = () => {
    if (!currentVerse) return null;

    const answer = currentVerse.text;
    const result = [];

    for (let i = 0; i < answer.length; i++) {
      const inputChar = input[i];
      const correctChar = answer[i];

      let color = 'gray';
      if (inputChar === undefined) {
        color = 'gray';
      } else if (inputChar === correctChar) {
        color = 'green';
      } else {
        color = 'red';
      }

      result.push(
        <span key={i} style={{ color }}>{correctChar}</span>
      );
    }

    return <div style={{ marginTop: '1rem', fontSize: '1.2rem' }}>{result}</div>;
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>✍️ 성경 타자 연습</h2>

      {/* 책 선택 */}
      <div style={{ marginBottom: '1rem' }}>
        <label>성경 책 선택: </label>
        <select onChange={(e) => setSelectedBook(e.target.value)} value={selectedBook}>
          <option value="">-- 선택 --</option>
          {books.map((book, idx) => (
            <option key={idx} value={book.abbr}>{book.name}</option>
          ))}
        </select>
      </div>

      {/* 현재 구절 표시 */}
      {currentVerse && (
        <div style={{ marginBottom: '1rem' }}>
          <h4>{currentChapter}장 {currentVerse.verse}절:</h4>
          <p>{currentVerse.text}</p>
        </div>
      )}

      {/* 오타 실시간 비교 */}
      {renderComparison()}

      {/* 입력창 */}
      <div>
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && isCorrect) {
              handleNextVerse(); // ✅ 엔터키로 다음 구절 이동
            }
          }}
          style={{ width: '100%', padding: '0.5rem', fontSize: '1rem' }}
          placeholder="구절을 입력하세요..."
        />
      </div>

      {/* 다음 버튼 */}
      <div style={{ marginTop: '1rem' }}>
        <button onClick={handleNextVerse} disabled={!isCorrect}>
          다음 구절로 ▶
        </button>
      </div>
    </div>
  );
}

export default BiblePracticePage;
