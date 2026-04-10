//! `tokio::process::Command` ベースの git CLI 実行ヘルパー。
//!
//! Phase IA では雛形のみ。Phase IC 以降で `raw()` / `raw_with_progress()` を実装する。
//! 設計方針: 既存 TypeScript 側の `simple-git.raw([...])` 呼び出しを 1:1 で移植する。

#![allow(dead_code)]

use crate::error::AppResult;

/// git CLI を引数付きで実行し、stdout を文字列で返す。
///
/// Phase IC 以降で実装予定のシグネチャ:
/// ```ignore
/// pub async fn raw(cwd: &str, args: &[&str]) -> AppResult<String> { ... }
/// ```
pub async fn raw(_cwd: &str, _args: &[&str]) -> AppResult<String> {
    unimplemented!("git::command::raw is a Phase IC stub")
}
