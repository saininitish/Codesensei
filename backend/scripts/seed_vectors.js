import { supabase } from '../src/services/supabaseClient.js';
import * as dotenv from 'dotenv';
dotenv.config();

const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY;

if (!VOYAGE_API_KEY) {
  console.error("Error: VOYAGE_API_KEY is missing in .env file.");
  process.exit(1);
}

const standards = {
    javascript: `
      --- [Universal Best Practices] ---
      - Do not embed secrets, passwords, or API keys in source code.
      - Validate and sanitize all user input before use.
      - Always handle errors and edge cases (null checks, type checks).
      - Write readable, self-documenting code with meaningful names.
      - Prefer immutability where possible; avoid unnecessary mutation.
      - Log errors with sufficient context for debugging.
      - Keep functions small and single-responsibility.
      --- [JavaScript / Airbnb Style Guide] ---
      - Use const by default; use let only when reassignment is needed. Never use var.
      - Prefer arrow functions for callbacks and anonymous functions.
      - Prefer template literals over string concatenation.
      - Use === instead of == for equality comparisons.
      - Use async/await over raw Promise chains for readability.
      - Destructure objects and arrays where it improves clarity.
      - Always add a .catch() or try/catch around async operations.
      - Avoid deeply nested callbacks (callback hell).
    `,
    typescript: `
      --- [Universal Best Practices] ---
      - Do not embed secrets, passwords, or API keys in source code.
      - Validate and sanitize all user input before use.
      - Always handle errors and edge cases (null checks, type checks).
      - Write readable, self-documenting code with meaningful names.
      - Prefer immutability where possible; avoid unnecessary mutation.
      - Log errors with sufficient context for debugging.
      - Keep functions small and single-responsibility.
      --- [TypeScript Best Practices] ---
      - Use const by default; avoid var.
      - Prefer explicit types over 'any'; use 'unknown' for truly unknown values.
      - Use interfaces or type aliases to define data shapes.
      - Leverage union and intersection types instead of overloading.
      - Enable strict mode (strict: true) in tsconfig.json.
      - Use readonly for properties that should not change.
      - Use optional chaining (?.) and nullish coalescing (??) to handle nulls safely.
      - Avoid non-null assertion (!) unless you are certain.
    `,
    python: `
      --- [Universal Best Practices] ---
      - Do not embed secrets, passwords, or API keys in source code.
      - Validate and sanitize all user input before use.
      - Always handle errors and edge cases (null checks, type checks).
      - Write readable, self-documenting code with meaningful names.
      - Prefer immutability where possible; avoid unnecessary mutation.
      - Log errors with sufficient context for debugging.
      - Keep functions small and single-responsibility.
      --- [Python PEP 8 Standards] ---
      - Use 4 spaces per indentation level; no tabs.
      - Limit lines to 79 characters for code, 72 for docstrings.
      - Use snake_case for variables and functions; PascalCase for classes.
      - Use type hints (def foo(x: int) -> str:) for public APIs.
      - Prefer list comprehensions and generators over explicit loops.
      - Use context managers (with) for file/resource handling.
      - Never use bare except clauses; catch specific exception types.
      - Write docstrings for all public modules, functions, and classes.
    `,
    java: `
      --- [Universal Best Practices] ---
      - Do not embed secrets, passwords, or API keys in source code.
      - Validate and sanitize all user input before use.
      - Always handle errors and edge cases (null checks, type checks).
      - Write readable, self-documenting code with meaningful names.
      - Prefer immutability where possible; avoid unnecessary mutation.
      - Log errors with sufficient context for debugging.
      - Keep functions small and single-responsibility.
      --- [Java Best Practices / Google Java Style Guide] ---
      - Use PascalCase for class names; camelCase for methods and variables.
      - Declare variables with the most restrictive scope (local > instance > static).
      - Prefer final for variables that should not be reassigned.
      - Use generics to ensure type safety with collections.
      - Always close resources (streams, connections) in finally blocks or use try-with-resources.
      - Avoid catching raw Exception; catch specific checked exceptions.
      - Override equals() and hashCode() together.
      - Prefer composition over inheritance.
      - Avoid null returns; prefer Optional<T> in Java 8+.
      - Every class should have a single responsibility.
    `,
    kotlin: `
      --- [Universal Best Practices] ---
      - Do not embed secrets, passwords, or API keys in source code.
      - Validate and sanitize all user input before use.
      - Always handle errors and edge cases (null checks, type checks).
      - Write readable, self-documenting code with meaningful names.
      - Prefer immutability where possible; avoid unnecessary mutation.
      - Log errors with sufficient context for debugging.
      - Keep functions small and single-responsibility.
      --- [Kotlin Coding Conventions] ---
      - Prefer val (immutable) over var wherever possible.
      - Use data class for classes that hold data.
      - Leverage null safety: use ? types and safe calls (?.) instead of null checks.
      - Use the Elvis operator (?:) for default values.
      - Prefer extension functions over utility classes.
      - Use when instead of chained if-else or switch for multi-branch logic.
      - Use coroutines and Flow instead of callbacks or RxJava for async code.
      - Avoid !! (not-null assertion) unless you are absolutely certain of non-null.
      - Use sealed classes for representing restricted class hierarchies.
    `,
    php: `
      --- [Universal Best Practices] ---
      - Do not embed secrets, passwords, or API keys in source code.
      - Validate and sanitize all user input before use.
      - Always handle errors and edge cases (null checks, type checks).
      - Write readable, self-documenting code with meaningful names.
      - Prefer immutability where possible; avoid unnecessary mutation.
      - Log errors with sufficient context for debugging.
      - Keep functions small and single-responsibility.
      --- [PHP PSR-12 / PHP Best Practices] ---
      - Use PHP 8+ features: named arguments, match expressions, nullsafe operator (?->).
      - Follow PSR-4 autoloading and PSR-12 coding style.
      - Use strict_types=1 declaration at the top of every file.
      - Prefer prepared statements for all database queries to prevent SQL injection.
      - Never output raw user input; always escape with htmlspecialchars().
      - Use password_hash() and password_verify() for password storage.
      - Avoid eval(); never pass user data to it.
      - Use type declarations for function parameters and return types.
      - Use Composer for dependency management.
    `,
    go: `
      --- [Universal Best Practices] ---
      - Do not embed secrets, passwords, or API keys in source code.
      - Validate and sanitize all user input before use.
      - Always handle errors and edge cases (null checks, type checks).
      - Write readable, self-documenting code with meaningful names.
      - Prefer immutability where possible; avoid unnecessary mutation.
      - Log errors with sufficient context for debugging.
      - Keep functions small and single-responsibility.
      --- [Go Best Practices / Effective Go] ---
      - Return errors explicitly; never silently ignore error return values.
      - Use gofmt to format all code consistently.
      - Use short variable declarations (:=) in function scope.
      - Prefer composition via struct embedding over inheritance.
      - Keep interfaces small (1–3 methods); accept interfaces, return structs.
      - Use goroutines and channels for concurrency; avoid shared mutable state.
      - Handle panics with recover only at program boundaries.
      - Use context.Context for cancellation and deadlines in long-running operations.
      - Write table-driven tests using testing.T.
    `,
    rust: `
      --- [Universal Best Practices] ---
      - Do not embed secrets, passwords, or API keys in source code.
      - Validate and sanitize all user input before use.
      - Always handle errors and edge cases (null checks, type checks).
      - Write readable, self-documenting code with meaningful names.
      - Prefer immutability where possible; avoid unnecessary mutation.
      - Log errors with sufficient context for debugging.
      - Keep functions small and single-responsibility.
      --- [Rust Best Practices] ---
      - Prefer owned types; use references (&) to borrow instead of cloning unnecessarily.
      - Use Result<T, E> for fallible operations — never unwrap() in production code.
      - Use Option<T> instead of null; always handle None explicitly.
      - Avoid unsafe blocks; if used, document exactly why it is safe.
      - Use iterators and combinators instead of manual loops where idiomatic.
      - Leverage the type system to make invalid states unrepresentable.
      - Run clippy and address all warnings before committing.
      - Use Arc<Mutex<T>> only when shared mutable state is truly needed.
    `,
    cpp: `
      --- [Universal Best Practices] ---
      - Do not embed secrets, passwords, or API keys in source code.
      - Validate and sanitize all user input before use.
      - Always handle errors and edge cases (null checks, type checks).
      - Write readable, self-documenting code with meaningful names.
      - Prefer immutability where possible; avoid unnecessary mutation.
      - Log errors with sufficient context for debugging.
      - Keep functions small and single-responsibility.
      --- [C++ Core Guidelines / Modern C++] ---
      - Use smart pointers (unique_ptr, shared_ptr) instead of raw new/delete.
      - Prefer RAII: tie resource lifetimes to object lifetimes.
      - Use const wherever a variable should not be modified.
      - Use nullptr instead of NULL or 0 for pointers.
      - Prefer range-based for loops and STL algorithms over raw loop indexing.
      - Avoid C-style casts; use static_cast, dynamic_cast, const_cast appropriately.
      - Mark single-argument constructors explicit to prevent implicit conversions.
      - Use noexcept on functions that should not throw.
      - Initialise all variables at the point of declaration.
    `,
};

