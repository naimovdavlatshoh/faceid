# PROJECT.md — Карта фронтенда FaceID Cloud

> Читать **перед** задачей. Обновлять **после** (правило 8 в `CLAUDE.md`).
> Держать кратко и точно. Дата создания карты: 2026-07-10.

---

## 1. Что это за проект

**FaceID Cloud (frontend)** — SPA-кабинет для SaaS контроля посещаемости через
FaceID-терминалы Hikvision. Это клиент к PHP/Slim-бэкенду (репозиторий
`faceidcloud.uz`): менеджер бизнеса видит сотрудников, смены, должности, авансы,
посещаемость, расчёт ЗП и Excel-выгрузки; суперадмин — управляет объектами,
пользователями, терминалами и т.д.

**Стек:** React 18, TypeScript 5, Vite 5, react-router-dom 6 (`createBrowserRouter`),
TailwindCSS 3, Radix UI + shadcn-style компоненты (`src/components/ui`), axios,
sonner (toast), recharts (графики), @tanstack/react-table, date-fns, react-icons,
lucide-react. Алиас путей `@` → `./src` (см. `vite.config.ts`).

**Скрипты:** `npm run dev` (Vite), `npm run build` (`tsc && vite build`),
`npm run lint` (eslint, max-warnings 0).

---

## 2. Роли и доступ

Авторизация — JWT в `localStorage`. После `POST login` (`src/pages/Auth/Login.tsx`)
кладутся ключи:

| Ключ localStorage | Значение |
|---|---|
| `token` | JWT (Bearer) |
| `object` | id активного объекта |
| `company` | имя/название (firstname) |
| `role_id` | роль: **`"1"` = суперадмин**, иначе менеджер |
| `objects` | JSON всех доступных объектов (`all_objects`) |

Два контура (совпадают с бэкендом):
- **Кабинет клиента** — префикс `/`, гейт `ProtectedRoute` (нужен `token`),
  раскладка `DashboardLayout`.
- **Суперадминка** — префикс `/admin`, гейт `AdminProtectedRoute`
  (нужен `token` **и** `role_id === "1"`), раскладка `AdminLayout`.
  После логина суперадмина редиректит на `/admin`, остальных — на `/`.

---

## 3. Структура кода

```
src/
  main.tsx                 # точка входа (ReactDOM.createRoot)
  App.tsx                  # ThemeProvider + AppRouter + <Toaster/> (sonner)
  router/AppRouter.tsx     # createBrowserRouter: деревья "/" и "/admin"
  services/data.ts         # СЛОЙ API: обёртки над axios (см. §4)
  utils/
    authUtils.ts           # handleAuthError (401/Expired token), isAuthenticated, ...
    formatters.ts          # formatNumber / parseNumber (форматирование сумм)
  contexts/ThemeContext.tsx
  components/
    ProtectedRoute.tsx, AdminProtectedRoute.tsx   # гейты роутов
    ui/                    # shadcn/Radix-компоненты (button, input, card, select,
                           #   custom-modal, searchable-combobox, custom-form, ...)
    admin/AdminTable.tsx, hooks/use-mobile.tsx, AddUserModal.tsx
  layout/                  # DashboardLayout, AdminLayout, Sidebar, AdminSidebar, Navbar
  pages/
    Auth/Login.tsx
    Dashboard.tsx
    Users/       Users, CreateUser, Account, EditUser, EmployeeReport
    Shifts/      Shifts, CreateShift, ShiftDays (+ модалки Add/Edit/Delete/ShiftDays)
    Position/    Positions (+ Add/Update модалки)
    Advances/    Advances, AdvanceFormModal, advancesConstants
    Admin/       AdminDashboard, Objects, AdminUsers, AdminEmployees, AdminTerminals,
                 AdminObjectUsers, AdminObjectTelegram, AdminDetections
```

**Архитектура:** страницы вызывают функции из `services/data.ts` напрямую (нет
глобального стора — состояние локальное в компонентах через `useState/useEffect`).
UI собран из компонентов `components/ui`.

---

## 4. Слой API (`src/services/data.ts`)

`BASE_URL` = `import.meta.env.VITE_BASE_URL` или дефолт `https://apifaceid.ph.town/`.

