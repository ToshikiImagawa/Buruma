import type { ClaudeCommand, ClaudeOutput, ClaudeSession } from '@domain'
import type { ClaudeProcessRepository } from '../application/repositories/claude-process-repository'
import type { ClaudeSessionStore, InternalSession } from '../application/services/claude-session-store-interface'
import { spawn } from 'child_process'

export class ClaudeProcessManager implements ClaudeProcessRepository {
  private outputListeners: ((output: ClaudeOutput) => void)[] = []
  private sessionChangedListeners: ((session: ClaudeSession) => void)[] = []

  constructor(private readonly sessionStore: ClaudeSessionStore) {}

  async startSession(worktreePath: string): Promise<ClaudeSession> {
    if (this.sessionStore.has(worktreePath)) {
      throw new Error('Session already exists for this worktree')
    }

    const internal: InternalSession = {
      worktreePath,
      status: 'starting',
      pid: null,
      startedAt: null,
      error: null,
      outputBuffer: [],
      process: null,
    }
    this.sessionStore.set(worktreePath, internal)
    this.notifySessionChanged(worktreePath)

    const filteredEnv: Record<string, string> = {}
    for (const [key, value] of Object.entries(process.env)) {
      if (key === 'PATH' || key === 'HOME' || key.startsWith('CLAUDE_')) {
        if (value !== undefined) filteredEnv[key] = value
      }
    }

    const child = spawn('claude', [], {
      cwd: worktreePath,
      shell: false,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: filteredEnv,
    })

    internal.process = child
    internal.pid = child.pid ?? null
    internal.startedAt = new Date().toISOString()
    internal.status = 'running'
    this.sessionStore.set(worktreePath, internal)
    this.notifySessionChanged(worktreePath)

    child.stdout?.on('data', (data: Buffer) => {
      const output: ClaudeOutput = {
        worktreePath,
        stream: 'stdout',
        content: data.toString(),
        timestamp: new Date().toISOString(),
      }
      this.sessionStore.appendOutput(worktreePath, output)
      this.notifyOutput(output)
    })

    child.stderr?.on('data', (data: Buffer) => {
      const output: ClaudeOutput = {
        worktreePath,
        stream: 'stderr',
        content: data.toString(),
        timestamp: new Date().toISOString(),
      }
      this.sessionStore.appendOutput(worktreePath, output)
      this.notifyOutput(output)
    })

    child.on('exit', (code) => {
      const session = this.sessionStore.get(worktreePath)
      if (session) {
        session.status = code === 0 ? 'idle' : 'error'
        session.error = code !== 0 ? `Process exited with code ${code}` : null
        session.process = null
        this.sessionStore.set(worktreePath, session)
        this.notifySessionChanged(worktreePath)
      }
    })

    child.on('error', (err: Error) => {
      const session = this.sessionStore.get(worktreePath)
      if (session) {
        session.status = 'error'
        session.error = err.message
        session.process = null
        this.sessionStore.set(worktreePath, session)
        this.notifySessionChanged(worktreePath)
      }
    })

    return this.sessionStore.toClaudeSession(internal)
  }

  async stopSession(worktreePath: string): Promise<void> {
    const session = this.sessionStore.get(worktreePath)
    if (!session?.process) {
      this.sessionStore.delete(worktreePath)
      return
    }

    session.status = 'stopping'
    this.sessionStore.set(worktreePath, session)
    this.notifySessionChanged(worktreePath)

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        session.process?.kill('SIGKILL')
      }, 5000)

      session.process!.on('exit', () => {
        clearTimeout(timeout)
        this.sessionStore.delete(worktreePath)
        this.notifySessionChanged(worktreePath)
        resolve()
      })

      session.process!.kill('SIGTERM')
    })
  }

  async sendCommand(command: ClaudeCommand): Promise<void> {
    const session = this.sessionStore.get(command.worktreePath)
    if (!session?.process?.stdin) {
      throw new Error('No active session for this worktree')
    }
    session.process.stdin.write(command.input + '\n')
  }

  getSession(worktreePath: string): ClaudeSession | null {
    const internal = this.sessionStore.get(worktreePath)
    return internal ? this.sessionStore.toClaudeSession(internal) : null
  }

  getAllSessions(): ClaudeSession[] {
    return this.sessionStore.getAll()
  }

  getOutputHistory(worktreePath: string): ClaudeOutput[] {
    return this.sessionStore.getOutputHistory(worktreePath)
  }

  async stopAllSessions(): Promise<void> {
    const sessions = this.sessionStore.getAll()
    await Promise.all(sessions.map((s) => this.stopSession(s.worktreePath)))
  }

  onOutput(listener: (output: ClaudeOutput) => void): () => void {
    this.outputListeners.push(listener)
    return () => {
      this.outputListeners = this.outputListeners.filter((l) => l !== listener)
    }
  }

  onSessionChanged(listener: (session: ClaudeSession) => void): () => void {
    this.sessionChangedListeners.push(listener)
    return () => {
      this.sessionChangedListeners = this.sessionChangedListeners.filter((l) => l !== listener)
    }
  }

  private notifyOutput(output: ClaudeOutput): void {
    for (const listener of this.outputListeners) {
      listener(output)
    }
  }

  private notifySessionChanged(worktreePath: string): void {
    const session = this.getSession(worktreePath) ?? {
      worktreePath,
      status: 'idle' as const,
      pid: null,
      startedAt: null,
      error: null,
    }
    for (const listener of this.sessionChangedListeners) {
      listener(session)
    }
  }
}
