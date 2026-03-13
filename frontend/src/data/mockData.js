// Mock data used across the app for fallback/demo purposes

export const MOCK_STATS = {
  totalReviews: 24,
  avgScore: 7.4,
  improvement: '+12%',
  scores: {
    bugs: 8.2,
    security: 6.8,
    performance: 7.5,
    readability: 6.5,
    best_practices: 8.0
  }
};

export const MOCK_REVIEW_RESULT = {
  id: "rev-8f92a1",
  language: "javascript",
  status: "completed",
  scores: {
    bugs: 7.5,
    security: 4.0,
    performance: 8.0,
    readability: 6.5,
    best_practices: 7.0,
    composite: 6.6
  },
  findings: [
    {
      id: 1,
      dimension: "security",
      severity: "high",
      line_start: 14,
      title: "SQL Injection Risk",
      description: "Raw user input is being concatenated directly into the database query string, exposing the application to injection attacks.",
      suggestion: "Use parameterized queries or prepared statements via your database driver.",
      standard_ref: "OWASP A03:2021"
    },
    {
      id: 2,
      dimension: "readability",
      severity: "medium",
      line_start: 42,
      line_end: 55,
      title: "High Cognitive Complexity",
      description: "This function contains 4 levels of nested loops and conditionals, making it difficult to maintain and test.",
      suggestion: "Extract the inner loops into separate, well-named helper functions.",
      standard_ref: "Airbnb 11.1"
    },
    {
      id: 3,
      dimension: "bugs",
      severity: "low",
      line_start: 89,
      title: "Missing Error Handling",
      description: "The Promise returned by fetch() does not have a .catch() block or try/catch around the await.",
      suggestion: "Wrap the asynchronous call in a try/catch block to handle network failures gracefully.",
      standard_ref: "Best Practices"
    }
  ],
  explanation: "This module handles the core user authentication flow and database insertion. It accepts incoming request payloads, validates the email format, and attempts to insert the new user record into the PostgreSQL database. While functionally complete, it lacks critical security measures for the database interaction.",
  original_code: `function createUser(req, res) {\n  const email = req.body.email;\n  const name = req.body.name;\n  \n  // Validate email\n  if(!email.includes('@')) return res.status(400).send('Invalid');\n\n  // Insert to DB\n  const query = "INSERT INTO users (name, email) VALUES ('" + name + "', '" + email + "')\";\n  db.execute(query);\n  \n  res.status(200).send('Success');\n}`,
  fixed_code: `async function createUser(req, res) {\n  const { email, name } = req.body;\n  \n  // Validate email\n  if (!email || !email.includes('@')) {\n    return res.status(400).send('Invalid email format');\n  }\n\n  try {\n    // Use parameterized query to prevent SQL injection\n    const query = "INSERT INTO users (name, email) VALUES ($1, $2)";\n    await db.execute(query, [name, email]);\n    \n    res.status(200).send('Success');\n  } catch (error) {\n    console.error('Database error:', error);\n    res.status(500).send('Internal Server Error');\n  }\n}`
};
