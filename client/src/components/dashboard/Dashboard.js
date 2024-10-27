import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import { getUserIdInSessionStorage } from "../auth/utils";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  Typography,
  CardActions,
  Button,
  IconButton,
} from "@mui/material";
import { t } from "../../translations/utils";
import AddBoard from "./AddBoard";
import { AddCircleOutline } from "@mui/icons-material";

export const Dashboard = ({ users }) => {
  const [boards, setBoards] = useState([]);
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

  const [openAddBoardModal, setOpenAddBoardModal] = useState(false);
  const handleClickOpenAddBoard = () => {
    setOpenAddBoardModal(true);
  };
  const handleCloseAddBoard = () => {
    setOpenAddBoardModal(false);
  };
  return (
    <Box sx={{ display: "flex", gap: 2, marginTop: 5, flexWrap: "wrap" }}>
      <Card
        sx={{
          minWidth: 300,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          boxShadow: 10,
        }}
      >
        <CardContent sx={{ textAlign: "center" }}>
          <IconButton
            sx={{ fontSize: 60 }}
            color="primary"
            onClick={handleClickOpenAddBoard}
          >
            <AddCircleOutline fontSize="inherit" />
          </IconButton>
          <Typography variant="h6">{t("addNewBoard")}</Typography>
        </CardContent>
      </Card>
      <AddBoard
        open={openAddBoardModal}
        onClose={handleCloseAddBoard}
        users={users}
      />
      {boards.map((board) => (
        <Card key={board._id} sx={{ minWidth: 300, boxShadow: 10 }}>
          <CardContent>
            <Typography gutterBottom sx={{ fontSize: 14 }}>
              {t("workspace")}:
            </Typography>
            <Typography variant="h5">{board.boardName}</Typography>
            <Typography sx={{ color: "text.secondary", mb: 1.5 }}>
              {t("pendingTasks")}: {board.pending}
            </Typography>
            <Typography sx={{ color: "text.secondary", mb: 1.5 }}>
              {t("ongoingTasks")}: {board.ongoing}
            </Typography>
            <Typography sx={{ color: "text.secondary", mb: 1.5 }}>
              {t("completedTasks")}: {board.completed}
            </Typography>
          </CardContent>
          <CardActions>
            <Link
              to={`/board/${board._id}`}
              style={{ textDecoration: "none", color: "white" }}
            >
              <Button size="small" variant="contained">
                {t("goto-workspace")}
              </Button>
            </Link>
          </CardActions>
        </Card>
      ))}
    </Box>
  );
};
