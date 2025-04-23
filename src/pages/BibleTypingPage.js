import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './BibleTypingPage.css';

function BibleTypingPage() {
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState('');
  const [currentChapter, setCurrentChapter] = useState(1);
  const [currentVerseNumber, setCurrentVerseNumber] = useState(1);
  const [currentVerse, setCurrentVerse] = useState(null);
  const [input, setInput] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) navigate('/login');
  }, [navigate]);

  const lockRef = useRef(false);
  const lastInvokeRef = useRef(0);
  const THROTTLE_DELAY = 300;

  useEffect(() => {
    axios.get('/api/bible-practice/books', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`
      }
    })
      .then(res => setBooks(res.data))
      .catch(err => console.error('책 목록 불러오기 실패:', err));
  }, []);

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
        setCurrentChapter(1);
        setCurrentVerseNumber(1);
        fetchAndReset(selectedBook, 1, 1);
      });
  }, [selectedBook]);

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
        setProgress(((verse - 1) / 31) * 100); // 임시 진행률 (전체 절수 알면 수정 가능)
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
    if (lockRef.current || now - lastInvokeRef.current < THROTTLE_DELAY) return;

    lockRef.current = true;
    lastInvokeRef.current = now;
    setIsSubmitting(true);

    const next = currentVerseNumber + 1;

    try {
      await axios.post('/api/bible-practice/progress', {
        bookCode: selectedBook,
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

  const handleBookChange = e => {
    setSelectedBook(e.target.value);
  };

  const renderComparison = () => {
    if (!currentVerse) return null;

    return (
      <div style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>
        {currentVerse.text.split('').map((ch, i) => {
          let color = 'gray';
          if (input[i] === ch) color = 'green';
          else if (input[i]) color = 'red';

          return (
            <span key={i} style={{ color }}>{ch}</span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="location-container page-container">

      <h2 className="location-title">성경 타자 통독</h2>

      <div className="typing-section">
        <div className="book-select-group">
          <label htmlFor="book-select">성경 책 선택</label>
          <select
            id="book-select"
            value={selectedBook}
            onChange={handleBookChange}
          >
            <option value="">-- 선택 --</option>
            {books.map((book) => (
              <option key={book.abbr} value={book.abbr}>{book.name}</option>
            ))}
          </select>
        </div>

        {currentVerse && (
          <>
            <div className="info-row">
              <h4>{currentChapter}장 {currentVerse.verse}절</h4>
            </div>

            <div className="info-row">
              {renderComparison()}
            </div>
            <div>
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="본문을 그대로 입력하세요"
                className="typing-input"
              />
            </div>

            <div className="progress-container">
              <div className="progress-bar" style={{ width: `${progress}%` }}></div>
            </div>

            <div className="info-row" style={{ marginTop: '1rem' }}>
              <button onClick={handleNextVerse} disabled={!isCorrect || isSubmitting}>
                다음 절 ▶
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default BibleTypingPage;
