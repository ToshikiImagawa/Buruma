export interface ExternalAppRepository {
  openPath(path: string): Promise<void>
}
