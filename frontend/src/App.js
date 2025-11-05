import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Link, 
  useNavigate, 
  useParams 
} from 'react-router-dom';

//=================================================================
// 1. Ana Yönlendirme (Routing) Bileşeni
//=================================================================
function App() {
  return (
    <Router>
      <div className="container mx-auto p-4 pt-10 max-w-xl">
        <div className="bg-white p-6 rounded-lg shadow-xl">
          {/* Sayfalar (TaskList ve TaskForm) burada değişecek */}
          <Routes>
            <Route path="/" element={<TaskList />} />
            <Route path="/add" element={<TaskForm />} />
            <Route path="/edit/:id" element={<TaskForm />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

//=================================================================
// 2. Görev Listesi Bileşeni (Ana Sayfa)
//=================================================================
function TaskList() {
  const [tasks, setTasks] = useState([]);

  // Backend'den (Django) görevleri çekmek için
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      // ÖNEMLİ: Yol haritamızdaki gibi göreceli (relative) path kullanıyoruz.
      // Nginx (Docker'da) veya "proxy" (Lokalde) bunu backend'e yönlendirecek.
      const response = await axios.get('/api/tasks/');
      setTasks(response.data);
    } catch (error) {
      console.error('Görevler alınamadı:', error);
    }
  };

  // Görev silme fonksiyonu
  const deleteTask = async (id) => {
    try {
      await axios.delete(`/api/tasks/${id}/`);
      // Listeyi yenile
      fetchTasks();
    } catch (error) {
      console.error('Görev silinemedi:', error);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
        Görev Listesi
      </h1>

      {/* !!! SORUNUNUZUN ÇÖZÜMÜ BURADA !!!
        İşte "Yeni Görev Ekle" butonu (Link bileşeni).
        Bu, TaskForm bileşenine (/add yoluna) gitmenizi sağlar.
      */}
      <Link
        to="/add"
        className="mb-6 w-full text-center inline-block bg-blue-600 text-white px-5 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md"
      >
        + Yeni Görev Ekle
      </Link>

      {/* Görevlerin Listelendiği Alan */}
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
                <Link
                  to={`/edit/${task.id}`}
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
  );
}

//=================================================================
// 3. Görev Ekleme/Düzenleme Formu Bileşeni
//=================================================================
function TaskForm() {
  const [title, setTitle] = useState('');
  const [completed, setCompleted] = useState(false); // Checkbox için
  const navigate = useNavigate();
  const { id } = useParams(); // URL'den :id parametresini almak için

  const isEditing = Boolean(id); // Eğer URL'de id varsa, bu bir "düzenleme" modudur.

  // Düzenleme moduysa, mevcut görevin bilgilerini çek
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

  // Form gönderildiğinde (Kaydet butonuna basıldığında)
  const handleSubmit = async (e) => {
    e.preventDefault(); // Formun sayfayı yenilemesini engelle
    
    const taskData = { title, completed };

    try {
      if (isEditing) {
        // Düzenleme modu: PUT isteği
        await axios.put(`/api/tasks/${id}/`, taskData);
      } else {
        // Ekleme modu: POST isteği
        await axios.post('/api/tasks/', taskData);
      }
      // Başarılı olursa, ana sayfaya (listeye) geri dön
      navigate('/');
    } catch (error) {
      console.error('Görev kaydedilemedi:', error);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
        {isEditing ? 'Görevi Düzenle' : 'Yeni Görev Ekle'}
      </h1>
      <form onSubmit={handleSubmit}>
        {/* Görev Başlığı Girişi */}
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

        {/* Tamamlandı mı? Checkbox (Sadece düzenleme modunda gösterelim, eklerken hep false olsun) */}
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

        {/* Butonlar */}
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="w-full bg-green-600 text-white px-5 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-md"
          >
            Kaydet
          </button>
          <Link
            to="/"
            className="ml-4 inline-block text-center text-gray-600 px-5 py-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            İptal
          </Link>
        </div>
      </form>
    </div>
  );
}

export default App;

