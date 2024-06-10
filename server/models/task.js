const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  name: { type: String },
  text: { type: String },
});

const itemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  comments: [commentSchema],
});

const taskSchema = new mongoose.Schema({
  boardName: { type: String, required: true },
  pending: {
    title: { type: String, default: "pending" },
    items: [itemSchema],
  },
  ongoing: {
    title: { type: String, default: "ongoing" },
    items: [itemSchema],
  },
  completed: {
    title: { type: String, default: "completed" },
    items: [itemSchema],
  },
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

const Task = mongoose.model("Task", taskSchema);
module.exports = Task;
