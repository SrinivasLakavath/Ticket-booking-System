# Firebase setup for CineSeat (free / Spark)

Use **Authentication** + **Analytics** only. Do **not** enable Cloud Storage unless you upgrade to Blaze (paid plan). Movie posters can use pasted image URLs.

## 1. Open your project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select **alyke-courserecommender**

## 2. Enable Authentication (free)

1. Left sidebar → **Build** → **Authentication**
2. Click **Get started** (if first time)
3. Open **Sign-in method**
4. Enable **Email/Password** → Save
5. (Optional) Enable **Google** → set support email → Save
6. Open **Settings** → **Authorized domains**
   - Keep `localhost`
   - Add your deployed domain later if any

## 3. Confirm Web app config

**Project settings** (gear) → **Your apps** → Web app  
Values are already in `Frontend/.env` and `Backend/.env` as `FIREBASE_WEB_API_KEY`.

## 4. What the app does

- Sign up / Sign in → Firebase Auth (email/password or Google)
- Backend `POST /auth/firebase` verifies the Firebase ID token (free Identity Toolkit API)
- User is synced into MongoDB and a CineSeat JWT is issued (same as before for bookings/admin)

## 5. Skip Storage (needs Blaze)

On Create Movie, paste an **IMAGE URL**. File upload to Firebase Storage is optional and blocked on Spark for new projects.
