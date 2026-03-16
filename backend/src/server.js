import express from 'express';
import 'express-async-errors';
import cors from 'cors';
import dotenv from 'dotenv';
import { performCodeReview } from './services/reviewService.js';
import { getRelevantCodingStandards } from './services/ragService.js';
import { sendCompletionEmail, shareReportEmail } from './services/emailService.js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '../../data.json');

// ─── Persistent JSON Store ───────────────────────────────────────────────────

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        reviews:      new Map(Object.entries(parsed.reviews      || {})),
        users:        new Map(Object.entries(parsed.users        || {})),
        userSettings: new Map(Object.entries(parsed.userSettings || {})),
      };
    }
  } catch (e) {
    console.warn('Could not load data.json, starting fresh:', e.message);
  }
  return {
    reviews:      new Map(),
    users:        new Map(),
    userSettings: new Map(),
  };
}

function saveData() {
  try {
    const payload = {
      reviews:      Object.fromEntries(db.reviews),
      users:        Object.fromEntries(db.users),
      userSettings: Object.fromEntries(db.userSettings),
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save data.json:', e.message);
  }
}

const db = loadData();

// Seed a demo user if not already present
if (!db.users.has('demo@codesensei.ai')) {
  db.users.set('demo@codesensei.ai', {
    id: 'user-demo-001',
    name: 'Dev User',
    email: 'demo@codesensei.ai',
    password: 'demo1234'
  });
  saveData();
}

// Helper: get settings for a user (creates default if not exists)
function getUserSettings(userId) {
  if (!db.userSettings.has(userId)) {
    const user = Array.from(db.users.values()).find(u => u.id === userId);
    db.userSettings.set(userId, {
      displayName: user?.name || 'Dev User',
      email: user?.email || '',
      notifications: { emailOnComplete: false, weeklyDigest: false }
    });
  }
  return db.userSettings.get(userId);
}

// ─────────────────────────────────────────────────────────────────────────────

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ─── Auth Routes ────────────────────────────────────────────────────────────

app.post('/v1/auth/signup', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email and password are required.' });
  if (!email.includes('@'))
    return res.status(400).json({ error: 'Invalid email address.' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  if (db.users.has(email))
    return res.status(409).json({ error: 'An account with this email already exists.' });

  const userId = crypto.randomUUID();
  const user = { id: userId, name, email, password };
  db.users.set(email, user);

  saveData();

  const { password: _pw, ...safeUser } = user;
  return res.status(201).json({ user: safeUser, message: 'Account created successfully!' });
});

app.post('/v1/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required.' });

  const user = db.users.get(email);
  if (!user || user.password !== password)
    return res.status(401).json({ error: 'Invalid email or password.' });

  const { password: _pw, ...safeUser } = user;
  return res.json({ user: safeUser, message: 'Logged in successfully!' });
});

// ─── API Routes ───────────────────────────────────────────────────────────────

app.get('/v1/dashboard/stats', (req, res) => {
  const { userId } = req.query;
  let reviews = Array.from(db.reviews.values());
  // Filter by userId if provided
  if (userId) reviews = reviews.filter(r => r.userId === userId);
  const completed = reviews.filter(r => r.status === 'completed');

  const avg = completed.length > 0
    ? completed.reduce((sum, r) => sum + r.scores.composite, 0) / completed.length
    : 0;

  // Compute per-dimension averages from real data
  const dims = ['bugs', 'security', 'performance', 'readability', 'best_practices'];
  const dimAvgs = {};
  dims.forEach(d => {
    const vals = completed.filter(r => r.scores?.[d] != null).map(r => r.scores[d]);
    dimAvgs[d] = vals.length ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)) : 0;
  });

  res.json({
    total_reviews: reviews.length,
    avg_composite_score: parseFloat(avg.toFixed(1)),
    avg_composite_this_month: parseFloat(avg.toFixed(1)),
    avg_scores_by_dimension: dimAvgs,
    most_improved_dimension: 'security',
    weakest_dimension: 'security'
  });
});

