// All UI copy. Validation messages are in packages/shared (the backend sends the same ones).
export const strings = {
  form: {
    heading: 'Add task',
    sectionLabel: 'Add a task',
    titleLabel: 'Title',
    titlePlaceholder: 'What needs doing?',
    descriptionLabel: 'Description',
    optional: '(optional)',
    descriptionPlaceholder: 'Add a note',
    add: 'Add task',
    save: 'Save',
    cancel: 'Cancel',
  },
  list: {
    heading: 'Todos',
    sectionLabel: 'Tasks',
    loading: 'Loading tasks',
    todo: 'To do',
    completed: 'Completed',
    empty: 'Nothing to do. Add your first task to get started.',
    progress: (done: number, total: number) => `${done} of ${total} done`,
    loadFailed: "Couldn't load your tasks",
    retry: 'Retry',
  },
  item: {
    edit: 'Edit',
    delete: 'Delete',
    editLabel: (title: string) => `Edit ${title}`,
    deleteLabel: (title: string) => `Delete ${title}`,
    added: (when: string) => `Added ${when}`,
  },
  toast: {
    deleted: (title: string) => `Deleted "${title}"`,
    undo: 'Undo',
  },
  errors: {
    unknown: 'Something went wrong. Please try again.',
    unavailable: "The server isn't responding right now. Please try again in a moment.",
    network: "Couldn't reach the server. Check your connection and try again.",
    notFound: 'This task was already deleted. Refreshing the list.',
    rateLimited: "You're going a bit fast. Wait a moment and try again.",
  },
} as const;
