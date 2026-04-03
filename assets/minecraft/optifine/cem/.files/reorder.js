import fs from "fs"

const filePath = "E:/Programming/GitHub/wynem/src/assets/json/cem_template_models.json"
const data = JSON.parse(fs.readFileSync(filePath, "utf8"))

function orderEntity(entity) {
  if (entity.type) return entity

  const out = {}
  if (entity.id !== undefined) out.id = entity.id
  if (entity.name !== undefined) out.name = entity.name
  if (entity.description !== undefined) out.description = entity.description
  if (entity.file !== undefined) out.file = entity.file
  if (entity.texture !== undefined) out.texture = entity.texture
  if (entity.vanilla_textures !== undefined) out.vanilla_textures = entity.vanilla_textures
  if (entity.textureless !== undefined) out.textureless = entity.textureless
  if (entity.model !== undefined) out.model = entity.model
  if (entity.popup !== undefined) out.popup = entity.popup
  if (Array.isArray(entity.variants)) out.variants = entity.variants.map(orderEntity)

  return out
}

function orderCategory(category) {
  if (category.type) return category
  const out = { name: category.name }
  if (category.description !== undefined) out.description = category.description
  if (category.icon !== undefined) out.icon = category.icon
  out.entities = category.entities.map(orderEntity)
  return out
}

const out = {
  version: data.version,
  categories: data.categories.map(orderCategory),
  models: data.models,
  popups: data.popups
}

fs.writeFileSync(filePath, JSON.stringify(out, null, 2))