app.post('/v1/reviews', async (req, res) => {
  const { language, code_input, source_url, userId, email, source_type, source_display } = req.body;
  const review_id = crypto.randomUUID();

  // Create pending review — linked to the submitting user
  const review = {
    id: review_id,
    userId: userId || null,
    language: language || 'javascript',
    code_input: code_input || '',
    source_url,
    source_type: source_type || 'pasted',
    source_display: source_display || 'Manual Paste',
    status: 'processing',
    created_at: new Date().toISOString()
  };

  db.reviews.set(review_id, review);
  saveData();

  res.status(202).json({ review_id, status: 'processing', estimated_seconds: 15 });

  // Process in background
  try {
    const context = await getRelevantCodingStandards(review.code_input, review.language);
    const result  = await performCodeReview(review.code_input, review.language, context);

    const updatedReview = {
      ...review,
      status: 'completed',
      completed_at: new Date().toISOString(),
      scores: result.scores,
      findings: result.findings,
      explanation: result.explanation,
      fixed_code: result.fixed_code,
      original_code: review.code_input,
    };
    db.reviews.set(review_id, updatedReview);
    saveData();

    // Send email notification if user has it enabled
    const userSettings = userId ? db.userSettings.get(userId) : null;
    const notifyEmail = email ||
      (userSettings?.notifications?.emailOnComplete ? userSettings.email : null);
    // Automatic email sharing disabled as per user request (Manual trigger added to History)
  } catch (err) {
    console.error(`Error processing review ${review_id}:`, err);
    db.reviews.set(review_id, { ...review, status: 'failed' });
    saveData();
  }
});

app.get('/v1/reviews', (req, res) => {
  const { userId } = req.query;
  let reviews = Array.from(db.reviews.values());
  // Only return reviews that belong to this user
  if (userId) reviews = reviews.filter(r => r.userId === userId);
  reviews.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json({ reviews });
});

app.get('/v1/reviews/:id', (req, res) => {
  const review = db.reviews.get(req.params.id);
  if (!review) return res.status(404).json({ error: 'Review not found' });
  res.json(review);
});

app.patch('/v1/reviews/:id', (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const review = db.reviews.get(id);
  if (!review) return res.status(404).json({ error: 'Review not found' });
  
  const updated = { ...review, name: name || review.name };
  db.reviews.set(id, updated);
  saveData();
  res.json(updated);
});

app.delete('/v1/reviews/:id', (req, res) => {
  const { id } = req.params;
  if (!db.reviews.has(id)) return res.status(404).json({ error: 'Review not found' });
  
  db.reviews.delete(id);
  saveData();
  res.json({ success: true });
});

app.post('/v1/reviews/:id/share', async (req, res) => {
  const { id } = req.params;
  const { email, userName } = req.body;
  const review = db.reviews.get(id);
  
  if (!review) return res.status(404).json({ error: 'Review not found' });
  if (!email) return res.status(400).json({ error: 'Recipient email is required' });

  const success = await shareReportEmail(email, review, userName);
  if (success) {
    res.json({ message: 'Report shared successfully!' });
  } else {
    res.status(500).json({ error: 'Failed to share report via email' });
  }
});

app.get('/v1/user/settings', (req, res) => {
  const { userId } = req.query;
  res.json(getUserSettings(userId));
});

app.post('/v1/user/settings', (req, res) => {
  const { userId, displayName, email, password, notifications } = req.body;
  const settings = getUserSettings(userId);
  
  if (displayName  !== undefined) settings.displayName = displayName;
  if (email        !== undefined) {
    settings.email = email;
    // Update main user record too
    const user = Array.from(db.users.values()).find(u => u.id === userId);
    if (user) {
      db.users.delete(user.email);
      user.email = email;
      user.name = displayName || user.name;
      if (password) user.password = password;
      db.users.set(email, user);
    }
  } else if (password) {
    const user = Array.from(db.users.values()).find(u => u.id === userId);
    if (user) user.password = password;
  }

  if (notifications !== undefined) settings.notifications = { ...settings.notifications, ...notifications };
  if (userId) db.userSettings.set(userId, settings);
  saveData();
  res.json({ success: true, settings });
});

app.delete('/v1/user/account', (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID is required' });

  // 1. Remove user from users map
  const user = Array.from(db.users.values()).find(u => u.id === userId);
  if (user) db.users.delete(user.email);

  // 2. Remove user settings
  db.userSettings.delete(userId);

  // 3. Remove all reviews
  const reviewIds = Array.from(db.reviews.entries())
    .filter(([_, r]) => r.userId === userId)
    .map(([id, _]) => id);
  
  reviewIds.forEach(id => db.reviews.delete(id));

  saveData();
  res.json({ success: true, message: 'Account and all data deleted' });
});

// Basic Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`CodeSensei API Server listening on port ${PORT}`);
});
