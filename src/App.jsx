import React, { useState } from "react";
import { Button, TextField, Card, CardContent, Box, Typography } from "@mui/material";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Componente de tarea
const SortableItem = ({ id, task }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card ref={setNodeRef} style={style} {...attributes} {...listeners} sx={{ marginBottom: 2 }}>
      <CardContent>{task}</CardContent>
    </Card>
  );
};

// Componente de columna que puede recibir elementos
const DroppableColumn = ({ id, children, items }) => {
  const { setNodeRef } = useDroppable({
    id,
    data: {
      isColumn: true,
    },
  });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        backgroundColor: "#f0f0f0",
        borderRadius: 2,
        padding: 3,
        width: 300,
        minHeight: items.length ? 'auto' : '100px', // Altura mínima cuando está vacía
      }}
    >
      {children}
    </Box>
  );
};

// Componente principal del tablero Kanban
const App = () => {
  const [columns, setColumns] = useState({
    todo: ["Idea inicial", "Investigar herramientas"],
    doing: ["Desarrollar componente Kanban"],
    done: ["Instalar dependencias"]
  });

  const [newTasks, setNewTasks] = useState({
    todo: "",
    doing: "",
    done: ""
  });

  const [activeTask, setActiveTask] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor));

  // Manejo del evento drag start
  const handleDragStart = (event) => {
    const { active } = event;
    setActiveTask(active.id);
  };

  // Manejo del evento drag end
  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveTask(null);
    
    if (!over) return;
    
    const activeId = active.id;
    
    // Encontrar la columna de origen
    const activeContainer = findContainer(activeId);
    if (!activeContainer) return;
    
    // Determinar la columna de destino
    let overContainer = findContainer(over.id);
    
    // Si el destino es una columna (no un item)
    if (over.data?.isColumn) {
      overContainer = over.id;
    }
    
    if (!overContainer) return;
    
    if (activeContainer === overContainer) {
      // Reordenar dentro de la misma columna
      const newItems = arrayMove(
        columns[activeContainer],
        columns[activeContainer].indexOf(activeId),
        columns[activeContainer].indexOf(over.id)
      );
      setColumns({ ...columns, [activeContainer]: newItems });
    } else {
      // Mover entre columnas
      const activeItems = columns[activeContainer];
      const overItems = columns[overContainer];
      
      const activeIndex = activeItems.indexOf(activeId);
      
      // Insertar al final de la columna destino
      const newColumns = { ...columns };
      newColumns[activeContainer] = activeItems.filter(item => item !== activeId);
      newColumns[overContainer] = [...overItems, activeId];
      
      setColumns(newColumns);
    }
  };

  // Encontrar la columna que contiene un item
  const findContainer = (id) => {
    if (id in columns) {
      return id;
    }
    
    return Object.keys(columns).find((key) => columns[key].includes(id));
  };

  // Agregar una nueva tarea a una columna
  const addTask = (columnId) => {
    const task = newTasks[columnId];
    if (!task.trim()) return;

    setColumns({
      ...columns,
      [columnId]: [...columns[columnId], task],
    });

    setNewTasks({
      ...newTasks,
      [columnId]: "",
    });
  };

  // Manejar cambios en el campo de texto de cada columna
  const handleNewTaskChange = (columnId, event) => {
    setNewTasks({
      ...newTasks,
      [columnId]: event.target.value,
    });
  };

  return (
    <Box sx={{ display: "flex", gap: 4, p: 4, overflowX: "auto" }}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {Object.entries(columns).map(([columnId, items]) => (
          <DroppableColumn key={columnId} id={columnId} items={items}>
            <Typography variant="h6" sx={{ marginBottom: 2 }}>
              {columnId === "todo"
                ? "Por hacer"
                : columnId === "doing"
                ? "En progreso"
                : "Hecho"}
            </Typography>

            <SortableContext items={items} strategy={horizontalListSortingStrategy}>
              {items.map((task) => (
                <SortableItem key={task} id={task} task={task} />
              ))}
            </SortableContext>

            <Box sx={{ display: "flex", gap: 2, marginTop: 2 }}>
              <TextField
                label="Nueva tarea"
                variant="outlined"
                size="small"
                value={newTasks[columnId]}
                onChange={(e) => handleNewTaskChange(columnId, e)}
                fullWidth
              />
              <Button variant="contained" color="primary" onClick={() => addTask(columnId)}>
                Agregar
              </Button>
            </Box>
          </DroppableColumn>
        ))}
        
        <DragOverlay>
          {activeTask ? (
            <Card sx={{ marginBottom: 2, width: 250 }}>
              <CardContent>{activeTask}</CardContent>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>
    </Box>
  );
};

export default App;