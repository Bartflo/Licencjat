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
const ObjectId = mongoose.Types.ObjectId;

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

  socket.on("createTask", async (data) => {
    console.log(data);
    if (!data || !data.boardId || !data.task) {
      return console.error("Invalid data provided for createTask event.");
    }

    const { boardId, task } = data;
    const newTask = { title: task, comments: [] };

    try {
      const updatedTask = await Task.findOneAndUpdate(
        { _id: boardId, "pending.title": "pending" },
        { $push: { "pending.items": newTask } },
        { new: true }
      ).select("pending.items ongoing.items completed.items");

      if (!updatedTask) {
        console.error(`Task not found for boardId: ${boardId}`);
        return;
      }

      const pendingTasks = {
        title: "pending",
        items: updatedTask.pending.items,
      };

      const ongoingTasks = {
        title: "ongoing",
        items: updatedTask.ongoing.items,
      };

      const completedTasks = {
        title: "completed",
        items: updatedTask.completed.items,
      };

      socketIO.emit("tasks", {
        pendingTasks,
        ongoingTasks,
        completedTasks,
      });
    } catch (error) {
      console.error("Error in createTask:", error);
    }
  });
  socket.on("taskDragged", async (data) => {
    const { source, destination, boardId } = data;

    try {
      // Pobieramy aktualne zadania z tablicami items
      const board = await Task.findById(boardId).lean();

      // Sprawdzamy, czy mamy poprawnie załadowane zadania
      if (!board) {
        console.log("Board not found");
        return;
      }

      // Wybieramy odpowiednie źródło i cel
      let sourceItems, destinationItems;
      switch (source.droppableId) {
        case "pendingTasks":
          sourceItems = board.pending.items;
          break;
        case "ongoingTasks":
          sourceItems = board.ongoing.items;
          break;
        case "completedTasks":
          sourceItems = board.completed.items;
          break;
        default:
          console.log("Invalid source droppableId");
          return;
      }

      switch (destination.droppableId) {
        case "pendingTasks":
          destinationItems = board.pending.items;
          break;
        case "ongoingTasks":
          destinationItems = board.ongoing.items;
          break;
        case "completedTasks":
          destinationItems = board.completed.items;
          break;
        default:
          console.log("Invalid destination droppableId");
          return;
      }

      // Wybieramy przenoszone zadanie na podstawie indexu źródła
      const [movedItem] = sourceItems.splice(source.index, 1);

      // Dodajemy przeniesione zadanie do odpowiedniego miejsca w celu
      destinationItems.splice(destination.index, 0, movedItem);

      // Aktualizujemy zadanie w bazie danych
      await Task.findByIdAndUpdate(boardId, board);

      const tasks = await Task.findOne({ _id: boardId })
        .lean()
        .select("pending ongoing completed")
        .then((data) => {
          const pendingTasks = {
            title: "pending",
            items: data.pending.items,
          };

          const ongoingTasks = {
            title: "ongoing",
            items: data.ongoing.items,
          };

          const completedTasks = {
            title: "completed",
            items: data.completed.items,
          };

          return {
            pendingTasks,
            ongoingTasks,
            completedTasks,
          };
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
      return res.json({
        status: "ok",
        token: token,
        userName: user.userName,
        userId: user._id,
      });
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

      return res.json({
        status: "ok",
        token: token,
        userName: user.userName,
        userId: user._id,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "Something went wrong" });
  }
});
app.get("/api/userBoards", async (req, res) => {
  try {
    const userId = req.query.userId;
    const boards = await Task.find({ users: userId }).select("boardName");
    res.status(200).json(boards);
  } catch (error) {
    res.status(400).json({ message: "Cannot get boards" });
  }
});
app.get("/api/boardUsers", async (req, res) => {
  try {
    const boardId = req.query.boardId;

    const board = await Task.findById(boardId).select("users");

    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    const userIds = board.users.map((user) => user);
    console.log(userIds);
    const users = await User.find({ _id: { $in: userIds } }, "userName _id");

    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Cannot get users for the board" });
  }
});
app.delete("/api/boardUsers", async (req, res) => {
  try {
    const { boardId, userId } = req.body;

    if (!boardId || !userId) {
      return res
        .status(400)
        .json({ message: "Board ID and User ID are required" });
    }

    const board = await Task.findByIdAndUpdate(
      boardId,
      { $pull: { users: userId } },
      { new: true }
    );

    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    res.status(200).json({ message: "User removed from the board", board });
  } catch (error) {
    console.error("Error removing user from board: ", error);
    res.status(500).json({ message: "Cannot remove user from the board" });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find({}, "userName _id");
    res.json(users);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get("/api/:boardId", (req, res) => {
  const { boardId } = req.params;
  if (!ObjectId.isValid(boardId)) {
    return res.status(400).send("Invalid board ID");
  }

  Task.findById(new ObjectId(boardId))
    .lean()
    .then((task) => {
      if (!task) {
        return res.sendStatus(404);
      }

      const pendingTasks = {
        title: task.pending.title,
        items: task.pending.items,
      };
      const ongoingTasks = {
        title: task.ongoing.title,
        items: task.ongoing.items,
      };
      const completedTasks = {
        title: task.completed.title,
        items: task.completed.items,
      };

      res.json({ pendingTasks, ongoingTasks, completedTasks });
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
});

server.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
