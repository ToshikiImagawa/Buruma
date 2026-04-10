//! Application-wide error type.
//!
//! Phase IA では skeleton のみ。各 feature の移行 (Phase IB〜IG) に合わせて variant を追加する。
//! `AppError` は `Serialize` を実装し、`#[tauri::command]` の戻り値 `Result<T, AppError>` として
//! Webview 側に JSON (`{ code, message, detail? }` 形状) で渡る。
//! Webview 側の `src/shared/lib/invoke/commands.ts` の `invokeCommand<T>` がこれを `IPCResult<T>` に
//! ラップし、既存 `ElectronAPI` 呼び出しと互換な形状で返す。

use serde::{Serialize, Serializer};
use thiserror::Error;

/// アプリケーション全体で使用する共通エラー型。
#[derive(Debug, Error)]
pub enum AppError {
    /// 指定リソースが見つからない。
    #[error("{0}")]
    NotFound(String),

    /// git CLI 実行失敗。
    #[error("{0}")]
    GitError(String),

    /// git 操作 (push/pull/branch 等) で既知のコード付きエラー。
    #[error("{message}")]
    GitOperation { code: String, message: String },

    /// リポジトリ / 永続化層エラー。
    #[error("{0}")]
    Repository(String),

    /// ダイアログキャンセル。
    #[error("dialog cancelled")]
    DialogCancelled,

    /// Claude CLI 関連エラー。
    #[error("{0}")]
    Claude(String),

    /// JSON シリアライズ/デシリアライズ失敗。
    #[error(transparent)]
    Serde(#[from] serde_json::Error),

    /// I/O 失敗。
    #[error(transparent)]
    Io(#[from] std::io::Error),

    /// 未分類の内部エラー。
    #[error("{0}")]
    Internal(String),
}

impl AppError {
    /// エラーコード文字列を返す (Webview 側の `IPCError.code` に対応)。
    pub fn code(&self) -> &'static str {
        match self {
            Self::NotFound(_) => "NOT_FOUND",
            Self::GitError(_) => "GIT_ERROR",
            Self::GitOperation { .. } => "GIT_OPERATION_ERROR",
            Self::Repository(_) => "REPOSITORY_ERROR",
            Self::DialogCancelled => "DIALOG_CANCELLED",
            Self::Claude(_) => "CLAUDE_ERROR",
            Self::Serde(_) => "SERDE_ERROR",
            Self::Io(_) => "IO_ERROR",
            Self::Internal(_) => "INTERNAL_ERROR",
        }
    }
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        use serde::ser::SerializeStruct;
        let (code, detail) = match self {
            Self::GitOperation { code, .. } => (code.as_str(), None::<&str>),
            other => (other.code(), None::<&str>),
        };
        let mut s = serializer.serialize_struct("AppError", 3)?;
        s.serialize_field("code", code)?;
        s.serialize_field("message", &self.to_string())?;
        s.serialize_field("detail", &detail)?;
        s.end()
    }
}

/// アプリケーション共通 Result 型エイリアス。
pub type AppResult<T> = Result<T, AppError>;
