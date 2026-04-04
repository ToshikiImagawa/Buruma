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

/** 背景（線を隠す）の塗りつぶし円を描画 */
function drawBackground(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, bgColor: string) {
  ctx.fillStyle = bgColor
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()
}

/** 塗りつぶし円を描画 */
function drawFilledCircle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()
}

/** CSS 解決済みの背景色を取得（ライト/ダークモード両対応） */
function resolveBackgroundColor(canvas: HTMLCanvasElement): string {
  return getComputedStyle(canvas).backgroundColor || '#1e1e1e'
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

    const bgColor = resolveBackgroundColor(canvas)
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
          // 同じレーン: 直線
          ctx.moveTo(fromX, nodeY)
          ctx.lineTo(toX, parentY)
          ctx.stroke()
        } else {
          // 異なるレーン: 垂直区間と斜め区間で色を分けて描画
          const joinY = Math.max(parentY - rowHeight, nodeY)
          // 第1親 = ブランチの継続（子の色）、第2親以降 = マージ合流（親の色）
          const diagonalColor = p === 0 ? laneColor(node.lane) : laneColor(actualParentLane)
          // 垂直区間: 子のレーン色（レーンの色を保持し上書きを防ぐ）
          if (joinY > nodeY) {
            ctx.strokeStyle = laneColor(node.lane)
            ctx.beginPath()
            ctx.moveTo(fromX, nodeY)
            ctx.lineTo(fromX, joinY)
            ctx.stroke()
          }
          // 斜め区間
          ctx.strokeStyle = diagonalColor
          ctx.beginPath()
          ctx.moveTo(fromX, joinY > nodeY ? joinY : nodeY)
          ctx.lineTo(toX, parentY)
          ctx.stroke()
        }
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
        drawBackground(ctx, x, y, HEAD_OUTER_RADIUS + 1, bgColor)
        ctx.strokeStyle = color
        ctx.lineWidth = HEAD_RING_WIDTH
        ctx.beginPath()
        ctx.arc(x, y, HEAD_OUTER_RADIUS, 0, Math.PI * 2)
        ctx.stroke()
        ctx.lineWidth = 1.5
        drawFilledCircle(ctx, x, y, NODE_RADIUS - 0.5, color)
      } else if (ref && ref.localBranches.length > 0) {
        // ローカルブランチ: 大きめの塗りつぶし円
        drawBackground(ctx, x, y, NODE_RADIUS + 2.5, bgColor)
        drawFilledCircle(ctx, x, y, NODE_RADIUS + 1, color)
      } else if (ref && ref.tags.length > 0) {
        // タグ: 角丸四角形
        const size = NODE_RADIUS * 1.6
        const r = 1.5
        ctx.fillStyle = bgColor
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
        ctx.fillStyle = bgColor
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
        drawBackground(ctx, x, y, NODE_RADIUS + 1.5, bgColor)
        drawFilledCircle(ctx, x, y, NODE_RADIUS, color)
      }
    }
  }, [layout, rowHeight, scrollTop, containerHeight, canvasWidth, refMap])

  return (
    <canvas
      ref={canvasRef}
      className="bg-background"
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
