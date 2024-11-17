import fs from "fs"
import path from "path"

// Read and parse files
const modelsData = JSON.parse(fs.readFileSync("./models.json", "utf8"))
const templateData = JSON.parse(fs.readFileSync("E:/Programming/GitHub/wynem/src/assets/json/cem_template_models.json", "utf8"))

// Get render files
const renderFiles = fs.readdirSync("./renders")
  .filter(file => file.endsWith(".png"))
  .map(file => path.basename(file, ".png"))

// Get texture files
const textureFiles = fs.readdirSync("E:/Programming/GitHub/wynem/src/assets/images/minecraft/entities")
  .filter(file => file.endsWith(".png"))
  .map(file => path.basename(file, ".png"))

// Get all entity/variant names and used model IDs from template
const templateEntityNames = new Set()
const usedModelIds = new Set()

// Helper function to get model ID for an item
function getModelId(item, parentModelId = null) {
  if (typeof item === "string") {
    return parentModelId || item
  } else if (!item.type) {
    return item.model || parentModelId || item.name
  }
  return null
}

// Collect all entity names, model IDs used, and textures required
const invalidUneditedModels = []
const texturesToCheck = []
const texturelessEntities = new Set()

templateData.categories.forEach(category => {
  const isUneditedCategory = category.name === "Unedited"
  
  category.entities.forEach(entity => {
    if (entity.type) {
      return // Skip if 'type' is set
    }

    const entityName = typeof entity === "string" ? entity : entity.name
    templateEntityNames.add(entityName)

    // Skip texture processing if the entity is marked as textureless
    if (entity.textureless) {
      texturelessEntities.add(entityName)
    } else {
      // Add the base entity texture
      texturesToCheck.push(entityName)

      // Handle vanilla textures for entities
      if (entity.vanilla_textures) {
        for (let i = 0; i < entity.vanilla_textures.length; i++) {
          texturesToCheck.push(i === 0 ? entityName : `${entityName}${i}`)
        }
      }
    }

    if (typeof entity === "object" && entity.variants) {
      entity.variants.forEach(variant => {
        if (variant.type) {
          return // Skip if 'type' is set
        }

        const variantName = typeof variant === "string" ? variant : variant.name
        templateEntityNames.add(variantName)

        // Skip texture processing if the variant is marked as textureless
        if (variant.textureless) {
          texturelessEntities.add(variantName)
        } else {
          // Add the base variant texture
          texturesToCheck.push(variantName)

          // Handle vanilla textures for variants
          if (variant.vanilla_textures) {
            for (let i = 0; i < variant.vanilla_textures.length; i++) {
              texturesToCheck.push(i === 0 ? variantName : `${variantName}${i}`)
            }
          }
        }
      })
    }

    // Add model used by entity
    const entityModelId = getModelId(entity)
    if (entityModelId) {
      usedModelIds.add(entityModelId)
      
      // Check if model follows unedited naming convention
      if (isUneditedCategory) {
        if (!entityModelId.endsWith("_unedited")) {
          invalidUneditedModels.push(`Entity "${entityName}" uses model "${entityModelId}"`)
        }
      }
    }
    
    // Process variants for model IDs
    if (typeof entity === "object" && entity.variants) {
      const parentModel = entity.model || entity.name
      entity.variants.forEach(variant => {
        if (variant.type) {
          return // Skip if 'type' is set
        }

        // Add model used by variant
        const variantModelId = getModelId(variant, parentModel)
        if (variantModelId) {
          usedModelIds.add(variantModelId)
          
          // Check if model follows unedited naming convention
          if (isUneditedCategory) {
            if (!variantModelId.endsWith("_unedited")) {
              invalidUneditedModels.push(`Variant "${typeof variant === "string" ? variant : variant.name}" uses model "${variantModelId}"`)
            }
          }
        }
      })
    }
  })
})

// Check for invalid unedited models
if (invalidUneditedModels.length > 0) {
  console.log("Models in \"Unedited\" category that don't end with _unedited:")
  invalidUneditedModels.forEach(msg => console.log(`- ${msg}`))
  console.log("\n")
}

// Check for models referenced but not defined in template
const missingModels = Array.from(usedModelIds).filter(id => !templateData.models[id])
if (missingModels.length > 0) {
  console.log("Models referenced in template but not defined in models:")
  missingModels.forEach(id => console.log(`- ${id}`))
  console.log("\n")
}

// Check for unused model definitions
const unusedModels = Object.keys(templateData.models).filter(id => !usedModelIds.has(id))
if (unusedModels.length > 0) {
  console.log("Models defined but not used by any entity:")
  unusedModels.forEach(id => console.log(`- ${id}`))
  console.log("\n")
}

// Original file checks - compare against template entity names
const missingFromOriginal = Array.from(templateEntityNames).filter(id => !modelsData.models.hasOwnProperty(id))
if (missingFromOriginal.length > 0) {
  console.log("Entity/variant names in template that don't exist as models in original file:")
  missingFromOriginal.forEach(id => console.log(`- ${id}`))
  console.log("\n")
}

const missingInTemplate = Object.keys(modelsData.models).filter(id => !templateEntityNames.has(id))
if (missingInTemplate.length > 0) {
  console.log("Models from original file missing in template:")
  missingInTemplate.forEach(id => console.log(`- ${id}`))
  console.log("\n")
}

// Check for missing renders
const missingRenders = Object.keys(modelsData.models).filter(id => !renderFiles.includes(id))
if (missingRenders.length > 0) {
  console.log("Missing renders for:")
  for (const id of missingRenders) {
    console.log(`- ${id}`)
  }
  console.log("\n")
}

// Check for extra renders
const extraRenders = renderFiles.filter(render => !modelsData.models.hasOwnProperty(render))
if (extraRenders.length > 0) {
  console.log("Extra renders:")
  for (const render of extraRenders) {
    console.log(`- ${render}`)
  }
}

// Check for missing textures
const missingTextures = texturesToCheck.filter(texture => !textureFiles.includes(texture))
if (missingTextures.length > 0) {
  console.log("Missing textures for:")
  for (const texture of missingTextures) {
    console.log(`- ${texture}`)
  }
  console.log("\n")
}

// Check for extra textures
const extraTextures = textureFiles.filter(texture => !texturesToCheck.includes(texture) && !texturelessEntities.has(texture))
if (extraTextures.length > 0) {
  console.log("Extra textures:")
  for (const texture of extraTextures) {
    console.log(`- ${texture}`)
  }
}
