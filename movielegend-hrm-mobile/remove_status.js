
const fs = require("fs");
const file = "src/features/assets/asset.logic.ts";
let content = fs.readFileSync(file, "utf8");
content = content.replace(/export function incidentStatusTone[\s\S]*?\}\n/, "");
fs.writeFileSync(file, content, "utf8");

