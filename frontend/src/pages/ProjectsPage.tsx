import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Search,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';
import { projectsApi } from '../features/projects/api';
import type { Project, ProjectRequest, ProjectStatus } from '../shared/types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../shared/components/Card';
import { Badge } from '../shared/components/Badge';
import { Button } from '../shared/components/Button';
import { Input } from '../shared/components/Input';
import { Select } from '../shared/components/Select';
import { Modal } from '../shared/components/Modal';
import { Alert } from '../shared/components/Alert';
import { formatDate } from '../shared/utils/date';

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState<ProjectStatus>('ACTIVE');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await projectsApi.getProjects();
      setProjects(list);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки проектов');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const openCreateModal = () => {
    setFormName('');
    setFormDescription('');
    setFormStatus('ACTIVE');
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProject(project);
    setFormName(project.name);
    setFormDescription(project.description || '');
    setFormStatus(project.status);
    setFormError(null);
  };

  const openDeleteModal = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingProject(project);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Укажите название проекта');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError(null);
      const payload: ProjectRequest = {
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        status: formStatus,
      };
      const created = await projectsApi.createProject(payload);
      setProjects([created, ...projects]);
      setIsCreateModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Ошибка при создании проекта');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    if (!formName.trim()) {
      setFormError('Укажите название проекта');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError(null);
      const updated = await projectsApi.updateProject(editingProject.id, {
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        status: formStatus,
      });
      setProjects(projects.map((p) => (p.id === updated.id ? updated : p)));
      setEditingProject(null);
    } catch (err: any) {
      setFormError(err.message || 'Ошибка при обновлении проекта');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProject) return;
    try {
      setFormSubmitting(true);
      await projectsApi.deleteProject(deletingProject.id);
      setProjects(projects.filter((p) => p.id !== deletingProject.id));
      setDeletingProject(null);
    } catch (err: any) {
      setError(err.message || 'Не удалось удалить проект');
    } finally {
      setFormSubmitting(false);
    }
  };

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projects, search, statusFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FolderKanban className="w-7 h-7 text-indigo-600" />
            <span>Учебные проекты</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Создание учебных дисциплин, курсовых, дипломов и управление задачами
          </p>
        </div>
        <Button onClick={openCreateModal} leftIcon={<Plus className="w-4 h-4" />}>
          Новый проект
        </Button>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="w-full sm:w-72">
          <Input
            placeholder="Поиск по названию или описанию..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-medium text-slate-500 shrink-0">Статус:</span>
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium w-full sm:w-auto overflow-x-auto">
            {['ALL', 'ACTIVE', 'COMPLETED', 'ARCHIVED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-md transition-all ${
                  statusFilter === st
                    ? 'bg-white text-indigo-600 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'ALL' && 'Все'}
                {st === 'ACTIVE' && 'Активные'}
                {st === 'COMPLETED' && 'Завершенные'}
                {st === 'ARCHIVED' && 'Архив'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-sm font-medium text-slate-500">Загрузка проектов...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200 p-6">
          <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">Проекты не найдены</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {search || statusFilter !== 'ALL'
              ? 'Попробуйте изменить параметры поиска или фильтрации.'
              : 'Создайте свой первый учебный проект, чтобы начать отслеживать задачи и сроки.'}
          </p>
          {!search && statusFilter === 'ALL' && (
            <Button onClick={openCreateModal} size="sm" className="mt-4" leftIcon={<Plus className="w-4 h-4" />}>
              Создать проект
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card key={project.id} hoverable className="flex flex-col justify-between group">
              <div>
                <CardHeader className="flex flex-row items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="group-hover:text-indigo-600 transition-colors">
                      <Link to={`/projects/${project.id}`}>{project.name}</Link>
                    </CardTitle>
                    <span className="text-[11px] text-slate-400 block">
                      Создан {formatDate(project.createdAt)}
                    </span>
                  </div>
                  <Badge projectStatus={project.status} />
                </CardHeader>

                <CardContent>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed min-h-[2.5rem]">
                    {project.description || (
                      <span className="text-slate-400 italic">Описание отсутствует</span>
                    )}
                  </p>
                </CardContent>
              </div>

              <CardFooter>
                <Link
                  to={`/projects/${project.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  <span>Задачи проекта</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => openEditModal(project, e)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    title="Редактировать проект"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => openDeleteModal(project, e)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Удалить проект"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Modal: Create Project */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Создание учебного проекта"
        description="Задайте название дисциплины, модуля или курса"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)} disabled={formSubmitting}>
              Отмена
            </Button>
            <Button onClick={handleCreateSubmit} isLoading={formSubmitting}>
              Создать проект
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && <Alert type="error" message={formError} onClose={() => setFormError(null)} />}
          <Input
            label="Название проекта"
            placeholder="Например: Архитектура ПО или Курсовая работа"
            required
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Описание</label>
            <textarea
              rows={3}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Краткое описание целей, тем или требований..."
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
            />
          </div>
          <Select
            label="Статус"
            value={formStatus}
            onChange={(e) => setFormStatus(e.target.value as ProjectStatus)}
            options={[
              { value: 'ACTIVE', label: 'Активен' },
              { value: 'COMPLETED', label: 'Завершён' },
              { value: 'ARCHIVED', label: 'В архиве' },
            ]}
          />
        </form>
      </Modal>

      {/* Modal: Edit Project */}
      <Modal
        isOpen={!!editingProject}
        onClose={() => setEditingProject(null)}
        title="Редактирование проекта"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditingProject(null)} disabled={formSubmitting}>
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
            label="Название проекта"
            required
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
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
          <Select
            label="Статус"
            value={formStatus}
            onChange={(e) => setFormStatus(e.target.value as ProjectStatus)}
            options={[
              { value: 'ACTIVE', label: 'Активен' },
              { value: 'COMPLETED', label: 'Завершён' },
              { value: 'ARCHIVED', label: 'В архиве' },
            ]}
          />
        </form>
      </Modal>

      {/* Modal: Delete Project Confirmation */}
      <Modal
        isOpen={!!deletingProject}
        onClose={() => setDeletingProject(null)}
        title="Удалить проект?"
        description="Это действие необратимо и удалит все задачи проекта и напоминания"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeletingProject(null)} disabled={formSubmitting}>
              Отмена
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirm} isLoading={formSubmitting}>
              Да, удалить проект
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Вы действительно хотите удалить проект{' '}
          <strong className="text-slate-900">"{deletingProject?.name}"</strong>?
        </p>
      </Modal>
    </div>
  );
};
