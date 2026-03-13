import Groq from "groq-sdk";
import * as dotenv from 'dotenv';
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "mock-key" });

/**
 * Connects to Groq API to perform LLM code review evaluation
 * Returns a JSON structured object with findings and scores.
 */
export async function performCodeReview(codeInput, language, ragContext) {
  try {
    const styleGuide = {
      javascript:  'Airbnb JavaScript Style Guide + OWASP Top 10',
      typescript:  'TypeScript Strict Mode Best Practices + OWASP Top 10',
      python:      'PEP 8 Python Style Guide + OWASP Top 10',
      java:        'Google Java Style Guide + OWASP Top 10',
      kotlin:      'Kotlin Coding Conventions (JetBrains) + OWASP Top 10',
      php:         'PSR-12 PHP Coding Standard + OWASP Top 10',
      go:          'Effective Go + Go Code Review Comments + OWASP Top 10',
      rust:        'Rust API Guidelines + Clippy + OWASP Top 10',
      cpp:         'C++ Core Guidelines (Bjarne Stroustrup) + OWASP Top 10',
    }[language?.toLowerCase()] || `${language} best practices + OWASP Top 10`;

    const prompt = `
    SYSTEM:
    You are CodeSensei, a senior software engineer specializing in ${language} code review.
    Analyze the following ${language} code against the ${styleGuide}.
    Evaluate across 5 dimensions: Bugs, Security, Performance, Readability, Best Practices.
    Ground your feedback in the provided coding standards context below.

    CODING STANDARDS CONTEXT:
    ${ragContext}

    IMPORTANT SCORING RULES:
    - Scores must be on a scale of 1.0 to 10.0 (NOT 0.0 to 1.0).
    - A score of 10 means perfect; 1 means severely flawed.
    - Be realistic and specific; do not give all 5s.

    Return ONLY valid JSON in this exact schema without any markdown blocks or extra text:
    {
      "scores": { "bugs": 7.0, "security": 4.0, "performance": 8.0, "readability": 6.0, "best_practices": 7.0, "composite": 6.4 },
      "findings": [
        { "id": 1, "dimension": "bugs|security|performance|readability|best_practices", "severity": "low|medium|high|critical", "line_start": 1, "line_end": 1, "title": "", "description": "", "suggestion": "", "standard_ref": "" }
      ],
      "explanation": "Plain English explanation of what the code does and its key issues.",
      "fixed_code": "The complete rewritten code with all fixes applied."
    }

    USER ${language.toUpperCase()} CODE:
    ${codeInput}
    `;


    console.log(`[Groq] Sending LLM review request for ${language} code.`);
    
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      response_format: { type: "json_object" }
    });
    
    const output = chatCompletion.choices[0]?.message?.content || "{}";
    const result = JSON.parse(output);
    
    // Safety fallback for composite score calculation if LLM missed it or returned 0
    if (!result.scores) {
      result.scores = { bugs: 5, security: 5, performance: 5, readability: 5, best_practices: 5, composite: 5 };
    }
    
    const s = result.scores;
    result.scores.composite = parseFloat(((s.bugs + s.security + s.performance + s.readability + s.best_practices) / 5).toFixed(1));

    // Ensure finding IDs exist for react rendering
    if (result.findings) {
       result.findings = result.findings.map((f, i) => ({...f, id: i + 1, dimension: f.dimension.toLowerCase()}));
    } else {
       result.findings = [];
    }
    
    return result;
  } catch (error) {
    console.error("Error in Review service:", error);
    // Return dummy data on failure to keep flow going
    return {
      scores: { bugs: 1, security: 1, performance: 1, readability: 1, best_practices: 1, composite: 1.0 },
      findings: [{ 
        id: 1, 
        dimension: "bugs", 
        severity: "critical", 
        line_start: 1, 
        title: "AI Analysis Error", 
        description: `Our AI service (Groq) encountered an issue: ${error.message}. Please try again in a few moments.`, 
        suggestion: "Check your internet connection or try a different code snippet.", 
        standard_ref: "System Reliability" 
      }],
      explanation: "Analysis failed due to an upstream API error. This usually indicates a temporary service interruption or rate limit.",
      fixed_code: codeInput
    };
  }
}
