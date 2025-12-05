import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ListTodo, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: "high" | "medium" | "low";
  dueDate?: string;
}

interface TaskListProps {
  tasks: Task[];
  onToggle?: (id: string, completed: boolean) => void;
  onDelete?: (id: string) => void;
  onAdd?: () => void;
  maxHeight?: string;
}

const priorityColors = {
  high: "bg-red-500/10 text-red-500 border-red-500/20",
  medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  low: "bg-green-500/10 text-green-500 border-green-500/20",
};

const priorityLabels = {
  high: "Urgent",
  medium: "Normal",
  low: "Faible",
};

export const TaskList = ({
  tasks,
  onToggle,
  onDelete,
  onAdd,
  maxHeight = "300px",
}: TaskListProps) => {
  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <ListTodo className="h-5 w-5" />
          Tâches
          <Badge variant="secondary" className="ml-2">
            {completedCount}/{tasks.length}
          </Badge>
        </CardTitle>
        {onAdd && (
          <Button variant="ghost" size="icon" onClick={onAdd} aria-label="Ajouter une tâche">
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <ScrollArea style={{ maxHeight }} className="pr-4">
          {tasks.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucune tâche
            </p>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                    task.completed
                      ? "bg-muted/50 border-border"
                      : "bg-card border-border hover:border-accent/50"
                  )}
                >
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={(checked) =>
                      onToggle?.(task.id, checked as boolean)
                    }
                    aria-label={`Mark "${task.title}" as ${task.completed ? "incomplete" : "complete"}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm font-medium truncate",
                        task.completed && "line-through text-muted-foreground"
                      )}
                    >
                      {task.title}
                    </p>
                    {task.dueDate && (
                      <p className="text-xs text-muted-foreground">
                        Échéance: {task.dueDate}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={cn("text-xs", priorityColors[task.priority])}
                  >
                    {priorityLabels[task.priority]}
                  </Badge>
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => onDelete(task.id)}
                      aria-label={`Delete "${task.title}"`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default TaskList;
