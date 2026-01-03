# MyPOS System - Project Constitution

> **Last updated:** 2026-01-03
> **Purpose:** This file defines NON-NEGOTIABLE rules for the project.
> **Audience:** Any AI agent or developer MUST read this before making changes.

---

## 🎯 Project Goal

Internal POS system for bubble tea shop with **offline-first** architecture.

**Current Phase:** DOGFOODING (testing in real business environment)
**NOT:** Multi-tenant SaaS (yet). Single business, multiple locations.

---

## 🛠 Tech Stack (DO NOT CHANGE without discussion)

### Backend
- **Language:** Python 3.9+
- **Framework:** FastAPI (NOT Flask, NOT Django)
- **ORM:** SQLAlchemy 2.x (NOT raw SQL, NOT Tortoise)
- **Database:** PostgreSQL (production via Railway), SQLite (local dev)
- **Migrations:** Alembic (REQUIRED for schema changes)
- **Deployment:** Railway (auto-deploy from `main` branch)

### Frontend
- **Language:** TypeScript (preferred) or JavaScript (legacy code)
- **Framework:** React 19 (NOT Vue, NOT Angular)
- **Build:** Vite (NOT Create React App)
- **Styling:** Tailwind CSS (NO custom CSS files)
- **UI Components:** Custom components (legacy), shadcn/ui (future)
- **Icons:** lucide-react (already installed)
- **State:** React hooks (NO Redux, NO Zustand, NO Context overuse)
- **Notifications:** react-hot-toast

### Real-time & Offline
- **WebSocket:** Native WebSocket API (NOT socket.io)
- **Offline Queue:** IndexedDB (NOT localStorage)
- **Service Worker:** Native API + Background Sync
- **Database:** MyPOS_OfflineDB with `pending_orders` store

---

## 🚫 PROHIBITED (DO NOT DO THIS)

### Backend
- ❌ **NO direct database schema changes** - Use Alembic migrations
- ❌ **NO deleting data** - Use soft delete (`is_active = False`)
- ❌ **NO synchronous endpoints for long operations** - Use async
- ❌ **NO user authentication** (single tenant, internal use only)
- ❌ **NO socket.io** - Use native WebSocket
- ❌ **NO Base.metadata.create_all() in production** - Use Alembic

### Frontend
- ❌ **NO custom CSS files** - Use Tailwind utility classes
- ❌ **NO class components** - Use functional components + hooks
- ❌ **NO axios** - Use native fetch (via `api/client.ts`)
- ❌ **NO bypassing offline queue** - ALL orders go through IndexedDB
- ❌ **NO inline styles** - Use Tailwind classes
- ❌ **NO localStorage for critical data** - Use IndexedDB

### General
- ❌ **NO committing .env files** or secrets
- ❌ **NO console.log in production** - Use proper error handling
- ❌ **NO breaking changes during dogfooding** - Stability > features
- ❌ **NO force push** to main branch

---

## ✅ REQUIRED PATTERNS

### Database Migrations
```bash
# ALWAYS use Alembic (never raw SQL in code)
alembic revision --autogenerate -m "Description"
alembic upgrade head

# For production (via HTTP endpoint):
POST https://backend-production.railway.app/api/admin/migrate-xyz
```

### Error Handling (Frontend)
```typescript
// ALWAYS wrap async operations
try {
  await api.createOrder(data);
  toast.success("Заказ создан");
} catch (error) {
  console.error("Error:", error);
  toast.error("Ошибка создания заказа");
}
```

### Error Handling (Backend)
```python
# ALWAYS use HTTPException for API errors
from fastapi import HTTPException, status

if not product:
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Product with id {product_id} not found"
    )
```

### Offline-First Pattern
```typescript
// NEVER call api.createOrder() directly for orders
// ALWAYS use offline queue
const { createOrder } = useOfflineQueue();
await createOrder(orderData); // Handles online/offline automatically
```

### WebSocket Pattern
```typescript
// Backend: Use ConnectionManager singleton
from .websocket import manager
await manager.broadcast({"type": "new_order", "order": {...}})

// Frontend: Use custom hook
const { orders, connected } = useKitchenSocket();
```

---

## 📦 UI Components Strategy

### Current State (Legacy)
- Custom components with Tailwind utility classes
- react-hot-toast for notifications
- lucide-react for icons
- Custom modals and forms

