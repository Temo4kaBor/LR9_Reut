const http = require('http');
const EventEmitter = require('events');

class MyFramework {
    constructor() {
        this.emitter = new EventEmitter();
        this.middlewares = [];
        this.server = this._createServer();
    }

    // Регистрация Middleware (промежуточных обработчиков)
    use(middleware) { this.middlewares.push(middleware); }

    // Методы регистрации маршрутов
    get(path, handler) { this.emitter.on(`GET:${path}`, handler); }
    post(path, handler) { this.emitter.on(`POST:${path}`, handler); }
    put(path, handler) { this.emitter.on(`PUT:${path}`, handler); }
    patch(path, handler) { this.emitter.on(`PATCH:${path}`, handler); }
    delete(path, handler) { this.emitter.on(`DELETE:${path}`, handler); }

    _createServer() {
        return http.createServer((req, res) => {
            // Методы ответа
            res.json = (data) => {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data));
            };
            res.status = (code) => {
                res.statusCode = code;
                return res;
            };

            // Сбор данных через Streams
            let body = "";
            req.on("data", (chunk) => { body += chunk.toString(); });

            req.on("end", () => {
                try {
                    // Парсинг тела (аналог body-parser)
                    req.body = body ? JSON.parse(body) : {};
                    
                    // Парсинг URL и Query-параметров
                    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
                    let path = parsedUrl.pathname;

                    // Нормализация пути: убираем слэш в конце, если он есть
                    if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
                    
                    req.query = Object.fromEntries(parsedUrl.searchParams);

                    // Запуск цепочки Middleware
                    let index = 0;
                    const next = () => {
                        if (index < this.middlewares.length) {
                            this.middlewares[index++](req, res, next);
                        } else {
                            const eventName = `${req.method}:${path}`;
                            const emitted = this.emitter.emit(eventName, req, res);
                            if (!emitted) {
                                res.status(404).json({ 
                                    error: "Маршрут не найден", 
                                    details: `Сервер ожидал ${eventName}` 
                                });
                            }
                        }
                    };
                    next();
                } catch (err) {
                    res.status(400).json({ error: "Ошибка парсинга JSON" });
                }
            });
        });
    }

    listen(port, callback) { this.server.listen(port, callback); }
}

module.exports = MyFramework;