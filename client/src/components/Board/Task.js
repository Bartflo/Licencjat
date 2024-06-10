import React from "react";
import AddTask from "./AddTask";
import TasksContainer from "./TasksContainer";
import Nav from "./Nav";
import { removeJwtToken } from "../auth/utils";
import "./board.css";
import { t } from "../../translations/utils";
// import socketIO from "socket.io-client";

/*
👇🏻  Pass Socket.io into the required components
    where communications are made with the server
*/
// const socket = socketIO.connect("http://localhost:4000");

const Task = ({ socket }) => {
  const handleLogout = () => {
    removeJwtToken();
    window.location.reload();
  };
  return (
    <div>
      <button onClick={handleLogout}>{t("logout")}</button>
      <Nav />

      <AddTask socket={socket} />
      <TasksContainer socket={socket} />
    </div>
  );
};

export default Task;
