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

socketIO.on("connection", (socket) => {
  console.log(`⚡: ${socket.id} user just connected!`);

  socket.on("createTask", async (data) => {
    if (!data || !data.boardId || !data.task) {
      return console.error("Invalid data provided for createTask event.");
    }

    const { boardId, task, description } = data;
    const newTask = { title: task, description: description, comments: [] };

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
      const board = await Task.findById(boardId).lean();
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
  socket.on("addComment", async (data) => {
    const { boardId, category, id, comment, userId } = data;
    const trimmedCategory = category.replace("Tasks", "").toLowerCase(); // "pendingTasks" -> "pending"

    try {
      const taskBoard = await Task.findOne({
        _id: boardId,
        [`${trimmedCategory}.items._id`]: id,
      });

      if (!taskBoard) {
        console.error("Task board not found:", data);
        return;
      }

      const updatedTask = await Task.findOneAndUpdate(
        { [`${trimmedCategory}.items._id`]: id },
        {
          $push: {
            [`${trimmedCategory}.items.$.comments`]: {
              name: userId,
              text: comment,
            },
          },
        },
        { new: true }
      );

      const taskComments = updatedTask[trimmedCategory].items.find(
        (item) => item._id.toString() === id
      ).comments;

      socket.emit("comments", taskComments);
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  });
  socket.on("fetchComments", async (data) => {
    const { boardId, category, id } = data;

    const trimmedCategory = category.replace("Tasks", "").toLowerCase(); // "pendingTasks" -> "pending"

    try {
      const taskBoard = await Task.findOne({
        _id: boardId,
        [`${trimmedCategory}.items._id`]: id,
      });
      if (!taskBoard) {
        console.error("Task not found");
        return;
      }

      const taskComments = taskBoard[trimmedCategory].items.find(
        (item) => item._id.toString() === id
      ).comments;

      socket.emit("comments", taskComments);
    } catch (error) {
      console.error("Error fetching comments:", error);
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
app.post("/api/editTask", async (req, res) => {
  const { boardId, taskId, description } = req.body;

  if (!boardId || !taskId || !description) {
    return res.status(400).json({ message: "Invalid data provided" });
  }

  try {
    const taskBoard = await Task.findOneAndUpdate(
      { _id: boardId, "pending.items._id": taskId },
      { $set: { "pending.items.$.description": description } },
      { new: true }
    );

    if (!taskBoard) {
      const taskBoardOngoing = await Task.findOneAndUpdate(
        { _id: boardId, "ongoing.items._id": taskId },
        { $set: { "ongoing.items.$.description": description } },
        { new: true }
      );

      if (!taskBoardOngoing) {
        const taskBoardCompleted = await Task.findOneAndUpdate(
          { _id: boardId, "completed.items._id": taskId },
          { $set: { "completed.items.$.description": description } },
          { new: true }
        );

        if (!taskBoardCompleted) {
          return res.status(404).json({ message: "Task not found" });
        }

        return res.json(
          taskBoardCompleted.completed.items.find(
            (item) => item._id.toString() === taskId
          )
        );
      }

      return res.json(
        taskBoardOngoing.ongoing.items.find(
          (item) => item._id.toString() === taskId
        )
      );
    }

    return res.json(
      taskBoard.pending.items.find((item) => item._id.toString() === taskId)
    );
  } catch (error) {
    console.error("Error updating task description:", error);
    res.status(500).json({ message: "Error updating task description" });
  }
});
app.post("/api/createBoard", async (req, res) => {
  try {
    const { boardName, users } = req.body;

    if (!boardName || !users || users.length === 0) {
      return res
        .status(400)
        .json({ message: "Board name and users are required" });
    }

    const newBoard = new Task({
      boardName,
      pending: {
        title: "pending",
        items: [],
      },
      ongoing: {
        title: "ongoing",
        items: [],
      },
      completed: {
        title: "completed",
        items: [],
      },
      users,
    });
    const savedBoard = await newBoard.save();
    res.status(201).json({
      message: "Board created successfully",
      board: {
        _id: savedBoard._id,
        boardName: savedBoard.boardName,
        pending: savedBoard.pending,
        ongoing: savedBoard.ongoing,
        completed: savedBoard.completed,
        users: savedBoard.users,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating board", error: error.message });
  }
});
app.delete("/api/deleteBoard/:boardId", async (req, res) => {
  const { boardId } = req.params;
  const userId = req.body.userId;

  if (!boardId || !userId) {
    return res.status(400).json({ message: "Invalid data provided" });
  }

  try {
    const board = await Task.findById(boardId);

    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    if (board.users[0].toString() !== userId) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this board" });
    }

    await Task.findByIdAndDelete(boardId);

    socketIO.emit("boardDeleted", { boardId });
    res.json({ message: "Board deleted successfully" });
  } catch (error) {
    console.error("Error deleting board:", error);
    res.status(500).json({ message: "Error deleting board" });
  }
});
app.get("/api/userBoards", async (req, res) => {
  try {
    const userId = req.query.userId;
    const boards = await Task.find({ users: userId }).select(
      "boardName pending ongoing completed"
    );
    const boardDetails = boards.map((board) => ({
      _id: board._id,
      boardName: board.boardName,
      pending: board.pending.items.length,
      ongoing: board.ongoing.items.length,
      completed: board.completed.items.length,
    }));
    res.status(200).json(boardDetails);
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
    const userIds = board.users.map((user) => user.toString());
    const users = await User.find({ _id: { $in: userIds } }).lean();
    const userMap = new Map(users.map((user) => [user._id.toString(), user]));
    const sortedUsers = userIds.map((userId) => userMap.get(userId));

    const result = sortedUsers.map((user) => ({
      _id: user._id,
      userName: user.userName,
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching users for the board: ", error);
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
app.post("/api/boardUsers/add", async (req, res) => {
  try {
    const { boardId, users } = req.body;

    if (!boardId || !Array.isArray(users) || users.length === 0) {
      return res
        .status(400)
        .json({ message: "Board ID and users are required" });
    }

    const board = await Task.findByIdAndUpdate(
      boardId,
      { $addToSet: { users: { $each: users } } },
      { new: true }
    );
    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    res.status(200).json({ message: "Users added to the board", board });
  } catch (error) {
    console.error("Error adding users to board: ", error);
    res.status(500).json({ message: "Cannot add users to the board" });
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
