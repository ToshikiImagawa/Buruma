import { useEffect, useRef } from 'react'
import type { GraphLayout } from '@lib/graph'
import type { RefMap } from '../ref-map'

const LANE_WIDTH = 16
const NODE_RADIUS = 4
const HEAD_OUTER_RADIUS = NODE_RADIUS + 2.5
const HEAD_RING_WIDTH = 1.5
const LANE_COLORS = ['#4ec9b0', '#569cd6', '#ce9178', '#dcdcaa', '#c586c0', '#9cdcfe', '#d7ba7d', '#608b4e']

function laneColor(lane: number): string {
  return LANE_COLORS[lane % LANE_COLORS.length]
}

function laneX(lane: number): number {
  return lane * LANE_WIDTH + LANE_WIDTH / 2
}

interface BranchGraphCanvasProps {
  layout: GraphLayout
  rowHeight: number
  scrollTop: number
  containerHeight: number
  refMap: RefMap
}

export function BranchGraphCanvas({ layout, rowHeight, scrollTop, containerHeight, refMap }: BranchGraphCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const canvasWidth = (layout.maxLane + 1) * LANE_WIDTH + LANE_WIDTH

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || layout.nodes.length === 0) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = canvasWidth * dpr
    canvas.height = containerHeight * dpr
    canvas.style.width = `${canvasWidth}px`
    canvas.style.height = `${containerHeight}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, canvasWidth, containerHeight)
    ctx.lineWidth = 1.5
    ctx.lineCap = 'round'

    const { nodes } = layout

    // 可視範囲に関係するノードのみ描画（マージン付き）
    const margin = 5
    const visibleStart = Math.max(0, Math.floor(scrollTop / rowHeight) - margin)
    const visibleEnd = Math.min(nodes.length - 1, Math.ceil((scrollTop + containerHeight) / rowHeight) + margin)

    // 可視範囲のノードと、可視範囲を通過する線を持つノードを収集
    const drawSet = new Set<number>()
    for (let i = visibleStart; i <= visibleEnd; i++) {
      drawSet.add(i)
    }
    // 可視範囲外のノードでも、親が可視範囲内にある場合は描画対象
    for (let i = 0; i < visibleStart; i++) {
      const node = nodes[i]
      for (const parentHash of node.parents) {
        const parentIdx = layout.hashToIndex.get(parentHash)
        const parentRow = parentIdx !== undefined ? parentIdx : nodes.length
        if (parentRow >= visibleStart) {
          drawSet.add(i)
          break
        }
      }
    }

    // 線の描画
    for (const i of drawSet) {
      const node = nodes[i]
      const nodeY = i * rowHeight + rowHeight / 2 - scrollTop

      for (let p = 0; p < node.parents.length; p++) {
        const parentHash = node.parents[p]
        const parentIdx = layout.hashToIndex.get(parentHash)

        // 親の実際のレーンを参照
        const actualParentLane = parentIdx !== undefined ? nodes[parentIdx].lane : node.lane
        // 親が未読み込み（ページネーション外）の場合、リスト最下部まで延長
        const parentRow = parentIdx !== undefined ? parentIdx : nodes.length
        const parentY = parentRow * rowHeight + rowHeight / 2 - scrollTop

        // 可視範囲外の線は完全にスキップ
        const lineTop = Math.min(nodeY, parentY)
        const lineBottom = Math.max(nodeY, parentY)
        if (lineBottom < -rowHeight * 2 || lineTop > containerHeight + rowHeight * 2) continue

        ctx.strokeStyle = laneColor(actualParentLane)
        ctx.beginPath()

        const fromX = laneX(node.lane)
        const toX = laneX(actualParentLane)

        if (fromX === toX) {
          ctx.moveTo(fromX, nodeY)
          ctx.lineTo(toX, parentY)
        } else {
          const joinY = Math.max(parentY - rowHeight, nodeY)
          ctx.moveTo(fromX, nodeY)
          if (joinY > nodeY) {
            ctx.lineTo(fromX, joinY)
          }
          ctx.lineTo(toX, parentY)
        }
        ctx.stroke()
      }
    }

    // コミットノード描画（線の上に重ねる）
    const startIdx = Math.max(0, Math.floor(scrollTop / rowHeight) - 2)
    const endIdx = Math.min(nodes.length - 1, Math.ceil((scrollTop + containerHeight) / rowHeight) + 2)

    for (let i = startIdx; i <= endIdx; i++) {
      const node = nodes[i]
      const x = laneX(node.lane)
      const y = i * rowHeight + rowHeight / 2 - scrollTop
      const color = laneColor(node.lane)
      const ref = refMap.get(node.hash)

      if (ref?.isHead) {
        // HEAD: 二重丸（外側リング + 内側塗りつぶし）
        ctx.fillStyle = '#1e1e1e'
        ctx.beginPath()
        ctx.arc(x, y, HEAD_OUTER_RADIUS + 1, 0, Math.PI * 2)
        ctx.fill()

        ctx.strokeStyle = color
        ctx.lineWidth = HEAD_RING_WIDTH
        ctx.beginPath()
        ctx.arc(x, y, HEAD_OUTER_RADIUS, 0, Math.PI * 2)
        ctx.stroke()
        ctx.lineWidth = 1.5

        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(x, y, NODE_RADIUS - 0.5, 0, Math.PI * 2)
        ctx.fill()
      } else if (ref && ref.localBranches.length > 0) {
        // ローカルブランチ: 大きめの塗りつぶし円
        ctx.fillStyle = '#1e1e1e'
        ctx.beginPath()
        ctx.arc(x, y, NODE_RADIUS + 2.5, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(x, y, NODE_RADIUS + 1, 0, Math.PI * 2)
        ctx.fill()
      } else if (ref && ref.tags.length > 0) {
        // タグ: 角丸四角形
        const size = NODE_RADIUS * 1.6
        const r = 1.5
        ctx.fillStyle = '#1e1e1e'
        ctx.beginPath()
        ctx.roundRect(x - size - 1, y - size - 1, (size + 1) * 2, (size + 1) * 2, r)
        ctx.fill()

        ctx.fillStyle = color
        ctx.beginPath()
        ctx.roundRect(x - size, y - size, size * 2, size * 2, r)
        ctx.fill()
      } else if (ref && ref.remoteBranches.length > 0) {
        // リモートブランチのみ: ダイヤモンド形
        const d = NODE_RADIUS + 1.5
        ctx.fillStyle = '#1e1e1e'
        ctx.beginPath()
        ctx.moveTo(x, y - d - 1)
        ctx.lineTo(x + d + 1, y)
        ctx.lineTo(x, y + d + 1)
        ctx.lineTo(x - d - 1, y)
        ctx.closePath()
        ctx.fill()

        ctx.fillStyle = color
        ctx.beginPath()
        ctx.moveTo(x, y - d)
        ctx.lineTo(x + d, y)
        ctx.lineTo(x, y + d)
        ctx.lineTo(x - d, y)
        ctx.closePath()
        ctx.fill()
      } else {
        // 通常コミット: 標準の塗りつぶし円
        ctx.fillStyle = '#1e1e1e'
        ctx.beginPath()
        ctx.arc(x, y, NODE_RADIUS + 1.5, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(x, y, NODE_RADIUS, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }, [layout, rowHeight, scrollTop, containerHeight, canvasWidth, refMap])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'sticky',
        top: 0,
        left: 0,
        width: canvasWidth,
        height: containerHeight,
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  )
}

export { LANE_WIDTH }
