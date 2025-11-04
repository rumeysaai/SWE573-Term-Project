import React, { useState } from "react";
import axios from "axios";

function TaskForm() {
  const [task, setTask] = useState({ title: "", completed: false });

  const handleSubmit = (e) => {
    e.preventDefault();
    axios
      .post("https://jsonplaceholder.typicode.com/todos", task) // Replace with your API URL
      .then((response) => {
        console.log("Task created:", response.data);
      })
      .catch((error) => {
        console.error("Error creating task:", error);
      });
  };

  const handleUpdate = (id) => {
    axios
      .put(`https://jsonplaceholder.typicode.com/todos/${id}`, task) // Replace with your API URL
      .then((response) => {
        console.log("Task updated:", response.data);
      })
      .catch((error) => {
        console.error("Error updating task:", error);
      });
  };

  return (
    <div>
      <h1>Task Form</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Task Title"
          value={task.title}
          onChange={(e) => setTask({ ...task, title: e.target.value })}
        />
        <label>
          <input
            type="checkbox"
            checked={task.completed}
            onChange={(e) => setTask({ ...task, completed: e.target.checked })}
          />
          Completed
        </label>
        <button type="submit">Create Task</button>
      </form>
      <button onClick={() => handleUpdate(1)}>Update Task</button> {/* Replace 1 with the task ID */}
    </div>
  );
}

export default TaskForm;