import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Dashboard } from '@/pages/Dashboard';
import { Editor } from '@/pages/Editor';
import { Login } from '@/pages/Login';
import { QueryProvider } from '@/providers/QueryProvider';
import { initializeTheme } from '@/stores/themeStore';
import { Toaster } from '@/components/ui/sonner';

function App() {
  useEffect(() => {
    initializeTheme();
  }, []);

  return (
    <QueryProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/project/:id" element={<Editor />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" />
    </QueryProvider>
  );
}

export default App;
