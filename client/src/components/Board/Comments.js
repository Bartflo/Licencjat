import React, { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import { blue } from "@mui/material/colors";
import { Divider } from "@mui/material";
import { t } from "../../translations/utils";

const Comments = ({ socket, boardId, category, id }) => {
  const [comment, setComment] = useState(""); // State for new comment input
  const [commentList, setCommentList] = useState([]); // State for storing comments
  const [open, setOpen] = useState(false); // Dialog open state

  // Open the dialog to add a comment
  const handleClickOpen = () => {
    setOpen(true);
  };

  // Close the dialog
  const handleClose = () => {
    setOpen(false);
  };

  // Emit the comment data to the server and close the dialog
  const addComment = (e) => {
    e.preventDefault();

    // Send the comment, category, task id, and userId through the socket
    socket.emit("addComment", {
      boardId,
      comment,
      category,
      id,
      userId: sessionStorage.getItem("username"),
    });

    setComment(""); // Clear the comment input
    handleClose(); // Close the dialog after submitting
  };

  // Fetch comments when the component mounts or when category/id changes
  useEffect(() => {
    socket.on("comments", (data) => setCommentList(data)); // Update comment list when received from the socket
    socket.emit("fetchComments", { boardId, category, id }); // Request comments from the server
  }, [boardId, category, id, socket]);

  return (
    <div className="comments__container">
      {/* Button to open the dialog */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "20px",
        }}
      >
        <h2>{t("comments")}</h2>

        <Button variant="outlined" onClick={handleClickOpen}>
          {t("add-comment")}
        </Button>
      </Box>

      {/* Dialog for adding a comment */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>{t("add-comment")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t("please-enter-comment-below")}
          </DialogContentText>
          <form onSubmit={addComment}>
            <TextField
              autoFocus
              margin="dense"
              id="comment"
              label={t("comment")}
              type="text"
              fullWidth
              multiline
              rows={5}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>{t("cancel")}</Button>
          <Button onClick={addComment} type="submit">
            {t("submit")}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Section to display existing comments */}
      <Paper style={{ padding: "40px 20px" }}>
        {commentList.length > 0 ? (
          commentList.map((comment, index) => (
            <React.Fragment key={index}>
              <Grid container wrap="nowrap" spacing={2}>
                <Grid item>
                  <Avatar sx={{ bgcolor: blue[500] }} alt={comment.name}>
                    {comment.name.charAt(0).toUpperCase()}
                  </Avatar>
                </Grid>
                <Grid justifyContent="left" item xs zeroMinWidth>
                  <h4 style={{ margin: 0, textAlign: "left" }}>
                    {comment.name}
                  </h4>
                  <p style={{ textAlign: "left" }}>{comment.text}</p>
                  <p style={{ textAlign: "left", color: "gray" }}>
                    posted{" "}
                    {new Date(comment.time).toLocaleString("pl-PL", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}
                  </p>
                </Grid>
              </Grid>
              {index < commentList.length - 1 && (
                <Divider variant="fullWidth" style={{ margin: "30px 0" }} />
              )}
            </React.Fragment>
          ))
        ) : (
          <p>{t("no-comments-available")}</p>
        )}
      </Paper>
    </div>
  );
};

export default Comments;
