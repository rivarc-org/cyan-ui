import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Dashboard } from '@/pages/Dashboard';
import { Editor } from '@/pages/Editor';
import { QueryProvider } from '@/providers/QueryProvider';
import { initializeTheme } from '@/stores/themeStore';

function App() {
  useEffect(() => {
    initializeTheme();
  }, []);

  return (
    <QueryProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/project/:id" element={<Editor />} />
        </Routes>
      </BrowserRouter>
    </QueryProvider>
  );
}

export default App;
