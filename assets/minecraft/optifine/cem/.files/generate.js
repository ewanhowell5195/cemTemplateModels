import fs from "fs"

const inputPath = "cem_template_models.json"
const outputPath = "E:/Programming/GitHub/wynem/src/assets/json/cem_template_models.json"

const templates = JSON.parse(fs.readFileSync(inputPath, "utf8"))

function titleFromId(id) {
  return String(id)
    .split("_")
    .filter(Boolean)
    .map(part => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ")
}

function formatPopup(template, replacements) {
  return template.replace(/\{(\d+)\}/g, (_, n) => replacements[Number(n)] ?? `{${n}}`)
}

function resolvePopup(node, master) {
  const popup = node.popup
  if (!popup) return undefined

  // popup: ["popupid", "arg1", "arg2", ...]
  if (Array.isArray(popup)) {
    const [popupId, ...extra] = popup
    const template = templates.popups[popupId]
    if (!template) return popupId

    const display = node.name ?? titleFromId(master)
    return formatPopup(template, [display, ...extra])
  }

  // unique objects stay inline
  if (typeof popup === "object") {
    return popup
  }

  // popup: "popupid" (reference) OR literal string
  if (typeof popup === "string") {
    const template = templates.popups[popup]
    if (template) {
      const display = node.name ?? titleFromId(master)
      return formatPopup(template, [display])
    }
    return popup
  }

  return undefined
}

function toOldEntity(node) {
  if (typeof node === "string") return node
  if (node.type) return node

  const name = node.id
  const fileName = node.file
  const master = fileName ?? name

  const needsMasterExplicit = Boolean(fileName && fileName !== name)

  const old = { name }

  // Only auto-generate display_name when file differs from name
  if (node.name) {
    old.display_name = node.name
  } else if (needsMasterExplicit) {
    old.display_name = titleFromId(master)
  }

  if (node.description) old.description = node.description
  if (node.file) old.file_name = fileName
  if (node.textureless !== undefined) old.textureless = node.textureless

  const hasVanilla = node.vanilla_textures !== undefined

  // Only auto-generate texture_name when file differs from name, or when vanilla_textures exists
  if (node.texture !== undefined || needsMasterExplicit || hasVanilla) {
    let textureName = node.texture ?? master

    // legacy rule: if vanilla_textures exists, texture_name must be an array
    if (hasVanilla && !Array.isArray(textureName)) {
      textureName = [textureName]
    }

    old.texture_name = textureName

    if (node.vanilla_textures !== undefined) {
      old.vanilla_textures = node.vanilla_textures
    } else if (Array.isArray(old.texture_name)) {
      // legacy redundancy seen in the old file
      old.vanilla_textures = old.texture_name
    }
  }

  if (node.model) old.model = node.model

  const resolvedPopup = resolvePopup(node, master, name)
  if (resolvedPopup) old.popup = resolvedPopup

  if (Array.isArray(node.variants)) {
    old.variants = node.variants.map(toOldEntity)
  }

  if (Object.keys(old).length === 1) {
    return old.name
  }

  return old
}

const oldOut = {
  version: templates.version,
  categories: (templates.categories ?? []).map(category => ({
    name: category.name,
    description: category.description,
    icon: category.icon,
    entities: (category.entities ?? []).map(toOldEntity)
  })),
  models: templates.models
}

fs.writeFileSync(outputPath, JSON.stringify(oldOut, null, 2))
