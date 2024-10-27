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
import { Divider, Typography } from "@mui/material";
import { t } from "../../translations/utils";

const Comments = ({ socket, boardId, category, id }) => {
  const [comment, setComment] = useState("");
  const [commentList, setCommentList] = useState([]);
  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const addComment = (e) => {
    e.preventDefault();

    socket.emit("addComment", {
      boardId,
      comment,
      category,
      id,
      userId: sessionStorage.getItem("username"),
    });

    setComment("");
    handleClose();
  };

  useEffect(() => {
    socket.on("comments", (data) => setCommentList(data));
    socket.emit("fetchComments", { boardId, category, id });
  }, [boardId, category, id, socket]);

  return (
    <div className="comments__container">
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "20px",
        }}
      >
        <Typography variant="h5">{t("comments")}</Typography>

        <Button variant="outlined" size="small" onClick={handleClickOpen}>
          {t("add-comment")}
        </Button>
      </Box>
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
                    {t("posted")}{" "}
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
