# Эксплуатация

## Запуск (Stage 0)

```bash
cp .env.example .env
docker compose up --build
```

- API: http://localhost:8000/health, http://localhost:8000/ready
- Web: http://localhost:3000
- Docs: http://localhost:8001

`make demo` (миграции + seed + демо-данные) появится в Stage 6.

## Проверка чистоты проекта

```bash
make check-clean
```

Ищет совпадения из `.stopwords.local` по рабочему дереву (кроме
`node_modules`, `.git`, lock-файлов).
