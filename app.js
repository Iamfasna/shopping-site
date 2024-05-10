const express = require('express');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const session = require('express-session');

const createError = require('http-errors');

const hbs = require('express-handlebars');

const handlebars = require('handlebars');
// dotenv.config();

const adminRouter = require('./routes/admin');
const userRouter = require('./routes/user');

const app = express();


app.set('views', path.join(__dirname, 'views'));

const viewEngine = hbs.create({
  extname: 'hbs',
  defaultLayout: 'layout',
  layoutsDir: __dirname + '/views/layout/',
  partialsDir: __dirname + '/views/partials/'
});

app.engine('hbs', viewEngine.engine);
app.set('view engine', 'hbs');

handlebars.registerHelper('increment', function (value) {
  return value + 1;
});
app.use(session({
  secret: 'your-secret-key', // Replace with a secret key for session encryption
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 900000, // Adjust as needed
    httpOnly: true,
  },
}));


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(cookieParser());
app.use(session({
  secret: 'key',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false, // Set to true if using HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 1 day (adjust as needed)
  }
}));


// Define Handlebars helper function to convert image data to data URI
const Handlebars = require('handlebars');

Handlebars.registerHelper('imageDataURI', function (imageUrl, width, height) {
  if (!imageUrl || !imageUrl.data || !imageUrl.contentType) {
    return 'No Image Available';
  }

  const base64Image = imageUrl.data.toString('base64');
  const dataURI = `data:${imageUrl.contentType};base64,${base64Image}`;

  const imgTag = `<img src="${dataURI}" width="${width}" height="${height}">`;
  return new Handlebars.SafeString(imgTag);
});

// Routes
app.use('/admin', adminRouter);
app.use('/', userRouter);

// Catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// Error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

// Export the app and upload
module.exports = app;