async function getVoyageEmbeddings(texts) {
  const response = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${VOYAGE_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      input: texts,
      model: "voyage-3" // Voyage 3 outputs 1024 dimensions
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Voyage API error: ${response.status} ${errText}`);
  }

  const result = await response.json();
  // Returns an array of embedding objects matching the input array order
  return result.data.map(d => d.embedding);
}

async function seedDatabase() {
  if (!supabase) {
    console.error('❌ Error: Supabase is not configured properly.');
    console.error('Please add your real SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to backend/.env');
    process.exit(1);
  }

  console.log('Clearing existing coding_standards to prevent duplicates...');
  await supabase.from('coding_standards').delete().neq('language', 'dummy');

  console.log('Seeding Supabase pgvector database using Voyage AI in a single batch request...');

  const languages = Object.keys(standards);
  const texts = Object.values(standards);

  try {
    const embeddings = await getVoyageEmbeddings(texts);
    
    const records = languages.map((lang, index) => ({
      language: lang,
      content: texts[index],
      embedding: embeddings[index]
    }));

    console.log(`Inserting ${records.length} records into Supabase...`);
    const { error } = await supabase.from('coding_standards').insert(records);

    if (error) {
      console.error('Error inserting records:', error.message);
    } else {
      console.log('Successfully seeded all coding standards!');
    }
  } catch (err) {
    console.error('Failed to process batch embeddings:', err);
  }

  console.log('Done seeding!');
}

seedDatabase();
