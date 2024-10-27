import React, { useState } from "react";
import AddTask from "./AddTask";
import TasksContainer from "./TasksContainer";
import { useParams } from "react-router-dom";
import "./board.css";
import { ManageUsersModal } from "./ManageUsersModal";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import { t } from "../../translations/utils";
import DeleteBoard from "./DeleteBoard";

const Board = ({ socket, users }) => {
  const { boardId } = useParams();

  const [openManageUsersModal, setOpenManageUsersModal] = useState(false);
  const [openAddTaskModal, setOpenAddTaskModal] = useState(false);
  const [openDeleteBoardModal, setOpenDeleteBoardModal] = useState(false);
  const handleClickOpenManageUsers = () => {
    setOpenManageUsersModal(true);
  };
  const handleCloseManageUsers = () => {
    setOpenManageUsersModal(false);
  };
  const handleClickOpenAddTask = () => {
    setOpenAddTaskModal(true);
  };
  const handleCloseAddTask = () => {
    setOpenAddTaskModal(false);
  };
  const handleClickDeleteBoard = () => {
    setOpenDeleteBoardModal(true);
  };
  const handleCloseDeleteBoard = () => {
    setOpenDeleteBoardModal(false);
  };
  return (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          marginTop: 5,
          gap: 2,
        }}
      >
        <Button
          variant="contained"
          color="primary"
          onClick={handleClickOpenAddTask}
        >
          {t("addNewTask")}
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleClickOpenManageUsers}
        >
          {t("manage-users")}
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleClickDeleteBoard}
        >
          {t("delete-workspace")}
        </Button>
      </Box>
      <AddTask
        socket={socket}
        open={openAddTaskModal}
        onClose={handleCloseAddTask}
      />
      <ManageUsersModal
        open={openManageUsersModal}
        boardId={boardId}
        onClose={handleCloseManageUsers}
        users={users}
      />
      <DeleteBoard
        open={openDeleteBoardModal}
        onClose={handleCloseDeleteBoard}
      />
      <TasksContainer socket={socket} boardId={boardId} />
    </>
  );
};

export default Board;
