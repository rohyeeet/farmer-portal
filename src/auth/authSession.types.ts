/** Persisted session shape — stored as JSON in sessionStorage (tab-scoped). */
export type PersistedAuthSessionV1 = {
  version: 1
  accessToken: string
  tokenType: string
  clientHeader: {
    name: string
    value: string
  }
}
