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

const AddUserToBoard = ({ users, usersInBoard, boardId, setUsersInBoard }) => {
  const usersInBoardIds = usersInBoard.map((user) => user._id);
  const [selectedUsers, setSelectedUsers] = useState([]);

  const handleAddUsers = () => {
    fetch(`http://localhost:4000/api/boardUsers/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ boardId, users: selectedUsers }),
    })
      .then((response) => response.json())
      .then((data) => {
        // Aktualizuj stan usersInBoard, dodając nowo wybranych użytkowników
        const newlyAddedUsers = users.filter((user) =>
          selectedUsers.includes(user._id)
        );
        setUsersInBoard((prevUsers) => [...prevUsers, ...newlyAddedUsers]);

        // Wyczyść wybranych użytkowników
        setSelectedUsers([]);
      })
      .catch((error) => {
        console.error("Error adding users:", error);
      });
  };
  return (
    <Stack direction="row" spacing={2}>
      <Autocomplete
        multiple
        disablePortal
        id="tags-standard"
        options={users}
        getOptionDisabled={(option) => usersInBoardIds.includes(option._id)} // Wyłącz opcje dla użytkowników już na tablicy
        getOptionLabel={(option) => option?.userName || ""} // Wyświetlaj userName w liście opcji
        isOptionEqualToValue={(option, value) => option._id === value._id} // Sprawdzanie równości opcji względem _id
        value={users.filter((user) => selectedUsers.includes(user._id))} // Filtruj pełne obiekty użytkowników na podstawie ich _id
        onChange={(event, newValue) =>
          setSelectedUsers(newValue.map((user) => user._id))
        } // Aktualizuj stan po zmianie, zapisując tylko _id
        sx={{ width: 400 }}
        renderInput={(params) => (
          <TextField {...params} label={t("search-users")} />
        )}
      />
      <Button variant="outlined" sx={{ mt: 2 }} onClick={handleAddUsers}>
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
  const isOwner = (index) => index === 0;
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t("manage-users")}</DialogTitle>
      <DialogContent>
        <Tabs value={value} onChange={handleChange} centered>
          <Tab label={t("add-user")} />
          <Tab label={t("users-list")} />
        </Tabs>
        <Box p={3}>
          {value === 0 && (
            <AddUserToBoard
              users={users}
              usersInBoard={usersInBoard}
              boardId={boardId}
              setUsersInBoard={setUsersInBoard}
            />
          )}
          {value === 1 && (
            <Box>
              <ul style={{ listStyleType: "none" }}>
                {usersInBoard.map((user, index) => (
                  <li key={user._id} style={{ marginBottom: "0.5rem" }}>
                    <Chip
                      label={user.userName}
                      variant="outlined"
                      deleteIcon={isOwner(index) ? null : undefined}
                      onDelete={
                        isOwner(index) ? null : () => handleDelete(user._id)
                      }
                      color={isOwner(index) ? "primary" : "default"}
                      style={{
                        backgroundColor: isOwner(index) ? "#f5f5f5" : undefined,
                      }}
                    />
                    {isOwner(index) && (
                      <span
                        style={{ marginLeft: "0.5rem", fontWeight: "bold" }}
                      >
                        {t("owner")}
                      </span>
                    )}
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
