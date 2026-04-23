//! UseCase 実装 — 旧 TypeScript main-process の UseCase を 1:1 移植。
//!
//! 各 UseCase は関数として実装し、Repository trait を引数で受け取る。
//! `#[tauri::command]` (presentation 層) から呼び出される。

use crate::error::{AppError, AppResult};
use crate::features::application_foundation::application::repositories::{
    DialogRepository, GitValidationRepository, StoreRepository,
};
use crate::features::application_foundation::domain::{AppSettings, RecentRepository, RepositoryInfo, Theme};

const MAX_RECENT: usize = 20;

/// ダイアログでフォルダを選択し、Git リポジトリとして開く。
/// 旧: OpenRepositoryWithDialogMainUseCase
pub async fn open_repository_with_dialog(
    store: &dyn StoreRepository,
    git_validator: &dyn GitValidationRepository,
    dialog: &dyn DialogRepository,
) -> AppResult<Option<RepositoryInfo>> {
    let dir_path = match dialog.show_open_directory_dialog().await? {
        Some(p) => p,
        None => return Ok(None), // ダイアログキャンセル
    };

    let is_valid = git_validator.is_git_repository(&dir_path).await?;
    if !is_valid {
        return Err(AppError::GitError(
            "選択されたフォルダは有効な Git リポジトリではありません".to_string(),
        ));
    }

    let name = extract_dir_name(&dir_path);
    let repo_info = RepositoryInfo {
        path: dir_path,
        name,
        is_valid: true,
    };
    add_to_recent(store, &repo_info)?;
    Ok(Some(repo_info))
}

/// パスを直接指定して Git リポジトリを開く。
/// 旧: OpenRepositoryByPathMainUseCase
pub async fn open_repository_by_path(
    store: &dyn StoreRepository,
    git_validator: &dyn GitValidationRepository,
    path: &str,
) -> AppResult<Option<RepositoryInfo>> {
    let is_valid = git_validator.is_git_repository(path).await?;
    if !is_valid {
        return Ok(None);
    }

    let name = extract_dir_name(path);
    let repo_info = RepositoryInfo {
        path: path.to_string(),
        name,
        is_valid: true,
    };
    add_to_recent(store, &repo_info)?;
    Ok(Some(repo_info))
}

/// パスが Git リポジトリかどうかを検証する。
/// 旧: ValidateRepositoryMainUseCase
pub async fn validate_repository(git_validator: &dyn GitValidationRepository, path: &str) -> AppResult<bool> {
    git_validator.is_git_repository(path).await
}

/// 最近のリポジトリ一覧を取得する。
/// 旧: GetRecentRepositoriesMainUseCase
pub fn get_recent_repositories(store: &dyn StoreRepository) -> AppResult<Vec<RecentRepository>> {
    store.get_recent_repositories()
}

/// 最近のリポジトリから指定パスを削除する。
/// 旧: RemoveRecentRepositoryMainUseCase
pub fn remove_recent_repository(store: &dyn StoreRepository, path: &str) -> AppResult<()> {
    let mut recent = store.get_recent_repositories()?;
    recent.retain(|r| r.path != path);
    store.set_recent_repositories(&recent)
}

/// リポジトリのピン留め状態を更新する。
/// 旧: PinRepositoryMainUseCase
pub fn pin_repository(store: &dyn StoreRepository, path: &str, pinned: bool) -> AppResult<()> {
    let mut recent = store.get_recent_repositories()?;
    if let Some(repo) = recent.iter_mut().find(|r| r.path == path) {
        repo.pinned = pinned;
    }
    store.set_recent_repositories(&recent)
}

/// アプリケーション設定を取得する。
/// 旧: GetSettingsMainUseCase
pub fn get_settings(store: &dyn StoreRepository) -> AppResult<AppSettings> {
    store.get_settings()
}

/// アプリケーション設定を部分更新する。
/// 旧: UpdateSettingsMainUseCase
pub fn update_settings(store: &dyn StoreRepository, partial: &AppSettings) -> AppResult<()> {
    // Phase IB: 全フィールド上書き (Partial<AppSettings> ではなく AppSettings を受け取る)
    // shim 側が settings オブジェクト全体を渡すので、そのまま保存する
    store.set_settings(partial)
}

/// 現在のテーマを取得する。
/// 旧: GetThemeMainUseCase
pub fn get_theme(store: &dyn StoreRepository) -> AppResult<Theme> {
    let settings = store.get_settings()?;
    Ok(settings.theme)
}

/// テーマを変更する。
/// 旧: SetThemeMainUseCase
pub fn set_theme(store: &dyn StoreRepository, theme: Theme) -> AppResult<()> {
    let mut settings = store.get_settings()?;
    settings.theme = theme;
    store.set_settings(&settings)
}

/// 設定されたエディタアプリでディレクトリやファイルを開く。
pub fn open_in_editor(store: &dyn StoreRepository, path: &str) -> AppResult<()> {
    let settings = store.get_settings()?;
    let editor = settings.external_editor.ok_or_else(|| {
        AppError::Internal("外部エディタが設定されていません。設定画面でエディタを選択してください。".to_string())
    })?;

    #[cfg(target_os = "macos")]
    let result = std::process::Command::new("open")
        .arg("-a")
        .arg(&editor)
        .arg(path)
        .spawn();

    #[cfg(not(target_os = "macos"))]
    let result = std::process::Command::new(&editor).arg(path).spawn();

    result.map_err(|e| AppError::GitError(format!("エディタ '{}' の起動に失敗しました: {}", editor, e)))?;

    Ok(())
}

/// ダイアログでエディタアプリを選択し、設定に保存する。
pub async fn select_external_editor_app(
    store: &dyn StoreRepository,
    dialog: &dyn DialogRepository,
) -> AppResult<Option<String>> {
    eprintln!("[select_external_editor_app] opening dialog...");
    let selected = dialog.show_select_application_dialog().await?;
    eprintln!("[select_external_editor_app] dialog returned: {:?}", selected);
    if let Some(ref app_path) = selected {
        let mut settings = store.get_settings()?;
        settings.external_editor = Some(app_path.clone());
        store.set_settings(&settings)?;
        eprintln!("[select_external_editor_app] saved to settings: {}", app_path);
    }
    Ok(selected)
}

// --- ヘルパー ---

/// RepositoryInfo を最近のリポジトリ一覧に追加する。
/// 旧: recent-repository-helper.ts の addToRecent
fn add_to_recent(store: &dyn StoreRepository, repo: &RepositoryInfo) -> AppResult<()> {
    let mut recent = store.get_recent_repositories()?;
    let pinned = recent
        .iter()
        .find(|r| r.path == repo.path)
        .map(|r| r.pinned)
        .unwrap_or(false);
    recent.retain(|r| r.path != repo.path);
    let entry = RecentRepository {
        path: repo.path.clone(),
        name: repo.name.clone(),
        last_accessed: chrono::Utc::now().to_rfc3339(),
        pinned,
    };
    recent.insert(0, entry);
    recent.truncate(MAX_RECENT);
    store.set_recent_repositories(&recent)
}

/// パスからディレクトリ名を抽出する。
fn extract_dir_name(path: &str) -> String {
    path.rsplit(['/', '\\'])
        .find(|s| !s.is_empty())
        .unwrap_or(path)
        .to_string()
}