Обёртки над axios (все добавляют `Authorization: Bearer <token>` из localStorage):

| Функция | Назначение |
|---|---|
| `GetDataSimple(url)` | GET, возвращает `response.data` |
| `PostSimple(url, data)` | POST JSON |
| `PostDataTokenJson(url, data)` | POST JSON (для create/update) |
| `PostDataToken(url, formData)` | POST **multipart/form-data** (загрузка файлов) |
| `DeleteData(url)` | DELETE |
| `GetDataSimpleBlob`, `Download*Excel*` | GET `responseType: blob` (Excel/картинки) |

Плюс типизированные хелперы доменов: Advances (`GetAdvances`/`CreateAdvance`/…),
Payments, Products, Attendance, `DeleteFaceIdUser`, и весь блок `SuperAdmin*`
(CRUD объектов/пользователей/терминалов/employees/object-users/telegram/detections).

**Interceptors (axios, глобально):**
- **response:** при 401 или сообщении «Expired token» → `handleAuthError`
  (`utils/authUtils.ts`): `localStorage.clear()` + редирект на `/login`.
- **request:** блокирует запросы на `avtozapchast.netlify.app` (легаси-предохранитель).

**Расчёт ЗП — v2.** Активные эндпоинты: `api/payroll/v2/report-by-id`,
`api/payroll/v2/excel/report`, `api/payroll/v2/excel/report-by-id`. Старые v1-запросы
оставлены закомментированными «для отката».

---

## 5. Договорённости (conventions)

- **Стиль:** TypeScript, отступ **4 пробела**. Держаться существующего стиля файла.
- **Импорты** — через алиас `@/...` (реже относительные пути в router/layout).
- **Тосты** — `toast` из `sonner` (`toast.success` / `toast.error`), `<Toaster/>`
  подключён один раз в `App.tsx`.
- **Работа с API** — только через функции `services/data.ts`, не дёргать axios
  напрямую из страниц (кроме уже существующих blob-выгрузок).
- **Активный объект** — из `localStorage.getItem("object")`; многие списки требуют
  `?object_id=...`.
- **Загрузка файлов** — `FormData` + `PostDataToken`. Бэкенд принимает jpg/jpeg/png
  ≤ 2 МБ и сам дожимает до ≤720px / ≤200 КБ. Имя файла важно (бэкенд проверяет
  расширение), поле формы — `image`.
- **UI-компоненты** — переиспользовать из `components/ui` (shadcn/Radix), не плодить
  собственные аналоги.
- **Локализация (i18n)** — `react-i18next`. Все тексты кабинета клиента идут через
  `const { t } = useTranslation()` + `t("namespace.key")`; словари —
  `src/i18n/locales/{ru,uz}.ts` (ключи вложены по страницам: `common`, `nav`, `login`,
  `dashboard`, `users`, `createUser`, `account`, `shifts`, `positions`, `advances`,
  `report`, `combobox`, `days`, `months`, ...). **Не хардкодить строки** — добавляй ключ
  в **оба** файла (`uz.ts` типизирован `Resources = typeof ru`, tsc поймает расхождение).
  Разметку внутри текста (жирный `<span>` в подтверждениях удаления) верстать через
  `<Trans i18nKey=... components={{1: <span/>}}/>`. Даты словами — хелперы
  `src/i18n/dateFormat.ts` (`formatFullDate`/`formatDayMonth`/`formatWeekday`): для `ru`
  через `Intl` (`ru-RU`), для `uz` — из словарей `months`/`days` (латиница). Числовые
  даты в таблицах (`toLocaleDateString("ru-RU")` → `dd.mm.yyyy`) не трогаем — формат
  языконезависим. Переключатель языка — `components/LanguageSwitcher.tsx` в `Navbar`;
  выбор хранится в `localStorage["lang"]` (default `ru`). Узбекский — **латиница**.

---

## 6. Открытые вопросы / аномалии

- **`PostDataToken`** (`services/data.ts`) вручную ставит заголовок
  `Content-Type: "multipart/formData"` (нестандартное написание, без boundary).
  Обычно для `FormData` заголовок должен ставить браузер сам. Работает в проде —
  но это потенциально хрупкое место; **не менять без запроса**.
