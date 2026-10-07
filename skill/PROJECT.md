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
  языконезависим. Дата в `components/ui/date-picker.tsx` — через опциональный проп `locale` (date-fns `ru`/`uz`); без пропа формат остаётся `enUS`. Переключатель языка — `components/LanguageSwitcher.tsx` в `Navbar`;
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
- **`Skeleton` (`components/ui/skeleton.tsx`) невидим на страницах кабинета.** Его `bg-muted` = `210 40% 96%` = `slate-100` = фон `DashboardLayout`. Для скелетонов задавайте цвет полос явно (`bg-slate-200`), как в `Dashboard.tsx` (константа `BAR`), либо правьте токен `--muted` — но он общий для всего приложения.
- **`shift_start`/`shift_end` могут расходиться с `shift_name`.** В ответе `api/attendance/daily` встречается запись с названием «Смена 14:50-23:00» и `shift_start = "15:04:00"`. В таблице Dashboard показываем **числа** (`shift_start`–`shift_end`) как основное значение, название — подписью: расчёт опозданий на бэкенде идёт от чисел. Если расхождение не задумано — вопрос к бэкенду.
- **«Ранний приход» и «ранний уход» считает фронт** (см. журнал 2026-10-07): бэкенд таких полей не отдаёт. Это дублирует бизнес-логику границ смены на клиенте. Если на бэкенде появятся `early_arrival_minutes(_text)` / `early_leave_minutes(_text)` — заменить расчёт `timingDiff` на готовые поля.
- **`uz-Latn` в `Intl`** намеренно не используется (ненадёжная поддержка в браузерах) —
  узбекские даты словами собираются из собственных словарей `months`/`days`.

---

## 7. Журнал изменений

