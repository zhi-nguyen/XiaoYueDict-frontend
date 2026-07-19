# XiaoYueDict - Frontend

Next.js 14 · React 18 · TypeScript · Zustand · Tailwind CSS

<p align="left">
  <img src="https://img.shields.io/badge/Next.js-14-000000?style=flat-square&logo=next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-5.4-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Zustand-5.0-6D4C41?style=flat-square" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Vercel-Deploy-000?style=flat-square&logo=vercel&logoColor=white" />
</p>

---

## Statistics

| Metric | Value |
|---|---|
| **Source files** | **203 files** |
| TypeScript (.ts) | 77 files |
| React TSX (.tsx) | 125 files |
| CSS | 1 file |
| Pages (App Router) | 18 routes |
| Components | 32 (23 top-level + 9 subdirectories) |
| Custom Hooks | 12 |
| Zustand Stores | 11 |
| API Route Handlers | 13 BFF proxy routes |
| Total Commits | 125 |

---

## Architecture

### App Router Structure

```
src/
├── app/
│   ├── layout.tsx                    # Root layout (Sidebar, Header, Footer)
│   ├── globals.css                   # Design tokens & custom CSS
│   ├── robots.ts                     # SEO robots config
│   │
│   ├── [lang]/                       # i18n dynamic segment (zh | en)
│   │   ├── page.tsx                  #    Home / Landing
│   │   ├── dashboard/                #    Dashboard (stats, heatmap, charts)
│   │   ├── study/                    #    Dictionary search + Word Cards
│   │   ├── exam/                     #    HSK/IELTS exam practice
│   │   │   └── take/[examId]/        #    Take exam (audio player, timer)
│   │   ├── notes/                    #    Vocabulary notebooks
│   │   ├── speaking/                 #    Pronunciation practice
│   │   ├── writing/                  #    Hanzi strokes writing practice
│   │   ├── translate/                #    Text translation
│   │   ├── ai-chat/                  #    AI Tutor chat (XiaoYue personas)
│   │   ├── community/               #    Community forum & discussions
│   │   │   └── post/[postId]         #    Post detail & comment threads
│   │   ├── community-rules/          #    Community guidelines
│   │   ├── shop/                     #    Virtual item shop
│   │   ├── pricing/                  #    Subscription pricing page
│   │   ├── profile/                  #    User profile & billing settings
│   │   ├── support/                  #    Help & support center
│   │   ├── about/                    #    About page
│   │   ├── privacy/                  #    Privacy policy
│   │   └── terms/                    #    Terms of service
│   │
│   ├── api/                          # BFF Proxy Routes (Next.js API)
│   │   ├── auth/[...path]/           #    -> Django /api/v1/users/
│   │   ├── core/[...path]/           #    -> Django /api/v1/*
│   │   ├── dictionary/[...path]/     #    -> Django /api/v1/dictionary/
│   │   ├── assessments/[...path]/    #    -> Django /api/v1/assessments/
│   │   ├── exams/[...path]/          #    -> Django /api/v1/exams/
│   │   ├── notes/[...path]/          #    -> Django /api/v1/notes/
│   │   ├── gamification/[...path]/   #    -> Django /api/v1/gamification/
│   │   ├── subscriptions/[...path]/  #    -> Django /api/v1/subscriptions/
│   │   ├── notifications/[...path]/  #    -> Django /api/v1/notifications/
│   │   ├── users/[...path]/          #    -> Django /api/v1/users/
│   │   ├── score/[...path]/          #    -> AI scoring services
│   │   ├── image/[...path]/          #    -> Image service proxy
│   │   └── tts/                      #    -> TTS service proxy
│   │
│   ├── media/                        # Static media routes
│   └── profile/                      # Profile redirect route
│
├── components/                       # React Components
│   ├── Header.tsx                    #    Navigation, language switch, auth
│   ├── Sidebar.tsx                   #    App navigation, settings access
│   ├── Footer.tsx                    #    Copyright, links
│   ├── SettingsPanel.tsx             #    Voice selection, exam audio config
│   ├── NotificationPanel.tsx         #    Real-time notification center
│   ├── LevelProgressBar.tsx          #    XP & level progress display
│   │
│   ├── WordCardZh.tsx                #    Chinese word detail card
│   ├── WordCardEn.tsx                #    English word detail card
│   ├── PracticeHub.tsx               #    Speaking/Writing practice panel
│   ├── HanziStrokeBox.tsx            #    Hanzi stroke animation (hanzi-writer)
│   ├── ScoreDisplay.tsx              #    Pronunciation score visualization
│   ├── ScoreResultModal.tsx          #    Score result overlay
│   ├── ScoringTest.tsx               #    Scoring test interface
│   ├── AudioRecorder.tsx             #    Audio recording with waveform
│   ├── AudioWaveform.tsx             #    Real-time audio waveform
│   ├── SmartQueueStatus.tsx          #    Async task queue status
│   ├── PaymentQRModal.tsx            #    SePay QR payment modal
│   ├── ReportModal.tsx               #    Content report modal
│   ├── AlertModal.tsx                #    Alert dialog
│   ├── ConfirmModal.tsx              #    Confirmation dialog
│   ├── ToastContainer.tsx            #    Toast notification system
│   ├── ScrollToTop.tsx               #    Scroll to top button
│   ├── UserAvatarContainer.tsx       #    User avatar with level badge
│   │
│   ├── study/                        #    Study page components
│   │   ├── StudyClient.tsx           #    Main study orchestrator
│   │   ├── VocabularyTab.tsx         #    Word list + sentence detection
│   │   ├── HanziiTab.tsx             #    Chinese character breakdown
│   │   ├── TranslationCard.tsx       #    AI translation display
│   │   ├── ExampleList.tsx           #    Usage examples
│   │   └── SearchBar.tsx             #    Smart search with debounce
│   │
│   ├── dictionary/                   #    Dictionary UI components
│   │   ├── SpeakerIcon.tsx           #    TTS play button
│   │   ├── VocabularyImage.tsx       #    AI-generated word image
│   │   ├── PinyinDisplay.tsx         #    Pinyin rendering
│   │   └── HanVietDisplay.tsx        #    Han-Viet annotation
│   │
│   ├── community/                    #    Community components
│   │   ├── ForumFeed.tsx             #    Forum post feed
│   │   ├── PostCard.tsx              #    Individual post card
│   │   ├── PostDetail.tsx            #    Full post view
│   │   ├── PostCommentSection.tsx    #    Post comment threads
│   │   ├── WordCommentSection.tsx    #    Per-word comment section
│   │   ├── CreatePostModal.tsx       #    New post creation
│   │   ├── CommunityReportModal.tsx  #    Community content report
│   │   ├── LeaderboardPanel.tsx      #    Sidebar leaderboard widget
│   │   └── LeaderboardTable.tsx      #    Full leaderboard rankings
│   │
│   ├── dashboard/                    #    Dashboard visualizations
│   ├── notes/                        #    Notebook editor
│   ├── profile/                      #    Profile & subscription tabs
│   ├── speaking/                     #    Speaking practice components
│   ├── auth/                         #    Auth modal (Firebase)
│   └── home/                         #    Landing page sections
│
├── hooks/                            # Custom Hooks
│   ├── useStudySearch.ts             #    Dictionary search + caching
│   ├── useWebSocket.ts               #    WS connection management
│   ├── useNotificationWebSocket.ts   #    Notification-specific WS
│   ├── useSmartQueue.ts              #    Async task queue manager
│   ├── useAudioRecording.ts          #    MediaRecorder abstraction
│   ├── usePronunciationScorer.ts     #    AI scoring orchestration
│   ├── useAzureSpeech.ts             #    Azure Speech SDK integration
│   ├── useHanziDetails.ts            #    Hanzi data fetching
│   ├── useHanVietSentence.ts         #    Han-Viet sentence mapping
│   ├── useHandwritingRecognition.ts  #    Handwriting recognition
│   ├── useSpellCheck.ts              #    Real-time spell checking
│   └── useDebounce.ts                #    Debounce utility
│
├── store/                            # Zustand State Management
│   ├── useAuthStore.ts               #    Firebase auth state
│   ├── useAudioStore.ts              #    Global audio playback
│   ├── useSettingsStore.ts           #    Voice & exam settings (persisted)
│   ├── useSubscriptionStore.ts       #    Subscription tier & usage
│   ├── useGamificationStore.ts       #    Streaks, XP, heatmap
│   ├── useCoinStore.ts               #    Coin wallet & transactions
│   ├── useCommunityStore.ts          #    Forum posts, comments, votes
│   ├── useNotificationStore.ts       #    Notification list & unread count
│   ├── useLanguageStore.ts           #    zh/en language toggle
│   ├── useHanziCacheStore.ts         #    Hanzi character detail cache
│   └── useUIStore.ts                 #    Sidebar, settings panel state
│
├── lib/                              # Utilities & API Clients
│   ├── apiClient.ts                  #    Axios instances (Django + BFF)
│   ├── firebase.ts                   #    Firebase app init
│   ├── serverAuth.ts                 #    Server-side auth helpers
│   ├── zhUtils.ts                    #    Chinese text utilities + TTS
│   ├── inputValidation.ts            #    Input sanitization
│   ├── subscriptionUtils.ts          #    Tier limit helpers
│   ├── dashboardUtils.ts             #    Dashboard data transforms
│   ├── examState.ts                  #    Exam progress persistence
│   ├── scoreResultCache.ts           #    Score result caching
│   ├── errorHelper.ts                #    Centralized error handler
│   ├── mediaUtils.ts                 #    Media upload helpers
│   ├── guest.ts                      #    Guest ID management
│   ├── audioUtils.ts                 #    Audio format helpers
│   └── api/                          #    Feature-specific API clients
│       ├── proxy.ts                  #    BFF proxy helper
│       ├── subscriptions.ts          #    Subscription API
│       ├── notes.ts                  #    Notes API
│       ├── exams.ts                  #    Exams API
│       ├── gamification.ts           #    Gamification API
│       ├── coins.ts                  #    Coin wallet API
│       ├── community.ts              #    Community forum API
│       ├── deepPractice.ts           #    Deep practice API
│       ├── reports.ts                #    Reports API
│       ├── support.ts                #    Support API
│       └── users.ts                  #    Users API
│
├── types/                            # TypeScript Interfaces
│   ├── dictionary.ts                 #    ZhWord, EnWord types
│   ├── exam.ts                       #    Exam, ExamQuestion types
│   ├── note.ts                       #    Notebook, NoteWord types
│   ├── scoring.ts                    #    ScoreResult types
│   └── queueUi.ts                    #    Queue status types
│
├── constants/                        # Constants
├── context/                          # React context providers
├── data/                             # Static data files
└── middleware.ts                     # Next.js middleware (i18n routing)
```

