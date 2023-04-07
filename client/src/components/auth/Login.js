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
import { debounce } from "lodash";
import { setJwtToken, setUserNameInSessionStorage } from "./utils";
import { AuthAlert } from "./AuthAlert";
import { DEBOUNCE_TIMEOUT } from "./constants";

export const Login = () => {
  const [userName, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorAlertOpen, setErrorAlertOpen] = useState(false);
  const [successAlertOpen, setSuccessAlertOpen] = useState(false);
  const [isFormValid, setIsFormValid] = useState(true);

  const handleUserNameChange = debounce((userName) => {
    setUsername(userName);
    setIsFormValid(true);
  }, DEBOUNCE_TIMEOUT);

  const handlePasswordChange = debounce((password) => {
    setPassword(password);
    setIsFormValid(true);
  }, DEBOUNCE_TIMEOUT);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch("http://localhost:4000/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userName, password }),
    })
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
        return Promise.reject(res);
      })
      .then((json) => {
        setJwtToken(json.token);
        setUserNameInSessionStorage(json.userName);
        setSuccessAlertOpen(true);
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      })
      .catch((error) => {
        error.json().then((json) => {
          if (
            json.message === "User not found" ||
            json.message === "Wrong password"
          ) {
            setErrorAlertOpen(true);
            setIsFormValid(false);
          }
        });
      });
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
              handleUserNameChange(e.target.value);
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
              handlePasswordChange(e.target.value);
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={!isFormValid}
            onClick={handleSubmit}
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
      <AuthAlert
        open={errorAlertOpen}
        severity="error"
        message={t("login-error")}
        onClose={() => setErrorAlertOpen(false)}
      />
      <AuthAlert
        open={successAlertOpen}
        severity="success"
        message={t("login-success")}
        onClose={() => setSuccessAlertOpen(false)}
      />
    </Container>
  );
};
