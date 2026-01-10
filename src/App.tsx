import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Dashboard } from '@/pages/Dashboard';
import { Editor } from '@/pages/Editor';
import { initializeTheme } from '@/store/themeStore';

function App() {
  useEffect(() => {
    initializeTheme();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/project/:id" element={<Editor />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
