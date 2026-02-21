import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import Home from './pages/dashboard/Home';
import Repositories from './pages/repositories/List';
import Accounts from './pages/settings/Accounts';
import SyncLogs from './pages/history/Logs';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Home />} />
          <Route path="repositories" element={<Repositories />} />
          <Route path="history" element={<SyncLogs />} />
          <Route path="settings" element={<Accounts />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
