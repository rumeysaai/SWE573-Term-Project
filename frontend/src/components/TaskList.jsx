import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export function TaskList() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get('/api/tasks/');
      setTasks(response.data);
    } catch (error) {
      console.error('Görevler alınamadı:', error);
    }
  };

  const deleteTask = async (id) => {
    try {
      await axios.delete(`/api/tasks/${id}/`);
      fetchTasks();
    } catch (error) {
      console.error('Görev silinemedi:', error);
    }
  };

  return (
    // Eski container yapınızı (merkezlenmiş) bu bileşene ekledim
    <div className="container mx-auto p-4 pt-10 max-w-xl">
      <div className="bg-white p-6 rounded-lg shadow-xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
          Görev Listesi
        </h1>

        {/* !!! GÜNCELLENDİ !!! Yol "/add" değil, "/tasks/add" oldu */}
        <Link
          to="/tasks/add" 
          className="mb-6 w-full text-center inline-block bg-blue-600 text-white px-5 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md"
        >
          + Yeni Görev Ekle
        </Link>

        <ul className="space-y-3">
          {tasks.length > 0 ? (
            tasks.map(task => (
              <li
                key={task.id}
                className="flex items-center justify-between bg-gray-100 p-4 rounded-lg shadow-sm"
              >
                <span 
                  className={`text-lg ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}
                >
                  {task.title}
                </span>
                <div className="space-x-2">
                  {/* !!! GÜNCELLENDİ !!! Yol "/edit/..." değil, "/tasks/edit/..." oldu */}
                  <Link
                    to={`/tasks/edit/${task.id}`}
                    className="text-sm bg-yellow-500 text-white px-3 py-1 rounded-md hover:bg-yellow-600 transition-colors"
                  >
                    Düzenle
                  </Link>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="text-sm bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition-colors"
                  >
                    Sil
                  </button>
                </div>
              </li>
            ))
          ) : (
            <p className="text-center text-gray-500">
              Henüz görev eklenmemiş.
            </p>
          )}
        </ul>
      </div>
    </div>
  );
}