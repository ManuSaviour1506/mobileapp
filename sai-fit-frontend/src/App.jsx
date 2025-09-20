// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import AthleteProfiles from './pages/AthleteProfiles';
import VideoAnalysis from './pages/VideoAnalysis';
import Register from './pages/Register';
import Login from './pages/Login';

const App = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      setUser(JSON.parse(userInfo));
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('userInfo');
    setUser(null);
  };

  return (
    <Router>
      {user && <Navbar user={user} logout={logout} />}
      <div className="p-4">
        <Routes>
          <Route path="/login" element={!user ? <Login setUser={setUser} /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Register setUser={setUser} /> : <Navigate to="/" />} />
          <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/profiles" element={user ? <AthleteProfiles /> : <Navigate to="/login" />} />
          <Route path="/analyze-video" element={user ? <VideoAnalysis /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;