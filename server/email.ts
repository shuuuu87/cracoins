import nodemailer from "nodemailer";

const GMAIL_USER = process.env.GMAIL_USER || "cracoins.team@gmail.com";
const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_PASS,
  },
});

function isEmailEnabled() {
  return !!GMAIL_PASS;
}

async function sendMail(to: string, subject: string, html: string) {
  if (!isEmailEnabled() || !to) return;
  try {
    await transporter.sendMail({
      from: `"CraCoins Challenge" <${GMAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error("[Email] Failed to send:", subject, err);
  }
}

const base = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8f8f8; margin: 0; padding: 0; }
    .container { max-width: 580px; margin: 32px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #f97316, #7c3aed); padding: 32px 32px 24px; text-align: center; }
    .header h1 { color: #fff; font-size: 28px; font-weight: 800; margin: 0; letter-spacing: 2px; text-transform: uppercase; }
    .header p { color: rgba(255,255,255,0.85); font-size: 13px; margin: 6px 0 0; }
    .body { padding: 32px; }
    .body h2 { font-size: 20px; font-weight: 700; color: #1a1a2e; margin: 0 0 12px; }
    .body p { font-size: 15px; color: #555; line-height: 1.6; margin: 0 0 16px; }
    .stat-row { display: flex; gap: 16px; margin: 20px 0; }
    .stat-box { flex: 1; background: #f5f5ff; border-radius: 12px; padding: 16px; text-align: center; }
    .stat-box .val { font-size: 24px; font-weight: 800; color: #7c3aed; }
    .stat-box .lbl { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
    .stat-box.orange .val { color: #f97316; }
    .alert { background: #fff5f5; border-left: 4px solid #ef4444; border-radius: 8px; padding: 14px 16px; margin: 16px 0; color: #c0392b; font-size: 14px; }
    .success { background: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 8px; padding: 14px 16px; margin: 16px 0; color: #166534; font-size: 14px; }
    .info { background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 14px 16px; margin: 16px 0; color: #1e40af; font-size: 14px; }
    .warning { background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 14px 16px; margin: 16px 0; color: #92400e; font-size: 14px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #f97316, #7c3aed); color: #fff; font-weight: 700; font-size: 15px; text-decoration: none; padding: 14px 32px; border-radius: 10px; margin: 12px 0; }
    .footer { background: #f0f0f0; padding: 18px 32px; text-align: center; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚡ CraCoins</h1>
      <p>Mech Arena No-Spend Challenge • Apr 24 – Aug 24, 2026</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      CraCoins Challenge · <a href="mailto:cracoins.team@gmail.com" style="color:#f97316;">cracoins.team@gmail.com</a><br>
      You're receiving this because you joined the CraCoins No-Spend Challenge.
    </div>
  </div>
</body>
</html>`;

export async function sendWelcomeEmail(to: string, username: string) {
  const html = base(`
    <h2>Welcome to the Challenge, ${username}! 🎮</h2>
    <p>You're officially part of the <strong>CraCoins No-Spend Challenge</strong> — 4 months of tracking your Mech Arena resources without spending a single coin.</p>
    <div class="success">Your account is active. The challenge runs from <strong>April 24 to August 24, 2026</strong>.</div>
    <p><strong>How it works:</strong><br>
    Submit a daily screenshot of your A-Coins and Credits balance. An admin will review and approve it. Track your growth on the leaderboard!</p>
    <p><strong>Rules reminder:</strong> Spending A-Coins = immediate disqualification. Credits spending above 4,000/day triggers a warning.</p>
    <p style="text-align:center"><a class="btn" href="https://cracoins.replit.app/dashboard">Go to Dashboard →</a></p>
  `);
  await sendMail(to, "⚡ Welcome to CraCoins Challenge!", html);
}

export async function sendSubmissionReceivedEmail(to: string, username: string, date: string, aCoins: number, credits: number) {
  const html = base(`
    <h2>Submission Received 📥</h2>
    <p>Hey <strong>${username}</strong>, your daily resource report for <strong>${date}</strong> has been received and is pending admin review.</p>
    <div class="stat-row">
      <div class="stat-box orange"><div class="val">${aCoins.toLocaleString()}</div><div class="lbl">A-Coins</div></div>
      <div class="stat-box"><div class="val">${credits.toLocaleString()}</div><div class="lbl">Credits</div></div>
    </div>
    <div class="info">Your submission will be reviewed shortly. You'll receive another email once it's approved or if there's an issue.</div>
  `);
  await sendMail(to, "📥 Daily Submission Received", html);
}

export async function sendApprovalEmail(to: string, username: string, date: string, aCoinChange: number, creditsChange: number) {
  const html = base(`
    <h2>Submission Approved! ✅</h2>
    <p>Great news, <strong>${username}</strong>! Your submission for <strong>${date}</strong> has been approved.</p>
    <div class="stat-row">
      <div class="stat-box orange"><div class="val">${aCoinChange >= 0 ? '+' : ''}${aCoinChange.toLocaleString()}</div><div class="lbl">A-Coins Change</div></div>
      <div class="stat-box"><div class="val">${creditsChange >= 0 ? '+' : ''}${creditsChange.toLocaleString()}</div><div class="lbl">Credits Change</div></div>
    </div>
    <div class="success">Keep it up! Your gains are recorded on the leaderboard.</div>
  `);
  await sendMail(to, "✅ Submission Approved!", html);
}

export async function sendRejectionEmail(to: string, username: string, date: string, reason?: string) {
  const html = base(`
    <h2>Submission Rejected ❌</h2>
    <p>Hey <strong>${username}</strong>, your submission for <strong>${date}</strong> was rejected by an admin.</p>
    ${reason ? `<div class="alert"><strong>Reason:</strong> ${reason}</div>` : '<div class="alert">Your screenshot did not meet the required format or was unclear.</div>'}
    <p>You can resubmit for the same date with a clearer screenshot. Make sure your full A-Coins and Credits balance is visible.</p>
  `);
  await sendMail(to, "❌ Submission Rejected", html);
}

export async function sendWarningEmail(to: string, username: string, creditsSpent: number) {
  const html = base(`
    <h2>⚠️ High Credit Spend Warning</h2>
    <p>Hey <strong>${username}</strong>, our system detected a significant credit spend in your latest submission.</p>
    <div class="warning"><strong>${creditsSpent.toLocaleString()} credits</strong> spent — this exceeds the 4,000 credit daily threshold. This is a warning, not a disqualification.</div>
    <p>If you continue spending at this rate, your performance on the leaderboard may be affected. Remember, this is a <strong>no-spend challenge</strong> — try to minimize spending!</p>
  `);
  await sendMail(to, "⚠️ High Credit Spend Detected", html);
}

export async function sendDisqualificationEmail(to: string, username: string, reason?: string) {
  const html = base(`
    <h2>Account Disqualified 🚫</h2>
    <p>We're sorry to inform you, <strong>${username}</strong>, that your account has been disqualified from the CraCoins Challenge.</p>
    ${reason ? `<div class="alert"><strong>Reason:</strong> ${reason}</div>` : '<div class="alert">A-Coins spending was detected in your submission, which violates challenge rules.</div>'}
    <p>Contact an admin if you believe this was a mistake. Your data remains visible but you will no longer appear on the active leaderboard.</p>
  `);
  await sendMail(to, "🚫 Challenge Disqualification", html);
}

export async function sendReinstatementEmail(to: string, username: string) {
  const html = base(`
    <h2>You've Been Reinstated! 🎉</h2>
    <p>Great news, <strong>${username}</strong>! An admin has reinstated your account. You are now an active participant again.</p>
    <div class="success">Your account is active. You can resume submitting daily screenshots.</div>
    <p>Welcome back to the challenge!</p>
  `);
  await sendMail(to, "🎉 Account Reinstated", html);
}

export async function sendAnnouncementEmail(recipients: string[], message: string) {
  if (!recipients.length) return;
  const html = base(`
    <h2>📢 Challenge Announcement</h2>
    <div class="info">${message}</div>
    <p>This is an official announcement from the CraCoins Challenge admins.</p>
  `);
  for (const to of recipients) {
    await sendMail(to, "📢 CraCoins Announcement", html);
  }
}

export async function sendMilestoneEmail(to: string, username: string, milestone: string) {
  const html = base(`
    <h2>🏅 Milestone Reached!</h2>
    <p>Incredible, <strong>${username}</strong>! You just hit a major milestone in the CraCoins Challenge.</p>
    <div class="success" style="text-align:center;font-size:20px;font-weight:700;">🏅 ${milestone}</div>
    <p>Keep pushing — you're one of the top performers in the challenge!</p>
  `);
  await sendMail(to, `🏅 Milestone: ${milestone}`, html);
}
