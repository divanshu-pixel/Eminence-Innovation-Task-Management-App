import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { API_BASE_URL, SOCKET_URL } from './api.config';
import { User } from '../models/user.model';
import { Task, TaskStatus } from '../models/task.model';

export interface TaskPayload {
  title: string;
  description?: string;
  status?: TaskStatus;
  assignedTo?: string;
}

export type TaskRealtimeEvent =
  | { type: 'task:created'; task: Task }
  | { type: 'task:updated'; task: Task }
  | { type: 'task:deleted'; taskId: string }
  | { type: 'user:created'; user: User }
  | { type: 'user:updated'; user: User };

@Injectable({ providedIn: 'root' })
export class TaskService {
  private socket?: Socket;

  constructor(private readonly http: HttpClient) {}

  listTasks(status?: TaskStatus | 'all') {
    const params = status && status !== 'all' ? new HttpParams().set('status', status) : undefined;
    return this.http.get<{ tasks: Task[] }>(`${API_BASE_URL}/tasks`, { params });
  }

  createTask(payload: TaskPayload) {
    return this.http.post<{ task: Task }>(`${API_BASE_URL}/tasks`, payload);
  }

  updateTask(id: string, payload: Partial<TaskPayload>) {
    return this.http.patch<{ task: Task }>(`${API_BASE_URL}/tasks/${id}`, payload);
  }

  deleteTask(id: string) {
    return this.http.delete<void>(`${API_BASE_URL}/tasks/${id}`);
  }

  connectRealtime(): Observable<TaskRealtimeEvent> {
    return new Observable((observer) => {
      this.socket = io(SOCKET_URL, { transports: ['websocket'] });
      const emitTaskCreated = (task: Task) => observer.next({ type: 'task:created', task });
      const emitTaskUpdated = (task: Task) => observer.next({ type: 'task:updated', task });
      const emitTaskDeleted = (payload: { _id: string }) =>
        observer.next({ type: 'task:deleted', taskId: payload._id });
      const emitUserCreated = (user: User) => observer.next({ type: 'user:created', user });
      const emitUserUpdated = (user: User) => observer.next({ type: 'user:updated', user });

      this.socket.on('task:created', emitTaskCreated);
      this.socket.on('task:updated', emitTaskUpdated);
      this.socket.on('task:deleted', emitTaskDeleted);
      this.socket.on('user:created', emitUserCreated);
      this.socket.on('user:updated', emitUserUpdated);

      return () => {
        this.socket?.disconnect();
      };
    });
  }
}
