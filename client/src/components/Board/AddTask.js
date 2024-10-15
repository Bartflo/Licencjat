import React, { useState } from "react";
import { t } from "../../translations/utils";
import { useParams } from "react-router-dom";
import {
  Button,
  Dialog,
  DialogContent,
  TextField,
  DialogTitle,
  Box,
} from "@mui/material";
const AddTask = ({ socket, open, onClose }) => {
  const [task, setTask] = useState("");
  const [description, setDescription] = useState("");
  const { boardId } = useParams();
  const handleAddTodo = (e) => {
    e.preventDefault();
    //👇🏻 sends the task to the Socket.io server
    socket.emit("createTask", { task, description, boardId });
    setTask("");
    setDescription("");
    onClose();
  };
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{t("addNewTask")}</DialogTitle>
      <DialogContent>
        <form onSubmit={handleAddTodo}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              sx={{ marginTop: 2 }}
              id="task"
              label={t("task-name")}
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder={t("content")}
            />
            <TextField
              id="description"
              label={t("description")}
              placeholder={t("content")}
              multiline
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Box>
          <Box sx={{ display: "flex", justifyContent: "center", marginTop: 2 }}>
            <Button type="submit" variant="contained" color="primary">
              {t("add")}
            </Button>
          </Box>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTask;
