import React, { useState } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
} from "@mui/material";

const DeleteBoard = ({ onDelete, open, onClose }) => {
  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">Usuwanie tablicy</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          Czy na pewno chcesz usunąc tablicę? Tej operacji nie można cofnąć.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button color="primary" onClick={handleClose}>
          Anuluj
        </Button>
        <Button color="error" autoFocus>
          Usuń
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteBoard;
