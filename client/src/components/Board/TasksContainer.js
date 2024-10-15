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
import Comments from "./Comments";
import SettingsIcon from "@mui/icons-material/Settings";
import { Divider } from "@mui/material";

const TasksContainer = ({ socket }) => {
  const [tasks, setTasks] = useState({});
  const [open, setOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
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
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedTask(null);
  };

  return (
    <div className="container">
      <DragDropContext onDragEnd={handleDragEnd}>
        {Object.entries(tasks)?.map(([title, items]) => (
          <div className={`${title.toLowerCase()}__wrapper`} key={title}>
            <h3>
              {title === "pendingTasks"
                ? t("pendingTasks")
                : title === "ongoingTasks"
                ? t("ongoingTasks")
                : t("completedTasks")}
            </h3>
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
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`${title.toLowerCase()}__items`}
                            >
                              <p>{subitem.title}</p>
                              <p
                                className="comment"
                                onClick={() =>
                                  handleOpenComments({
                                    ...subitem,
                                    category: title,
                                  })
                                }
                                style={{ cursor: "pointer", color: "blue" }}
                              >
                                <SettingsIcon
                                  fontSize="medium"
                                  sx={{ color: "black" }}
                                />
                              </p>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              ) : (
                <p>Loading tasks...</p>
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
                <Typography variant="body1">
                  {selectedTask.description}
                </Typography>
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
