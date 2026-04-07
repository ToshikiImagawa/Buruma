import type { ClaudeAuthStatus, ClaudeCommand, ClaudeOutput, ClaudeSession } from '@domain'
import type { ClaudeProcessRepository } from '../application/repositories/claude-process-repository'
import type { ClaudeSessionStore, InternalSession } from '../application/services/claude-session-store-interface'
import { spawn } from 'child_process'

/**
 * Claude Code CLI をコマンドごとに `claude -p` で実行する方式。
 * セッション = ワークツリーの作業コンテキスト（出力履歴管理）。
 * 子プロセスはコマンド実行中のみ存在する。
 */
export class ClaudeProcessManager implements ClaudeProcessRepository {
  private outputListeners: ((output: ClaudeOutput) => void)[] = []
  private sessionChangedListeners: ((session: ClaudeSession) => void)[] = []
  private commandCompletedListeners: ((data: { worktreePath: string }) => void)[] = []

  constructor(private readonly sessionStore: ClaudeSessionStore) {}

  // 親プロセスの環境変数を継承（認証情報やキーチェーンアクセスに必要）
  private buildEnv(): NodeJS.ProcessEnv {
    return { ...process.env }
  }

  async startSession(worktreePath: string): Promise<ClaudeSession> {
    if (this.sessionStore.has(worktreePath)) {
      throw new Error('Session already exists for this worktree')
    }

    const internal: InternalSession = {
      worktreePath,
      status: 'running',
      pid: null,
      startedAt: new Date().toISOString(),
      error: null,
      outputBuffer: [],
      process: null,
    }
    this.sessionStore.set(worktreePath, internal)
    this.notifySessionChanged(worktreePath)

    return this.sessionStore.toClaudeSession(internal)
  }

  async stopSession(worktreePath: string): Promise<void> {
    const session = this.sessionStore.get(worktreePath)
    if (session?.process) {
      session.status = 'stopping'
      this.sessionStore.set(worktreePath, session)
      this.notifySessionChanged(worktreePath)

      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          session.process?.kill('SIGKILL')
        }, 5000)

        session.process!.on('exit', () => {
          clearTimeout(timeout)
          resolve()
        })

        session.process!.kill('SIGTERM')
      })
    }

    this.sessionStore.delete(worktreePath)
    this.notifySessionChanged(worktreePath)
  }

  async sendCommand(command: ClaudeCommand): Promise<void> {
    const session = this.sessionStore.get(command.worktreePath)
    if (!session || session.status !== 'running') {
      throw new Error('No active session for this worktree')
    }

    // 実行中のプロセスがあれば待機
    if (session.process) {
      throw new Error('A command is already running')
    }

    // ユーザー入力を出力に追加（表示用）
    const userOutput: ClaudeOutput = {
      worktreePath: command.worktreePath,
      stream: 'stdout',
      content: `> ${command.input}\n`,
      timestamp: new Date().toISOString(),
    }
    this.sessionStore.appendOutput(command.worktreePath, userOutput)
    this.notifyOutput(userOutput)

    // claude -p でコマンドを実行（stdin は使わないので ignore）
    const child = spawn('claude', ['-p', command.input], {
      cwd: command.worktreePath,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: this.buildEnv(),
    })

    session.process = child
    session.pid = child.pid ?? null
    this.sessionStore.set(command.worktreePath, session)

    child.stdout?.on('data', (data: Buffer) => {
      const output: ClaudeOutput = {
        worktreePath: command.worktreePath,
        stream: 'stdout',
        content: data.toString(),
        timestamp: new Date().toISOString(),
      }
      this.sessionStore.appendOutput(command.worktreePath, output)
      this.notifyOutput(output)
    })

    child.stderr?.on('data', (data: Buffer) => {
      const output: ClaudeOutput = {
        worktreePath: command.worktreePath,
        stream: 'stderr',
        content: data.toString(),
        timestamp: new Date().toISOString(),
      }
      this.sessionStore.appendOutput(command.worktreePath, output)
      this.notifyOutput(output)
    })

    child.on('exit', () => {
      const s = this.sessionStore.get(command.worktreePath)
      if (s) {
        s.process = null
        s.pid = null
        this.sessionStore.set(command.worktreePath, s)
      }
      this.notifyCommandCompleted(command.worktreePath)
    })

    child.on('error', (err: Error) => {
      const s = this.sessionStore.get(command.worktreePath)
      if (s) {
        s.status = 'error'
        s.error = err.message
        s.process = null
        s.pid = null
        this.sessionStore.set(command.worktreePath, s)
        this.notifySessionChanged(command.worktreePath)
      }
    })
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

  onCommandCompleted(listener: (data: { worktreePath: string }) => void): () => void {
    this.commandCompletedListeners.push(listener)
    return () => {
      this.commandCompletedListeners = this.commandCompletedListeners.filter((l) => l !== listener)
    }
  }

  async generateText(worktreePath: string, prompt: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const stdoutChunks: Buffer[] = []
      const stderrChunks: Buffer[] = []

      const child = spawn('claude', ['-p', prompt], {
        cwd: worktreePath,
        shell: false,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: this.buildEnv(),
      })

      child.stdout?.on('data', (data: Buffer) => {
        stdoutChunks.push(data)
      })

      child.stderr?.on('data', (data: Buffer) => {
        stderrChunks.push(data)
      })

      child.on('exit', (code) => {
        const stdout = Buffer.concat(stdoutChunks).toString()
        const stderr = Buffer.concat(stderrChunks).toString()
        if (code !== 0) {
          reject(new Error(stderr.trim() || `Claude CLI がコード ${code} で終了しました`))
        } else {
          resolve(stdout)
        }
      })

      child.on('error', (err: Error) => {
        reject(new Error(`Claude CLI の実行に失敗しました: ${err.message}`))
      })
    })
  }

  async checkAuth(): Promise<ClaudeAuthStatus> {
    return new Promise<ClaudeAuthStatus>((resolve, reject) => {
      const stdoutChunks: Buffer[] = []

      const child = spawn('claude', ['auth', 'status'], {
        shell: false,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: this.buildEnv(),
      })

      child.stdout?.on('data', (data: Buffer) => {
        stdoutChunks.push(data)
      })

      child.on('exit', (code) => {
        const authenticated = code === 0
        const stdout = Buffer.concat(stdoutChunks).toString()
        let accountEmail: string | undefined
        try {
          const parsed = JSON.parse(stdout)
          accountEmail = parsed.email ?? parsed.account?.email
        } catch {
          // JSON パース失敗は無視し、exit code のみで判定
        }
        resolve({ authenticated, accountEmail })
      })

      child.on('error', (err: Error) => {
        reject(new Error(`Claude CLI の実行に失敗しました: ${err.message}`))
      })
    })
  }

  async login(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const child = spawn('claude', ['auth', 'login'], {
        shell: false,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: this.buildEnv(),
      })

      child.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`ログインに失敗しました（コード ${code}）`))
        } else {
          resolve()
        }
      })

      child.on('error', (err: Error) => {
        reject(new Error(`Claude CLI の実行に失敗しました: ${err.message}`))
      })
    })
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

  private notifyCommandCompleted(worktreePath: string): void {
    for (const listener of this.commandCompletedListeners) {
      listener({ worktreePath })
    }
  }
}
