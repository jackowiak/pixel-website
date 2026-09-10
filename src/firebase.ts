import { initializeApp, type FirebaseApp } from "firebase/app";
import { getDatabase, type Database } from "firebase/database";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Remote control is optional: without a configured Firebase project this
// stays null and useRemoteControl no-ops, so the app works exactly as
// before (local track picking only).
export const isRemoteControlConfigured = Boolean(config.apiKey && config.databaseURL);

let app: FirebaseApp | null = null;
export let database: Database | null = null;

if (isRemoteControlConfigured) {
  app = initializeApp(config);
  database = getDatabase(app);
}
