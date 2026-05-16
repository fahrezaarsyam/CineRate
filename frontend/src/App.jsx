import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import SettingsModal from './components/SettingsModal';
import Home from './pages/Home';
import MovieDetail from './pages/MovieDetail';
import Watchlist from './pages/Watchlist';
import Top10 from './pages/Top10';
import ForYou from './pages/ForYou';

function App() {
  return (
    <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/film.html" element={<MovieDetail />} />
          <Route path="/leaderboard.html" element={<Top10 />} />
          <Route path="/mywatchlist.html" element={<Watchlist />} />
          <Route path="/foryou.html" element={<ForYou />} />
        </Routes>
        <AuthModal />
        <SettingsModal />
    </AuthProvider>
  );
}

export default App;
