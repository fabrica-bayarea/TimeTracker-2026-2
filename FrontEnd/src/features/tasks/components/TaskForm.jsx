import { useEffect, useId, useRef, useState } from 'react';
import { validTaskDescription, validTaskTitle } from '../../../shared/api/validators';
import { ErrorNotice } from '../../../shared/components/AsyncFeedback';

function draftFromTask(task) {
  return {
    title: task?.title || '',
    description: task?.description || '',
    collaboratorIds: task?.collaborators?.map((person) => person.id) || [],
  };
}

export function TaskForm({
  task = null,
  collaborators = [],
  collaboratorsLoading = false,
  collaboratorsError,
  onRetryCollaborators,
  allowCollaboratorSelection = false,
  onSubmit,
  onCancel,
  saving = false,
  disabled = false,
  error = null,
}) {
  const id = useId();
  const [draft, setDraft] = useState(() => draftFromTask(task));
  const [dirty, setDirty] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const previousTask = useRef(task);
  const submitting = useRef(false);
  const titleInput = useRef(null);
  const descriptionInput = useRef(null);
  const collaboratorsFieldset = useRef(null);
  const headingId = `${id}-heading`;
  const availableIds = new Set(collaborators.map((person) => person.id));
  const unavailableIds = draft.collaboratorIds.filter((personId) => !availableIds.has(personId));

  useEffect(() => {
    const previous = previousTask.current;
    if (previous === task) return;

    previousTask.current = task;
    const changedTask = previous?.id !== task?.id;
    if (changedTask || !dirty) {
      setDraft(draftFromTask(task));
      setDirty(false);
      setValidationError(null);
    }
  }, [dirty, task]);

  function updateDraft(update) {
    setDraft((current) => ({ ...current, ...update }));
    setDirty(true);
    setValidationError(null);
  }

  function toggleCollaborator(personId) {
    updateDraft({
      collaboratorIds: draft.collaboratorIds.includes(personId)
        ? draft.collaboratorIds.filter((value) => value !== personId)
        : [...draft.collaboratorIds, personId],
    });
  }

  function focusInvalidField(field) {
    const target =
      field === 'title'
        ? titleInput.current
        : field === 'description'
          ? descriptionInput.current
          : collaboratorsFieldset.current;
    target?.focus();
  }

  async function submit(event) {
    event.preventDefault();
    if (submitting.current || saving || disabled) return;

    let field = 'title';
    let message = null;
    if (!validTaskTitle(draft.title)) {
      message = 'Informe o título da Task.';
    } else if (!validTaskDescription(draft.description)) {
      field = 'description';
      message = 'A descrição deve ter no máximo 5.000 caracteres.';
    } else if (allowCollaboratorSelection && collaboratorsLoading) {
      field = 'collaborators';
      message = 'Aguarde o carregamento dos colaboradores antes de salvar.';
    } else if (allowCollaboratorSelection && collaboratorsError) {
      field = 'collaborators';
      message = 'Carregue os colaboradores antes de salvar a Task.';
    } else if (allowCollaboratorSelection && unavailableIds.length > 0) {
      field = 'collaborators';
      message = 'Remova ou atualize as atribuições de colaboradores indisponíveis.';
    }

    setValidationError(message ? { field, message } : null);
    if (message) {
      focusInvalidField(field);
      return;
    }

    submitting.current = true;
    try {
      const payload = {
        title: draft.title.trim(),
        description: draft.description.trim() || null,
      };
      if (allowCollaboratorSelection) payload.collaborator_ids = draft.collaboratorIds;
      else if (!task) payload.collaborator_ids = [];
      const saved = await onSubmit(payload);
      if (saved) {
        setValidationError(null);
        if (!task) {
          setDraft({ title: '', description: '', collaboratorIds: [] });
          setDirty(false);
          requestAnimationFrame(() => titleInput.current?.focus());
        }
      }
    } finally {
      submitting.current = false;
    }
  }

  return (
    <section className="card mt-5 max-w-3xl" aria-labelledby={headingId}>
      <h2 id={headingId} className="text-lg font-bold">
        {task ? 'Editar Task' : 'Criar Task'}
      </h2>
      <form className="mt-4 space-y-4" onSubmit={submit} noValidate>
        <div>
          <label htmlFor={`${id}-title`} className="block text-sm font-semibold">
            Título
          </label>
          <input
            ref={titleInput}
            id={`${id}-title`}
            className="form-field mt-1"
            value={draft.title}
            onChange={(event) => updateDraft({ title: event.target.value })}
            required
            maxLength={200}
            disabled={disabled || saving}
            aria-invalid={validationError?.field === 'title' ? 'true' : undefined}
            aria-describedby={validationError?.field === 'title' ? `${id}-title-error` : undefined}
          />
        </div>

        <div>
          <label htmlFor={`${id}-description`} className="block text-sm font-semibold">
            Descrição
          </label>
          <textarea
            ref={descriptionInput}
            id={`${id}-description`}
            className="form-field mt-1 min-h-24 resize-y"
            value={draft.description}
            onChange={(event) => updateDraft({ description: event.target.value })}
            maxLength={5000}
            disabled={disabled || saving}
            aria-describedby={`${id}-description-help${validationError?.field === 'description' ? ` ${id}-description-error` : ''}`}
            aria-invalid={validationError?.field === 'description' ? 'true' : undefined}
          />
          <p id={`${id}-description-help`} className="mt-1 text-xs muted">
            Opcional. Até 5.000 caracteres.
          </p>
        </div>

        {allowCollaboratorSelection ? (
          <fieldset
            ref={collaboratorsFieldset}
            className="rounded-lg border border-line p-3 dark:border-slate-700"
            disabled={disabled || saving || collaboratorsLoading}
            aria-describedby={`${id}-collaborators-help${validationError?.field === 'collaborators' ? ` ${id}-collaborators-error` : ''}`}
            aria-invalid={validationError?.field === 'collaborators' ? 'true' : undefined}
            tabIndex={-1}
          >
            <legend className="px-1 text-sm font-semibold">Colaboradores atribuídos</legend>
            <p id={`${id}-collaborators-help`} className="mb-2 text-xs muted">
              Atribuição opcional. Selecione membros da equipe disponíveis neste modo de
              demonstração.
            </p>
            {collaboratorsLoading ? (
              <p className="text-sm muted" role="status">
                Carregando colaboradores…
              </p>
            ) : collaboratorsError ? (
              <div>
                <ErrorNotice>{collaboratorsError}</ErrorNotice>
                <button
                  type="button"
                  className="secondary-button mt-2"
                  onClick={onRetryCollaborators}
                  disabled={disabled || saving}
                >
                  Tentar carregar colaboradores novamente
                </button>
              </div>
            ) : collaborators.length === 0 ? (
              <p className="text-sm muted">
                Nenhum colaborador disponível; a Task pode ficar sem atribuição.
              </p>
            ) : (
              <>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {collaborators.map((person) => {
                    const checkboxId = `${id}-collaborator-${person.id}`;
                    return (
                      <li key={person.id}>
                        <label
                          htmlFor={checkboxId}
                          className="flex min-h-11 items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <input
                            id={checkboxId}
                            type="checkbox"
                            value={person.id}
                            checked={draft.collaboratorIds.includes(person.id)}
                            onChange={() => toggleCollaborator(person.id)}
                          />
                          <span>{person.full_name || person.username}</span>
                          {person.full_name && (
                            <span className="text-xs muted">({person.username})</span>
                          )}
                        </label>
                      </li>
                    );
                  })}
                </ul>
                {unavailableIds.length > 0 && (
                  <div className="mt-3 rounded-md border border-amber-500/50 p-3">
                    <p className="text-sm font-semibold">
                      Algumas atribuições não existem na lista atual de colaboradores.
                    </p>
                    <ul className="mt-2 space-y-2">
                      {unavailableIds.map((personId) => (
                        <li key={personId} className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="break-all">
                            Colaborador indisponível · ID {personId}
                          </span>
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => toggleCollaborator(personId)}
                          >
                            Remover atribuição
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </fieldset>
        ) : (
          <section
            className="rounded-lg border border-line p-3 dark:border-slate-700"
            aria-labelledby={`${id}-collaborators-title`}
          >
            <h3 id={`${id}-collaborators-title`} className="text-sm font-semibold">
              Colaboradores atribuídos
            </h3>
            <p className="mt-1 text-xs muted">
              A atribuição está indisponível porque o Backend ainda não oferece uma consulta segura
              da equipe do gestor. Esta Task pode ficar sem colaboradores.
            </p>
            {task?.collaborators?.length ? (
              <ul className="mt-2 list-inside list-disc text-sm">
                {task.collaborators.map((person) => (
                  <li key={person.id}>{person.full_name || person.username}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm muted">Nenhum colaborador atribído.</p>
            )}
          </section>
        )}

        {validationError && (
          <p
            id={`${id}-${validationError.field}-error`}
            role="alert"
            className="text-sm text-red-700 dark:text-red-300"
          >
            {validationError.message}
          </p>
        )}
        {error && <ErrorNotice>{error}</ErrorNotice>}
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            className="primary-button"
            disabled={
              disabled ||
              saving ||
              (allowCollaboratorSelection && collaboratorsLoading) ||
              (allowCollaboratorSelection && !!collaboratorsError)
            }
          >
            {saving ? 'Salvando…' : task ? 'Salvar alterações' : 'Criar Task'}
          </button>
          {task && (
            <button type="button" className="secondary-button" onClick={onCancel} disabled={saving}>
              Cancelar edição
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
