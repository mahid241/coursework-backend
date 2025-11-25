const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const lessons = [
  { id: 1, topic: 'Math', location: 'London', price: 100, spaces: 5 },
  { id: 2, topic: 'Science', location: 'Paris', price: 80, spaces: 5 },
  { id: 3, topic: 'History', location: 'Dubai', price: 90, spaces: 5 },
  { id: 4, topic: 'Art', location: 'Tokyo', price: 120, spaces: 5 },
];

app.get('/lessons', (req, res) => {
  res.json(lessons);
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
