import '@testing-library/jest-dom/vitest'

const sessionBacking = new Map<string, string>()

if (typeof globalThis.sessionStorage === 'undefined') {
  globalThis.sessionStorage = {
    getItem: (key: string) => sessionBacking.get(key) ?? null,
    setItem: (key: string, value: string) => {
      sessionBacking.set(key, value)
    },
    removeItem: (key: string) => {
      sessionBacking.delete(key)
    },
    clear: () => sessionBacking.clear(),
    key: () => null,
    length: 0,
  } as Storage
}
