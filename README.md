# MindFlow — Gemini AI Journal & Introspective Reflection Vault

A secure, user-authenticated journaling, introspective reflection, and habit formation platform powered by Google Cloud Run, Cloud Firestore, Firebase Authentication (Google Sign-In), and the Gemini 3.6 Flash API with multi-model fallback resilience and client-side zero-knowledge encrypted mood logs.

---

## 📐 System Architecture & Data Flow

### 1. High-Level System Architecture

```
                      ┌────────────────────────────────────────────────────────┐
                      │                   USER BROWSER                         │
                      │                                                        │
                      │  ┌───────────────────────┐  ┌───────────────────────┐  │
                      │  │  React 18 + Tailwind  │  │   Web Crypto AES-GCM  │  │
                      │  │   Reflection Canvas   │  │   Zero-Knowledge Key  │  │
                      │  └──────────┬────────────┘  └───────────┬───────────┘  │
                      │             │                           │              │
                      │  ┌──────────▼────────────┐  ┌───────────▼───────────┐  │
                      │  │  IndexedDB / Storage  │  │   Firebase Auth SDK   │  │
                      │  │    Offline Queue      │  │    (Google OAuth)     │  │
                      │  └──────────┬────────────┘  └───────────┬───────────┘  │
                      └─────────────┼───────────────────────────┼──────────────┘
                                    │ (Encrypted / Direct Data) │ (User Token)
                                    ▼                           ▼
                      ┌────────────────────────────────────────────────────────┐
                      │              GOOGLE CLOUD FIRESTORE                    │
                      │   - Owner-Bound Security Rules: /users/{userId}/*      │
                      │   - Sub-collections: entries, habits, moodLogs         │
                      └────────────────────────────────────────────────────────┘
                                    ▲
                                    │ /api/gemini/reflect
                                    │ /api/gemini/summarize
                                    │ /api/gemini/sparks
                      ┌─────────────┴──────────────────────────────────────────┐
                      │           GOOGLE CLOUD RUN BACKEND CONTAINER           │
                      │                                                        │
                      │   ┌────────────────────────────────────────────────┐   │
                      │   │       Express.js Server (Node.js / tsx)        │   │
                      │   │   - PORT=3000 / 0.0.0.0 Interface Binding      │   │
                      │   │   - Input Validation & Schema Sanitization     │   │
                      │   └───────────────────────┬────────────────────────┘   │
                      │                           │ Internal Secure API Proxy  │
                      │   ┌───────────────────────▼────────────────────────┐   │
                      │   │   Gemini Multi-Model Fallback Ladder           │   │
                      │   │   1. gemini-3.6-flash (Primary)                │   │
                      │   │   2. gemini-3.1-flash-lite                     │   │
                      │   │   3. gemini-flash-latest                       │   │
                      │   │   4. gemini-3.7-flash                          │   │
                      │   └───────────────────────┬────────────────────────┘   │
                      └───────────────────────────┼────────────────────────────┘
                                                  │ Secret Manager
                                                  ▼
                                     [ Google Gemini API Engine ]
```

---

### 2. User Journey & Reflection Flow

```
[ User Lands on App ]
         │
         ▼
[ Firebase Google Sign-In ] ──► (Authentication Token Verified)
         │
         ▼
[ Personal Reflection Dashboard ]
         │
         ├──────────────────────┬──────────────────────┬──────────────────────┐
         ▼                      ▼                      ▼                      ▼
  [ 📝 Journal Tab ]      [ 🔒 Mood Vault ]     [ 🎯 Habits Tab ]     [ 📚 Archive ]
         │                      │                      │                      │
 1. Pick Spark Prompt    1. Set Vault Password   1. Check-in Habits    1. Search & Filter
 2. Write Thoughts       2. Rate Valence/Energy  2. Track Streaks      2. Edit Past Note
 3. Multi-Turn Gemini    3. AES-GCM Encrypt Note 3. Confetti Animation 3. Export to .MD
 4. AI Synthesis         4. Save to Firestore    4. Auto-streak Calc
 5. Adopt Micro-Habit
```

---

### 3. Zero-Knowledge Mood Encryption Flow

```
[ User Plaintext Note ] ──► [ Master Passphrase ]
                                   │
                                   ▼
                        [ PBKDF2 (100k iters) + Salt ]
                                   │
                                   ▼
                        [ AES-GCM 256-Bit Key ]
                                   │
                                   ▼
                        [ Encrypted Ciphertext + IV ]
                                   │
                 ┌─────────────────┴─────────────────┐
                 ▼                                   ▼
      [ Stored in Firestore ]             [ Network Interception ]
  (Server has ZERO access to key)      (Only unreadable hex/base64)
```

---

### 4. Offline-First Synchronization State Machine

