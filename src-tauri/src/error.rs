//! Application-wide error type.
//!
//! `AppError` は `Serialize` を実装し、`#[tauri::command]` の戻り値 `Result<T, AppError>` として
//! Webview 側に JSON (`{ code, message, detail? }` 形状) で渡る。
//! Webview 側の `src/shared/lib/invoke/commands.ts` の `invokeCommand<T>` がこれを `IPCResult<T>` に
//! ラップして返す。

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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_code_returns_correct_strings() {
        assert_eq!(AppError::NotFound("x".into()).code(), "NOT_FOUND");
        assert_eq!(AppError::GitError("x".into()).code(), "GIT_ERROR");
        assert_eq!(
            AppError::GitOperation {
                code: "X".into(),
                message: "m".into()
            }
            .code(),
            "GIT_OPERATION_ERROR"
        );
        assert_eq!(AppError::Repository("x".into()).code(), "REPOSITORY_ERROR");
        assert_eq!(AppError::DialogCancelled.code(), "DIALOG_CANCELLED");
        assert_eq!(AppError::Claude("x".into()).code(), "CLAUDE_ERROR");
        assert_eq!(AppError::Internal("x".into()).code(), "INTERNAL_ERROR");
    }

    #[test]
    fn test_serialize_standard_variant() {
        let err = AppError::NotFound("item missing".into());
        let val = serde_json::to_value(&err).unwrap();
        assert_eq!(val["code"], "NOT_FOUND");
        assert_eq!(val["message"], "item missing");
        assert!(val["detail"].is_null());
    }

    #[test]
    fn test_serialize_git_operation_uses_inner_code() {
        let err = AppError::GitOperation {
            code: "PUSH_REJECTED".into(),
            message: "rejected by remote".into(),
        };
        let val = serde_json::to_value(&err).unwrap();
        // GitOperation は code() の "GIT_OPERATION_ERROR" ではなく内部の code フィールドを使う
        assert_eq!(val["code"], "PUSH_REJECTED");
        assert_eq!(val["message"], "rejected by remote");
        assert!(val["detail"].is_null());
    }

    #[test]
    fn test_serialize_git_error() {
        let err = AppError::GitError("fatal: not a git repository".into());
        let val = serde_json::to_value(&err).unwrap();
        assert_eq!(val["code"], "GIT_ERROR");
        assert_eq!(val["message"], "fatal: not a git repository");
    }

    #[test]
    fn test_serialize_dialog_cancelled() {
        let err = AppError::DialogCancelled;
        let val = serde_json::to_value(&err).unwrap();
        assert_eq!(val["code"], "DIALOG_CANCELLED");
        assert_eq!(val["message"], "dialog cancelled");
    }
}
