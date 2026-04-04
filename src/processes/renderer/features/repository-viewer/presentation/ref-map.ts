import type { BranchList, TagInfo } from '@domain'

export interface RefInfo {
  localBranches: string[]
  remoteBranches: string[]
  tags: string[]
  isHead: boolean
}

export type RefMap = Map<string, RefInfo>

function getOrCreate(map: RefMap, hash: string): RefInfo {
  let info = map.get(hash)
  if (!info) {
    info = { localBranches: [], remoteBranches: [], tags: [], isHead: false }
    map.set(hash, info)
  }
  return info
}

export function buildRefMap(branches: BranchList | null, tags: TagInfo[]): RefMap {
  const map: RefMap = new Map()

  if (branches) {
    for (const branch of branches.local) {
      const info = getOrCreate(map, branch.hash)
      info.localBranches.push(branch.name)
      if (branch.isHead) {
        info.isHead = true
      }
    }
    for (const branch of branches.remote) {
      const info = getOrCreate(map, branch.hash)
      info.remoteBranches.push(branch.name)
    }
  }

  for (const tag of tags) {
    const info = getOrCreate(map, tag.hash)
    info.tags.push(tag.name)
  }

  return map
}
