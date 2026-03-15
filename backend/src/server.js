import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { performCodeReview } from './services/reviewService.js';
import { getRelevantCodingStandards } from './services/ragService.js';
import { sendCompletionEmail, shareReportEmail } from './services/emailService.js';
import { supabase } from './services/supabaseClient.js';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ─── Auth Routes ────────────────────────────────────────────────────────────

app.post('/v1/auth/signup', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email and password are required.' });
  if (!email.includes('@'))
    return res.status(400).json({ error: 'Invalid email address.' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });

  // Check if user already exists
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('email')
    .eq('email', email)
    .single();

  if (existingUser)
    return res.status(409).json({ error: 'An account with this email already exists.' });

  const userId = crypto.randomUUID();
  const user = { id: userId, name, email, password };

  const { error } = await supabase
    .from('profiles')
    .insert([user]);

  if (error) return res.status(500).json({ error: 'Failed to create account.' });

  const { password: _pw, ...safeUser } = user;
  return res.status(201).json({ user: safeUser, message: 'Account created successfully!' });
});

app.post('/v1/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required.' });

  const { data: user, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !user || user.password !== password)
    return res.status(401).json({ error: 'Invalid email or password.' });

  const { password: _pw, ...safeUser } = user;
  return res.json({ user: safeUser, message: 'Logged in successfully!' });
});

// ─── API Routes ───────────────────────────────────────────────────────────────

app.get('/v1/dashboard/stats', async (req, res) => {
  const { userId } = req.query;
  
  let query = supabase.from('reviews').select('*');
  if (userId) query = query.eq('user_id', userId);
  
  const { data: reviews, error } = await query;
  if (error) return res.status(500).json({ error: 'Failed to fetch stats' });

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
    user_id: userId || null,
    language: language || 'javascript',
    code_input: code_input || '',
    source_url,
    source_type: source_type || 'pasted',
    source_display: source_display || 'Manual Paste',
    status: 'processing',
    created_at: new Date().toISOString()
  };

  await supabase.from('reviews').insert([review]);

  res.status(202).json({ review_id, status: 'processing', estimated_seconds: 15 });

  // Process in background
  try {
    const context = await getRelevantCodingStandards(review.code_input, review.language);
    const result  = await performCodeReview(review.code_input, review.language, context);

    const updatedReview = {
      status: 'completed',
      completed_at: new Date().toISOString(),
      scores: result.scores,
      findings: result.findings,
      explanation: result.explanation,
      fixed_code: result.fixed_code,
      original_code: review.code_input,
    };
    
    await supabase.from('reviews').update(updatedReview).eq('id', review_id);

    // Email notification logic can be added here if needed
  } catch (err) {
    console.error(`Error processing review ${review_id}:`, err);
    await supabase.from('reviews').update({ status: 'failed' }).eq('id', review_id);
  }
});

app.get('/v1/reviews', async (req, res) => {
  const { userId } = req.query;
  let query = supabase.from('reviews').select('*').order('created_at', { ascending: false });
  if (userId) query = query.eq('user_id', userId);

  const { data: reviews, error } = await query;
  if (error) return res.status(500).json({ error: 'Failed to fetch reviews' });
  res.json({ reviews });
});

app.get('/v1/reviews/:id', async (req, res) => {
  const { data: review, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('id', req.params.id)
    .single();
    
  if (error || !review) return res.status(404).json({ error: 'Review not found' });
  res.json(review);
});

app.patch('/v1/reviews/:id', async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  
  const { data: updated, error } = await supabase
    .from('reviews')
    .update({ name })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(404).json({ error: 'Review not found or update failed' });
  res.json(updated);
});

app.delete('/v1/reviews/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('reviews').delete().eq('id', id);
  
  if (error) return res.status(404).json({ error: 'Review not found' });
  res.json({ success: true });
});

app.post('/v1/reviews/:id/share', async (req, res) => {
  const { id } = req.params;
  const { email, userName } = req.body;
  
  const { data: review, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error || !review) return res.status(404).json({ error: 'Review not found' });
  if (!email) return res.status(400).json({ error: 'Recipient email is required' });

  const success = await shareReportEmail(email, review, userName);
  if (success) {
    res.json({ message: 'Report shared successfully!' });
  } else {
    res.status(500).json({ error: 'Failed to share report via email' });
  }
});

app.get('/v1/user/settings', async (req, res) => {
  const { userId } = req.query;
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, email, notifications')
    .eq('id', userId)
    .single();
    
  res.json({
    displayName: profile?.name || 'Dev User',
    email: profile?.email || '',
    notifications: profile?.notifications || { emailOnComplete: false, weeklyDigest: false }
  });
});

app.post('/v1/user/settings', async (req, res) => {
  const { userId, displayName, email, password, notifications } = req.body;
  
  const updates = {};
  if (displayName !== undefined) updates.name = displayName;
  if (email !== undefined) updates.email = email;
  if (password !== undefined) updates.password = password;
  if (notifications !== undefined) updates.notifications = notifications;

  const { data: settings, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) return res.status(500).json({ error: 'Failed to update settings' });
  
  res.json({ 
    success: true, 
    settings: {
      displayName: settings.name,
      email: settings.email,
      notifications: settings.notifications
    } 
  });
});

app.delete('/v1/user/account', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID is required' });

  // 1. Remove all reviews
  await supabase.from('reviews').delete().eq('user_id', userId);

  // 2. Remove profile
  const { error } = await supabase.from('profiles').delete().eq('id', userId);

  if (error) return res.status(500).json({ error: 'Failed to delete account' });
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
