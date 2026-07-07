import React, { useState, useMemo } from "react";
import {
  Check,
  MonitorPlay,
  ChevronDown,
  Compass,
  Maximize2,
  Loader2,
  Circle,
} from "lucide-react";

import { useDispatch, useSelector } from "react-redux";
import { cn, truncateTitle } from "@/lib/utils";
import { TodoListType, TodoStatus } from "@/stores/chatSlice";

const TaskCard = ({ todos }: { todos: TodoListType }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const completedTodos = useMemo(
    () => todos.filter((t) => t.status === "completed").length,
    [todos],
  );

  const activeTask =
    todos.find((t) => t.status === "in_progress") ||
    todos.find((t) => t.status === "pending") ||
    todos[todos.length - 1];

  const StatusIcon = ({ status }: { status: TodoStatus }) => {
    if (status === "completed") {
      return <Check size={14} className="text-green-500" />;
    }

    if (status === "in_progress") {
      return <Loader2 size={14} className="text-blue-500 animate-spin" />;
    }

    return <Circle size={12} className="text-gray-300" />;
  };

  if (!isExpanded) {
    return (
      <div className="w-full max-w-3xl mx-auto flex items-center gap-2 group">
        <div
          onClick={() => setIsExpanded(true)}
          className="flex-1 flex items-center justify-between bg-background border border-border rounded-md px-3 py-2"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <StatusIcon status={activeTask?.status} />
            <span className="text-[12px] text-foreground truncate">
              {truncateTitle(activeTask.task, 30)}
            </span>
          </div>

          <div className="flex items-center gap-2 ml-2">
            <span className="text-[10px] text-muted-foreground">
              {completedTodos}/{todos.length}
            </span>
            <ChevronDown
              size={14}
              className="text-muted-foreground -rotate-90 group-hover:text-foreground transition"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto bg-background border border-border rounded-xl p-3 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[12px] text-muted-foreground">Tasks</span>
        <button
          onClick={() => setIsExpanded(false)}
          className="p-1 rounded-md hover:bg-accent transition"
        >
          <ChevronDown size={16} />
        </button>
      </div>

      <div className="flex justify-between items-center mb-2">
        <span className="text-[11px] text-muted-foreground">Progress</span>

        <span className="text-[11px] text-muted-foreground">
          {completedTodos}/{todos.length}
        </span>
      </div>

      <ul className="space-y-2 max-h-35 overflow-y-auto pr-1">
        {todos.map((task) => {
          const isComplete = task.status === "completed";
          const isInProgress = task.status === "in_progress";

          return (
            <li key={task.id} className="flex items-start gap-2">
              <StatusIcon status={task.status} />
              <span
                className={cn(
                  "text-[11px]",
                  isComplete
                    ? "text-foreground"
                    : isInProgress
                      ? "text-primary"
                      : "text-muted-foreground",
                )}
              >
                {truncateTitle(task?.task, 60)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default TaskCard;
