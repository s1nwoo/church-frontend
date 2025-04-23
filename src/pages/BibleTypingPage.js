import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function BibleTypingPage() {
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState('');
  const [currentChapter, setCurrentChapter] = useState(1);
  const [currentVerseNumber, setCurrentVerseNumber] = useState(1);
  const [currentVerse, setCurrentVerse] = useState(null);
  const [input, setInput] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // 로그인 확인
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const lockRef = useRef(false);
  const lastInvokeRef = useRef(0);
  const THROTTLE_DELAY = 300;

  // 책 목록 불러오기
  useEffect(() => {
    axios.get('/api/bible-practice/books', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`
      }
    })
      .then(res => setBooks(res.data))
      .catch(err => console.error('책 목록 불러오기 실패:', err));
  }, []);

  // 책 선택 시 진행 위치 불러오기
  useEffect(() => {
    if (!selectedBook) return;

    axios.get(`/api/bible-practice/progress?bookCode=${encodeURIComponent(selectedBook)}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`
      }
    })
      .then(res => {
        const { chapter, verse } = res.data;
        setCurrentChapter(chapter);
        setCurrentVerseNumber(verse);
        fetchAndReset(selectedBook, chapter, verse);
      })
      .catch(err => {
        console.error('진행 위치 불러오기 실패:', err);
        setCurrentChapter(1);
        setCurrentVerseNumber(1);
        fetchAndReset(selectedBook, 1, 1);
      });
  }, [selectedBook]);

  // 구절 불러오기
  const fetchAndReset = (book, chapter, verse) => {
    axios.get(`/api/bible-practice/verse?bookCode=${encodeURIComponent(book)}&chapter=${chapter}&verse=${verse}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`
      }
    })
      .then(res => {
        setCurrentVerse(res.data);
        setInput('');
        setIsCorrect(false);
      })
      .catch(err => console.error('구절 불러오기 실패:', err));
  };

  const handleInputChange = e => {
    const val = e.target.value;
    setInput(val);
    if (!currentVerse) return;
    setIsCorrect(val === currentVerse.text);
  };

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
      await axios.post('/api/bible-practice/progress', {
        book: selectedBook,
        chapter: currentChapter,
        verse: next
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      setCurrentVerseNumber(next);
      fetchAndReset(selectedBook, currentChapter, next);
    } catch (err) {
      console.error('진행 위치 저장 실패:', err);
      alert('진행 위치 저장 중 오류가 발생했습니다.');
    } finally {
      lockRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNextVerse();
    }
  };

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
    <div className="location-container page-container">
      <h2>성경 타자 연습</h2>

      {/* 책 선택 */}
      <div className="info-row">
        <label className="label">성경 책 선택:</label>
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

      {/* 현재 구절 */}
      {currentVerse && (
        <div className="info-row">
          <h4>{currentChapter}장 {currentVerse.verse}절:</h4>
          <p>{currentVerse.text}</p>
        </div>
      )}

      {/* 오타 비교 */}
      {renderComparison()}

      {/* 입력창 */}
      <input
        type="text"
        value={input}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="본문을 그대로 입력하세요"
        className="typing-input"
        disabled={isSubmitting}
      />

      {/* 다음 절 버튼 */}
      <div style={{ marginTop: '1rem' }}>
        <button onClick={handleNextVerse} disabled={!isCorrect || isSubmitting}>
          다음 절 ▶
        </button>
      </div>
    </div>
  );
}

export default BibleTypingPage;
