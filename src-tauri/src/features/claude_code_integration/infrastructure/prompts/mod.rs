//! Claude CLI へ送信するプロンプト構築モジュール。
//!
//! 各プロンプトはユースケースごとにファイルを分離し、純粋関数として `pub fn build_*_prompt(...) -> String` を公開する。
//! プロンプトの差分追跡とスナップショットテストを容易にするために、`infrastructure/claude_repository.rs` から本モジュールに移譲する。

pub mod commit_message;
pub mod conflict_resolve;
pub mod explain;
pub mod review;
