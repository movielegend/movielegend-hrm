
const fs = require("fs");
const file = "movielegend-hrm-backend/prisma/schema.prisma";
let content = fs.readFileSync(file, "utf8");

content = content.replace(
  /(model Asset \{[\s\S]*?deletedAt\s+DateTime\?\s*?\n)/,
  "$1    lastIncidentResolvedAt DateTime?\n"
);

fs.writeFileSync(file, content, "utf8");
console.log("Updated Asset model");

