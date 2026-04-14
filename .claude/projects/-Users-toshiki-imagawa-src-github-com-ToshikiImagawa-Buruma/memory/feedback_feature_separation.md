---
name: feature 分離の判断基準
description: 新規 feature を作る前に既存 feature の拡張かどうかを確認するルール
type: feedback
---

新規 feature を作る前に以下を必ず確認すること:

1. **既存 PRD の FR に同じ責務の要求がないか** — 既に FR_203_05（ハンク折りたたみ）があったのに multi-file-diff-view を別 feature にしてしまった
2. **実装するコンポーネントの配置先が既存 feature 内になるか** — repository-viewer の RepositoryDetailPanel から import する構造なら、repository-viewer の一部
3. **既存 feature のコンポーネントから新 feature を import する構造にならないか** — 依存方向の逆転は feature 分離の誤りを示す

**Why:** multi-file-diff-view を独立 feature にした結果、repository-viewer → multi-file-diff-view の逆方向依存が発生し、ID 体系が 200 番台と 700 番台に分裂した。リファクタリングで統合する手間が発生。
**How to apply:** `/generate-prd` 実行前に、既存 PRD の要求一覧を確認し、新規 feature ではなく既存 PRD の更新で対応できないかを検討する。
