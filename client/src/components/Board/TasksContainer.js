import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { t } from "../../translations/utils";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Comments from "./Comments";
import SettingsIcon from "@mui/icons-material/Settings";
import { Divider, Card, CardContent, IconButton } from "@mui/material";

const TasksContainer = ({ socket }) => {
  const [tasks, setTasks] = useState({});
  const [open, setOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [description, setDescription] = useState("");
  const { boardId } = useParams();

  useEffect(() => {
    function fetchTasks() {
      fetch(`http://localhost:4000/api/${boardId}`)
        .then((res) => res.json())
        .then((data) => setTasks(data));
    }
    fetchTasks();
  }, [boardId]);

  const handleDragEnd = ({ destination, source }) => {
    if (!destination) return;
    if (
      destination.index === source.index &&
      destination.droppableId === source.droppableId
    )
      return;

    const updatedTasks = { ...tasks };
    const sourceColumn = updatedTasks[source.droppableId];
    const draggedItem = sourceColumn.items.splice(source.index, 1)[0];
    const destinationColumn = updatedTasks[destination.droppableId];
    destinationColumn.items.splice(destination.index, 0, draggedItem);
    setTasks(updatedTasks);

    socket.emit("taskDragged", {
      source,
      destination,
      boardId,
    });
  };

  useEffect(() => {
    socket.on("tasks", (data) => {
      setTasks(data);
    });
  }, [socket]);

  const handleOpenComments = (task) => {
    setSelectedTask(task);
    setDescription(task.description);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedTask(null);
    setEditMode(false);
  };

  const handleEditDescription = () => {
    setEditMode(true);
  };

  const handleSaveDescription = async () => {
    try {
      const response = await fetch("http://localhost:4000/api/editTask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          boardId,
          taskId: selectedTask._id,
          description,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update task description");
      }

      const updatedTask = await response.json();
      setTasks((prevTasks) => {
        const updatedTasks = { ...prevTasks };
        const category = selectedTask.category;
        const taskIndex = updatedTasks[category].items.findIndex(
          (item) => item._id === selectedTask._id
        );
        updatedTasks[category].items[taskIndex] = updatedTask;
        return updatedTasks;
      });

      setEditMode(false);
    } catch (error) {
      console.error("Error updating task description:", error);
    }
  };

  const getCardColor = (category) => {
    switch (category) {
      case "pendingTasks":
        return "#909396";
      case "ongoingTasks":
        return "#03a9f4";
      case "completedTasks":
        return "#4caf50";
      default:
        return "#ffffff";
    }
  };

  return (
    <div className="container">
      <DragDropContext onDragEnd={handleDragEnd}>
        {Object.entries(tasks)?.map(([title, items]) => (
          <div className={`${title.toLowerCase()}__wrapper`} key={title}>
            <Typography variant="h5" gutterBottom>
              {title === "pendingTasks"
                ? t("pendingTasks")
                : title === "ongoingTasks"
                ? t("ongoingTasks")
                : t("completedTasks")}
            </Typography>
            <div className={`${title.toLowerCase()}__container`}>
              {items && items.items ? (
                <Droppable droppableId={title}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                      {items.items.map((subitem, subindex) => (
                        <Draggable
                          key={subitem._id}
                          draggableId={subitem._id}
                          index={subindex}
                        >
                          {(provided) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              sx={{
                                marginBottom: 2,
                                backgroundColor: getCardColor(title),
                              }}
                            >
                              <CardContent>
                                <Box
                                  display="flex"
                                  justifyContent="space-between"
                                >
                                  <Typography variant="subtitle2">
                                    {subitem.title}
                                  </Typography>
                                  <IconButton
                                    onClick={() =>
                                      handleOpenComments({
                                        ...subitem,
                                        category: title,
                                      })
                                    }
                                    sx={{ color: "primary" }}
                                  >
                                    <SettingsIcon fontSize="medium" />
                                  </IconButton>
                                </Box>
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              ) : (
                <Typography variant="body1">Loading tasks...</Typography>
              )}
            </div>
          </div>
        ))}
      </DragDropContext>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xl">
        <DialogTitle>
          {selectedTask ? selectedTask.title : "Comments"}
        </DialogTitle>
        <DialogContent>
          {selectedTask && (
            <Box display="flex" height="100%">
              <Box flex={1} p={2} borderRight="1px solid #ccc">
                <Typography variant="h6">{t("task-description")}</Typography>
                <Divider />
                {editMode ? (
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                ) : (
                  <Typography variant="body1">
                    {selectedTask.description}
                  </Typography>
                )}
                <Button
                  onClick={
                    editMode ? handleSaveDescription : handleEditDescription
                  }
                  variant="contained"
                  color="primary"
                  sx={{ marginTop: 2 }}
                >
                  {editMode ? t("submit") : t("edit")}
                </Button>
              </Box>

              <Box
                flex={1}
                p={2}
                style={{
                  overflowY: "auto",
                  maxHeight: "80vh",
                  scrollbarWidth: "none", // For Firefox
                  msOverflowStyle: "none", // For Internet Explorer and Edge
                }}
                sx={{
                  "&::-webkit-scrollbar": {
                    display: "none", // For Chrome, Safari, and Opera
                  },
                }}
              >
                <Comments
                  socket={socket}
                  boardId={boardId}
                  category={selectedTask.category}
                  id={selectedTask._id}
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>{t("close")}</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default TasksContainer;
