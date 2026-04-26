import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { TaskService, Task } from './task.service';
import { AuthService, User } from './auth.service';

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
  // Auth
  currentUser: User | null = null;
  showLoginPage = true;
  loginUsername = '';
  loginPassword = '';
  loginError = '';
  isLoggingIn = false;

  // Board
  teamMembers = ['Alice', 'Bob', 'Charlie', 'David', 'Eve'];
  darkMode = true;
  searchQuery = '';
  filterAssignee = '';
  showConfetti = false;
  particles: any[] = [];

  columns: Column[] = [
    { name: 'To Do', status: 'todo', tasks: [] },
    { name: 'In Progress', status: 'inprogress', tasks: [] },
    { name: 'Done', status: 'done', tasks: [] }
  ];

  showModal = false;
  editingTask: Task | null = null;
  editingColumnIndex = -1;
  newTask: Partial<Task> = { title: '', description: '', assignee: '', status: '', priority: 'medium', dueDate: '' };

  constructor(
    private taskService: TaskService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.generateParticles();
    const savedUser = this.authService.getUser();
    if (savedUser) {
      this.currentUser = savedUser;
      this.showLoginPage = false;
      this.refreshTasks();
    }
  }

  // Auth Methods
  login() {
    if (!this.loginUsername.trim() || !this.loginPassword.trim()) {
      this.loginError = 'Please enter username and password!';
      return;
    }
    this.isLoggingIn = true;
    this.loginError = '';
    this.authService.login(this.loginUsername.trim(), this.loginPassword.trim()).subscribe({
      next: (users) => {
        if (users.length > 0) {
          this.currentUser = users[0];
          this.authService.saveUser(users[0]);
          this.showLoginPage = false;
          this.refreshTasks();
        } else {
          this.loginError = '❌ Invalid username or password!';
        }
        this.isLoggingIn = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loginError = '❌ Server error. Please try again!';
        this.isLoggingIn = false;
        this.cdr.detectChanges();
      }
    });
  }

  logout() {
    this.authService.logout();
    this.currentUser = null;
    this.showLoginPage = true;
    this.loginUsername = '';
    this.loginPassword = '';
    this.loginError = '';
    this.columns.forEach(col => col.tasks = []);
  }

  // Board Methods
  generateParticles() {
    this.particles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * 10
    }));
  }

  refreshTasks() {
    if (!this.currentUser) return;
    this.taskService.getTasks(this.currentUser.id).subscribe(tasks => {
      this.columns.forEach(col => col.tasks = []);
      tasks.forEach(task => {
        const col = this.columns.find(c => c.status === task.status);
        if (col) col.tasks.push(task);
      });
      this.cdr.detectChanges();
    });
  }

  get totalTasks() { return this.columns.reduce((a, c) => a + c.tasks.length, 0); }
  get doneTasks() { return this.columns[2].tasks.length; }
  get inProgressTasks() { return this.columns[1].tasks.length; }
  get completionPercent() { return this.totalTasks ? Math.round((this.doneTasks / this.totalTasks) * 100) : 0; }

  filteredTasks(col: Column) {
    return col.tasks.filter(t => {
      const matchSearch = !this.searchQuery || t.title.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchAssignee = !this.filterAssignee || t.assignee === this.filterAssignee;
      return matchSearch && matchAssignee;
    });
  }

  getAvatarColor(name: string) {
    const colors = ['#4facfe', '#f093fb', '#43e97b', '#fa8231', '#a29bfe'];
    return colors[name?.charCodeAt(0) % colors.length] || '#4facfe';
  }

  getInitials(name: string) {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';
  }

  getPriorityColor(priority: string) {
    return { high: '#ff6b6b', medium: '#ffd93d', low: '#6bcb77' }[priority] || '#ffd93d';
  }

  openAddModal(colIndex: number) {
    this.editingColumnIndex = colIndex;
    this.editingTask = null;
    this.newTask = {
      title: '', description: '',
      assignee: this.currentUser?.name || '',
      status: this.columns[colIndex].status,
      priority: 'medium', dueDate: '',
      userId: this.currentUser?.id
    };
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
      this.taskService.addTask(this.newTask as Task).subscribe(() => {
        this.refreshTasks();
        if (this.newTask.status === 'done') this.triggerConfetti();
      });
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
    if (newColIndex === 2) this.triggerConfetti();
    this.taskService.updateTask(task).subscribe(() => this.refreshTasks());
  }

  drop(event: CdkDragDrop<Task[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const task = event.previousContainer.data[event.previousIndex];
      const newColIndex = this.columns.findIndex(c => c.tasks === event.container.data);
      task.status = this.columns[newColIndex].status;
      if (newColIndex === 2) this.triggerConfetti();
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
      this.taskService.updateTask(task).subscribe();
    }
  }

  triggerConfetti() {
    this.showConfetti = true;
    setTimeout(() => this.showConfetti = false, 3000);
  }

  toggleDarkMode() { this.darkMode = !this.darkMode; }
  closeModal() { this.showModal = false; }
  getColumnIds(): string[] { return this.columns.map((_, i) => 'col-' + i); }
}