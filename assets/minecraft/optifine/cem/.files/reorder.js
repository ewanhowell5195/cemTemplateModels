import fs from "fs"

const inputPath = "E:/Programming/GitHub/wynem/src/assets/json/cem_template_models.json"
const outputPath = "E:/Programming/GitHub/wynem/src/assets/json/cem_template_models.json"

const data = JSON.parse(fs.readFileSync(inputPath, "utf8"))

function orderEntity(entity) {
  if (typeof entity === "string") return entity
  if (entity.type) return entity

  const out = {}

  if (entity.name !== undefined) out.name = entity.name
  if (entity.display_name !== undefined) out.display_name = entity.display_name
  if (entity.description !== undefined) out.description = entity.description
  if (entity.file_name !== undefined) out.file_name = entity.file_name
  if (entity.texture_name !== undefined) out.texture_name = entity.texture_name
  if (entity.vanilla_textures !== undefined) out.vanilla_textures = entity.vanilla_textures
  if (entity.textureless !== undefined) out.textureless = entity.textureless
  if (entity.model !== undefined) out.model = entity.model
  if (entity.popup !== undefined) out.popup = entity.popup

  if (Array.isArray(entity.variants)) {
    out.variants = entity.variants.map(orderEntity)
  }

  return out
}

const out = {
  version: data.version,
  categories: data.categories.map(category => ({
    name: category.name,
    description: category.description,
    icon: category.icon,
    entities: category.entities.map(orderEntity)
  })),
  models: data.models
}

fs.writeFileSync(outputPath, JSON.stringify(out, null, 2))