- **Клиентское сжатие фото** пока только в `Users/Account.tsx`
  (`prepareFaceImage`). В `CreateUser`/`EditUser` и `UploadProductImage`
  (`services/data.ts`) сжатия нет — при необходимости вынести в общий util.
- **HEIC (iPhone)** не декодируется `createImageBitmap` в части браузеров →
  пользователь получит toast об ошибке. Опция — `heic2any` (не добавлять без
  согласования).
- **Нет глобального стора** — состояние дублируется по страницам; для сложных
  экранов возможна рассинхронизация. Пока приемлемо.
- **`npm run lint` не работает** — в `.eslintrc.cjs` ссылки `@typescript-eslint/recommended`
  без префикса `plugin:` → eslint падает с «couldn't find the config». Плагин
  `eslint-plugin-react-hooks` в конфиге не подключён, поэтому `exhaustive-deps` не
  проверяется. Реальный гейт качества — `npm run build` (`tsc && vite build`). **Не
  чинил** (вне задачи) — при желании: `plugin:@typescript-eslint/recommended`.
- **i18n — переведён только кабинет клиента.** Суперадминка (`/admin`, `pages/Admin/*`,
  `layout/Admin*`, `components/AddUserModal.tsx`, `components/admin/*`) осталась на
  русском по решению заказчика. Технические `throw new Error(...)` в `prepareFaceImage`
  (`Account.tsx`) не локализованы — уходят только в `console`, в UI не видны.
- **`uz-Latn` в `Intl`** намеренно не используется (ненадёжная поддержка в браузерах) —
  узбекские даты словами собираются из собственных словарей `months`/`days`.

---

## 7. Журнал изменений

| Дата | Что и зачем | Файлы |
|---|---|---|
| 2026-07-23 | **Локализация кабинета клиента (RU + узбекская латиница)** на `react-i18next`. Добавлены зависимости `i18next` + `react-i18next`. Инфраструктура: `src/i18n/index.ts` (init, языки `ru`/`uz`, fallback `ru`, чтение/запись `localStorage["lang"]`), `locales/ru.ts` + `locales/uz.ts` (uz типизирован `Resources = typeof ru`), `dateFormat.ts` (даты словами по языку), `components/LanguageSwitcher.tsx` (глобус RU/UZ в `Navbar`). Все хардкод-строки кабинета вынесены в `t(...)` (страницы Auth/Dashboard/Users/Shifts/Position/Advances + модалки + `layout/Sidebar,Navbar` + `components/ui/searchable-combobox`). Числовые даты в таблицах и `services/data.ts` (только комментарии) не трогали. Проверено сборкой (`tsc && vite build`) и в браузере (переключение RU↔UZ на логине). `/admin` **не** локализован (по решению заказчика). См. §5 (i18n) и §6. | `src/i18n/*`, `src/components/LanguageSwitcher.tsx`, `src/main.tsx`, `src/layout/{Navbar,Sidebar}.tsx`, `src/components/ui/searchable-combobox.tsx`, `src/pages/{Auth/Login,Dashboard,Users/*,Shifts/*,Position/*,Advances/*}`, `package.json` |
| 2026-07-10 | **Клиентское сжатие фото сотрудника** перед загрузкой (разгрузка бэкенда / memory_limit PHP). Добавлена модульная функция `prepareFaceImage`: `createImageBitmap` → даунскейл до 720px по длинной стороне → canvas с белым фоном → подбор качества JPEG 0.9→0.7 до ≤200 КБ → `File("face.jpg", image/jpeg)`. Добавлена защита памяти вкладки: при разрешении > 40 Мпикс — ранний throw (иначе большой исходник может уронить вкладку). В `handleAvatarChange`: лимит исходника 3 МБ → **20 МБ**, сжатие в отдельном try/catch (при ошибке toast + return), в FormData и превью идёт сжатый файл. Подсказка под аватаром обновлена. Эндпоинты не менялись (`uploadimage`/`updateimage`, поле `image`). | `src/pages/Users/Account.tsx` |
| 2026-07-10 | Создана карта фронтенд-проекта (правило 8): стек, роли/localStorage, структура, слой API, договорённости, аномалии. | `skill/PROJECT.md` |
