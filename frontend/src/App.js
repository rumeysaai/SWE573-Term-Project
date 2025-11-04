import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import TaskList from "./TaskList";
import TaskForm from "./TaskForm";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TaskList />} />
        <Route path="/task-form" element={<TaskForm />} />
      </Routes>
    </Router>
  );
}

export default App;