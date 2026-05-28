import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Campus from './pages/Campus';
import Admission from './pages/Admission';
import Notice from './pages/Notice';
import Faculty from './pages/Faculty';
import Calendar from './pages/Calendar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-[#F4F4F1]">
        <Navbar />
        <main className="flex-grow">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/campus" element={<Campus />} />
              <Route path="/admission" element={<Admission />} />
              <Route path="/notice" element={<Notice />} />
              <Route path="/faculty" element={<Faculty />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </AnimatePresence>
        </main>
        <Footer />
      </div>
    </Router>
  );
}
