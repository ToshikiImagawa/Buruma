import type { IDialogRepository } from '../../application/repositories/types'
import { dialog } from 'electron'

export class ElectronDialogRepository implements IDialogRepository {
  async showOpenDirectoryDialog(): Promise<string | null> {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'リポジトリを選択',
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    return result.filePaths[0]
  }
}
