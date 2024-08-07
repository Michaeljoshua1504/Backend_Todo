const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://Cluster46831:d3lbcltXfUF8@cluster46831.jf4jkge.mongodb.net/todo';

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Failed to connect to MongoDB', err);
});

// ToDo Schema and Model
const todoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  completed: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const Todo = mongoose.model('Todo', todoSchema);

// User Schema and Model
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Middleware to get todo by date
async function getTodoByDate(req, res, next) {
  let todos;
  try {
    const date = new Date(req.params.date);
    todos = await Todo.find({ created_at: { $gte: date, $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000) } });
    if (todos.length === 0) {
      return res.status(404).json({ message: 'No todos found for this date' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
  res.todos = todos;
  next();
}

// Middleware to get todo by title (case-insensitive)
async function getTodoByTitle(req, res, next) {
  let todo;
  try {
    todo = await Todo.findOne({ title: { $regex: new RegExp(`^${req.params.title}$`, 'i') } });
    if (todo == null) {
      return res.status(404).json({ message: 'Cannot find todo' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
  res.todo = todo;
  next();
}

// ToDo Routes

// Get all todos
app.get('/api/todos', async (req, res) => {
  try {
    const todos = await Todo.find();
    res.json(todos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get todos by date
app.get('/api/todos/date/:date', getTodoByDate, (req, res) => {
  res.json(res.todos);
});

// Create a new todo
app.post('/api/todos', async (req, res) => {
  const todo = new Todo({
    title: req.body.title,
    description: req.body.description,
    completed: req.body.completed || false
  });
  try {
    const newTodo = await todo.save();
    res.status(201).json(newTodo);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a todo by title (case-insensitive)
app.patch('/api/todos/title/:title', async (req, res) => {
  try {
    const updatedTodo = await Todo.findOneAndUpdate(
      { title: { $regex: new RegExp(`^${req.params.title}$`, 'i') } },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedTodo) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    res.json(updatedTodo);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a todo by title (case-insensitive)
app.delete('/api/todos/title/:title', async (req, res) => {
  try {
    const result = await Todo.deleteOne({ title: { $regex: new RegExp(`^${req.params.title}$`, 'i') } });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    res.json({ message: 'Todo deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// User Routes

// Register a new user
app.post('/api/users/register', async (req, res) => {
  const user = new User({
    username: req.body.username,
    email: req.body.email,
    password: req.body.password
  });
  try {
    const newUser = await user.save();
    res.status(201).json(newUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// User login
app.post('/api/users/login', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user && user.password === req.body.password) {
      res.json({ message: 'Login successful', user });
    } else {
      res.status(400).json({ message: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
