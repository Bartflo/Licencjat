const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    unique: true,
    required: true,
    collation: { locale: "en", strength: 2 },
  },
  password: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);
module.exports = User;
