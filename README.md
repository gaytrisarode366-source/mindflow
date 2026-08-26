# MindFlow — Gemini AI Journal & Introspective Reflection Vault

A secure, user-authenticated journaling and mental clarity web application powered by Google Cloud Run, Cloud Firestore, Firebase Authentication (Google Sign-In), and the Gemini 3.6 Flash API with multi-model fallback resilience.

---

## 🌟 Key Architecture & Capabilities

1. **User Identity & Privacy Isolation**:
   - Federated Google Sign-In via Firebase Auth.
   - Strict owner-bound document isolation in Cloud Firestore (`/users/{userId}/...`).
   - Zero storage of plain passwords.
2. **Gemini 3.6 Flash Multi-Turn AI Reflections**:
   - Server-side Express API proxy with resilient fallback ladder (`gemini-3.6-flash` &rarr; `gemini-3.1-flash-lite` &rarr; `gemini-flash-latest` &rarr; `gemini-3.7-flash`).
   - Multi-turn conversational mentor, cognitive reframing, introspective prompt sparks, and structured synthesis.
3. **Zero-Knowledge Encrypted Mood Vault**:
   - Client-side Web Crypto API (AES-GCM 256-bit with PBKDF2 key derivation).
   - Sensitive emotional notes encrypted locally before reaching Firestore.
4. **Habit Formation & Streak Engine**:
   - Daily reflection check-ins, automatic streak calculation, best streak tracking, and celebration confetti.
   - Instant conversion of AI-suggested reflection takeaways into tracked habits.
5. **Offline-First Resilience**:
   - IndexedDB/LocalStorage draft caching and offline queueing with auto-sync upon reconnection.

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

---

## 🧪 Comprehensive Walkthrough & Test Case Matrix

Every user-facing workflow has an explicit test case for verification:

| ID | Test Scenario | Steps to Execute | Expected Outcome |
| :--- | :--- | :--- | :--- |
| **TC-01** | **Google Authentication Gate** | 1. Navigate to landing page.<br>2. Click "Continue with Google".<br>3. Select Google account in popup. | User is authenticated via Firebase Auth; redirected to personal reflection dashboard with user avatar visible in Navbar. |
| **TC-02** | **Journal Reflection & Spark Generation** | 1. In `Reflect` tab, select "Emotional Clarity" in Prompt Sparks dropdown.<br>2. Click "Generate".<br>3. Click one of the generated prompts. | Gemini prompt sparks populate; selected prompt appends cleanly into the journal text area. |
| **TC-03** | **Multi-Turn AI Introspective Dialogue** | 1. Type a paragraph of thoughts in Journal Canvas.<br>2. Click spark chip "Deepen Reflection" or type custom question in Gemini panel.<br>3. Send message. | Server routes request through Gemini fallback ladder; Gemini responds with empathetic inquiry questions rendered in Markdown. Conversation count updates. |
| **TC-04** | **AI Synthesis & Habit Adoption** | 1. In Gemini panel, click "Synthesize" button.<br>2. Review generated summary, key takeaways, and recommended micro-habit.<br>3. Click "Track This Habit". | Summary and key takeaways populate in the synthesis card; the recommended habit is instantly created and appears in the `Habits` tab. |
| **TC-05** | **Cloud Firestore Persistence** | 1. Click "Save Entry" button on reflection canvas.<br>2. Switch to `Archive` tab.<br>3. Search for entry by keyword or mood tag. | Entry appears in archive grid with timestamp, mood emoji, and AI dialogue count. Editing loads entry back into canvas. |
| **TC-06** | **Encrypted Mood Vault Check-In** | 1. Switch to `Mood Vault` tab.<br>2. Click "Unlock Vault", set passphrase (e.g. `secret123`).<br>3. Select Valence (e.g. ☀️ Radiant) & Energy level.<br>4. Type a private note and click "Save Encrypted Mood Check-in". | Note is encrypted with AES-GCM (256-bit); ciphertext and IV saved to Firestore; decrypted note renders in recent check-ins list. |
| **TC-07** | **Zero-Knowledge Decryption Security** | 1. In `Mood Vault`, click "Lock Vault & Purge Session Key".<br>2. Inspect recent check-in list. | Private note text disappears and displays `[Encrypted Ciphertext: ...]`, proving zero plain-text retention without client key. |
| **TC-08** | **Daily Habit Check-in & Streaks** | 1. Switch to `Habits` tab.<br>2. Click checkmark on any habit card. | Checkmark activates; confetti animation triggers (`canvas-confetti`); streak count increments; 7-day mini-heatmap fills. |
| **TC-09** | **Offline Mode & Reconnection Sync** | 1. Toggle browser offline (DevTools &rarr; Network &rarr; Offline).<br>2. Notice "Offline Mode" banner in UI.<br>3. Write reflection and click Save.<br>4. Re-enable network. | Entry is queued in local offline queue; "1 Pending" sync badge shows; on reconnect, queue flushes and commits cleanly to Cloud Firestore. |
| **TC-10** | **Markdown Export** | 1. In `Archive` tab, click "Export as Markdown" on any entry card. | A clean `.md` file is downloaded containing Title, Date, Mood, Content, AI Summary, Takeaways, and full multi-turn dialogue history. |
