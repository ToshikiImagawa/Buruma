import type { Observable } from 'rxjs'
import { map } from 'rxjs'
import { BehaviorSubject } from 'rxjs'
import type { ReactivePropertyUseCase, ReadOnlyReactiveProperty } from '@/lib/usecase'
import type { AppSettings } from '../../domain'
import type { ISettingsService } from '../../di-tokens'

class SettingsReactiveProperty implements ReadOnlyReactiveProperty<AppSettings> {
  private readonly _subject: BehaviorSubject<AppSettings>

  constructor(private readonly settings$: Observable<AppSettings>, initialValue: AppSettings) {
    this._subject = new BehaviorSubject<AppSettings>(initialValue)
    this.settings$.pipe(map((v) => v)).subscribe((v) => this._subject.next(v))
  }

  get value(): AppSettings {
    return this._subject.getValue()
  }

  asObservable(): Observable<AppSettings> {
    return this._subject.asObservable()
  }
}

export class GetSettingsUseCaseImpl implements ReactivePropertyUseCase<AppSettings> {
  readonly property: ReadOnlyReactiveProperty<AppSettings>

  constructor(private readonly service: ISettingsService) {
    // BehaviorSubject から同期的に初期値を取得
    let initialValue: AppSettings | undefined
    const sub = this.service.settings$.subscribe((v) => (initialValue = v))
    sub.unsubscribe()
    this.property = new SettingsReactiveProperty(this.service.settings$, initialValue!)
  }
}
