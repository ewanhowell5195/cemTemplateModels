import fs from "fs"

const old = JSON.parse(fs.readFileSync("E:/Programming/GitHub/wynem/src/assets/json/cem_template_models.json"))

const templates = {
  version: old.version,
  categories: [],
  models: old.models
}

function titleFromId(id) {
  return String(id)
    .split("_")
    .filter(Boolean)
    .map(part => part ? part[0].toUpperCase() + part.slice(1) : part)
    .join(" ")
}

const popups = new Set

function normaliseEntityLike(node) {
  const nodeId = node.name ?? node
  const file = node.file_name
  const master = file ?? nodeId

  let texture = node.texture_name
  let vanillaTextures = node.vanilla_textures

  if (Array.isArray(texture)) {
    if (JSON.stringify(vanillaTextures) === JSON.stringify(texture)) {
      vanillaTextures = undefined
    }
    if (texture.length === 1) {
      texture = texture[0]
    }
  }

  const outFile = file === nodeId ? undefined : file

  if (texture === master) {
    texture = undefined
  }

  const displayName = node.display_name
  let outName = displayName
  if (displayName === titleFromId(master)) {
    outName = undefined
  }

  const out = {
    id: nodeId,
    name: outName,
    description: node.description,
    file: outFile,
    model: node.model,
    texture,
    vanilla_textures: vanillaTextures,
    textureless: node.textureless,
    popup: node.popup
  }

  if (out.popup) {
    popups.add(out.popup)
  }

  return out
}

for (const oldCategory of old.categories) {
  const category = {
    name: oldCategory.name,
    description: oldCategory.description,
    icon: oldCategory.icon,
    entities: []
  }

  for (let oldEntity of oldCategory.entities) {
    if (oldEntity.type) {
      category.entities.push(oldEntity)
      continue
    }

    const entity = typeof oldEntity === "string"
      ? { id: oldEntity }
      : normaliseEntityLike(oldEntity)

    if (typeof oldEntity === "object" && oldEntity && Array.isArray(oldEntity.variants)) {
      entity.variants = oldEntity.variants.map(variant => {
        if (typeof variant === "string") return { id: variant }
        return normaliseEntityLike(variant)
      })
    }

    category.entities.push(entity)
  }

  templates.categories.push(category)
}

fs.writeFileSync("cem_template_models_new.json", JSON.stringify(templates, null, 2))

for (const popup of popups) {
  console.log(popup)
}