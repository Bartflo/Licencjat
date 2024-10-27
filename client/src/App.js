import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
// import Comments from "./components/Comments";
import Board from "./components/board/Board";
import { Login } from "./components/auth/Login";
import { Register } from "./components/auth/Register";
import { Dashboard } from "./components/dashboard/Dashboard";
import { Navigation } from "./components/navigation/navigation";
import socketIO from "socket.io-client";
import { LanguageContext } from "./contexts/LanguageContext";
import { getActiveLanguage } from "./translations/utils";
import {
  getJwtToken,
  getUserIdInSessionStorage,
} from "./components/auth/utils";
import { Box } from "@mui/material";
import ThemeContextProvider from "./contexts/ThemeContext";
import { ThemeContext } from "./contexts/ThemeContext";
const socket = socketIO.connect("http://localhost:4000");

function App() {
  const [activeLanguage, setActiveLanguage] = useState(getActiveLanguage());

  const [boards, setBoards] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const userId = getUserIdInSessionStorage();
        const url = `http://localhost:4000/api/userBoards?userId=${userId}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Network response was not ok fetching user boards");
        }
        const data = await response.json();
        setBoards(data);
      } catch (error) {
        console.error("Error fetching user boards: ", error);
      }
    };
    fetchBoards();
  }, []);
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const url = "http://localhost:4000/api/users";
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Network response was not ok fetching users");
        }
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users: ", error);
      }
    };
    fetchUsers();
  }, []);

  const user = getJwtToken();
  let routes;

  routes = user ? (
    <Box sx={{ display: "flex" }}>
      <Navigation boards={boards} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: "background.default",
          p: 3,
          paddingTop: "64px",
        }}
      >
        <Routes>
          <Route path="/dashboard" element={<Dashboard users={users} />} />
          <Route
            path="/board/:boardId"
            element={<Board socket={socket} users={users} />}
          />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Box>
    </Box>
  ) : (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );

  return (
    <ThemeContextProvider>
      <LanguageContext.Provider value={{ activeLanguage, setActiveLanguage }}>
        <BrowserRouter>{routes}</BrowserRouter>
      </LanguageContext.Provider>
    </ThemeContextProvider>
  );
}

export default App;
