//! ドメイン型定義。
//!
//! TypeScript 側 `src/shared/domain/index.ts` の RepositoryInfo / RecentRepository /
//! AppSettings / Theme と 1:1 対応する serde 付き構造体。
//! `#[serde(rename_all = "camelCase")]` で JSON フィールド名を camelCase に変換し、
//! TypeScript 側の型と互換を保つ。

use serde::{Deserialize, Serialize};

/// リポジトリ基本情報。
/// TS: `export interface RepositoryInfo { path: string; name: string; isValid: boolean }`
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RepositoryInfo {
    pub path: String,
    pub name: String,
    pub is_valid: bool,
}

/// 最近のリポジトリ。KV ストアで永続化される。
/// TS: `export interface RecentRepository { path: string; name: string; lastAccessed: string; pinned: boolean }`
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecentRepository {
    pub path: String,
    pub name: String,
    pub last_accessed: String, // ISO 8601
    pub pinned: bool,
}

/// アプリケーション設定。
/// TS: `export interface AppSettings { theme: Theme; gitPath: string | null; ... }`
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub theme: Theme,
    pub git_path: Option<String>,
    pub default_work_dir: Option<String>,
    pub commit_message_rules: Option<String>,
    pub external_editor: Option<String>,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            theme: Theme::System,
            git_path: None,
            default_work_dir: None,
            commit_message_rules: None,
            external_editor: None,
        }
    }
}

/// テーマ設定。
/// TS: `export type Theme = 'light' | 'dark' | 'system'`
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum Theme {
    Light,
    Dark,
    System,
}
