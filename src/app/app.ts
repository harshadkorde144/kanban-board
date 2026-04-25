import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { TaskService, Task } from './task.service';


interface Column {
  name: string;
  status: string;
  tasks: Task[];
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, DragDropModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  teamMembers = ['Alice', 'Bob', 'Charlie', 'David', 'Eve'];

  columns: Column[] = [
    { name: 'To Do', status: 'todo', tasks: [] },
    { name: 'In Progress', status: 'inprogress', tasks: [] },
    { name: 'Done', status: 'done', tasks: [] }
  ];

  showModal = false;
  editingTask: Task | null = null;
  editingColumnIndex = -1;
  newTask: Partial<Task> = { title: '', description: '', assignee: '', status: '' };

  constructor(private taskService: TaskService, private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.taskService.getTasks().subscribe(tasks => {
      console.log('Tasks from API:', tasks);
      this.columns.forEach(col => col.tasks = []);
      tasks.forEach(task => {
        const col = this.columns.find(c => c.status === task.status);
        if (col) col.tasks.push(task);
      });
      this.cdr.detectChanges();
    });
  }

  refreshTasks() {
    this.taskService.getTasks().subscribe(tasks => {
      this.columns.forEach(col => col.tasks = []);
      tasks.forEach(task => {
        const col = this.columns.find(c => c.status === task.status);
        if (col) col.tasks.push(task);
      });
      this.cdr.detectChanges();
    });
  }


  openAddModal(colIndex: number) {
    this.editingColumnIndex = colIndex;
    this.editingTask = null;
    this.newTask = { title: '', description: '', assignee: '', status: this.columns[colIndex].status };
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
    this.showModal = false;
    if (this.editingTask) {
      this.taskService.updateTask(this.newTask as Task).subscribe(() => this.refreshTasks());
    } else {
      this.taskService.addTask(this.newTask as Task).subscribe(() => this.refreshTasks());
    }
  }

  deleteTask(colIndex: number, task: Task) {
    this.taskService.deleteTask(task.id!).subscribe(() => this.refreshTasks());
  }

  moveTask(colIndex: number, taskIndex: number, direction: number) {
    const newColIndex = colIndex + direction;
    if (newColIndex < 0 || newColIndex >= this.columns.length) return;
    const task = this.columns[colIndex].tasks[taskIndex];
    task.status = this.columns[newColIndex].status;
    this.taskService.updateTask(task).subscribe(() => this.refreshTasks());
  }

  drop(event: CdkDragDrop<Task[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const task = event.previousContainer.data[event.previousIndex];
      const newColIndex = this.columns.findIndex(c => c.tasks === event.container.data);
      task.status = this.columns[newColIndex].status;
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
      this.taskService.updateTask(task).subscribe();
    }
  }

  closeModal() {
    this.showModal = false;
  }

  getColumnIds(): string[] {
    return this.columns.map((_, i) => 'col-' + i);
  }
}