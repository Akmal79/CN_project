const express = require('express');
const bodyParser = require('body-parser');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));

let user = {
  username: 'user',
  password: 'password',
  temp_secret: '',
  secret: '',
};

app.get('/', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === user.username && password === user.password) {
    const secret = speakeasy.generateSecret({ length: 20 });
    user.temp_secret = secret.base32;

    qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
      res.render('verify', { qrCode: data_url, secret: secret.base32 });
    });
  } else {
    res.send('Invalid username or password');
  }
});

app.post('/verify', (req, res) => {
  const { token } = req.body;
  const verified = speakeasy.totp.verify({
    secret: user.temp_secret,
    encoding: 'base32',
    token,
  });

  if (verified) {
    user.secret = user.temp_secret;
    user.temp_secret = '';
    res.send('2FA verification successful!');
  } else {
    res.send('Invalid token, verification failed.');
  }
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