---

## Core Features

### 1. Dictionary & Search

```
SearchBar -> useStudySearch -> BFF /api/dictionary -> Django API
    │                                                    │
    ▼                                                    ▼
VocabularyTab (Word/sentence detection)             Full-text search
    │                                               (jieba + trigram)
    ▼
WordCardZh / WordCardEn
    ├── PinyinDisplay + HanVietDisplay
    ├── VocabularyImage (AI-generated)
    ├── SpeakerIcon (TTS playback)
    ├── WordCommentSection (Community)
    └── Examples + Practice button
```

- **Smart Detection**: Detects word search vs. full sentence translations dynamically.
- **Cross-language Image Bridge**: Shared images using `ZhEnMapping`.
- **Real-time Image Rendering**: WebSockets deliver generated images dynamically.
- **TTS Cache**: Client-side TTS audio caching via standard Cache API.

### 2. AI Pronunciation Scoring

```
AudioRecorder -> useAudioRecording -> MediaRecorder API
    │
    ▼
usePronunciationScorer -> useSmartQueue
    │
    ▼
BFF /api/assessments -> Django -> Celery -> AI Service (GPU)
                                                 │
                                                 ▼
WebSocket <- Redis PubSub <- Celery Task Result
    │
    ▼
ScoreDisplay (word-level + phoneme-level scores)
```

