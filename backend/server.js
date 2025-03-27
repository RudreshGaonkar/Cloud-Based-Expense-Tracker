require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

const userRoutes = require('./routes/userRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const reportRoutes = require('./routes/reportRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
const PORT = process.env.PORT || 8080 || 5000;


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: 'mysecretkey', 
  resave: false,
  saveUninitialized: false, 
  cookie: { secure: false, maxAge: 3600000 }
}));

app.use('/api/dashboard', dashboardRoutes);



app.use(express.static(path.join(__dirname, '../frontend'))); 
app.use('/assets', express.static(path.join(__dirname, '../frontend/assets')));  
app.use('/pages', express.static(path.join(__dirname, '../frontend/pages')));


app.use((req, res, next) => {
  if (req.path.endsWith('.css')) res.type('text/css');
  if (req.path.endsWith('.js')) res.type('application/javascript');
  next();
});


app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/reports', reportRoutes);

app.get('*', (req, res) => {
  if (req.path.startsWith('/assets/') || req.path.startsWith('/pages/')) {
    return res.status(404).send('File not found');
  }
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.use((req, res, next) => {
  if (req.path.startsWith('/api/') && !req.session.user) {
    return res.status(401).json({ message: "Unauthorized. Please log in again." });
  }
  next();
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
