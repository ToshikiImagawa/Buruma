export interface ExternalAppRepository {
  openPath(path: string): Promise<void>
  openInEditor(path: string): Promise<void>
}