### 3. AI Chat (XiaoYue Tutor)

```
AI Chat Page -> Persona Selection -> WebSocket Stream
    │
    ▼
Custom AI Persona (personality, emotional state, context)
    │
    ▼
ai-chat-service -> Gemini 2.5 Flash -> Streaming Response
    │
    ▼
RAG Memory System (pgvector) + Periodic Summarization
```

- **Custom Personas**: Users create AI tutors with personality types and emotional states.
- **Streaming Responses**: Real-time token streaming via WebSocket.
- **Memory System**: Long-term chat memory via RAG (pgvector embeddings).
- **Coin-based**: Chat interactions cost coins (configurable per tier).

### 4. Community Forum & Leaderboard

```
ForumFeed -> PostCard -> PostDetail
    │           │            │
    ▼           ▼            ▼
CreatePost  Upvote/     PostCommentSection
            Downvote    WordCommentSection
                │
                ▼
        LeaderboardPanel -> LeaderboardTable
        (coin, streak, likes, weekly words)
```

- **Word Comments**: Per-word community discussions with voting.
- **Forum Posts**: Create discussion threads with image uploads.
- **5 Leaderboard Types**: Coin (paid/free), total likes, weekly words, max streak.
- **Community Guidelines**: Built-in rules page.

### 5. Gamification & Coin Economy

