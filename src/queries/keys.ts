export const queryKeys = {
  // Auth
  auth: {
    me: ['auth', 'me'] as const,
  },

  // Projects
  projects: {
    all: ['projects'] as const,
    detail: (id: string) => ['projects', id] as const,
  },

  // Plugins
  plugins: {
    all: ['plugins'] as const,
    detail: (id: string) => ['plugins', id] as const,
  },

  // Revisions
  revisions: {
    list: (projectId: string) => ['revisions', projectId] as const,
    detail: (projectId: string, revisionId: string) =>
      ['revisions', projectId, revisionId] as const,
  },
} as const;
