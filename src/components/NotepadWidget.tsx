import React, { useState, useEffect, useCallback } from 'react';
import type { WidgetComponentProps } from '../App';

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

interface NotepadWidgetProps extends WidgetComponentProps {
  id: string;
}

const NotepadWidget: React.FC<NotepadWidgetProps> = ({ id, isLayoutEditable }) => {
  const NOTES_STORAGE_KEY = `notepadWidget_notes_${id}`;
  const TASKS_STORAGE_KEY = `notepadWidget_tasks_${id}`;

  const [notes, setNotes] = useState<string>(() => { try { return localStorage.getItem(NOTES_STORAGE_KEY) || ''; } catch (error) { console.error("Failed to load notes for widget:", id, error); return ''; } });
  const [tasks, setTasks] = useState<Task[]>(() => { try { const savedTasks = localStorage.getItem(TASKS_STORAGE_KEY); return savedTasks ? JSON.parse(savedTasks) : []; } catch (error) { console.error("Failed to load tasks for widget:", id, error); return []; } });
  const [newTaskText, setNewTaskText] = useState('');

  useEffect(() => { try { localStorage.setItem(NOTES_STORAGE_KEY, notes); } catch (error) { console.error("Failed to save notes for widget:", id, error); }}, [notes, NOTES_STORAGE_KEY, id]);
  useEffect(() => { try { localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks)); } catch (error) { console.error("Failed to save tasks for widget:", id, error); }}, [tasks, TASKS_STORAGE_KEY, id]);

  const handleNotesChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(event.target.value);
  const handleAddTask = useCallback(() => {
    if (newTaskText.trim() === '') return;
    setTasks(prevTasks => [...prevTasks, { id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, text: newTaskText.trim(), completed: false }]);
    setNewTaskText('');
  }, [newTaskText]);
  const handleToggleTask = (taskId: string) => setTasks(prevTasks => prevTasks.map(task => task.id === taskId ? { ...task, completed: !task.completed } : task));
  const handleDeleteTask = (taskId: string) => setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  const handleTaskTextChange = (taskId: string, newText: string) => setTasks(prevTasks => prevTasks.map(task => task.id === taskId ? { ...task, text: newText } : task));
  const handleKeyPress = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => { if (event.key === 'Enter') handleAddTask(); }, [handleAddTask]);

  return (
    <div className="notepad-widget-container">
      <textarea className="notepad-textarea" placeholder="Type your notes here..." value={notes} onChange={handleNotesChange} disabled={isLayoutEditable} />
      <div className="task-section">
        <h4 className="task-title">Tasks / To-Do</h4>
        <div className="task-list">
          {tasks.map(task => (
            <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
              <input type="checkbox" checked={task.completed} onChange={() => handleToggleTask(task.id)} disabled={isLayoutEditable} />
              <input type="text" value={task.text} onChange={(e) => handleTaskTextChange(task.id, e.target.value)} className="task-text-input" disabled={task.completed || isLayoutEditable} />
              <button className="delete-task-button" onClick={() => handleDeleteTask(task.id)} title="Delete task" disabled={isLayoutEditable}>&times;</button>
            </div>
          ))}
        </div>
        <div className="add-task-area">
          <input type="text" className="add-task-input" placeholder="Add new task..." value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} onKeyPress={handleKeyPress} disabled={isLayoutEditable} />
          <button className="add-task-button" onClick={handleAddTask} disabled={isLayoutEditable}>Add Task</button>
        </div>
      </div>
    </div>
  );
};

export default NotepadWidget;