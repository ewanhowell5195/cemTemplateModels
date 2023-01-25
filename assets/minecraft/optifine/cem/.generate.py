from os import walk, path, getcwd
from json import load, dumps, loads
from base64 import b64encode

output = {}
output["models"] = {}
output["categories"] = [{
	"name": "Supported",
	"description": "The standard CEM models supported by OptiFine",
	"icon": "icon-format_optifine",
	"entities": []
}]

rootdir =  getcwd()

for subdir, dirs, files in walk(rootdir):
	for file in files:
		if file.endswith(".jem"):
			filepath = path.join(subdir, file)
			entityName = path.basename(filepath)[:-4]
			with open(filepath, "r") as jsonfile:
				data = load(jsonfile)
			data.pop("texture", None)
			for item in list(data):
				if item not in ["texture", "textureSize", "shadowSize", "models", "model"]:
					data.pop(item)
				elif item == "models":
					x = 0
					for dictionary in data[item]:
						if "boxes" in list(dictionary) or "submodels" in list(dictionary) or "model" in list(dictionary):
							pass
						else:
							for item2 in list(dictionary):
								if not item2 == "part":
									data[item][x].pop(item2, None)
						x += 1
			with open(f"{filepath[:-4]}.png", "rb") as textureFile:
				encodedImage = b64encode(textureFile.read())
			output["models"][entityName] = {
				"texture_data": encodedImage.decode(),
				"model": dumps(data, separators = (',', ':'))
			}
			output["categories"][0]["entities"].append({
					"name": entityName,
					"file_name": entityName,
					"display_name": entityName.replace("_", " ").title(),
					"texture_name": entityName
				})

with open(".models.json", "w") as outFile:
	outFile.write(dumps(output, indent = "\t"))