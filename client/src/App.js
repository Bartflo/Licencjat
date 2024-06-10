import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { useState } from "react";
// import Comments from "./components/Comments";
import Task from "./components/Board/Task";
import { Login } from "./components/auth/Login";
import { Register } from "./components/auth/Register";
import socketIO from "socket.io-client";
import { LanguageContext } from "./contexts/LanguageContext";
import { getActiveLanguage } from "./translations/utils";
import { getJwtToken } from "./components/auth/utils";
const socket = socketIO.connect("http://localhost:4000");

function App() {
  const [activeLanguage, setActiveLanguage] = useState(getActiveLanguage());

  const user = getJwtToken();

  let routes;

  routes = user ? (
    <Routes>
      <Route path="/tasks" element={<Task socket={socket} />} />
      <Route path="*" element={<Navigate to="/tasks" />} />
    </Routes>
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
