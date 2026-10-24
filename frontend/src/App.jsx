import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Weather from './pages/Weather';
import Crops from './pages/Crops';
import Chat from './pages/Chat';
import AskQuery from './pages/AskQuery';
import Schemes from './pages/Schemes';
import Help from './pages/Help';
import Reminders from './pages/Reminders';
import Market from './pages/Market';
import Nearby from './pages/Nearby';
import FeaturePage from './pages/FeaturePage';

function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/weather" element={<Weather />} />
        <Route path="/crops" element={<Crops />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/ask-query" element={<AskQuery />} />
        <Route path="/schemes" element={<Schemes />} />
        <Route path="/help" element={<Help />} />
        <Route path="/reminders" element={<Reminders />} />
        <Route path="/market-price" element={<Market />} />
        <Route path="/nearby" element={<Nearby />} />

        <Route
          path="/disease-check"
          element={
            <FeaturePage
              titleKey="diseaseCheck"
              icon="🌿"
              textKey="diseaseText"
              linkTo="/chat"
              linkKey="openChat"
            />
          }
        />
      </Routes>
    </div>
  );
}

export default App;