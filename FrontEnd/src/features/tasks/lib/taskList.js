function compareDescription(left, right) {
  return (
    left.description.localeCompare(right.description, 'pt-BR', { sensitivity: 'base' }) ||
    left.id.localeCompare(right.id)
  );
}

/** @param {unknown} tasks @param {string} search @param {string} sortOrder */
export function filterAndSortTasks(tasks, search = '', sortOrder = 'recent') {
  const list = Array.isArray(tasks) ? tasks : [];
  const query = typeof search === 'string' ? search.trim().toLocaleLowerCase('pt-BR') : '';
  const visible = list.filter((task) =>
    typeof task?.description === 'string'
      ? task.description.toLocaleLowerCase('pt-BR').includes(query)
      : false,
  );

  return [...visible].sort((left, right) => {
    if (sortOrder === 'description-asc') return compareDescription(left, right);
    if (sortOrder === 'description-desc') return compareDescription(right, left);

    const dateDifference = Date.parse(right.created_at) - Date.parse(left.created_at);
    return Number.isNaN(dateDifference) || dateDifference === 0
      ? left.id.localeCompare(right.id)
      : dateDifference;
  });
}
