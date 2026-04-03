import fs from "fs"
import path from "path"

const modelsData = JSON.parse(fs.readFileSync("./models.json", "utf8"))
const templateData = JSON.parse(fs.readFileSync("E:/Programming/GitHub/wynem/src/assets/json/cem_template_models.json", "utf8"))

const renderFiles = fs.readdirSync("./renders")
  .filter(file => file.endsWith(".png"))
  .map(file => path.basename(file, ".png"))

const textureFiles = fs.readdirSync("E:/Programming/GitHub/wynem/src/assets/images/minecraft/entities")
  .filter(file => file.endsWith(".png"))
  .map(file => path.basename(file, ".png"))

const templateEntityIds = new Set()
const usedModelIds = new Set()
const texturesToCheck = []
const texturelessEntities = new Set()

function processEntity(entity, parentModelId) {
  if (entity.type) return

  templateEntityIds.add(entity.id)

  if (entity.textureless) {
    texturelessEntities.add(entity.id)
  } else {
    texturesToCheck.push(entity.id)
    if (entity.vanilla_textures) {
      for (let i = 0; i < entity.vanilla_textures.length; i++) {
        texturesToCheck.push(i === 0 ? entity.id : `${entity.id}${i}`)
      }
    }
  }

  const modelId = entity.model ?? parentModelId ?? entity.id
  usedModelIds.add(modelId)

  if (entity.variants) {
    const parentModel = entity.model ?? entity.id
    for (const variant of entity.variants) {
      processEntity(variant, parentModel)
    }
  }
}

for (const category of templateData.categories) {
  if (category.type) continue
  for (const entity of category.entities) {
    processEntity(entity, null)
  }
}

function report(title, items) {
  if (!items.length) return
  console.log(`${title}:`)
  items.forEach(item => console.log(`  - ${item}`))
  console.log()
}

report("Models referenced but not defined", [...usedModelIds].filter(id => !templateData.models[id]))
report("Models defined but not used", Object.keys(templateData.models).filter(id => !usedModelIds.has(id)))
report("Entities in template missing from generated models.json", [...templateEntityIds].filter(id => !modelsData.models[id]))
report("Models in generated models.json missing from template", Object.keys(modelsData.models).filter(id => !templateEntityIds.has(id)))
report("Missing renders", Object.keys(modelsData.models).filter(id => !renderFiles.includes(id)))
report("Extra renders", renderFiles.filter(id => !modelsData.models[id]))
report("Missing textures", texturesToCheck.filter(id => !textureFiles.includes(id)))
report("Extra textures", textureFiles.filter(id => !texturesToCheck.includes(id) && !texturelessEntities.has(id)))
