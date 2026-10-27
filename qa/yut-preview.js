// Isolated local visual test harness. Not imported by the production application.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import '../src/App.css';
import '../src/fonts/a2z.css';
import YutPage from '../src/pages/admin/YutPage';
import YutDisplayPage from '../src/pages/admin/YutDisplayPage';
createRoot(document.getElementById('root')).render(<BrowserRouter><Routes>
  <Route path="/admin/yut/display" element={<YutDisplayPage />} />
  <Route path="*" element={<YutPage />} />
</Routes></BrowserRouter>);
