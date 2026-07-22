
const fs = require("fs");
const file = "f:/CODE/Movie Legend/movielegend-hrm/movielegend-hrm-backend/prisma/schema.prisma";
let content = fs.readFileSync(file, "utf8");

// Update enums
content = content.replace(/enum AssetStatus {[\s\S]*?}/, "enum AssetStatus {\n  IN_STOCK\n  OUT_OF_STOCK\n}");
content = content.replace(/enum AssetConditionStatus {[\s\S]*?}/, "enum AssetConditionStatus {\n  BROKEN\n  PENDING\n  OK\n}");

// Remove Incident and Maintenance enums
content = content.replace(/enum AssetIncidentType {[\s\S]*?}\n\n/, "");
content = content.replace(/enum AssetIncidentStatus {[\s\S]*?}\n\n/, "");
content = content.replace(/enum AssetMaintenanceStatus {[\s\S]*?}\n\n/, "");

// Remove models
content = content.replace(/model AssetIncidentReport {[\s\S]*?@@map\("asset_incident_reports"\)\n}\n\n/, "");
content = content.replace(/model AssetMaintenanceRecord {[\s\S]*?@@map\("asset_maintenance_records"\)\n}\n\n/, "");

// Update Asset default
content = content.replace(/conditionStatus\s+AssetConditionStatus\s+@default\(GOOD\)/, "conditionStatus    AssetConditionStatus     @default(OK)");

// Remove relations in Asset
content = content.replace(/\s*incidents\s+AssetIncidentReport\[\]\n/, "\n");
content = content.replace(/\s*maintenanceRecords\s+AssetMaintenanceRecord\[\]\n/, "\n");

// Remove relations in User
content = content.replace(/\s*assetIncidentReports\s+AssetIncidentReport\[\]\s+@relation\("AssetIncidentReporter"\)\n/, "\n");
content = content.replace(/\s*resolvedAssetIncidents\s+AssetIncidentReport\[\]\s+@relation\("AssetIncidentResolver"\)\n/, "\n");
content = content.replace(/\s*assetMaintenanceRecords\s+AssetMaintenanceRecord\[\]\s+@relation\("AssetMaintenanceCreator"\)\n/, "\n");

fs.writeFileSync(file, content, "utf8");
console.log("Schema updated.");

