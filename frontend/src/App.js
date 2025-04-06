import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// 定義首頁元件
function Home() {
  return <h2>這是首頁</h2>;
}

// 定義關於頁元件
function About() {
  return <h2>這是關於頁面</h2>;
}

function App() {
  return (
    <Router>
      <div>
        <h1>歡迎使用 React 前端應用程式</h1>
        <nav>
          <ul>
            <li>
              <Link to="/">首頁</Link>
            </li>
            <li>
              <Link to="/about">關於</Link>
            </li>
          </ul>
        </nav>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
