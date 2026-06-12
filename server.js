const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const session = require('express-session');

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

app.use(session({
  secret: 'someSecretKeyHere',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

app.use('/users', require('./routes/users')); 
app.use('/message', require('./routes/messages'));  // ADD THIS LINE

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected ✅');
    app.listen(3000, () => console.log('Server running on http://localhost:3000 🚀'));
  })
  .catch(err => console.error(err));