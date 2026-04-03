/** 1つのコミットのグラフノード情報 */
export interface GraphNode {
  hash: string
  parents: string[]
  lane: number
  parentLanes: number[]
}

/** グラフ全体のレイアウト計算結果 */
export interface GraphLayout {
  nodes: GraphNode[]
  maxLane: number
  hashToIndex: Map<string, number>
}
