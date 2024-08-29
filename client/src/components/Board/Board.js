import React, { useState } from "react";
import AddTask from "./AddTask";
import TasksContainer from "./TasksContainer";
import { useParams } from "react-router-dom";
import "./board.css";
import { ManageUsersModal } from "./ManageUsersModal";
import Button from "@mui/material/Button";

const Board = ({ socket, users }) => {
  const { boardId } = useParams();

  const [openModal, setOpenModal] = useState(false);
  const handleClickOpen = () => {
    setOpenModal(true);
  };
  const handleClose = () => {
    setOpenModal(false);
  };
  return (
    <>
      <AddTask socket={socket} />
      <Button variant="contained" color="primary" onClick={handleClickOpen}>
        Otwórz modal
      </Button>
      <ManageUsersModal
        open={openModal}
        boardId={boardId}
        onClose={handleClose}
        users={users}
      />
      <TasksContainer socket={socket} boardId={boardId} />
    </>
  );
};

export default Board;
