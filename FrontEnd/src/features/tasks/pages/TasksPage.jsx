import { useState, useEffect } from 'react';
import { PageHeader } from '../../../shared/components/PageHeader';
import { api } from '../../../shared/api/api';

const STATUS_LABELS = {
  pending: { text: 'Pendente', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' },
  in_progress: { text: 'Em andamento', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' },
  completed: { text: 'Concluída', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' },
};

export function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  // Modal de criação / edição
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending',
    assigned_user_ids: [],
  });
  const [saving, setSaving] = useState(false);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [tasksRes, usersRes] = await Promise.all([
        api.tasks(statusFilter || undefined),
        api.users().catch(() => []),
      ]);
      setTasks(tasksRes);
      setCollaborators(usersRes);
    } catch (err) {
      setError(err?.message || 'Não foi possível carregar as tarefas.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  function openCreateModal() {
    setEditingTask(null);
    setFormData({
      title: '',
      description: '',
      status: 'pending',
      assigned_user_ids: [],
    });
    setModalOpen(true);
  }

  function openEditModal(task) {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      status: task.status || 'pending',
      assigned_user_ids: (task.assigned_users || []).map((u) => u.id).filter(Boolean),
    });
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setSaving(true);
    try {
      if (editingTask) {
        await api.updateTask(editingTask.id, formData);
      } else {
        await api.createTask(formData);
      }
      setModalOpen(false);
      await loadData();
    } catch (err) {
      alert(err?.message || 'Erro ao salvar tarefa.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(taskId) {
    if (!window.confirm('Tem certeza que deseja excluir esta tarefa?')) return;
    try {
      await api.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      alert(err?.message || 'Erro ao excluir tarefa.');
    }
  }

  function toggleUserAssignment(userId) {
    setFormData((prev) => {
      const current = prev.assigned_user_ids;
      const next = current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId];
      return { ...prev, assigned_user_ids: next };
    });
  }

  return (
    <>
      <PageHeader
        title="Tasks"
        description="Gestão de tarefas, escopo e atribuição aos colaboradores da equipe."
        actions={
          <button type="button" className="primary-button" onClick={openCreateModal}>
            + Nova Task
          </button>
        }
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          {['', 'pending', 'in_progress', 'completed'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                statusFilter === st
                  ? 'bg-brand text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              {st === '' ? 'Todas' : STATUS_LABELS[st]?.text || st}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <p className="mt-8 text-center text-sm muted">Carregando tasks da equipe…</p>
      ) : tasks.length === 0 ? (
        <section className="card mt-4 max-w-2xl text-center py-12 mx-auto">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-indigo-50 text-3xl text-brand dark:bg-indigo-950">
            ✓
          </div>
          <h2 className="mt-4 text-xl font-bold">Nenhuma task encontrada</h2>
          <p className="mt-2 text-sm muted max-w-md mx-auto">
            Crie uma tarefa para atribuir aos colaboradores. O Agente Desktop só monitora atividades associadas a uma tarefa ativa.
          </p>
          <button type="button" className="primary-button mt-6 inline-block" onClick={openCreateModal}>
            Criar primeira task
          </button>
        </section>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => {
            const badge = STATUS_LABELS[task.status] || STATUS_LABELS.pending;
            const assignedCount = task.assigned_users?.length || 0;

            return (
              <div key={task.id} className="card flex flex-col justify-between p-5 hover:border-brand/40 transition-colors">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.color}`}>
                      {badge.text}
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(task)}
                        className="rounded p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        title="Editar"
                        aria-label={`Editar ${task.title}`}
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(task.id)}
                        className="rounded p-1 text-gray-400 hover:text-red-600"
                        title="Excluir"
                        aria-label={`Excluir ${task.title}`}
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <h3 className="mt-3 font-bold text-lg leading-snug">{task.title}</h3>
                  {task.description && (
                    <p className="mt-1 text-sm muted line-clamp-2">{task.description}</p>
                  )}
                </div>

                <div className="mt-4 border-t pt-3 text-xs muted flex items-center justify-between dark:border-gray-800">
                  <span>
                    {assignedCount === 0
                      ? 'Nenhum colaborador'
                      : `${assignedCount} colaborador${assignedCount > 1 ? 'es' : ''}`}
                  </span>
                  {assignedCount > 0 && (
                    <div className="flex -space-x-1">
                      {task.assigned_users.slice(0, 3).map((u) => (
                        <span
                          key={u.id || u.username}
                          title={u.full_name || u.username}
                          className="inline-grid h-6 w-6 place-items-center rounded-full bg-brand/20 font-bold uppercase text-[10px] text-brand"
                        >
                          {(u.username || '?')[0]}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Nova / Editar Task */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-lg p-6 sm:p-8 animate-in fade-in duration-200">
            <h2 className="text-xl font-bold">
              {editingTask ? 'Editar Task' : 'Nova Task'}
            </h2>
            <form onSubmit={handleSave} className="mt-4 flex flex-col gap-4">
              <div>
                <label htmlFor="task-title" className="block text-sm font-semibold">
                  Título da tarefa *
                </label>
                <input
                  id="task-title"
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Desenvolver tela de login"
                  className="input mt-1 w-full"
                />
              </div>

              <div>
                <label htmlFor="task-desc" className="block text-sm font-semibold">
                  Descrição / Escopo
                </label>
                <textarea
                  id="task-desc"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Instruções ou escopo da tarefa…"
                  className="input mt-1 w-full"
                />
              </div>

              <div>
                <label htmlFor="task-status" className="block text-sm font-semibold">
                  Status
                </label>
                <select
                  id="task-status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="input mt-1 w-full"
                >
                  <option value="pending">Pendente</option>
                  <option value="in_progress">Em andamento</option>
                  <option value="completed">Concluída</option>
                </select>
              </div>

              <div>
                <span className="block text-sm font-semibold">
                  Atribuir colaboradores
                </span>
                {collaborators.length === 0 ? (
                  <p className="mt-1 text-xs muted">
                    Nenhum colaborador associado ainda. Os colaboradores vinculados via código do agente aparecerão aqui.
                  </p>
                ) : (
                  <div className="mt-2 max-h-36 overflow-y-auto space-y-1.5 rounded-lg border p-2 dark:border-gray-800">
                    {collaborators.map((c) => (
                      <label
                        key={c.id || c.username}
                        className="flex items-center gap-2 text-sm p-1 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.assigned_user_ids.includes(c.id)}
                          onChange={() => toggleUserAssignment(c.id)}
                          className="rounded text-brand"
                        />
                        <span>{c.full_name ? `${c.full_name} (${c.username})` : c.username}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving || !formData.title.trim()}
                >
                  {saving ? 'Salvando…' : 'Salvar task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
