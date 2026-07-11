import fs from "fs"
import path from "path"
import sharp from "sharp"

const cemDir = "../"
const folders = ["."]
for (const entry of fs.readdirSync(cemDir, { withFileTypes: true })) {
  if (entry.isDirectory() && !entry.name.startsWith(".")) {
    folders.push(entry.name)
  }
}

const PALETTE = {
  top: [[180, 212, 225], [236, 248, 253]],
  bottom: [[83, 97, 116], [110, 120, 140]],
  east: [[67, 232, 141], [123, 255, 163]],
  front: [[91, 188, 244], [123, 212, 255]],
  west: [[244, 134, 134], [255, 167, 164]],
  back: [[248, 221, 114], [255, 248, 153]]
}

function paintRect(img, W, x, y, w, h, face) {
  const [border, fill] = PALETTE[face]
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
    const edge = xx === x || xx === x + w - 1 || yy === y || yy === y + h - 1
    const c = edge ? border : fill
    const o = (yy * W + xx) * 4
    img[o] = c[0]; img[o + 1] = c[1]; img[o + 2] = c[2]; img[o + 3] = 255
  }
}

function paintBox(img, W, u, v, w, h, d) {
  if (d === 0) { paintRect(img, W, u, v, w, h, "front"); return }
  if (h === 0) { paintRect(img, W, u + d, v, w, d, "top"); return }
  if (w === 0) { paintRect(img, W, u, v + d, d, h, "east"); return }
  paintRect(img, W, u + d, v, w, d, "top")
  paintRect(img, W, u + d + w, v, w, d, "bottom")
  paintRect(img, W, u, v + d, d, h, "east")
  paintRect(img, W, u + d, v + d, w, h, "front")
  paintRect(img, W, u + d + w, v + d, d, h, "west")
  paintRect(img, W, u + d + w + d, v + d, w, h, "back")
}

function expectedTemplate(data) {
  if (!data.textureSize || !data.models) return null
  const [W, H] = data.textureSize
  const img = Buffer.alloc(W * H * 4)
  const boxes = []
  const collect = ms => {
    for (const m of ms || []) {
      for (const b of m.boxes || []) boxes.push(b)
      collect(m.submodels)
    }
  }
  collect(data.models)
  for (const b of boxes) {
    if (!b.textureOffset || !b.coordinates) return null
    const [u, v] = b.textureOffset
    const dims = b.coordinates.slice(3, 6)
    if (![u, v, ...dims].every(Number.isInteger)) return null
    if (u < 0 || v < 0) return null
    paintBox(img, W, u, v, dims[0], dims[1], dims[2])
  }
  return img
}


async function matchesTemplate(pngBuffer, data) {
  const expected = expectedTemplate(data)
  if (!expected) return false
  let png
  try {
    png = await sharp(pngBuffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  } catch {
    return false
  }
  const [W, H] = data.textureSize
  if (png.info.width !== W || png.info.height !== H) return false
  const px = png.data
  for (let i = 0; i < W * H; i++) {
    const o = i * 4
    const aT = px[o + 3] === 0, bT = expected[o + 3] === 0
    if (aT && bT) continue
    if (aT !== bT) return false
    if (px[o] !== expected[o] || px[o + 1] !== expected[o + 1] || px[o + 2] !== expected[o + 2] || px[o + 3] !== expected[o + 3]) return false
  }
  return true
}


const categories = {}
const models = {}
let embedded = 0
let omitted = 0

for (const folder of folders) {
  const categoryName = folder === "." ? "Supported" : folder[0].toUpperCase() + folder.slice(1)
  const dir = path.join(cemDir, folder === "." ? "" : folder)
  if (!fs.existsSync(dir)) continue
  const entities = []
  for (const file of fs.readdirSync(dir).sort()) {
    if (!file.endsWith(".jem")) continue
    const entityName = file.slice(0, -4)
    const filepath = path.join(dir, file)
    const data = JSON.parse(fs.readFileSync(filepath, "utf8"))
    delete data.texture
    delete data.credit
    for (const key of Object.keys(data)) {
      if (!["textureSize", "shadowSize", "models", "model"].includes(key)) {
        delete data[key]
      }
    }
    const pngPath = filepath.replace(/\.jem$/, ".png")
    const pngBuffer = fs.readFileSync(pngPath)
    const isTemplate = await matchesTemplate(pngBuffer, data)
    if (data.models) {
      for (const part of data.models) {
        if (!part.boxes && !part.submodels && !part.model) {
          for (const key of Object.keys(part)) {
            if (key !== "part") delete part[key]
          }
        }
      }
    }
    models[entityName] = isTemplate
      ? { model: JSON.stringify(data) }
      : { texture_data: pngBuffer.toString("base64"), model: JSON.stringify(data) }
    if (isTemplate) omitted++
    else embedded++
    entities.push({ id: entityName })
  }
  if (entities.length) {
    categories[categoryName] = entities
  }
}

const output = {
  categories: Object.entries(categories).map(([name, entities]) => ({ name, entities })),
  models
}

fs.writeFileSync("models.json", JSON.stringify(output, null, 2))
console.log(`Generated models.json with ${Object.keys(models).length} models across ${Object.keys(categories).length} categories`)