```
StudySession -> FlashcardExercise -> Memorize Cards
    │                                      │
    ▼                                      ▼
CoinWallet (paid + free + shop balance)   XP & Level Up
    │                                      │
    ▼                                      ▼
Shop -> Purchase items              LevelProgressBar
        with shop currency
```

- **Dual Currency**: Paid coins (refill weekly) + free coins (earned from studying).
- **Shop System**: Purchase virtual items with shop balance.
- **Leveling**: XP-based progression with level badges.
- **Daily Targets**: Configurable word/duration goals.

### 6. Exam Practice (HSK/IELTS)

- Audio speed and volume controller (centralized `useSettingsStore`).
- **Segment Playback**: Listens to targeted paragraphs bound to specific questions.
- **Auto-save**: Persists test progress in LocalStorage.
- **Timer & Auto-submit**: Prevents cheating or running out of time.

### 7. Real-time Notifications

```
useNotificationWebSocket -> WebSocket -> ws_gateway -> Redis PubSub
    │
    ▼
useNotificationStore -> NotificationPanel
    │
    ▼
Toast + Badge count + Sound alert
```

### 8. Payments & Billing

```
PricingPage -> handleAction -> BFF /api/subscriptions
    │
    ▼
PaymentQRModal (Automated SePay dynamic QR)
    │ Webhook Callback
    ▼
Django -> PaymentOrder -> WebSocket Notification
    │
    ▼
useSubscriptionStore.refresh() -> Active tier updated
```

---

## Design System

### Color Tokens (CSS Variables)

```css
--color-bg:           #f1f5f9   /* Content background */
--color-surface:      #ffffff   /* Card surfaces */
--color-primary:      #334155   /* Primary text/actions */
--color-secondary:    #64748b   /* Secondary text */
--color-accent:       #f43f5e   /* Accent (Chinese theme) */
--color-sage:         #6b8e72   /* Sage green (Plus tier) */
--color-hover-bg:     #e2e8f0   /* Hover states */
--color-outline:      #e2e8f0   /* Borders */
```

### Typography

- **Lexend** - Primary UI font family (Google Fonts)
- **Material Symbols Outlined** - Icon system

### Shared Component Patterns

- **Modals**: `AlertModal`, `ConfirmModal`, `ReportModal`, `PaymentQRModal`, `CreatePostModal`, `CommunityReportModal`
- **Cards**: `WordCardZh`, `WordCardEn`, `TranslationCard`, `PostCard`
- **Audio Elements**: `AudioRecorder`, `AudioWaveform`, `SpeakerIcon`
- **Scaffolding Layout**: `Sidebar` + `Header` + Main Container + `Footer`

---

## BFF Proxy Pattern

All client HTTP requests are piped through **Next.js API Routes** (Backend-for-Frontend) rather than calling the Django instance directly:

```
Browser -> Next.js API Route -> Django REST API
               │
               ▼
     - Attach httpOnly credentials (secure cookies)
     - Forward auth headers
     - Internal CORS resolving
     - Edge caching
```

See [`proxy.ts`](src/lib/api/proxy.ts) for details.

---

## State Management (Zustand)

| Store | Persist | Description |
|---|---|---|
| `useAuthStore` | No | Firebase auth state, ID tokens, logout orchestration |
| `useSettingsStore` | Yes | Global volume, speech rate, sound switch |
| `useSubscriptionStore` | No | Subscription tiers, plan metrics, volume quotas |
| `useGamificationStore` | No | Daily streaks, XP, contribution graph |
| `useCoinStore` | No | Coin wallet balances, transactions, purchase orders |
| `useCommunityStore` | No | Forum posts, comments, votes, report state |
| `useNotificationStore` | No | Persistence of notifications, dynamic read badges |
| `useAudioStore` | No | Global HTML5 audio element synchronization |
| `useLanguageStore` | No | Global UI language toggle (zh/en) |
| `useHanziCacheStore` | No | Client-side cache of fetched stroke data |
| `useUIStore` | No | Menu states, active modal visibility flags |

