import React, { useState } from "react";
import {
  Avatar,
  Button,
  CssBaseline,
  TextField,
  Link,
  Grid,
  Box,
  Typography,
  Container,
} from "@mui/material";
import { LanguageSelect } from "../../translations/LanguageSelect";
import { t } from "../../translations/utils";

export const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    // e.preventDefault();
    // //👇🏻 saves the username to localstorage
    // localStorage.setItem("userId", username);
    // setUsername("");
    // //👇🏻 redirects to the Tasks page.
    e.preventDefault();
    console.log(username, password);
    // navigate("/tasks");
  };
  return (
    <Container component="main" maxWidth="xs">
      <LanguageSelect />
      <CssBaseline />
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: "secondary.main" }} />
        <Typography component="h1" variant="h5">
          {t("login")}
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label={t("username")}
            name="username"
            autoFocus
            onChange={(e) => {
              setUsername(e.target.value);
            }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label={t("password")}
            type="password"
            id="password"
            autoComplete="current-password"
            onChange={(e) => {
              setPassword(e.target.value);
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            {t("login-button")}
          </Button>
          <Grid item>
            <Link href="/register" variant="body2">
              {t("dont-have-account")}
            </Link>
          </Grid>
        </Box>
      </Box>
    </Container>
  );
};
