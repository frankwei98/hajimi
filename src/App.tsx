import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Encrypt } from './pages/Encrypt';
import { Decrypt } from './pages/Decrypt';
import { KeyCenter } from './pages/KeyCenter';
import { Message } from './pages/Message';
import { Register } from './pages/Register';
import { UserProfile } from './pages/UserProfile';
import { NotFound } from './pages/NotFound';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="encrypt" element={<Encrypt />} />
          <Route path="decrypt" element={<Decrypt />} />
          <Route path="my" element={<KeyCenter />} />
          <Route path="m/:messageId" element={<Message />} />
          <Route path="register" element={<Register />} />
          <Route path="u/:userHandle" element={<UserProfile />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
