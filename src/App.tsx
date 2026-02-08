import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Encrypt } from './pages/Encrypt';
import { KeyCenter } from './pages/KeyCenter';
import { Register } from './pages/Register';
import { Login } from './pages/Login';
import { UserProfile } from './pages/UserProfile';
import { Message } from './pages/Message';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="encrypt" element={<Encrypt />} />
          <Route path="my" element={<KeyCenter />} />
          <Route path="register" element={<Register />} />
          <Route path="login" element={<Login />} />
          <Route path="u/:userHandle" element={<UserProfile />} />
          <Route path="m/:messageId" element={<Message />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
