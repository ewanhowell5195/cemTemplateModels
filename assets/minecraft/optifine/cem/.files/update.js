import fs from "fs"

const generated = JSON.parse(fs.readFileSync("models.json", "utf8"))
const masterPath = "E:/Programming/GitHub/wynem/src/assets/json/cem_template_models.json"
const data = JSON.parse(fs.readFileSync(masterPath, "utf8"))

let updated = 0
let missing = 0

for (const entity of Object.keys(data.models)) {
  const gen = generated.models[entity]
  if (gen) {
    delete data.models[entity].texture_data
    data.models[entity].model = gen.model
    updated++
  } else {
    console.log(`Missing from generated: ${entity}`)
    missing++
  }
}

fs.writeFileSync(masterPath, JSON.stringify(data, null, 2))
console.log(`Updated ${updated} models${missing ? `, ${missing} missing` : ""}`)
