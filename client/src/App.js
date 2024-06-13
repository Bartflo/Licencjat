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
const socket = socketIO.connect("http://localhost:4000");

function App() {
  const [activeLanguage, setActiveLanguage] = useState(getActiveLanguage());

  const [boards, setBoards] = useState([]);
  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const userId = getUserIdInSessionStorage();
        const url = `http://localhost:4000/api/boards?userId=${userId}`;
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
        }}
      >
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/board" element={<Board socket={socket} />} />
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
    <LanguageContext.Provider value={{ activeLanguage, setActiveLanguage }}>
      <BrowserRouter>{routes}</BrowserRouter>
    </LanguageContext.Provider>
  );
}

export default App;
