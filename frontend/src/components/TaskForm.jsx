// src/components/TaskForm.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams, Link } from 'react-router-dom';

// TaskForm fonksiyonunu buraya taşıdık ve export ettik
export function TaskForm() {
  const [title, setTitle] = useState('');
  const [completed, setCompleted] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();

  const isEditing = Boolean(id);

  useEffect(() => {
    if (isEditing) {
      axios.get(`/api/tasks/${id}/`)
        .then(response => {
          setTitle(response.data.title);
          setCompleted(response.data.completed);
        })
        .catch(error => console.error('Görev detayı alınamadı:', error));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const taskData = { title, completed };

    try {
      if (isEditing) {
        await axios.put(`/api/tasks/${id}/`, taskData);
      } else {
        await axios.post('/api/tasks/', taskData);
      }
      
      // !!! GÜNCELLENDİ !!! Ana sayfa "/" değil, görev listesi olan "/tasks" oldu
      navigate('/tasks');
    } catch (error) {
      console.error('Görev kaydedilemedi:', error);
    }
  };

  return (
    // Eski container yapınızı (merkezlenmiş) bu bileşene ekledim
    <div className="container mx-auto p-4 pt-10 max-w-xl">
      <div className="bg-white p-6 rounded-lg shadow-xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
          {isEditing ? 'Görevi Düzenle' : 'Yeni Görev Ekle'}
        </h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label 
              htmlFor="title" 
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              Görev Başlığı
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Örn: Docker dosyasını güncelle"
              required
            />
          </div>

          {isEditing && (
             <div className="mb-6">
              <label className="flex items-center text-gray-700">
                <input
                  type="checkbox"
                  checked={completed}
                  onChange={(e) => setCompleted(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="ml-2">Tamamlandı olarak işaretle</span>
              </label>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="w-full bg-green-600 text-white px-5 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-md"
            >
              Kaydet
            </button>
            {/* !!! GÜNCELLENDİ !!! İptal edince "/" değil, "/tasks" yoluna gitmeli */}
            <Link
              to="/tasks"
              className="ml-4 inline-block text-center text-gray-600 px-5 py-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              İptal
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}