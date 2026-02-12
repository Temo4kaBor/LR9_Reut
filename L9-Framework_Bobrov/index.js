const MyFramework = require('./framework');
const fs = require('fs');
const app = new MyFramework();
const PORT = 3000;

// Вспомогательные функции для работы с БД
const readDB = (file) => JSON.parse(fs.readFileSync(`./db/${file}.json`, 'utf-8'));
const writeDB = (file, data) => fs.writeFileSync(`./db/${file}.json`, JSON.stringify(data, null, 2));

// 1. Middleware для логирования (обязательно по ТЗ)
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] Запрос: ${req.method} на ${req.url}`);
    next();
});

// --- СУЩНОСТЬ 1: ПОДРАЗДЕЛЕНИЯ (UNITS) ---

// Получить все подразделения
app.get('/units', (req, res) => {
    const data = readDB('units');
    res.status(200).json(data.units);
});

// Получить детали конкретного подразделения (ТОТ САМЫЙ РОУТ)
app.get('/units/detail', (req, res) => {
    const data = readDB('units');
    const id = req.query.id;
    const unit = data.units.find(u => u.id === id);
    
    if (unit) {
        res.status(200).json(unit);
    } else {
        res.status(404).json({ error: "Подразделение не найдено" });
    }
});

// Создать новое подразделение
app.post('/units', (req, res) => {
    const data = readDB('units');
    const newUnit = {
        id: "u" + Date.now(),
        name: req.body.name || "Новое подразделение",
        size: Number(req.body.size) || 0,
        isCombatReady: Boolean(req.body.isCombatReady),
        lastExerciseDate: new Date().toISOString(),
        equipment: req.body.equipment || []
    };
    data.units.push(newUnit);
    writeDB('units', data);
    res.status(201).json(newUnit);
});

// Обновить данные подразделения
app.patch('/units/update', (req, res) => {
    const data = readDB('units');
    const id = req.query.id;
    const index = data.units.findIndex(u => u.id === id);
    
    if (index !== -1) {
        data.units[index] = { ...data.units[index], ...req.body };
        writeDB('units', data);
        res.status(200).json(data.units[index]);
    } else {
        res.status(404).json({ error: "Юнит не найден" });
    }
});

// --- СУЩНОСТЬ 2: ОФИЦЕРЫ (OFFICERS) ---

// Получить список офицеров
app.get('/officers', (req, res) => {
    const data = readDB('officers');
    res.status(200).json(data.officers);
});

// Удалить офицера
app.delete('/officers/delete', (req, res) => {
    let data = readDB('officers');
    const id = req.query.id;
    const initialLength = data.officers.length;
    data.officers = data.officers.filter(o => o.id !== id);
    
    if (data.officers.length < initialLength) {
        writeDB('officers', data);
        res.status(200).json({ message: "Офицер успешно удален" });
    } else {
        res.status(404).json({ error: "Офицер не найден" });
    }
});
// POST /officers - Создать офицера (ЭТОГО РОУТА НЕ ХВАТАЛО)
app.post('/officers', (req, res) => {
    const data = readDB('officers');
    const newOfficer = {
        id: "o" + Date.now(), // Генерируем новый ID
        fullName: req.body.fullName || "Новый офицер", // string
        rankLevel: Number(req.body.rankLevel) || 1,      // number
        onDuty: Boolean(req.body.onDuty),               // boolean
        promotionDate: new Date().toISOString(),        // Date
        medals: req.body.medals || []                   // Array
    };
    data.officers.push(newOfficer);
    writeDB('officers', data);
    res.status(201).json(newOfficer);
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🎖️ Сервер Армии готов к работе на порту ${PORT}`);
});