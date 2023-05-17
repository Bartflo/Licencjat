const express = require("express");
const app = express();
const cors = require("cors");
const http = require("http");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/user");
const Task = require("./models/task");

const { Server } = require("socket.io");
const PORT = 4000;
const server = http.createServer(app);

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

async function connect() {
  try {
    await mongoose.connect(process.env.uri);
    console.log("Connected to MongoDB");
  } catch (e) {
    console.log(e);
  }
}
connect();

const socketIO = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const fetchID = () => Math.random().toString(36).substring(2, 10);

let tasks = {
  pending: {
    title: "pending",
    items: [
      {
        id: fetchID(),
        title: "Send the Figma file to Dima",
        comments: [],
      },
    ],
  },
  ongoing: {
    title: "ongoing",
    items: [
      {
        id: fetchID(),
        title: "Review GitHub issues",
        comments: [
          {
            name: "David",
            text: "Ensure you review before merging",
            id: fetchID(),
          },
        ],
      },
    ],
  },
  completed: {
    title: "completed",
    items: [
      {
        id: fetchID(),
        title: "Create technical contents",
        comments: [
          {
            name: "Dima",
            text: "Make sure you check the requirements",
            id: fetchID(),
          },
        ],
      },
    ],
  },
};

socketIO.on("connection", (socket) => {
  console.log(`⚡: ${socket.id} user just connected!`);

  socket.on("createTask", (data) => {
    if (!data) {
      return console.error("No data provided for createTask event.");
    }

    const newTask = { title: data.task, comments: [] };

    Task.findOneAndUpdate(
      { "pending.title": "pending" },
      { $push: { "pending.items": newTask } },
      { new: true }
    )
      .then((updatedTask) => {
        const pendingTasks = [
          {
            title: "pending",
            items: updatedTask.pending.items,
          },
        ];
        const ongoingTasks = [
          {
            title: "ongoing",
            items: updatedTask.ongoing.items,
          },
        ];
        const completedTasks = [
          {
            title: "completed",
            items: updatedTask.completed.items,
          },
        ];
        socketIO.emit("tasks", {
          pendingTasks,
          ongoingTasks,
          completedTasks,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  });
  socket.on("taskDragged", async (data) => {
    const { source, destination } = data;

    try {
      let sourceTasks;
      let destinationTasks;

      if (source.columnName === "pendingTasks") {
        sourceTasks = await Task.findOneAndUpdate(
          { "pending.items._id": source.droppableId },
          { $pull: { "pending.items": { _id: source.droppableId } } },
          { new: true }
        ).select("pending.items");
      } else if (source.columnName === "ongoingTasks") {
        sourceTasks = await Task.findOneAndUpdate(
          { "ongoing.items._id": source.droppableId },
          { $pull: { "ongoing.items": { _id: source.droppableId } } },
          { new: true }
        ).select("ongoing.items");
      } else if (source.columnName === "completedTasks") {
        sourceTasks = await Task.findOneAndUpdate(
          { "completed.items._id": source.droppableId },
          { $pull: { "completed.items": { _id: source.droppableId } } },
          { new: true }
        ).select("completed.items");
      }

      if (destination.columnName === "ongoingTasks") {
        destinationTasks = await Task.findOneAndUpdate(
          { "ongoing.title": "ongoing" },
          {
            $push: {
              "ongoing.items": {
                $each: [{ _id: source.droppableId, title: source.title }],
                $position: destination.index,
              },
            },
          },
          { new: true }
        ).select("ongoing.items");
      } else if (destination.columnName === "completedTasks") {
        destinationTasks = await Task.findOneAndUpdate(
          { "completed.title": "completed" },
          {
            $push: {
              "completed.items": {
                $each: [{ _id: source.droppableId, title: source.title }],
                $position: destination.index,
              },
            },
          },
          { new: true }
        ).select("completed.items");
      } else if (destination.columnName === "pendingTasks") {
        destinationTasks = await Task.findOneAndUpdate(
          { "pending.title": "pending" },
          {
            $push: {
              "pending.items": {
                $each: [{ _id: source.droppableId, title: source.title }],
                $position: destination.index,
              },
            },
          },
          { new: true }
        ).select("pending.items");
      }

      if (!sourceTasks || !destinationTasks) {
        console.log("Tasks not found");
        return;
      }

      const tasks = await Task.find()
        .lean()
        .then((tasks) => {
          const pendingTasks = tasks.map((task) => {
            return {
              title: task.pending.title,
              items: task.pending.items,
            };
          });
          const ongoingTasks = tasks.map((task) => {
            return {
              title: task.ongoing.title,
              items: task.ongoing.items,
            };
          });
          const completedTasks = tasks.map((task) => {
            return {
              title: task.completed.title,
              items: task.completed.items,
            };
          });
          return { pendingTasks, ongoingTasks, completedTasks };
        })
        .catch((err) => {
          console.log(err);
          return null;
        });

      socketIO.emit("tasks", tasks);
    } catch (error) {
      console.error(error);
    }
  });
  socket.on("addComment", (data) => {
    const taskItems = tasks[data.category].items;
    for (let i = 0; i < taskItems.length; i++) {
      if (taskItems[i].id === data.id) {
        taskItems[i].comments.push({
          name: data.userId,
          text: data.comment,
          id: fetchID(),
        });
        socketIO.emit("comments", taskItems[i].comments);
      }
    }
  });
  socket.on("disconnect", () => {
    socket.disconnect();
    console.log("🔥: A user disconnected");
  });
});

const loginRegExp = /.{5,}/;
const passwordRegExp =
  /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;

app.post("/api/register", async (req, res) => {
  try {
    const isUserNameValid = loginRegExp.test(req.body.userName);
    const isPasswordValid = passwordRegExp.test(req.body.password);
    const newPassword = await bcrypt.hash(req.body.password, 10);
    if (isPasswordValid && isUserNameValid) {
      const user = await User.create({
        userName: req.body.userName,
        password: newPassword,
      });
      const token = jwt.sign(
        {
          userName: user.userName,
        },
        process.env.jwtkey
      );
      return res.json({ status: "ok", token: token, userName: user.userName });
    }
    if (!isUserNameValid) {
      res.status(400).json({ message: "wrong username" });
    }
    if (!isPasswordValid) {
      res.status(400).json({ message: "wrong password" });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "user already exists" });
  }
});
app.post("/api/login", async (req, res) => {
  try {
    const user = await User.findOne({
      userName: req.body.userName,
    });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(
      req.body.password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(400).json({ message: "Wrong password" });
    }
    if (isPasswordValid) {
      const token = jwt.sign(
        {
          userName: user.userName,
        },
        process.env.jwtkey
      );

      return res.json({ status: "ok", token: token, userName: user.userName });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "Something went wrong" });
  }
});

app.get("/api", (req, res) => {
  Task.find()
    .lean()
    .then((tasks) => {
      const pendingTasks = tasks.map((task) => {
        return {
          title: task.pending.title,
          items: task.pending.items,
        };
      });
      const ongoingTasks = tasks.map((task) => {
        return {
          title: task.ongoing.title,
          items: task.ongoing.items,
        };
      });
      const completedTasks = tasks.map((task) => {
        return {
          title: task.completed.title,
          items: task.completed.items,
        };
      });
      res.json({ pendingTasks, ongoingTasks, completedTasks });
    })
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
});

app.get("/api1", (req, res) => {
  res.json(tasks);
});

server.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
