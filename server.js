const express = require('express');
const app = express();
const PORT = 3000;

// --- ІМПОРТ ДАНИХ ---
const { users, documents, employees } = require('./data');

// --- MIDDLEWARE ---

// Логування (спочатку оголошуємо!)
const loggingMiddleware = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  console.log(`[${timestamp}] ${method} ${url}`);
  next();
};

// Аутентифікація
const authMiddleware = (req, res, next) => {
  const login = req.headers['x-login'];
  const password = req.headers['x-password'];
  const user = users.find(u => u.login === login && u.password === password);

  if (!user) {
    return res.status(401).json({
      message:
        'Authentication failed. Please provide valid credentials in headers X-Login and X-Password.'
    });
  }

  req.user = user;
  next();
};

// Доступ лише для адмінів
const adminOnlyMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  next();
};

// --- ПІДКЛЮЧЕННЯ MIDDLEWARE ---
app.use(express.json()); // парсинг JSON
app.use(loggingMiddleware); // глобальне логування

// --- МАРШРУТИ ДЛЯ РЕСУРСІВ ---

// Всі запити до /documents вимагають лише аутентифікації
app.get('/documents', authMiddleware, (req, res) => {
    res.status(200).json(documents);
  });
  
  // Оновлений маршрут для створення нового документа
  app.post('/documents', authMiddleware, (req, res) => {
    const { title, content } = req.body;
  
    // Перевірка, чи передані всі необхідні поля
    if (!title || !content) {
      return res.status(400).json({ message: 'Bad Request. Fields "title" and "content" are required.' });
    }
  
    const newDocument = {
      id: Date.now(),
      title,
      content,
    };
  
    documents.push(newDocument);
    res.status(201).json(newDocument);
  });
  
  // Новий маршрут для видалення документа за id
  app.delete('/documents/:id', authMiddleware, (req, res) => {
    // Отримуємо id з параметрів маршруту
    const documentId = parseInt(req.params.id);
    const documentIndex = documents.findIndex(doc => doc.id === documentId);
  
    // Якщо документ з таким id не знайдено
    if (documentIndex === -1) {
      return res.status(404).json({ message: 'Document not found' });
    }
  
    // Видаляємо документ з масиву
    documents.splice(documentIndex, 1);
  
    // Відповідаємо статусом 204 No Content, тіло відповіді буде порожнім
    res.status(204).send();
  });
  
  // Запити до /employees вимагають і аутентифікації, і прав адміністратора
  app.get('/employees', authMiddleware, adminOnlyMiddleware, (req, res) => {
    res.status(200).json(employees);
  });  

// --- ЗАПУСК СЕРВЕРА ---
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