```
   [ User Saves Note / Habit ]
                │
                ▼
         [ Is Online? ]
          /          \
      YES/            \NO
        /              \
       ▼                ▼
[ Write Directly   [ Save to IndexedDB / LocalStorage ]
  to Firestore ]   [ Add to Pending Sync Queue ]
        │          [ Show "Offline Mode" Alert Banner ]
        │               │
        │               ▼
        │          [ Browser Reconnects (online event) ]
        │               │
        └───────────────┼──────────────┐
                        ▼              ▼
           [ Flush Sync Queue ] ──► [ Commit to Firestore ]
                                ──► [ Update Sync Badge ]
```

---

## 📁 Repository Structure & Module Breakdown

```
mindflow/
├── index.html                      # App HTML entry point with fonts & meta
├── metadata.json                   # AI Studio applet configuration & permissions
├── package.json                    # Dependencies, build, dev, and start scripts
├── tsconfig.json                   # TypeScript compiler configuration
├── vite.config.ts                  # Vite build tooling & Tailwind integration
├── server.ts                       # Express backend server with Gemini fallback proxy
├── firestore.rules                 # Cloud Firestore security rules (owner-isolated)
├── firebase-blueprint.json         # Firebase schemas, entities, and security blueprint
├── README.md                       # Comprehensive guide, visual diagrams & test matrix
└── src/
    ├── main.tsx                    # React application bootstrap entry
    ├── App.tsx                     # Main layout, view router, sync controller & auth state
    ├── types.ts                    # TypeScript interfaces for reflections, moods & habits
    ├── index.css                   # Global Tailwind styles & typography configurations
    │
    ├── lib/
    │   ├── firebase.ts             # Firebase client SDK initialization (Auth & Firestore)
    │   ├── crypto.ts               # Web Crypto AES-GCM 256-bit PBKDF2 encryption engine
    │   ├── offlineStore.ts         # Offline storage manager & reconnect sync queue
    │   └── api.ts                  # Client-side API fetch client for Gemini endpoints
    │
    └── components/
        ├── Navbar.tsx              # Navigation bar with user avatar, offline badge & vault lock
        ├── LandingPage.tsx         # Pre-auth landing page with Google Sign-In button
        ├── JournalEditor.tsx       # Core reflection canvas with dynamic spark prompt generator
        ├── GeminiReflectionPanel.tsx# Multi-turn conversational AI mentor & synthesizer
        ├── MoodVault.tsx           # Encrypted emotional check-in dashboard & 2D mood grid
        ├── HabitStreaks.tsx        # Daily habit tracker with streaks & confetti celebrations
        ├── EntryHistory.tsx        # Searchable entry archive with tag filtering & Markdown export
        ├── VaultModal.tsx          # Passphrase modal for vault unlock and key derivation
        └── OfflineBanner.tsx       # Network alert banner with manual sync trigger
```

---

## 💻 Local Setup & Testing Guide

Follow these steps to run and test MindFlow on your local development machine:

