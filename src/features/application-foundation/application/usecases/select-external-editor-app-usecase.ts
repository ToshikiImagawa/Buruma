import type { SupplierUseCase } from '@lib/usecase'
import type { SettingsRepository } from '../repositories/settings-repository'
import type { SettingsService } from '../services/settings-service-interface'

export class SelectExternalEditorAppDefaultUseCase implements SupplierUseCase<Promise<string | null>> {
  constructor(
    private readonly repo: SettingsRepository,
    private readonly service: SettingsService,
  ) {}

  async invoke(): Promise<string | null> {
    const selected = await this.repo.selectEditorApp()
    if (selected) {
      // Rust 側が既に永続化済みなので、Service の状態のみ更新する
      this.service.updateSettings({ externalEditor: selected })
    }
    return selected
  }
}
