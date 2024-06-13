import React from "react";
import AddTask from "./AddTask";
import TasksContainer from "./TasksContainer";
import "./board.css";

const Board = ({ socket }) => {
  return (
    <>
      <AddTask socket={socket} />
      <TasksContainer socket={socket} />
    </>
  );
};

export default Board;
