-- Attendance + request contract closure.
-- Adds an optional file relation for attendance check-in photos.

ALTER TABLE "attendance_records" ADD COLUMN "photoFileId" UUID;

CREATE INDEX "attendance_records_photoFileId_idx" ON "attendance_records"("photoFileId");

ALTER TABLE "attendance_records"
  ADD CONSTRAINT "attendance_records_photoFileId_fkey"
  FOREIGN KEY ("photoFileId") REFERENCES "uploaded_files"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
