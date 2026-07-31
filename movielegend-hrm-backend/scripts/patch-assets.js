const fs = require('fs');
let code = fs.readFileSync('src/modules/assets/assets.service.ts', 'utf8');

// 1. Add import
if (!code.includes('StorageService')) {
  code = code.replace(
    import { PrismaService } from '../../database/prisma.service';,
    import { PrismaService } from '../../database/prisma.service';\nimport { StorageService } from '../storage/storage.service';
  );
}

// 2. Add to constructor
if (!code.includes('private readonly storage: StorageService')) {
  code = code.replace(
    private readonly realtime: RealtimeEventsService,\n  ) {},
    private readonly realtime: RealtimeEventsService,\n    private readonly storage: StorageService,\n  ) {}
  );
}

// 3. Add helper method at the end
if (!code.includes('deleteIncidentEvidence')) {
  code = code.replace(
      }\n}\n,
      }\n\n  private async deleteIncidentEvidence(tx: Prisma.TransactionClient, evidenceUrl: string | null | undefined) {\n    if (!evidenceUrl) return;\n    const fileRecord = await tx.uploadedFile.findFirst({ where: { fileUrl: evidenceUrl } });\n    if (fileRecord && fileRecord.storageKey) {\n      this.storage.delete(fileRecord.storageKey).catch(e => console.error(e));\n      await tx.uploadedFile.update({ where: { id: fileRecord.id }, data: { status: 'DELETED', deletedAt: new Date() } });\n    }\n  }\n}\n
  );
}

// 4. Update delete asset
const deleteAssetMatch =       // Auto-delete any open incidents since the asset is revoked\n      await tx.assetIncidentReport.deleteMany({\n        where: { assetId: id, status: { in: [AssetIncidentStatus.OPEN, AssetIncidentStatus.INVESTIGATING] } },\n      });;
const deleteAssetRepl =       // Auto-delete any open incidents since the asset is revoked\n      const incidentsToDelete = await tx.assetIncidentReport.findMany({ where: { assetId: id, status: { in: [AssetIncidentStatus.OPEN, AssetIncidentStatus.INVESTIGATING] } } });\n      for (const inc of incidentsToDelete) await this.deleteIncidentEvidence(tx, inc.evidenceUrl);\n      await tx.assetIncidentReport.deleteMany({\n        where: { assetId: id, status: { in: [AssetIncidentStatus.OPEN, AssetIncidentStatus.INVESTIGATING] } },\n      });;
code = code.replace(deleteAssetMatch, deleteAssetRepl);

// 5. Update complete return
const returnMatch =       // Auto-delete any open incidents since the asset is returned\n      await tx.assetIncidentReport.deleteMany({\n        where: { assetId: assignment.assetId, status: { in: [AssetIncidentStatus.OPEN, AssetIncidentStatus.INVESTIGATING] } },\n      });;
const returnRepl =       // Auto-delete any open incidents since the asset is returned\n      const incidentsToDelete2 = await tx.assetIncidentReport.findMany({ where: { assetId: assignment.assetId, status: { in: [AssetIncidentStatus.OPEN, AssetIncidentStatus.INVESTIGATING] } } });\n      for (const inc of incidentsToDelete2) await this.deleteIncidentEvidence(tx, inc.evidenceUrl);\n      await tx.assetIncidentReport.deleteMany({\n        where: { assetId: assignment.assetId, status: { in: [AssetIncidentStatus.OPEN, AssetIncidentStatus.INVESTIGATING] } },\n      });;
code = code.replace(returnMatch, returnRepl);

// 6. Update reject incident
const rejectMatch =       const result = await tx.assetIncidentReport.update({\n        where: { id },\n        data: { status: AssetIncidentStatus.REJECTED, resolvedById: actor.userId, resolvedAt: new Date(), resolutionNote: dto.resolutionNote, evidenceUrl: null },\n      });;
const rejectRepl =       await this.deleteIncidentEvidence(tx, incident.evidenceUrl);\n\n      const result = await tx.assetIncidentReport.update({\n        where: { id },\n        data: { status: AssetIncidentStatus.REJECTED, resolvedById: actor.userId, resolvedAt: new Date(), resolutionNote: dto.resolutionNote, evidenceUrl: null },\n      });;
code = code.replace(rejectMatch, rejectRepl);

fs.writeFileSync('src/modules/assets/assets.service.ts', code);
console.log('Patched assets.service.ts');
