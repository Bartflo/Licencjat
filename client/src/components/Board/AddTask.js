import React, { useState } from "react";
import { t } from "../../translations/utils";
import { useParams } from "react-router-dom";
const AddTask = ({ socket }) => {
  const [task, setTask] = useState("");
  const { boardId } = useParams();
  const handleAddTodo = (e) => {
    e.preventDefault();
    //👇🏻 sends the task to the Socket.io server
    socket.emit("createTask", { task, boardId });
    setTask("");
  };
  return (
    <form className="form__input" onSubmit={handleAddTodo}>
      <label htmlFor="task">{t("addNewTask")}</label>
      <input
        type="text"
        name="task"
        id="task"
        value={task}
        placeholder={t("title")}
        className="input"
        required
        onChange={(e) => setTask(e.target.value)}
      />
      <button className="addTodoBtn">{t("add")}</button>
    </form>
  );
};

export default AddTask;