### 1. Prerequisites
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 9.0.0 or higher
- **Google Gemini API Key**: Obtainable from [Google AI Studio](https://aistudio.google.com/)

### 2. Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/your-username/mindflow.git
cd mindflow

# Install all required npm packages
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Server Port (defaults to 3000 
PORT=3000

### 4. Start the Local Development Server

```bash
npm run dev
```

The application will start with `tsx server.ts` at `http://localhost:3000`.

### 5. Verify Build & Lint

To ensure everything compiles cleanly before deployment:

```bash
# Run TypeScript typecheck
npm run lint

# Run production bundle compilation
npm run build
```

---

## 🧪 Comprehensive Walkthrough & Test Case Matrix

Execute these 10 end-to-end verification test cases to test every feature locally:

| ID | Test Scenario | Steps to Execute | Expected Outcome |
| :--- | :--- | :--- | :--- |
| **TC-01** | **Google Authentication Gate** | 1. Open `http://localhost:3000`.<br>2. Click **"Continue with Google"**.<br>3. Select your Google account in the popup. | User is authenticated via Firebase Auth; user profile and sign-out button appear in Navbar; user redirected to Journal Dashboard. |
| **TC-02** | **Journal Reflection & Spark Generation** | 1. In `Reflect` tab, select **"Emotional Clarity"** in Prompt Sparks dropdown.<br>2. Click **"Generate"**.<br>3. Click one of the 3 generated prompt chips. | Gemini prompt sparks populate; selected prompt appends cleanly into the journal text area. |
| **TC-03** | **Multi-Turn AI Introspective Dialogue** | 1. Type a paragraph of thoughts in Journal Canvas.<br>2. Click **"Deepen Reflection"** or type a custom question in the Gemini panel.<br>3. Click **"Send"**. | Server routes request through Gemini fallback ladder; Gemini responds with empathetic inquiry questions rendered in Markdown. Conversation counter increments. |
| **TC-04** | **AI Synthesis & Habit Adoption** | 1. In the Gemini panel, click **"Synthesize"**.<br>2. Review generated summary, key takeaways, and recommended micro-habit.<br>3. Click **"Track This Habit"**. | Summary and key takeaways populate in the synthesis card; the recommended habit is instantly created and appears in the `Habits` tab. |
| **TC-05** | **Cloud Firestore Persistence** | 1. Click **"Save Entry"** on the reflection canvas.<br>2. Switch to `Archive` tab.<br>3. Search for entry by keyword or mood tag. | Entry appears in archive grid with timestamp, mood emoji, and AI dialogue count. Editing loads entry back into canvas. |
| **TC-06** | **Encrypted Mood Vault Check-In** | 1. Switch to `Mood Vault` tab.<br>2. Click **"Unlock Vault"**, enter passphrase (e.g. `secret123`).<br>3. Select Valence (e.g. ☀️ Radiant) & Energy level.<br>4. Type a private note and click **"Save Encrypted Mood Check-in"**. | Note is encrypted with AES-GCM (256-bit); ciphertext and IV saved to Firestore; decrypted note renders in recent check-ins list. |
| **TC-07** | **Zero-Knowledge Decryption Security** | 1. In `Mood Vault`, click **"Lock Vault & Purge Session Key"**.<br>2. Inspect recent check-in list. | Private note text disappears and displays `[Encrypted Ciphertext: ...]`, proving zero plain-text retention without client key. |
| **TC-08** | **Daily Habit Check-in & Streaks** | 1. Switch to `Habits` tab.<br>2. Click checkmark on any habit card. | Checkmark activates; confetti animation triggers (`canvas-confetti`); streak count increments; 7-day mini-heatmap fills. |
| **TC-09** | **Offline Mode & Reconnection Sync** | 1. Open DevTools &rarr; Network &rarr; check **"Offline"**.<br>2. Notice "Offline Mode" banner in UI.<br>3. Write reflection and click Save.<br>4. Uncheck **"Offline"** in DevTools. | Entry is queued in local offline queue; "1 Pending" sync badge shows; on reconnect, queue flushes and commits cleanly to Cloud Firestore. |
| **TC-10** | **Markdown Export** | 1. In `Archive` tab, click **"Export as Markdown"** on any entry card. | A clean `.md` file is downloaded containing Title, Date, Mood, Content, AI Summary, Takeaways, and full multi-turn dialogue history. |

---

## 🛡️ Firestore Security Rules

Deploy these owner-bound security rules to ensure user data isolation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    match /users/{userId} {
      allow read: if isOwner(userId);
      allow create: if isOwner(userId) && request.resource.data.uid == userId;
      allow update: if isOwner(userId) && request.resource.data.uid == userId;
      allow delete: if isOwner(userId);

      match /entries/{entryId} {
        allow read: if isOwner(userId);
        allow create: if isOwner(userId) 
          && request.resource.data.userId == userId
          && request.resource.data.title is string
          && request.resource.data.title.size() > 0
          && request.resource.data.title.size() <= 200
          && request.resource.data.content is string
          && request.resource.data.content.size() <= 20000;
        allow update: if isOwner(userId) 
          && request.resource.data.userId == userId;
        allow delete: if isOwner(userId);
      }

      match /habits/{habitId} {
        allow read: if isOwner(userId);
        allow create: if isOwner(userId) 
          && request.resource.data.userId == userId
          && request.resource.data.title is string
          && request.resource.data.title.size() > 0
          && request.resource.data.title.size() <= 100;
        allow update: if isOwner(userId) 
          && request.resource.data.userId == userId;
        allow delete: if isOwner(userId);
      }

      match /moodLogs/{moodId} {
        allow read: if isOwner(userId);
        allow create: if isOwner(userId) 
          && request.resource.data.userId == userId
          && request.resource.data.encryptedData is string
          && request.resource.data.iv is string;
        allow update: if isOwner(userId) 
          && request.resource.data.userId == userId;
        allow delete: if isOwner(userId);
      }
    }
  }
}
```

---

## 🚀 Google Cloud Run Deployment & Secret Management

### 1. Prerequisites & Enable APIs
Ensure the `gcloud` CLI is installed and initialized to your Google Cloud project:

```bash
# Set your active project ID
gcloud config set project YOUR_PROJECT_ID

# Enable required Google Cloud APIs
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com
```

### 2. Secret Manager Configuration
Securely store the Gemini API Key in Google Cloud Secret Manager and grant the Cloud Run compute service account read access:

```bash
# Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# Retrieve project number
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")

# Grant Cloud Run service account access to Secret Manager
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 3. Deploy to Cloud Run
Build and deploy the application container to Cloud Run with Secret Manager binding and the campaign verification label:

```bash
gcloud run deploy mindflow-app \
  --source . \
  --region asia-southeast1 \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --update-labels=dev-tutorial=cloud-run-ai-challenge
```
