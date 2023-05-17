import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

const TasksContainer = ({ socket }) => {
  const [tasks, setTasks] = useState({});

  useEffect(() => {
    function fetchTasks() {
      fetch("http://localhost:4000/api")
        .then((res) => res.json())
        .then((data) => setTasks(data));
    }
    fetchTasks();
  }, []);

  const handleDragEnd = ({ destination, source }) => {
    if (!destination) return;
    if (
      destination.index === source.index &&
      destination.droppableId === source.droppableId
    )
      return;
    destination.columnName = destination.droppableId;
    source.columnName = source.droppableId;
    const task = tasks[source.droppableId];
    const itemId = task[0].items[source.index]._id;
    const itemTitle = task[0].items[source.index].title;
    source.droppableId = itemId;
    source.title = itemTitle;

    socket.emit("taskDragged", {
      source,
      destination,
    });
  };
  useEffect(() => {
    socket.on("tasks", (data) => {
      setTasks(data);
    });
  }, [socket]);

  return (
    <div className="container">
      <DragDropContext onDragEnd={handleDragEnd}>
        {Object.entries(tasks)?.map(([title, items]) => (
          <div className={`${title.toLowerCase()}__wrapper`} key={title}>
            <h3>{title} Tasks</h3>
            <div className={`${title.toLowerCase()}__container`}>
              {items ? (
                <Droppable droppableId={title}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                      {items.map((item, index) =>
                        item.items.map((subitem, subindex) => (
                          <Draggable
                            key={subitem._id}
                            draggableId={subitem._id}
                            index={subindex}
                          >
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`${title.toLowerCase()}__items`}
                              >
                                <p>{subitem.title}</p>
                              </div>
                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              ) : (
                <p>Loading tasks...</p> // lub inna wiadomość ładowania
              )}
            </div>
          </div>
        ))}
      </DragDropContext>
    </div>
  );
};
{
  /* <p className="comment">
                              <Link to={`/comments/${title}/${item._id}`}>
                                {item.comments.length > 0
                                  ? `View Comments`
                                  : "Add Comment"}
                              </Link>
                            </p> */
}
export default TasksContainer;
