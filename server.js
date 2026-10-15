require('dotenv').config();
const express = require('express');
const path = require('path');
const https = require('https');

const app = express();
app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.static(path.join(__dirname)));

// Stop customer input from injecting HTML into the email
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

// Send email over HTTPS (port 443) using Resend.
// Render's free tier blocks SMTP ports (25/465/587), so Gmail/nodemailer can't connect.
async function sendEmail({ subject, html }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Brew-Den <onboarding@resend.dev>',
        to: [process.env.EMAIL_TO],
        subject,
        html
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Resend ${response.status}: ${text}`);
    }
  } finally {
    clearTimeout(timer);
  }
}

// Contact form route
app.post('/contact', async (req, res) => {
  const { name, email, message } = req.body;

  try {
    await sendEmail({
      subject: `New Contact Message from ${name}`,
      html: `
        <h3>New Contact Message</h3>
        <p><strong>Name:</strong> ${esc(name)}</p>
        <p><strong>Email:</strong> ${esc(email)}</p>
        <p><strong>Message:</strong> ${esc(message)}</p>
      `
    });
    res.json({ success: true, message: 'Message sent successfully!' });
  } catch (error) {
    console.log('Contact Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
});

// Order route
app.post('/order', async (req, res) => {
  const { item, price, name, email, phone } = req.body;

  try {
    await sendEmail({
      subject: `New Order — ${item}`,
      html: `
        <h3>New Order Received!</h3>
        <p><strong>Item:</strong> ${esc(item)}</p>
        <p><strong>Price:</strong> ${esc(price)}</p>
        <p><strong>Customer Name:</strong> ${esc(name)}</p>
        <p><strong>Customer Email:</strong> ${esc(email)}</p>
        <p><strong>Phone:</strong> ${esc(phone)}</p>
      `
    });
    res.json({ success: true, message: 'Order placed successfully!' });
  } catch (error) {
    console.log('Order Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to place order' });
  }
});

// Keep alive ping (only works while the server is awake; an external pinger is more reliable)
setInterval(() => {
  https.get('https://brew-den.onrender.com', () => {
    console.log('Keep alive ping sent');
  }).on('error', (err) => {
    console.log('Ping error:', err.message);
  });
}, 840000);

// Start server (Render provides the port via PORT)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Brew-Den server running on port ${PORT}`);
});