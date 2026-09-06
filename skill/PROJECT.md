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
    Telegram/    TelegramNotifications (самопривязка Telegram менеджером к объекту)
    Admin/       AdminDashboard, Objects, AdminUsers, AdminEmployees, AdminTerminals,
                 AdminTerminalUpload, AdminObjectUsers, AdminObjectTelegram, AdminDetections,
                 AdminServerHealth (health-дэшборд сервера)
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

- **`PostDataToken`** (`services/data.ts`) больше **не** ставит `Content-Type`
  вручную — заголовок с `boundary` формирует браузер автоматически для `FormData`
  (см. журнал 2026-09-03). Ранее жёстко заданный `multipart/formData` без boundary
  ломал парсинг тела на бэкенде (400 Bad Request на загрузке фото).
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
| 2026-09-05 | **Health-дэшборд сервера (суперадмин).** Страница `/admin/server` (`pages/Admin/AdminServerHealth.tsx`) + пункт AdminSidebar «Сервер» (иконка `Activity`). Хелперы: `SuperAdminGetServerOverview` (`GET superadmin/server/overview`), `SuperAdminGetServerMetrics(range=day\|week)` (`.../metrics`), `SuperAdminGetServerBackups` (`.../backups`), `SuperAdminGetServerPhpErrors(lines)` (`.../php-errors`). UI: карточки CPU/RAM/диск (progress + порог 70/90%), load avg, аптайм, размер БД, детекции, MySQL/PHP версии, время снимка; 2 графика recharts (CPU/RAM/диск % и load1) с переключателем 24ч/7дн; список бэкапов (или сообщение при `available:false`); хвост php_errors.log моноширинно с подсветкой Fatal/Error=красный, Warning=жёлтый (селектор 50/100/300 строк). Автообновление обзора+графиков раз в 30с; баннер «cron остановлен», если `server_time - system.created_at > 10 мин`; `system=null` → «ожидание сбора данных». decimal-поля приходят строками → `parseFloat`. Терминалы онлайн/оффлайн тут НЕ дублируем (берутся из `superadmin/dashboard`). Админка русскоязычная. **Побочный эффект:** это первый потребитель `recharts` — main-бандл вырос ~872→1236 КБ (gzip ~256→365). Кодсплита нет (§6), грузится всем. При желании — вынести страницу в `React.lazy`. | `src/services/data.ts`, `src/pages/Admin/AdminServerHealth.tsx`, `src/router/AppRouter.tsx`, `src/layout/AdminSidebar.tsx` |
| 2026-09-05 | **Перезаливка сотрудников на новый терминал — в панели СУПЕРАДМИНА.** Страница `/admin/terminal-upload` (`pages/Admin/AdminTerminalUpload.tsx`) + пункт AdminSidebar «Заливка на терминал» (иконка `MdSync`). Использует существующие `SuperAdminGetObjects/GetTerminals/GetEmployees` (шаги выбор объекта → терминал → сотрудники) + новый хелпер `SuperAdminUploadUserToTerminal(objectId, terminalId, userId)` (`POST superadmin/object/{objectId}/terminal/{terminalId}/upload-user/{userId}`, тело не нужно, ответ `{status:"ok"|"skipped"|"error", message}`; сервер сам создаёт юзера на устройстве и заливает фото, идемпотентно). `object_id` передаётся **явно** (суперадмин не привязан к объекту). UI: выбор объекта → терминал → все активные сотрудники объекта постранично (limit=100) → **последовательная** заливка по одному с live-статусом (⏳/🔵/✅/⚠️ no_photo/❌ error+текст), прогресс-бар, счётчики, «Повторить упавших» (только `error`). Админка русскоязычная (i18n не трогаем). **Изначально ошибочно сделал в кабинете менеджера** (`/terminal-upload`, `api/faceid/...`) — по уточнению заказчика перенесено в суперадмина, менеджерская версия (страница, роут, пункт сайдбара, i18n `nav.terminalUpload`/`terminalUpload.*`, хелперы `GetFaceIdTerminals`/`UploadUserToTerminal`) удалена. | `src/services/data.ts`, `src/pages/Admin/AdminTerminalUpload.tsx`, `src/router/AppRouter.tsx`, `src/layout/AdminSidebar.tsx` |
| 2026-09-05 | **Суперадмин: лимит Telegram-аккаунтов на объект.** Отдельный контур `/superadmin` (не путать с `/api`): `SuperAdminGetObjectTelegramLimit` (`GET superadmin/object-telegram/limit/{id}` → `{object_id, telegram_limit}`), `SuperAdminUpdateObjectTelegramLimit` (`POST` тем же путём, тело `{telegram_limit}`; вал.: целое ≥1 → иначе 422). Лимит **не** входит в модель объекта и не приходит в `GET superadmin/objects` — грузится отдельным GET при открытии редактирования. UI: поле «Лимит Telegram-аккаунтов» в диалоге редактирования объекта (`Objects.tsx`, только в режиме edit, рядом с тумблерами; дефолт 2, мин 1). На Save шлём POST лимита только если поле заполнено и значение изменилось — сбой GET лимита при открытии не блокирует сохранение объекта. Админка русскоязычная (i18n не трогаем). Не путать с `AdminObjectTelegram` (привязка Telegram-**чатов** к объектам — другое). Проверено сборкой. | `src/services/data.ts`, `src/pages/Admin/Objects.tsx` |
| 2026-09-05 | **Самопривязка Telegram менеджером** (общий notify-бот, уведомления о посещаемости). Новая страница `/telegram` (`pages/Telegram/TelegramNotifications.tsx`) + пункт сайдбара `nav.telegram` (иконка `FaTelegramPlane`). API-хелперы: `CreateTelegramBindCode` (`POST api/telegram/bind-code`, 15-мин код), `GetTelegramAccounts` (`GET api/telegram/accounts` → `{limit,used,result}`), `UnbindTelegramAccount` (`POST api/telegram/unbind/{id}`). `object_id`/`user_id` бэк берёт из JWT — в теле/URL не передаём. UI: кнопка «Привязать» (блок при `used>=limit`; 409-лимит показывает текст бэка), модалка с deep_link-кнопкой + копируемым кодом + `expires_at`; таблица аккаунтов со `bot_status` (🟢1/🔴0/⚪null, для 0 — подсказка про Start), отвязка через модалку подтверждения. Показывается **всем** менеджерам (без гейта по флагам объекта — решение заказчика). Даты — нейтральный `dd.mm.yyyy hh:mm` (`fmtDateTime`, парс строки Asia/Tashkent без `Intl`). i18n: `nav.telegram` + namespace `telegram.*` в ru+uz. Проверено сборкой. | `src/services/data.ts`, `src/pages/Telegram/TelegramNotifications.tsx`, `src/router/AppRouter.tsx`, `src/layout/Sidebar.tsx`, `src/i18n/locales/{ru,uz}.ts` |
| 2026-09-03 | **Архивация сотрудников.** Хелперы `ArchiveFaceIdUser`/`RestoreFaceIdUser` (`POST api/faceid/user/{archive,restore}/{id}`, тело не нужно; операции снимают/заливают лицо на терминалы — при оффлайне вернут ошибку). В `Users.tsx`: переключатель вкладок «Активные/Архив» (`is_archive=0/1` в `api/faceid/users/list`), в меню строки — «В архив» (актив) / «Восстановить» (архив), модалка подтверждения (архив=amber, restore=blue). Поиск скрыт на вкладке «Архив» (эндпоинт `user/search` не документирован для `is_archive` — не гадаем). Архив ≠ удаление (удаление осталось отдельным пунктом). При переключении вкладки сбрасываются поиск/страница/выбор. i18n `users.{tabActive,tabArchive,archive,restore,archiving,restoring,archived,restored,archiveError,restoreError,archiveFail,restoreFail,archiveTitle,restoreTitle,archiveConfirm,restoreConfirm}` в ru+uz. Проверено сборкой. | `src/services/data.ts`, `src/pages/Users/Users.tsx`, `src/i18n/locales/{ru,uz}.ts` |
| 2026-09-03 | **Удаление фото лица сотрудника.** Новый API-хелпер `DeleteFaceImage(userId)` → `POST api/faceid/user/deleteimage/{id}` (через `PostSimple`, тело не нужно — объект из JWT; снимает лицо с терминалов Hikvision/ISUP, из БД и файлы с сервера). В `Account.tsx`: кнопка «Удалить фото» (видна только при `hasExistingImage`) + модалка подтверждения; при успехе сбрасываем аватар на `/avatar-1.webp` и `hasExistingImage=false`. i18n-ключи `account.{deletePhoto,deletingPhoto,photoDeleted,photoDeleteFail,deletePhotoTitle,deletePhotoConfirm}` в `ru.ts`+`uz.ts`. Доступ на бэке — Директор/Менеджер. Проверено сборкой. | `src/services/data.ts`, `src/pages/Users/Account.tsx`, `src/i18n/locales/{ru,uz}.ts` |
| 2026-09-03 | **Фикс 400 Bad Request при загрузке фото сотрудника.** В `PostDataToken` был жёстко задан `Content-Type: "multipart/formData"` — без `boundary`, из-за чего бэкенд не мог распарсить multipart-тело и `$_FILES['image']` был пустым → 400. Убрали ручной заголовок: для `FormData` браузер сам ставит `multipart/form-data; boundary=...`. Затрагивает обе загрузки (`Account.tsx` — фото сотрудника, `UploadProductImage`). См. §6. | `src/services/data.ts` |
| 2026-07-23 | **Локализация кабинета клиента (RU + узбекская латиница)** на `react-i18next`. Добавлены зависимости `i18next` + `react-i18next`. Инфраструктура: `src/i18n/index.ts` (init, языки `ru`/`uz`, fallback `ru`, чтение/запись `localStorage["lang"]`), `locales/ru.ts` + `locales/uz.ts` (uz типизирован `Resources = typeof ru`), `dateFormat.ts` (даты словами по языку), `components/LanguageSwitcher.tsx` (глобус RU/UZ в `Navbar`). Все хардкод-строки кабинета вынесены в `t(...)` (страницы Auth/Dashboard/Users/Shifts/Position/Advances + модалки + `layout/Sidebar,Navbar` + `components/ui/searchable-combobox`). Числовые даты в таблицах и `services/data.ts` (только комментарии) не трогали. Проверено сборкой (`tsc && vite build`) и в браузере (переключение RU↔UZ на логине). `/admin` **не** локализован (по решению заказчика). См. §5 (i18n) и §6. | `src/i18n/*`, `src/components/LanguageSwitcher.tsx`, `src/main.tsx`, `src/layout/{Navbar,Sidebar}.tsx`, `src/components/ui/searchable-combobox.tsx`, `src/pages/{Auth/Login,Dashboard,Users/*,Shifts/*,Position/*,Advances/*}`, `package.json` |
| 2026-07-10 | **Клиентское сжатие фото сотрудника** перед загрузкой (разгрузка бэкенда / memory_limit PHP). Добавлена модульная функция `prepareFaceImage`: `createImageBitmap` → даунскейл до 720px по длинной стороне → canvas с белым фоном → подбор качества JPEG 0.9→0.7 до ≤200 КБ → `File("face.jpg", image/jpeg)`. Добавлена защита памяти вкладки: при разрешении > 40 Мпикс — ранний throw (иначе большой исходник может уронить вкладку). В `handleAvatarChange`: лимит исходника 3 МБ → **20 МБ**, сжатие в отдельном try/catch (при ошибке toast + return), в FormData и превью идёт сжатый файл. Подсказка под аватаром обновлена. Эндпоинты не менялись (`uploadimage`/`updateimage`, поле `image`). | `src/pages/Users/Account.tsx` |
| 2026-07-10 | Создана карта фронтенд-проекта (правило 8): стек, роли/localStorage, структура, слой API, договорённости, аномалии. | `skill/PROJECT.md` |
