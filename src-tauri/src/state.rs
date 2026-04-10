//! アプリケーション全体で共有される状態。
//!
//! Phase IA では空。Phase IB 以降で各 feature の UseCase/Repository を
//! `Arc<dyn Trait>` として保持する。

#[derive(Default)]
pub struct AppState {
    // Phase IB 以降で以下を追加予定:
    // pub store_repository: Arc<dyn StoreRepository>,
    // pub git_validation_repository: Arc<dyn GitValidationRepository>,
    // pub dialog_repository: Arc<dyn DialogRepository>,
    // ...
}
