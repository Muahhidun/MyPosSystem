# 🎨 Design System — MyPOS

> **Цель:** Создать современный, технологичный и юзабельный интерфейс, который выглядит лучше конкурентов и доставляет удовольствие в использовании.

---

## 📐 Дизайн-референс

Используем стилистику из Stitch (macOS-like UI):
- Glass morphism (размытие, полупрозрачность)
- Мягкие тени и hover-эффекты
- Gradient акценты для AI-функций
- Чистая типографика Inter

---

## 🎨 Цветовая палитра

### Primary (Teal)
```css
primary:        #1f6b7a   /* Основной цвет */
primary-hover:  #164d58   /* Hover состояние */
primary-light:  #e0f2f4   /* Фоны, бейджи */
```

### AI Accent (Purple)
```css
ai-accent:      #8b5cf6   /* Фиолетовый для AI-фич */
ai-light:       #ede9fe   /* Фон AI-элементов */
```

### Backgrounds
```css
background-light: #f5f5f7   /* macOS-like светло-серый */
background-dark:  #1e1e1e   /* Dark mode */
surface:          #ffffff   /* Карточки, панели */
glass-bg:         rgba(245, 245, 247, 0.75)  /* Полупрозрачный сайдбар */
```

### Text
```css
text-primary:   #1e293b   /* slate-800 */
text-secondary: #64748b   /* slate-500 */
text-muted:     #94a3b8   /* slate-400 */
```

### Status
```css
success:  #22c55e   /* green-500 */
warning:  #f59e0b   /* amber-500 */
error:    #ef4444   /* red-500 */
```

---

## 🔤 Типографика

### Шрифт
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Размеры
| Элемент | Size | Weight | Line Height |
|---------|------|--------|-------------|
| H1 (Page title) | 30px (text-3xl) | 700 (bold) | 1.2 |
| H2 (Section) | 20px (text-xl) | 600 (semibold) | 1.3 |
| H3 (Card title) | 16px (text-base) | 600 (semibold) | 1.4 |
| Body | 14px (text-sm) | 400 (normal) | 1.5 |
| Small | 12px (text-xs) | 500 (medium) | 1.4 |
| Micro | 10px (text-[10px]) | 600 (semibold) | 1.3 |

---

## 📦 Компоненты

### Сайдбар (Glass Panel)
```css
width: 280px
background: rgba(245, 245, 247, 0.75)
backdrop-filter: blur(24px)
border-right: 1px solid rgba(0, 0, 0, 0.05)
```

**Структура навигации:**
```
┌─────────────────────────────┐
│ 🔲 MyPOS              Pro   │  ← Logo + Badge
├─────────────────────────────┤
│                             │
│ ── OPERATIONS ──────────    │  ← Group label (uppercase, 11px)
│ 📊 Dashboard                │
│ 💳 POS Terminal      ●      │  ← Active item (with dot)
│ 🍳 KitchenKit               │
│                             │
│ ── CATALOG ─────────────    │
│ 📦 Товары                   │
│ 📋 Техкарты                 │
│ 🥬 Ингредиенты              │
│                             │
│ ── AI CONTROL ──────────    │  ← Purple AI accent
│ 🤖 Smart Assistant    ✨     │
│ 📈 Analytics                │
│                             │
│ ── SETTINGS ────────────    │
│ ⚙️ Настройки                │
│                             │
├─────────────────────────────┤
│ 👤 Admin                    │  ← User profile
│    Управляющий              │
└─────────────────────────────┘
```

### Header (Top Bar)
```css
height: 64px (h-16)
background: rgba(245, 245, 247, 0.8)
backdrop-filter: blur(12px)
border-bottom: 1px solid rgba(0, 0, 0, 0.05)
```

**Содержимое:**
- Слева: Search bar (⌘K shortcut)
- Справа: Notifications bell + Action button

### Карточки
```css
background: #ffffff
border-radius: 12px (rounded-xl)
border: 1px solid rgba(0, 0, 0, 0.05)
box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05)
```

**Hover состояние:**
```css
box-shadow: 0 0 15px rgba(31, 107, 122, 0.15)  /* glow effect */
transform: translateY(-2px)
```

### Кнопки

**Primary:**
```css
background: #1f6b7a
color: white
border-radius: 8px
padding: 8px 16px
font-weight: 500
hover: #164d58
```

**Secondary:**
```css
background: white
border: 1px solid #e2e8f0
color: #1f6b7a
hover: background #f8fafc
```

**AI Button (с градиентом):**
```css
background: linear-gradient(135deg, #1f6b7a 0%, #8b5cf6 100%)
color: white
```

### Badges / Chips
```css
padding: 4px 8px
border-radius: 6px
font-size: 10px
font-weight: 600
text-transform: uppercase
```

| Type | Background | Text |
|------|------------|------|
| Default | slate-100 | slate-700 |
| Primary | primary/10 | primary |
| AI | purple-50 | purple-700 |
| Success | green-50 | green-700 |
| Warning | amber-50 | amber-700 |

