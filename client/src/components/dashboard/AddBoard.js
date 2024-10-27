import React, { useState } from "react";
import { t } from "../../translations/utils";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Box,
  Button,
  Autocomplete,
  Chip,
} from "@mui/material";
import { getUserIdInSessionStorage } from "../auth/utils";

const AddBoard = ({ open, onClose, users }) => {
  const ownerId = getUserIdInSessionStorage();
  const [boardName, setBoardName] = useState("");
  const [usersToAdd, setUsersToAdd] = useState([ownerId]);
  const [errorMessage, setErrorMessage] = useState("");

  const handleAddBoard = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:4000/api/createBoard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          boardName,
          users: usersToAdd,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create board");
      }

      const result = await response.json();
      console.log("Board created:", result);

      onClose();
    } catch (error) {
      setErrorMessage(
        error.message || "An error occurred while creating the board."
      );
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{t("add-new-workspace")}</DialogTitle>
      <DialogContent>
        <form onSubmit={handleAddBoard}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              sx={{ marginTop: 2 }}
              id="boardName"
              label={t("workspace-name")}
              value={boardName}
              onChange={(e) => setBoardName(e.target.value)}
              placeholder={t("content")}
            />
          </Box>

          <Autocomplete
            multiple
            sx={{ marginTop: 2 }}
            id="users"
            options={users}
            getOptionLabel={(option) => option?.userName || ""}
            isOptionEqualToValue={(option, value) => option._id === value._id}
            value={users.filter((user) => usersToAdd.includes(user._id))}
            onChange={(event, newValue) => {
              const newUsers = newValue.map((user) => user._id);

              if (!newUsers.includes(ownerId)) {
                newUsers.unshift(ownerId);
              }
              setUsersToAdd([
                ownerId,
                ...newUsers.filter((id) => id !== ownerId),
              ]);
            }}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  key={option._id}
                  label={option.userName}
                  {...(option._id === ownerId ? {} : getTagProps({ index }))}
                  onDelete={
                    option._id === ownerId
                      ? undefined
                      : getTagProps({ index }).onDelete
                  }
                />
              ))
            }
            renderInput={(params) => (
              <TextField {...params} label={t("search-users")} />
            )}
          />

          {errorMessage && (
            <Box sx={{ color: "red", marginTop: 2 }}>{errorMessage}</Box>
          )}

          <Box sx={{ display: "flex", justifyContent: "center", marginTop: 2 }}>
            <Button type="submit" variant="contained" color="primary">
              {t("add")}
            </Button>
          </Box>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddBoard;
