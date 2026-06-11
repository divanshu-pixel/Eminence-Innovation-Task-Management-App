import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Subscription } from 'rxjs';
import { ErrorBannerComponent } from '../../shared/components/error-banner.component';
import { Task, TaskStatus } from '../../core/models/task.model';
import { User } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { TaskPayload, TaskRealtimeEvent, TaskService } from '../../core/services/task.service';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-dashboard',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ErrorBannerComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly taskService = inject(TaskService);
  private readonly userService = inject(UserService);

  readonly allTasks = signal<Task[]>([]);
  readonly users = signal<User[]>([]);
  readonly selectedStatus = signal<TaskStatus | 'all'>('all');
  readonly editingTask = signal<Task | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly user = this.authService.user;

  readonly canAssign = computed(() => this.user()?.role !== 'Employee');
  readonly assignableUsers = computed(() => {
    const currentUserId = this.user()?._id;
    return this.users().filter((candidate) => candidate._id !== currentUserId);
  });
  readonly visibleTeamLeads = computed(() => this.users().filter((user) => user.role === 'Team Lead'));
  readonly filteredTasks = computed(() =>
    this.selectedStatus() === 'all'
      ? this.allTasks()
      : this.allTasks().filter((task) => task.status === this.selectedStatus())
  );
  readonly pendingTaskCount = computed(
    () => this.allTasks().filter((task) => task.status === 'pending').length
  );
  readonly completedTaskCount = computed(
    () => this.allTasks().filter((task) => task.status === 'completed').length
  );

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    description: ['', Validators.maxLength(1000)],
    status: ['pending' as TaskStatus, Validators.required],
    assignedTo: ['']
  });

  private realtimeSubscription?: Subscription;

  ngOnInit(): void {
    this.loadTasks();
    this.loadUsers();
    this.realtimeSubscription = this.taskService.connectRealtime().subscribe((event) => {
      this.applyRealtimeEvent(event);
    });
  }

  ngOnDestroy(): void {
    this.realtimeSubscription?.unsubscribe();
  }

  logout(): void {
    this.authService.logout();
  }

  setStatusFilter(status: TaskStatus | 'all'): void {
    this.selectedStatus.set(status);
  }

  submitTask(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const rawValue = this.form.getRawValue();
    const payload: TaskPayload = {
      title: rawValue.title,
      description: rawValue.description,
      status: rawValue.status
    };

    if (this.canAssign() && rawValue.assignedTo) {
      payload.assignedTo = rawValue.assignedTo;
    }

    const editingTask = this.editingTask();
    const request = editingTask
      ? this.taskService.updateTask(editingTask._id, payload)
      : this.taskService.createTask(payload);

    this.error.set(null);
    request.subscribe({
      next: ({ task }) => {
        this.applyTask(task);
        this.resetForm();
      },
      error: (error) => this.error.set(error.error?.message || 'Unable to save task.')
    });
  }

  editTask(task: Task): void {
    this.editingTask.set(task);
    this.form.patchValue({
      title: task.title,
      description: task.description,
      status: task.status,
      assignedTo: task.assignedTo?._id || ''
    });
  }

  markComplete(task: Task): void {
    this.updateTaskStatus(task, 'completed');
  }

  updateTaskStatus(task: Task, status: TaskStatus): void {
    if (task.status === status) {
      return;
    }

    this.taskService.updateTask(task._id, { status }).subscribe({
      next: ({ task: updatedTask }) => this.applyTask(updatedTask),
      error: (error) => this.error.set(error.error?.message || 'Unable to update task.')
    });
  }

  deleteTask(task: Task): void {
    this.taskService.deleteTask(task._id).subscribe({
      next: () => {
        if (this.editingTask()?._id === task._id) {
          this.resetForm();
        }
        this.removeTask(task._id);
      },
      error: (error) => this.error.set(error.error?.message || 'Unable to delete task.')
    });
  }

  resetForm(): void {
    this.editingTask.set(null);
    this.form.reset({
      title: '',
      description: '',
      status: 'pending',
      assignedTo: ''
    });
  }

  private loadTasks(showLoader = true): void {
    if (showLoader) {
      this.loading.set(true);
    }

    this.taskService.listTasks('all').subscribe({
      next: ({ tasks }) => {
        this.allTasks.set(tasks);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(error.error?.message || 'Unable to load tasks.');
        this.loading.set(false);
      }
    });
  }

  private loadUsers(): void {
    if (this.user()?.role === 'Employee') {
      return;
    }

    this.userService.listUsers().subscribe({
      next: ({ users }) => this.users.set(users),
      error: () => this.users.set([])
    });
  }

  private applyRealtimeEvent(event: TaskRealtimeEvent): void {
    if (event.type === 'task:created' || event.type === 'task:updated') {
      this.applyTask(event.task);
      return;
    }

    if (event.type === 'task:deleted') {
      this.removeTask(event.taskId);
      return;
    }

    this.applyUser(event.user);
  }

  private applyTask(task: Task): void {
    const updatedTasks = this.allTasks().some((item) => item._id === task._id)
      ? this.allTasks().map((item) => (item._id === task._id ? task : item))
      : [task, ...this.allTasks()];

    this.allTasks.set(updatedTasks);
  }

  private removeTask(taskId: string): void {
    this.allTasks.set(this.allTasks().filter((task) => task._id !== taskId));
  }

  private applyUser(user: User): void {
    const updatedUsers = this.users().some((item) => item._id === user._id)
      ? this.users().map((item) => (item._id === user._id ? user : item))
      : [...this.users(), user];

    this.users.set(updatedUsers);
  }
}
