import type { ClaudeOutput } from '@domain'
import type { InternalSession } from '../services/claude-session-store-interface'
import { beforeEach, describe, expect, it } from 'vitest'
import { ClaudeDefaultSessionStore } from '../services/claude-session-store'

function createSession(worktreePath: string, overrides?: Partial<InternalSession>): InternalSession {
  return {
    worktreePath,
    status: 'running',
    pid: 123,
    startedAt: '2026-01-01T00:00:00Z',
    error: null,
    outputBuffer: [],
    process: null,
    ...overrides,
  }
}

function createOutput(worktreePath: string, content: string): ClaudeOutput {
  return {
    worktreePath,
    stream: 'stdout',
    content,
    timestamp: new Date().toISOString(),
  }
}

describe('ClaudeDefaultSessionStore', () => {
  let store: ClaudeDefaultSessionStore

  beforeEach(() => {
    store = new ClaudeDefaultSessionStore()
    store.setUp()
  })

  it('セッションの追加と取得ができる', () => {
    const session = createSession('/repo')
    store.set('/repo', session)

    expect(store.get('/repo')).toBe(session)
    expect(store.has('/repo')).toBe(true)
  })

  it('存在しないセッションは null を返す', () => {
    expect(store.get('/nonexistent')).toBeNull()
    expect(store.has('/nonexistent')).toBe(false)
  })

  it('セッションの削除ができる', () => {
    store.set('/repo', createSession('/repo'))
    store.delete('/repo')

    expect(store.get('/repo')).toBeNull()
    expect(store.has('/repo')).toBe(false)
  })

  it('全セッションを ClaudeSession 形式で取得できる', () => {
    store.set('/repo1', createSession('/repo1'))
    store.set('/repo2', createSession('/repo2'))

    const all = store.getAll()
    expect(all).toHaveLength(2)
    expect(all[0]).not.toHaveProperty('process')
    expect(all[0]).not.toHaveProperty('outputBuffer')
  })

  it('出力をバッファに追加できる', () => {
    store.set('/repo', createSession('/repo'))
    store.appendOutput('/repo', createOutput('/repo', 'hello'))
    store.appendOutput('/repo', createOutput('/repo', 'world'))

    const history = store.getOutputHistory('/repo')
    expect(history).toHaveLength(2)
    expect(history[0].content).toBe('hello')
    expect(history[1].content).toBe('world')
  })

  it('出力バッファが 1000 件を超えると古いものが削除される', () => {
    store.set('/repo', createSession('/repo'))
    for (let i = 0; i < 1050; i++) {
      store.appendOutput('/repo', createOutput('/repo', `line-${i}`))
    }

    const history = store.getOutputHistory('/repo')
    expect(history).toHaveLength(1000)
    expect(history[0].content).toBe('line-50')
    expect(history[999].content).toBe('line-1049')
  })

  it('toClaudeSession で process と outputBuffer が除外される', () => {
    const internal = createSession('/repo')
    const session = store.toClaudeSession(internal)

    expect(session).toEqual({
      worktreePath: '/repo',
      status: 'running',
      pid: 123,
      startedAt: '2026-01-01T00:00:00Z',
      error: null,
    })
    expect(session).not.toHaveProperty('process')
    expect(session).not.toHaveProperty('outputBuffer')
  })

  it('tearDown で全セッションがクリアされる', () => {
    store.set('/repo1', createSession('/repo1'))
    store.set('/repo2', createSession('/repo2'))
    store.tearDown()

    expect(store.getAll()).toHaveLength(0)
  })
})
