import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Navbar from './components/Navbar';
import Footer from './components/Footer';

import Home from './pages/user/Home';
import Doctors from './pages/user/Doctors';
import Login from './pages/user/Login';
import Register from './pages/user/Register';
import MyAppointments from './pages/user/MyAppointments';
import Appointment from './pages/user/Appointment';

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/doctors/:speciality" element={<Doctors />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/my-appointments" element={<MyAppointments />} />
        <Route path="/appointment/:id" element={<Appointment />} />
      </Routes>

      <Footer />
    </>
  );
}

export default App;
