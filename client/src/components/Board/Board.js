import React from "react";
import AddTask from "./AddTask";
import TasksContainer from "./TasksContainer";
import { useParams } from "react-router-dom";
import "./board.css";

const Board = ({ socket }) => {
  const { boardId } = useParams();
  return (
    <>
      <AddTask socket={socket} />
      <TasksContainer socket={socket} boardId={boardId} />
    </>
  );
};

export default Board;
