import * as dotenv from 'dotenv';
dotenv.config();

/**
 * Returns language-specific coding standards context for the LLM prompt.
 * In production this would query a FAISS vector store via Voyage AI embeddings.
 */
export async function getRelevantCodingStandards(codeInput, language) {
  try {
    console.log(`[RAG] Retrieving coding standards for language: ${language}`);
    return getStandardsForLanguage(language);
  } catch (error) {
    console.error('Error in RAG service:', error);
    return '';
  }
}

function getStandardsForLanguage(language) {
  const lang = (language || 'javascript').toLowerCase();

  const common = `
    --- [Universal Best Practices] ---
    - Do not embed secrets, passwords, or API keys in source code.
    - Validate and sanitize all user input before use.
    - Always handle errors and edge cases (null checks, type checks).
    - Write readable, self-documenting code with meaningful names.
    - Prefer immutability where possible; avoid unnecessary mutation.
    - Log errors with sufficient context for debugging.
    - Keep functions small and single-responsibility.
  `;

  const standards = {
    javascript: `
      ${common}
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
      ${common}
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
      ${common}
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
      ${common}
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
      ${common}
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
      ${common}
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
      ${common}
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
      ${common}
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
      ${common}
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

  return standards[lang] || `${common}\n--- [${language} General Standards] ---\nFollow language-specific best practices and conventions for ${language}. Ensure code is readable, secure, and performant.`;
}
