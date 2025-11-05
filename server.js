const express = require('express');
// Імпортуємо наші дані
//const { documents, employees } = require('./data');
const app = express();
const PORT = 3000;

// Middleware для автоматичного парсингу JSON-тіла запиту
// Це необхідно для роботи POST-запитів
app.use(express.json());

// Імпортуємо всі дані, включаючи користувачів

const { users, documents, employees } = require('./data');

// --- MIDDLEWARE ---
const authMiddleware = (req, res, next) => {
  // Отримуємо дані для входу з заголовків запиту
  const login = req.headers['x-login'];
  const password = req.headers['x-password'];
  // Шукаємо користувача у нашій "базі даних"

  const user = users.find(u => u.login === login && u.password === password);

  // Якщо користувача не знайдено, або дані невірні
  if (!user) {
    // Відповідаємо статусом 401 Unauthorized і припиняємо обробку
    return res.status(401).json({ message: 'Authentication failed. Please provide valid credentials in headers X-Login and X-Password.' });
  }

  // Якщо користувач знайдений, додаємо його дані до об'єкта запиту
  // Це дозволить наступним обробникам знати, хто надіслав запит

  req.user = user;

  // Передаємо управління наступному middleware або основному обробнику маршруту
  next();
};

const adminOnlyMiddleware = (req, res, next) => {

    // Перевіряємо, чи існує об'єкт user і яка в нього роль
    // req.user був доданий на попередньому етапі в authMiddleware
  
    if (!req.user || req.user.role !== 'admin') {
      // Якщо роль не 'admin', відповідаємо статусом 403 Forbidden
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
  
    }
  
    // Якщо перевірка пройдена, передаємо управління далі
    next();
  };
  
// --- КІНЕЦЬ MIDDLEWARE ---

// --- МАРШРУТИ ДЛЯ РЕСУРСІВ ---

// Всі запити до /documents вимагають лише аутентифікації
app.get('/documents', authMiddleware, (req, res) => {
    res.status(200).json(documents);
  });
  
  app.post('/documents', authMiddleware, (req, res) => {
    const newDocument = req.body;
    newDocument.id = Date.now();
    documents.push(newDocument);
    res.status(201).json(newDocument);
  });
  
  // Запити до /employees вимагають і аутентифікації, і прав адміністратора
  // Зверни увагу на порядок: спочатку auth, потім adminOnly
  app.get('/employees', authMiddleware, adminOnlyMiddleware, (req, res) => {
    res.status(200).json(employees);
  });  

// --- КІНЕЦЬ МАРШРУТІВ ---

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
