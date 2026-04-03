import fs from "fs"
import path from "path"

const cemDir = "../"
const folders = ["."]
for (const entry of fs.readdirSync(cemDir, { withFileTypes: true })) {
  if (entry.isDirectory() && !entry.name.startsWith(".")) {
    folders.push(entry.name)
  }
}

const categories = {}
const models = {}

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
    if (data.models) {
      for (const part of data.models) {
        if (!part.boxes && !part.submodels && !part.model) {
          for (const key of Object.keys(part)) {
            if (key !== "part") delete part[key]
          }
        }
      }
    }
    const pngPath = filepath.replace(/\.jem$/, ".png")
    const textureData = fs.readFileSync(pngPath).toString("base64")
    models[entityName] = {
      texture_data: textureData,
      model: JSON.stringify(data)
    }
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