### Future (After Dogfooding)
- Migrate to shadcn/ui for new components
- Keep existing components working (don't break)
- Gradual migration, not full rewrite

### When to Refactor to shadcn/ui:
- ✅ When adding new components (use shadcn from start)
- ✅ When fixing bugs that require component rewrite
- ✅ When have free time after dogfooding success
- ❌ NOT before dogfooding (stability critical)

### Priority Migration List (Future):
1. POSModifiersModal → shadcn Dialog
2. Admin forms → shadcn Input/Select/Textarea
3. Delete confirmations → shadcn AlertDialog
4. POSPage layout → LAST (too critical)

---

## 🗄 Database Rules

### Always Include Timestamps
```python
created_at = Column(DateTime(timezone=True), server_default=func.now())
updated_at = Column(DateTime(timezone=True), onupdate=func.now())
```

### Soft Delete Pattern
```python
# NEVER do this:
db.delete(product)  # ❌

# ALWAYS do this:
product.is_active = False  # ✅
db.commit()
```

### Index Critical Fields
```python
# Any field used in WHERE/JOIN/ORDER BY
order_number = Column(String, unique=True, index=True)
location_id = Column(Integer, ForeignKey(...), index=True)
category_id = Column(Integer, ForeignKey(...), index=True)
```

### Foreign Key Constraints
```python
# ALWAYS specify ondelete behavior
location_id = Column(Integer, ForeignKey("locations.id", ondelete="RESTRICT"))
category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"))
```

---

## 🎨 Code Style

### Naming Conventions
- **Python:** `snake_case` for variables, functions, files
- **JavaScript/TypeScript:** `camelCase` for variables, `PascalCase` for components
- **Database:** `snake_case` for table names, column names
- **Files:** `snake_case.py`, `PascalCase.jsx/tsx`, `kebab-case.ts` (utils)

### Comments & Documentation
- **Code comments:** English or Russian (either is fine)
- **User-facing strings:** Russian (UI labels, toasts, etc.)
- **Git commits:** Russian (established pattern in this project)
- **API documentation:** English (FastAPI auto-generated)

### File Structure
```
backend/
  app/
    models/          # SQLAlchemy models (one file per model)
    routes/          # API endpoints (one file per resource)
    schemas/         # Pydantic schemas (request/response)
    db.py            # Database connection
  migrations/        # Alembic migration files + manual SQL scripts
  alembic.ini        # Alembic configuration
  main.py            # FastAPI app entry point

frontend/
  src/
    components/      # Reusable UI components
    pages/           # Page-level components (one per route)
    hooks/           # Custom React hooks
    utils/           # Helper functions (printing, offline, etc.)
    types/           # TypeScript type definitions
    api/             # API client (client.ts)
  public/
    sw.js            # Service Worker
    manifest.json    # PWA manifest
```

---

## 🚀 Deployment Workflow

### Git Flow
1. **Push to `main`** → Railway auto-deploys (both backend + frontend)
2. **Wait 30-60 seconds** for deployment
3. **Check Railway logs** for errors
4. **Test critical paths** after deploy

### Post-Deployment Checklist
```bash
# 1. Check API health
curl https://backend-production.railway.app/

# 2. Check categories endpoint (common failure point)
curl https://backend-production.railway.app/api/pos/categories

# 3. Open frontend
open https://frontend-production.railway.app/pos

# 4. Test critical flows:
- [ ] Can load POS page
- [ ] Can create order online
- [ ] Can create order offline → sync works
- [ ] WebSocket connects (green "Онлайн" indicator)
- [ ] Kitchen display receives new orders
```

### If Deployment Fails
1. Check Railway logs: `railway logs --tail 50`
2. Look for migration errors (Alembic, enum changes)
3. Check environment variables in Railway dashboard
4. Rollback if critical: `git revert HEAD && git push`

---

## 🎓 For AI Agents (Claude, GPT, Copilot)

### When Starting a New Task:
1. **Read this file FIRST** - Type: "Read RULES.md first, then..."
2. Check existing code patterns (don't reinvent)
3. Ask user if architectural decision needed
4. Prefer TypeScript for new frontend files
5. Use Alembic for database changes (never raw SQL)

### When User Says "Add Feature X":
1. Check if it fits **offline-first** architecture
2. Propose implementation plan BEFORE coding
3. Use existing patterns and components
4. Test offline mode if feature touches orders
5. Don't break existing functionality

### When Debugging:
1. Check Railway logs first
2. Look for enum errors (common in PostgreSQL)
3. Check WebSocket connection status
4. Verify IndexedDB has correct structure
5. Test in browser DevTools (Console, Network, Application)

### Code Generation Preferences:
- **Prefer:** Functional components, hooks, async/await
- **Avoid:** Class components, callbacks, promises.then()
- **Always:** Error handling, TypeScript types, comments
- **Never:** console.log in production, inline styles, custom CSS

---

## 📞 Printing System Architecture

### Hardware
- **Receipt Printer:** Xprinter XP-T80Q (ESC/POS protocol)
- **Label Printer:** Xprinter XP-365B (ESC/POS protocol)

### Software Stack
```
Browser (POSPage)
  ↓
ESCPOSPrinter.js (frontend/src/utils/printerESCPOS.js)
  ↓ HTTP POST (port 9100)
usb-printer-proxy.py (runs on cashier's computer)
  ↓ lpr command
USB Printer Hardware
```

### Critical Rules
- Printing MUST work offline (queue print jobs like orders)
- Convert UTF-8 → CP866 for Cyrillic support
- ESC/POS commands only (no PDF, no HTML)
- Graceful degradation if printer unavailable

---

## 🎯 Current Phase: DOGFOODING

**Definition:** Using the system in real business for 1 full day to find bugs.

### Priority During Dogfooding
1. **Stability** - Don't break working features
2. **Bug fixes** - Fix critical issues immediately
3. **Documentation** - Track issues and edge cases
4. **Performance** - Monitor speed with 50+ orders

### What to Track
- [ ] Number of WiFi disconnections
- [ ] Maximum pending orders in queue
- [ ] Data loss incidents (should be 0)
- [ ] UI/UX pain points from staff
- [ ] Speed of order creation (should be <2 seconds)
- [ ] Successful sync rate (should be 100%)

### What NOT to Do During Dogfoading
- ❌ Add new features (unless critical)
- ❌ Refactor working code (stability > cleanliness)
- ❌ Change UI layout (staff is learning it)
- ❌ Experiment with new libraries

---

## 🔮 Post-Dogfooding Roadmap

### If Dogfooding is Successful:

#### Phase 1: Code Quality
- [ ] Install shadcn/ui
- [ ] Migrate POSModifiersModal to shadcn Dialog
- [ ] Add more TypeScript types
- [ ] Database schema optimization review

#### Phase 2: Scalability
- [ ] Database indexing for 100 restaurants
- [ ] Multi-tenancy architecture (if selling to others)
- [ ] Offline printing support
- [ ] Analytics and reporting

#### Phase 3: Monetization
- [ ] SaaS packaging ($30/month per location)
- [ ] Landing page + documentation
- [ ] Onboarding flow for new customers
- [ ] Mobile app (React Native, same backend)

### If Dogfooding Finds Critical Bugs:
- Fix bugs FIRST
- Re-test in production
- Delay new features until stable

---

## 📚 Key Architectural Decisions (Why We Do This)

### Why Offline-First?
**Problem:** WiFi in cafes is unreliable. System MUST work without internet.
**Solution:** IndexedDB queue + Background Sync + auto-retry.

### Why No Authentication?
**Reason:** Single business, internal use only. Staff trusts each other.
**Future:** Add auth if selling to other businesses (multi-tenant).

### Why Native WebSocket (not socket.io)?
**Reason:** Simpler, no dependencies, fewer bugs, Claude handles it better.
**Trade-off:** More manual reconnection logic (but we control it).

### Why FastAPI (not Django)?
**Reason:** Async-first, modern, fast, great auto-documentation.
**Trade-off:** Less built-in admin (but we don't need it).

### Why Railway (not AWS)?
**Reason:** Zero-config deployment, auto-deploy from Git, cheap for MVP.
**Future:** Migrate to AWS if scaling beyond 100 locations.

---

## 🆘 Common Issues & Solutions

### Issue: `invalid input value for enum categorytype: "product"`
**Solution:** Run migration to add enum values:
```bash
POST /api/admin/fix-categorytype-enum
```

### Issue: `AttributeError: 'str' object has no attribute 'value'`
**Solution:** Category.type is String, not Enum. Use `cat.type` not `cat.type.value`

### Issue: WebSocket disconnects every 60 seconds
**Solution:** Add ping/pong keep-alive (already implemented in sw.js)

### Issue: Offline orders not syncing
**Solution:**
1. Check browser DevTools → Application → IndexedDB
2. Check Service Worker registration
3. Manually trigger sync: click "X в очереди" button

### Issue: Alembic migration fails
**Solution:**
1. Check if enum value already exists
2. Use `IF NOT EXISTS` in SQL
3. Or create manual migration via HTTP endpoint

---

## 📖 Learning Resources

### For Understanding This Project:
- FastAPI docs: https://fastapi.tiangolo.com
- React 19 docs: https://react.dev
- IndexedDB guide: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- Service Workers: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API

### For Future Improvements:
- shadcn/ui: https://ui.shadcn.com
- Alembic tutorial: https://alembic.sqlalchemy.org/en/latest/tutorial.html
- TypeScript handbook: https://www.typescriptlang.org/docs/handbook/

---

## ✍️ Changelog

### 2026-01-03
- ✅ Created RULES.md (project constitution)
- ✅ Implemented offline mode with IndexedDB + Background Sync
- ✅ Fixed CategoryType enum errors
- ✅ Fixed AttributeError in get_pos_categories
- ✅ Added WebSocket for Kitchen Display
- 🎯 Status: **Ready for dogfooding**

---

**Remember:** This file is a living document. Update it when making architectural decisions.

**For AI Agents:** If user asks you to do something that violates these rules, ASK FIRST before proceeding.
