import React, { useState, useEffect } from "react";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import { t } from "../../translations/utils";

const AddUserToBoard = ({ users }) => {
  return (
    <Stack direction="row" spacing={2}>
      <Autocomplete
        disablePortal
        id="combo-box-demo"
        options={users.map((user) => user.userName)}
        sx={{ width: 300 }}
        renderInput={(params) => (
          <TextField {...params} label={t("search-users")} />
        )}
      />
      <Button variant="outlined" sx={{ mt: 2 }}>
        {t("add")}
      </Button>
    </Stack>
  );
};

export const ManageUsersModal = ({ open, boardId, onClose, users }) => {
  const [value, setValue] = useState(0);

  const [usersInBoard, setUsersInBoard] = useState({});
  useEffect(() => {
    function fetchUsersInBoard() {
      fetch(`http://localhost:4000/api/boardUsers?boardId=${boardId}`)
        .then((res) => res.json())
        .then((data) => setUsersInBoard(data));
    }
    fetchUsersInBoard();
  }, [boardId]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleDelete = async (userId) => {
    try {
      const response = await fetch("http://localhost:4000/api/boardUsers", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ boardId, userId }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete user from board");
      }

      // Usuń użytkownika z listy lokalnie, aby odświeżyć stan bez potrzeby ponownego ładowania
      setUsersInBoard((prevUsers) =>
        prevUsers.filter((user) => user._id !== userId)
      );
    } catch (error) {
      console.error("Error deleting user from board: ", error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Manage Users</DialogTitle>
      <DialogContent>
        <Tabs value={value} onChange={handleChange} centered>
          <Tab label="Dodaj użytkownika" />
          <Tab label="Lista Użytkowników" />
        </Tabs>
        <Box p={3}>
          {value === 0 && <AddUserToBoard users={users} />}
          {value === 1 && (
            <Box>
              <ul style={{ listStyleType: "none" }}>
                {usersInBoard.map((user, index) => (
                  <li key={user._id} style={{ marginBottom: "0.5rem" }}>
                    <Chip
                      key={index}
                      label={user.userName}
                      variant="outlined"
                      onDelete={() => handleDelete(user._id)}
                    />
                  </li>
                ))}
              </ul>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};
