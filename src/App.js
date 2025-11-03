import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import HomePage from './pages/HomePage';
import QRPage from './pages/QRPage';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/qr/:token" element={<QRPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
