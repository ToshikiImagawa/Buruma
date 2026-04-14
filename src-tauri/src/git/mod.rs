//! 共通 git CLI ラッパー。
//!
//! Phase IA では雛形のみ。各サブモジュールの中身は Phase IC 以降で実装する。

pub mod command;
pub mod diff_parser;
pub mod log_parser;
pub mod porcelain;
