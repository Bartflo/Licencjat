import React from "react";
import AddTask from "./AddTask";
import { useState, useEffect } from "react";
import TasksContainer from "./TasksContainer";
import Nav from "./Nav";
import { removeJwtToken, getUserIdInSessionStorage } from "../auth/utils";
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
  const [boards, setBoards] = useState([]);
  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const userId = getUserIdInSessionStorage();
        const url = `http://localhost:4000/api/boards?userId=${userId}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        setBoards(data);
      } catch (error) {
        console.error("Error fetching boards:", error);
      }
    };

    fetchBoards();
  }, []);
  return (
    <div>
      <button onClick={handleLogout}>{t("logout")}</button>
      <Nav boards={boards} />

      <AddTask socket={socket} />
      <TasksContainer socket={socket} />
    </div>
  );
};

export default Task;
