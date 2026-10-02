import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Bell,
  Search,
  CheckCircle2,
  AlertCircle,
  FolderKanban,
  RefreshCw,
} from 'lucide-react';
import { projectsApi } from '../features/projects/api';
import { tasksApi } from '../features/tasks/api';
import type {
  Project,
  Task,
  TaskStatus,
  TaskPriority,
  CreateTaskRequest,
  UpdateTaskRequest,
} from '../shared/types';
import { Badge } from '../shared/components/Badge';
import { Button } from '../shared/components/Button';
import { Input } from '../shared/components/Input';
import { Select } from '../shared/components/Select';
import { Modal } from '../shared/components/Modal';
import { Alert } from '../shared/components/Alert';
import {
  formatDate,
  toDatetimeLocal,
  fromDatetimeLocal,
  isTaskOverdue,
} from '../shared/utils/date';

export const ProjectDetailsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const numericProjectId = Number(projectId);

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState<TaskStatus>('TODO');
  const [formPriority, setFormPriority] = useState<TaskPriority>('MEDIUM');
  const [formDueAt, setFormDueAt] = useState('');
  const [formRemindAt, setFormRemindAt] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (isNaN(numericProjectId)) {
      navigate('/projects');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const [projData, taskList] = await Promise.all([
        projectsApi.getProject(numericProjectId),
        tasksApi.getTasksByProject(numericProjectId),
      ]);
      setProject(projData);
      setTasks(taskList);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки данных проекта');
    } finally {
      setLoading(false);
    }
  }, [numericProjectId, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateModal = () => {
    setFormTitle('');
    setFormDescription('');
    setFormStatus('TODO');
    setFormPriority('MEDIUM');
    setFormDueAt('');
    setFormRemindAt('');
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormDescription(task.description || '');
    setFormStatus(task.status);
    setFormPriority(task.priority);
    setFormDueAt(toDatetimeLocal(task.dueAt));
    setFormRemindAt(toDatetimeLocal(task.remindAt));
    setFormError(null);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('Укажите название задачи');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError(null);
      const payload: CreateTaskRequest = {
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        status: formStatus,
        priority: formPriority,
        dueAt: fromDatetimeLocal(formDueAt),
        remindAt: fromDatetimeLocal(formRemindAt),
      };
      const created = await tasksApi.createTask(numericProjectId, payload);
      setTasks([created, ...tasks]);
      setIsCreateModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Ошибка при создании задачи');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    if (!formTitle.trim()) {
      setFormError('Укажите название задачи');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError(null);
      const payload: UpdateTaskRequest = {
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        status: formStatus,
        priority: formPriority,
        dueAt: fromDatetimeLocal(formDueAt),
        remindAt: fromDatetimeLocal(formRemindAt),
      };
      const updated = await tasksApi.updateTask(editingTask.id, payload);
      setTasks(tasks.map((t) => (t.id === updated.id ? updated : t)));
      setEditingTask(null);
    } catch (err: any) {
      setFormError(err.message || 'Ошибка при обновлении задачи');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleQuickStatusChange = async (taskId: number, newStatus: TaskStatus) => {
    try {
      const updated = await tasksApi.updateTask(taskId, { status: newStatus });
      setTasks(tasks.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err: any) {
      setError(err.message || 'Не удалось обновить статус задачи');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTask) return;
    try {
      setFormSubmitting(true);
      await tasksApi.deleteTask(deletingTask.id);
      setTasks(tasks.filter((t) => t.id !== deletingTask.id));
      setDeletingTask(null);
    } catch (err: any) {
      setError(err.message || 'Не удалось удалить задачу');
    } finally {
      setFormSubmitting(false);
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, search, statusFilter, priorityFilter]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Загрузка данных проекта...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-slate-800">Проект не найден</h3>
        <p className="text-sm text-slate-500 mt-1">Возможно, он был удалён или у вас нет доступа.</p>
        <Link to="/projects" className="inline-block mt-4">
          <Button variant="outline">Вернуться к проектам</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link
          to="/projects"
          className="inline-flex items-center gap-1 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Все проекты</span>
        </Link>
        <span>/</span>
        <span className="font-medium text-slate-800 truncate max-w-md">{project.name}</span>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
                <Badge projectStatus={project.status} />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Создан: {formatDate(project.createdAt)} • Задач: {tasks.length}
              </p>
            </div>
          </div>
          {project.description && (
            <p className="text-sm text-slate-600 mt-2 pl-1 max-w-3xl leading-relaxed">
              {project.description}
            </p>
          )}
        </div>

        <Button onClick={openCreateModal} leftIcon={<Plus className="w-4 h-4" />}>
          Добавить задачу
        </Button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
        <div className="w-full sm:w-72">
          <Input
            placeholder="Поиск по задачам..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Статус:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">Все статусы</option>
              <option value="TODO">К выполнению</option>
              <option value="IN_PROGRESS">В работе</option>
              <option value="COMPLETED">Выполнено</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Приоритет:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="text-xs rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">Все приоритеты</option>
              <option value="LOW">Низкий</option>
              <option value="MEDIUM">Средний</option>
              <option value="HIGH">Высокий</option>
            </select>
          </div>
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200 p-6">
          <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">Задачи отсутствуют</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {search || statusFilter !== 'ALL' || priorityFilter !== 'ALL'
              ? 'Ни одна задача не соответствует выбранным критериям поиска.'
              : 'В этом проекте ещё нет задач. Добавьте первую задачу для планирования!'}
          </p>
          {!search && statusFilter === 'ALL' && priorityFilter === 'ALL' && (
            <Button onClick={openCreateModal} size="sm" className="mt-4" leftIcon={<Plus className="w-4 h-4" />}>
              Создать задачу
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const overdue = isTaskOverdue(task.dueAt, task.status);
            return (
              <div
                key={task.id}
                className={`p-4 bg-white rounded-xl border transition-all hover:shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  overdue
                    ? 'border-rose-300 bg-rose-50/20'
                    : task.status === 'COMPLETED'
                    ? 'border-slate-200 opacity-80'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3
                      className={`text-sm font-semibold ${
                        task.status === 'COMPLETED'
                          ? 'line-through text-slate-500'
                          : 'text-slate-900'
                      }`}
                    >
                      {task.title}
                    </h3>
                    <Badge taskPriority={task.priority} />
                    <Badge taskStatus={task.status} />
                    {overdue && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-100/80 px-2 py-0.5 rounded-full">
                        <AlertCircle className="w-3 h-3" />
                        Просрочено
                      </span>
                    )}
                  </div>

                  {task.description && (
                    <p className="text-xs text-slate-600 leading-relaxed pr-4">
                      {task.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                    {task.dueAt && (
                      <span
                        className={`flex items-center gap-1 font-medium ${
                          overdue ? 'text-rose-600 font-bold' : 'text-slate-600'
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        Дедлайн: {formatDate(task.dueAt)}
                      </span>
                    )}
                    {task.remindAt && (
                      <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                        <Bell className="w-3 h-3 text-amber-600" />
                        Напоминание: {formatDate(task.remindAt)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-start md:self-center shrink-0">
                  <select
                    value={task.status}
                    onChange={(e) =>
                      handleQuickStatusChange(task.id, e.target.value as TaskStatus)
                    }
                    className="text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none"
                    title="Быстрая смена статуса"
                  >
                    <option value="TODO">К выполнению</option>
                    <option value="IN_PROGRESS">В работе</option>
                    <option value="COMPLETED">Выполнено</option>
                  </select>

                  <button
                    onClick={() => openEditModal(task)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    title="Редактировать задачу"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setDeletingTask(task)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Удалить задачу"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create Task */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Новая задача"
        description={`Проект: ${project.name}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)} disabled={formSubmitting}>
              Отмена
            </Button>
            <Button onClick={handleCreateSubmit} isLoading={formSubmitting}>
              Создать задачу
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && <Alert type="error" message={formError} onClose={() => setFormError(null)} />}
          <Input
            label="Название задачи"
            placeholder="Например: Написать 1 главу дипломной работы"
            required
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Описание</label>
            <textarea
              rows={3}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Подробности задачи, критерии сдачи..."
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Статус"
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as TaskStatus)}
              options={[
                { value: 'TODO', label: 'К выполнению' },
                { value: 'IN_PROGRESS', label: 'В работе' },
                { value: 'COMPLETED', label: 'Выполнено' },
              ]}
            />

            <Select
              label="Приоритет"
              value={formPriority}
              onChange={(e) => setFormPriority(e.target.value as TaskPriority)}
              options={[
                { value: 'LOW', label: 'Низкий' },
                { value: 'MEDIUM', label: 'Средний' },
                { value: 'HIGH', label: 'Высокий' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              type="datetime-local"
              label="Срок сдачи (дедлайн)"
              value={formDueAt}
              onChange={(e) => setFormDueAt(e.target.value)}
            />

            <Input
              type="datetime-local"
              label="Время напоминания"
              helperText="Система напомнит вам в этот момент"
              value={formRemindAt}
              onChange={(e) => setFormRemindAt(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Task */}
      <Modal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        title="Редактирование задачи"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditingTask(null)} disabled={formSubmitting}>
              Отмена
            </Button>
            <Button onClick={handleEditSubmit} isLoading={formSubmitting}>
              Сохранить изменения
            </Button>
          </>
        }
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {formError && <Alert type="error" message={formError} onClose={() => setFormError(null)} />}
          <Input
            label="Название задачи"
            required
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Описание</label>
            <textarea
              rows={3}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Статус"
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as TaskStatus)}
              options={[
                { value: 'TODO', label: 'К выполнению' },
                { value: 'IN_PROGRESS', label: 'В работе' },
                { value: 'COMPLETED', label: 'Выполнено' },
              ]}
            />

            <Select
              label="Приоритет"
              value={formPriority}
              onChange={(e) => setFormPriority(e.target.value as TaskPriority)}
              options={[
                { value: 'LOW', label: 'Низкий' },
                { value: 'MEDIUM', label: 'Средний' },
                { value: 'HIGH', label: 'Высокий' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              type="datetime-local"
              label="Срок сдачи (дедлайн)"
              value={formDueAt}
              onChange={(e) => setFormDueAt(e.target.value)}
            />

            <Input
              type="datetime-local"
              label="Время напоминания"
              value={formRemindAt}
              onChange={(e) => setFormRemindAt(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* Modal: Delete Task Confirmation */}
      <Modal
        isOpen={!!deletingTask}
        onClose={() => setDeletingTask(null)}
        title="Удалить задачу?"
        description="Связанные напоминания будут также удалены"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeletingTask(null)} disabled={formSubmitting}>
              Отмена
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirm} isLoading={formSubmitting}>
              Да, удалить задачу
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Вы уверены, что хотите удалить задачу{' '}
          <strong className="text-slate-900">"{deletingTask?.title}"</strong>?
        </p>
      </Modal>
    </div>
  );
};
