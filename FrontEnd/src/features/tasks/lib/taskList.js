function taskTitle(task) {
  return typeof task?.title === 'string' ? task.title : task?.description || '';
}

function compareTitle(left, right) {
  return (
    taskTitle(left).localeCompare(taskTitle(right), 'pt-BR', { sensitivity: 'base' }) ||
    left.id.localeCompare(right.id)
  );
}

function compareIdDescending(left, right) {
  if (left.id === right.id) return 0;
  return left.id < right.id ? 1 : -1;
}

/** @param {unknown} tasks @param {string} search @param {string} sortOrder */
export function filterAndSortTasks(tasks, search = '', sortOrder = 'recent') {
  const list = Array.isArray(tasks) ? tasks : [];
  const query = typeof search === 'string' ? search.trim().toLocaleLowerCase('pt-BR') : '';
  const visible = list.filter((task) => {
    const title = taskTitle(task).toLocaleLowerCase('pt-BR');
    const description =
      typeof task?.description === 'string' ? task.description.toLocaleLowerCase('pt-BR') : '';
    return `${title}\n${description}`.includes(query);
  });

  return [...visible].sort((left, right) => {
    if (sortOrder === 'title-asc') return compareTitle(left, right);
    if (sortOrder === 'title-desc') return compareTitle(right, left);

    const dateDifference = Date.parse(right.created_at) - Date.parse(left.created_at);
    return Number.isNaN(dateDifference) || dateDifference === 0
      ? compareIdDescending(left, right)
      : dateDifference;
  });
}
