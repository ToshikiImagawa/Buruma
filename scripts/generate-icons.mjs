#!/usr/bin/env node

/**
 * resources/icon.svg から icon.png, icon.icns, icon.ico を生成するスクリプト。
 *
 * 依存: macOS の sips / iconutil（外部パッケージ不要）
 */
import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const RESOURCES = join(ROOT, 'resources')
const SVG = join(RESOURCES, 'icon.svg')
const TMP = join(tmpdir(), 'buruma-icons')

// --- helpers ---

function sips(args) {
  execFileSync('/usr/bin/sips', args, { stdio: 'pipe' })
}

function resizePng(src, dest, size) {
  sips(['-z', String(size), String(size), src, '--out', dest])
}

function buildIco(pngPaths, dest) {
  const images = pngPaths.map((p) => readFileSync(p))
  const numImages = images.length

  // ICO header (6 bytes)
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: ICO
  header.writeUInt16LE(numImages, 4)

  // directory entries (16 bytes each)
  const dirEntries = []
  let dataOffset = 6 + numImages * 16

  for (let i = 0; i < numImages; i++) {
    const size = [16, 32, 48, 64, 128, 256][i]
    const entry = Buffer.alloc(16)
    entry.writeUInt8(size >= 256 ? 0 : size, 0) // width (0 = 256)
    entry.writeUInt8(size >= 256 ? 0 : size, 1) // height
    entry.writeUInt8(0, 2) // color palette
    entry.writeUInt8(0, 3) // reserved
    entry.writeUInt16LE(1, 4) // color planes
    entry.writeUInt16LE(32, 6) // bits per pixel
    entry.writeUInt32LE(images[i].length, 8)
    entry.writeUInt32LE(dataOffset, 12)
    dataOffset += images[i].length
    dirEntries.push(entry)
  }

  writeFileSync(dest, Buffer.concat([header, ...dirEntries, ...images]))
}

// --- main ---

rmSync(TMP, { recursive: true, force: true })
mkdirSync(TMP, { recursive: true })

const png1024 = join(TMP, 'icon_1024.png')

// 1. SVG -> 1024x1024 PNG
console.log('SVG -> PNG (1024x1024)')
sips(['-s', 'format', 'png', '-z', '1024', '1024', SVG, '--out', png1024])

// 2. icon.png (1024x1024)
console.log('-> resources/icon.png')
cpSync(png1024, join(RESOURCES, 'icon.png'))

// 3. icon.icns (macOS)
console.log('-> resources/icon.icns')
const iconset = join(TMP, 'icon.iconset')
mkdirSync(iconset)

const icnsSizes = [16, 32, 64, 128, 256, 512]
for (const s of icnsSizes) {
  resizePng(png1024, join(iconset, `icon_${s}x${s}.png`), s)
}
for (const s of icnsSizes.filter((s) => s <= 512)) {
  const s2 = s * 2
  if (s2 <= 1024) {
    resizePng(png1024, join(iconset, `icon_${s}x${s}@2x.png`), s2)
  }
}
cpSync(png1024, join(iconset, 'icon_512x512@2x.png'))

execFileSync('/usr/bin/iconutil', ['-c', 'icns', iconset, '-o', join(RESOURCES, 'icon.icns')])

// 4. icon.ico (Windows)
console.log('-> resources/icon.ico')
const icoSizes = [16, 32, 48, 64, 128, 256]
const icoPngs = []
for (const s of icoSizes) {
  const p = join(TMP, `ico_${s}.png`)
  resizePng(png1024, p, s)
  icoPngs.push(p)
}
buildIco(icoPngs, join(RESOURCES, 'icon.ico'))

// cleanup
rmSync(TMP, { recursive: true, force: true })

console.log('Done.')
