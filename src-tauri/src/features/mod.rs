//! Feature modules — Clean Architecture 4 層構成。
//!
//! 各 feature は `domain` / `application` / `infrastructure` / `presentation` の
//! 4 層に分離し、依存方向は `domain ← application ← infrastructure / presentation`。

pub mod advanced_git_operations;
pub mod application_foundation;
pub mod basic_git_operations;
pub mod repository_viewer;
pub mod worktree_management;
