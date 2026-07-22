
const fs = require("fs");
const file = "f:/CODE/Movie Legend/movielegend-hrm/movielegend-hrm-backend/prisma/schema.prisma";
let content = fs.readFileSync(file, "utf8");

// Remove models
content = content.replace(/model AssetIncidentReport \{[\s\S]*?@@map\("asset_incident_reports"\)\s*\}/, "");
content = content.replace(/model AssetMaintenanceRecord \{[\s\S]*?@@map\("asset_maintenance_records"\)\s*\}/, "");

// Remove relations from Asset
content = content.replace(/\s*incidents\s+AssetIncidentReport\[\]/, "");
content = content.replace(/\s*maintenanceRecords\s+AssetMaintenanceRecord\[\]/, "");

// Remove relations from User
content = content.replace(/\s*assetIncidentReports\s+AssetIncidentReport\[\]\s+@relation\("AssetIncidentReporter"\)/, "");
content = content.replace(/\s*resolvedAssetIncidents\s+AssetIncidentReport\[\]\s+@relation\("AssetIncidentResolver"\)/, "");
content = content.replace(/\s*assetMaintenanceRecords\s+AssetMaintenanceRecord\[\]\s+@relation\("AssetMaintenanceCreator"\)/, "");

fs.writeFileSync(file, content, "utf8");
console.log("Schema updated 2.");

