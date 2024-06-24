const express = require('express');
const bodyParser = require('body-parser');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));

let users = {};

app.get('/', (req, res) => {
  res.render('login');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (users[username]) {
    return res.send('User already exists. Please choose a different username.');
  }

  const secret = speakeasy.generateSecret({ length: 20 });
  users[username] = {
    username,
    password,
    secret: secret.base32,
  };

  qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
    res.render('verify', { qrCode: data_url, secret: secret.base32, username });
  });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users[username];
  if (user && user.password === password) {
    res.render('token', { username });
  } else {
    res.send('Invalid username or password');
  }
});

app.post('/verify', (req, res) => {
  const { token, username } = req.body;
  const user = users[username];
  const verified = speakeasy.totp.verify({
    secret: user.secret,
    encoding: 'base32',
    token,
  });

  if (verified) {
    res.redirect('/success');
  } else {
    res.send('Invalid token, verification failed.');
  }
});

app.get('/success', (req, res) => {
  res.render('success');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
