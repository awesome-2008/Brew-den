require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');
const https = require('https');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Contact form route
app.post('/contact', async (req, res) => {
  const { name, email, message } = req.body;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_TO,
      subject: `New Contact Message from ${name}`,
      html: `
        <h3>New Contact Message</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong> ${message}</p>
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
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_TO,
      subject: `New Order — ${item}`,
      html: `
        <h3>New Order Received!</h3>
        <p><strong>Item:</strong> ${item}</p>
        <p><strong>Price:</strong> ${price}</p>
        <p><strong>Customer Name:</strong> ${name}</p>
        <p><strong>Customer Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
      `
    });
    res.json({ success: true, message: 'Order placed successfully!' });
  } catch (error) {
    console.log('Order Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to place order' });
  }
});

// Keep alive ping
setInterval(() => {
  https.get('https://brew-den.onrender.com', (res) => {
    console.log('Keep alive ping sent');
  }).on('error', (err) => {
    console.log('Ping error:', err.message);
  });
}, 840000);

// Start server
app.listen(3000, () => {
  console.log('Brew-Den server running on http://localhost:3000');
});