---

## Custom Hooks

| Hook | Description |
|---|---|
| `useSmartQueue` | Task status poller with exponential backoff |
| `useWebSocket` | WebSocket interface with automatic reconnection |
| `useStudySearch` | Debounced searching wrapper supporting multiple dictionary formats |
| `useHanziDetails` | High-performance stroke data fetching and cache middleware |
| `useHanVietSentence` | Character-by-character Sino-Vietnamese transcription helper |
| `useAudioRecording` | Low-overhead MediaRecorder state and compression |
| `useAzureSpeech` | Azure Speech SDK for real-time speech recognition |
| `usePronunciationScorer` | Unified scoring and evaluation coordinator |
| `useNotificationWebSocket` | Isolated socket channel strictly for push notifications |
| `useHandwritingRecognition` | Handwriting input recognition for Chinese characters |
| `useSpellCheck` | Real-time browser-based spelling dictionary helper |
| `useDebounce` | Generic debouncer |

---

## Development

### Prerequisites

- **Node.js** 18+ and **npm** 9+
- Backend services running (see [Backend README](../README.md))

### Getting Started

```bash
# 1. Navigate to frontend directory
cd frontend_nextjs

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env.local
# Edit .env.local with your configuration

# 4. Run development server
npm run dev
# → http://localhost:3000
```

### Common Commands

```bash
# Run hot-reloading development server
npm run dev

# Perform TypeScript compile check
npx tsc --noEmit

# Lint code quality
npm run lint

# Compile production bundle
npm run build
npm start
```

### Environment Variables

```env
# Backend API URL (Piped through Nginx)
NEXT_PUBLIC_API_URL=http://localhost

# Edge TTS API
TTS_SERVICE_URL=http://localhost:8002

# Firebase App Config
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
```

---

## Dependencies

### Runtime

| Package | Description |
|---|---|
| `next` ^14.2 | React Framework (App Router, SSR, Serverless functions) |
| `react` ^18.2 | UI library |
| `zustand` ^5.0 | High-performance state store |
| `@tanstack/react-query` ^5.101 | Async state management & data fetching |
| `axios` ^1.16 | Promise-based HTTP client |
| `firebase` ^12.15 | Firebase Client SDK |
| `microsoft-cognitiveservices-speech-sdk` ^1.50 | Azure Speech recognition SDK |
| `hanzi-writer` ^3.7 | Interactive Chinese character stroke ordering |
| `hanzilookup-js` ^1.0 | Chinese handwriting recognition |
| `recharts` ^3.8 | Modern charting elements |
| `react-calendar-heatmap` ^1.10 | GitHub-like contribution heatmap |
| `react-easy-crop` ^5.5 | Flexible image crop UI for profile images |
| `lucide-react` ^1.16 | Dynamic visual vector icons |
| `date-fns` ^4.3 | Date utilities |
| `js-cookie` ^3.0 | Client cookie interface |
| `jwt-decode` ^4.0 | JWT decoding utility |
| `@vercel/analytics` | Web analytics |
| `@vercel/speed-insights` | Edge user experience latency tracer |

### Dev Dependencies

| Package | Description |
|---|---|
| `typescript` ^5.4 | Type safety compiler |
| `tailwindcss` ^3.4 | Utility-first CSS engine |
| `eslint` + `eslint-config-next` | Code quality configuration |
| `autoprefixer` + `postcss` | Edge CSS processing compiler |

---

## Deployment (Vercel)

The Next.js client is optimized for automatic deployment on Vercel:

- **Edge Runtime**: Used for instant routing and internationalization middleware.
- **Serverless API Routes**: Operates BFF endpoints independently.
- **Analytics & Web Vitals**: Built-in speed insight reports.
- **Preview Branch Triggers**: Builds a preview sandbox for every pull request automatically.

```bash
# Trigger manual Vercel production build
npx vercel --prod
```

---

<sub>See also: [Backend README](../README.md)</sub>
