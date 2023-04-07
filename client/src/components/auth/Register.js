import React, { useState, useMemo, Fragment, useEffect } from "react";
import {
  Avatar,
  IconButton,
  Button,
  CssBaseline,
  TextField,
  Link,
  Grid,
  Box,
  Typography,
  Container,
  Tooltip,
} from "@mui/material";
import { debounce } from "lodash";
import { DEBOUNCE_TIMEOUT, loginRegExp, passwordRegExp } from "./constants";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { AuthAlert } from "./AuthAlert";
import { setUserNameInSessionStorage, setJwtToken } from "./utils";
import { LanguageSelect } from "../../translations/LanguageSelect";
import { t } from "../../translations/utils";

export const Register = () => {
  const [userName, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isFormValid, setIsFormValid] = useState(false);
  const [userNameError, setUserNameError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [successAlertOpen, setSuccessAlertOpen] = useState(false);
  const [errorAlertOpen, setErrorAlertOpen] = useState(false);

  const passwordRulesList = useMemo(
    () => (
      <Fragment>
        {t("register.password-rules.title")}
        <ul>
          <li>{t("register.password-rules.upper-case-letter")}</li>
          <li>{t("register.password-rules.lower-case-letter")}</li>
          <li>{t("register.password-rules.digit")}</li>
          <li>{t("register.password-rules.special-character")}</li>
          <li>{t("register.password-rules.min-characters")}</li>
        </ul>
      </Fragment>
    ),
    []
  );

  useEffect(() => {
    userNameError || passwordError
      ? setIsFormValid(false)
      : setIsFormValid(true);
  }, [userNameError, passwordError]);

  const isUserNameValid = (userName) => loginRegExp.test(userName);
  const isPasswordValid = (password) => passwordRegExp.test(password);

  const handleUserNameChange = debounce((userName) => {
    setUsername(userName);
    isUserNameValid(userName)
      ? setUserNameError(false)
      : setUserNameError(true);
  }, DEBOUNCE_TIMEOUT);

  const handlePasswordChange = debounce((password) => {
    setPassword(password);
    isPasswordValid(password)
      ? setPasswordError(false)
      : setPasswordError(true);
  }, DEBOUNCE_TIMEOUT);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch("http://localhost:4000/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userName, password }),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        return Promise.reject(response);
      })
      .then((json) => {
        setUserNameInSessionStorage(json.userName);
        setJwtToken(json.token);
        console.log("user created", json);
        localStorage.setItem("userId", json.userName);
        setSuccessAlertOpen(true);
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      })
      .catch((error) => {
        error.json().then((json) => {
          if (json.message === "user already exists") {
            setErrorAlertOpen(true);
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
          {t("register")}
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          {userNameError && (
            <Tooltip
              disableFocusListener
              title={t("register.username-error")}
              placement="right"
            >
              <IconButton color="error" variant="outlined">
                <InfoOutlinedIcon />
              </IconButton>
            </Tooltip>
          )}
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label={t("username")}
            autoFocus
            onChange={(e) => {
              handleUserNameChange(e.target.value);
            }}
          />
          {passwordError && (
            <Tooltip
              disableFocusListener
              title={passwordRulesList}
              placement="right"
            >
              <IconButton color="error" variant="outlined">
                <InfoOutlinedIcon />
              </IconButton>
            </Tooltip>
          )}
          <TextField
            margin="normal"
            required
            fullWidth
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
            sx={{ mt: 3, mb: 2 }}
            disabled={!isFormValid}
            onClick={handleSubmit}
          >
            {t("register-button")}
          </Button>
          <Grid item>
            <Link href="/" variant="body2">
              {t("already-have-account")}
            </Link>
          </Grid>
        </Box>
      </Box>
      <AuthAlert
        open={successAlertOpen}
        severity="success"
        message={t("register-success")}
        onClose={() => {
          setSuccessAlertOpen(false);
        }}
      />
      <AuthAlert
        open={errorAlertOpen}
        severity="error"
        message={t("register-user-exists")}
        onClose={() => {
          setErrorAlertOpen(false);
        }}
      />
    </Container>
  );
};
