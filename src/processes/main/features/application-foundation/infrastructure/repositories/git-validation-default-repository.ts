import type { GitValidationRepository } from '../../application/repositories/types'
import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

export class GitValidationDefaultRepository implements GitValidationRepository {
  async isGitRepository(dirPath: string): Promise<boolean> {
    try {
      await execFileAsync('git', ['rev-parse', '--is-inside-work-tree'], { cwd: dirPath })
      return true
    } catch {
      return false
    }
  }
}
