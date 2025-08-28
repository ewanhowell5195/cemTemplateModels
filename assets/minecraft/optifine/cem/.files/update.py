from json import load, dumps

inData = load(open("models.json"))
outData = load(open("E:/Programming/GitHub/wynem/src/assets/json/cem_template_models.json"))

for entity in outData["models"]:
  if inData["models"].get(entity):
    if outData["models"][entity].get("texture_data"):
      if not isinstance(outData["models"][entity]["texture_data"], list):
        outData["models"][entity]["texture_data"] = inData["models"][entity]["texture_data"]
      else:
        print(entity)
    outData["models"][entity]["model"] = inData["models"][entity]["model"]
  else:
    print(entity)

with open("E:/Programming/GitHub/wynem/src/assets/json/cem_template_models.json", "w", newline="\n") as outFile:
  outFile.write(dumps(outData, indent = 2))