---

## 🖼️ Иконки

**Библиотека:** Material Symbols Outlined (Google)
```html
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1" rel="stylesheet" />
```

**Альтернатива (уже используется):** Lucide React
```jsx
import { Settings, ShoppingBag, ChefHat } from 'lucide-react';
```

**Размеры:**
- Navigation: 20px
- Buttons: 16px
- Inline: 14px

---

## 🌗 Dark Mode

Поддержка через Tailwind `dark:` классы:

```css
/* Light */
background-light: #f5f5f7
surface: #ffffff
text: #1e293b

/* Dark */
background-dark: #1e1e1e
surface: #252525
text: #f1f5f9
```

---

## 📱 Responsive Breakpoints

| Name | Width | Use Case |
|------|-------|----------|
| sm | 640px | Mobile landscape |
| md | 768px | Tablet portrait |
| lg | 1024px | Tablet landscape / Small laptop |
| xl | 1280px | Desktop |
| 2xl | 1536px | Large desktop |

**POS оптимизирован для:**
- iPad Air: 1180 x 820
- iPad Pro 11": 1194 x 834
- iPad Pro 12.9": 1366 x 1024

---

## 🎭 Анимации

```css
/* Transitions */
transition-colors: 150ms ease
transition-all: 300ms ease
transition-transform: 700ms ease  /* для hover scale эффектов */

/* Hover scale */
hover:scale-105  /* карточки */
hover:scale-110  /* иконки */
```

---

## 📁 Структура файлов (после редизайна)

```
frontend/src/
├── components/
│   ├── layout/
│   │   ├── AppShell.jsx        ← Главный layout wrapper
│   │   ├── Sidebar.jsx         ← Glass panel сайдбар
│   │   ├── Header.jsx          ← Top bar с поиском
│   │   └── NavigationGroup.jsx ← Группа навигации
│   ├── ui/
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Select.jsx
│   │   ├── Card.jsx            ← NEW
│   │   ├── Badge.jsx           ← NEW
│   │   └── SearchBar.jsx       ← NEW
│   └── ...
├── styles/
│   └── glass.css               ← Glass morphism стили
└── ...
```

---

## 🚀 Приоритет редизайна

### Phase 1: Foundation (текущая задача)
1. ✅ Создать DESIGN_SYSTEM.md
2. ⬜ Обновить tailwind.config.js с новыми цветами
3. ⬜ Создать AppShell.jsx с glass сайдбаром
4. ⬜ Обновить AdminLayout использовать AppShell
5. ⬜ Добавить glass стили в index.css

### Phase 2: Admin Pages
6. ⬜ Применить новый layout к ProductsPage
7. ⬜ Обновить карточки и таблицы
8. ⬜ Добавить SearchBar компонент

### Phase 3: POS Page
9. ⬜ Редизайн POSPage с новой стилистикой
10. ⬜ Обновить карточки товаров
11. ⬜ Редизайн корзины

### Phase 4: Polish
12. ⬜ Dark mode toggle
13. ⬜ Анимации и микро-интеракции
14. ⬜ AI-элементы (градиенты, акценты)

---

## 🔮 Будущее видение продукта

MyPOS — это не просто касса, а экосистема для HoReCa в Казахстане:

```
┌─────────────────────────────────────────────────────────────┐
│                      MYPOS ECOSYSTEM                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🏭 ПОСТАВЩИКИ          🏪 ТОЧКИ ПИТАНИЯ        👤 КЛИЕНТЫ │
│  ├─ Каталог товаров     ├─ POS Terminal         ├─ App     │
│  ├─ Заявки на закуп     ├─ KitchenKit           ├─ Заказы  │
│  ├─ Накладные           ├─ Inventory            └─ Loyalty │
│  └─ Аналитика           ├─ Analytics                       │
│                         └─ AI Recommendations               │
│                                                             │
│  🤖 AI LAYER                                                │
│  ├─ Рекомендации по закупу                                  │
│  ├─ Прогнозирование спроса                                  │
│  ├─ PnL отчёты                                              │
│  ├─ Risk Alerts                                             │
│  └─ Chat Assistant                                          │
│                                                             │
│  🚚 ДОСТАВКА                                                │
│  ├─ Курьерское приложение                                   │
│  ├─ Трекинг заказов                                         │
│  └─ Агрегатор (типа Glovo/Wolt)                            │
│                                                             │
│  💳 ИНТЕГРАЦИИ                                              │
│  ├─ Kaspi Pay                                               │
│  ├─ Halyk Bank                                              │
│  ├─ Freedom Pay                                             │
│  └─ ОФД (фискализация)                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Монетизация:**
- Подписка для точек питания (тарифы)
- Подписка для поставщиков
- Комиссия с продаж (если разрешено)
- Реклама поставщиков в терминалах

---

## 📞 Контакты

**Владелец:** @muahhidun (Telegram)
**WhatsApp:** +77071272789
**Проект:** WeДrink (первая точка для dogfooding)

---

*Последнее обновление: 18 января 2026*
