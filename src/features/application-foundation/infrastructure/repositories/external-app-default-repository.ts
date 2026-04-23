import type { ExternalAppRepository } from '../../application/repositories/external-app-repository'
import { openPath } from '@tauri-apps/plugin-opener'

export class ExternalAppDefaultRepository implements ExternalAppRepository {
  async openPath(path: string): Promise<void> {
    await openPath(path)
  }
}
