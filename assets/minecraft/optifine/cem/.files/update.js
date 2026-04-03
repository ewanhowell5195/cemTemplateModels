import fs from "fs"

const generated = JSON.parse(fs.readFileSync("models.json", "utf8"))
const data = JSON.parse(fs.readFileSync("cem_template_models.json", "utf8"))

let updated = 0
let missing = 0

for (const entity of Object.keys(data.models)) {
  if (generated.models[entity]) {
    if (!Array.isArray(data.models[entity].texture_data)) {
      data.models[entity].texture_data = generated.models[entity].texture_data
    }
    data.models[entity].model = generated.models[entity].model
    updated++
  } else {
    console.log(`Missing from generated: ${entity}`)
    missing++
  }
}

fs.writeFileSync("cem_template_models.json", JSON.stringify(data, null, 2))
console.log(`Updated ${updated} models${missing ? `, ${missing} missing` : ""}`)
