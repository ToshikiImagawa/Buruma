import type { IGitValidationRepository } from '../application/repository-interfaces'
import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

export class GitValidationRepository implements IGitValidationRepository {
  async isGitRepository(dirPath: string): Promise<boolean> {
    try {
      await execFileAsync('git', ['rev-parse', '--is-inside-work-tree'], { cwd: dirPath })
      return true
    } catch {
      return false
    }
  }
}
