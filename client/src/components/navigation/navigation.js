import React, { useContext } from "react";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Drawer,
  Box,
  Toolbar,
  List,
  Divider,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CssBaseline,
  AppBar,
  Typography,
  IconButton,
  Button,
  Collapse,
  Switch,
} from "@mui/material";
import { Dashboard } from "@mui/icons-material";
import WorkspacesIcon from "@mui/icons-material/Workspaces";
import MenuIcon from "@mui/icons-material/Menu";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import TableViewIcon from "@mui/icons-material/TableView";

import { LanguageSelect } from "../../translations/LanguageSelect";
import { removeJwtToken } from "../auth/utils";
import { t } from "../../translations/utils";
import { ThemeContext } from "../../contexts/ThemeContext";
const drawerWidth = 240;

export const Navigation = ({ boards, window }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);

  const handleDrawerClose = () => {
    setIsClosing(true);
    setMobileOpen(false);
  };

  const handleDrawerTransitionEnd = () => {
    setIsClosing(false);
  };

  const handleDrawerToggle = () => {
    if (!isClosing) {
      setMobileOpen(!mobileOpen);
    }
  };

  const navigate = useNavigate();
  const handleLogout = () => {
    removeJwtToken();
    setTimeout(() => {
      navigate("/");
    }, 200);
  };

  const [expandBoards, setExpandBoards] = useState(true);

  const handleExpandBoards = () => {
    setExpandBoards(!expandBoards);
  };

  const drawer = (
    <div>
      <Toolbar>Project Manager</Toolbar>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton component={Link} to={"/dashboard"}>
            <ListItemIcon>
              <Dashboard />
            </ListItemIcon>
            <ListItemText primary={t("dashboard")} />
          </ListItemButton>
        </ListItem>
      </List>
      <Divider />
      <List>
        <ListItemButton onClick={handleExpandBoards}>
          <ListItemIcon>
            <WorkspacesIcon />
          </ListItemIcon>
          <ListItemText primary={t("workspaces")} />
          {expandBoards ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={expandBoards} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {boards.map((board) => (
              <ListItemButton
                key={board._id}
                sx={{ pl: 4 }}
                component={Link}
                to={`/board/${board._id}`}
              >
                <ListItemIcon>
                  <TableViewIcon />
                </ListItemIcon>
                <ListItemText primary={board.boardName} />
              </ListItemButton>
            ))}
          </List>
        </Collapse>
        <ListItem>
          <LanguageSelect />
        </ListItem>
        <ListItem>
          <Switch checked={darkMode} onChange={toggleDarkMode} />
        </ListItem>
        <ListItem>
          <Button variant="outlined" onClick={handleLogout}>
            {t("logout")}
          </Button>
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar sx={{ justifyContent: "center" }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{
              mr: 2,
              display: { sm: "none" },
              position: "absolute",
              left: 20,
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ flexGrow: 1, textAlign: "center" }}
          >
            Responsive drawer
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onTransitionEnd={handleDrawerTransitionEnd}
          onClose={handleDrawerClose}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
    </Box>
  );
};
