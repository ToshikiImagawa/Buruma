import { describe, it, expect } from 'vitest'
import { parsePorcelainOutput } from '../worktree-git-service'

describe('parsePorcelainOutput', () => {
  it('通常のワークツリーエントリをパースする', () => {
    const raw = [
      'worktree /home/user/myrepo',
      'HEAD abc1234567890abcdef1234567890abcdef123456',
      'branch refs/heads/main',
      '',
    ].join('\n')

    const result = parsePorcelainOutput(raw)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      worktree: '/home/user/myrepo',
      HEAD: 'abc1234567890abcdef1234567890abcdef123456',
      branch: 'main',
    })
  })

  it('複数エントリをパースする', () => {
    const raw = [
      'worktree /home/user/myrepo',
      'HEAD aaa1111111111111111111111111111111111111',
      'branch refs/heads/main',
      '',
      'worktree /home/user/myrepo+feature-foo',
      'HEAD bbb2222222222222222222222222222222222222',
      'branch refs/heads/feature/foo',
      '',
    ].join('\n')

    const result = parsePorcelainOutput(raw)

    expect(result).toHaveLength(2)
    expect(result[0].worktree).toBe('/home/user/myrepo')
    expect(result[0].branch).toBe('main')
    expect(result[1].worktree).toBe('/home/user/myrepo+feature-foo')
    expect(result[1].branch).toBe('feature/foo')
  })

  it('detached HEAD をパースする', () => {
    const raw = [
      'worktree /home/user/myrepo+detached',
      'HEAD ccc3333333333333333333333333333333333333',
      'detached',
      '',
    ].join('\n')

    const result = parsePorcelainOutput(raw)

    expect(result).toHaveLength(1)
    expect(result[0].branch).toBeNull()
    expect(result[0].detached).toBe(true)
  })

  it('bare リポジトリエントリをパースする', () => {
    const raw = [
      'worktree /home/user/bare.git',
      'HEAD ddd4444444444444444444444444444444444444',
      'bare',
      '',
    ].join('\n')

    const result = parsePorcelainOutput(raw)

    expect(result).toHaveLength(1)
    expect(result[0].bare).toBe(true)
  })

  it('空文字列を処理する', () => {
    const result = parsePorcelainOutput('')
    expect(result).toHaveLength(0)
  })

  it('末尾に空行がない場合も処理する', () => {
    const raw = [
      'worktree /home/user/myrepo',
      'HEAD aaa1111111111111111111111111111111111111',
      'branch refs/heads/main',
    ].join('\n')

    const result = parsePorcelainOutput(raw)

    expect(result).toHaveLength(1)
    expect(result[0].worktree).toBe('/home/user/myrepo')
  })
})
