const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TodoSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  completed: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Middleware to update the updated_at field on save
TodoSchema.pre('save', function (next) {
  this.updated_at = Date.now();
  next();
});

// Create and export the Todo model
module.exports = mongoose.model('Todo', TodoSchema);
