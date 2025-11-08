import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { HomePage } from './components/HomePage.jsx'; 
import { TaskList } from './components/TaskList.jsx'; 
import { TaskForm } from './components/TaskForm.jsx'; 
import { AdminPage } from './components/AdminPage.jsx'; 

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/tasks" element={<TaskList />} />
        <Route path="/tasks/add" element={<TaskForm />} />
        <Route path="/tasks/edit/:id" element={<TaskForm />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </Router>
  );
}

export default App;