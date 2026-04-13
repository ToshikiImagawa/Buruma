//! Symlink 関連の Repository trait 定義（FR_106）。

use async_trait::async_trait;

use crate::error::AppResult;
use crate::features::worktree_management::domain::SymlinkConfig;

/// シンボリックリンク設定の読み書き。
/// `get_config` は repo 優先 → app fallback で読み込み。
/// `set_config` は `config.source` に応じて repo または app に保存。
#[async_trait]
pub trait SymlinkConfigRepository: Send + Sync {
    /// 設定を取得する。repo ファイルが存在すればそちらを優先、なければ app 設定。
    async fn get_config(&self, repo_path: &str) -> AppResult<SymlinkConfig>;

    /// 設定を保存する。`config.source` が "repo" なら `.buruma/symlink.json`、"app" なら tauri-plugin-store。
    async fn set_config(&self, repo_path: &str, config: &SymlinkConfig) -> AppResult<()>;
}

/// シンボリックリンク作成操作。
#[async_trait]
pub trait SymlinkFileRepository: Send + Sync {
    /// source から target へシンボリックリンクを作成する。
    async fn create_symlink(&self, source: &str, target: &str) -> AppResult<()>;
}
