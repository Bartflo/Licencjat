import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { t } from "../../translations/utils";

const TasksContainer = ({ socket }) => {
  const [tasks, setTasks] = useState({});
  const { boardId } = useParams();
  useEffect(() => {
    function fetchTasks() {
      fetch(`http://localhost:4000/api/${boardId}`)
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

    const updatedTasks = { ...tasks };

    const sourceColumn = updatedTasks[source.droppableId];
    const draggedItem = sourceColumn.items.splice(source.index, 1)[0];

    const destinationColumn = updatedTasks[destination.droppableId];
    destinationColumn.items.splice(destination.index, 0, draggedItem);

    setTasks(updatedTasks);

    socket.emit("taskDragged", {
      source,
      destination,
      boardId, // Przekaż również boardId do backendu
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
            <h3>
              {title === "pendingTasks"
                ? t("pendingTasks")
                : title === "ongoingTasks"
                ? t("ongoingTasks")
                : t("completedTasks")}
            </h3>
            <div className={`${title.toLowerCase()}__container`}>
              {items && items.items ? (
                <Droppable droppableId={title}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                      {items.items.map((subitem, subindex) => (
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
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              ) : (
                <p>Loading tasks...</p>
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
