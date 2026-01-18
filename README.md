# MyPOS

POS-система для HoReCa — современная альтернатива Poster, iiko, R-Keeper.

## Tech Stack

- **Backend:** Python, FastAPI, PostgreSQL, SQLAlchemy
- **Frontend:** React 19, Vite, TypeScript, Tailwind CSS
- **Offline:** IndexedDB, Service Worker, Background Sync
- **Real-time:** WebSocket
- **Deploy:** Railway

## Интерфейсы

| URL | Описание |
|-----|----------|
| `/pos` | Касса (для планшета кассира) |
| `/admin` | Админка (управление товарами) |
| `/dashboard` | Статистика (для управляющего) |

## Production

- Frontend: https://frontend-production-e1a1.up.railway.app
- Backend: https://backend-production-5eddb.up.railway.app

## Локальная разработка

```bash
# Backend
cd backend
source venv/bin/activate
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

## Документация

- `CLAUDE.md` — контекст для AI-агента (автоматически читается Claude Code)
- `RULES.md` — правила разработки
- `TESTING_GUIDE.md` — гайд по тестированию

## Автор

@muahhidun
