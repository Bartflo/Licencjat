import React from "react";

const Nav = ({ boards }) => {
  return (
    <nav className="navbar">
      <h3>Team's todo list</h3>
      <div className="boards">
        <p>Board Names</p>
        <ul>
          {boards.map((board) => (
            <li key={board._id}>{board.boardName}</li>
          ))}
        </ul>
      </div>
    </nav>
  );
};
export default Nav;
