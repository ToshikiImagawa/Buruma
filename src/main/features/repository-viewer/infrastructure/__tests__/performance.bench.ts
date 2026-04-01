import { bench, describe } from 'vitest'
import { GitReadDefaultRepository } from '../repositories/git-read-default-repository'

// 当プロジェクト自体をターゲットリポジトリとして使用
const REPO_PATH = process.cwd()
const repository = new GitReadDefaultRepository()

describe('NFR パフォーマンスベンチマーク', () => {
  bench(
    'NFR_201: git status（目標: 2秒以内）',
    async () => {
      await repository.getStatus(REPO_PATH)
    },
    { time: 5000, iterations: 5 },
  )

  bench(
    'NFR_202: git log 最新50件（目標: 1秒以内）',
    async () => {
      await repository.getLog({
        worktreePath: REPO_PATH,
        offset: 0,
        limit: 50,
      })
    },
    { time: 5000, iterations: 5 },
  )

  bench(
    'NFR_203: git diff（目標: 1秒以内）',
    async () => {
      await repository.getDiff({
        worktreePath: REPO_PATH,
      })
    },
    { time: 5000, iterations: 5 },
  )

  bench(
    'git branches',
    async () => {
      await repository.getBranches(REPO_PATH)
    },
    { time: 5000, iterations: 5 },
  )

  bench(
    'git file-tree',
    async () => {
      await repository.getFileTree(REPO_PATH)
    },
    { time: 5000, iterations: 5 },
  )
})
