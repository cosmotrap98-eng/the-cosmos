const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, { cors: { origin: "*" } });
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcrypt");
const cors = require("cors");

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

mongoose.connect(process.env.MONGODB_URL);

const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  pfp: String
});

const MessageSchema = new mongoose.Schema({
  username: String,
  pfp: String,
  text: String,
  timestamp: Number
});

const User = mongoose.model("User", UserSchema);
const Message = mongoose.model("Message", MessageSchema);

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const exists = await User.findOne({ username });
  if (exists) return res.json({ error: "Username already exists" });

  const hashed = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hashed, pfp: "" });
  await user.save();
  res.json({ success: true });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.json({ error: "User not found" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.json({ error: "Wrong password" });

  res.json({ success: true, username, pfp: user.pfp });
});

app.post("/uploadPfp", upload.single("pfp"), async (req, res) => {
  const { username } = req.body;
  const filePath = "/uploads/" + req.file.filename;

  await User.updateOne({ username }, { pfp: filePath });
  res.json({ pfp: filePath });
});

io.on("connection", async (socket) => {
  const messages = await Message.find().sort({ timestamp: 1 }).limit(100);
  socket.emit("loadMessages", messages);

  socket.on("sendMessage", async (msg) => {
    const message = new Message(msg);
    await message.save();
    io.emit("newMessage", msg);
  });
});

http.listen(3000, () => console.log("Cosmos server running"));
