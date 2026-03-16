import * as dotenv from 'dotenv';
import { supabase } from './supabaseClient.js';
dotenv.config();

const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY;

/**
 * Helper function to generate an embedding using Voyage AI.
 */
async function getVoyageEmbedding(text) {
  if (!VOYAGE_API_KEY) {
    throw new Error("Missing VOYAGE_API_KEY in environment variables.");
  }

  const response = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${VOYAGE_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      input: text,
      model: "voyage-3" // Voyage 3 outputs 1024 dimensions
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Voyage API error: ${response.status} ${errText}`);
  }

  const result = await response.json();
  return result.data[0].embedding;
}

/**
 * Returns language-specific coding standards context for the LLM prompt.
 * Queries a Supabase pgvector database via Voyage AI embeddings.
 */
export async function getRelevantCodingStandards(codeInput, language) {
  try {
    const lang = (language || 'javascript').toLowerCase();
    console.log(`[RAG] Retrieving coding standards for language: ${lang}`);
    
    if (!codeInput || codeInput.trim() === '') {
       return await getFallbackStandards(lang);
    }

    // 1. Generate embedding for the user's code using Voyage AI
    const queryEmbedding = await getVoyageEmbedding(codeInput);

    // 2. Query Supabase vector database for similar standards
    const { data: standards, error } = await supabase.rpc('match_coding_standards', {
      query_embedding: queryEmbedding,
      match_threshold: 0.2, // Low threshold to ensure returning *some* standards
      match_count: 2,       // Number of context chunks to return
      p_language: lang
    });

    if (error) {
      console.error('Supabase RPC Error querying pgvector:', error.message);
      return await getFallbackStandards(lang);
    }

    if (!standards || standards.length === 0) {
      console.log(`[RAG] No matching standards found in vector DB for ${lang}, using fallback.`);
      return await getFallbackStandards(lang);
    }

    // 3. Assemble the retrieved context
    const context = standards.map(s => s.content).join('\n\n');
    return context;

  } catch (error) {
    console.error('Error in RAG service:', error);
    return await getFallbackStandards(language); // Fail gracefully
  }
}

/**
 * Fallback mechanism if the vector DB query fails or has no exact data.
 * Tries a basic text lookup or returns hardcoded universal rules.
 */
async function getFallbackStandards(language) {
  const lang = (language || 'javascript').toLowerCase();
  try {
     const { data } = await supabase
       .from('coding_standards')
       .select('content')
       .eq('language', lang)
       .limit(1);
       
     if (data && data.length > 0) {
         return data[0].content;
     }
  } catch(e) { /* ignore error */ }
  
  return `--- [Universal Best Practices] ---
- Do not embed secrets, passwords, or API keys in source code.
- Validate and sanitize all user input before use.
- Always handle errors and edge cases (null checks, type checks).
- Write readable, self-documenting code with meaningful names.
- Prefer immutability where possible; avoid unnecessary mutation.
- Log errors with sufficient context for debugging.
- Keep functions small and single-responsibility.
--- [${language} General Standards] ---
Follow language-specific best practices and conventions for ${language}. Ensure code is readable, secure, and performant.`;
}
