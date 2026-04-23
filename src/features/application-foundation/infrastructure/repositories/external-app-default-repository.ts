import type { ExternalAppRepository } from '../../application/repositories/external-app-repository'
import { invokeCommand } from '@lib/invoke/commands'
import { openPath } from '@tauri-apps/plugin-opener'

export class ExternalAppDefaultRepository implements ExternalAppRepository {
  async openPath(path: string): Promise<void> {
    await openPath(path)
  }

  async openInEditor(path: string): Promise<void> {
    const result = await invokeCommand('open_in_editor', { path })
    if (result.success === false) throw new Error(result.error.message)
  }
}
