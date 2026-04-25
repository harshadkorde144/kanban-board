import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

interface Task {
  id: number;
  title: string;
  description: string;
  assignee: string;
}

interface Column {
  name: string;
  tasks: Task[];
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, DragDropModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  teamMembers = ['Alice', 'Bob', 'Charlie', 'David', 'Eve'];

  columns: Column[] = [
    {
      name: 'To Do', tasks: [
        { id: 1, title: 'Design UI', description: 'Create wireframes', assignee: 'Alice' },
        { id: 2, title: 'Setup DB', description: 'Configure database', assignee: 'Bob' }
      ]
    },
    {
      name: 'In Progress', tasks: [
        { id: 3, title: 'Build API', description: 'REST endpoints', assignee: 'Charlie' }
      ]
    },
    {
      name: 'Done', tasks: [
        { id: 4, title: 'Project Setup', description: 'Initial setup done', assignee: 'David' }
      ]
    }
  ];

  showModal = false;
  editingTask: Task | null = null;
  editingColumnIndex = -1;

  newTask: Partial<Task> = { title: '', description: '', assignee: '' };

  openAddModal(colIndex: number) {
    this.editingColumnIndex = colIndex;
    this.editingTask = null;
    this.newTask = { title: '', description: '', assignee: '' };
    this.showModal = true;
  }

  openEditModal(colIndex: number, task: Task) {
    this.editingColumnIndex = colIndex;
    this.editingTask = task;
    this.newTask = { ...task };
    this.showModal = true;
  }

  saveTask() {
    if (!this.newTask.title?.trim()) return;
    if (this.editingTask) {
      Object.assign(this.editingTask, this.newTask);
    } else {
      this.columns[this.editingColumnIndex].tasks.push({
        id: Date.now(),
        title: this.newTask.title!,
        description: this.newTask.description || '',
        assignee: this.newTask.assignee || ''
      });
    }
    this.showModal = false;
  }

  deleteTask(colIndex: number, taskIndex: number) {
    this.columns[colIndex].tasks.splice(taskIndex, 1);
  }

  moveTask(colIndex: number, taskIndex: number, direction: number) {
    const newColIndex = colIndex + direction;
    if (newColIndex < 0 || newColIndex >= this.columns.length) return;
    const task = this.columns[colIndex].tasks.splice(taskIndex, 1)[0];
    this.columns[newColIndex].tasks.push(task);
  }

  closeModal() {
    this.showModal = false;
  }
  drop(event: CdkDragDrop<Task[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
  }
  getColumnIds(): string[] {
    return this.columns.map((_, i) => 'col-' + i);
  }
}