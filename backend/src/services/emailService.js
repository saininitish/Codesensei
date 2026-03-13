import emailjs from '@emailjs/nodejs';
import * as dotenv from 'dotenv';
dotenv.config();

/**
 * Sends a notification email when a code review is completed.
 */
export async function sendCompletionEmail(userEmail, reviewScore, reviewId) {
  try {
    const templateParams = {
      to_email: userEmail,
      email: userEmail, // Compatibility fix
      score: reviewScore,
      review_url: `http://localhost:5173/review/${reviewId}`,
    };

    console.log(`[Email Mock] Sending completion email to ${userEmail} with EmailJS...`);
    
    // In a prod env, you would use secrets. We use the config provided in .env
    await emailjs.send(
      process.env.EMAILJS_SERVICE_ID,
      process.env.EMAILJS_TEMPLATE_ID,
      templateParams,
      {
        publicKey: process.env.EMAILJS_PUBLIC_KEY,
        privateKey: process.env.EMAILJS_PRIVATE_KEY
      }
    );
    
    return true;
  } catch (error) {
    console.error('Failed to send email via EmailJS:', error);
    return false;
  }
}

/**
 * Shares a detailed review report via email.
 */
export async function shareReportEmail(toEmail, reportData, userName = 'CodeSensei User') {
  try {
    const templateParams = {
      to_email: toEmail,
      email: toEmail, // Compatibility fix
      user_name: userName,
      score: reportData.scores.composite.toFixed(1),
      language: reportData.language,
      findings_count: reportData.findings.length,
      explanation: reportData.explanation,
      review_url: `http://localhost:5173/review/${reportData.id}`,
    };

    console.log(`[Email Mock] Sharing report to ${toEmail} via EmailJS...`);
    
    await emailjs.send(
      process.env.EMAILJS_SERVICE_ID,
      process.env.EMAILJS_TEMPLATE_ID,
      templateParams,
      {
        publicKey: process.env.EMAILJS_PUBLIC_KEY,
        privateKey: process.env.EMAILJS_PRIVATE_KEY
      }
    );
    
    return true;
  } catch (error) {
    console.error('Failed to share report via EmailJS:', error);
    return false;
  }
}