| Дата | Что и зачем | Файлы |
|---|---|---|
| 2026-10-07 | **Dashboard: шапка «Посещаемость за день» — тёмный hero.** Белая карточка заменена на тёмную (`bg-[#0D1117]` — тот же цвет, что у сайдбара, плюс два размытых цветных пятна `blur-3xl` для глубины), чтобы шапка работала якорем страницы и визуально продолжала брендовый тёмный сайдбар. Типографика: иконка-чип календаря + надпись капсом `text-white/35` (как «НАВИГАЦИЯ» в сайдбаре), дата 24px белым, день недели `text-white/40`, «Всего сотрудников» — стеклянная пилюля (`bg-white/[0.06]` + `ring-white/10`). `DatePicker` на тёмном — стеклянный вариант через `className` (`bg-white/[0.06] border-white/10 text-white`), сам компонент не менялся. Полоса распределения стала толще (h-2.5, сегменты `rounded-full` с зазором в дорожке `bg-white/[0.06]`), цвета сегментов подняты до более ярких (`emerald-400/amber-400/rose-400/slate-500`) — на тёмном фоне пастельные не читались. Скелетон шапки тоже переведён на тёмный (`bg-white/10` полосы). | `src/pages/Dashboard.tsx` |
| 2026-10-07 | **Dashboard: редизайн плиток статистики.** Плитки были плоские (иконка + подпись в строку, число, серый процент) — обновлены под остальную страницу: мягкая диагональная подложка цвета статуса (`bg-gradient-to-br from-<color>-50/70 to-white`), иконка-чип 36px `rounded-xl` с `ring-1 ring-inset`, микро-подпись капсом (10px, `tracking-[0.07em]`), число 32px и процент в цветной пилюле по правому краю. Нулевое значение гасится (`text-slate-300` + серая пилюля) — «На выходном: 0» больше не спорит по весу с живыми цифрами. Ховер: подъём карточки (`-translate-y-0.5` + `shadow-md`), цветная рамка по статусу и лёгкое увеличение иконки. Подписи получили `min-h-[25px]` — на узких экранах они переносятся в две строки, и без резерва высоты числа в соседних плитках стояли на разном уровне. Прогресс-баров в плитках намеренно нет: доля статусов уже показана полосой распределения в шапке, дублировать не стали. Проверено в браузере (1500px и узкая колонка). | `src/pages/Dashboard.tsx` |
| 2026-10-07 | **Dashboard: скелетон первой загрузки был невидим.** `components/ui/skeleton.tsx` красится в `bg-muted`, а в `index.css` это `210 40% 96%` — ровно `slate-100`, то есть цвет фона страницы (`DashboardLayout`: `bg-slate-100`). Блоки рендерились, но сливались с фоном, и выглядело это как «лоадера нет». Скелетон переписан по форме страницы (белые карточки: шапка с полосой распределения, 5 плиток, карточка таблицы с 8 строками-заглушками), полосы — `bg-slate-200` через константу `BAR` (`cn` = `twMerge`, поэтому перебивает `bg-muted`). Сам компонент `Skeleton` и токен `--muted` не трогал — они используются всем приложением. | `src/pages/Dashboard.tsx` |
| 2026-10-07 | **Dashboard: чипы отклонений — словом вместо знака.** Знаки `+`/`−` оказались нечитаемыми: один и тот же знак значил разное в колонках прихода и ухода, и направление приходилось расшифровывать. Теперь в чипе короткая метка + значение: «Опоздание 2 мин» (красный), «Позже 5 мин» (серый, в пределах допуска), «Раньше 16 мин» (зелёный, ранний приход), «Овертайм 14 мин» (синий), «Раньше 2 ч 43 мин» (янтарный, ранний уход). Метка приглушена (`font-medium opacity-80`), число жирное и `tabular-nums`. Цвет остаётся вторым слоем подсказки, развёрнутое пояснение — в `title`. Пропсы `Delta`: `sign`/`text` → `label`/`value`. i18n: `dashboard.delta.label{Late,Early,Later,Overtime}` (ru+uz); длинные `delta.*` остались подсказками. `min-w` таблицы 1000 → 1140px (чипы стали шире). | `src/pages/Dashboard.tsx`, `src/i18n/locales/{ru,uz}.ts` |
| 2026-10-07 | **Dashboard: мягкая обработка ошибки загрузки.** Раньше любая неудача запроса поднимала `error` и ранний `return` подменял всю страницу экраном ошибки — даже если на экране уже были нормальные данные. Теперь в `catch`: если `attendanceData` уже есть (смена даты/страницы) — `toast.error(message)` из `sonner`, данные и таблица остаются на месте; если данных ещё нет (первая загрузка) — прежний экран ошибки. Заодно починена кнопка «Попробовать снова»: она вызывала `setSelectedDate(today())`, что при уже выбранной сегодняшней дате не меняло состояние и запрос не повторялся (кнопка была мёртвой в самом частом случае) — добавлен `reloadKey` в состоянии и в зависимостях эффекта. Подсветка страницы в пагинации: `loading ? currentPage : pagination.current_page` — во время запроса показываем кликнутую страницу, после неудачи подсветка возвращается к той, что реально на экране. Проверено в браузере на моке: падение дозагрузки (тост + данные остались) и падение первой загрузки (экран ошибки + рабочий ретрай). | `src/pages/Dashboard.tsx` |
| 2026-10-07 | **Dashboard: мягкая перезагрузка вместо «мигания» страницы.** Раньше любой запрос (смена даты или страницы) поднимал `loading` и ранний `return` подменял всю страницу скелетоном — шапка, плитки и таблица исчезали и появлялись заново. Теперь скелетон показывается только при первой загрузке (`loading && !attendanceData`), а при дозагрузке прошлые данные остаются на месте: таблица приглушается (`opacity-40`) и накрывается оверлеем со спиннером «Загрузка данных...» (`common.loadingData`). Пилюля спиннера — `sticky top-1/2`, чтобы её было видно и когда пагинацию нажали внизу длинной таблицы. `CustomPagination` теперь получает `currentPage` из состояния, а не из `pagination.current_page` ответа — активная страница подсвечивается сразу по клику, не дожидаясь ответа. Высота блока не скачет, скролл не сбрасывается. Проверено в браузере на моке с искусственной задержкой 2.5 с. | `src/pages/Dashboard.tsx` |
| 2026-10-07 | **Dashboard: «Список сотрудников» → таблица с разбором по смене.** По запросу заказчика карточки-строки заменены на таблицу (`components/ui/table`, как в `Users.tsx`: `overflow-x-auto` + `min-w-[1000px]`) с колонками: Сотрудник | Смена (`shift_start`–`shift_end` + название) | Пришёл | Опоздание/раньше | Ушёл | Овертайм/раньше | Статус. **Расчёт отклонений делается на фронте** — бэкенд отдаёт только `late_minutes` и `overtime_minutes`, полей «ранний приход» и «ранний уход» нет. Хелперы `minutesOfDay`/`dayAbsMinutes`/`absMinutes`/`timingDiff` (Dashboard.tsx) считают отклонение в минутах от границ смены по `check_in_datetime`/`check_out_datetime` в UTC-арифметике (`Date.UTC`, без сдвигов TZ); если `shift_end <= shift_start`, конец смены переносится на следующие сутки — ночные смены считаются верно. Правила вывода: опоздание берётся из `late_minutes_text` бэка (там уже вычтен `late_tolerance_minutes`) — красный «+»; приход раньше начала смены — зелёный «−»; приход позже начала, но `late_minutes = 0` (в пределах допуска) — серый «+» с подсказкой; овертайм из `overtime_minutes_text` — синий «+»; уход раньше `shift_end` при `overtime_minutes = 0` — янтарный «−»; нет отметки — «—». i18n: `dashboard.col.*`, `dashboard.delta.*`, `dashboard.hoursOnly/hoursMinutes` (ru+uz); удалены ставшие ненужными `dashboard.checkIn/checkOut/lateShort`. Проверено `tsc --noEmit` + `npm run build` и в браузере на реальном ответе `api/attendance/daily` за 2026-10-07 (все 15 строк сверены вручную). | `src/pages/Dashboard.tsx`, `src/i18n/locales/{ru,uz}.ts` |
| 2026-10-07 | **Dashboard («Посещаемость»): переработан UI.** Причина — пустота в карточке-шапке (она растягивалась на 2 колонки по высоте соседнего блока) и дублирование: блок «По статусам» показывал те же 5 чисел, что и карточки ниже. Сделано: (1) шапка на всю ширину — дата + день недели (`formatWeekday`) + пилюля «Всего сотрудников: N» + DatePicker, под разделителем — одна полоса распределения дня (сегменты `on_time`/`late`/`absent`/`day_off`, знаменатель — сумма этих четырёх, т.е. сотрудники со сменой на этот день; `title` с названием и количеством); (2) блок «По статусам» удалён, его информация ушла в полосу и в плитки; (3) плитки метрик теперь ровно по ключам `statistics` (`present`, `on_time`, `late`, `absent`, `day_off`) — иконка-чип + подпись, крупное число + % от штата; плитка «Все сотрудники» убрана (число в пилюле шапки); (4) список сотрудников — CSS-сетка `md:grid-cols-[minmax(0,1fr)_auto_124px]`, поэтому время и статусы выровнены по колонкам между строками; статус-точка на аватаре, смена — чипом, вход/выход/опоздание с иконками и `tabular-nums`, статус-бейдж `rounded-full`; (5) спиннер загрузки заменён скелетоном по форме страницы; (6) пустой список — иконка + текст. **i18n:** добавлен `dashboard.stat.present`; удалены неиспользуемые `dashboard.byStatus`, `dashboard.employeesCount`, `dashboard.statLabels.*`, `dashboard.stat.allEmployees(Pct)` (ru+uz). **Побочно:** в общий `components/ui/date-picker.tsx` добавлен опциональный проп `locale` (date-fns) — Dashboard передаёт `ru`/`uz`, иначе дата в кнопке оставалась английской («October 7th, 2026»); остальные вызовы DatePicker не затронуты (без пропа поведение прежнее). Логика запросов, пагинация и эндпоинты не менялись. Проверено `tsc --noEmit` + `npm run build`; вид проверен в браузере на мок-данных (сетка 1440px и мобильная 375px) — доступа к реальной учётке в этой сессии нет. | `src/pages/Dashboard.tsx`, `src/components/ui/date-picker.tsx`, `src/i18n/locales/{ru,uz}.ts` |
| 2026-10-07 | **Dashboard («Посещаемость»): убран плейсхолдер «Группа риска» + перекомпоновка верхних блоков.** Убрана нерабочая заглушка «Группа риска» (`dashboard.riskGroup/riskGroupSub`, текст «Скоро...», `dashboard.soon`) вместе с теперь неиспользуемыми i18n-ключами (`riskGroup`, `riskGroupSub`, `soon` в ru+uz). По уточнению заказчика «в один ряд» имелось в виду шапка с датой (`dashboard.dayAttendance`) и блок «По статусам» — перенёс «По статусам» из правой колонки (где он был рядом со списком сотрудников) в ряд с шапкой (`grid md:grid-cols-3`, шапка `col-span-2` + статусы `col-span-1`). Список сотрудников ушёл из грида в отдельный блок на всю ширину ниже карточек-статистики. Порядок секций сверху вниз: шапка+статусы → карточки-статистика → список сотрудников. Проверено `tsc --noEmit`; живым UI не проверял — страница требует логина, в этой сессии нет доступа к учётке. | `src/pages/Dashboard.tsx`, `src/i18n/locales/{ru,uz}.ts` |
| 2026-09-23 | **Health-дэшборд сервера — обновление под новые данные бэкенда.** В `overview` добавлены `system.swap_percent/swap_used_mb/swap_total_mb`, `system.process_count/zombie_count` (счётчики секторов диска `disk_read/write_sectors` намеренно не выводим — сырые, для скорости используем готовый `disk_io.read_kbps/write_kbps`, может быть `null`), `mysql.threads_running/max_connections/connections_percent`. В карточках метрик добавлены: Своп (UsageCard), Диск I/O (StatCard), Процессы/Зомби (StatCard), Соединения MySQL % (UsageCard). Добавлены 5 новых эндпоинтов/секций: **Топ процессов** (`top-processes`, таблицы CPU/RAM по 5), **MySQL — активные запросы** (`mysql-health`: processlist топ-10 + slow query log хвост), **php-fpm** (`fpm-status`: карточки полей ответа, подсветка `max children reached>0`), **Попытки входа** (`auth-attempts?hours=`, селектор 24ч/7дн/30дн, счётчики + топ IP с подсветкой ≥10 попыток + последние 20 неудачных), **Статистика nginx** (`nginx-stats?day=`, date-picker, топ-20 маршрутов и IP). Все 5 новых секций — опциональны (`available:false`/пустые массивы, если на сервере не настроен `.env`) — показываем `message` из ответа, не как ошибку. Автообновление раз в 30с расширено на overview/графики/top-processes/mysql-health/fpm-status; auth-attempts и nginx-stats грузятся только при смене параметра (часы/день) или ручном обновлении — не льём лишние запросы на подстраницы, которые смотрят реже. Проверено `tsc --noEmit` + `npm run build` (живыми данными суперадмина не проверял — нет доступа к учётке суперадмина в этой сессии). | `src/services/data.ts`, `src/pages/Admin/AdminServerHealth.tsx` |
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
