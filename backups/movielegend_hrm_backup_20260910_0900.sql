--
-- PostgreSQL database dump
--

\restrict OKBOB78cjq7bSaOeZ9h87eII6jkLqGxMgmdRglKhdFKzWGkfshwDvc0VjZAGC1v

-- Dumped from database version 18.4 (Debian 18.4-1.pgdg12+1)
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.wifi_configs DROP CONSTRAINT IF EXISTS "wifi_configs_departmentId_fkey";
ALTER TABLE IF EXISTS ONLY public.warehouses DROP CONSTRAINT IF EXISTS "warehouses_managerUserId_fkey";
ALTER TABLE IF EXISTS ONLY public.warehouses DROP CONSTRAINT IF EXISTS "warehouses_departmentId_fkey";
ALTER TABLE IF EXISTS ONLY public.warehouses DROP CONSTRAINT IF EXISTS "warehouses_companyId_fkey";
ALTER TABLE IF EXISTS ONLY public.warehouses DROP CONSTRAINT IF EXISTS "warehouses_branchId_fkey";
ALTER TABLE IF EXISTS ONLY public.warehouse_stocks DROP CONSTRAINT IF EXISTS "warehouse_stocks_warehouseId_fkey";
ALTER TABLE IF EXISTS ONLY public.warehouse_stocks DROP CONSTRAINT IF EXISTS "warehouse_stocks_materialId_fkey";
ALTER TABLE IF EXISTS ONLY public.violations DROP CONSTRAINT IF EXISTS "violations_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.violations DROP CONSTRAINT IF EXISTS "violations_createdById_fkey";
ALTER TABLE IF EXISTS ONLY public.violations DROP CONSTRAINT IF EXISTS "violations_confirmedById_fkey";
ALTER TABLE IF EXISTS ONLY public.vesting_milestones DROP CONSTRAINT IF EXISTS "vesting_milestones_vaultId_fkey";
ALTER TABLE IF EXISTS ONLY public.vault_transactions DROP CONSTRAINT IF EXISTS "vault_transactions_vaultId_fkey";
ALTER TABLE IF EXISTS ONLY public.vault_transactions DROP CONSTRAINT IF EXISTS "vault_transactions_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.user_roles DROP CONSTRAINT IF EXISTS "user_roles_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.user_roles DROP CONSTRAINT IF EXISTS "user_roles_roleId_fkey";
ALTER TABLE IF EXISTS ONLY public.user_notification_preferences DROP CONSTRAINT IF EXISTS "user_notification_preferences_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.user_approval_requests DROP CONSTRAINT IF EXISTS "user_approval_requests_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.user_approval_requests DROP CONSTRAINT IF EXISTS "user_approval_requests_requestedDepartmentId_fkey";
ALTER TABLE IF EXISTS ONLY public.uploaded_files DROP CONSTRAINT IF EXISTS "uploaded_files_uploadedById_fkey";
ALTER TABLE IF EXISTS ONLY public.tasks DROP CONSTRAINT IF EXISTS "tasks_parentTaskId_fkey";
ALTER TABLE IF EXISTS ONLY public.tasks DROP CONSTRAINT IF EXISTS "tasks_groupLeaderId_fkey";
ALTER TABLE IF EXISTS ONLY public.tasks DROP CONSTRAINT IF EXISTS "tasks_departmentContextId_fkey";
ALTER TABLE IF EXISTS ONLY public.tasks DROP CONSTRAINT IF EXISTS "tasks_createdByUserId_fkey";
ALTER TABLE IF EXISTS ONLY public.task_targets DROP CONSTRAINT IF EXISTS "task_targets_taskId_fkey";
ALTER TABLE IF EXISTS ONLY public.task_status_histories DROP CONSTRAINT IF EXISTS "task_status_histories_taskId_fkey";
ALTER TABLE IF EXISTS ONLY public.task_status_histories DROP CONSTRAINT IF EXISTS "task_status_histories_actorUserId_fkey";
ALTER TABLE IF EXISTS ONLY public.task_groups DROP CONSTRAINT IF EXISTS "task_groups_departmentId_fkey";
ALTER TABLE IF EXISTS ONLY public.task_groups DROP CONSTRAINT IF EXISTS "task_groups_createdByUserId_fkey";
ALTER TABLE IF EXISTS ONLY public.task_group_members DROP CONSTRAINT IF EXISTS "task_group_members_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.task_group_members DROP CONSTRAINT IF EXISTS "task_group_members_groupId_fkey";
ALTER TABLE IF EXISTS ONLY public.task_extension_requests DROP CONSTRAINT IF EXISTS "task_extension_requests_taskId_fkey";
ALTER TABLE IF EXISTS ONLY public.task_extension_requests DROP CONSTRAINT IF EXISTS "task_extension_requests_requestedByUserId_fkey";
ALTER TABLE IF EXISTS ONLY public.task_extension_requests DROP CONSTRAINT IF EXISTS "task_extension_requests_decidedByUserId_fkey";
ALTER TABLE IF EXISTS ONLY public.task_extension_requests DROP CONSTRAINT IF EXISTS "task_extension_requests_assignmentId_fkey";
ALTER TABLE IF EXISTS ONLY public.task_comments DROP CONSTRAINT IF EXISTS "task_comments_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.task_comments DROP CONSTRAINT IF EXISTS "task_comments_taskId_fkey";
ALTER TABLE IF EXISTS ONLY public.task_attachments DROP CONSTRAINT IF EXISTS "task_attachments_uploadedByUserId_fkey";
ALTER TABLE IF EXISTS ONLY public.task_attachments DROP CONSTRAINT IF EXISTS "task_attachments_taskId_fkey";
ALTER TABLE IF EXISTS ONLY public.task_assignments DROP CONSTRAINT IF EXISTS "task_assignments_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.task_assignments DROP CONSTRAINT IF EXISTS "task_assignments_taskId_fkey";
ALTER TABLE IF EXISTS ONLY public.task_assignments DROP CONSTRAINT IF EXISTS "task_assignments_reviewedByUserId_fkey";
ALTER TABLE IF EXISTS ONLY public.task_assignments DROP CONSTRAINT IF EXISTS "task_assignments_assignedByUserId_fkey";
ALTER TABLE IF EXISTS ONLY public.talent_retention_vaults DROP CONSTRAINT IF EXISTS "talent_retention_vaults_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.system_settings DROP CONSTRAINT IF EXISTS "system_settings_updatedById_fkey";
ALTER TABLE IF EXISTS ONLY public.system_settings DROP CONSTRAINT IF EXISTS "system_settings_companyId_fkey";
ALTER TABLE IF EXISTS ONLY public.stock_transfers DROP CONSTRAINT IF EXISTS "stock_transfers_targetWarehouseId_fkey";
ALTER TABLE IF EXISTS ONLY public.stock_transfers DROP CONSTRAINT IF EXISTS "stock_transfers_sourceWarehouseId_fkey";
ALTER TABLE IF EXISTS ONLY public.stock_transfers DROP CONSTRAINT IF EXISTS "stock_transfers_shippedById_fkey";
ALTER TABLE IF EXISTS ONLY public.stock_transfers DROP CONSTRAINT IF EXISTS "stock_transfers_requestedById_fkey";
ALTER TABLE IF EXISTS ONLY public.stock_transfers DROP CONSTRAINT IF EXISTS "stock_transfers_receivedById_fkey";
ALTER TABLE IF EXISTS ONLY public.stock_transfers DROP CONSTRAINT IF EXISTS "stock_transfers_approvedById_fkey";
ALTER TABLE IF EXISTS ONLY public.stock_transfer_items DROP CONSTRAINT IF EXISTS "stock_transfer_items_transferId_fkey";
ALTER TABLE IF EXISTS ONLY public.stock_transfer_items DROP CONSTRAINT IF EXISTS "stock_transfer_items_materialId_fkey";
ALTER TABLE IF EXISTS ONLY public.stock_transactions DROP CONSTRAINT IF EXISTS "stock_transactions_warehouseId_fkey";
ALTER TABLE IF EXISTS ONLY public.stock_transactions DROP CONSTRAINT IF EXISTS "stock_transactions_performedById_fkey";
ALTER TABLE IF EXISTS ONLY public.stock_transactions DROP CONSTRAINT IF EXISTS "stock_transactions_materialId_fkey";
ALTER TABLE IF EXISTS ONLY public.stock_receipts DROP CONSTRAINT IF EXISTS "stock_receipts_warehouseId_fkey";
ALTER TABLE IF EXISTS ONLY public.stock_receipts DROP CONSTRAINT IF EXISTS "stock_receipts_createdById_fkey";
ALTER TABLE IF EXISTS ONLY public.stock_receipts DROP CONSTRAINT IF EXISTS "stock_receipts_approvedById_fkey";
ALTER TABLE IF EXISTS ONLY public.stock_receipt_items DROP CONSTRAINT IF EXISTS "stock_receipt_items_receiptId_fkey";
ALTER TABLE IF EXISTS ONLY public.stock_receipt_items DROP CONSTRAINT IF EXISTS "stock_receipt_items_materialId_fkey";
ALTER TABLE IF EXISTS ONLY public.shift_swaps DROP CONSTRAINT IF EXISTS "shift_swaps_toShiftId_fkey";
ALTER TABLE IF EXISTS ONLY public.shift_swaps DROP CONSTRAINT IF EXISTS "shift_swaps_targetUserId_fkey";
ALTER TABLE IF EXISTS ONLY public.shift_swaps DROP CONSTRAINT IF EXISTS "shift_swaps_requesterUserId_fkey";
ALTER TABLE IF EXISTS ONLY public.shift_swaps DROP CONSTRAINT IF EXISTS "shift_swaps_fromShiftId_fkey";
ALTER TABLE IF EXISTS ONLY public.shift_swaps DROP CONSTRAINT IF EXISTS "shift_swaps_departmentId_fkey";
ALTER TABLE IF EXISTS ONLY public.shift_registrations DROP CONSTRAINT IF EXISTS "shift_registrations_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.shift_registrations DROP CONSTRAINT IF EXISTS "shift_registrations_shiftId_fkey";
ALTER TABLE IF EXISTS ONLY public.shift_registrations DROP CONSTRAINT IF EXISTS "shift_registrations_departmentId_fkey";
ALTER TABLE IF EXISTS ONLY public.shift_assignments DROP CONSTRAINT IF EXISTS "shift_assignments_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.shift_assignments DROP CONSTRAINT IF EXISTS "shift_assignments_shiftId_fkey";
ALTER TABLE IF EXISTS ONLY public.shift_assignments DROP CONSTRAINT IF EXISTS "shift_assignments_departmentId_fkey";
ALTER TABLE IF EXISTS ONLY public.salary_profiles DROP CONSTRAINT IF EXISTS "salary_profiles_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.salary_profiles DROP CONSTRAINT IF EXISTS "salary_profiles_createdById_fkey";
ALTER TABLE IF EXISTS ONLY public.role_permissions DROP CONSTRAINT IF EXISTS "role_permissions_roleId_fkey";
ALTER TABLE IF EXISTS ONLY public.role_permissions DROP CONSTRAINT IF EXISTS "role_permissions_permissionId_fkey";
ALTER TABLE IF EXISTS ONLY public.reward_withdrawal_requests DROP CONSTRAINT IF EXISTS "reward_withdrawal_requests_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.reviewer_assignments DROP CONSTRAINT IF EXISTS "reviewer_assignments_reviewerUserId_fkey";
ALTER TABLE IF EXISTS ONLY public.reviewer_assignments DROP CONSTRAINT IF EXISTS "reviewer_assignments_reviewCycleId_fkey";
ALTER TABLE IF EXISTS ONLY public.reviewer_assignments DROP CONSTRAINT IF EXISTS "reviewer_assignments_employeeUserId_fkey";
ALTER TABLE IF EXISTS ONLY public.report_snapshots DROP CONSTRAINT IF EXISTS "report_snapshots_generatedById_fkey";
ALTER TABLE IF EXISTS ONLY public.regions DROP CONSTRAINT IF EXISTS "regions_companyId_fkey";
ALTER TABLE IF EXISTS ONLY public.refresh_sessions DROP CONSTRAINT IF EXISTS "refresh_sessions_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.project_grant_packages DROP CONSTRAINT IF EXISTS "project_grant_packages_vaultId_fkey";
ALTER TABLE IF EXISTS ONLY public.project_grant_packages DROP CONSTRAINT IF EXISTS "project_grant_packages_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.post_likes DROP CONSTRAINT IF EXISTS "post_likes_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.post_likes DROP CONSTRAINT IF EXISTS "post_likes_postId_fkey";
ALTER TABLE IF EXISTS ONLY public.post_comments DROP CONSTRAINT IF EXISTS "post_comments_postId_fkey";
ALTER TABLE IF EXISTS ONLY public.post_comments DROP CONSTRAINT IF EXISTS "post_comments_authorId_fkey";
ALTER TABLE IF EXISTS ONLY public.positions DROP CONSTRAINT IF EXISTS "positions_departmentId_fkey";
ALTER TABLE IF EXISTS ONLY public.performance_reviews DROP CONSTRAINT IF EXISTS "performance_reviews_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.performance_reviews DROP CONSTRAINT IF EXISTS "performance_reviews_reviewerUserId_fkey";
ALTER TABLE IF EXISTS ONLY public.performance_reviews DROP CONSTRAINT IF EXISTS "performance_reviews_cycleId_fkey";
ALTER TABLE IF EXISTS ONLY public.performance_review_cycles DROP CONSTRAINT IF EXISTS "performance_review_cycles_createdById_fkey";
ALTER TABLE IF EXISTS ONLY public.performance_review_cycles DROP CONSTRAINT IF EXISTS "performance_review_cycles_companyId_fkey";
ALTER TABLE IF EXISTS ONLY public.payrolls DROP CONSTRAINT IF EXISTS "payrolls_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.payrolls DROP CONSTRAINT IF EXISTS "payrolls_salaryProfileId_fkey";
ALTER TABLE IF EXISTS ONLY public.payrolls DROP CONSTRAINT IF EXISTS "payrolls_payrollPeriodId_fkey";
ALTER TABLE IF EXISTS ONLY public.payroll_periods DROP CONSTRAINT IF EXISTS "payroll_periods_reviewedById_fkey";
ALTER TABLE IF EXISTS ONLY public.payroll_periods DROP CONSTRAINT IF EXISTS "payroll_periods_lockedById_fkey";
ALTER TABLE IF EXISTS ONLY public.payroll_periods DROP CONSTRAINT IF EXISTS "payroll_periods_createdById_fkey";
ALTER TABLE IF EXISTS ONLY public.payroll_periods DROP CONSTRAINT IF EXISTS "payroll_periods_companyId_fkey";
ALTER TABLE IF EXISTS ONLY public.payroll_periods DROP CONSTRAINT IF EXISTS "payroll_periods_approvedById_fkey";
ALTER TABLE IF EXISTS ONLY public.payroll_items DROP CONSTRAINT IF EXISTS "payroll_items_payrollId_fkey";
ALTER TABLE IF EXISTS ONLY public.payroll_items DROP CONSTRAINT IF EXISTS "payroll_items_componentId_fkey";
ALTER TABLE IF EXISTS ONLY public.payroll_calculation_snapshots DROP CONSTRAINT IF EXISTS "payroll_calculation_snapshots_payrollId_fkey";
ALTER TABLE IF EXISTS ONLY public.overtime_requests DROP CONSTRAINT IF EXISTS "overtime_requests_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.overtime_requests DROP CONSTRAINT IF EXISTS "overtime_requests_departmentId_fkey";
ALTER TABLE IF EXISTS ONLY public.overtime_rate_rules DROP CONSTRAINT IF EXISTS "overtime_rate_rules_departmentId_fkey";
ALTER TABLE IF EXISTS ONLY public.overtime_rate_rules DROP CONSTRAINT IF EXISTS "overtime_rate_rules_companyId_fkey";
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS "notifications_taskId_fkey";
ALTER TABLE IF EXISTS ONLY public.notification_targets DROP CONSTRAINT IF EXISTS "notification_targets_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.notification_targets DROP CONSTRAINT IF EXISTS "notification_targets_notificationId_fkey";
ALTER TABLE IF EXISTS ONLY public.notification_deliveries DROP CONSTRAINT IF EXISTS "notification_deliveries_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.notification_deliveries DROP CONSTRAINT IF EXISTS "notification_deliveries_notificationId_fkey";
ALTER TABLE IF EXISTS ONLY public.notification_deliveries DROP CONSTRAINT IF EXISTS "notification_deliveries_deviceTokenId_fkey";
ALTER TABLE IF EXISTS ONLY public.newsfeed_posts DROP CONSTRAINT IF EXISTS "newsfeed_posts_departmentId_fkey";
ALTER TABLE IF EXISTS ONLY public.newsfeed_posts DROP CONSTRAINT IF EXISTS "newsfeed_posts_authorId_fkey";
ALTER TABLE IF EXISTS ONLY public.newsfeed_posts DROP CONSTRAINT IF EXISTS "newsfeed_posts_approvedById_fkey";
ALTER TABLE IF EXISTS ONLY public.materials DROP CONSTRAINT IF EXISTS "materials_categoryId_fkey";
ALTER TABLE IF EXISTS ONLY public.material_returns DROP CONSTRAINT IF EXISTS "material_returns_warehouseId_fkey";
ALTER TABLE IF EXISTS ONLY public.material_returns DROP CONSTRAINT IF EXISTS "material_returns_returnedByUserId_fkey";
ALTER TABLE IF EXISTS ONLY public.material_returns DROP CONSTRAINT IF EXISTS "material_returns_returnedByDepartmentId_fkey";
ALTER TABLE IF EXISTS ONLY public.material_returns DROP CONSTRAINT IF EXISTS "material_returns_receivedById_fkey";
ALTER TABLE IF EXISTS ONLY public.material_return_items DROP CONSTRAINT IF EXISTS "material_return_items_materialReturnId_fkey";
ALTER TABLE IF EXISTS ONLY public.material_return_items DROP CONSTRAINT IF EXISTS "material_return_items_materialId_fkey";
ALTER TABLE IF EXISTS ONLY public.material_issues DROP CONSTRAINT IF EXISTS "material_issues_warehouseId_fkey";
ALTER TABLE IF EXISTS ONLY public.material_issues DROP CONSTRAINT IF EXISTS "material_issues_requestedById_fkey";
ALTER TABLE IF EXISTS ONLY public.material_issues DROP CONSTRAINT IF EXISTS "material_issues_issuedToUserId_fkey";
ALTER TABLE IF EXISTS ONLY public.material_issues DROP CONSTRAINT IF EXISTS "material_issues_issuedToDepartmentId_fkey";
ALTER TABLE IF EXISTS ONLY public.material_issues DROP CONSTRAINT IF EXISTS "material_issues_issuedById_fkey";
ALTER TABLE IF EXISTS ONLY public.material_issues DROP CONSTRAINT IF EXISTS "material_issues_approvedById_fkey";
ALTER TABLE IF EXISTS ONLY public.material_issue_items DROP CONSTRAINT IF EXISTS "material_issue_items_materialIssueId_fkey";
ALTER TABLE IF EXISTS ONLY public.material_issue_items DROP CONSTRAINT IF EXISTS "material_issue_items_materialId_fkey";
ALTER TABLE IF EXISTS ONLY public.location_trackings DROP CONSTRAINT IF EXISTS "location_trackings_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.level_promotion_requests DROP CONSTRAINT IF EXISTS "level_promotion_requests_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.level_promotion_requests DROP CONSTRAINT IF EXISTS "level_promotion_requests_departmentId_fkey";
ALTER TABLE IF EXISTS ONLY public.leave_requests DROP CONSTRAINT IF EXISTS "leave_requests_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.leave_requests DROP CONSTRAINT IF EXISTS "leave_requests_leaveTypeId_fkey";
ALTER TABLE IF EXISTS ONLY public.leave_requests DROP CONSTRAINT IF EXISTS "leave_requests_departmentId_fkey";
ALTER TABLE IF EXISTS ONLY public.leave_balances DROP CONSTRAINT IF EXISTS "leave_balances_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.leave_balances DROP CONSTRAINT IF EXISTS "leave_balances_leaveTypeId_fkey";
ALTER TABLE IF EXISTS ONLY public.kpi_templates DROP CONSTRAINT IF EXISTS "kpi_templates_positionId_fkey";
ALTER TABLE IF EXISTS ONLY public.kpi_templates DROP CONSTRAINT IF EXISTS "kpi_templates_departmentId_fkey";
ALTER TABLE IF EXISTS ONLY public.kpi_templates DROP CONSTRAINT IF EXISTS "kpi_templates_createdById_fkey";
ALTER TABLE IF EXISTS ONLY public.kpi_templates DROP CONSTRAINT IF EXISTS "kpi_templates_companyId_fkey";
ALTER TABLE IF EXISTS ONLY public.kpi_criteria DROP CONSTRAINT IF EXISTS "kpi_criteria_kpiTemplateId_fkey";
ALTER TABLE IF EXISTS ONLY public.inventory_checks DROP CONSTRAINT IF EXISTS "inventory_checks_warehouseId_fkey";
ALTER TABLE IF EXISTS ONLY public.inventory_checks DROP CONSTRAINT IF EXISTS "inventory_checks_createdById_fkey";
ALTER TABLE IF EXISTS ONLY public.inventory_checks DROP CONSTRAINT IF EXISTS "inventory_checks_approvedById_fkey";
ALTER TABLE IF EXISTS ONLY public.inventory_check_items DROP CONSTRAINT IF EXISTS "inventory_check_items_materialId_fkey";
ALTER TABLE IF EXISTS ONLY public.inventory_check_items DROP CONSTRAINT IF EXISTS "inventory_check_items_inventoryCheckId_fkey";
ALTER TABLE IF EXISTS ONLY public.grant_milestones DROP CONSTRAINT IF EXISTS "grant_milestones_packageId_fkey";
ALTER TABLE IF EXISTS ONLY public.feedbacks DROP CONSTRAINT IF EXISTS "feedbacks_senderUserId_fkey";
ALTER TABLE IF EXISTS ONLY public.face_registration_images DROP CONSTRAINT IF EXISTS "face_registration_images_faceProfileId_fkey";
ALTER TABLE IF EXISTS ONLY public.face_profiles DROP CONSTRAINT IF EXISTS "face_profiles_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.employee_salary_components DROP CONSTRAINT IF EXISTS "employee_salary_components_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.employee_salary_components DROP CONSTRAINT IF EXISTS "employee_salary_components_createdById_fkey";
ALTER TABLE IF EXISTS ONLY public.employee_salary_components DROP CONSTRAINT IF EXISTS "employee_salary_components_componentId_fkey";
ALTER TABLE IF EXISTS ONLY public.employee_requests DROP CONSTRAINT IF EXISTS "employee_requests_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.employee_requests DROP CONSTRAINT IF EXISTS "employee_requests_departmentId_fkey";
ALTER TABLE IF EXISTS ONLY public.employee_profiles DROP CONSTRAINT IF EXISTS "employee_profiles_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.employee_profiles DROP CONSTRAINT IF EXISTS "employee_profiles_positionId_fkey";
ALTER TABLE IF EXISTS ONLY public.employee_kpi_results DROP CONSTRAINT IF EXISTS "employee_kpi_results_employeeKpiAssignmentId_fkey";
ALTER TABLE IF EXISTS ONLY public.employee_kpi_results DROP CONSTRAINT IF EXISTS "employee_kpi_results_criteriaId_fkey";
ALTER TABLE IF EXISTS ONLY public.employee_kpi_assignments DROP CONSTRAINT IF EXISTS "employee_kpi_assignments_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.employee_kpi_assignments DROP CONSTRAINT IF EXISTS "employee_kpi_assignments_kpiTemplateId_fkey";
ALTER TABLE IF EXISTS ONLY public.employee_kpi_assignments DROP CONSTRAINT IF EXISTS "employee_kpi_assignments_assignedById_fkey";
ALTER TABLE IF EXISTS ONLY public.employee_documents DROP CONSTRAINT IF EXISTS "employee_documents_verifiedById_fkey";
ALTER TABLE IF EXISTS ONLY public.employee_documents DROP CONSTRAINT IF EXISTS "employee_documents_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.employee_documents DROP CONSTRAINT IF EXISTS "employee_documents_employeeId_fkey";
ALTER TABLE IF EXISTS ONLY public.employee_documents DROP CONSTRAINT IF EXISTS "employee_documents_documentTypeId_fkey";
ALTER TABLE IF EXISTS ONLY public.employee_deductions DROP CONSTRAINT IF EXISTS "employee_deductions_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.employee_deductions DROP CONSTRAINT IF EXISTS "employee_deductions_createdById_fkey";
ALTER TABLE IF EXISTS ONLY public.employee_deductions DROP CONSTRAINT IF EXISTS "employee_deductions_approvedById_fkey";
ALTER TABLE IF EXISTS ONLY public.employee_contracts DROP CONSTRAINT IF EXISTS "employee_contracts_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.employee_contracts DROP CONSTRAINT IF EXISTS "employee_contracts_createdById_fkey";
ALTER TABLE IF EXISTS ONLY public.employee_contracts DROP CONSTRAINT IF EXISTS "employee_contracts_contractTemplateVersionId_fkey";
ALTER TABLE IF EXISTS ONLY public.employee_contracts DROP CONSTRAINT IF EXISTS "employee_contracts_contractTemplateId_fkey";
ALTER TABLE IF EXISTS ONLY public.employee_contracts DROP CONSTRAINT IF EXISTS "employee_contracts_approvedById_fkey";
ALTER TABLE IF EXISTS ONLY public.employee_bonuses DROP CONSTRAINT IF EXISTS "employee_bonuses_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.employee_bonuses DROP CONSTRAINT IF EXISTS "employee_bonuses_createdById_fkey";
ALTER TABLE IF EXISTS ONLY public.employee_bonuses DROP CONSTRAINT IF EXISTS "employee_bonuses_approvedById_fkey";
ALTER TABLE IF EXISTS ONLY public.employee_bank_accounts DROP CONSTRAINT IF EXISTS "employee_bank_accounts_employeeId_fkey";
ALTER TABLE IF EXISTS ONLY public.document_types DROP CONSTRAINT IF EXISTS "document_types_companyId_fkey";
ALTER TABLE IF EXISTS ONLY public.disciplinary_actions DROP CONSTRAINT IF EXISTS "disciplinary_actions_violationId_fkey";
ALTER TABLE IF EXISTS ONLY public.disciplinary_actions DROP CONSTRAINT IF EXISTS "disciplinary_actions_approvedById_fkey";
ALTER TABLE IF EXISTS ONLY public.device_tokens DROP CONSTRAINT IF EXISTS "device_tokens_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.departments DROP CONSTRAINT IF EXISTS "departments_parentId_fkey";
ALTER TABLE IF EXISTS ONLY public.departments DROP CONSTRAINT IF EXISTS "departments_leaderUserId_fkey";
ALTER TABLE IF EXISTS ONLY public.departments DROP CONSTRAINT IF EXISTS "departments_companyId_fkey";
ALTER TABLE IF EXISTS ONLY public.departments DROP CONSTRAINT IF EXISTS "departments_branchId_fkey";
ALTER TABLE IF EXISTS ONLY public.department_overtime_configs DROP CONSTRAINT IF EXISTS "department_overtime_configs_departmentId_fkey";
ALTER TABLE IF EXISTS ONLY public.department_members DROP CONSTRAINT IF EXISTS "department_members_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.department_members DROP CONSTRAINT IF EXISTS "department_members_positionId_fkey";
ALTER TABLE IF EXISTS ONLY public.department_members DROP CONSTRAINT IF EXISTS "department_members_departmentId_fkey";
ALTER TABLE IF EXISTS ONLY public.department_level_configs DROP CONSTRAINT IF EXISTS "department_level_configs_departmentId_fkey";
ALTER TABLE IF EXISTS ONLY public.department_documents DROP CONSTRAINT IF EXISTS "department_documents_uploadedById_fkey";
ALTER TABLE IF EXISTS ONLY public.department_documents DROP CONSTRAINT IF EXISTS "department_documents_departmentId_fkey";
ALTER TABLE IF EXISTS ONLY public.department_documents DROP CONSTRAINT IF EXISTS "department_documents_companyId_fkey";
ALTER TABLE IF EXISTS ONLY public.cross_department_requests DROP CONSTRAINT IF EXISTS "cross_department_requests_taskId_fkey";
ALTER TABLE IF EXISTS ONLY public.cross_department_requests DROP CONSTRAINT IF EXISTS "cross_department_requests_targetDepartmentId_fkey";
ALTER TABLE IF EXISTS ONLY public.cross_department_requests DROP CONSTRAINT IF EXISTS "cross_department_requests_sourceDepartmentId_fkey";
ALTER TABLE IF EXISTS ONLY public.cross_department_requests DROP CONSTRAINT IF EXISTS "cross_department_requests_decidedByUserId_fkey";
ALTER TABLE IF EXISTS ONLY public.cross_department_requests DROP CONSTRAINT IF EXISTS "cross_department_requests_createdByUserId_fkey";
ALTER TABLE IF EXISTS ONLY public.cross_department_requests DROP CONSTRAINT IF EXISTS "cross_department_requests_assignedToUserId_fkey";
ALTER TABLE IF EXISTS ONLY public.contract_templates DROP CONSTRAINT IF EXISTS "contract_templates_createdById_fkey";
ALTER TABLE IF EXISTS ONLY public.contract_templates DROP CONSTRAINT IF EXISTS "contract_templates_companyId_fkey";
ALTER TABLE IF EXISTS ONLY public.contract_template_versions DROP CONSTRAINT IF EXISTS "contract_template_versions_createdById_fkey";
ALTER TABLE IF EXISTS ONLY public.contract_template_versions DROP CONSTRAINT IF EXISTS "contract_template_versions_contractTemplateId_fkey";
ALTER TABLE IF EXISTS ONLY public.contract_signatures DROP CONSTRAINT IF EXISTS "contract_signatures_signerUserId_fkey";
ALTER TABLE IF EXISTS ONLY public.contract_signatures DROP CONSTRAINT IF EXISTS "contract_signatures_contractId_fkey";
ALTER TABLE IF EXISTS ONLY public.chat_messages DROP CONSTRAINT IF EXISTS "chat_messages_senderId_fkey";
ALTER TABLE IF EXISTS ONLY public.chat_messages DROP CONSTRAINT IF EXISTS "chat_messages_groupId_fkey";
ALTER TABLE IF EXISTS ONLY public.chat_groups DROP CONSTRAINT IF EXISTS "chat_groups_taskId_fkey";
ALTER TABLE IF EXISTS ONLY public.chat_groups DROP CONSTRAINT IF EXISTS "chat_groups_departmentId_fkey";
ALTER TABLE IF EXISTS ONLY public.chat_group_members DROP CONSTRAINT IF EXISTS "chat_group_members_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.chat_group_members DROP CONSTRAINT IF EXISTS "chat_group_members_groupId_fkey";
ALTER TABLE IF EXISTS ONLY public.branches DROP CONSTRAINT IF EXISTS "branches_regionId_fkey";
ALTER TABLE IF EXISTS ONLY public.branches DROP CONSTRAINT IF EXISTS "branches_companyId_fkey";
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS "audit_logs_actorUserId_fkey";
ALTER TABLE IF EXISTS ONLY public.attendance_verifications DROP CONSTRAINT IF EXISTS "attendance_verifications_attendanceRecordId_fkey";
ALTER TABLE IF EXISTS ONLY public.attendance_records DROP CONSTRAINT IF EXISTS "attendance_records_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.attendance_records DROP CONSTRAINT IF EXISTS "attendance_records_shiftAssignmentId_fkey";
ALTER TABLE IF EXISTS ONLY public.attendance_records DROP CONSTRAINT IF EXISTS "attendance_records_photoFileId_fkey";
ALTER TABLE IF EXISTS ONLY public.attendance_records DROP CONSTRAINT IF EXISTS "attendance_records_departmentId_fkey";
ALTER TABLE IF EXISTS ONLY public.attendance_records DROP CONSTRAINT IF EXISTS "attendance_records_checkOutPhotoFileId_fkey";
ALTER TABLE IF EXISTS ONLY public.attendance_locations DROP CONSTRAINT IF EXISTS "attendance_locations_branchId_fkey";
ALTER TABLE IF EXISTS ONLY public.attendance_adjustments DROP CONSTRAINT IF EXISTS "attendance_adjustments_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.attendance_adjustments DROP CONSTRAINT IF EXISTS "attendance_adjustments_departmentId_fkey";
ALTER TABLE IF EXISTS ONLY public.attendance_adjustments DROP CONSTRAINT IF EXISTS "attendance_adjustments_attendanceRecordId_fkey";
ALTER TABLE IF EXISTS ONLY public.assets DROP CONSTRAINT IF EXISTS "assets_warehouseId_fkey";
ALTER TABLE IF EXISTS ONLY public.assets DROP CONSTRAINT IF EXISTS "assets_departmentId_fkey";
ALTER TABLE IF EXISTS ONLY public.asset_maintenance_records DROP CONSTRAINT IF EXISTS "asset_maintenance_records_createdById_fkey";
ALTER TABLE IF EXISTS ONLY public.asset_maintenance_records DROP CONSTRAINT IF EXISTS "asset_maintenance_records_assetId_fkey";
ALTER TABLE IF EXISTS ONLY public.asset_incident_reports DROP CONSTRAINT IF EXISTS "asset_incident_reports_resolvedById_fkey";
ALTER TABLE IF EXISTS ONLY public.asset_incident_reports DROP CONSTRAINT IF EXISTS "asset_incident_reports_reportedById_fkey";
ALTER TABLE IF EXISTS ONLY public.asset_incident_reports DROP CONSTRAINT IF EXISTS "asset_incident_reports_assetId_fkey";
ALTER TABLE IF EXISTS ONLY public.asset_assignments DROP CONSTRAINT IF EXISTS "asset_assignments_assignedToUserId_fkey";
ALTER TABLE IF EXISTS ONLY public.asset_assignments DROP CONSTRAINT IF EXISTS "asset_assignments_assignedToDepartmentId_fkey";
ALTER TABLE IF EXISTS ONLY public.asset_assignments DROP CONSTRAINT IF EXISTS "asset_assignments_assignedById_fkey";
ALTER TABLE IF EXISTS ONLY public.asset_assignments DROP CONSTRAINT IF EXISTS "asset_assignments_assetId_fkey";
ALTER TABLE IF EXISTS ONLY public.asset_assignment_histories DROP CONSTRAINT IF EXISTS "asset_assignment_histories_performedById_fkey";
ALTER TABLE IF EXISTS ONLY public.asset_assignment_histories DROP CONSTRAINT IF EXISTS "asset_assignment_histories_assetAssignmentId_fkey";
ALTER TABLE IF EXISTS ONLY public.approval_histories DROP CONSTRAINT IF EXISTS "approval_histories_approvalRequestId_fkey";
ALTER TABLE IF EXISTS ONLY public.approval_histories DROP CONSTRAINT IF EXISTS "approval_histories_actorUserId_fkey";
ALTER TABLE IF EXISTS ONLY public."_AttendanceLocationDepartments" DROP CONSTRAINT IF EXISTS "_AttendanceLocationDepartments_B_fkey";
ALTER TABLE IF EXISTS ONLY public."_AttendanceLocationDepartments" DROP CONSTRAINT IF EXISTS "_AttendanceLocationDepartments_A_fkey";
ALTER TABLE IF EXISTS ONLY public."OtpToken" DROP CONSTRAINT IF EXISTS "OtpToken_userId_fkey";
DROP INDEX IF EXISTS public."warehouses_departmentId_idx";
DROP INDEX IF EXISTS public."warehouses_companyId_isActive_idx";
DROP INDEX IF EXISTS public.warehouses_code_key;
DROP INDEX IF EXISTS public."warehouse_stocks_warehouseId_materialId_key";
DROP INDEX IF EXISTS public."warehouse_stocks_materialId_idx";
DROP INDEX IF EXISTS public."violations_userId_status_violationDate_idx";
DROP INDEX IF EXISTS public."users_userCode_key";
DROP INDEX IF EXISTS public.users_phone_key;
DROP INDEX IF EXISTS public.users_email_key;
DROP INDEX IF EXISTS public."user_roles_userId_roleId_scopeType_scopeId_key";
DROP INDEX IF EXISTS public."user_notification_preferences_userId_notificationType_key";
DROP INDEX IF EXISTS public."user_approval_requests_userId_idx";
DROP INDEX IF EXISTS public."user_approval_requests_requestedDepartmentId_status_idx";
DROP INDEX IF EXISTS public."uploaded_files_uploadedById_idx";
DROP INDEX IF EXISTS public."uploaded_files_storageKey_key";
DROP INDEX IF EXISTS public."uploaded_files_purpose_status_createdAt_idx";
DROP INDEX IF EXISTS public."tasks_taskCode_key";
DROP INDEX IF EXISTS public."tasks_departmentContextId_status_idx";
DROP INDEX IF EXISTS public."tasks_createdByUserId_createdAt_idx";
DROP INDEX IF EXISTS public."task_targets_taskId_targetType_targetId_key";
DROP INDEX IF EXISTS public."task_targets_targetType_targetId_idx";
DROP INDEX IF EXISTS public."task_status_histories_taskId_createdAt_idx";
DROP INDEX IF EXISTS public."task_groups_departmentId_name_key";
DROP INDEX IF EXISTS public."task_group_members_groupId_userId_key";
DROP INDEX IF EXISTS public."task_extension_requests_status_createdAt_idx";
DROP INDEX IF EXISTS public."task_comments_taskId_createdAt_idx";
DROP INDEX IF EXISTS public."task_attachments_taskId_idx";
DROP INDEX IF EXISTS public."task_assignments_userId_status_idx";
DROP INDEX IF EXISTS public."task_assignments_taskId_userId_key";
DROP INDEX IF EXISTS public."talent_retention_vaults_userId_year_key";
DROP INDEX IF EXISTS public."system_settings_companyId_key_key";
DROP INDEX IF EXISTS public."system_settings_companyId_category_idx";
DROP INDEX IF EXISTS public."stock_transfers_transferCode_key";
DROP INDEX IF EXISTS public."stock_transfers_targetWarehouseId_status_idx";
DROP INDEX IF EXISTS public."stock_transfers_sourceWarehouseId_status_idx";
DROP INDEX IF EXISTS public."stock_transfer_items_transferId_idx";
DROP INDEX IF EXISTS public."stock_transfer_items_materialId_idx";
DROP INDEX IF EXISTS public."stock_transactions_warehouseId_createdAt_idx";
DROP INDEX IF EXISTS public."stock_transactions_transactionCode_key";
DROP INDEX IF EXISTS public."stock_transactions_materialId_createdAt_idx";
DROP INDEX IF EXISTS public."stock_receipts_warehouseId_status_idx";
DROP INDEX IF EXISTS public."stock_receipts_receiptCode_key";
DROP INDEX IF EXISTS public."stock_receipt_items_receiptId_idx";
DROP INDEX IF EXISTS public."stock_receipt_items_materialId_idx";
DROP INDEX IF EXISTS public.shifts_code_key;
DROP INDEX IF EXISTS public."shift_swaps_targetUserId_idx";
DROP INDEX IF EXISTS public."shift_swaps_requesterUserId_idx";
DROP INDEX IF EXISTS public."shift_swaps_departmentId_status_idx";
DROP INDEX IF EXISTS public."shift_registrations_workDate_idx";
DROP INDEX IF EXISTS public."shift_registrations_userId_idx";
DROP INDEX IF EXISTS public."shift_registrations_departmentId_status_idx";
DROP INDEX IF EXISTS public."shift_assignments_userId_workDate_key";
DROP INDEX IF EXISTS public."shift_assignments_departmentId_workDate_idx";
DROP INDEX IF EXISTS public."salary_profiles_userId_effectiveFrom_key";
DROP INDEX IF EXISTS public."salary_profiles_userId_effectiveFrom_effectiveTo_idx";
DROP INDEX IF EXISTS public.salary_components_code_key;
DROP INDEX IF EXISTS public.roles_code_key;
DROP INDEX IF EXISTS public."role_permissions_roleId_permissionId_key";
DROP INDEX IF EXISTS public."reviewer_assignments_reviewerUserId_reviewerType_idx";
DROP INDEX IF EXISTS public."reviewer_assignments_reviewCycleId_employeeUserId_reviewerU_key";
DROP INDEX IF EXISTS public."report_snapshots_scopeType_scopeId_idx";
DROP INDEX IF EXISTS public."report_snapshots_reportType_periodStart_periodEnd_idx";
DROP INDEX IF EXISTS public."regions_companyId_code_key";
DROP INDEX IF EXISTS public."refresh_sessions_userId_idx";
DROP INDEX IF EXISTS public."refresh_sessions_tokenHash_key";
DROP INDEX IF EXISTS public."refresh_sessions_expiresAt_idx";
DROP INDEX IF EXISTS public."post_likes_postId_userId_key";
DROP INDEX IF EXISTS public."post_comments_postId_idx";
DROP INDEX IF EXISTS public.positions_code_key;
DROP INDEX IF EXISTS public.permissions_code_key;
DROP INDEX IF EXISTS public."performance_reviews_userId_status_idx";
DROP INDEX IF EXISTS public."performance_reviews_reviewerUserId_status_idx";
DROP INDEX IF EXISTS public."performance_reviews_cycleId_userId_key";
DROP INDEX IF EXISTS public."performance_review_cycles_status_periodStart_periodEnd_idx";
DROP INDEX IF EXISTS public."performance_review_cycles_companyId_code_key";
DROP INDEX IF EXISTS public."payrolls_userId_status_idx";
DROP INDEX IF EXISTS public."payrolls_payrollPeriodId_userId_key";
DROP INDEX IF EXISTS public."payrolls_payrollPeriodId_status_idx";
DROP INDEX IF EXISTS public.payroll_periods_status_idx;
DROP INDEX IF EXISTS public."payroll_periods_periodCode_key";
DROP INDEX IF EXISTS public."payroll_periods_companyId_month_year_key";
DROP INDEX IF EXISTS public."payroll_items_sourceType_sourceId_idx";
DROP INDEX IF EXISTS public."payroll_items_payrollId_idx";
DROP INDEX IF EXISTS public."payroll_calculation_snapshots_payrollId_key";
DROP INDEX IF EXISTS public."overtime_requests_userId_idx";
DROP INDEX IF EXISTS public."overtime_requests_departmentId_status_idx";
DROP INDEX IF EXISTS public."overtime_rate_rules_companyId_overtimeType_effectiveFrom_ef_idx";
DROP INDEX IF EXISTS public."notifications_type_createdAt_idx";
DROP INDEX IF EXISTS public."notifications_dedupKey_key";
DROP INDEX IF EXISTS public."notification_targets_userId_readAt_idx";
DROP INDEX IF EXISTS public."notification_targets_notificationId_userId_key";
DROP INDEX IF EXISTS public."notification_deliveries_userId_status_idx";
DROP INDEX IF EXISTS public."newsfeed_posts_departmentId_status_idx";
DROP INDEX IF EXISTS public."newsfeed_posts_authorId_status_idx";
DROP INDEX IF EXISTS public."monthly_competition_reviews_userId_period_key";
DROP INDEX IF EXISTS public."materials_materialCode_key";
DROP INDEX IF EXISTS public."materials_categoryId_isActive_idx";
DROP INDEX IF EXISTS public."material_returns_warehouseId_status_idx";
DROP INDEX IF EXISTS public."material_returns_returnCode_key";
DROP INDEX IF EXISTS public."material_return_items_materialReturnId_idx";
DROP INDEX IF EXISTS public."material_return_items_materialId_idx";
DROP INDEX IF EXISTS public."material_issues_warehouseId_status_idx";
DROP INDEX IF EXISTS public."material_issues_issuedToUserId_idx";
DROP INDEX IF EXISTS public."material_issues_issuedToDepartmentId_status_idx";
DROP INDEX IF EXISTS public."material_issues_issueCode_key";
DROP INDEX IF EXISTS public."material_issue_items_materialIssueId_idx";
DROP INDEX IF EXISTS public."material_issue_items_materialId_idx";
DROP INDEX IF EXISTS public.material_categories_code_key;
DROP INDEX IF EXISTS public."location_trackings_userId_recordedAt_idx";
DROP INDEX IF EXISTS public."level_promotion_requests_userId_idx";
DROP INDEX IF EXISTS public."level_promotion_requests_departmentId_status_idx";
DROP INDEX IF EXISTS public.leave_types_code_key;
DROP INDEX IF EXISTS public."leave_requests_userId_idx";
DROP INDEX IF EXISTS public."leave_requests_departmentId_status_idx";
DROP INDEX IF EXISTS public."leave_balances_userId_leaveTypeId_year_key";
DROP INDEX IF EXISTS public."kpi_templates_departmentId_positionId_isActive_idx";
DROP INDEX IF EXISTS public."kpi_templates_companyId_code_key";
DROP INDEX IF EXISTS public."kpi_criteria_kpiTemplateId_sortOrder_idx";
DROP INDEX IF EXISTS public."kpi_criteria_kpiTemplateId_code_key";
DROP INDEX IF EXISTS public."job_execution_logs_jobName_startedAt_idx";
DROP INDEX IF EXISTS public."job_execution_logs_executionKey_key";
DROP INDEX IF EXISTS public."inventory_checks_warehouseId_status_idx";
DROP INDEX IF EXISTS public."inventory_checks_checkCode_key";
DROP INDEX IF EXISTS public."inventory_check_items_inventoryCheckId_idx";
DROP INDEX IF EXISTS public."feedbacks_status_createdAt_idx";
DROP INDEX IF EXISTS public."feedbacks_senderUserId_createdAt_idx";
DROP INDEX IF EXISTS public."feedbacks_isAnonymous_idx";
DROP INDEX IF EXISTS public."face_registration_images_faceProfileId_pose_key";
DROP INDEX IF EXISTS public."face_profiles_userId_key";
DROP INDEX IF EXISTS public."employee_salary_components_userId_effectiveFrom_effectiveTo_idx";
DROP INDEX IF EXISTS public."employee_salary_components_userId_componentId_effectiveFrom_key";
DROP INDEX IF EXISTS public."employee_requests_departmentId_status_type_idx";
DROP INDEX IF EXISTS public."employee_profiles_userId_key";
DROP INDEX IF EXISTS public."employee_profiles_idCardNumber_key";
DROP INDEX IF EXISTS public."employee_levels_levelNumber_key";
DROP INDEX IF EXISTS public."employee_kpi_results_employeeKpiAssignmentId_criteriaId_key";
DROP INDEX IF EXISTS public."employee_kpi_results_criteriaId_idx";
DROP INDEX IF EXISTS public."employee_kpi_assignments_userId_status_periodStart_periodEn_idx";
DROP INDEX IF EXISTS public."employee_kpi_assignments_userId_kpiTemplateId_periodStart_p_key";
DROP INDEX IF EXISTS public."employee_kpi_assignments_status_periodEnd_idx";
DROP INDEX IF EXISTS public."employee_documents_verifiedById_idx";
DROP INDEX IF EXISTS public."employee_documents_userId_status_idx";
DROP INDEX IF EXISTS public."employee_documents_expiryDate_status_idx";
DROP INDEX IF EXISTS public."employee_documents_employeeId_idx";
DROP INDEX IF EXISTS public."employee_documents_documentTypeId_idx";
DROP INDEX IF EXISTS public."employee_deductions_userId_status_effectiveDate_idx";
DROP INDEX IF EXISTS public."employee_contracts_userId_status_idx";
DROP INDEX IF EXISTS public."employee_contracts_status_endDate_idx";
DROP INDEX IF EXISTS public."employee_contracts_contractTemplateId_idx";
DROP INDEX IF EXISTS public."employee_contracts_contractCode_key";
DROP INDEX IF EXISTS public."employee_bonuses_userId_status_effectiveDate_idx";
DROP INDEX IF EXISTS public."document_types_companyId_isActive_idx";
DROP INDEX IF EXISTS public."document_types_companyId_code_key";
DROP INDEX IF EXISTS public."disciplinary_actions_violationId_status_idx";
DROP INDEX IF EXISTS public."device_tokens_userId_revokedAt_idx";
DROP INDEX IF EXISTS public."device_tokens_tokenHash_key";
DROP INDEX IF EXISTS public."departments_parentId_idx";
DROP INDEX IF EXISTS public."departments_leaderUserId_idx";
DROP INDEX IF EXISTS public."departments_companyId_code_key";
DROP INDEX IF EXISTS public."departments_branchId_idx";
DROP INDEX IF EXISTS public."department_overtime_configs_departmentId_key";
DROP INDEX IF EXISTS public."department_members_userId_idx";
DROP INDEX IF EXISTS public."department_members_positionId_idx";
DROP INDEX IF EXISTS public."department_members_departmentId_userId_key";
DROP INDEX IF EXISTS public."department_level_configs_departmentId_levelNumber_key";
DROP INDEX IF EXISTS public."department_documents_departmentId_idx";
DROP INDEX IF EXISTS public."department_documents_companyId_departmentId_idx";
DROP INDEX IF EXISTS public."department_competition_configs_departmentId_key";
DROP INDEX IF EXISTS public."cross_department_requests_targetDepartmentId_status_idx";
DROP INDEX IF EXISTS public."cross_department_requests_sourceDepartmentId_status_idx";
DROP INDEX IF EXISTS public."cross_department_requests_requestCode_key";
DROP INDEX IF EXISTS public."cross_department_requests_assignedToUserId_status_idx";
DROP INDEX IF EXISTS public."contract_templates_companyId_contractType_isActive_idx";
DROP INDEX IF EXISTS public."contract_templates_companyId_code_key";
DROP INDEX IF EXISTS public."contract_template_versions_contractTemplateId_versionNumber_key";
DROP INDEX IF EXISTS public."contract_signatures_signerUserId_idx";
DROP INDEX IF EXISTS public."contract_signatures_contractId_signerUserId_signerRole_key";
DROP INDEX IF EXISTS public."contract_signatures_contractId_signerRole_idx";
DROP INDEX IF EXISTS public."company_holidays_companyId_date_idx";
DROP INDEX IF EXISTS public.companies_code_key;
DROP INDEX IF EXISTS public."chat_messages_senderId_idx";
DROP INDEX IF EXISTS public."chat_messages_groupId_createdAt_idx";
DROP INDEX IF EXISTS public."chat_groups_taskId_key";
DROP INDEX IF EXISTS public."chat_groups_departmentId_key";
DROP INDEX IF EXISTS public."chat_group_members_userId_idx";
DROP INDEX IF EXISTS public."chat_group_members_groupId_userId_key";
DROP INDEX IF EXISTS public."branches_regionId_idx";
DROP INDEX IF EXISTS public."branches_companyId_code_key";
DROP INDEX IF EXISTS public."audit_logs_entityType_entityId_idx";
DROP INDEX IF EXISTS public."audit_logs_createdAt_idx";
DROP INDEX IF EXISTS public."audit_logs_actorUserId_idx";
DROP INDEX IF EXISTS public."attendance_records_userId_workDate_idx";
DROP INDEX IF EXISTS public."attendance_records_userId_shiftAssignmentId_idx";
DROP INDEX IF EXISTS public."attendance_records_photoFileId_idx";
DROP INDEX IF EXISTS public."attendance_records_departmentId_workDate_idx";
DROP INDEX IF EXISTS public."attendance_records_checkOutPhotoFileId_idx";
DROP INDEX IF EXISTS public."attendance_adjustments_userId_idx";
DROP INDEX IF EXISTS public."attendance_adjustments_departmentId_status_idx";
DROP INDEX IF EXISTS public."attendance_adjustments_attendanceRecordId_idx";
DROP INDEX IF EXISTS public."assets_assetStatus_idx";
DROP INDEX IF EXISTS public."assets_assetCode_key";
DROP INDEX IF EXISTS public."asset_maintenance_records_assetId_status_idx";
DROP INDEX IF EXISTS public."asset_incident_reports_status_createdAt_idx";
DROP INDEX IF EXISTS public."asset_incident_reports_assetId_status_idx";
DROP INDEX IF EXISTS public."asset_assignments_assignedToUserId_status_idx";
DROP INDEX IF EXISTS public."asset_assignments_assignedToDepartmentId_status_idx";
DROP INDEX IF EXISTS public."asset_assignments_assetId_status_idx";
DROP INDEX IF EXISTS public."asset_assignment_histories_assetAssignmentId_idx";
DROP INDEX IF EXISTS public."_AttendanceLocationDepartments_B_index";
DROP INDEX IF EXISTS public."OtpToken_userId_idx";
DROP INDEX IF EXISTS public."OtpToken_resetToken_key";
DROP INDEX IF EXISTS public."OtpToken_phone_idx";
DROP INDEX IF EXISTS public."OtpToken_email_idx";
ALTER TABLE IF EXISTS ONLY public.wifi_configs DROP CONSTRAINT IF EXISTS wifi_configs_pkey;
ALTER TABLE IF EXISTS ONLY public.warehouses DROP CONSTRAINT IF EXISTS warehouses_pkey;
ALTER TABLE IF EXISTS ONLY public.warehouse_stocks DROP CONSTRAINT IF EXISTS warehouse_stocks_pkey;
ALTER TABLE IF EXISTS ONLY public.violations DROP CONSTRAINT IF EXISTS violations_pkey;
ALTER TABLE IF EXISTS ONLY public.vesting_milestones DROP CONSTRAINT IF EXISTS vesting_milestones_pkey;
ALTER TABLE IF EXISTS ONLY public.vault_transactions DROP CONSTRAINT IF EXISTS vault_transactions_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.user_roles DROP CONSTRAINT IF EXISTS user_roles_pkey;
ALTER TABLE IF EXISTS ONLY public.user_notification_preferences DROP CONSTRAINT IF EXISTS user_notification_preferences_pkey;
ALTER TABLE IF EXISTS ONLY public.user_approval_requests DROP CONSTRAINT IF EXISTS user_approval_requests_pkey;
ALTER TABLE IF EXISTS ONLY public.uploaded_files DROP CONSTRAINT IF EXISTS uploaded_files_pkey;
ALTER TABLE IF EXISTS ONLY public.tiktok_live_sessions DROP CONSTRAINT IF EXISTS tiktok_live_sessions_pkey;
ALTER TABLE IF EXISTS ONLY public.tasks DROP CONSTRAINT IF EXISTS tasks_pkey;
ALTER TABLE IF EXISTS ONLY public.task_targets DROP CONSTRAINT IF EXISTS task_targets_pkey;
ALTER TABLE IF EXISTS ONLY public.task_status_histories DROP CONSTRAINT IF EXISTS task_status_histories_pkey;
ALTER TABLE IF EXISTS ONLY public.task_groups DROP CONSTRAINT IF EXISTS task_groups_pkey;
ALTER TABLE IF EXISTS ONLY public.task_group_members DROP CONSTRAINT IF EXISTS task_group_members_pkey;
ALTER TABLE IF EXISTS ONLY public.task_extension_requests DROP CONSTRAINT IF EXISTS task_extension_requests_pkey;
ALTER TABLE IF EXISTS ONLY public.task_comments DROP CONSTRAINT IF EXISTS task_comments_pkey;
ALTER TABLE IF EXISTS ONLY public.task_attachments DROP CONSTRAINT IF EXISTS task_attachments_pkey;
ALTER TABLE IF EXISTS ONLY public.task_assignments DROP CONSTRAINT IF EXISTS task_assignments_pkey;
ALTER TABLE IF EXISTS ONLY public.talent_retention_vaults DROP CONSTRAINT IF EXISTS talent_retention_vaults_pkey;
ALTER TABLE IF EXISTS ONLY public.system_settings DROP CONSTRAINT IF EXISTS system_settings_pkey;
ALTER TABLE IF EXISTS ONLY public.stock_transfers DROP CONSTRAINT IF EXISTS stock_transfers_pkey;
ALTER TABLE IF EXISTS ONLY public.stock_transfer_items DROP CONSTRAINT IF EXISTS stock_transfer_items_pkey;
ALTER TABLE IF EXISTS ONLY public.stock_transactions DROP CONSTRAINT IF EXISTS stock_transactions_pkey;
ALTER TABLE IF EXISTS ONLY public.stock_receipts DROP CONSTRAINT IF EXISTS stock_receipts_pkey;
ALTER TABLE IF EXISTS ONLY public.stock_receipt_items DROP CONSTRAINT IF EXISTS stock_receipt_items_pkey;
ALTER TABLE IF EXISTS ONLY public.shifts DROP CONSTRAINT IF EXISTS shifts_pkey;
ALTER TABLE IF EXISTS ONLY public.shift_swaps DROP CONSTRAINT IF EXISTS shift_swaps_pkey;
ALTER TABLE IF EXISTS ONLY public.shift_registrations DROP CONSTRAINT IF EXISTS shift_registrations_pkey;
ALTER TABLE IF EXISTS ONLY public.shift_assignments DROP CONSTRAINT IF EXISTS shift_assignments_pkey;
ALTER TABLE IF EXISTS ONLY public.salary_profiles DROP CONSTRAINT IF EXISTS salary_profiles_pkey;
ALTER TABLE IF EXISTS ONLY public.salary_components DROP CONSTRAINT IF EXISTS salary_components_pkey;
ALTER TABLE IF EXISTS ONLY public.roles DROP CONSTRAINT IF EXISTS roles_pkey;
ALTER TABLE IF EXISTS ONLY public.role_permissions DROP CONSTRAINT IF EXISTS role_permissions_pkey;
ALTER TABLE IF EXISTS ONLY public.reward_withdrawal_requests DROP CONSTRAINT IF EXISTS reward_withdrawal_requests_pkey;
ALTER TABLE IF EXISTS ONLY public.reviewer_assignments DROP CONSTRAINT IF EXISTS reviewer_assignments_pkey;
ALTER TABLE IF EXISTS ONLY public.report_snapshots DROP CONSTRAINT IF EXISTS report_snapshots_pkey;
ALTER TABLE IF EXISTS ONLY public.regions DROP CONSTRAINT IF EXISTS regions_pkey;
ALTER TABLE IF EXISTS ONLY public.refresh_sessions DROP CONSTRAINT IF EXISTS refresh_sessions_pkey;
ALTER TABLE IF EXISTS ONLY public.project_grant_packages DROP CONSTRAINT IF EXISTS project_grant_packages_pkey;
ALTER TABLE IF EXISTS ONLY public.post_likes DROP CONSTRAINT IF EXISTS post_likes_pkey;
ALTER TABLE IF EXISTS ONLY public.post_comments DROP CONSTRAINT IF EXISTS post_comments_pkey;
ALTER TABLE IF EXISTS ONLY public.positions DROP CONSTRAINT IF EXISTS positions_pkey;
ALTER TABLE IF EXISTS ONLY public.permissions DROP CONSTRAINT IF EXISTS permissions_pkey;
ALTER TABLE IF EXISTS ONLY public.performance_reviews DROP CONSTRAINT IF EXISTS performance_reviews_pkey;
ALTER TABLE IF EXISTS ONLY public.performance_review_cycles DROP CONSTRAINT IF EXISTS performance_review_cycles_pkey;
ALTER TABLE IF EXISTS ONLY public.payrolls DROP CONSTRAINT IF EXISTS payrolls_pkey;
ALTER TABLE IF EXISTS ONLY public.payroll_periods DROP CONSTRAINT IF EXISTS payroll_periods_pkey;
ALTER TABLE IF EXISTS ONLY public.payroll_items DROP CONSTRAINT IF EXISTS payroll_items_pkey;
ALTER TABLE IF EXISTS ONLY public.payroll_calculation_snapshots DROP CONSTRAINT IF EXISTS payroll_calculation_snapshots_pkey;
ALTER TABLE IF EXISTS ONLY public.overtime_requests DROP CONSTRAINT IF EXISTS overtime_requests_pkey;
ALTER TABLE IF EXISTS ONLY public.overtime_rate_rules DROP CONSTRAINT IF EXISTS overtime_rate_rules_pkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_pkey;
ALTER TABLE IF EXISTS ONLY public.notification_targets DROP CONSTRAINT IF EXISTS notification_targets_pkey;
ALTER TABLE IF EXISTS ONLY public.notification_deliveries DROP CONSTRAINT IF EXISTS notification_deliveries_pkey;
ALTER TABLE IF EXISTS ONLY public.newsfeed_posts DROP CONSTRAINT IF EXISTS newsfeed_posts_pkey;
ALTER TABLE IF EXISTS ONLY public.monthly_competition_reviews DROP CONSTRAINT IF EXISTS monthly_competition_reviews_pkey;
ALTER TABLE IF EXISTS ONLY public.materials DROP CONSTRAINT IF EXISTS materials_pkey;
ALTER TABLE IF EXISTS ONLY public.material_returns DROP CONSTRAINT IF EXISTS material_returns_pkey;
ALTER TABLE IF EXISTS ONLY public.material_return_items DROP CONSTRAINT IF EXISTS material_return_items_pkey;
ALTER TABLE IF EXISTS ONLY public.material_issues DROP CONSTRAINT IF EXISTS material_issues_pkey;
ALTER TABLE IF EXISTS ONLY public.material_issue_items DROP CONSTRAINT IF EXISTS material_issue_items_pkey;
ALTER TABLE IF EXISTS ONLY public.material_categories DROP CONSTRAINT IF EXISTS material_categories_pkey;
ALTER TABLE IF EXISTS ONLY public.location_trackings DROP CONSTRAINT IF EXISTS location_trackings_pkey;
ALTER TABLE IF EXISTS ONLY public.level_promotion_requests DROP CONSTRAINT IF EXISTS level_promotion_requests_pkey;
ALTER TABLE IF EXISTS ONLY public.leave_types DROP CONSTRAINT IF EXISTS leave_types_pkey;
ALTER TABLE IF EXISTS ONLY public.leave_requests DROP CONSTRAINT IF EXISTS leave_requests_pkey;
ALTER TABLE IF EXISTS ONLY public.leave_balances DROP CONSTRAINT IF EXISTS leave_balances_pkey;
ALTER TABLE IF EXISTS ONLY public.kpi_templates DROP CONSTRAINT IF EXISTS kpi_templates_pkey;
ALTER TABLE IF EXISTS ONLY public.kpi_criteria DROP CONSTRAINT IF EXISTS kpi_criteria_pkey;
ALTER TABLE IF EXISTS ONLY public.job_execution_logs DROP CONSTRAINT IF EXISTS job_execution_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.inventory_checks DROP CONSTRAINT IF EXISTS inventory_checks_pkey;
ALTER TABLE IF EXISTS ONLY public.inventory_check_items DROP CONSTRAINT IF EXISTS inventory_check_items_pkey;
ALTER TABLE IF EXISTS ONLY public.grant_milestones DROP CONSTRAINT IF EXISTS grant_milestones_pkey;
ALTER TABLE IF EXISTS ONLY public.feedbacks DROP CONSTRAINT IF EXISTS feedbacks_pkey;
ALTER TABLE IF EXISTS ONLY public.face_registration_images DROP CONSTRAINT IF EXISTS face_registration_images_pkey;
ALTER TABLE IF EXISTS ONLY public.face_profiles DROP CONSTRAINT IF EXISTS face_profiles_pkey;
ALTER TABLE IF EXISTS ONLY public.employee_salary_components DROP CONSTRAINT IF EXISTS employee_salary_components_pkey;
ALTER TABLE IF EXISTS ONLY public.employee_requests DROP CONSTRAINT IF EXISTS employee_requests_pkey;
ALTER TABLE IF EXISTS ONLY public.employee_profiles DROP CONSTRAINT IF EXISTS employee_profiles_pkey;
ALTER TABLE IF EXISTS ONLY public.employee_levels DROP CONSTRAINT IF EXISTS employee_levels_pkey;
ALTER TABLE IF EXISTS ONLY public.employee_kpi_results DROP CONSTRAINT IF EXISTS employee_kpi_results_pkey;
ALTER TABLE IF EXISTS ONLY public.employee_kpi_assignments DROP CONSTRAINT IF EXISTS employee_kpi_assignments_pkey;
ALTER TABLE IF EXISTS ONLY public.employee_documents DROP CONSTRAINT IF EXISTS employee_documents_pkey;
ALTER TABLE IF EXISTS ONLY public.employee_deductions DROP CONSTRAINT IF EXISTS employee_deductions_pkey;
ALTER TABLE IF EXISTS ONLY public.employee_contracts DROP CONSTRAINT IF EXISTS employee_contracts_pkey;
ALTER TABLE IF EXISTS ONLY public.employee_bonuses DROP CONSTRAINT IF EXISTS employee_bonuses_pkey;
ALTER TABLE IF EXISTS ONLY public.employee_bank_accounts DROP CONSTRAINT IF EXISTS employee_bank_accounts_pkey;
ALTER TABLE IF EXISTS ONLY public.document_types DROP CONSTRAINT IF EXISTS document_types_pkey;
ALTER TABLE IF EXISTS ONLY public.disciplinary_actions DROP CONSTRAINT IF EXISTS disciplinary_actions_pkey;
ALTER TABLE IF EXISTS ONLY public.device_tokens DROP CONSTRAINT IF EXISTS device_tokens_pkey;
ALTER TABLE IF EXISTS ONLY public.departments DROP CONSTRAINT IF EXISTS departments_pkey;
ALTER TABLE IF EXISTS ONLY public.department_overtime_configs DROP CONSTRAINT IF EXISTS department_overtime_configs_pkey;
ALTER TABLE IF EXISTS ONLY public.department_members DROP CONSTRAINT IF EXISTS department_members_pkey;
ALTER TABLE IF EXISTS ONLY public.department_level_configs DROP CONSTRAINT IF EXISTS department_level_configs_pkey;
ALTER TABLE IF EXISTS ONLY public.department_documents DROP CONSTRAINT IF EXISTS department_documents_pkey;
ALTER TABLE IF EXISTS ONLY public.department_competition_configs DROP CONSTRAINT IF EXISTS department_competition_configs_pkey;
ALTER TABLE IF EXISTS ONLY public.cross_department_requests DROP CONSTRAINT IF EXISTS cross_department_requests_pkey;
ALTER TABLE IF EXISTS ONLY public.contract_templates DROP CONSTRAINT IF EXISTS contract_templates_pkey;
ALTER TABLE IF EXISTS ONLY public.contract_template_versions DROP CONSTRAINT IF EXISTS contract_template_versions_pkey;
ALTER TABLE IF EXISTS ONLY public.contract_signatures DROP CONSTRAINT IF EXISTS contract_signatures_pkey;
ALTER TABLE IF EXISTS ONLY public.company_holidays DROP CONSTRAINT IF EXISTS company_holidays_pkey;
ALTER TABLE IF EXISTS ONLY public.companies DROP CONSTRAINT IF EXISTS companies_pkey;
ALTER TABLE IF EXISTS ONLY public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_pkey;
ALTER TABLE IF EXISTS ONLY public.chat_groups DROP CONSTRAINT IF EXISTS chat_groups_pkey;
ALTER TABLE IF EXISTS ONLY public.chat_group_members DROP CONSTRAINT IF EXISTS chat_group_members_pkey;
ALTER TABLE IF EXISTS ONLY public.branches DROP CONSTRAINT IF EXISTS branches_pkey;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.attendance_verifications DROP CONSTRAINT IF EXISTS attendance_verifications_pkey;
ALTER TABLE IF EXISTS ONLY public.attendance_records DROP CONSTRAINT IF EXISTS attendance_records_pkey;
ALTER TABLE IF EXISTS ONLY public.attendance_locations DROP CONSTRAINT IF EXISTS attendance_locations_pkey;
ALTER TABLE IF EXISTS ONLY public.attendance_adjustments DROP CONSTRAINT IF EXISTS attendance_adjustments_pkey;
ALTER TABLE IF EXISTS ONLY public.assets DROP CONSTRAINT IF EXISTS assets_pkey;
ALTER TABLE IF EXISTS ONLY public.asset_maintenance_records DROP CONSTRAINT IF EXISTS asset_maintenance_records_pkey;
ALTER TABLE IF EXISTS ONLY public.asset_incident_reports DROP CONSTRAINT IF EXISTS asset_incident_reports_pkey;
ALTER TABLE IF EXISTS ONLY public.asset_assignments DROP CONSTRAINT IF EXISTS asset_assignments_pkey;
ALTER TABLE IF EXISTS ONLY public.asset_assignment_histories DROP CONSTRAINT IF EXISTS asset_assignment_histories_pkey;
ALTER TABLE IF EXISTS ONLY public.approval_histories DROP CONSTRAINT IF EXISTS approval_histories_pkey;
ALTER TABLE IF EXISTS ONLY public."_AttendanceLocationDepartments" DROP CONSTRAINT IF EXISTS "_AttendanceLocationDepartments_AB_pkey";
ALTER TABLE IF EXISTS ONLY public."OtpToken" DROP CONSTRAINT IF EXISTS "OtpToken_pkey";
DROP TABLE IF EXISTS public.wifi_configs;
DROP TABLE IF EXISTS public.warehouses;
DROP TABLE IF EXISTS public.warehouse_stocks;
DROP SEQUENCE IF EXISTS public.warehouse_code_seq;
DROP TABLE IF EXISTS public.violations;
DROP TABLE IF EXISTS public.vesting_milestones;
DROP TABLE IF EXISTS public.vault_transactions;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.user_roles;
DROP TABLE IF EXISTS public.user_notification_preferences;
DROP SEQUENCE IF EXISTS public.user_code_seq;
DROP TABLE IF EXISTS public.user_approval_requests;
DROP TABLE IF EXISTS public.uploaded_files;
DROP TABLE IF EXISTS public.tiktok_live_sessions;
DROP TABLE IF EXISTS public.tasks;
DROP TABLE IF EXISTS public.task_targets;
DROP TABLE IF EXISTS public.task_status_histories;
DROP TABLE IF EXISTS public.task_groups;
DROP TABLE IF EXISTS public.task_group_members;
DROP TABLE IF EXISTS public.task_extension_requests;
DROP TABLE IF EXISTS public.task_comments;
DROP SEQUENCE IF EXISTS public.task_code_seq;
DROP TABLE IF EXISTS public.task_attachments;
DROP TABLE IF EXISTS public.task_assignments;
DROP TABLE IF EXISTS public.talent_retention_vaults;
DROP TABLE IF EXISTS public.system_settings;
DROP TABLE IF EXISTS public.stock_transfers;
DROP TABLE IF EXISTS public.stock_transfer_items;
DROP SEQUENCE IF EXISTS public.stock_transfer_code_seq;
DROP TABLE IF EXISTS public.stock_transactions;
DROP SEQUENCE IF EXISTS public.stock_transaction_code_seq;
DROP TABLE IF EXISTS public.stock_receipts;
DROP TABLE IF EXISTS public.stock_receipt_items;
DROP SEQUENCE IF EXISTS public.stock_receipt_code_seq;
DROP TABLE IF EXISTS public.shifts;
DROP TABLE IF EXISTS public.shift_swaps;
DROP TABLE IF EXISTS public.shift_registrations;
DROP TABLE IF EXISTS public.shift_assignments;
DROP TABLE IF EXISTS public.salary_profiles;
DROP TABLE IF EXISTS public.salary_components;
DROP TABLE IF EXISTS public.roles;
DROP TABLE IF EXISTS public.role_permissions;
DROP TABLE IF EXISTS public.reward_withdrawal_requests;
DROP TABLE IF EXISTS public.reviewer_assignments;
DROP TABLE IF EXISTS public.report_snapshots;
DROP TABLE IF EXISTS public.regions;
DROP TABLE IF EXISTS public.refresh_sessions;
DROP TABLE IF EXISTS public.project_grant_packages;
DROP TABLE IF EXISTS public.post_likes;
DROP TABLE IF EXISTS public.post_comments;
DROP TABLE IF EXISTS public.positions;
DROP TABLE IF EXISTS public.permissions;
DROP TABLE IF EXISTS public.performance_reviews;
DROP TABLE IF EXISTS public.performance_review_cycles;
DROP TABLE IF EXISTS public.payrolls;
DROP TABLE IF EXISTS public.payroll_periods;
DROP SEQUENCE IF EXISTS public.payroll_period_code_seq;
DROP TABLE IF EXISTS public.payroll_items;
DROP TABLE IF EXISTS public.payroll_calculation_snapshots;
DROP TABLE IF EXISTS public.overtime_requests;
DROP TABLE IF EXISTS public.overtime_rate_rules;
DROP TABLE IF EXISTS public.notifications;
DROP TABLE IF EXISTS public.notification_targets;
DROP TABLE IF EXISTS public.notification_deliveries;
DROP TABLE IF EXISTS public.newsfeed_posts;
DROP TABLE IF EXISTS public.monthly_competition_reviews;
DROP TABLE IF EXISTS public.materials;
DROP TABLE IF EXISTS public.material_returns;
DROP TABLE IF EXISTS public.material_return_items;
DROP SEQUENCE IF EXISTS public.material_return_code_seq;
DROP TABLE IF EXISTS public.material_issues;
DROP TABLE IF EXISTS public.material_issue_items;
DROP SEQUENCE IF EXISTS public.material_issue_code_seq;
DROP SEQUENCE IF EXISTS public.material_code_seq;
DROP TABLE IF EXISTS public.material_categories;
DROP TABLE IF EXISTS public.location_trackings;
DROP TABLE IF EXISTS public.level_promotion_requests;
DROP TABLE IF EXISTS public.leave_types;
DROP TABLE IF EXISTS public.leave_requests;
DROP TABLE IF EXISTS public.leave_balances;
DROP TABLE IF EXISTS public.kpi_templates;
DROP TABLE IF EXISTS public.kpi_criteria;
DROP TABLE IF EXISTS public.job_execution_logs;
DROP TABLE IF EXISTS public.inventory_checks;
DROP TABLE IF EXISTS public.inventory_check_items;
DROP SEQUENCE IF EXISTS public.inventory_check_code_seq;
DROP TABLE IF EXISTS public.grant_milestones;
DROP TABLE IF EXISTS public.feedbacks;
DROP TABLE IF EXISTS public.face_registration_images;
DROP TABLE IF EXISTS public.face_profiles;
DROP TABLE IF EXISTS public.employee_salary_components;
DROP TABLE IF EXISTS public.employee_requests;
DROP TABLE IF EXISTS public.employee_profiles;
DROP TABLE IF EXISTS public.employee_levels;
DROP TABLE IF EXISTS public.employee_kpi_results;
DROP TABLE IF EXISTS public.employee_kpi_assignments;
DROP TABLE IF EXISTS public.employee_documents;
DROP TABLE IF EXISTS public.employee_deductions;
DROP TABLE IF EXISTS public.employee_contracts;
DROP TABLE IF EXISTS public.employee_bonuses;
DROP TABLE IF EXISTS public.employee_bank_accounts;
DROP TABLE IF EXISTS public.document_types;
DROP TABLE IF EXISTS public.disciplinary_actions;
DROP TABLE IF EXISTS public.device_tokens;
DROP TABLE IF EXISTS public.departments;
DROP TABLE IF EXISTS public.department_overtime_configs;
DROP TABLE IF EXISTS public.department_members;
DROP TABLE IF EXISTS public.department_level_configs;
DROP TABLE IF EXISTS public.department_documents;
DROP TABLE IF EXISTS public.department_competition_configs;
DROP TABLE IF EXISTS public.cross_department_requests;
DROP SEQUENCE IF EXISTS public.cross_department_request_code_seq;
DROP TABLE IF EXISTS public.contract_templates;
DROP TABLE IF EXISTS public.contract_template_versions;
DROP TABLE IF EXISTS public.contract_signatures;
DROP SEQUENCE IF EXISTS public.contract_code_seq;
DROP TABLE IF EXISTS public.company_holidays;
DROP TABLE IF EXISTS public.companies;
DROP TABLE IF EXISTS public.chat_messages;
DROP TABLE IF EXISTS public.chat_groups;
DROP TABLE IF EXISTS public.chat_group_members;
DROP TABLE IF EXISTS public.branches;
DROP TABLE IF EXISTS public.audit_logs;
DROP TABLE IF EXISTS public.attendance_verifications;
DROP TABLE IF EXISTS public.attendance_records;
DROP TABLE IF EXISTS public.attendance_locations;
DROP TABLE IF EXISTS public.attendance_adjustments;
DROP TABLE IF EXISTS public.assets;
DROP TABLE IF EXISTS public.asset_maintenance_records;
DROP TABLE IF EXISTS public.asset_incident_reports;
DROP SEQUENCE IF EXISTS public.asset_code_seq;
DROP TABLE IF EXISTS public.asset_assignments;
DROP TABLE IF EXISTS public.asset_assignment_histories;
DROP TABLE IF EXISTS public.approval_histories;
DROP TABLE IF EXISTS public."_AttendanceLocationDepartments";
DROP TABLE IF EXISTS public."OtpToken";
DROP TYPE IF EXISTS public."WithdrawalRequestStatus";
DROP TYPE IF EXISTS public."ViolationStatus";
DROP TYPE IF EXISTS public."VestingSchedule";
DROP TYPE IF EXISTS public."VaultTransactionType";
DROP TYPE IF EXISTS public."UploadedFileStatus";
DROP TYPE IF EXISTS public."UploadPurpose";
DROP TYPE IF EXISTS public."TaskType";
DROP TYPE IF EXISTS public."TaskTargetType";
DROP TYPE IF EXISTS public."TaskStatus";
DROP TYPE IF EXISTS public."TaskPriority";
DROP TYPE IF EXISTS public."TaskHistoryAction";
DROP TYPE IF EXISTS public."TaskExtensionRequestStatus";
DROP TYPE IF EXISTS public."TaskAttachmentType";
DROP TYPE IF EXISTS public."TaskAssignmentStatus";
DROP TYPE IF EXISTS public."SystemSettingCategory";
DROP TYPE IF EXISTS public."StockTransferStatus";
DROP TYPE IF EXISTS public."StockTransactionType";
DROP TYPE IF EXISTS public."StockReceiptStatus";
DROP TYPE IF EXISTS public."SignatureType";
DROP TYPE IF EXISTS public."ShiftSwapStatus";
DROP TYPE IF EXISTS public."ShiftRegistrationStatus";
DROP TYPE IF EXISTS public."ShiftAssignmentStatus";
DROP TYPE IF EXISTS public."SalaryType";
DROP TYPE IF EXISTS public."SalaryComponentType";
DROP TYPE IF EXISTS public."SalaryCalculationType";
DROP TYPE IF EXISTS public."RoleScopeType";
DROP TYPE IF EXISTS public."RewardType";
DROP TYPE IF EXISTS public."ReviewerType";
DROP TYPE IF EXISTS public."ReportSnapshotType";
DROP TYPE IF EXISTS public."PromotionRequestStatus";
DROP TYPE IF EXISTS public."PerformanceReviewStatus";
DROP TYPE IF EXISTS public."PerformanceReviewCycleStatus";
DROP TYPE IF EXISTS public."PayrollStatus";
DROP TYPE IF EXISTS public."PayrollPeriodStatus";
DROP TYPE IF EXISTS public."PayrollItemType";
DROP TYPE IF EXISTS public."OvertimeType";
DROP TYPE IF EXISTS public."OvertimeRequestStatus";
DROP TYPE IF EXISTS public."NotificationType";
DROP TYPE IF EXISTS public."NotificationDeliveryStatus";
DROP TYPE IF EXISTS public."NewsfeedPostStatus";
DROP TYPE IF EXISTS public."MaterialReturnStatus";
DROP TYPE IF EXISTS public."MaterialIssueTargetType";
DROP TYPE IF EXISTS public."MaterialIssueStatus";
DROP TYPE IF EXISTS public."LeaveRequestStatus";
DROP TYPE IF EXISTS public."KpiScoringMethod";
DROP TYPE IF EXISTS public."KpiPeriodType";
DROP TYPE IF EXISTS public."JobExecutionStatus";
DROP TYPE IF EXISTS public."InventoryCheckStatus";
DROP TYPE IF EXISTS public."Gender";
DROP TYPE IF EXISTS public."FeedbackStatus";
DROP TYPE IF EXISTS public."FaceProfileStatus";
DROP TYPE IF EXISTS public."FacePoseType";
DROP TYPE IF EXISTS public."EmploymentStatus";
DROP TYPE IF EXISTS public."EmployeeRequestType";
DROP TYPE IF EXISTS public."EmployeeRequestStatus";
DROP TYPE IF EXISTS public."EmployeeKpiAssignmentStatus";
DROP TYPE IF EXISTS public."EmployeeDeductionStatus";
DROP TYPE IF EXISTS public."EmployeeBonusStatus";
DROP TYPE IF EXISTS public."DocumentStatus";
DROP TYPE IF EXISTS public."DisciplinaryActionType";
DROP TYPE IF EXISTS public."DisciplinaryActionStatus";
DROP TYPE IF EXISTS public."DevicePlatform";
DROP TYPE IF EXISTS public."CrossDepartmentRequestStatus";
DROP TYPE IF EXISTS public."ContractType";
DROP TYPE IF EXISTS public."ContractStatus";
DROP TYPE IF EXISTS public."ContractSignerRole";
DROP TYPE IF EXISTS public."CompetitionReviewStatus";
DROP TYPE IF EXISTS public."ChatGroupType";
DROP TYPE IF EXISTS public."AttendanceVerificationType";
DROP TYPE IF EXISTS public."AttendanceStatus";
DROP TYPE IF EXISTS public."AttendanceAdjustmentStatus";
DROP TYPE IF EXISTS public."AssetStatus";
DROP TYPE IF EXISTS public."AssetMaintenanceStatus";
DROP TYPE IF EXISTS public."AssetIncidentType";
DROP TYPE IF EXISTS public."AssetIncidentStatus";
DROP TYPE IF EXISTS public."AssetConditionStatus";
DROP TYPE IF EXISTS public."AssetAssignmentStatus";
DROP TYPE IF EXISTS public."AssetAssignmentAction";
DROP TYPE IF EXISTS public."ApprovalStatus";
DROP TYPE IF EXISTS public."ApprovalAction";
DROP TYPE IF EXISTS public."AcknowledgementStatus";
DROP TYPE IF EXISTS public."AccountStatus";
-- *not* dropping schema, since initdb creates it
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: AccountStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AccountStatus" AS ENUM (
    'PENDING',
    'ACTIVE',
    'SUSPENDED',
    'RESIGNED',
    'TERMINATED',
    'PENDING_DELETION',
    'DEACTIVATED_30_DAYS'
);


--
-- Name: AcknowledgementStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AcknowledgementStatus" AS ENUM (
    'PENDING',
    'AGREED',
    'DISAGREED'
);


--
-- Name: ApprovalAction; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ApprovalAction" AS ENUM (
    'CREATED',
    'APPROVED',
    'REJECTED',
    'CANCELLED'
);


--
-- Name: ApprovalStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ApprovalStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


--
-- Name: AssetAssignmentAction; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AssetAssignmentAction" AS ENUM (
    'CREATED',
    'CONFIRMED',
    'RETURN_REQUESTED',
    'RETURNED',
    'CANCELLED'
);


--
-- Name: AssetAssignmentStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AssetAssignmentStatus" AS ENUM (
    'PENDING_CONFIRMATION',
    'ACTIVE',
    'RETURN_REQUESTED',
    'RETURNED',
    'CANCELLED'
);


--
-- Name: AssetConditionStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AssetConditionStatus" AS ENUM (
    'NEW',
    'GOOD',
    'FAIR',
    'POOR',
    'DAMAGED'
);


--
-- Name: AssetIncidentStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AssetIncidentStatus" AS ENUM (
    'OPEN',
    'INVESTIGATING',
    'RESOLVED',
    'REJECTED'
);


--
-- Name: AssetIncidentType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AssetIncidentType" AS ENUM (
    'DAMAGED',
    'LOST',
    'STOLEN',
    'MALFUNCTION',
    'OTHER'
);


--
-- Name: AssetMaintenanceStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AssetMaintenanceStatus" AS ENUM (
    'PLANNED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
);


--
-- Name: AssetStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AssetStatus" AS ENUM (
    'IN_STOCK',
    'OUT_OF_STOCK',
    'ASSIGNED',
    'IN_USE',
    'MAINTENANCE',
    'LOST',
    'DAMAGED',
    'DISPOSED',
    'TRANSFER_PENDING'
);


--
-- Name: AttendanceAdjustmentStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AttendanceAdjustmentStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


--
-- Name: AttendanceStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AttendanceStatus" AS ENUM (
    'CHECKED_IN',
    'CHECKED_OUT',
    'MISSING',
    'ADJUSTED'
);


--
-- Name: AttendanceVerificationType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AttendanceVerificationType" AS ENUM (
    'FACE',
    'GPS',
    'WIFI'
);


--
-- Name: ChatGroupType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ChatGroupType" AS ENUM (
    'DEPARTMENT',
    'TASK',
    'DIRECT',
    'CUSTOM'
);


--
-- Name: CompetitionReviewStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."CompetitionReviewStatus" AS ENUM (
    'PENDING_LEADER_REVIEW',
    'LEADER_RECOMMENDED',
    'LEADER_REJECTED',
    'ADMIN_APPROVED_PROMOTION',
    'ADMIN_RETAINED_LEVEL',
    'ADMIN_DEMOTED_LEVEL'
);


--
-- Name: ContractSignerRole; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ContractSignerRole" AS ENUM (
    'EMPLOYEE',
    'COMPANY'
);


--
-- Name: ContractStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ContractStatus" AS ENUM (
    'DRAFT',
    'PENDING_INTERNAL_APPROVAL',
    'APPROVED',
    'WAITING_EMPLOYEE_SIGNATURE',
    'EMPLOYEE_SIGNED',
    'WAITING_COMPANY_SIGNATURE',
    'COMPLETED',
    'ACTIVE',
    'EXPIRED',
    'TERMINATED',
    'CANCELLED',
    'REJECTED'
);


--
-- Name: ContractType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ContractType" AS ENUM (
    'PROBATION',
    'FIXED_TERM',
    'INDEFINITE_TERM',
    'SERVICE',
    'CONFIDENTIALITY',
    'COMMITMENT',
    'OTHER'
);


--
-- Name: CrossDepartmentRequestStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."CrossDepartmentRequestStatus" AS ENUM (
    'PENDING_SOURCE_APPROVAL',
    'SOURCE_APPROVED',
    'SOURCE_REJECTED',
    'TARGET_ASSIGNED',
    'TARGET_ACCEPTED',
    'TARGET_REJECTED',
    'IN_PROGRESS',
    'SUBMITTED_FOR_REVIEW',
    'REVISION_REQUESTED',
    'COMPLETED',
    'CANCELLED'
);


--
-- Name: DevicePlatform; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."DevicePlatform" AS ENUM (
    'IOS',
    'ANDROID',
    'WEB'
);


--
-- Name: DisciplinaryActionStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."DisciplinaryActionStatus" AS ENUM (
    'DRAFT',
    'PENDING',
    'APPROVED',
    'REJECTED',
    'CANCELLED'
);


--
-- Name: DisciplinaryActionType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."DisciplinaryActionType" AS ENUM (
    'REMINDER',
    'VERBAL_WARNING',
    'WRITTEN_WARNING',
    'DEDUCTION',
    'SUSPENSION',
    'OTHER'
);


--
-- Name: DocumentStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."DocumentStatus" AS ENUM (
    'DRAFT',
    'PENDING_VERIFICATION',
    'VERIFIED',
    'REJECTED',
    'EXPIRED',
    'REPLACED'
);


--
-- Name: EmployeeBonusStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EmployeeBonusStatus" AS ENUM (
    'DRAFT',
    'PENDING',
    'APPROVED',
    'REJECTED',
    'APPLIED_TO_PAYROLL',
    'CANCELLED'
);


--
-- Name: EmployeeDeductionStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EmployeeDeductionStatus" AS ENUM (
    'DRAFT',
    'PENDING',
    'APPROVED',
    'REJECTED',
    'APPLIED_TO_PAYROLL',
    'CANCELLED'
);


--
-- Name: EmployeeKpiAssignmentStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EmployeeKpiAssignmentStatus" AS ENUM (
    'DRAFT',
    'ACTIVE',
    'SELF_REVIEW',
    'LEADER_REVIEW',
    'FINAL_REVIEW',
    'FINALIZED',
    'CANCELLED'
);


--
-- Name: EmployeeRequestStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EmployeeRequestStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'CANCELLED'
);


--
-- Name: EmployeeRequestType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EmployeeRequestType" AS ENUM (
    'ATTENDANCE_ADJUSTMENT',
    'LEAVE',
    'OVERTIME',
    'SHIFT_REGISTRATION',
    'SHIFT_SWAP',
    'LATE_ARRIVAL',
    'EARLY_LEAVE',
    'BUSINESS_TRIP',
    'ADVANCE',
    'EXPENSE',
    'PURCHASE',
    'EQUIPMENT',
    'ACCOUNT_DELETION',
    'OTHER'
);


--
-- Name: EmploymentStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EmploymentStatus" AS ENUM (
    'PROBATION',
    'OFFICIAL',
    'ON_LEAVE',
    'RESIGNED',
    'TERMINATED'
);


--
-- Name: FacePoseType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."FacePoseType" AS ENUM (
    'FRONT',
    'LEFT',
    'RIGHT'
);


--
-- Name: FaceProfileStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."FaceProfileStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


--
-- Name: FeedbackStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."FeedbackStatus" AS ENUM (
    'SEND',
    'REVIEWED',
    'RESOLVED',
    'REJECTED'
);


--
-- Name: Gender; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Gender" AS ENUM (
    'MALE',
    'FEMALE',
    'OTHER'
);


--
-- Name: InventoryCheckStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."InventoryCheckStatus" AS ENUM (
    'DRAFT',
    'IN_PROGRESS',
    'SUBMITTED',
    'APPROVED',
    'CANCELLED'
);


--
-- Name: JobExecutionStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."JobExecutionStatus" AS ENUM (
    'RUNNING',
    'SUCCESS',
    'PARTIAL_SUCCESS',
    'FAILED'
);


--
-- Name: KpiPeriodType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."KpiPeriodType" AS ENUM (
    'MONTHLY',
    'QUARTERLY',
    'HALF_YEAR',
    'YEARLY',
    'CUSTOM'
);


--
-- Name: KpiScoringMethod; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."KpiScoringMethod" AS ENUM (
    'MANUAL',
    'PERCENTAGE',
    'TARGET_RATIO',
    'BOOLEAN',
    'TASK_BASED',
    'CUSTOM'
);


--
-- Name: LeaveRequestStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."LeaveRequestStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'CANCELLED'
);


--
-- Name: MaterialIssueStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."MaterialIssueStatus" AS ENUM (
    'DRAFT',
    'PENDING',
    'APPROVED',
    'REJECTED',
    'ISSUING',
    'COMPLETED',
    'CANCELLED'
);


--
-- Name: MaterialIssueTargetType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."MaterialIssueTargetType" AS ENUM (
    'USER',
    'DEPARTMENT'
);


--
-- Name: MaterialReturnStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."MaterialReturnStatus" AS ENUM (
    'PENDING',
    'RECEIVED',
    'CANCELLED'
);


--
-- Name: NewsfeedPostStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."NewsfeedPostStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


--
-- Name: NotificationDeliveryStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."NotificationDeliveryStatus" AS ENUM (
    'PENDING',
    'SENT',
    'FAILED'
);


--
-- Name: NotificationType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."NotificationType" AS ENUM (
    'TASK_ASSIGNED',
    'TASK_UPDATED',
    'TASK_COMMENTED',
    'TASK_REVIEW_REQUESTED',
    'TASK_EXTENSION_REQUESTED',
    'CROSS_DEPARTMENT_REQUESTED',
    'NEWSFEED_POST_PENDING',
    'NEWSFEED_POST_APPROVED',
    'NEWSFEED_POST_REJECTED',
    'CROSS_DEPARTMENT_UPDATED',
    'MATERIAL_ISSUE_REQUESTED',
    'MATERIAL_ISSUE_APPROVED',
    'MATERIAL_ISSUED',
    'STOCK_TRANSFER_APPROVED',
    'STOCK_TRANSFER_SHIPPED',
    'STOCK_TRANSFER_RECEIVED',
    'ASSET_ASSIGNED',
    'ASSET_ASSIGNMENT_CONFIRMED',
    'ASSET_RETURN_REQUESTED',
    'ASSET_RETURNED',
    'ASSET_INCIDENT_REPORTED',
    'ASSET_INCIDENT_RESOLVED',
    'PAYROLL_CALCULATED',
    'PAYROLL_REVIEW_REQUIRED',
    'PAYROLL_APPROVED',
    'PAYSLIP_AVAILABLE',
    'BONUS_APPROVED',
    'DEDUCTION_APPROVED',
    'VIOLATION_CONFIRMED',
    'DISCIPLINARY_ACTION_APPROVED',
    'DOCUMENT_EXPIRING',
    'DOCUMENT_VERIFICATION_REQUIRED',
    'DOCUMENT_VERIFIED',
    'DOCUMENT_REJECTED',
    'CONTRACT_APPROVAL_REQUIRED',
    'CONTRACT_APPROVED',
    'CONTRACT_SIGNATURE_REQUIRED',
    'CONTRACT_SIGNED',
    'CONTRACT_EXPIRING',
    'CONTRACT_TERMINATED',
    'KPI_ASSIGNED',
    'KPI_SELF_REVIEW_REQUIRED',
    'KPI_LEADER_REVIEW_REQUIRED',
    'KPI_FINALIZED',
    'PERFORMANCE_REVIEW_OPENED',
    'PERFORMANCE_REVIEW_STAGE_CHANGED',
    'PERFORMANCE_REVIEW_FINALIZED',
    'ACCOUNT_APPROVAL_REQUESTED',
    'SYSTEM',
    'CHAT_MESSAGE',
    'CHAT_MENTION'
);


--
-- Name: OvertimeRequestStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."OvertimeRequestStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'CANCELLED'
);


--
-- Name: OvertimeType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."OvertimeType" AS ENUM (
    'WEEKDAY',
    'WEEKEND',
    'HOLIDAY',
    'NIGHT'
);


--
-- Name: PayrollItemType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PayrollItemType" AS ENUM (
    'EARNING',
    'ALLOWANCE',
    'BONUS',
    'DEDUCTION',
    'TAX',
    'INSURANCE',
    'OTHER'
);


--
-- Name: PayrollPeriodStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PayrollPeriodStatus" AS ENUM (
    'DRAFT',
    'CALCULATING',
    'CALCULATED',
    'UNDER_REVIEW',
    'APPROVED',
    'LOCKED',
    'CANCELLED'
);


--
-- Name: PayrollStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PayrollStatus" AS ENUM (
    'DRAFT',
    'CALCULATED',
    'UNDER_REVIEW',
    'APPROVED',
    'LOCKED',
    'CANCELLED'
);


--
-- Name: PerformanceReviewCycleStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PerformanceReviewCycleStatus" AS ENUM (
    'DRAFT',
    'OPEN',
    'SELF_REVIEW',
    'LEADER_REVIEW',
    'FINAL_REVIEW',
    'CLOSED',
    'CANCELLED'
);


--
-- Name: PerformanceReviewStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PerformanceReviewStatus" AS ENUM (
    'PENDING',
    'SELF_REVIEW',
    'LEADER_REVIEW',
    'FINAL_REVIEW',
    'FINALIZED',
    'CANCELLED'
);


--
-- Name: PromotionRequestStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PromotionRequestStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'SUPPLEMENT_REQUESTED'
);


--
-- Name: ReportSnapshotType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ReportSnapshotType" AS ENUM (
    'PAYROLL_MONTHLY',
    'HR_MONTHLY',
    'KPI_FINALIZED',
    'EXECUTIVE_SUMMARY'
);


--
-- Name: ReviewerType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ReviewerType" AS ENUM (
    'DIRECT_LEADER',
    'SECOND_LEVEL',
    'HR',
    'ADMIN'
);


--
-- Name: RewardType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."RewardType" AS ENUM (
    'CASH',
    'PHYSICAL_ITEM',
    'HYBRID'
);


--
-- Name: RoleScopeType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."RoleScopeType" AS ENUM (
    'GLOBAL',
    'COMPANY',
    'BRANCH',
    'DEPARTMENT',
    'WAREHOUSE',
    'REGION'
);


--
-- Name: SalaryCalculationType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."SalaryCalculationType" AS ENUM (
    'FIXED',
    'PER_DAY',
    'PER_HOUR',
    'PERCENTAGE',
    'FORMULA'
);


--
-- Name: SalaryComponentType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."SalaryComponentType" AS ENUM (
    'EARNING',
    'ALLOWANCE',
    'BONUS',
    'DEDUCTION',
    'TAX',
    'INSURANCE',
    'OTHER'
);


--
-- Name: SalaryType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."SalaryType" AS ENUM (
    'MONTHLY',
    'DAILY',
    'HOURLY'
);


--
-- Name: ShiftAssignmentStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ShiftAssignmentStatus" AS ENUM (
    'ASSIGNED',
    'CANCELLED'
);


--
-- Name: ShiftRegistrationStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ShiftRegistrationStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'CANCELLED'
);


--
-- Name: ShiftSwapStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ShiftSwapStatus" AS ENUM (
    'PENDING',
    'PENDING_TARGET_APPROVAL',
    'PENDING_LEADER_APPROVAL',
    'APPROVED',
    'REJECTED',
    'CANCELLED'
);


--
-- Name: SignatureType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."SignatureType" AS ENUM (
    'DRAWN',
    'UPLOADED',
    'OTP_CONFIRMED',
    'EXTERNAL_PROVIDER'
);


--
-- Name: StockReceiptStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."StockReceiptStatus" AS ENUM (
    'DRAFT',
    'PENDING',
    'APPROVED',
    'CANCELLED'
);


--
-- Name: StockTransactionType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."StockTransactionType" AS ENUM (
    'IMPORT',
    'EXPORT',
    'ISSUE',
    'RETURN',
    'TRANSFER_IN',
    'TRANSFER_OUT',
    'ADJUSTMENT_INCREASE',
    'ADJUSTMENT_DECREASE'
);


--
-- Name: StockTransferStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."StockTransferStatus" AS ENUM (
    'DRAFT',
    'PENDING',
    'APPROVED',
    'SHIPPED',
    'IN_TRANSIT',
    'COMPLETED',
    'CANCELLED'
);


--
-- Name: SystemSettingCategory; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."SystemSettingCategory" AS ENUM (
    'GENERAL',
    'ATTENDANCE',
    'TASK',
    'PAYROLL',
    'NOTIFICATION',
    'SECURITY',
    'CONTRACT',
    'KPI'
);


--
-- Name: TaskAssignmentStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TaskAssignmentStatus" AS ENUM (
    'NEW',
    'ACCEPTED',
    'IN_PROGRESS',
    'WAITING_REVIEW',
    'COMPLETED',
    'REJECTED',
    'CANCELLED'
);


--
-- Name: TaskAttachmentType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TaskAttachmentType" AS ENUM (
    'FILE',
    'IMAGE',
    'VIDEO',
    'OTHER'
);


--
-- Name: TaskExtensionRequestStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TaskExtensionRequestStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'CANCELLED'
);


--
-- Name: TaskHistoryAction; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TaskHistoryAction" AS ENUM (
    'CREATED',
    'ASSIGNED',
    'ACCEPTED',
    'STARTED',
    'PROGRESS_UPDATED',
    'SUBMITTED',
    'APPROVED',
    'REJECTED',
    'CANCELLED',
    'COMMENTED',
    'ATTACHED',
    'EXTENSION_REQUESTED',
    'EXTENSION_APPROVED',
    'EXTENSION_REJECTED'
);


--
-- Name: TaskPriority; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TaskPriority" AS ENUM (
    'LOW',
    'NORMAL',
    'HIGH',
    'URGENT'
);


--
-- Name: TaskStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TaskStatus" AS ENUM (
    'DRAFT',
    'NEW',
    'ACCEPTED',
    'IN_PROGRESS',
    'WAITING_REVIEW',
    'COMPLETED',
    'REJECTED',
    'CANCELLED'
);


--
-- Name: TaskTargetType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TaskTargetType" AS ENUM (
    'USER',
    'DEPARTMENT',
    'GROUP'
);


--
-- Name: TaskType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TaskType" AS ENUM (
    'INDIVIDUAL',
    'DEPARTMENT',
    'GROUP',
    'CROSS_DEPARTMENT'
);


--
-- Name: UploadPurpose; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."UploadPurpose" AS ENUM (
    'FACE_REGISTRATION',
    'ATTENDANCE',
    'TASK_ATTACHMENT',
    'EMPLOYEE_DOCUMENT',
    'CONTRACT_TEMPLATE',
    'SIGNATURE',
    'KPI_EVIDENCE',
    'ASSET_INCIDENT'
);


--
-- Name: UploadedFileStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."UploadedFileStatus" AS ENUM (
    'TEMPORARY',
    'ATTACHED',
    'DELETED'
);


--
-- Name: VaultTransactionType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."VaultTransactionType" AS ENUM (
    'GRANT_ANNUAL',
    'GRANT_PROJECT_INSTANT',
    'GRANT_PROJECT_VESTING',
    'WITHDRAW_REGULAR',
    'WITHDRAW_ADVANCE',
    'REFUND_WITHDRAWAL'
);


--
-- Name: VestingSchedule; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."VestingSchedule" AS ENUM (
    'QUARTERLY',
    'BI_ANNUALLY'
);


--
-- Name: ViolationStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ViolationStatus" AS ENUM (
    'DRAFT',
    'PENDING_REVIEW',
    'CONFIRMED',
    'REJECTED',
    'CLOSED'
);


--
-- Name: WithdrawalRequestStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."WithdrawalRequestStatus" AS ENUM (
    'PENDING_ADMIN',
    'PENDING_ACCOUNTANT',
    'PAID',
    'REJECTED'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: OtpToken; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."OtpToken" (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    phone text,
    email text,
    "otpHash" text NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "isUsed" boolean DEFAULT false NOT NULL,
    "resetToken" text,
    "resetExpireAt" timestamp(3) without time zone,
    "ipAddress" text,
    "userAgent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: _AttendanceLocationDepartments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."_AttendanceLocationDepartments" (
    "A" uuid NOT NULL,
    "B" uuid NOT NULL
);


--
-- Name: approval_histories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.approval_histories (
    id uuid NOT NULL,
    "approvalRequestId" uuid NOT NULL,
    "actorUserId" uuid,
    action public."ApprovalAction" NOT NULL,
    note text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: asset_assignment_histories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.asset_assignment_histories (
    id uuid NOT NULL,
    "assetAssignmentId" uuid NOT NULL,
    action public."AssetAssignmentAction" NOT NULL,
    "performedById" uuid NOT NULL,
    note text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: asset_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.asset_assignments (
    id uuid NOT NULL,
    "assetId" uuid NOT NULL,
    "assignedToUserId" uuid,
    "assignedToDepartmentId" uuid,
    "assignedById" uuid NOT NULL,
    "assignedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expectedReturnAt" timestamp(3) without time zone,
    "returnedAt" timestamp(3) without time zone,
    "conditionWhenAssigned" public."AssetConditionStatus" NOT NULL,
    "conditionWhenReturned" public."AssetConditionStatus",
    status public."AssetAssignmentStatus" DEFAULT 'PENDING_CONFIRMATION'::public."AssetAssignmentStatus" NOT NULL,
    "receiverConfirmedAt" timestamp(3) without time zone,
    note text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: asset_code_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.asset_code_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: asset_incident_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.asset_incident_reports (
    id uuid NOT NULL,
    "assetId" uuid NOT NULL,
    "reportedById" uuid NOT NULL,
    "incidentType" public."AssetIncidentType" NOT NULL,
    description text NOT NULL,
    "evidenceUrl" text,
    status public."AssetIncidentStatus" DEFAULT 'OPEN'::public."AssetIncidentStatus" NOT NULL,
    "resolvedById" uuid,
    "resolvedAt" timestamp(3) without time zone,
    "resolutionNote" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: asset_maintenance_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.asset_maintenance_records (
    id uuid NOT NULL,
    "assetId" uuid NOT NULL,
    "maintenanceType" text NOT NULL,
    "vendorName" text,
    description text NOT NULL,
    cost numeric(14,2),
    "startedAt" timestamp(3) without time zone NOT NULL,
    "completedAt" timestamp(3) without time zone,
    status public."AssetMaintenanceStatus" DEFAULT 'IN_PROGRESS'::public."AssetMaintenanceStatus" NOT NULL,
    "createdById" uuid NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assets (
    id uuid NOT NULL,
    "assetCode" text NOT NULL,
    "departmentId" uuid,
    name text NOT NULL,
    brand text,
    model text,
    "conditionStatus" public."AssetConditionStatus" DEFAULT 'GOOD'::public."AssetConditionStatus" NOT NULL,
    "conditionNote" text,
    "assetStatus" public."AssetStatus" DEFAULT 'IN_STOCK'::public."AssetStatus" NOT NULL,
    description text,
    "imageUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "warehouseId" uuid
);


--
-- Name: attendance_adjustments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendance_adjustments (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    "departmentId" uuid NOT NULL,
    "attendanceRecordId" uuid,
    "requestedCheckInAt" timestamp(3) without time zone,
    "requestedCheckOutAt" timestamp(3) without time zone,
    reason text NOT NULL,
    status public."AttendanceAdjustmentStatus" DEFAULT 'PENDING'::public."AttendanceAdjustmentStatus" NOT NULL,
    "decidedByUserId" uuid,
    "decidedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: attendance_locations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendance_locations (
    id uuid NOT NULL,
    "branchId" uuid,
    name text NOT NULL,
    latitude numeric(10,7) NOT NULL,
    longitude numeric(10,7) NOT NULL,
    "radiusMeters" integer DEFAULT 100 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "allowedIps" text[],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


--
-- Name: attendance_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendance_records (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    "departmentId" uuid NOT NULL,
    "shiftAssignmentId" uuid,
    "photoFileId" uuid,
    "checkOutPhotoFileId" uuid,
    "workDate" date NOT NULL,
    "checkInAt" timestamp(3) without time zone NOT NULL,
    "checkOutAt" timestamp(3) without time zone,
    "checkInLatitude" numeric(10,7),
    "checkInLongitude" numeric(10,7),
    "checkOutLatitude" numeric(10,7),
    "checkOutLongitude" numeric(10,7),
    "checkInIp" text,
    "checkOutIp" text,
    "lateMinutes" integer DEFAULT 0,
    "latePenaltyLevel" integer,
    "latePenaltyAmount" numeric(10,2),
    "latePenaltyWorkDays" numeric(5,2),
    notes text,
    "isUnplannedOt" boolean DEFAULT false NOT NULL,
    status public."AttendanceStatus" DEFAULT 'CHECKED_IN'::public."AttendanceStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: attendance_verifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendance_verifications (
    id uuid NOT NULL,
    "attendanceRecordId" uuid NOT NULL,
    type public."AttendanceVerificationType" NOT NULL,
    success boolean NOT NULL,
    score numeric(5,4),
    provider text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid NOT NULL,
    "actorUserId" uuid,
    action text NOT NULL,
    "entityType" text NOT NULL,
    "entityId" text,
    metadata jsonb,
    "ipAddress" text,
    "userAgent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: branches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.branches (
    id uuid NOT NULL,
    "companyId" uuid NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    address text,
    latitude numeric(10,7),
    longitude numeric(10,7),
    "allowedRadius" integer DEFAULT 100,
    "allowedIps" text[],
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "isHeadquarters" boolean DEFAULT false NOT NULL,
    "regionId" uuid
);


--
-- Name: chat_group_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_group_members (
    id uuid NOT NULL,
    "groupId" uuid NOT NULL,
    "userId" uuid NOT NULL,
    "joinedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "clearedAt" timestamp(3) without time zone
);


--
-- Name: chat_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_groups (
    id uuid NOT NULL,
    "departmentId" uuid,
    "taskId" uuid,
    name text,
    type public."ChatGroupType" DEFAULT 'CUSTOM'::public."ChatGroupType" NOT NULL,
    "isArchived" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_messages (
    id uuid NOT NULL,
    "groupId" uuid NOT NULL,
    "senderId" uuid NOT NULL,
    content text,
    "fileUrl" text,
    "fileType" text,
    "fileName" text,
    mentions uuid[],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: companies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.companies (
    id uuid NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


--
-- Name: company_holidays; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.company_holidays (
    id uuid NOT NULL,
    "companyId" uuid NOT NULL,
    date date NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: contract_code_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contract_code_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contract_signatures; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contract_signatures (
    id uuid NOT NULL,
    "contractId" uuid NOT NULL,
    "signerUserId" uuid NOT NULL,
    "signerRole" public."ContractSignerRole" NOT NULL,
    "signatureType" public."SignatureType" NOT NULL,
    "signatureImageUrl" text,
    "signatureDataHash" text,
    "signedDocumentHash" text,
    "ipAddress" text,
    "deviceInfo" text,
    "signedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: contract_template_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contract_template_versions (
    id uuid NOT NULL,
    "contractTemplateId" uuid NOT NULL,
    "versionNumber" integer NOT NULL,
    "templateFileUrl" text NOT NULL,
    "storageKey" text,
    "contentHash" text,
    "mappingConfig" jsonb,
    "createdById" uuid NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: contract_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contract_templates (
    id uuid NOT NULL,
    "companyId" uuid NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    "contractType" public."ContractType" NOT NULL,
    description text,
    "templateFileUrl" text NOT NULL,
    "storageKey" text,
    version integer DEFAULT 1 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdById" uuid NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


--
-- Name: cross_department_request_code_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cross_department_request_code_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cross_department_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cross_department_requests (
    id uuid NOT NULL,
    "requestCode" text NOT NULL,
    "taskId" uuid,
    "createdByUserId" uuid NOT NULL,
    "assignedToUserId" uuid,
    "sourceDepartmentId" uuid NOT NULL,
    "targetDepartmentId" uuid NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    priority public."TaskPriority" DEFAULT 'NORMAL'::public."TaskPriority" NOT NULL,
    "dueAt" timestamp(3) without time zone,
    progress integer DEFAULT 0 NOT NULL,
    status public."CrossDepartmentRequestStatus" DEFAULT 'PENDING_SOURCE_APPROVAL'::public."CrossDepartmentRequestStatus" NOT NULL,
    "decidedByUserId" uuid,
    "decidedAt" timestamp(3) without time zone,
    "rejectionReason" text,
    "resultSummary" text,
    rating integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: department_competition_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.department_competition_configs (
    id uuid NOT NULL,
    "departmentId" uuid NOT NULL,
    "metricName" text NOT NULL,
    "targetValue" numeric(15,2) NOT NULL,
    unit text DEFAULT 'VND'::text NOT NULL,
    period text DEFAULT 'MONTHLY'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: department_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.department_documents (
    id uuid NOT NULL,
    "companyId" uuid NOT NULL,
    "departmentId" uuid,
    title text NOT NULL,
    description text,
    category text DEFAULT 'GENERAL'::text NOT NULL,
    "fileName" text NOT NULL,
    "fileUrl" text NOT NULL,
    "storageKey" text,
    "mimeType" text,
    "fileSize" integer,
    "uploadedById" uuid NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


--
-- Name: department_level_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.department_level_configs (
    id uuid NOT NULL,
    "departmentId" uuid NOT NULL,
    "levelNumber" integer NOT NULL,
    "customLevelName" text NOT NULL,
    "badgeTitle" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: department_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.department_members (
    id uuid NOT NULL,
    "departmentId" uuid NOT NULL,
    "userId" uuid NOT NULL,
    "positionId" uuid,
    "isPrimary" boolean DEFAULT true NOT NULL,
    "joinedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "leftAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: department_overtime_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.department_overtime_configs (
    id uuid NOT NULL,
    "departmentId" uuid NOT NULL,
    "weekdayMultiplier" numeric(6,3) DEFAULT 1.5 NOT NULL,
    "weekendMultiplier" numeric(6,3) DEFAULT 2.0 NOT NULL,
    "holidayMultiplier" numeric(6,3) DEFAULT 3.0 NOT NULL,
    "nightAllowanceAmount" numeric(14,2) DEFAULT 50000 NOT NULL,
    "nightStartHour" integer DEFAULT 21 NOT NULL,
    "lateDeductionAmount" numeric(14,2) DEFAULT 50000 NOT NULL,
    "lateThresholdMinutes" integer DEFAULT 5 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: departments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.departments (
    id uuid NOT NULL,
    "companyId" uuid NOT NULL,
    "branchId" uuid,
    "parentId" uuid,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    "leaderUserId" uuid,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


--
-- Name: device_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.device_tokens (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    "tokenHash" text NOT NULL,
    token text DEFAULT ''::text NOT NULL,
    platform public."DevicePlatform" NOT NULL,
    "deviceId" text,
    "lastSeenAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "revokedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: disciplinary_actions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.disciplinary_actions (
    id uuid NOT NULL,
    "violationId" uuid NOT NULL,
    "actionType" public."DisciplinaryActionType" NOT NULL,
    amount numeric(14,2),
    description text NOT NULL,
    "effectiveDate" date NOT NULL,
    status public."DisciplinaryActionStatus" DEFAULT 'PENDING'::public."DisciplinaryActionStatus" NOT NULL,
    "approvedById" uuid,
    "approvedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: document_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_types (
    id uuid NOT NULL,
    "companyId" uuid NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    "requiresExpiryDate" boolean DEFAULT false NOT NULL,
    "requiresDocumentNumber" boolean DEFAULT false NOT NULL,
    "allowedMimeTypes" jsonb,
    "maxFileSize" integer,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


--
-- Name: employee_bank_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_bank_accounts (
    id uuid NOT NULL,
    "employeeId" uuid NOT NULL,
    "bankName" text NOT NULL,
    "accountNumber" text NOT NULL,
    "accountName" text NOT NULL,
    "isPrimary" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: employee_bonuses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_bonuses (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    "bonusType" text NOT NULL,
    title text NOT NULL,
    description text,
    amount numeric(14,2) NOT NULL,
    "effectiveDate" date NOT NULL,
    status public."EmployeeBonusStatus" DEFAULT 'PENDING'::public."EmployeeBonusStatus" NOT NULL,
    "approvedById" uuid,
    "approvedAt" timestamp(3) without time zone,
    "relatedEntityType" text,
    "relatedEntityId" uuid,
    "createdById" uuid NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: employee_contracts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_contracts (
    id uuid NOT NULL,
    "contractCode" text NOT NULL,
    "userId" uuid NOT NULL,
    "contractTemplateId" uuid NOT NULL,
    "contractTemplateVersionId" uuid NOT NULL,
    "contractType" public."ContractType" NOT NULL,
    title text NOT NULL,
    "startDate" date NOT NULL,
    "endDate" date,
    status public."ContractStatus" DEFAULT 'DRAFT'::public."ContractStatus" NOT NULL,
    "baseSalarySnapshot" jsonb,
    "positionSnapshot" jsonb,
    "departmentSnapshot" jsonb,
    "filledFields" jsonb,
    "draftFileUrl" text,
    "signedFileUrl" text,
    "scannedDocumentUrl" text,
    "employeeSignatureUrl" text,
    "rejectReason" text,
    "createdById" uuid NOT NULL,
    "approvedById" uuid,
    "approvedAt" timestamp(3) without time zone,
    "employeeSignedAt" timestamp(3) without time zone,
    "companySignedAt" timestamp(3) without time zone,
    "effectiveAt" timestamp(3) without time zone,
    "terminatedAt" timestamp(3) without time zone,
    "terminationReason" text,
    "employeeAcknowledgementStatus" public."AcknowledgementStatus" DEFAULT 'PENDING'::public."AcknowledgementStatus" NOT NULL,
    "employeeAcknowledgedAt" timestamp(3) without time zone,
    "employeeAcknowledgementNote" text,
    "employeeAcknowledgedByIp" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: employee_deductions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_deductions (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    "deductionType" text NOT NULL,
    title text NOT NULL,
    description text,
    amount numeric(14,2) NOT NULL,
    "effectiveDate" date NOT NULL,
    status public."EmployeeDeductionStatus" DEFAULT 'PENDING'::public."EmployeeDeductionStatus" NOT NULL,
    "approvedById" uuid,
    "approvedAt" timestamp(3) without time zone,
    "relatedEntityType" text,
    "relatedEntityId" uuid,
    "createdById" uuid NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: employee_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_documents (
    id uuid NOT NULL,
    "employeeId" uuid NOT NULL,
    "userId" uuid,
    "documentTypeId" uuid,
    type text NOT NULL,
    "fileName" text NOT NULL,
    "documentNumber" text,
    title text,
    description text,
    "issueDate" date,
    "expiryDate" date,
    "issuedBy" text,
    "fileUrl" text NOT NULL,
    "storageKey" text,
    "mimeType" text,
    "fileSize" integer,
    status public."DocumentStatus" DEFAULT 'DRAFT'::public."DocumentStatus" NOT NULL,
    "verifiedById" uuid,
    "verifiedAt" timestamp(3) without time zone,
    "rejectionReason" text,
    "acknowledgementStatus" public."AcknowledgementStatus" DEFAULT 'PENDING'::public."AcknowledgementStatus" NOT NULL,
    "acknowledgedAt" timestamp(3) without time zone,
    "acknowledgementNote" text,
    "acknowledgedByIp" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


--
-- Name: employee_kpi_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_kpi_assignments (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    "kpiTemplateId" uuid NOT NULL,
    "periodStart" date NOT NULL,
    "periodEnd" date NOT NULL,
    status public."EmployeeKpiAssignmentStatus" DEFAULT 'DRAFT'::public."EmployeeKpiAssignmentStatus" NOT NULL,
    "assignedById" uuid NOT NULL,
    "assignedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "submittedAt" timestamp(3) without time zone,
    "reviewedAt" timestamp(3) without time zone,
    "finalizedAt" timestamp(3) without time zone,
    "finalScore" numeric(6,2),
    snapshot jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: employee_kpi_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_kpi_results (
    id uuid NOT NULL,
    "employeeKpiAssignmentId" uuid NOT NULL,
    "criteriaId" uuid NOT NULL,
    "targetValue" text,
    "actualValue" text,
    "employeeScore" numeric(6,2),
    "leaderScore" numeric(6,2),
    "finalScore" numeric(6,2),
    "employeeComment" text,
    "leaderComment" text,
    "finalComment" text,
    "evidenceUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: employee_levels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_levels (
    id uuid NOT NULL,
    "levelNumber" integer NOT NULL,
    "levelName" text NOT NULL,
    "colorHex" text DEFAULT '#2563EB'::text NOT NULL,
    "rewardType" public."RewardType" DEFAULT 'CASH'::public."RewardType" NOT NULL,
    "promotionBonusAmount" numeric(15,2) DEFAULT 0 NOT NULL,
    "physicalItemName" text,
    "physicalItemImageUrl" text,
    "retentionMultiplier" numeric(3,2) DEFAULT 1.0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: employee_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_profiles (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    "fullName" text NOT NULL,
    "dateOfBirth" timestamp(3) without time zone,
    gender public."Gender",
    "idCardNumber" text NOT NULL,
    "idCardIssueDate" timestamp(3) without time zone,
    "idCardIssuePlace" text,
    "idCardFrontUrl" text,
    "idCardBackUrl" text,
    "permanentAddress" text,
    "temporaryAddress" text,
    "avatarUrl" text,
    "joinDate" timestamp(3) without time zone,
    "officialDate" timestamp(3) without time zone,
    "employmentStatus" public."EmploymentStatus" DEFAULT 'PROBATION'::public."EmploymentStatus" NOT NULL,
    "emergencyContactName" text,
    "emergencyContactPhone" text,
    "positionId" uuid,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "currentLevelNumber" integer DEFAULT 1 NOT NULL
);


--
-- Name: employee_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_requests (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    "departmentId" uuid NOT NULL,
    type public."EmployeeRequestType" NOT NULL,
    status public."EmployeeRequestStatus" DEFAULT 'PENDING'::public."EmployeeRequestStatus" NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    amount numeric(12,2),
    "attachmentMetadata" jsonb,
    "referenceId" uuid,
    "currentApproverUserId" uuid,
    "decidedByUserId" uuid,
    "decidedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: employee_salary_components; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_salary_components (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    "componentId" uuid NOT NULL,
    amount numeric(14,2) NOT NULL,
    percentage numeric(8,4),
    "effectiveFrom" date NOT NULL,
    "effectiveTo" date,
    "createdById" uuid NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: face_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.face_profiles (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    status public."FaceProfileStatus" DEFAULT 'PENDING'::public."FaceProfileStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: face_registration_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.face_registration_images (
    id uuid NOT NULL,
    "faceProfileId" uuid NOT NULL,
    pose public."FacePoseType" NOT NULL,
    "imageUrl" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: feedbacks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feedbacks (
    id uuid NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    "senderUserId" uuid NOT NULL,
    "isAnonymous" boolean DEFAULT false NOT NULL,
    status public."FeedbackStatus" DEFAULT 'SEND'::public."FeedbackStatus" NOT NULL,
    reason text,
    "reviewedAt" timestamp(3) without time zone,
    img text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


--
-- Name: grant_milestones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.grant_milestones (
    id uuid NOT NULL,
    "packageId" uuid NOT NULL,
    "milestoneIndex" integer NOT NULL,
    title text NOT NULL,
    "unlockDate" timestamp(3) without time zone NOT NULL,
    "pointsToUnlock" integer NOT NULL,
    "cashAmount" numeric(15,2) NOT NULL,
    "withdrawnPoints" integer DEFAULT 0 NOT NULL,
    "isUnlocked" boolean DEFAULT false NOT NULL,
    "isWithdrawn" boolean DEFAULT false NOT NULL,
    "withdrawnAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: inventory_check_code_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inventory_check_code_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inventory_check_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_check_items (
    id uuid NOT NULL,
    "inventoryCheckId" uuid NOT NULL,
    "materialId" uuid,
    "systemQuantity" numeric(14,3),
    "actualQuantity" numeric(14,3),
    "differenceQuantity" numeric(14,3),
    note text
);


--
-- Name: inventory_checks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_checks (
    id uuid NOT NULL,
    "warehouseId" uuid NOT NULL,
    "checkCode" text NOT NULL,
    status public."InventoryCheckStatus" DEFAULT 'IN_PROGRESS'::public."InventoryCheckStatus" NOT NULL,
    "startedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "completedAt" timestamp(3) without time zone,
    "createdById" uuid NOT NULL,
    "approvedById" uuid,
    note text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: job_execution_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.job_execution_logs (
    id uuid NOT NULL,
    "jobName" text NOT NULL,
    "executionKey" text NOT NULL,
    status public."JobExecutionStatus" DEFAULT 'RUNNING'::public."JobExecutionStatus" NOT NULL,
    "startedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "finishedAt" timestamp(3) without time zone,
    "processedCount" integer DEFAULT 0 NOT NULL,
    "successCount" integer DEFAULT 0 NOT NULL,
    "failureCount" integer DEFAULT 0 NOT NULL,
    "errorSummary" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: kpi_criteria; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kpi_criteria (
    id uuid NOT NULL,
    "kpiTemplateId" uuid NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    weight numeric(6,2) NOT NULL,
    "targetValue" text,
    unit text,
    "scoringMethod" public."KpiScoringMethod" DEFAULT 'MANUAL'::public."KpiScoringMethod" NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "isRequired" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: kpi_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kpi_templates (
    id uuid NOT NULL,
    "companyId" uuid NOT NULL,
    "departmentId" uuid,
    "positionId" uuid,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    "periodType" public."KpiPeriodType" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdById" uuid NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


--
-- Name: leave_balances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leave_balances (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    "leaveTypeId" uuid NOT NULL,
    year integer NOT NULL,
    "balanceDays" numeric(6,2) DEFAULT 0 NOT NULL,
    "usedDays" numeric(6,2) DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: leave_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leave_requests (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    "departmentId" uuid NOT NULL,
    "leaveTypeId" uuid NOT NULL,
    "startDate" date NOT NULL,
    "endDate" date NOT NULL,
    "totalDays" numeric(6,2) NOT NULL,
    reason text NOT NULL,
    status public."LeaveRequestStatus" DEFAULT 'PENDING'::public."LeaveRequestStatus" NOT NULL,
    "decidedByUserId" uuid,
    "decidedAt" timestamp(3) without time zone,
    "rejectionReason" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: leave_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leave_types (
    id uuid NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    "annualQuotaDays" numeric(6,2),
    "isPaid" boolean DEFAULT true NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: level_promotion_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.level_promotion_requests (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    "departmentId" uuid NOT NULL,
    "fromLevelNumber" integer DEFAULT 1 NOT NULL,
    "toLevelNumber" integer DEFAULT 2 NOT NULL,
    "submissionNote" text,
    "evidenceImages" jsonb,
    status public."PromotionRequestStatus" DEFAULT 'PENDING'::public."PromotionRequestStatus" NOT NULL,
    "leaderNote" text,
    "decidedByUserId" uuid,
    "decidedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: location_trackings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.location_trackings (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    latitude numeric(10,7) NOT NULL,
    longitude numeric(10,7) NOT NULL,
    "accuracyMeters" integer,
    "recordedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: material_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.material_categories (
    id uuid NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


--
-- Name: material_code_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.material_code_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: material_issue_code_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.material_issue_code_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: material_issue_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.material_issue_items (
    id uuid NOT NULL,
    "materialIssueId" uuid NOT NULL,
    "materialId" uuid NOT NULL,
    "quantityRequested" numeric(14,3) NOT NULL,
    "quantityApproved" numeric(14,3) DEFAULT 0 NOT NULL,
    "quantityIssued" numeric(14,3) DEFAULT 0 NOT NULL,
    note text
);


--
-- Name: material_issues; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.material_issues (
    id uuid NOT NULL,
    "issueCode" text NOT NULL,
    "warehouseId" uuid NOT NULL,
    "issueTargetType" public."MaterialIssueTargetType" NOT NULL,
    "issuedToUserId" uuid,
    "issuedToDepartmentId" uuid,
    status public."MaterialIssueStatus" DEFAULT 'PENDING'::public."MaterialIssueStatus" NOT NULL,
    "requestedById" uuid,
    "approvedById" uuid,
    "issuedById" uuid,
    "issueDate" timestamp(3) without time zone,
    note text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: material_return_code_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.material_return_code_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: material_return_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.material_return_items (
    id uuid NOT NULL,
    "materialReturnId" uuid NOT NULL,
    "materialId" uuid NOT NULL,
    quantity numeric(14,3) NOT NULL,
    "conditionNote" text
);


--
-- Name: material_returns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.material_returns (
    id uuid NOT NULL,
    "returnCode" text NOT NULL,
    "warehouseId" uuid NOT NULL,
    "returnedByUserId" uuid,
    "returnedByDepartmentId" uuid,
    status public."MaterialReturnStatus" DEFAULT 'PENDING'::public."MaterialReturnStatus" NOT NULL,
    "receivedById" uuid,
    "receivedAt" timestamp(3) without time zone,
    note text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: materials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.materials (
    id uuid NOT NULL,
    "categoryId" uuid NOT NULL,
    "materialCode" text NOT NULL,
    name text NOT NULL,
    description text,
    unit text NOT NULL,
    "minimumStock" numeric(14,3) DEFAULT 0 NOT NULL,
    "maximumStock" numeric(14,3),
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


--
-- Name: monthly_competition_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.monthly_competition_reviews (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    "departmentId" uuid NOT NULL,
    period text NOT NULL,
    "actualMetricValue" numeric(15,2),
    "completedTaskRate" numeric(5,2),
    "leaderStatus" public."CompetitionReviewStatus" DEFAULT 'PENDING_LEADER_REVIEW'::public."CompetitionReviewStatus" NOT NULL,
    "leaderNote" text,
    "leaderReviewedAt" timestamp(3) without time zone,
    "adminStatus" public."CompetitionReviewStatus" DEFAULT 'PENDING_LEADER_REVIEW'::public."CompetitionReviewStatus" NOT NULL,
    "fromLevelNumber" integer,
    "toLevelNumber" integer,
    "adminNote" text,
    "adminApprovedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: newsfeed_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.newsfeed_posts (
    id uuid NOT NULL,
    "authorId" uuid NOT NULL,
    "departmentId" uuid,
    title text,
    content text NOT NULL,
    images text[] DEFAULT ARRAY[]::text[],
    attachments text[] DEFAULT ARRAY[]::text[],
    status public."NewsfeedPostStatus" DEFAULT 'APPROVED'::public."NewsfeedPostStatus" NOT NULL,
    "approvedById" uuid,
    "approvedAt" timestamp(3) without time zone,
    "rejectionReason" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: notification_deliveries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_deliveries (
    id uuid NOT NULL,
    "notificationId" uuid NOT NULL,
    "userId" uuid NOT NULL,
    "deviceTokenId" uuid,
    status public."NotificationDeliveryStatus" DEFAULT 'PENDING'::public."NotificationDeliveryStatus" NOT NULL,
    "errorMessage" text,
    "sentAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: notification_targets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_targets (
    id uuid NOT NULL,
    "notificationId" uuid NOT NULL,
    "userId" uuid NOT NULL,
    "readAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid NOT NULL,
    type public."NotificationType" NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    "taskId" uuid,
    "dedupKey" text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: overtime_rate_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.overtime_rate_rules (
    id uuid NOT NULL,
    "companyId" uuid NOT NULL,
    "departmentId" uuid,
    "overtimeType" public."OvertimeType" NOT NULL,
    multiplier numeric(6,3) NOT NULL,
    "effectiveFrom" date NOT NULL,
    "effectiveTo" date,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: overtime_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.overtime_requests (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    "departmentId" uuid NOT NULL,
    "workDate" date NOT NULL,
    "startAt" timestamp(3) without time zone NOT NULL,
    "endAt" timestamp(3) without time zone NOT NULL,
    reason text NOT NULL,
    status public."OvertimeRequestStatus" DEFAULT 'PENDING'::public."OvertimeRequestStatus" NOT NULL,
    "decidedByUserId" uuid,
    "decidedAt" timestamp(3) without time zone,
    "rejectionReason" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: payroll_calculation_snapshots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payroll_calculation_snapshots (
    id uuid NOT NULL,
    "payrollId" uuid NOT NULL,
    "attendanceSummary" jsonb NOT NULL,
    "leaveSummary" jsonb NOT NULL,
    "overtimeSummary" jsonb NOT NULL,
    "salaryProfileSnapshot" jsonb NOT NULL,
    "componentSnapshot" jsonb NOT NULL,
    "bonusSnapshot" jsonb NOT NULL,
    "deductionSnapshot" jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: payroll_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payroll_items (
    id uuid NOT NULL,
    "payrollId" uuid NOT NULL,
    "componentId" uuid,
    "itemCode" text NOT NULL,
    "itemName" text NOT NULL,
    "itemType" public."PayrollItemType" NOT NULL,
    "sourceType" text,
    "sourceId" uuid,
    quantity numeric(14,3),
    rate numeric(14,2),
    amount numeric(14,2) NOT NULL,
    note text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: payroll_period_code_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payroll_period_code_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payroll_periods; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payroll_periods (
    id uuid NOT NULL,
    "periodCode" text NOT NULL,
    "companyId" uuid NOT NULL,
    month integer NOT NULL,
    year integer NOT NULL,
    "startDate" date NOT NULL,
    "endDate" date NOT NULL,
    status public."PayrollPeriodStatus" DEFAULT 'DRAFT'::public."PayrollPeriodStatus" NOT NULL,
    "calculatedAt" timestamp(3) without time zone,
    "reviewedAt" timestamp(3) without time zone,
    "approvedAt" timestamp(3) without time zone,
    "lockedAt" timestamp(3) without time zone,
    "createdById" uuid NOT NULL,
    "reviewedById" uuid,
    "approvedById" uuid,
    "lockedById" uuid,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: payrolls; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payrolls (
    id uuid NOT NULL,
    "payrollPeriodId" uuid NOT NULL,
    "userId" uuid NOT NULL,
    "salaryProfileId" uuid NOT NULL,
    "baseSalary" numeric(14,2) NOT NULL,
    "standardWorkingDays" numeric(6,2) NOT NULL,
    "actualWorkingDays" numeric(6,2) DEFAULT 0 NOT NULL,
    "paidLeaveDays" numeric(6,2) DEFAULT 0 NOT NULL,
    "unpaidLeaveDays" numeric(6,2) DEFAULT 0 NOT NULL,
    "regularWorkedMinutes" integer DEFAULT 0 NOT NULL,
    "overtimeMinutes" integer DEFAULT 0 NOT NULL,
    "overtimeAmount" numeric(14,2) DEFAULT 0 NOT NULL,
    "allowanceAmount" numeric(14,2) DEFAULT 0 NOT NULL,
    "bonusAmount" numeric(14,2) DEFAULT 0 NOT NULL,
    "deductionAmount" numeric(14,2) DEFAULT 0 NOT NULL,
    "insuranceAmount" numeric(14,2) DEFAULT 0 NOT NULL,
    "taxAmount" numeric(14,2) DEFAULT 0 NOT NULL,
    "grossSalary" numeric(14,2) DEFAULT 0 NOT NULL,
    "netSalary" numeric(14,2) DEFAULT 0 NOT NULL,
    "calculationVersion" integer DEFAULT 1 NOT NULL,
    "calculatedAt" timestamp(3) without time zone NOT NULL,
    status public."PayrollStatus" DEFAULT 'CALCULATED'::public."PayrollStatus" NOT NULL,
    "employeeAcknowledgedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: performance_review_cycles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.performance_review_cycles (
    id uuid NOT NULL,
    "companyId" uuid NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    "periodStart" date NOT NULL,
    "periodEnd" date NOT NULL,
    "selfReviewStart" date NOT NULL,
    "selfReviewEnd" date NOT NULL,
    "leaderReviewStart" date NOT NULL,
    "leaderReviewEnd" date NOT NULL,
    "finalReviewStart" date NOT NULL,
    "finalReviewEnd" date NOT NULL,
    status public."PerformanceReviewCycleStatus" DEFAULT 'DRAFT'::public."PerformanceReviewCycleStatus" NOT NULL,
    "createdById" uuid NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: performance_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.performance_reviews (
    id uuid NOT NULL,
    "cycleId" uuid NOT NULL,
    "userId" uuid NOT NULL,
    "reviewerUserId" uuid,
    status public."PerformanceReviewStatus" DEFAULT 'PENDING'::public."PerformanceReviewStatus" NOT NULL,
    "selfSummary" text,
    "leaderSummary" text,
    "finalSummary" text,
    "selfScore" numeric(6,2),
    "leaderScore" numeric(6,2),
    "finalScore" numeric(6,2),
    "submittedAt" timestamp(3) without time zone,
    "reviewedAt" timestamp(3) without time zone,
    "finalizedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    id uuid NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: positions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.positions (
    id uuid NOT NULL,
    "departmentId" uuid,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


--
-- Name: post_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.post_comments (
    id uuid NOT NULL,
    "postId" uuid NOT NULL,
    "authorId" uuid NOT NULL,
    content text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: post_likes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.post_likes (
    id uuid NOT NULL,
    "postId" uuid NOT NULL,
    "userId" uuid NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: project_grant_packages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_grant_packages (
    id uuid NOT NULL,
    "vaultId" uuid NOT NULL,
    "userId" uuid NOT NULL,
    title text NOT NULL,
    "totalPoints" integer DEFAULT 0 NOT NULL,
    "cashValuePerPoint" numeric(10,2) DEFAULT 1000 NOT NULL,
    "startDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "durationMonths" integer DEFAULT 12 NOT NULL,
    "intervalMonths" integer DEFAULT 3 NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    note text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: refresh_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refresh_sessions (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    "tokenHash" text NOT NULL,
    "deviceId" text,
    "userAgent" text,
    "ipAddress" text,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "revokedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: regions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.regions (
    id uuid NOT NULL,
    "companyId" uuid NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


--
-- Name: report_snapshots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.report_snapshots (
    id uuid NOT NULL,
    "reportType" public."ReportSnapshotType" NOT NULL,
    "scopeType" public."RoleScopeType" NOT NULL,
    "scopeId" uuid,
    "periodStart" date NOT NULL,
    "periodEnd" date NOT NULL,
    "parametersJson" jsonb NOT NULL,
    "resultSummaryJson" jsonb NOT NULL,
    "generatedById" uuid NOT NULL,
    "generatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone
);


--
-- Name: reviewer_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviewer_assignments (
    id uuid NOT NULL,
    "reviewCycleId" uuid NOT NULL,
    "employeeUserId" uuid NOT NULL,
    "reviewerUserId" uuid NOT NULL,
    "reviewerType" public."ReviewerType" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: reward_withdrawal_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reward_withdrawal_requests (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    "pointsWithdrawn" integer NOT NULL,
    "cashAmount" numeric(15,2) NOT NULL,
    "bankAccountName" text NOT NULL,
    "bankAccountNumber" text NOT NULL,
    "bankName" text NOT NULL,
    status public."WithdrawalRequestStatus" DEFAULT 'PENDING_ADMIN'::public."WithdrawalRequestStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "accountantConfirmedAt" timestamp(3) without time zone,
    "accountantConfirmedBy" uuid,
    "accountantNote" text,
    "adminApprovedAt" timestamp(3) without time zone,
    "adminApprovedBy" uuid,
    "adminNote" text,
    note text,
    "rejectReason" text,
    "rejectedAt" timestamp(3) without time zone,
    "rejectedBy" uuid,
    "transactionReference" text
);


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    id uuid NOT NULL,
    "roleId" uuid NOT NULL,
    "permissionId" uuid NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id uuid NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    "isSystem" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: salary_components; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.salary_components (
    id uuid NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    "componentType" public."SalaryComponentType" NOT NULL,
    "calculationType" public."SalaryCalculationType" NOT NULL,
    "defaultAmount" numeric(14,2),
    "formulaKey" text,
    taxable boolean DEFAULT false NOT NULL,
    "insuranceApplicable" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: salary_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.salary_profiles (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    "salaryType" public."SalaryType" NOT NULL,
    "baseSalary" numeric(14,2) NOT NULL,
    "standardWorkingDays" numeric(6,2),
    "standardWorkingHours" numeric(6,2),
    "hourlyRate" numeric(14,2),
    "dailyRate" numeric(14,2),
    currency text DEFAULT 'VND'::text NOT NULL,
    "effectiveFrom" date NOT NULL,
    "effectiveTo" date,
    "createdById" uuid NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: shift_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shift_assignments (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    "departmentId" uuid NOT NULL,
    "shiftId" uuid NOT NULL,
    "workDate" date NOT NULL,
    status public."ShiftAssignmentStatus" DEFAULT 'ASSIGNED'::public."ShiftAssignmentStatus" NOT NULL,
    "assignedByUserId" uuid,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: shift_registrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shift_registrations (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    "departmentId" uuid NOT NULL,
    "shiftId" uuid NOT NULL,
    "workDate" date NOT NULL,
    status public."ShiftRegistrationStatus" DEFAULT 'PENDING'::public."ShiftRegistrationStatus" NOT NULL,
    reason text,
    "decidedByUserId" uuid,
    "decidedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: shift_swaps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shift_swaps (
    id uuid NOT NULL,
    "requesterUserId" uuid NOT NULL,
    "targetUserId" uuid NOT NULL,
    "departmentId" uuid NOT NULL,
    "fromShiftId" uuid NOT NULL,
    "toShiftId" uuid NOT NULL,
    "fromDate" date NOT NULL,
    "toDate" date NOT NULL,
    status public."ShiftSwapStatus" DEFAULT 'PENDING'::public."ShiftSwapStatus" NOT NULL,
    reason text,
    "decidedByUserId" uuid,
    "decidedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: shifts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shifts (
    id uuid NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    "startTime" text NOT NULL,
    "endTime" text NOT NULL,
    "breakMinutes" integer DEFAULT 0 NOT NULL,
    "checkInEarlyMinutes" integer DEFAULT 15 NOT NULL,
    "checkInLateMinutes" integer DEFAULT 60 NOT NULL,
    "checkOutEarlyMinutes" integer DEFAULT 0 NOT NULL,
    "checkOutLateMinutes" integer DEFAULT 30 NOT NULL,
    "isNightShift" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


--
-- Name: stock_receipt_code_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.stock_receipt_code_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: stock_receipt_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_receipt_items (
    id uuid NOT NULL,
    "receiptId" uuid NOT NULL,
    "materialId" uuid NOT NULL,
    quantity numeric(14,3) NOT NULL,
    "unitCost" numeric(14,2),
    note text
);


--
-- Name: stock_receipts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_receipts (
    id uuid NOT NULL,
    "receiptCode" text NOT NULL,
    "warehouseId" uuid NOT NULL,
    "supplierName" text,
    "referenceNumber" text,
    "receiptDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status public."StockReceiptStatus" DEFAULT 'PENDING'::public."StockReceiptStatus" NOT NULL,
    note text,
    "createdById" uuid NOT NULL,
    "approvedById" uuid,
    "approvedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: stock_transaction_code_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.stock_transaction_code_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: stock_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_transactions (
    id uuid NOT NULL,
    "transactionCode" text NOT NULL,
    "warehouseId" uuid NOT NULL,
    "materialId" uuid NOT NULL,
    "transactionType" public."StockTransactionType" NOT NULL,
    quantity numeric(14,3) NOT NULL,
    "quantityBefore" numeric(14,3) NOT NULL,
    "quantityAfter" numeric(14,3) NOT NULL,
    "unitCost" numeric(14,2),
    "referenceType" text,
    "referenceId" uuid,
    note text,
    "performedById" uuid NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: stock_transfer_code_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.stock_transfer_code_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: stock_transfer_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_transfer_items (
    id uuid NOT NULL,
    "transferId" uuid NOT NULL,
    "materialId" uuid NOT NULL,
    quantity numeric(14,3) NOT NULL
);


--
-- Name: stock_transfers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_transfers (
    id uuid NOT NULL,
    "transferCode" text NOT NULL,
    "sourceWarehouseId" uuid NOT NULL,
    "targetWarehouseId" uuid NOT NULL,
    status public."StockTransferStatus" DEFAULT 'PENDING'::public."StockTransferStatus" NOT NULL,
    "requestedById" uuid NOT NULL,
    "approvedById" uuid,
    "shippedById" uuid,
    "receivedById" uuid,
    "shippedAt" timestamp(3) without time zone,
    "receivedAt" timestamp(3) without time zone,
    note text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_settings (
    id uuid NOT NULL,
    "companyId" uuid NOT NULL,
    key text NOT NULL,
    "valueJson" jsonb NOT NULL,
    category public."SystemSettingCategory" NOT NULL,
    description text,
    "isSensitive" boolean DEFAULT false NOT NULL,
    "updatedById" uuid NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: talent_retention_vaults; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.talent_retention_vaults (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    year integer DEFAULT 2026 NOT NULL,
    "grantedPoints" integer DEFAULT 0 NOT NULL,
    "cashValuePerPoint" numeric(10,2) DEFAULT 1000 NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "instantBonusPoints" integer DEFAULT 0 NOT NULL
);


--
-- Name: task_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_assignments (
    id uuid NOT NULL,
    "taskId" uuid NOT NULL,
    "userId" uuid NOT NULL,
    "assignedByUserId" uuid NOT NULL,
    "reviewedByUserId" uuid,
    status public."TaskAssignmentStatus" DEFAULT 'NEW'::public."TaskAssignmentStatus" NOT NULL,
    "progressPercent" integer DEFAULT 0 NOT NULL,
    "assignmentDueAt" timestamp(3) without time zone,
    "acceptedAt" timestamp(3) without time zone,
    "startedAt" timestamp(3) without time zone,
    "submittedAt" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    "reviewedAt" timestamp(3) without time zone,
    "reviewNote" text,
    "completionNote" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: task_attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_attachments (
    id uuid NOT NULL,
    "taskId" uuid NOT NULL,
    "uploadedByUserId" uuid NOT NULL,
    type public."TaskAttachmentType" DEFAULT 'FILE'::public."TaskAttachmentType" NOT NULL,
    "fileName" text NOT NULL,
    "fileUrl" text NOT NULL,
    "storageKey" text,
    "mimeType" text,
    "sizeBytes" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: task_code_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.task_code_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: task_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_comments (
    id uuid NOT NULL,
    "taskId" uuid NOT NULL,
    "userId" uuid NOT NULL,
    content text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


--
-- Name: task_extension_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_extension_requests (
    id uuid NOT NULL,
    "taskId" uuid NOT NULL,
    "assignmentId" uuid NOT NULL,
    "requestedByUserId" uuid NOT NULL,
    "decidedByUserId" uuid,
    "currentDueAt" timestamp(3) without time zone,
    "requestedDueAt" timestamp(3) without time zone NOT NULL,
    reason text NOT NULL,
    status public."TaskExtensionRequestStatus" DEFAULT 'PENDING'::public."TaskExtensionRequestStatus" NOT NULL,
    "rejectionReason" text,
    "decidedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: task_group_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_group_members (
    id uuid NOT NULL,
    "groupId" uuid NOT NULL,
    "userId" uuid NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: task_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_groups (
    id uuid NOT NULL,
    "departmentId" uuid NOT NULL,
    name text NOT NULL,
    description text,
    "createdByUserId" uuid NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


--
-- Name: task_status_histories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_status_histories (
    id uuid NOT NULL,
    "taskId" uuid NOT NULL,
    "actorUserId" uuid,
    "assignmentId" uuid,
    action public."TaskHistoryAction" NOT NULL,
    "fromStatus" text,
    "toStatus" text,
    note text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: task_targets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_targets (
    id uuid NOT NULL,
    "taskId" uuid NOT NULL,
    "targetType" public."TaskTargetType" NOT NULL,
    "targetId" uuid NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tasks (
    id uuid NOT NULL,
    "taskCode" text NOT NULL,
    title text NOT NULL,
    description text,
    type public."TaskType" DEFAULT 'INDIVIDUAL'::public."TaskType" NOT NULL,
    priority public."TaskPriority" DEFAULT 'NORMAL'::public."TaskPriority" NOT NULL,
    status public."TaskStatus" DEFAULT 'NEW'::public."TaskStatus" NOT NULL,
    "departmentContextId" uuid,
    "createdByUserId" uuid NOT NULL,
    "groupLeaderId" uuid,
    "parentTaskId" uuid,
    "startAt" timestamp(3) without time zone,
    "dueAt" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    "cancelledAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


--
-- Name: tiktok_live_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tiktok_live_sessions (
    id uuid NOT NULL,
    "sessionTitle" text NOT NULL,
    "streamerId" uuid NOT NULL,
    "departmentId" uuid NOT NULL,
    "totalGmv" numeric(15,2) NOT NULL,
    "totalOrders" integer DEFAULT 0 NOT NULL,
    "peakViewers" integer DEFAULT 0 NOT NULL,
    "totalViews" integer DEFAULT 0 NOT NULL,
    "startTime" timestamp(3) without time zone NOT NULL,
    "endTime" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: uploaded_files; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.uploaded_files (
    id uuid NOT NULL,
    "uploadedById" uuid,
    purpose public."UploadPurpose" NOT NULL,
    "fileName" text NOT NULL,
    "storageKey" text NOT NULL,
    "fileUrl" text NOT NULL,
    "mimeType" text NOT NULL,
    size integer NOT NULL,
    checksum text,
    status public."UploadedFileStatus" DEFAULT 'TEMPORARY'::public."UploadedFileStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


--
-- Name: user_approval_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_approval_requests (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    "requestedDepartmentId" uuid NOT NULL,
    status public."ApprovalStatus" DEFAULT 'PENDING'::public."ApprovalStatus" NOT NULL,
    "rejectionReason" text,
    "decidedByUserId" uuid,
    "decidedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: user_code_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_code_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_notification_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_notification_preferences (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    "notificationType" public."NotificationType" NOT NULL,
    "inAppEnabled" boolean DEFAULT true NOT NULL,
    "pushEnabled" boolean DEFAULT true NOT NULL,
    "emailEnabled" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    "roleId" uuid NOT NULL,
    "scopeType" public."RoleScopeType" DEFAULT 'GLOBAL'::public."RoleScopeType" NOT NULL,
    "scopeId" uuid,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    "userCode" text NOT NULL,
    phone text NOT NULL,
    email text,
    "passwordHash" text NOT NULL,
    "accountStatus" public."AccountStatus" DEFAULT 'PENDING'::public."AccountStatus" NOT NULL,
    "approvalStatus" public."ApprovalStatus" DEFAULT 'PENDING'::public."ApprovalStatus" NOT NULL,
    "isActive" boolean DEFAULT false NOT NULL,
    "lastLoginAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "deletionScheduledAt" timestamp(3) without time zone,
    "isTestAccount" boolean DEFAULT false NOT NULL,
    "isRewardVaultEnabled" boolean DEFAULT false NOT NULL
);


--
-- Name: vault_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vault_transactions (
    id uuid NOT NULL,
    "vaultId" uuid NOT NULL,
    "userId" uuid NOT NULL,
    type public."VaultTransactionType" NOT NULL,
    points integer NOT NULL,
    "cashAmount" numeric(15,2) NOT NULL,
    "quarterTarget" text,
    note text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: vesting_milestones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vesting_milestones (
    id uuid NOT NULL,
    "vaultId" uuid NOT NULL,
    quarter integer NOT NULL,
    "unlockDate" timestamp(3) without time zone NOT NULL,
    "pointsToUnlock" integer NOT NULL,
    "cashAmount" numeric(15,2) NOT NULL,
    "isUnlocked" boolean DEFAULT false NOT NULL,
    "isWithdrawn" boolean DEFAULT false NOT NULL,
    "withdrawnAt" timestamp(3) without time zone
);


--
-- Name: violations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.violations (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    "violationType" text NOT NULL,
    "relatedEntityType" text,
    "relatedEntityId" uuid,
    title text NOT NULL,
    description text NOT NULL,
    "violationDate" date NOT NULL,
    status public."ViolationStatus" DEFAULT 'PENDING_REVIEW'::public."ViolationStatus" NOT NULL,
    "createdById" uuid NOT NULL,
    "confirmedById" uuid,
    "confirmedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: warehouse_code_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.warehouse_code_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: warehouse_stocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.warehouse_stocks (
    id uuid NOT NULL,
    "warehouseId" uuid NOT NULL,
    "materialId" uuid NOT NULL,
    "quantityOnHand" numeric(14,3) DEFAULT 0 NOT NULL,
    "quantityReserved" numeric(14,3) DEFAULT 0 NOT NULL,
    version integer DEFAULT 0 NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: warehouses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.warehouses (
    id uuid NOT NULL,
    "companyId" uuid NOT NULL,
    "branchId" uuid,
    "departmentId" uuid,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    address text,
    "managerUserId" uuid,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


--
-- Name: wifi_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wifi_configs (
    id uuid NOT NULL,
    "departmentId" uuid,
    ssid text NOT NULL,
    bssid text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


--
-- Data for Name: OtpToken; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."OtpToken" (id, "userId", phone, email, "otpHash", attempts, "expiresAt", "isUsed", "resetToken", "resetExpireAt", "ipAddress", "userAgent", "createdAt") FROM stdin;
\.


--
-- Data for Name: _AttendanceLocationDepartments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."_AttendanceLocationDepartments" ("A", "B") FROM stdin;
\.


--
-- Data for Name: approval_histories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.approval_histories (id, "approvalRequestId", "actorUserId", action, note, "createdAt") FROM stdin;
2226e6cc-edcf-4189-ab3f-807567d39c3f	80e135c1-2d9f-48c0-9c96-63d66fbe8f22	\N	CREATED	Người dùng đăng ký tài khoản	2026-08-19 11:03:46.819
bac03446-92d4-469f-9498-639f205bc362	80e135c1-2d9f-48c0-9c96-63d66fbe8f22	49098001-4375-47f0-b36d-c8758d8715ff	APPROVED	Tài khoản được duyệt	2026-08-19 11:29:36.239
a1490d28-4ac8-4fb4-9b89-2bc809d20bc5	bbaba29b-e648-4a8e-a5ce-c9cf8df592a0	\N	CREATED	Người dùng đăng ký tài khoản	2026-08-20 02:08:38.692
6881e0fd-5481-42bf-9cd5-e8f6b0bb6ecb	bbaba29b-e648-4a8e-a5ce-c9cf8df592a0	49098001-4375-47f0-b36d-c8758d8715ff	APPROVED	Tài khoản được duyệt	2026-08-20 02:08:53.016
0e837b3b-09ee-4e1c-bb60-56c3812c5fcd	282602c6-5574-480d-b9ba-c73bc4d47685	\N	CREATED	Người dùng đăng ký tài khoản	2026-08-20 02:34:22.985
a00d1597-f218-4116-9684-cb8a27cf8cc6	282602c6-5574-480d-b9ba-c73bc4d47685	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	APPROVED	Tài khoản được duyệt	2026-08-20 02:34:40.1
197bd283-58d5-4254-a329-7a78805999e7	1476d00f-201b-404b-b975-5a3083cc9759	\N	CREATED	Người dùng đăng ký tài khoản	2026-08-27 16:08:04.1
601b92e4-a2d6-43cb-8f84-c9c2ed94e3e2	45dd6098-cb4e-4fcf-9250-7dcab236566c	\N	CREATED	Người dùng đăng ký tài khoản	2026-08-29 03:07:07.71
4cc6e448-0219-45a9-8aec-a2c25a1973e7	45dd6098-cb4e-4fcf-9250-7dcab236566c	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	APPROVED	Tài khoản được duyệt	2026-08-29 04:54:43.953
0c53da4d-93d7-4e31-b419-31fc770b79e2	470a5b2e-e812-4dfb-af40-be5adad698b7	\N	CREATED	Người dùng đăng ký tài khoản	2026-08-29 08:35:29.222
9d233928-8aa0-4da8-8109-8f3437f8385a	470a5b2e-e812-4dfb-af40-be5adad698b7	49098001-4375-47f0-b36d-c8758d8715ff	APPROVED	Tài khoản được duyệt	2026-08-29 08:36:49.394
7f582526-f0f8-4427-aedc-3280ed0d4260	6c1acc8c-b627-4b10-8cc0-bdeaf0adff2f	\N	CREATED	Người dùng đăng ký tài khoản	2026-08-29 08:37:25.253
97b1a904-8155-436c-98be-ca336c20cfc4	cc209493-51d6-45d8-8eb4-92e32bbe31d9	\N	CREATED	Người dùng đăng ký tài khoản	2026-08-29 08:37:57.223
20a0d4e7-eeb9-49e5-8add-9762d3004557	cc209493-51d6-45d8-8eb4-92e32bbe31d9	49098001-4375-47f0-b36d-c8758d8715ff	APPROVED	Tài khoản được duyệt	2026-08-29 08:38:22.106
63100e2a-ca72-4af4-880d-f2185057ba83	6c1acc8c-b627-4b10-8cc0-bdeaf0adff2f	49098001-4375-47f0-b36d-c8758d8715ff	APPROVED	Tài khoản được duyệt	2026-08-29 08:39:29.057
2cfba2e8-13ac-4d31-865c-16f15de9c32c	7bf38d36-61e9-4d73-a7a1-83b6b8c93169	\N	CREATED	Người dùng đăng ký tài khoản	2026-09-05 07:39:53.54
5c4a08c7-99f3-4dc1-b25a-16c835b5d9a0	91555730-197b-4034-8023-876241f2ed5a	\N	CREATED	Người dùng đăng ký tài khoản	2026-09-05 08:47:55.524
3ca22ea6-901e-44e3-8c89-ee04b8cfc2aa	bbf4a8f4-2257-4077-a346-4e33b0b90e86	\N	CREATED	Người dùng đăng ký tài khoản	2026-09-06 09:15:21.766
fcb19de1-6e33-4023-8d63-fc58311aa8c1	bbf4a8f4-2257-4077-a346-4e33b0b90e86	49098001-4375-47f0-b36d-c8758d8715ff	APPROVED	Tài khoản được duyệt	2026-09-06 09:15:45.899
d4aad339-0561-4c86-9f94-88e9c5a7a051	38c94859-891c-4f1b-b0eb-21f9c5dad3e8	\N	CREATED	Người dùng đăng ký tài khoản	2026-09-06 11:25:24.669
4d2b0774-b362-4033-9c55-4ebe39048382	38c94859-891c-4f1b-b0eb-21f9c5dad3e8	49098001-4375-47f0-b36d-c8758d8715ff	APPROVED	Tài khoản được duyệt	2026-09-06 11:25:48.273
\.


--
-- Data for Name: asset_assignment_histories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.asset_assignment_histories (id, "assetAssignmentId", action, "performedById", note, "createdAt") FROM stdin;
\.


--
-- Data for Name: asset_assignments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.asset_assignments (id, "assetId", "assignedToUserId", "assignedToDepartmentId", "assignedById", "assignedAt", "expectedReturnAt", "returnedAt", "conditionWhenAssigned", "conditionWhenReturned", status, "receiverConfirmedAt", note, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: asset_incident_reports; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.asset_incident_reports (id, "assetId", "reportedById", "incidentType", description, "evidenceUrl", status, "resolvedById", "resolvedAt", "resolutionNote", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: asset_maintenance_records; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.asset_maintenance_records (id, "assetId", "maintenanceType", "vendorName", description, cost, "startedAt", "completedAt", status, "createdById", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: assets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.assets (id, "assetCode", "departmentId", name, brand, model, "conditionStatus", "conditionNote", "assetStatus", description, "imageUrl", "createdAt", "updatedAt", "deletedAt", "warehouseId") FROM stdin;
\.


--
-- Data for Name: attendance_adjustments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.attendance_adjustments (id, "userId", "departmentId", "attendanceRecordId", "requestedCheckInAt", "requestedCheckOutAt", reason, status, "decidedByUserId", "decidedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: attendance_locations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.attendance_locations (id, "branchId", name, latitude, longitude, "radiusMeters", "isActive", "allowedIps", "createdAt", "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: attendance_records; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.attendance_records (id, "userId", "departmentId", "shiftAssignmentId", "photoFileId", "checkOutPhotoFileId", "workDate", "checkInAt", "checkOutAt", "checkInLatitude", "checkInLongitude", "checkOutLatitude", "checkOutLongitude", "checkInIp", "checkOutIp", "lateMinutes", "latePenaltyLevel", "latePenaltyAmount", "latePenaltyWorkDays", notes, "isUnplannedOt", status, "createdAt", "updatedAt") FROM stdin;
322b76fd-ce04-4df0-97e7-8a22ef995756	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	ce40f63f-4133-4f0e-b8b9-c1ab910ef1a1	c383d5ef-0205-4edc-911f-29ea25905f52	a6ac8c64-6594-4b85-be73-4190f0ff8071	2026-08-20	2026-08-20 02:16:04.297	2026-08-20 11:41:02.545	21.0230161	105.8389162	21.0230132	105.8389066	127.0.0.1	127.0.0.1	0	\N	\N	\N	\N	f	CHECKED_OUT	2026-08-20 02:16:07.525	2026-08-20 11:41:05.661
d458d9e8-9c0d-4f17-8045-60180d5e1030	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	15f66d1b-06e0-42c7-9c29-fcb2fb25b3fc	2a1fb528-433b-4794-9f85-27f9c77ad12b	\N	2026-08-21	2026-08-21 01:55:04.403	\N	21.0229957	105.8389540	\N	\N	127.0.0.1	\N	0	\N	50.00	\N	Hệ thống tự động đóng ca (Quên check-out trên 24h), phạt 50	f	MISSING	2026-08-21 01:55:07.645	2026-08-22 02:00:00.361
53de8b71-c564-42bd-aef7-b8678162578d	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	df1c36aa-b7ac-4696-9b2d-74bb87d46bf0	d596f3de-880e-4632-bfee-202b72fcf31a	ac2f2ee4-f0e6-43af-9a6f-751fd7695add	2026-08-22	2026-08-22 02:03:09.703	2026-08-22 11:56:48.989	21.0229989	105.8389492	21.0229818	105.8389477	127.0.0.1	127.0.0.1	0	\N	\N	\N	\N	f	CHECKED_OUT	2026-08-22 02:03:14.05	2026-08-22 11:56:52.092
03b2ed45-0871-489e-92de-cba50d9403cc	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	\N	aae19773-fb69-4ab6-8eb1-d676a562008f	\N	2026-08-24	2026-08-24 02:00:28.949	\N	21.0229824	105.8388502	\N	\N	127.0.0.1	\N	0	\N	50.00	\N	Hệ thống tự động đóng ca (Quên check-out trên 24h), phạt 50	t	MISSING	2026-08-24 02:00:32.784	2026-08-25 02:30:00.406
aa158314-2763-4062-9467-5aef10f24ad6	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	932c8d51-ebeb-4beb-82b7-8d157c8c1ed3	765df136-9870-467d-ac1e-36a2b316fe0b	5af2b6f7-2513-4205-8d8f-89e4f25abd1b	2026-08-25	2026-08-25 01:29:24.575	2026-08-25 11:37:15.264	21.0229803	105.8389520	21.0229942	105.8389412	127.0.0.1	127.0.0.1	0	\N	\N	\N	\N	f	CHECKED_OUT	2026-08-25 01:29:28.273	2026-08-25 11:37:18.193
b529c14b-ab28-46d8-b34c-98beb2f209c6	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	cd65205d-8adf-4415-ace2-bfc9e27e2c9c	e9a6d200-5a35-4029-8f95-f414ef371e55	b8248a48-4fa3-4ef4-a575-a2058c6fcb08	2026-08-26	2026-08-26 01:48:12.144	2026-08-26 15:18:50.619	21.0229827	105.8389616	21.0229544	105.8390279	127.0.0.1	127.0.0.1	0	\N	\N	\N	\N	f	CHECKED_OUT	2026-08-26 01:48:15.627	2026-08-26 15:18:54.427
2489ee90-2f9b-402b-b58f-866abbbdcb77	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	4ff9bf9d-3756-45e7-81b9-aa8ab447382e	966bcc2d-5bc2-43fa-b32f-78a3278edc1d	6f0fac57-7c8d-4980-b6c2-d4e81b8171f7	2026-08-26	2026-08-26 15:18:49.466	2026-08-26 15:19:33.297	21.0229257	105.8387711	21.0229679	105.8388968	127.0.0.1	127.0.0.1	378	4	0.00	0.00	\N	f	CHECKED_OUT	2026-08-26 15:18:54.331	2026-08-26 15:19:37.158
7b1f307a-8958-49d4-a802-bdc20e48d9ac	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	e3139d94-ec03-4cbc-99e6-4a4154595340	b03636ef-9ccc-4d54-9a02-3b8fcee7dd0f	89618409-b904-4158-8193-bc4fbeae03e9	2026-08-27	2026-08-27 08:51:32.084	2026-08-27 11:31:50.999	21.0229465	105.8390215	21.0229984	105.8389468	127.0.0.1	127.0.0.1	0	\N	\N	\N	\N	f	CHECKED_OUT	2026-08-27 08:51:35.694	2026-08-27 11:31:54.311
00aeb7ff-ad56-4568-9bfd-cd26a8215152	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	66404c83-70dd-478e-ad02-a036677a6b7f	c75962cb-ebcd-4000-b158-09110a859b22	\N	2026-08-27	2026-08-27 03:20:19.237	\N	21.0230174	105.8389181	\N	\N	127.0.0.1	\N	0	\N	50.00	\N	Hệ thống tự động đóng ca (Quên check-out trên 24h), phạt 50	f	MISSING	2026-08-27 03:20:23.225	2026-08-28 03:30:00.368
edd20d33-eb8f-4605-ae5a-80b5a3168b47	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	afa1e3c4-0b04-4fdd-9a0d-40f82a4402b2	02805ee0-bd98-45e0-99eb-2f0bab5085c3	1773df83-4368-4d89-9aab-450111ecb9c8	2026-08-28	2026-08-28 01:55:58.135	2026-08-28 11:33:21.897	21.0229720	105.8389758	21.0229789	105.8390078	127.0.0.1	127.0.0.1	0	\N	\N	\N	\N	f	CHECKED_OUT	2026-08-28 01:56:02.864	2026-08-28 11:33:24.911
851f1d87-b2a8-4895-ba0b-c987e5906114	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	45663cb0-9fea-4e5b-9ba4-dd1796519905	31a6359d-e509-4569-ae08-7ae288c7f405	\N	2026-08-29	2026-08-29 01:50:59.302	\N	21.0229736	105.8389595	\N	\N	127.0.0.1	\N	0	\N	50.00	\N	Hệ thống tự động đóng ca (Quên check-out trên 24h), phạt 50	f	MISSING	2026-08-29 01:51:03.325	2026-08-30 02:00:00.42
0f14403b-c767-4fd7-9a59-d6d36fb22e68	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	8a2adb9b-9513-4772-8033-054673b6b8ff	2a7108db-411e-4de0-a1d4-70053df4378a	\N	2026-08-29	2026-08-29 02:07:57.532	\N	21.0229673	105.8388434	\N	\N	127.0.0.1	\N	0	\N	50.00	\N	Hệ thống tự động đóng ca (Quên check-out trên 24h), phạt 50	f	MISSING	2026-08-29 02:08:01.554	2026-08-30 02:30:00.351
d9dcbd34-70fc-4d22-aba8-ef7de15bc7b4	846641e3-667b-4e7f-b505-afdc1d66b54a	15cc071a-269e-44e1-ab43-f2d00144e2d6	\N	9c4017c8-1fc6-4c8e-82b0-c422f43b592f	\N	2026-08-29	2026-08-29 08:45:08.724	\N	21.0229761	105.8389254	\N	\N	127.0.0.1	\N	0	\N	50.00	\N	Hệ thống tự động đóng ca (Quên check-out trên 24h), phạt 50	t	MISSING	2026-08-29 08:45:11.986	2026-08-30 09:00:00.153
\.


--
-- Data for Name: attendance_verifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.attendance_verifications (id, "attendanceRecordId", type, success, score, provider, metadata, "createdAt") FROM stdin;
9662e4ff-3376-4e58-beed-56ac7f864328	322b76fd-ce04-4df0-97e7-8a22ef995756	GPS	t	\N	\N	{"attendanceLocationId": "9534ed51-e2bf-4846-84db-1dcb8936fcfa"}	2026-08-20 02:16:07.525
32892ce8-c962-43a3-8cf8-3131bfb4d9e9	322b76fd-ce04-4df0-97e7-8a22ef995756	FACE	t	\N	mock	{"reason": "Local AI models not loaded.", "photoFileId": "c383d5ef-0205-4edc-911f-29ea25905f52"}	2026-08-20 02:16:07.525
9e40bd83-a58c-4b62-9839-48d6c6904b4c	322b76fd-ce04-4df0-97e7-8a22ef995756	GPS	t	\N	\N	{"attendanceLocationId": "9534ed51-e2bf-4846-84db-1dcb8936fcfa"}	2026-08-20 11:41:05.762
f8ef7180-85d2-4aac-b83a-12a249f7a351	322b76fd-ce04-4df0-97e7-8a22ef995756	FACE	t	\N	mock	{"reason": "Local AI models not loaded.", "photoFileId": "a6ac8c64-6594-4b85-be73-4190f0ff8071"}	2026-08-20 11:41:05.762
ed933bfc-c297-4a2a-8067-41d5176a1c15	d458d9e8-9c0d-4f17-8045-60180d5e1030	GPS	t	\N	\N	{"attendanceLocationId": "9534ed51-e2bf-4846-84db-1dcb8936fcfa"}	2026-08-21 01:55:07.645
089f354e-6365-441c-81da-fb686e8604d6	d458d9e8-9c0d-4f17-8045-60180d5e1030	FACE	t	\N	mock	{"reason": "Local AI models not loaded.", "photoFileId": "2a1fb528-433b-4794-9f85-27f9c77ad12b"}	2026-08-21 01:55:07.645
276c70a2-3aa4-46e7-b5df-e635ac230f6e	53de8b71-c564-42bd-aef7-b8678162578d	GPS	t	\N	\N	{"attendanceLocationId": "9534ed51-e2bf-4846-84db-1dcb8936fcfa"}	2026-08-22 02:03:14.05
252a1081-fa6f-480c-a4da-cb14c6ddb517	53de8b71-c564-42bd-aef7-b8678162578d	FACE	t	\N	mock	{"reason": "Local AI models not loaded.", "photoFileId": "d596f3de-880e-4632-bfee-202b72fcf31a"}	2026-08-22 02:03:14.05
58e0a5f0-efd2-4bec-bc93-ecc091560ee2	53de8b71-c564-42bd-aef7-b8678162578d	GPS	t	\N	\N	{"attendanceLocationId": "9534ed51-e2bf-4846-84db-1dcb8936fcfa"}	2026-08-22 11:56:52.201
eba76ec4-6755-4948-ab2d-03bb1d4cd6b6	53de8b71-c564-42bd-aef7-b8678162578d	FACE	t	\N	mock	{"reason": "Local AI models not loaded.", "photoFileId": "ac2f2ee4-f0e6-43af-9a6f-751fd7695add"}	2026-08-22 11:56:52.201
c23d08a4-7200-4e3b-bb58-870b1f9f50ef	03b2ed45-0871-489e-92de-cba50d9403cc	GPS	t	\N	\N	{"attendanceLocationId": "9534ed51-e2bf-4846-84db-1dcb8936fcfa"}	2026-08-24 02:00:32.784
523bb80d-ed01-46f2-b763-d05ebb8237ee	03b2ed45-0871-489e-92de-cba50d9403cc	FACE	t	\N	mock	{"reason": "Local AI models not loaded.", "photoFileId": "aae19773-fb69-4ab6-8eb1-d676a562008f"}	2026-08-24 02:00:32.784
247d135e-623d-4ea4-847f-9a45dc6898c9	aa158314-2763-4062-9467-5aef10f24ad6	GPS	t	\N	\N	{"attendanceLocationId": "9534ed51-e2bf-4846-84db-1dcb8936fcfa"}	2026-08-25 01:29:28.273
1a75962b-3838-4e83-918f-20400cf8aede	aa158314-2763-4062-9467-5aef10f24ad6	FACE	t	\N	mock	{"reason": "Local AI models not loaded.", "photoFileId": "765df136-9870-467d-ac1e-36a2b316fe0b"}	2026-08-25 01:29:28.273
ac9af803-f458-4204-9ed1-5c7e55186cbd	aa158314-2763-4062-9467-5aef10f24ad6	GPS	t	\N	\N	{"attendanceLocationId": "9534ed51-e2bf-4846-84db-1dcb8936fcfa"}	2026-08-25 11:37:18.299
32c9cd59-0ee5-44f2-92e1-c7f42df8844d	aa158314-2763-4062-9467-5aef10f24ad6	FACE	t	\N	mock	{"reason": "Local AI models not loaded.", "photoFileId": "5af2b6f7-2513-4205-8d8f-89e4f25abd1b"}	2026-08-25 11:37:18.299
2f181ba0-b04b-4f9f-8cba-19bdd0e2a3b8	b529c14b-ab28-46d8-b34c-98beb2f209c6	GPS	t	\N	\N	{"attendanceLocationId": "9534ed51-e2bf-4846-84db-1dcb8936fcfa"}	2026-08-26 01:48:15.627
986ea56c-1d42-4bc0-80f9-853a56eb4084	b529c14b-ab28-46d8-b34c-98beb2f209c6	FACE	t	\N	mock	{"reason": "Local AI models not loaded.", "photoFileId": "e9a6d200-5a35-4029-8f95-f414ef371e55"}	2026-08-26 01:48:15.627
c3e2c085-b778-4119-847d-9427eb57925d	2489ee90-2f9b-402b-b58f-866abbbdcb77	GPS	t	\N	\N	{"attendanceLocationId": "9534ed51-e2bf-4846-84db-1dcb8936fcfa"}	2026-08-26 15:18:54.331
1097f5ac-3375-4c05-979f-d4e19dd203b9	2489ee90-2f9b-402b-b58f-866abbbdcb77	FACE	t	\N	mock	{"reason": "Local AI models not loaded.", "photoFileId": "966bcc2d-5bc2-43fa-b32f-78a3278edc1d"}	2026-08-26 15:18:54.331
0f384182-7dad-47db-b124-b4ccfe8a5eb1	b529c14b-ab28-46d8-b34c-98beb2f209c6	GPS	t	\N	\N	{"attendanceLocationId": "9534ed51-e2bf-4846-84db-1dcb8936fcfa"}	2026-08-26 15:18:54.532
2f305ac3-2406-4b07-8fac-e3502afb997b	b529c14b-ab28-46d8-b34c-98beb2f209c6	FACE	t	\N	mock	{"reason": "Local AI models not loaded.", "photoFileId": "b8248a48-4fa3-4ef4-a575-a2058c6fcb08"}	2026-08-26 15:18:54.532
edd78164-11d5-46e9-a59c-f9ac5a11cb34	2489ee90-2f9b-402b-b58f-866abbbdcb77	GPS	t	\N	\N	{"attendanceLocationId": "9534ed51-e2bf-4846-84db-1dcb8936fcfa"}	2026-08-26 15:19:37.271
520f68da-5ce7-4ffc-974c-9a7080edf726	2489ee90-2f9b-402b-b58f-866abbbdcb77	FACE	t	\N	mock	{"reason": "Local AI models not loaded.", "photoFileId": "6f0fac57-7c8d-4980-b6c2-d4e81b8171f7"}	2026-08-26 15:19:37.271
eda3249d-213a-4a7f-899d-f04ff5f8a99e	00aeb7ff-ad56-4568-9bfd-cd26a8215152	GPS	t	\N	\N	{"attendanceLocationId": "9534ed51-e2bf-4846-84db-1dcb8936fcfa"}	2026-08-27 03:20:23.225
a3a4fa04-3c5e-4e97-aa4f-1c6f5e09f703	00aeb7ff-ad56-4568-9bfd-cd26a8215152	FACE	t	\N	mock	{"reason": "Local AI models not loaded.", "photoFileId": "c75962cb-ebcd-4000-b158-09110a859b22"}	2026-08-27 03:20:23.225
feba42d0-3333-434c-b0cf-570f430b7225	7b1f307a-8958-49d4-a802-bdc20e48d9ac	GPS	t	\N	\N	{"attendanceLocationId": "9534ed51-e2bf-4846-84db-1dcb8936fcfa"}	2026-08-27 08:51:35.694
b76c5b21-544f-4ed8-b346-e6ffd519b4c6	7b1f307a-8958-49d4-a802-bdc20e48d9ac	FACE	t	\N	mock	{"reason": "Local AI models not loaded.", "photoFileId": "b03636ef-9ccc-4d54-9a02-3b8fcee7dd0f"}	2026-08-27 08:51:35.694
c11a6db3-399b-488a-b1e5-e4cebe1cbfa1	7b1f307a-8958-49d4-a802-bdc20e48d9ac	GPS	t	\N	\N	{"attendanceLocationId": "9534ed51-e2bf-4846-84db-1dcb8936fcfa"}	2026-08-27 11:31:54.422
5f3919e5-eda7-4dfc-a63f-f586fed01e7f	7b1f307a-8958-49d4-a802-bdc20e48d9ac	FACE	t	\N	mock	{"reason": "Local AI models not loaded.", "photoFileId": "89618409-b904-4158-8193-bc4fbeae03e9"}	2026-08-27 11:31:54.422
2959c388-2dc9-4a9a-b255-a4d17a6bd7ba	edd20d33-eb8f-4605-ae5a-80b5a3168b47	GPS	t	\N	\N	{"attendanceLocationId": "9534ed51-e2bf-4846-84db-1dcb8936fcfa"}	2026-08-28 01:56:02.864
41ae93e4-85d2-4ee5-aad3-eef4dd398d4d	edd20d33-eb8f-4605-ae5a-80b5a3168b47	FACE	t	\N	mock	{"reason": "Local AI models not loaded.", "photoFileId": "02805ee0-bd98-45e0-99eb-2f0bab5085c3"}	2026-08-28 01:56:02.864
6db8ca48-1db4-4c63-82ef-6ff50520fd1a	edd20d33-eb8f-4605-ae5a-80b5a3168b47	GPS	t	\N	\N	{"attendanceLocationId": "9534ed51-e2bf-4846-84db-1dcb8936fcfa"}	2026-08-28 11:33:25.014
6a840a8d-bd1a-40a9-8492-54548e0cede1	edd20d33-eb8f-4605-ae5a-80b5a3168b47	FACE	t	\N	mock	{"reason": "Local AI models not loaded.", "photoFileId": "1773df83-4368-4d89-9aab-450111ecb9c8"}	2026-08-28 11:33:25.014
25638eef-b07a-4875-b52a-f1073ddfca9f	851f1d87-b2a8-4895-ba0b-c987e5906114	GPS	t	\N	\N	{"attendanceLocationId": "9534ed51-e2bf-4846-84db-1dcb8936fcfa"}	2026-08-29 01:51:03.325
ea99dc21-7852-437f-b2c1-c6be5805c8ab	851f1d87-b2a8-4895-ba0b-c987e5906114	FACE	t	\N	mock	{"reason": "Local AI models not loaded.", "photoFileId": "31a6359d-e509-4569-ae08-7ae288c7f405"}	2026-08-29 01:51:03.325
8a8c31e8-e8d1-4acd-945b-750084898a04	0f14403b-c767-4fd7-9a59-d6d36fb22e68	GPS	t	\N	\N	{"attendanceLocationId": "9534ed51-e2bf-4846-84db-1dcb8936fcfa"}	2026-08-29 02:08:01.554
01fdf705-2f01-4e0d-9915-7576a01bab75	0f14403b-c767-4fd7-9a59-d6d36fb22e68	FACE	t	\N	mock	{"reason": "Local AI models not loaded.", "photoFileId": "2a7108db-411e-4de0-a1d4-70053df4378a"}	2026-08-29 02:08:01.554
c7407fc0-bdf4-4676-b2d8-2ada1f0007bb	d9dcbd34-70fc-4d22-aba8-ef7de15bc7b4	GPS	t	\N	\N	{"attendanceLocationId": "9534ed51-e2bf-4846-84db-1dcb8936fcfa"}	2026-08-29 08:45:11.986
c49d2be4-633d-4463-8f0c-2eca26ac8b5c	d9dcbd34-70fc-4d22-aba8-ef7de15bc7b4	FACE	t	\N	mock	{"reason": "Local AI models not loaded.", "photoFileId": "9c4017c8-1fc6-4c8e-82b0-c422f43b592f"}	2026-08-29 08:45:11.986
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, "actorUserId", action, "entityType", "entityId", metadata, "ipAddress", "userAgent", "createdAt") FROM stdin;
e6eea446-8f55-4ba2-acfb-65c0614f5af0	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	auth.register	UserApprovalRequest	80e135c1-2d9f-48c0-9c96-63d66fbe8f22	{"userId": "9bb92634-e2ad-4d0c-9955-2ecb696ae52b"}	127.0.0.1	okhttp/4.12.0	2026-08-19 11:03:47.165
786fc3f8-2019-4bd6-9353-0ee623ae593b	49098001-4375-47f0-b36d-c8758d8715ff	approval.account.approve	UserApprovalRequest	80e135c1-2d9f-48c0-9c96-63d66fbe8f22	{"userId": "9bb92634-e2ad-4d0c-9955-2ecb696ae52b", "departmentId": "63ab8aa8-c030-45c0-bec0-aa438fb5c2aa"}	\N	\N	2026-08-19 11:29:36.357
48d9a906-fa48-432e-ad6f-42f486e09340	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	user.face.update	User	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	{"faceProfileId": "56dbfda3-504b-49aa-82e3-2232d1611c09"}	\N	\N	2026-08-20 02:01:43.591
b45baa43-f72d-4801-aeec-0cadcd9f79d4	49098001-4375-47f0-b36d-c8758d8715ff	approval.account.approve	UserApprovalRequest	0584bd4c-10aa-4b1e-b0f8-677385e86c10	{"userId": "a6da6610-b5b2-40dc-b7fd-349fb534a4de", "departmentId": "63ab8aa8-c030-45c0-bec0-aa438fb5c2aa"}	\N	\N	2026-08-20 02:03:33.811
b6bacc1e-58a3-47b9-a153-251d3c9eee67	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	auth.register	UserApprovalRequest	bbaba29b-e648-4a8e-a5ce-c9cf8df592a0	{"userId": "bea82bc5-c3e5-45d8-bd50-82be7ade4b4c"}	127.0.0.1	MLGroup/8 CFNetwork/3860.400.51 Darwin/25.3.0	2026-08-20 02:08:38.989
02a3eae6-6d01-4430-bb81-38c57527eba5	49098001-4375-47f0-b36d-c8758d8715ff	approval.account.approve	UserApprovalRequest	bbaba29b-e648-4a8e-a5ce-c9cf8df592a0	{"userId": "bea82bc5-c3e5-45d8-bd50-82be7ade4b4c", "departmentId": "63ab8aa8-c030-45c0-bec0-aa438fb5c2aa"}	\N	\N	2026-08-20 02:08:53.118
57c69f36-89ac-4880-ac37-29b05f969ae3	49098001-4375-47f0-b36d-c8758d8715ff	admin.leader.assign	UserRole	b167010f-c927-49f4-9b78-5a48b88118ff	{"isHrDept": false, "departmentId": "63ab8aa8-c030-45c0-bec0-aa438fb5c2aa"}	\N	\N	2026-08-20 02:10:06.419
f9473e9d-be6d-41f7-b99e-e36bc3abe268	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	attendance.checkin	AttendanceRecord	322b76fd-ce04-4df0-97e7-8a22ef995756	{"workDate": "2026-08-20", "photoFileId": "c383d5ef-0205-4edc-911f-29ea25905f52", "departmentId": "63ab8aa8-c030-45c0-bec0-aa438fb5c2aa", "isUnplannedOt": false}	\N	\N	2026-08-20 02:16:08.552
2edd36ed-18ce-4182-8e86-00962c169955	49098001-4375-47f0-b36d-c8758d8715ff	task.create	Task	f248050b-a30f-420f-820d-aa21104ae480	{"taskCode": "TASK000001", "assigneeIds": ["bea82bc5-c3e5-45d8-bd50-82be7ade4b4c"]}	\N	\N	2026-08-20 02:18:00.451
7309fdef-e5bd-496a-9cdc-565e0ddadeb5	49098001-4375-47f0-b36d-c8758d8715ff	task.create	Task	1b33570d-7112-41ea-9af8-f1292569a577	{"taskCode": "TASK000002", "assigneeIds": ["bea82bc5-c3e5-45d8-bd50-82be7ade4b4c"]}	\N	\N	2026-08-20 02:21:54.304
bff2a8c2-d926-49ab-bdc9-c998162c54c7	49098001-4375-47f0-b36d-c8758d8715ff	task.create	Task	aecf0c65-74c6-4611-8cba-417a5c6bc044	{"taskCode": "TASK000003", "assigneeIds": ["bea82bc5-c3e5-45d8-bd50-82be7ade4b4c"]}	\N	\N	2026-08-20 02:23:01.143
6adc6ec3-8bb6-412e-ad57-39e179ed42ef	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	auth.register	UserApprovalRequest	282602c6-5574-480d-b9ba-c73bc4d47685	{"userId": "1eb90142-2416-4bfb-a9a0-7dda4616bbb9"}	127.0.0.1	MLGroup/8 CFNetwork/3860.700.1 Darwin/25.6.0	2026-08-20 02:34:23.284
a7fe9e42-d266-4c4a-abb4-da7fbbcdbbc9	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	approval.account.approve	UserApprovalRequest	282602c6-5574-480d-b9ba-c73bc4d47685	{"userId": "1eb90142-2416-4bfb-a9a0-7dda4616bbb9", "departmentId": "63ab8aa8-c030-45c0-bec0-aa438fb5c2aa"}	\N	\N	2026-08-20 02:34:40.301
9f0fbe22-2b82-43e6-ad2c-23a2cd75e1d5	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	task.create	Task	0641fe45-497a-4f73-b16d-b65155641479	{"taskCode": "TASK000004", "assigneeIds": ["a6da6610-b5b2-40dc-b7fd-349fb534a4de"]}	\N	\N	2026-08-20 02:46:43.894
c9a99650-47b6-47b1-b9cf-d4bffa4c85d8	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	task.create	Task	2a1f5cec-a02e-4d56-adae-ee357bceb47d	{"taskCode": "TASK000005", "assigneeIds": ["1eb90142-2416-4bfb-a9a0-7dda4616bbb9"]}	\N	\N	2026-08-20 02:48:28.33
2953cdb4-53b4-411b-a33c-d0b8f570910b	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	task.create	Task	cc34421e-67c5-485b-a773-81faf5713efd	{"taskCode": "TASK000006", "assigneeIds": ["9bb92634-e2ad-4d0c-9955-2ecb696ae52b"]}	\N	\N	2026-08-20 02:50:31.701
b2343a3a-9496-46cf-aad2-4e4d8bedfb04	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	task.create	Task	263c454d-f384-46bb-92ea-13c9baa380e0	{"taskCode": "TASK000007", "assigneeIds": ["9bb92634-e2ad-4d0c-9955-2ecb696ae52b"]}	\N	\N	2026-08-20 02:51:51.315
90f7fec6-5d5e-4f2c-a91d-4e1c1f6f6968	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	task.create	Task	7144b02a-5c75-481c-affc-e2726d2f0e11	{"taskCode": "TASK000008", "assigneeIds": ["1eb90142-2416-4bfb-a9a0-7dda4616bbb9"]}	\N	\N	2026-08-20 02:53:20.08
3ce534c3-c1ed-4bc8-ad63-ec93a80cc28f	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	user.profile.update	User	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	{"avatarUrl": "https://res.cloudinary.com/dqxsqiglg/image/upload/v1787215801/hrm/employee_document/2026-08-20/4448b17a-bc88-4180-adc0-2b5b551dbfce.jpg"}	\N	\N	2026-08-20 08:50:03.481
0ce8b461-82d9-4576-bb48-fbc952cf11f6	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	user.profile.update	User	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	{"email": "binhphung19112003@gmail.com", "phone": "0961416137"}	\N	\N	2026-08-20 08:50:13.456
17ef9e44-d1be-4e8d-acc6-c61b1727510d	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	attendance.checkout	AttendanceRecord	322b76fd-ce04-4df0-97e7-8a22ef995756	{"checkInAt": "2026-08-20T02:16:04.297Z", "checkOutAt": "2026-08-20T11:41:02.545Z", "workedMinutes": 564, "approvedOvertimeMinutes": 0}	\N	\N	2026-08-20 11:41:06.017
e7aabf3a-e5ac-4d44-9077-4eddcd070358	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	attendance.checkin	AttendanceRecord	d458d9e8-9c0d-4f17-8045-60180d5e1030	{"workDate": "2026-08-21", "photoFileId": "2a1fb528-433b-4794-9f85-27f9c77ad12b", "departmentId": "63ab8aa8-c030-45c0-bec0-aa438fb5c2aa", "isUnplannedOt": false}	\N	\N	2026-08-21 01:55:08.725
e03c7ef6-ad20-42f6-8059-59b220146452	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	task.create	Task	31d6d0a6-9abf-4675-a0c9-9fd1d0599c7f	{"taskCode": "TASK000009", "assigneeIds": ["9bb92634-e2ad-4d0c-9955-2ecb696ae52b"]}	\N	\N	2026-08-21 02:10:18.552
d639c54a-d430-4a22-81fd-201e54693085	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	task.create	Task	b7dc98d4-8c24-44ce-922b-a1506e087e24	{"taskCode": "TASK000010", "assigneeIds": ["9bb92634-e2ad-4d0c-9955-2ecb696ae52b"]}	\N	\N	2026-08-21 02:11:26.201
c7a9dea7-35c9-409e-9189-72867aeb3bc7	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	task.create	Task	6a93af02-a691-4a49-a78c-e86c59add3c4	{"taskCode": "TASK000011", "assigneeIds": ["1eb90142-2416-4bfb-a9a0-7dda4616bbb9"]}	\N	\N	2026-08-21 02:12:10.943
dbf8e3a9-0888-4e23-b348-e59c6c8ec887	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	attendance.checkin	AttendanceRecord	53de8b71-c564-42bd-aef7-b8678162578d	{"workDate": "2026-08-22", "photoFileId": "d596f3de-880e-4632-bfee-202b72fcf31a", "departmentId": "63ab8aa8-c030-45c0-bec0-aa438fb5c2aa", "isUnplannedOt": false}	\N	\N	2026-08-22 02:03:15.198
37b5c5a7-e8be-4e61-9c46-5aec9387754c	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	user.profile.update	User	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	{"avatarUrl": "https://res.cloudinary.com/dqxsqiglg/image/upload/v1787365294/hrm/employee_document/2026-08-22/e52b01d6-b536-47a0-9b0c-46bb9045558b.webp"}	\N	\N	2026-08-22 02:21:36.347
17015d18-fffb-43ac-85bb-1c5245587a1b	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	attendance.checkout	AttendanceRecord	53de8b71-c564-42bd-aef7-b8678162578d	{"checkInAt": "2026-08-22T02:03:09.703Z", "checkOutAt": "2026-08-22T11:56:48.989Z", "workedMinutes": 593, "approvedOvertimeMinutes": 0}	\N	\N	2026-08-22 11:56:52.474
34f81a25-0084-49a2-9e01-a06002166449	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	user.face.update	User	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	{"faceProfileId": "66d81fd6-105f-4718-9263-37df3f72d6f7"}	\N	\N	2026-08-24 02:00:13.56
ffe0cbe9-87be-4ae8-b09f-7f19cb1bfe87	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	attendance.checkin	AttendanceRecord	03b2ed45-0871-489e-92de-cba50d9403cc	{"workDate": "2026-08-24", "photoFileId": "aae19773-fb69-4ab6-8eb1-d676a562008f", "departmentId": "63ab8aa8-c030-45c0-bec0-aa438fb5c2aa", "isUnplannedOt": true}	\N	\N	2026-08-24 02:00:33.557
2dfda70b-791b-4aa7-8483-55f5c53fcb18	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	attendance.checkin	AttendanceRecord	aa158314-2763-4062-9467-5aef10f24ad6	{"workDate": "2026-08-25", "photoFileId": "765df136-9870-467d-ac1e-36a2b316fe0b", "departmentId": "63ab8aa8-c030-45c0-bec0-aa438fb5c2aa", "isUnplannedOt": false}	\N	\N	2026-08-25 01:29:29.352
90a22089-ef69-4bcc-ac9a-f049979e38fb	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	attendance.checkout	AttendanceRecord	aa158314-2763-4062-9467-5aef10f24ad6	{"checkInAt": "2026-08-25T01:29:24.575Z", "checkOutAt": "2026-08-25T11:37:15.264Z", "workedMinutes": 607, "approvedOvertimeMinutes": 0}	\N	\N	2026-08-25 11:37:18.556
e772f1a4-1115-4ff4-92ee-4855b3ca24bb	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	attendance.checkin	AttendanceRecord	b529c14b-ab28-46d8-b34c-98beb2f209c6	{"workDate": "2026-08-26", "photoFileId": "e9a6d200-5a35-4029-8f95-f414ef371e55", "departmentId": "63ab8aa8-c030-45c0-bec0-aa438fb5c2aa", "isUnplannedOt": false}	\N	\N	2026-08-26 01:48:16.632
3ffb0163-5bb1-41bc-9bf4-2be63e905590	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	attendance.checkout	AttendanceRecord	b529c14b-ab28-46d8-b34c-98beb2f209c6	{"checkInAt": "2026-08-26T01:48:12.144Z", "checkOutAt": "2026-08-26T15:18:50.619Z", "workedMinutes": 810, "approvedOvertimeMinutes": 0}	\N	\N	2026-08-26 15:18:54.738
83c55542-86d6-40a4-bdff-8888b19379e1	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	attendance.checkin	AttendanceRecord	2489ee90-2f9b-402b-b58f-866abbbdcb77	{"workDate": "2026-08-26", "photoFileId": "966bcc2d-5bc2-43fa-b32f-78a3278edc1d", "departmentId": "63ab8aa8-c030-45c0-bec0-aa438fb5c2aa", "isUnplannedOt": false}	\N	\N	2026-08-26 15:18:55.423
375b0d0c-dce4-4bab-8e7d-f91924a63585	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	attendance.checkout	AttendanceRecord	2489ee90-2f9b-402b-b58f-866abbbdcb77	{"checkInAt": "2026-08-26T15:18:49.466Z", "checkOutAt": "2026-08-26T15:19:33.297Z", "workedMinutes": 0, "approvedOvertimeMinutes": 0}	\N	\N	2026-08-26 15:19:37.664
a8d776e8-0bf1-499a-b710-35b0d775cbbf	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	attendance.checkin	AttendanceRecord	00aeb7ff-ad56-4568-9bfd-cd26a8215152	{"workDate": "2026-08-27", "photoFileId": "c75962cb-ebcd-4000-b158-09110a859b22", "departmentId": "63ab8aa8-c030-45c0-bec0-aa438fb5c2aa", "isUnplannedOt": false}	\N	\N	2026-08-27 03:20:24.253
979754a0-b2c1-4cfd-8dc5-caccec0f8375	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	attendance.checkin	AttendanceRecord	7b1f307a-8958-49d4-a802-bdc20e48d9ac	{"workDate": "2026-08-27", "photoFileId": "b03636ef-9ccc-4d54-9a02-3b8fcee7dd0f", "departmentId": "63ab8aa8-c030-45c0-bec0-aa438fb5c2aa", "isUnplannedOt": false}	\N	\N	2026-08-27 08:51:36.726
6f0703ca-e844-4789-ac59-4a1ce3cf9d2a	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	attendance.checkout	AttendanceRecord	7b1f307a-8958-49d4-a802-bdc20e48d9ac	{"checkInAt": "2026-08-27T08:51:32.084Z", "checkOutAt": "2026-08-27T11:31:50.999Z", "workedMinutes": 160, "approvedOvertimeMinutes": 0}	\N	\N	2026-08-27 11:31:54.695
67161447-213c-4caf-99ee-4e40895a25b7	e159d26b-5fba-452b-b5ce-44b52c18e8c3	auth.register	UserApprovalRequest	1476d00f-201b-404b-b975-5a3083cc9759	{"userId": "e159d26b-5fba-452b-b5ce-44b52c18e8c3"}	127.0.0.1	MLGroup/10 CFNetwork/3860.300.31 Darwin/25.2.0	2026-08-27 16:08:04.397
b450a803-3ac0-41a1-8ebf-7d0da1ae20a5	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	attendance.checkin	AttendanceRecord	edd20d33-eb8f-4605-ae5a-80b5a3168b47	{"workDate": "2026-08-28", "photoFileId": "02805ee0-bd98-45e0-99eb-2f0bab5085c3", "departmentId": "63ab8aa8-c030-45c0-bec0-aa438fb5c2aa", "isUnplannedOt": false}	\N	\N	2026-08-28 01:56:03.905
9bcc2bf2-a1bc-40df-9d02-10ad4df829dd	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	attendance.checkout	AttendanceRecord	edd20d33-eb8f-4605-ae5a-80b5a3168b47	{"checkInAt": "2026-08-28T01:55:58.135Z", "checkOutAt": "2026-08-28T11:33:21.897Z", "workedMinutes": 577, "approvedOvertimeMinutes": 0}	\N	\N	2026-08-28 11:33:25.267
864ae824-40ca-4285-b37f-7e7d5ba0b305	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	attendance.checkin	AttendanceRecord	851f1d87-b2a8-4895-ba0b-c987e5906114	{"workDate": "2026-08-29", "photoFileId": "31a6359d-e509-4569-ae08-7ae288c7f405", "departmentId": "63ab8aa8-c030-45c0-bec0-aa438fb5c2aa", "isUnplannedOt": false}	\N	\N	2026-08-29 01:51:04.441
4b70017f-960b-4821-aabf-65eba6b36273	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	attendance.checkin	AttendanceRecord	0f14403b-c767-4fd7-9a59-d6d36fb22e68	{"workDate": "2026-08-29", "photoFileId": "2a7108db-411e-4de0-a1d4-70053df4378a", "departmentId": "63ab8aa8-c030-45c0-bec0-aa438fb5c2aa", "isUnplannedOt": false}	\N	\N	2026-08-29 02:08:02.901
74c8a3a9-653d-44a5-b8e6-659a534d5d1c	545ef296-1135-4885-8e61-89932645af6c	auth.register	UserApprovalRequest	45dd6098-cb4e-4fcf-9250-7dcab236566c	{"userId": "545ef296-1135-4885-8e61-89932645af6c"}	127.0.0.1	MLGroup/11 CFNetwork/3860.400.51 Darwin/25.3.0	2026-08-29 03:07:08.009
2340611b-926a-449f-b7cc-66c869ae740c	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	approval.account.approve	UserApprovalRequest	45dd6098-cb4e-4fcf-9250-7dcab236566c	{"userId": "545ef296-1135-4885-8e61-89932645af6c", "departmentId": "63ab8aa8-c030-45c0-bec0-aa438fb5c2aa"}	\N	\N	2026-08-29 04:54:44.061
060532be-dd4c-42c9-bbb8-f99fdad18932	545ef296-1135-4885-8e61-89932645af6c	user.profile.update	User	545ef296-1135-4885-8e61-89932645af6c	{"avatarUrl": "https://res.cloudinary.com/dqxsqiglg/image/upload/v1787991218/hrm/employee_document/2026-08-29/d657e4e4-2d96-4943-85b9-4ea095ec8083.jpg"}	\N	\N	2026-08-29 08:13:39.702
4a159ee4-8d49-45d5-a672-ac9c342172ea	334b2294-9bba-4f31-8290-5a87484a62f0	auth.register	UserApprovalRequest	470a5b2e-e812-4dfb-af40-be5adad698b7	{"userId": "334b2294-9bba-4f31-8290-5a87484a62f0"}	127.0.0.1	MLGroup/11 CFNetwork/3826.500.111.2.2 Darwin/24.4.0	2026-08-29 08:35:29.532
4058f676-76ce-4763-9fd8-0ecac5f61eb5	49098001-4375-47f0-b36d-c8758d8715ff	approval.account.approve	UserApprovalRequest	470a5b2e-e812-4dfb-af40-be5adad698b7	{"userId": "334b2294-9bba-4f31-8290-5a87484a62f0", "departmentId": "6cde681e-47b5-47b0-a29c-ff13c66dba82"}	\N	\N	2026-08-29 08:36:49.498
cf86f9d9-aed6-4c68-b2da-13bfbbb2d78e	c2a06e5b-22fd-4862-bf12-8c36f5e07d9c	auth.register	UserApprovalRequest	6c1acc8c-b627-4b10-8cc0-bdeaf0adff2f	{"userId": "c2a06e5b-22fd-4862-bf12-8c36f5e07d9c"}	127.0.0.1	MLGroup/11 CFNetwork/3826.600.41 Darwin/24.6.0	2026-08-29 08:37:25.585
c72f5c2b-eb32-4d0a-90f7-f49841f09461	846641e3-667b-4e7f-b505-afdc1d66b54a	auth.register	UserApprovalRequest	cc209493-51d6-45d8-8eb4-92e32bbe31d9	{"userId": "846641e3-667b-4e7f-b505-afdc1d66b54a"}	127.0.0.1	MLGroup/11 CFNetwork/3860.700.1 Darwin/25.6.0	2026-08-29 08:37:57.387
55b23566-fc48-47c2-8344-231789f58369	49098001-4375-47f0-b36d-c8758d8715ff	approval.account.approve	UserApprovalRequest	cc209493-51d6-45d8-8eb4-92e32bbe31d9	{"userId": "846641e3-667b-4e7f-b505-afdc1d66b54a", "departmentId": "15cc071a-269e-44e1-ab43-f2d00144e2d6"}	\N	\N	2026-08-29 08:38:22.246
eec01072-f32a-4d5f-b10b-ad9b1ca7a65b	49098001-4375-47f0-b36d-c8758d8715ff	approval.account.approve	UserApprovalRequest	6c1acc8c-b627-4b10-8cc0-bdeaf0adff2f	{"userId": "c2a06e5b-22fd-4862-bf12-8c36f5e07d9c", "departmentId": "6cde681e-47b5-47b0-a29c-ff13c66dba82"}	\N	\N	2026-08-29 08:39:29.162
150f06f1-fa0c-43d6-9abe-d1b7f7f42682	334b2294-9bba-4f31-8290-5a87484a62f0	user.profile.update	User	334b2294-9bba-4f31-8290-5a87484a62f0	{"avatarUrl": "https://res.cloudinary.com/dqxsqiglg/image/upload/v1787992803/hrm/employee_document/2026-08-29/3df4149b-4366-4cba-a5b0-69da5cd0fa4f.jpg"}	\N	\N	2026-08-29 08:40:05.408
fc8d95a0-b417-4a2c-afb7-5b6de77dfd4f	846641e3-667b-4e7f-b505-afdc1d66b54a	user.profile.update	User	846641e3-667b-4e7f-b505-afdc1d66b54a	{"avatarUrl": "https://res.cloudinary.com/dqxsqiglg/image/upload/v1787992821/hrm/employee_document/2026-08-29/a15afebf-ad34-49a0-af2e-4c0994fc9d1a.jpg"}	\N	\N	2026-08-29 08:40:22.474
f94f3f77-8bf1-4e29-812d-7f07147b96c1	846641e3-667b-4e7f-b505-afdc1d66b54a	user.face.update	User	846641e3-667b-4e7f-b505-afdc1d66b54a	{"faceProfileId": "12058468-7f11-4ee6-a109-5c1ffcec23ef"}	\N	\N	2026-08-29 08:40:52.595
2371109e-294d-465d-bc78-ea8e72e538cd	c2a06e5b-22fd-4862-bf12-8c36f5e07d9c	user.profile.update	User	c2a06e5b-22fd-4862-bf12-8c36f5e07d9c	{"avatarUrl": "https://res.cloudinary.com/dqxsqiglg/image/upload/v1787992857/hrm/employee_document/2026-08-29/e4e0e9a6-a0a1-42ae-946f-600857503823.jpg"}	\N	\N	2026-08-29 08:40:58.587
e3b0e1c4-4e27-4703-a72c-f8092134ec55	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	user.profile.update	User	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	{"avatarUrl": "https://res.cloudinary.com/dqxsqiglg/image/upload/v1787992902/hrm/employee_document/2026-08-29/6604d338-1073-4d96-b478-361919c9e3c4.jpg"}	\N	\N	2026-08-29 08:41:43.719
99e37d55-0998-40a4-b81e-702014ae34b6	846641e3-667b-4e7f-b505-afdc1d66b54a	attendance.checkin	AttendanceRecord	d9dcbd34-70fc-4d22-aba8-ef7de15bc7b4	{"workDate": "2026-08-29", "photoFileId": "9c4017c8-1fc6-4c8e-82b0-c422f43b592f", "departmentId": "15cc071a-269e-44e1-ab43-f2d00144e2d6", "isUnplannedOt": true}	\N	\N	2026-08-29 08:45:12.784
f75cfb02-be8c-4e40-bb77-7c8b0b15e07d	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	task.create	Task	733b777b-bbd6-4e8b-92c1-1cb8075031e1	{"taskCode": "TASK000012", "assigneeIds": ["9bb92634-e2ad-4d0c-9955-2ecb696ae52b"]}	\N	\N	2026-09-03 04:12:04.044
183afe9b-bd93-4d91-a78c-b9a52bf539e2	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	task.create	Task	ba60cab8-23cd-4079-95e6-af3ce9b684e7	{"taskCode": "TASK000013", "assigneeIds": ["1eb90142-2416-4bfb-a9a0-7dda4616bbb9"]}	\N	\N	2026-09-03 04:12:54.573
5f818677-6e17-4dcd-9916-37d6708d5353	49098001-4375-47f0-b36d-c8758d8715ff	admin.vault.grant_points	TalentRetentionVault	6e1fca21-3691-471b-a8b3-db3fe9406ea2	{"note": "Cấp điểm Ví Tết đầu năm", "year": 2026, "points": 50000, "userId": "bea82bc5-c3e5-45d8-bd50-82be7ade4b4c", "userCode": "NV000017", "grantType": "ANNUAL", "totalCash": 50000000}	\N	\N	2026-09-05 03:17:38.409
c879e888-b617-4136-94ad-ae199f9ba13a	49098001-4375-47f0-b36d-c8758d8715ff	admin.vault.grant_points	TalentRetentionVault	6e1fca21-3691-471b-a8b3-db3fe9406ea2	{"note": "Thưởng dự án cộng dồn quý", "year": 2026, "points": 20000, "userId": "bea82bc5-c3e5-45d8-bd50-82be7ade4b4c", "userCode": "NV000017", "grantType": "PROJECT_VESTING", "totalCash": 20000000}	\N	\N	2026-09-05 03:17:50.884
90b1f7c6-1671-4a9b-a4b6-56ac06ef11f4	49098001-4375-47f0-b36d-c8758d8715ff	admin.vault.grant_points	TalentRetentionVault	6e1fca21-3691-471b-a8b3-db3fe9406ea2	{"note": "Cấp điểm Ví Tết đầu năm", "year": 2026, "points": 10000, "userId": "bea82bc5-c3e5-45d8-bd50-82be7ade4b4c", "userCode": "NV000017", "grantType": "ANNUAL", "totalCash": 10000000}	\N	\N	2026-09-05 03:20:38.755
fd0fd833-7a01-4eb2-8ff9-a6205b9745bb	89ab6a07-e01e-40ed-b498-32d955c35a1c	auth.register	UserApprovalRequest	7bf38d36-61e9-4d73-a7a1-83b6b8c93169	{"userId": "89ab6a07-e01e-40ed-b498-32d955c35a1c"}	127.0.0.1	MLGroup/11 CFNetwork/3860.700.1 Darwin/25.6.0	2026-09-05 07:39:53.855
4ecd5f0d-bd4a-4aa5-a5ee-b05b290069c7	cbb85058-9ce2-4eca-ac7b-a6c491a331f0	auth.register	UserApprovalRequest	91555730-197b-4034-8023-876241f2ed5a	{"userId": "cbb85058-9ce2-4eca-ac7b-a6c491a331f0"}	127.0.0.1	MLGroup/11 CFNetwork/3826.600.41.2.1 Darwin/24.6.0	2026-09-05 08:47:55.817
d1f5e15b-70c3-4b9d-97e7-7ae294519254	49098001-4375-47f0-b36d-c8758d8715ff	admin.vault.grant_points	TalentRetentionVault	6e1fca21-3691-471b-a8b3-db3fe9406ea2	{"note": "Cấp điểm Ví Tết đầu năm", "year": 2026, "points": 20000, "userId": "bea82bc5-c3e5-45d8-bd50-82be7ade4b4c", "userCode": "NV000017", "grantType": "ANNUAL", "totalCash": 20000000}	\N	\N	2026-09-05 10:15:40.676
305c3e16-49ed-4f25-8e94-9e37efdbb61f	49098001-4375-47f0-b36d-c8758d8715ff	admin.vault.grant_package	ProjectGrantPackage	5cabe1bb-1b52-439e-921f-ce177bcaf602	{"year": 2026, "title": "Thưởng Dự án", "points": 20000, "userId": "bea82bc5-c3e5-45d8-bd50-82be7ade4b4c", "userCode": "NV000017", "startDate": "2026-09-05T00:00:00.000Z", "durationMonths": 12, "intervalMonths": 3, "milestonesCount": 4}	\N	\N	2026-09-05 10:45:50.441
2e29d7fe-a83e-4b5f-9521-ddfbc9357da8	49098001-4375-47f0-b36d-c8758d8715ff	admin.vault.grant_package	ProjectGrantPackage	be524d30-c404-4d6b-b80a-bbbc30157170	{"year": 2026, "title": "Thưởng Dự án", "points": 50000, "userId": "bea82bc5-c3e5-45d8-bd50-82be7ade4b4c", "userCode": "NV000017", "startDate": "2026-09-08T00:00:00.000Z", "durationMonths": 24, "intervalMonths": 3, "milestonesCount": 8}	\N	\N	2026-09-05 11:25:29.067
549d1cf9-71b1-453b-8c0b-6a12fe749550	49098001-4375-47f0-b36d-c8758d8715ff	admin.vault.grant_package	ProjectGrantPackage	01bfcb9f-0b22-4868-b12a-fa8efabe7d69	{"year": 2026, "title": "Thưởng Dự án", "points": 10000, "userId": "bea82bc5-c3e5-45d8-bd50-82be7ade4b4c", "userCode": "NV000017", "startDate": "2026-11-05T00:00:00.000Z", "durationMonths": 12, "intervalMonths": 2, "milestonesCount": 6}	\N	\N	2026-09-05 11:26:04.698
e0511bba-c2c2-4c31-a877-dc652460281b	49098001-4375-47f0-b36d-c8758d8715ff	admin.vault.grant_package	ProjectGrantPackage	d6c6ad4d-936a-4ff3-aab4-3a73e51e9752	{"year": 2026, "title": "Thưởng Dự án", "points": 10000, "userId": "bea82bc5-c3e5-45d8-bd50-82be7ade4b4c", "userCode": "NV000017", "startDate": "2026-09-06T00:00:00.000Z", "durationMonths": 12, "intervalMonths": 2, "milestonesCount": 6}	\N	\N	2026-09-06 08:42:25.177
ea4ebffe-f8e7-4ffb-b3df-8ed8592c9459	05ff1cc9-4cb6-4d87-a74b-0391a5539537	auth.register	UserApprovalRequest	bbf4a8f4-2257-4077-a346-4e33b0b90e86	{"userId": "05ff1cc9-4cb6-4d87-a74b-0391a5539537"}	127.0.0.1	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	2026-09-06 09:15:22.065
9156b79e-4399-406d-a73d-c657f6bdbe51	49098001-4375-47f0-b36d-c8758d8715ff	approval.account.approve	UserApprovalRequest	bbf4a8f4-2257-4077-a346-4e33b0b90e86	{"userId": "05ff1cc9-4cb6-4d87-a74b-0391a5539537", "departmentId": "15c385cd-c45a-4d00-997b-a98c05615b41"}	\N	\N	2026-09-06 09:15:45.998
08f6db2a-e384-494c-b067-3d794d8a4459	49098001-4375-47f0-b36d-c8758d8715ff	admin.leader.assign	UserRole	02afee7e-1bae-4558-9cb1-928a674d50b1	{"isHrDept": true, "departmentId": "15c385cd-c45a-4d00-997b-a98c05615b41"}	\N	\N	2026-09-06 09:16:04.826
323fb379-e97d-4be3-a2c5-debd515c97b9	31bb72f7-e5e2-493e-827d-3320e1054461	auth.register	UserApprovalRequest	38c94859-891c-4f1b-b0eb-21f9c5dad3e8	{"userId": "31bb72f7-e5e2-493e-827d-3320e1054461"}	127.0.0.1	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	2026-09-06 11:25:24.961
65471b22-19a1-485c-b7e0-78f5f87a1b0b	49098001-4375-47f0-b36d-c8758d8715ff	approval.account.approve	UserApprovalRequest	38c94859-891c-4f1b-b0eb-21f9c5dad3e8	{"userId": "31bb72f7-e5e2-493e-827d-3320e1054461", "departmentId": "d7029d8b-7f8a-4085-bc8e-63a4ffb7ba70"}	\N	\N	2026-09-06 11:25:48.372
41dfac8c-0759-44d2-95a4-9af9d7ba44f6	49098001-4375-47f0-b36d-c8758d8715ff	admin.leader.assign	UserRole	e4fc310a-0a6c-4300-b782-7777a0a73e47	{"isHrDept": false, "departmentId": "d7029d8b-7f8a-4085-bc8e-63a4ffb7ba70"}	\N	\N	2026-09-06 11:32:57.98
8e8d2f08-3600-400c-99bd-a47c9946a37b	05ff1cc9-4cb6-4d87-a74b-0391a5539537	TIMESHEET_OFFICIAL_IMAGE	TimesheetImage	05ff1cc9-4cb6-4d87-a74b-0391a5539537	{"year": 2026, "month": 9, "imageUrl": "https://pub-7d69ec28111e4d0b89308dc0ae7571ed.r2.dev/attendance/2026-09-07/84b1d91a-8b92-4d01-8304-cb3ba1cfc474.jpg"}	\N	\N	2026-09-07 07:41:15.738
418d359d-b6d3-40d3-8d65-007bc0ce1d05	31bb72f7-e5e2-493e-827d-3320e1054461	PAYROLL_OFFICIAL_IMAGE	PayslipImage	05ff1cc9-4cb6-4d87-a74b-0391a5539537	{"year": 2026, "month": 9, "imageUrl": "https://res.cloudinary.com/dqxsqiglg/image/upload/v1788768027/hrm/employee_document/2026-09-07/f19ba38b-18ba-4505-bc6c-d84754538f22.jpg"}	\N	\N	2026-09-07 08:00:28.836
47d17723-5a33-4e5c-b98c-b2c5d9083aed	49098001-4375-47f0-b36d-c8758d8715ff	user.level.direct_update	User	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	{"note": "Leader đổi cấp trực tiếp", "newLevelNumber": 2, "previousLevelNumber": 1}	\N	\N	2026-09-08 07:06:39.529
3ff9bf1c-6721-4e1e-8729-677e8d898b50	49098001-4375-47f0-b36d-c8758d8715ff	user.level.direct_update	User	a6da6610-b5b2-40dc-b7fd-349fb534a4de	{"note": "Leader đổi cấp trực tiếp", "newLevelNumber": 1, "previousLevelNumber": 2}	\N	\N	2026-09-08 07:06:52.458
18c56a1a-32a4-4d6f-be0a-511d2e9d4f12	49098001-4375-47f0-b36d-c8758d8715ff	user.level.direct_update	User	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	{"note": "Leader đổi cấp trực tiếp", "newLevelNumber": 1, "previousLevelNumber": 2}	\N	\N	2026-09-08 07:07:10.784
4a279963-3bb1-4a1f-a343-59717398ef31	49098001-4375-47f0-b36d-c8758d8715ff	user.level.direct_update	User	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	{"note": "Leader đổi cấp trực tiếp", "newLevelNumber": 1, "previousLevelNumber": 2}	\N	\N	2026-09-08 07:21:54.867
57eb0dc7-13e3-4737-9657-7b9aca047273	49098001-4375-47f0-b36d-c8758d8715ff	user.level.direct_update	User	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	{"note": "Leader đổi cấp trực tiếp", "newLevelNumber": 1, "previousLevelNumber": 2}	\N	\N	2026-09-08 07:45:31.595
b2199f18-28bc-46c7-a236-a759b05e16ea	49098001-4375-47f0-b36d-c8758d8715ff	admin.vault.grant_package	ProjectGrantPackage	fb9c6b46-47f6-4e92-912c-51f585383f05	{"year": 2026, "title": "Thưởng Tết 2026", "points": 50000, "userId": "1eb90142-2416-4bfb-a9a0-7dda4616bbb9", "userCode": "NV000018", "startDate": "2026-09-08T00:00:00.000Z", "durationMonths": 12, "intervalMonths": 3, "milestonesCount": 4}	\N	\N	2026-09-08 07:46:44.937
edd8e5c1-ff75-4bf0-beed-e6d6cca3a38c	49098001-4375-47f0-b36d-c8758d8715ff	admin.vault.grant_package	ProjectGrantPackage	89a8be07-261f-4564-8b00-cd49c8cbec8a	{"year": 2026, "title": "Thưởng Tết 2026", "points": 10000, "userId": "05ff1cc9-4cb6-4d87-a74b-0391a5539537", "userCode": "NV000026", "startDate": "2026-09-08T00:00:00.000Z", "durationMonths": 12, "intervalMonths": 3, "milestonesCount": 4}	\N	\N	2026-09-08 10:01:07.353
a5d7eac1-2185-48ec-b9e4-820166f1f330	\N	auth.register	UserApprovalRequest	0584bd4c-10aa-4b1e-b0f8-677385e86c10	{"userId": "a6da6610-b5b2-40dc-b7fd-349fb534a4de"}	127.0.0.1	MLGroup/8 CFNetwork/3860.700.1 Darwin/25.6.0	2026-08-20 02:01:00.83
563e9290-1600-4afc-b823-d732076f3a3d	49098001-4375-47f0-b36d-c8758d8715ff	employee.delete	User	a6da6610-b5b2-40dc-b7fd-349fb534a4de	{"profileId": "a918ff08-8088-4737-851e-206b66e58cdb"}	\N	\N	2026-09-08 11:14:03.203
e50cd68b-5352-4abb-8ef2-f6cdc5a8dc3b	49098001-4375-47f0-b36d-c8758d8715ff	admin.vault.grant_package	ProjectGrantPackage	5e2b0bbb-bcd2-48c2-a937-288fa504007b	{"year": 2026, "title": "Thưởng Cuối Năm 2026", "points": 10000, "userId": "bea82bc5-c3e5-45d8-bd50-82be7ade4b4c", "userCode": "NV000017", "startDate": "2026-09-08T00:00:00.000Z", "durationMonths": 12, "intervalMonths": 3, "milestonesCount": 4}	\N	\N	2026-09-08 12:10:25.889
74d0774b-b4e6-4bdc-9ed7-9d4d200007d2	49098001-4375-47f0-b36d-c8758d8715ff	admin.vault.grant_package	ProjectGrantPackage	da015c70-e3cd-4eb3-8c44-8c00138ae15a	{"year": 2026, "title": "Thưởng Cuối Năm 2026", "points": 10000, "userId": "bea82bc5-c3e5-45d8-bd50-82be7ade4b4c", "userCode": "NV000017", "startDate": "2026-08-09T00:00:00.000Z", "durationMonths": 12, "intervalMonths": 1, "milestonesCount": 12}	\N	\N	2026-09-09 04:20:18.068
174549a0-f7fa-42c4-b851-241bf6a1eb3f	49098001-4375-47f0-b36d-c8758d8715ff	admin.vault.approve_withdrawal	RewardWithdrawalRequest	e044bf05-caf6-483e-8e16-78ac82043268	{"points": 833, "userId": "bea82bc5-c3e5-45d8-bd50-82be7ade4b4c", "requestId": "e044bf05-caf6-483e-8e16-78ac82043268", "cashAmount": 833000}	\N	\N	2026-09-09 04:22:06.45
23d0249b-6bb9-43a6-acf5-0be8815469e5	49098001-4375-47f0-b36d-c8758d8715ff	accountant.vault.confirm_paid	RewardWithdrawalRequest	e044bf05-caf6-483e-8e16-78ac82043268	{"points": 833, "userId": "bea82bc5-c3e5-45d8-bd50-82be7ade4b4c", "requestId": "e044bf05-caf6-483e-8e16-78ac82043268", "cashAmount": 833000}	\N	\N	2026-09-09 07:35:33.231
\.


--
-- Data for Name: branches; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.branches (id, "companyId", code, name, address, latitude, longitude, "allowedRadius", "allowedIps", "isActive", "createdAt", "updatedAt", "deletedAt", "isHeadquarters", "regionId") FROM stdin;
65cebe1f-3be1-497f-a195-4340eac28b38	034d3d0b-83ea-42d8-bcd5-a6ae99cd0cc6	CNH-260819174226	chi nhánh HN 	72 Hồ Linh Quang Văn Chương	\N	\N	100	{42.114.33.226}	t	2026-08-19 10:42:28.124	2026-09-09 06:32:57.319	\N	f	073f9933-8845-4c3f-a25f-8116105e3185
9534ed51-e2bf-4846-84db-1dcb8936fcfa	034d3d0b-83ea-42d8-bcd5-a6ae99cd0cc6	CNH-9697	Chi Nhánh HN1	Hồ Linh Quang, P. Văn Miếu - Quốc Tử Giám, Thành Phố Hà Nội	21.0229412	105.8389038	100	{42.114.33.226}	t	2026-08-20 02:15:30.029	2026-09-09 07:07:23.931	\N	f	073f9933-8845-4c3f-a25f-8116105e3185
\.


--
-- Data for Name: chat_group_members; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chat_group_members (id, "groupId", "userId", "joinedAt", "clearedAt") FROM stdin;
7d0a9e5b-e626-4e06-969b-43a2d90814b0	b41b7beb-4dad-40b9-878e-52c57ce54908	49098001-4375-47f0-b36d-c8758d8715ff	2026-08-29 08:43:50.424	\N
bf75c0d7-994a-4ebf-97ea-493a7fcb66c4	b41b7beb-4dad-40b9-878e-52c57ce54908	846641e3-667b-4e7f-b505-afdc1d66b54a	2026-08-29 08:43:50.424	\N
f0710b06-d117-4041-9f3b-82a838122915	5320a19b-fe16-42ba-8a0a-f58807d15af7	49098001-4375-47f0-b36d-c8758d8715ff	2026-08-29 08:45:03.65	\N
cfb95744-6ac9-4153-b6fb-15f596dc3bbd	5320a19b-fe16-42ba-8a0a-f58807d15af7	c2a06e5b-22fd-4862-bf12-8c36f5e07d9c	2026-08-29 08:45:03.65	\N
2590704e-1593-4646-af18-e493c58ad005	66a56333-980e-4439-9763-7588f3f4b52e	49098001-4375-47f0-b36d-c8758d8715ff	2026-09-09 10:13:42.254	\N
a70fbd20-a6e9-428e-ac29-bbd2be14786b	66a56333-980e-4439-9763-7588f3f4b52e	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 10:13:42.254	\N
\.


--
-- Data for Name: chat_groups; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chat_groups (id, "departmentId", "taskId", name, type, "isArchived", "createdAt", "updatedAt") FROM stdin;
4a9cc108-beff-4c07-98da-78d36e2dfdf0	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	\N	Nhóm DEV	DEPARTMENT	f	2026-08-20 08:50:43.106	2026-08-20 08:50:43.106
d144fc0c-f64c-43aa-998c-3676bcac8ad9	6cde681e-47b5-47b0-a29c-ff13c66dba82	\N	Nhóm Kinh Doanh 	DEPARTMENT	f	2026-08-29 08:38:07.59	2026-08-29 08:38:07.59
1f9b732e-1676-4047-9ad5-32b54a43c6d2	15cc071a-269e-44e1-ab43-f2d00144e2d6	\N	Nhóm Kho Xử Lý Hàng Hóa 	DEPARTMENT	f	2026-08-29 08:41:42.762	2026-08-29 08:41:42.762
b41b7beb-4dad-40b9-878e-52c57ce54908	\N	\N	\N	DIRECT	f	2026-08-29 08:43:50.424	2026-08-29 08:43:50.424
5320a19b-fe16-42ba-8a0a-f58807d15af7	\N	\N	\N	DIRECT	f	2026-08-29 08:45:03.65	2026-08-29 08:45:03.65
1010298d-4a8f-49b0-947d-59a06c688d2c	15c385cd-c45a-4d00-997b-a98c05615b41	\N	Nhóm Hành Chính Nhân Sự 	DEPARTMENT	f	2026-09-06 09:24:45.608	2026-09-06 09:24:45.608
b6854125-7d21-4993-9751-0a2a6ccafcc9	d7029d8b-7f8a-4085-bc8e-63a4ffb7ba70	\N	Nhóm Kế Toán	DEPARTMENT	f	2026-09-06 11:31:27.098	2026-09-06 11:31:27.098
66a56333-980e-4439-9763-7588f3f4b52e	\N	\N	\N	DIRECT	f	2026-09-09 10:13:42.254	2026-09-09 10:13:42.254
\.


--
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chat_messages (id, "groupId", "senderId", content, "fileUrl", "fileType", "fileName", mentions, "createdAt", "updatedAt") FROM stdin;
7151d258-f96c-4793-911a-4e9058dacf0a	4a9cc108-beff-4c07-98da-78d36e2dfdf0	9bb92634-e2ad-4d0c-9955-2ecb696ae52b		https://res.cloudinary.com/dqxsqiglg/image/upload/v1787365224/hrm/task_attachment/2026-08-22/0dc5a84f-beb0-478b-a104-f7126ffb260a.webp	IMAGE	1000026902.webp	{}	2026-08-22 02:20:26.242	2026-08-22 02:20:26.242
5de4c09f-91e1-4464-9a93-8aee8d9c8271	4a9cc108-beff-4c07-98da-78d36e2dfdf0	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	alo	\N	\N	\N	{}	2026-08-22 02:20:53.582	2026-08-22 02:20:53.582
cfbd1156-8480-425b-b53f-45cc5ff59da2	4a9cc108-beff-4c07-98da-78d36e2dfdf0	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	GIPHY_STICKER:https://media2.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3d2hyeDl3dm85cTliaTFzaHc1bTlpNzVxOGx2NTlkcXQxdWcwbDd3ciZlcD12MV9zdGlja2Vyc190cmVuZGluZyZjdD1z/sP7pvfrlsQ6pQdSgep/100w.gif	\N	\N	\N	{}	2026-08-22 11:20:07.14	2026-08-22 11:20:07.14
404d413d-706d-4009-aa1d-a76d0fccf2db	4a9cc108-beff-4c07-98da-78d36e2dfdf0	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	GIPHY_STICKER:https://media4.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3aWN3dTY1YTJkcHZtMWdvd3phNHA5NjAyczFpZWczdWo2OTk4aWh5bSZlcD12MV9zdGlja2Vyc190cmVuZGluZyZjdD1z/Xr9TlAqw3S7VPOrftK/100w.gif	\N	\N	\N	{}	2026-08-27 03:18:06.991	2026-08-27 03:18:06.991
0e8ea5b1-f454-4297-abfb-2b7559c9f52d	4a9cc108-beff-4c07-98da-78d36e2dfdf0	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	GIPHY_STICKER:https://media0.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3OTZsbDZnZW1va3dvMDRuZG5lYTllamdpd29rNzlzYzQzNGRlY2ZwZCZlcD12MV9zdGlja2Vyc190cmVuZGluZyZjdD1z/a5m671xRO5gxtDyPxP/100w.gif	\N	\N	\N	{}	2026-08-29 04:19:46.775	2026-08-29 04:19:46.775
9118d1d1-ae02-4318-95d6-fe2710457a5d	4a9cc108-beff-4c07-98da-78d36e2dfdf0	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	@Cường Test 1 hi	\N	\N	\N	{545ef296-1135-4885-8e61-89932645af6c}	2026-08-29 04:56:24.466	2026-08-29 04:56:24.466
a37941e2-c231-4370-9596-43c2cbcb4d30	4a9cc108-beff-4c07-98da-78d36e2dfdf0	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	GIPHY_STICKER:https://media2.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3aXYxZ3h1bjg2ano0d3R6czRhYzg0NXZyZzB2enVmMW1yaWU1cmQ0diZlcD12MV9zdGlja2Vyc190cmVuZGluZyZjdD1z/Xr9TlAqw3S7VPOrftK/100w.gif	\N	\N	\N	{}	2026-08-29 04:56:30.818	2026-08-29 04:56:30.818
54e76513-24d4-4eaa-bfe2-340ea95429fc	4a9cc108-beff-4c07-98da-78d36e2dfdf0	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	GIPHY_STICKER:https://media4.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3cGl2ejAzcmJ6aG9pNmU2aTh5Yjk1dGE2Y2Nxd2c4ejlqN3RpZzdtZCZlcD12MV9zdGlja2Vyc190cmVuZGluZyZjdD1z/9K6CebIaqQmAMxJcJQ/100w.gif	\N	\N	\N	{}	2026-08-29 05:09:05.134	2026-08-29 05:09:05.134
f1a15a68-7c61-4d30-bb20-8f6fb29ac316	4a9cc108-beff-4c07-98da-78d36e2dfdf0	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	GIPHY_STICKER:https://media0.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3aXYxZ3h1bjg2ano0d3R6czRhYzg0NXZyZzB2enVmMW1yaWU1cmQ0diZlcD12MV9zdGlja2Vyc190cmVuZGluZyZjdD1z/kcxn8ZB7t6tf8vb0wS/100w.gif	\N	\N	\N	{}	2026-08-29 05:09:29.131	2026-08-29 05:09:29.131
87c7c071-2afc-499b-8da9-a4cc13909f0f	4a9cc108-beff-4c07-98da-78d36e2dfdf0	545ef296-1135-4885-8e61-89932645af6c	Update bao giờ xong ae ơi	\N	\N	\N	{}	2026-08-29 08:13:03.305	2026-08-29 08:13:03.305
96cb49d5-0fa7-49aa-aa20-2f43345acfa4	4a9cc108-beff-4c07-98da-78d36e2dfdf0	545ef296-1135-4885-8e61-89932645af6c	Gửi tin nhắn hơi lắc	\N	\N	\N	{}	2026-08-29 08:13:13.788	2026-08-29 08:13:13.788
56172bc2-00fb-4bf9-9f5a-8d65155bc396	4a9cc108-beff-4c07-98da-78d36e2dfdf0	49098001-4375-47f0-b36d-c8758d8715ff	cái này là do phần lưu database free đó anh ơi 	\N	\N	\N	{}	2026-08-29 08:13:58.136	2026-08-29 08:13:58.136
b80fe3b1-9bb7-4da1-8ffa-2ced5d3187b9	4a9cc108-beff-4c07-98da-78d36e2dfdf0	49098001-4375-47f0-b36d-c8758d8715ff	haha 	\N	\N	\N	{}	2026-08-29 08:14:01.543	2026-08-29 08:14:01.543
9265b2cd-a75c-48dc-8d01-897073c30722	4a9cc108-beff-4c07-98da-78d36e2dfdf0	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	GIPHY_STICKER:https://media2.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3NDJpeHo2aWptd2l2ZzY3YzQ2dTV5bXB5YW80Mjh5dXVraXdqdXVqNiZlcD12MV9zdGlja2Vyc190cmVuZGluZyZjdD1z/Xr9TlAqw3S7VPOrftK/100w.gif	\N	\N	\N	{}	2026-08-29 08:15:27.491	2026-08-29 08:15:27.491
900b2b89-848c-4ecd-bd91-a89a78da5557	4a9cc108-beff-4c07-98da-78d36e2dfdf0	545ef296-1135-4885-8e61-89932645af6c	Có vẻ nó căn lề các thứ chưa chuẩn nhỉ	\N	\N	\N	{}	2026-08-29 08:15:27.638	2026-08-29 08:15:27.638
97963f2e-4dda-43fb-8146-403b1a07121c	4a9cc108-beff-4c07-98da-78d36e2dfdf0	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	Căn lề phần nào đó anh	\N	\N	\N	{}	2026-08-29 08:15:44.039	2026-08-29 08:15:44.039
a95587e8-08f1-424e-900e-50122b059aea	4a9cc108-beff-4c07-98da-78d36e2dfdf0	545ef296-1135-4885-8e61-89932645af6c	\N	https://res.cloudinary.com/dqxsqiglg/image/upload/v1787991361/hrm/task_attachment/2026-08-29/c855af4d-4f72-49c8-b9aa-82cd37b10eb0.jpg	IMAGE	\N	{}	2026-08-29 08:16:02.856	2026-08-29 08:16:02.856
bbbd65f2-4fc8-4aa6-8a26-393c0afb6e2b	4a9cc108-beff-4c07-98da-78d36e2dfdf0	545ef296-1135-4885-8e61-89932645af6c	Trên cùng bên trái	\N	\N	\N	{}	2026-08-29 08:16:16.828	2026-08-29 08:16:16.828
3337544d-2680-4cbb-8013-9f58f1d1cb6d	4a9cc108-beff-4c07-98da-78d36e2dfdf0	545ef296-1135-4885-8e61-89932645af6c	Lắc quá ae ơi. Phải tìm gói nào rẻ rẻ cho nó mượt mượt tý	\N	\N	\N	{}	2026-08-29 08:16:35.992	2026-08-29 08:16:35.992
2d418642-e52b-44a4-8f87-473a6a8caa10	4a9cc108-beff-4c07-98da-78d36e2dfdf0	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	Rùi em thấy rùi	\N	\N	\N	{}	2026-08-29 08:16:42.29	2026-08-29 08:16:42.29
d85c3b9b-1910-4359-9454-150c1c1a8061	4a9cc108-beff-4c07-98da-78d36e2dfdf0	49098001-4375-47f0-b36d-c8758d8715ff	rẻ có đó nhưng chưa chắc đã mượn mà 	\N	\N	\N	{}	2026-08-29 08:16:59.296	2026-08-29 08:16:59.296
e9646fb4-9c3a-42f9-a460-1a38524898e3	4a9cc108-beff-4c07-98da-78d36e2dfdf0	545ef296-1135-4885-8e61-89932645af6c	Phần cmt ở dưới nữa lệch	https://res.cloudinary.com/dqxsqiglg/image/upload/v1787991425/hrm/task_attachment/2026-08-29/7619879f-ff67-480a-bbea-6e0733f35b33.jpg	IMAGE	\N	{}	2026-08-29 08:17:06.827	2026-08-29 08:17:06.827
fd604455-1712-402e-93c1-22b4df5aa342	4a9cc108-beff-4c07-98da-78d36e2dfdf0	49098001-4375-47f0-b36d-c8758d8715ff	mượt 	\N	\N	\N	{}	2026-08-29 08:17:08.295	2026-08-29 08:17:08.295
8940dca5-b943-4f73-a8f0-dbb07418e3e3	4a9cc108-beff-4c07-98da-78d36e2dfdf0	545ef296-1135-4885-8e61-89932645af6c	Không thể lắc như này được =)))))	\N	\N	\N	{}	2026-08-29 08:17:32.327	2026-08-29 08:17:32.327
59d24ad2-231d-48df-8702-15631cb29db7	4a9cc108-beff-4c07-98da-78d36e2dfdf0	49098001-4375-47f0-b36d-c8758d8715ff	trên web mượt hơn xíu 	\N	\N	\N	{}	2026-08-29 08:17:45.164	2026-08-29 08:17:45.164
a08a1d49-5c2f-4324-9ef2-bc4b769114b8	4a9cc108-beff-4c07-98da-78d36e2dfdf0	49098001-4375-47f0-b36d-c8758d8715ff	nhưng mà anh ơi anh đang thấy đoạn lệch anh cái chi tiết bài đăng thì đúng lệch thaath 	\N	\N	\N	{}	2026-08-29 08:18:19.517	2026-08-29 08:18:19.517
bd4beedb-c2e6-49ca-8d5b-da183a59b343	4a9cc108-beff-4c07-98da-78d36e2dfdf0	545ef296-1135-4885-8e61-89932645af6c	Thử thay ava app sang logo + 2/9 được không em	\N	\N	\N	{}	2026-08-29 08:21:45.318	2026-08-29 08:21:45.318
022ccf6b-4901-4721-942e-33471d3b3e4b	4a9cc108-beff-4c07-98da-78d36e2dfdf0	545ef296-1135-4885-8e61-89932645af6c	Ví dụ sau mình thay đổi ảnh nền của app ấy	\N	\N	\N	{}	2026-08-29 08:21:58.425	2026-08-29 08:21:58.425
859f3160-039f-44fd-9f74-cfe1c446284a	4a9cc108-beff-4c07-98da-78d36e2dfdf0	49098001-4375-47f0-b36d-c8758d8715ff	cái này phải làm trừ truwos anh ơi 	\N	\N	\N	{}	2026-08-29 08:23:16.066	2026-08-29 08:23:16.066
a2a1a90e-0779-4239-8763-678fc797f00e	4a9cc108-beff-4c07-98da-78d36e2dfdf0	545ef296-1135-4885-8e61-89932645af6c	GIPHY_STICKER:https://media3.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3NDJpeHo2aWptd2l2ZzY3YzQ2dTV5bXB5YW80Mjh5dXVraXdqdXVqNiZlcD12MV9zdGlja2Vyc190cmVuZGluZyZjdD1z/7JA8CIHsr0IfYPZpOE/100w.gif	\N	\N	\N	{}	2026-08-29 08:43:08.098	2026-08-29 08:43:08.098
90b9bc24-5b49-4d02-a1bd-9af061d4f488	b41b7beb-4dad-40b9-878e-52c57ce54908	49098001-4375-47f0-b36d-c8758d8715ff	📞 Cuộc gọi thoại (00:07)	\N	\N	\N	{}	2026-08-29 08:43:51.139	2026-08-29 08:43:51.139
9a51c8a9-7f0a-45c3-a18d-1b4fec509077	b41b7beb-4dad-40b9-878e-52c57ce54908	49098001-4375-47f0-b36d-c8758d8715ff	Hello	\N	\N	\N	{}	2026-08-29 08:44:24.782	2026-08-29 08:44:24.782
9bad071d-d06a-4500-bc02-209fc6ee248b	5320a19b-fe16-42ba-8a0a-f58807d15af7	49098001-4375-47f0-b36d-c8758d8715ff	📞 Cuộc gọi thoại nhỡ	\N	\N	\N	{}	2026-08-29 08:45:04.346	2026-08-29 08:45:04.346
d06dd12b-f49f-4e02-b10a-79ee8bb4dd30	4a9cc108-beff-4c07-98da-78d36e2dfdf0	545ef296-1135-4885-8e61-89932645af6c	Dự kiến bao giờ update và fix lỗi xong @Đinh Văn Học	\N	\N	\N	{bea82bc5-c3e5-45d8-bd50-82be7ade4b4c}	2026-08-30 10:06:58.966	2026-08-30 10:06:58.966
a5866224-5e58-42d9-a926-00fbc58fe3e9	4a9cc108-beff-4c07-98da-78d36e2dfdf0	49098001-4375-47f0-b36d-c8758d8715ff	\N	["https://res.cloudinary.com/dqxsqiglg/image/upload/v1788492114/hrm/task_attachment/2026-09-04/403a8a6f-3af0-4239-a2dd-436ee6b01c6d.jpg","https://res.cloudinary.com/dqxsqiglg/image/upload/v1788492114/hrm/task_attachment/2026-09-04/783fb63b-66c6-4c8d-8854-534fa4f4ce2d.jpg","https://res.cloudinary.com/dqxsqiglg/image/upload/v1788492114/hrm/task_attachment/2026-09-04/9ae42146-f0f4-44dd-93b8-cc05a28cbd59.jpg","https://res.cloudinary.com/dqxsqiglg/image/upload/v1788492114/hrm/task_attachment/2026-09-04/99962da0-a99e-4c42-8f4e-3213cfef6a35.jpg","https://res.cloudinary.com/dqxsqiglg/image/upload/v1788492114/hrm/task_attachment/2026-09-04/202b7651-3f04-4508-9c3c-ee1c5db88137.jpg"]	IMAGE_ALBUM	\N	{}	2026-09-04 03:21:55.868	2026-09-04 03:21:55.868
deb29973-db8b-4a87-9f98-a1536199efbc	4a9cc108-beff-4c07-98da-78d36e2dfdf0	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	https://res.cloudinary.com/dqxsqiglg/image/upload/v1788676309/hrm/task_attachment/2026-09-06/49906c1a-f773-496f-8ded-ecafdf95af2f.jpg	IMAGE	\N	{}	2026-09-06 06:31:50.96	2026-09-06 06:31:50.96
983b92b7-8907-444f-8938-a68fcfe37e2c	4a9cc108-beff-4c07-98da-78d36e2dfdf0	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	Bộ đếm h sao nó hồng hồng thí a	\N	\N	\N	{}	2026-09-06 06:32:45.395	2026-09-06 06:32:45.395
a7bf3d79-d47d-459d-a68e-598e789b6fea	4a9cc108-beff-4c07-98da-78d36e2dfdf0	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	Cho nó nổi á	\N	\N	\N	{}	2026-09-06 06:36:44.645	2026-09-06 06:36:44.645
f62456a3-cd4a-4bf0-9764-92d599685ac1	4a9cc108-beff-4c07-98da-78d36e2dfdf0	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	Hahaa	\N	\N	\N	{}	2026-09-06 06:36:48.721	2026-09-06 06:36:48.721
4033bdfb-d097-4a5e-b02e-2df768fcf25c	4a9cc108-beff-4c07-98da-78d36e2dfdf0	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	https://res.cloudinary.com/dqxsqiglg/image/upload/v1788676762/hrm/task_attachment/2026-09-06/5732e75d-765c-4f01-bf77-284bf2396147.jpg	IMAGE	\N	{}	2026-09-06 06:39:23.336	2026-09-06 06:39:23.336
9085f4f9-9397-47cd-8aeb-e97da9c6fe56	4a9cc108-beff-4c07-98da-78d36e2dfdf0	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	Đây nó như này	\N	\N	\N	{}	2026-09-06 06:39:26.131	2026-09-06 06:39:26.131
3e7212dc-23e8-4fa3-98f0-04d13ee4b503	4a9cc108-beff-4c07-98da-78d36e2dfdf0	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	Sao cục vân nó khác khác thế a	\N	\N	\N	{}	2026-09-06 06:43:57.028	2026-09-06 06:43:57.028
6bcaad44-4f10-4c4e-b2ff-90621610b67b	4a9cc108-beff-4c07-98da-78d36e2dfdf0	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	Nó cũm hơn hơu ảo	\N	\N	\N	{}	2026-09-06 07:26:36.98	2026-09-06 07:26:36.98
2b09ad74-6f00-4437-933b-89895c08b139	4a9cc108-beff-4c07-98da-78d36e2dfdf0	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	Nhưng khum sao	\N	\N	\N	{}	2026-09-06 07:26:51.768	2026-09-06 07:26:51.768
b83afb2c-daf8-4fe9-a3ea-b70101943278	4a9cc108-beff-4c07-98da-78d36e2dfdf0	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	["https://res.cloudinary.com/dqxsqiglg/image/upload/v1788769747/hrm/task_attachment/2026-09-07/5697d065-2fe4-4a64-a921-636774c025c6.jpg","https://res.cloudinary.com/dqxsqiglg/image/upload/v1788769747/hrm/task_attachment/2026-09-07/ea72b076-e269-4684-ab32-92165222c111.jpg"]	IMAGE_ALBUM	\N	{}	2026-09-07 08:29:10.042	2026-09-07 08:29:10.042
6babddfa-1eb2-49f9-935f-61ca26eebcbb	4a9cc108-beff-4c07-98da-78d36e2dfdf0	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	Hi	\N	\N	\N	{}	2026-09-09 09:41:39.944	2026-09-09 09:41:39.944
d3825ee5-ccee-4167-b624-3502b8e3ee48	4a9cc108-beff-4c07-98da-78d36e2dfdf0	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	Hello	\N	\N	\N	{}	2026-09-09 09:41:56.978	2026-09-09 09:41:56.978
a6034d65-160a-408d-8d9b-ea1bfcec1902	4a9cc108-beff-4c07-98da-78d36e2dfdf0	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	https://res.cloudinary.com/dqxsqiglg/image/upload/v1788946935/hrm/task_attachment/2026-09-09/17401acd-171e-45c1-a79f-ac6e11969bd8.jpg	IMAGE	\N	{}	2026-09-09 09:42:18.612	2026-09-09 09:42:18.612
56c75f04-ba1c-402d-889e-e5913e21dc93	4a9cc108-beff-4c07-98da-78d36e2dfdf0	545ef296-1135-4885-8e61-89932645af6c	Có bánh gì ăn à	\N	\N	\N	{}	2026-09-09 09:42:24.084	2026-09-09 09:42:24.084
33c0305c-eedc-4c60-acb1-c40edafa3fcd	4a9cc108-beff-4c07-98da-78d36e2dfdf0	545ef296-1135-4885-8e61-89932645af6c	Vẫn lag ae ơi	\N	\N	\N	{}	2026-09-09 09:42:31.565	2026-09-09 09:42:31.565
77d57a1b-e355-4289-877e-7629071b293f	4a9cc108-beff-4c07-98da-78d36e2dfdf0	49098001-4375-47f0-b36d-c8758d8715ff	Em đang test cái vps mới xem sao	\N	\N	\N	{}	2026-09-09 09:43:45.812	2026-09-09 09:43:45.812
79bc04a8-1c4b-47ce-9655-51b71eaaaee1	4a9cc108-beff-4c07-98da-78d36e2dfdf0	49098001-4375-47f0-b36d-c8758d8715ff	Nó vẫn hơi chậm anh nhỉ	\N	\N	\N	{}	2026-09-09 09:44:04.052	2026-09-09 09:44:04.052
ec439dd4-9fdd-4871-817f-cd4b2b1ef44a	4a9cc108-beff-4c07-98da-78d36e2dfdf0	49098001-4375-47f0-b36d-c8758d8715ff	Em đang dc test cái vps mới	\N	\N	\N	{}	2026-09-09 09:47:15.531	2026-09-09 09:47:15.531
ca402e6d-0196-4b76-96b7-8f9d1b716fc9	4a9cc108-beff-4c07-98da-78d36e2dfdf0	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	Alo	\N	\N	\N	{}	2026-09-09 09:49:56.394	2026-09-09 09:49:56.394
6e4406ef-5f26-468b-baa3-692bec1ad4e8	4a9cc108-beff-4c07-98da-78d36e2dfdf0	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	Hello	\N	\N	\N	{}	2026-09-09 09:50:02.811	2026-09-09 09:50:02.811
a20e37b2-fe6d-4f2e-94cf-5601aa7947c4	4a9cc108-beff-4c07-98da-78d36e2dfdf0	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	Anh em thấy nhanh hơn ko	\N	\N	\N	{}	2026-09-09 09:50:08.986	2026-09-09 09:50:08.986
3fb9fd62-e63a-4e17-a1f2-94bacabd3d09	4a9cc108-beff-4c07-98da-78d36e2dfdf0	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	Hello	\N	\N	\N	{}	2026-09-09 09:50:12.623	2026-09-09 09:50:12.623
571eddec-bd44-4ef2-a156-2e2ef5923b15	4a9cc108-beff-4c07-98da-78d36e2dfdf0	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	https://res.cloudinary.com/dqxsqiglg/image/upload/v1788947416/hrm/task_attachment/2026-09-09/5fd986f1-6df7-42cc-9a7f-813af5499f0a.jpg	IMAGE	\N	{}	2026-09-09 09:50:19.2	2026-09-09 09:50:19.2
5f8413e6-2188-4fc0-ad06-0869c490eef9	4a9cc108-beff-4c07-98da-78d36e2dfdf0	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	Alu	\N	\N	\N	{}	2026-09-09 09:50:50.689	2026-09-09 09:50:50.689
fcd079c9-8a3d-4255-b762-e4e701847d80	4a9cc108-beff-4c07-98da-78d36e2dfdf0	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	Alo	\N	\N	\N	{}	2026-09-09 09:51:11.215	2026-09-09 09:51:11.215
88151216-a004-4d9b-aa4a-7706ee1c6508	4a9cc108-beff-4c07-98da-78d36e2dfdf0	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	Alu	\N	\N	\N	{}	2026-09-09 09:51:23.447	2026-09-09 09:51:23.447
a4ddb58a-a11b-456d-a881-76ebb13cb280	4a9cc108-beff-4c07-98da-78d36e2dfdf0	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	Bjg	\N	\N	\N	{}	2026-09-09 09:51:27.805	2026-09-09 09:51:27.805
008a419f-ab08-4bee-a304-3289db3502b6	4a9cc108-beff-4c07-98da-78d36e2dfdf0	545ef296-1135-4885-8e61-89932645af6c	Anh thấy	\N	\N	\N	{}	2026-09-09 09:51:37.976	2026-09-09 09:51:37.976
1c2a3d2c-6f83-4edc-bbb0-b0aa41c65f91	4a9cc108-beff-4c07-98da-78d36e2dfdf0	545ef296-1135-4885-8e61-89932645af6c	Mà vẫn lag	\N	\N	\N	{}	2026-09-09 09:51:40.914	2026-09-09 09:51:40.914
3a7e85ee-1ee8-4a6e-947f-bdfe0001f6ff	4a9cc108-beff-4c07-98da-78d36e2dfdf0	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	Của anh bản cũ	\N	\N	\N	{}	2026-09-09 09:52:00.266	2026-09-09 09:52:00.266
db12d664-a039-4d63-acae-9f15bc24307b	4a9cc108-beff-4c07-98da-78d36e2dfdf0	545ef296-1135-4885-8e61-89932645af6c	À uh	\N	\N	\N	{}	2026-09-09 09:52:42.327	2026-09-09 09:52:42.327
566044b6-48e7-4e6a-b73e-35de39e2a441	4a9cc108-beff-4c07-98da-78d36e2dfdf0	545ef296-1135-4885-8e61-89932645af6c	Gửi apk cho anh. Xíu anh test	\N	\N	\N	{}	2026-09-09 09:52:52.563	2026-09-09 09:52:52.563
4ac42d5c-acc7-44b3-8066-08eb295fa870	4a9cc108-beff-4c07-98da-78d36e2dfdf0	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	Alu mn	\N	\N	\N	{}	2026-09-09 09:54:03.721	2026-09-09 09:54:03.721
1da68907-9629-4f20-a58a-d1f3a99e4b2b	4a9cc108-beff-4c07-98da-78d36e2dfdf0	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	Test 1	\N	\N	\N	{}	2026-09-09 09:54:21.443	2026-09-09 09:54:21.443
856ea378-3287-4dbd-ad22-4a2c4a02c4ba	4a9cc108-beff-4c07-98da-78d36e2dfdf0	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	Alu	\N	\N	\N	{}	2026-09-09 09:54:28.56	2026-09-09 09:54:28.56
5c2e83d9-0478-4146-87a0-fe20537a3e27	4a9cc108-beff-4c07-98da-78d36e2dfdf0	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	Test 2	\N	\N	\N	{}	2026-09-09 09:55:46.492	2026-09-09 09:55:46.492
e0b2b834-352f-4ab4-8efd-466431aff0db	4a9cc108-beff-4c07-98da-78d36e2dfdf0	545ef296-1135-4885-8e61-89932645af6c	Thêm cho anh cái tắt thông báo cho admin nhé	\N	\N	\N	{}	2026-09-09 09:56:16.856	2026-09-09 09:56:16.856
275d55ed-614c-45f6-baa8-880038e57486	4a9cc108-beff-4c07-98da-78d36e2dfdf0	545ef296-1135-4885-8e61-89932645af6c	Nhưng @ thì vẫn nổi nên	\N	\N	\N	{}	2026-09-09 09:56:24.686	2026-09-09 09:56:24.686
fbc72689-4d92-4a72-9c5a-c9b432866741	4a9cc108-beff-4c07-98da-78d36e2dfdf0	49098001-4375-47f0-b36d-c8758d8715ff	Test 4	\N	\N	\N	{}	2026-09-09 10:04:29.015	2026-09-09 10:04:29.015
626f968e-7fe6-4520-8bda-4501faf7982b	4a9cc108-beff-4c07-98da-78d36e2dfdf0	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	Helli	\N	\N	\N	{}	2026-09-09 10:06:24.569	2026-09-09 10:06:24.569
cd3c9888-6fa2-465d-bbfb-df040fcc24c6	4a9cc108-beff-4c07-98da-78d36e2dfdf0	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	Hello	\N	\N	\N	{}	2026-09-09 10:06:33.572	2026-09-09 10:06:33.572
423a808d-97b9-4c8c-8eb6-721d0f6c7304	4a9cc108-beff-4c07-98da-78d36e2dfdf0	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	Hello	\N	\N	\N	{}	2026-09-09 10:06:47.354	2026-09-09 10:06:47.354
e7c3ae13-70e2-4a04-a226-5f753d8f26a3	4a9cc108-beff-4c07-98da-78d36e2dfdf0	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	Hello	\N	\N	\N	{}	2026-09-09 10:07:42.972	2026-09-09 10:07:42.972
bea9f81f-05fb-4b89-b24b-5953f5a6728a	66a56333-980e-4439-9763-7588f3f4b52e	49098001-4375-47f0-b36d-c8758d8715ff	📞 Cuộc gọi thoại nhỡ	\N	\N	\N	{}	2026-09-09 10:13:43.057	2026-09-09 10:13:43.057
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.companies (id, code, name, description, "isActive", "createdAt", "updatedAt", "deletedAt") FROM stdin;
034d3d0b-83ea-42d8-bcd5-a6ae99cd0cc6	MOVIE_LEGEND	Movie Legend	\N	t	2026-08-19 03:59:39.708	2026-08-19 03:59:39.708	\N
\.


--
-- Data for Name: company_holidays; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.company_holidays (id, "companyId", date, name, "createdAt") FROM stdin;
\.


--
-- Data for Name: contract_signatures; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contract_signatures (id, "contractId", "signerUserId", "signerRole", "signatureType", "signatureImageUrl", "signatureDataHash", "signedDocumentHash", "ipAddress", "deviceInfo", "signedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: contract_template_versions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contract_template_versions (id, "contractTemplateId", "versionNumber", "templateFileUrl", "storageKey", "contentHash", "mappingConfig", "createdById", "createdAt") FROM stdin;
\.


--
-- Data for Name: contract_templates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contract_templates (id, "companyId", code, name, "contractType", description, "templateFileUrl", "storageKey", version, "isActive", "createdById", "createdAt", "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: cross_department_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cross_department_requests (id, "requestCode", "taskId", "createdByUserId", "assignedToUserId", "sourceDepartmentId", "targetDepartmentId", title, content, priority, "dueAt", progress, status, "decidedByUserId", "decidedAt", "rejectionReason", "resultSummary", rating, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: department_competition_configs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.department_competition_configs (id, "departmentId", "metricName", "targetValue", unit, period, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: department_documents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.department_documents (id, "companyId", "departmentId", title, description, category, "fileName", "fileUrl", "storageKey", "mimeType", "fileSize", "uploadedById", "createdAt", "updatedAt", "deletedAt") FROM stdin;
63770387-32a5-48f3-9ab3-c9d0c663edfb	034d3d0b-83ea-42d8-bcd5-a6ae99cd0cc6	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	tai lieu mau	\N	QUY_DINH	tai_lieu_mau.pdf	/uploads/employee_document/2026-09-09/7d1a506d-1e53-4824-a2cb-210015a5e519.pdf	\N	application/pdf	26963	d5f49e78-0b72-4304-8413-b90446ced4a0	2026-09-09 06:36:09.183	2026-09-09 06:36:09.183	\N
1a42c855-5a90-4d70-a637-9275b213deb8	034d3d0b-83ea-42d8-bcd5-a6ae99cd0cc6	\N	Đề ôn tập Hệ quản trị CSDL  1 16 (1)	\N	QUY_DINH	Đề ôn tập Hệ quản trị CSDL _1_16 (1).docx	https://res.cloudinary.com/dqxsqiglg/raw/upload/v1788940995/hrm/employee_document/2026-09-09/a5afcacd-1743-43b2-ba5f-89dd076ae34d.docx	\N	application/vnd.openxmlformats-officedocument.wordprocessingml.document	21021	49098001-4375-47f0-b36d-c8758d8715ff	2026-09-09 08:03:17.7	2026-09-09 08:03:17.7	\N
cdb3d292-d090-4381-ac95-c196f7862511	034d3d0b-83ea-42d8-bcd5-a6ae99cd0cc6	\N	Đề ôn tập Hệ quản trị CSDL  1 16 (1)	\N	QUY_DINH	Đề ôn tập Hệ quản trị CSDL _1_16 (1).docx	https://res.cloudinary.com/dqxsqiglg/raw/upload/v1788941049/hrm/employee_document/2026-09-09/32a97e5d-0f79-497b-92fb-2cc024db9f44.docx	\N	application/vnd.openxmlformats-officedocument.wordprocessingml.document	21021	49098001-4375-47f0-b36d-c8758d8715ff	2026-09-09 08:04:10.647	2026-09-09 08:05:20.471	2026-09-09 08:05:20.47
4623e310-0d55-4259-89cd-fee906e45f28	034d3d0b-83ea-42d8-bcd5-a6ae99cd0cc6	\N	Đề ôn tập Hệ quản trị CSDL  1 16 (1)	\N	QUY_DINH	Đề ôn tập Hệ quản trị CSDL _1_16 (1).docx	https://res.cloudinary.com/dqxsqiglg/raw/upload/v1788941045/hrm/employee_document/2026-09-09/06f4145a-ce33-415d-b5b8-f24e5db72929.docx	\N	application/vnd.openxmlformats-officedocument.wordprocessingml.document	21021	49098001-4375-47f0-b36d-c8758d8715ff	2026-09-09 08:04:06.397	2026-09-09 08:05:23.594	2026-09-09 08:05:23.593
f8134deb-cb36-4940-91a0-1141092a7b94	034d3d0b-83ea-42d8-bcd5-a6ae99cd0cc6	\N	Đề ôn tập Hệ quản trị CSDL  1 16 (1)	\N	QUY_DINH	Đề ôn tập Hệ quản trị CSDL _1_16 (1).docx	https://res.cloudinary.com/dqxsqiglg/raw/upload/v1788941012/hrm/employee_document/2026-09-09/ebe15723-07be-444a-916b-41e428665d5d.docx	\N	application/vnd.openxmlformats-officedocument.wordprocessingml.document	21021	49098001-4375-47f0-b36d-c8758d8715ff	2026-09-09 08:03:33.634	2026-09-09 08:05:26.649	2026-09-09 08:05:26.648
7087f8c4-9852-42b0-8323-c670e40816ac	034d3d0b-83ea-42d8-bcd5-a6ae99cd0cc6	\N	Đề ôn tập Hệ quản trị CSDL  1 16 (1)	\N	QUY_DINH	Đề ôn tập Hệ quản trị CSDL _1_16 (1).docx	https://res.cloudinary.com/dqxsqiglg/raw/upload/v1788941006/hrm/employee_document/2026-09-09/0efa13fe-4b4c-42c4-a230-cb187694986a.docx	\N	application/vnd.openxmlformats-officedocument.wordprocessingml.document	21021	49098001-4375-47f0-b36d-c8758d8715ff	2026-09-09 08:03:27.591	2026-09-09 08:05:29.499	2026-09-09 08:05:29.498
9d411539-1099-4854-b575-b66bf93bf528	034d3d0b-83ea-42d8-bcd5-a6ae99cd0cc6	\N	Điện Toán Đám Mây	\N	QUY_DINH	Điện Toán Đám Mây.docx	https://res.cloudinary.com/dqxsqiglg/raw/upload/v1788941151/hrm/employee_document/2026-09-09/eeb42277-c3b0-4c68-97f5-97f1adbc32b6.docx	\N	application/vnd.openxmlformats-officedocument.wordprocessingml.document	115762	49098001-4375-47f0-b36d-c8758d8715ff	2026-09-09 08:05:53.326	2026-09-09 08:05:53.326	\N
34b0400b-cc5d-4340-a94e-7c72296279fd	034d3d0b-83ea-42d8-bcd5-a6ae99cd0cc6	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	bang cham cong 2026 09 09	\N	QUY_DINH	bang-cham-cong-2026-09-09.xlsx	https://res.cloudinary.com/dqxsqiglg/raw/upload/v1788941174/hrm/employee_document/2026-09-09/79f702e2-e6fb-4e1f-adb2-f3aff1718fb1.xlsx	\N	application/vnd.openxmlformats-officedocument.spreadsheetml.sheet	15275	d5f49e78-0b72-4304-8413-b90446ced4a0	2026-09-09 08:06:16.16	2026-09-09 08:06:16.16	\N
1414e16d-bfb9-4a03-b3ec-235875692f23	034d3d0b-83ea-42d8-bcd5-a6ae99cd0cc6	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	tai lieu mau	\N	QUY_DINH	tai_lieu_mau.docx	https://res.cloudinary.com/dqxsqiglg/raw/upload/v1788941580/hrm/employee_document/2026-09-09/c1cb3961-2645-4216-9051-219a7546fa87.docx	\N	application/vnd.openxmlformats-officedocument.wordprocessingml.document	37760	d5f49e78-0b72-4304-8413-b90446ced4a0	2026-09-09 08:13:02.745	2026-09-09 08:13:02.745	\N
a8308339-43d7-4c56-97e4-3576675f3b43	034d3d0b-83ea-42d8-bcd5-a6ae99cd0cc6	\N	Screenshot 2026 07 31 17 45 37 29 f73b71075b1de7323614b647fe394240	\N	QUY_DINH	Screenshot_2026-07-31-17-45-37-29_f73b71075b1de7323614b647fe394240.jpg	https://res.cloudinary.com/dqxsqiglg/image/upload/v1788942082/hrm/employee_document/2026-09-09/fc69cc9e-ac15-497e-9a91-2fed2813a622.jpg	\N	image/jpeg	281024	49098001-4375-47f0-b36d-c8758d8715ff	2026-09-09 08:21:24.349	2026-09-09 08:21:24.349	\N
\.


--
-- Data for Name: department_level_configs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.department_level_configs (id, "departmentId", "levelNumber", "customLevelName", "badgeTitle", "createdAt", "updatedAt") FROM stdin;
42220262-f145-4358-8868-948a7ef91721	6cde681e-47b5-47b0-a29c-ff13c66dba82	1	Thực tập sinh Kinh doanh	Intern	2026-09-08 04:23:57.331	2026-09-08 04:23:57.331
eb39bbef-862e-4884-8128-e45bf73060cc	6cde681e-47b5-47b0-a29c-ff13c66dba82	2	Chuyên viên Sales / Livestream	Sales / Host	2026-09-08 04:23:57.511	2026-09-08 04:23:57.511
168ff28e-62cd-4eb8-8c8e-dbbcdf134e22	6cde681e-47b5-47b0-a29c-ff13c66dba82	3	Chuyên viên Kinh doanh Senior	Senior Sales	2026-09-08 04:23:57.692	2026-09-08 04:23:57.692
31609dbb-3273-41f1-a987-f5aeb077a57a	6cde681e-47b5-47b0-a29c-ff13c66dba82	4	Key Account Manager (KAM)	KAM	2026-09-08 04:23:57.874	2026-09-08 04:23:57.874
4a9ffdad-daf4-4f4b-9a8e-b54f16b979c7	6cde681e-47b5-47b0-a29c-ff13c66dba82	5	Trưởng nhóm Kinh doanh (Leader)	Sales Leader	2026-09-08 04:23:58.055	2026-09-08 04:23:58.055
a643c616-9b9b-4220-ab7c-cff7f02b0bb8	6cde681e-47b5-47b0-a29c-ff13c66dba82	6	Trưởng phòng Kinh doanh	Sales Manager	2026-09-08 04:23:58.238	2026-09-08 04:23:58.238
824285df-dcbf-4402-93f6-c62d11aa1e99	6cde681e-47b5-47b0-a29c-ff13c66dba82	7	Giám đốc Kinh doanh (CCO)	CCO	2026-09-08 04:23:58.419	2026-09-08 04:23:58.419
3bf6a83d-c96b-47eb-949c-71c8882559d6	6cde681e-47b5-47b0-a29c-ff13c66dba82	8	Giám đốc Điều hành Khối	Executive	2026-09-08 04:23:58.6	2026-09-08 04:23:58.6
c38f833d-8f71-474f-b080-bfaa9ff9eec7	030f43ca-3197-4b77-a2ca-3b6967292e69	1	Thực tập sinh Vận hành	Intern	2026-09-08 04:23:58.785	2026-09-08 04:23:58.785
01265b3e-e071-4aaa-9bf7-e9d10e820a36	030f43ca-3197-4b77-a2ca-3b6967292e69	2	Nhân viên Điều phối Vận hành	Vận hành viên	2026-09-08 04:23:58.969	2026-09-08 04:23:58.969
b96a58f7-979f-41ed-bf5c-ec719110b177	030f43ca-3197-4b77-a2ca-3b6967292e69	3	Chuyên viên Vận hành Luồng ca	Senior Vận hành	2026-09-08 04:23:59.152	2026-09-08 04:23:59.152
5bb7e93c-f66b-4688-9827-ab4e9bd06c51	030f43ca-3197-4b77-a2ca-3b6967292e69	4	Điều phối viên Vận hành Cấp cao	Key Operations	2026-09-08 04:23:59.334	2026-09-08 04:23:59.334
a34ef86f-c75a-4dfc-90e7-60084e9ebc67	030f43ca-3197-4b77-a2ca-3b6967292e69	5	Trưởng nhóm Vận hành (Leader)	Ops Leader	2026-09-08 04:23:59.515	2026-09-08 04:23:59.515
f57425ee-c52a-461f-a1e9-47f5c774386b	030f43ca-3197-4b77-a2ca-3b6967292e69	6	Trưởng phòng Vận hành (COO)	Ops Manager	2026-09-08 04:23:59.704	2026-09-08 04:23:59.704
046e4f13-73ac-4013-9adb-a1f8108ebb0c	030f43ca-3197-4b77-a2ca-3b6967292e69	7	Giám đốc Khối Vận hành	Director	2026-09-08 04:23:59.885	2026-09-08 04:23:59.885
181c6b07-4e27-4243-af09-7837004db18a	030f43ca-3197-4b77-a2ca-3b6967292e69	8	Giám đốc Điều hành Khối	Executive	2026-09-08 04:24:00.068	2026-09-08 04:24:00.068
cf32f5b1-cc8b-4c49-8ee2-7ae4308e2501	15cc071a-269e-44e1-ab43-f2d00144e2d6	1	Phụ kho thử việc	Thử việc	2026-09-08 04:24:00.248	2026-09-08 04:24:00.248
3d4f816a-1053-465f-89c5-3eb9f7b1e53e	15cc071a-269e-44e1-ab43-f2d00144e2d6	2	Nhân viên Kho chính thức	Nhân viên Kho	2026-09-08 04:24:00.429	2026-09-08 04:24:00.429
d1b43e19-73af-499c-8c88-acad4a007b36	15cc071a-269e-44e1-ab43-f2d00144e2d6	3	Kỹ thuật viên Phân loại & Đóng gói	KTV Kho	2026-09-08 04:24:00.609	2026-09-08 04:24:00.609
ad73614c-e210-4301-9514-da44bca91a17	15cc071a-269e-44e1-ab43-f2d00144e2d6	4	Điều phối viên Quản lý Ca kho	Quản lý Ca	2026-09-08 04:24:00.791	2026-09-08 04:24:00.791
38828ca3-3dc3-4d5b-9dbd-ac0a6dfc5b79	15cc071a-269e-44e1-ab43-f2d00144e2d6	5	Trưởng nhóm Kho (Leader)	Leader Kho	2026-09-08 04:24:00.972	2026-09-08 04:24:00.972
ac0ebdd3-e4d6-4e81-a89b-f43f14e4872b	15cc071a-269e-44e1-ab43-f2d00144e2d6	6	Quản lý Tổng Kho	Kho Manager	2026-09-08 04:24:01.154	2026-09-08 04:24:01.154
74e5384e-2e65-4758-ada4-26c96f6c890a	15cc071a-269e-44e1-ab43-f2d00144e2d6	7	Giám đốc Vận hành Kho vận	Director	2026-09-08 04:24:01.34	2026-09-08 04:24:01.34
d0ecd936-a94f-409d-9e6a-b29e3b1fe149	15cc071a-269e-44e1-ab43-f2d00144e2d6	8	Giám đốc Điều hành Khối	Executive	2026-09-08 04:24:01.539	2026-09-08 04:24:01.539
1a474549-6697-4853-8f18-6b60399893c2	87b23453-0ae2-4e2c-a50e-1123e789654e	1	Học việc Kỹ thuật	Thực tập	2026-09-08 04:24:01.722	2026-09-08 04:24:01.722
f4337be6-b4dc-4691-add0-4bab036c20c6	87b23453-0ae2-4e2c-a50e-1123e789654e	2	Kỹ thuật viên Thiết bị & Setup	KTV	2026-09-08 04:24:01.904	2026-09-08 04:24:01.904
b3841601-97ba-4996-bb2e-34a1378c1995	87b23453-0ae2-4e2c-a50e-1123e789654e	3	Kỹ thuật viên Senior	Senior KTV	2026-09-08 04:24:02.089	2026-09-08 04:24:02.089
055de7e5-51fc-473e-a287-fda641f49629	87b23453-0ae2-4e2c-a50e-1123e789654e	4	Chuyên viên Giải pháp Kỹ thuật	Specialist	2026-09-08 04:24:02.275	2026-09-08 04:24:02.275
03ded025-438e-42a3-b071-4ea4a80b6dbd	87b23453-0ae2-4e2c-a50e-1123e789654e	5	Trưởng nhóm Kỹ thuật (Leader)	Tech Leader	2026-09-08 04:24:02.456	2026-09-08 04:24:02.456
5a6bfeba-7bf2-4854-86a9-005bac5f7121	87b23453-0ae2-4e2c-a50e-1123e789654e	6	Quản đốc Kỹ thuật & Hạ tầng	Kỹ thuật Manager	2026-09-08 04:24:02.638	2026-09-08 04:24:02.638
f356d577-a1d3-4337-a2f8-4da65d0b7e38	87b23453-0ae2-4e2c-a50e-1123e789654e	7	Giám đốc Kỹ thuật	Director	2026-09-08 04:24:02.82	2026-09-08 04:24:02.82
3821ef9a-0730-441c-ba68-f4005a321f80	87b23453-0ae2-4e2c-a50e-1123e789654e	8	Giám đốc Điều hành Khối	Executive	2026-09-08 04:24:03.002	2026-09-08 04:24:03.002
948c39f0-12b2-43e7-9717-e7058a9199b3	d7029d8b-7f8a-4085-bc8e-63a4ffb7ba70	1	Thực tập sinh Kế toán	Intern	2026-09-08 04:24:04.639	2026-09-08 04:24:04.639
633fc625-234d-440f-a278-80e74f4af7bc	d7029d8b-7f8a-4085-bc8e-63a4ffb7ba70	2	Kế toán viên	Accountant	2026-09-08 04:24:04.824	2026-09-08 04:24:04.824
9b1bd627-97f1-43f4-8fca-4720d977b6ea	d7029d8b-7f8a-4085-bc8e-63a4ffb7ba70	3	Kế toán tổng hợp	Senior Accountant	2026-09-08 04:24:05.034	2026-09-08 04:24:05.034
cd313c47-9111-44b8-b6f7-d40a9e133243	d7029d8b-7f8a-4085-bc8e-63a4ffb7ba70	4	Kiểm soát nội bộ / Thuế	Internal Auditor	2026-09-08 04:24:05.218	2026-09-08 04:24:05.218
e60f47d5-1ccb-46c6-a4f2-d887634241f5	d7029d8b-7f8a-4085-bc8e-63a4ffb7ba70	5	Kế toán trưởng (Leader)	Chief Accountant	2026-09-08 04:24:05.402	2026-09-08 04:24:05.402
89245df3-72fb-4106-bcbd-65886f34c272	d7029d8b-7f8a-4085-bc8e-63a4ffb7ba70	6	Quản lý Tài chính Kế toán	Finance Manager	2026-09-08 04:24:05.585	2026-09-08 04:24:05.585
621af9c6-6bf5-4b53-ad1c-5d73fdb4c4b6	d7029d8b-7f8a-4085-bc8e-63a4ffb7ba70	7	Giám đốc Tài chính (CFO)	CFO	2026-09-08 04:24:05.774	2026-09-08 04:24:05.774
ed92c6bb-5a7b-4dc3-a83b-cfb0e4bf9aab	d7029d8b-7f8a-4085-bc8e-63a4ffb7ba70	8	Giám đốc Điều hành Khối	Executive	2026-09-08 04:24:05.956	2026-09-08 04:24:05.956
4d4f1bf6-b924-4d98-ab1f-9ba52965a7cc	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	1	Thực tập sinh Dev	Intern Dev	2026-09-08 04:23:55.686	2026-09-08 10:16:37.603
246d4848-551b-4201-8482-236ea50881c6	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	2	Lập trình viên Junior	Junior Dev	2026-09-08 04:23:56.06	2026-09-08 10:16:37.603
4e423915-0e7d-48d9-bf00-078d3fdd60f3	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	3	Lập trình viên Middle	Middle Dev	2026-09-08 04:23:56.24	2026-09-08 10:16:37.603
00973ee4-2986-43a1-9c94-328868dc463a	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	4	Lập trình viên Senior	Senior Dev	2026-09-08 04:23:56.421	2026-09-08 10:16:37.603
80e81843-7ebb-40eb-9bbf-f5ddfce4b55e	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	5	Tech Lead	Tech Lead	2026-09-08 04:23:56.602	2026-09-08 10:16:37.603
b6a11d49-ea35-49b0-b1bc-449642d97e33	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	6	Engineering Manager	Eng Manager	2026-09-08 04:23:56.782	2026-09-08 10:16:37.603
5fcb7dd3-2cd9-405a-b609-9b856afdd6e5	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	7	Head of Technology	Head of Tech	2026-09-08 04:23:56.967	2026-09-08 10:16:37.603
8da131c3-02bc-46c0-a7d4-946bc331b692	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	8	Chief Technology Officer (CTO)	CTO / Exec	2026-09-08 04:23:57.149	2026-09-08 10:16:37.603
cef76d32-462b-4e05-96cd-1fb7d3388f9f	15c385cd-c45a-4d00-997b-a98c05615b41	1	Thực tập sinh HR	HR Intern	2026-09-08 04:24:03.185	2026-09-08 10:10:15.655
e62a690c-4fbf-4813-a7d5-f8b5e90a6ae1	15c385cd-c45a-4d00-997b-a98c05615b41	2	Chuyên viên Tuyển dụng / C&B	HR Specialist	2026-09-08 04:24:03.368	2026-09-08 10:10:15.655
13a7d43d-d4f7-42a5-a986-f4bc76e9e3e7	15c385cd-c45a-4d00-997b-a98c05615b41	3	Chuyên viên Nhân sự Senior	Senior HR	2026-09-08 04:24:03.551	2026-09-08 10:10:15.655
f9ff4010-3a94-4b66-8305-7fb77caf217a	15c385cd-c45a-4d00-997b-a98c05615b41	4	HR Key Partner	HR Key Partner	2026-09-08 04:24:03.734	2026-09-08 10:10:15.655
52fc4c47-1ee8-49f1-b431-a8598e87a226	15c385cd-c45a-4d00-997b-a98c05615b41	5	Trưởng nhóm Nhân sự (Leader)	HR Leader	2026-09-08 04:24:03.916	2026-09-08 10:10:15.655
5d3e4015-c98e-40fd-beb1-a8d1f49d5b40	15c385cd-c45a-4d00-997b-a98c05615b41	6	Trưởng phòng Hành Chính Nhân Sự	HR Manager	2026-09-08 04:24:04.097	2026-09-08 10:10:15.655
1a563f67-4087-4628-9dcf-845852f3843e	15c385cd-c45a-4d00-997b-a98c05615b41	7	Giám đốc Nhân sự (CHRO)	CHRO	2026-09-08 04:24:04.276	2026-09-08 10:10:15.655
218f7a6c-a527-4ce2-9e3f-a5083ae291e8	15c385cd-c45a-4d00-997b-a98c05615b41	8	Giám đốc Điều hành Khối	Executive	2026-09-08 04:24:04.458	2026-09-08 10:10:15.655
\.


--
-- Data for Name: department_members; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.department_members (id, "departmentId", "userId", "positionId", "isPrimary", "joinedAt", "leftAt", "createdAt", "updatedAt") FROM stdin;
58baa8c4-ad4a-4ee8-83db-faeee4b81ef9	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	t	2026-08-19 11:29:35.881	\N	2026-08-19 11:29:35.881	2026-08-19 11:29:35.881
71d28dcb-eb6e-4ede-a8cc-1ddd0a6660e1	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	t	2026-08-20 02:08:52.715	\N	2026-08-20 02:08:52.715	2026-08-20 02:08:52.715
cac08c67-a88d-414b-869f-e451ab6e1389	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	t	2026-08-20 02:34:39.455	\N	2026-08-20 02:34:39.455	2026-08-20 02:34:39.455
4ecbc074-9869-46f7-a047-78ee38fe659d	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	545ef296-1135-4885-8e61-89932645af6c	\N	t	2026-08-29 04:54:43.521	\N	2026-08-29 04:54:43.521	2026-08-29 04:54:43.521
f23e33ac-3f65-43af-b2e1-eb43b54d7858	6cde681e-47b5-47b0-a29c-ff13c66dba82	334b2294-9bba-4f31-8290-5a87484a62f0	\N	t	2026-08-29 08:36:48.981	\N	2026-08-29 08:36:48.981	2026-08-29 08:36:48.981
5a7e4340-5b16-40e5-803d-4d9c1506746d	15cc071a-269e-44e1-ab43-f2d00144e2d6	846641e3-667b-4e7f-b505-afdc1d66b54a	\N	t	2026-08-29 08:38:21.72	\N	2026-08-29 08:38:21.72	2026-08-29 08:38:21.72
304d11c0-365c-48ea-85e6-59ec3d275ea4	6cde681e-47b5-47b0-a29c-ff13c66dba82	c2a06e5b-22fd-4862-bf12-8c36f5e07d9c	\N	t	2026-08-29 08:39:28.741	\N	2026-08-29 08:39:28.741	2026-08-29 08:39:28.741
163cafaa-16cf-4126-8b75-c24e80fa3693	15c385cd-c45a-4d00-997b-a98c05615b41	05ff1cc9-4cb6-4d87-a74b-0391a5539537	\N	t	2026-09-06 09:15:45.49	\N	2026-09-06 09:15:45.49	2026-09-06 09:15:45.49
0042c08b-7078-4b42-a829-c5afbd80ebbe	d7029d8b-7f8a-4085-bc8e-63a4ffb7ba70	31bb72f7-e5e2-493e-827d-3320e1054461	\N	t	2026-09-06 11:25:47.97	\N	2026-09-06 11:25:47.97	2026-09-06 11:25:47.97
\.


--
-- Data for Name: department_overtime_configs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.department_overtime_configs (id, "departmentId", "weekdayMultiplier", "weekendMultiplier", "holidayMultiplier", "nightAllowanceAmount", "nightStartHour", "lateDeductionAmount", "lateThresholdMinutes", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.departments (id, "companyId", "branchId", "parentId", code, name, description, "leaderUserId", "isActive", "createdAt", "updatedAt", "deletedAt") FROM stdin;
63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	034d3d0b-83ea-42d8-bcd5-a6ae99cd0cc6	9534ed51-e2bf-4846-84db-1dcb8936fcfa	\N	PB-260819174247	DEV	Công nghệ thông tin 	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	t	2026-08-19 10:42:48.604	2026-08-20 02:15:43.852	\N
6cde681e-47b5-47b0-a29c-ff13c66dba82	034d3d0b-83ea-42d8-bcd5-a6ae99cd0cc6	9534ed51-e2bf-4846-84db-1dcb8936fcfa	\N	PB-260829153428	Kinh Doanh 	Kinh Doanh 	\N	t	2026-08-29 08:34:29.225	2026-08-29 08:34:29.225	\N
030f43ca-3197-4b77-a2ca-3b6967292e69	034d3d0b-83ea-42d8-bcd5-a6ae99cd0cc6	9534ed51-e2bf-4846-84db-1dcb8936fcfa	\N	PB-260829153446	Vận Hành	Vận Hành 	\N	t	2026-08-29 08:34:47.755	2026-08-29 08:34:47.755	\N
15cc071a-269e-44e1-ab43-f2d00144e2d6	034d3d0b-83ea-42d8-bcd5-a6ae99cd0cc6	9534ed51-e2bf-4846-84db-1dcb8936fcfa	\N	PB-260829153505	Kho Xử Lý Hàng Hóa 	Kho Xử Lý Hàng Hóa 	\N	t	2026-08-29 08:35:06.64	2026-08-29 08:35:06.64	\N
87b23453-0ae2-4e2c-a50e-1123e789654e	034d3d0b-83ea-42d8-bcd5-a6ae99cd0cc6	9534ed51-e2bf-4846-84db-1dcb8936fcfa	\N	PB-260829153555	Kỹ Thuật 	Kỹ Thuật 	\N	t	2026-08-29 08:35:56.839	2026-08-29 08:35:56.839	\N
15c385cd-c45a-4d00-997b-a98c05615b41	034d3d0b-83ea-42d8-bcd5-a6ae99cd0cc6	9534ed51-e2bf-4846-84db-1dcb8936fcfa	\N	PB-260829153527	Hành Chính Nhân Sự 	Hành Chính Nhân Sự 	05ff1cc9-4cb6-4d87-a74b-0391a5539537	t	2026-08-29 08:35:28.694	2026-09-06 09:16:04.725	\N
d7029d8b-7f8a-4085-bc8e-63a4ffb7ba70	034d3d0b-83ea-42d8-bcd5-a6ae99cd0cc6	9534ed51-e2bf-4846-84db-1dcb8936fcfa	\N	KT-6165	Kế Toán	Kế Toán	31bb72f7-e5e2-493e-827d-3320e1054461	t	2026-09-06 11:24:16.387	2026-09-06 11:32:57.878	\N
\.


--
-- Data for Name: device_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.device_tokens (id, "userId", "tokenHash", token, platform, "deviceId", "lastSeenAt", "revokedAt", "createdAt", "updatedAt") FROM stdin;
73c5adb0-bf78-46b0-9e9c-d2e973ea8c69	c2a06e5b-22fd-4862-bf12-8c36f5e07d9c	62500fcd08a57474d0db4581cde79dd03f30212ac2b3542dcda5e477ff985322	ExponentPushToken[rvam7kPY3Jn40_xWNYD8Bp]	IOS	ios	2026-08-29 08:44:15.755	\N	2026-08-29 08:39:59.822	2026-08-29 08:44:15.756
44d6a310-0295-46bd-8112-e973fde51dd1	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	67497a19444f7a953ae1d2d9e4923a2a09a6063068f528b500889a0d7f0657ad	ExponentPushToken[u6Di3nLefSxCl0uYf_fv4n]	IOS	ios	2026-09-09 02:12:14.158	2026-09-09 02:37:45.953	2026-08-20 02:09:50.139	2026-09-09 02:37:45.954
d797fd07-e633-4157-97a6-18c7077f6d60	846641e3-667b-4e7f-b505-afdc1d66b54a	dde5af4478b6bb5e7afa48158fde27c123fc60321afc75b22f1113d8d5431e18	ExponentPushToken[f5a8wLIQqfrtm-Z3rNJbeB]	IOS	ios	2026-09-09 08:06:08.408	\N	2026-08-29 08:39:00.533	2026-09-09 08:06:08.409
edc4ba29-27ec-4c20-bdeb-ac25b0b49d55	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	e84c7c395bc5216e8112edac08053855eb66be11db6cefc9597a4cf2f76406af	ExponentPushToken[T99DCkKN0MMjNmpar3qRbC]	ANDROID	android	2026-09-09 09:51:03.418	\N	2026-08-19 11:33:16.067	2026-09-09 09:51:03.418
9ec3219a-ef24-4a5e-98d9-0c910aa45dd4	545ef296-1135-4885-8e61-89932645af6c	fd92d87a27e4b81f4e5fd1351fe81382743d07574e3fd8bcdf87fabb730cfca3	ExponentPushToken[zsV1mvOx__uxO8OMhoBiaY]	IOS	ios	2026-09-09 09:51:19.244	\N	2026-08-29 04:55:37.16	2026-09-09 09:51:19.245
9e176256-de51-4507-8ab9-af428b5db124	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	9c063f308a95eb0b41ab55a50cb702359cf4d3d492b8e95fa60abb32aacb005a	ExponentPushToken[GGy8_hGziys9OhY-WeZHg1]	IOS	ios	2026-09-09 10:04:14.176	\N	2026-08-20 02:34:59.533	2026-09-09 10:04:14.18
f7afac31-8fc3-41c2-9d9f-f864276ffa24	49098001-4375-47f0-b36d-c8758d8715ff	03c0c4995f7c2151a6a087fa69d7a95c0123c1c13be72e3b671386614653df3b	ExponentPushToken[DoywDqHeP4NZsTEkO4LbRf]	IOS	ios	2026-08-23 15:51:29.761	2026-08-27 03:17:37.495	2026-08-23 15:51:29.761	2026-08-27 03:17:37.495
\.


--
-- Data for Name: disciplinary_actions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.disciplinary_actions (id, "violationId", "actionType", amount, description, "effectiveDate", status, "approvedById", "approvedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: document_types; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.document_types (id, "companyId", code, name, description, "requiresExpiryDate", "requiresDocumentNumber", "allowedMimeTypes", "maxFileSize", "isActive", "createdAt", "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: employee_bank_accounts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.employee_bank_accounts (id, "employeeId", "bankName", "accountNumber", "accountName", "isPrimary", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: employee_bonuses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.employee_bonuses (id, "userId", "bonusType", title, description, amount, "effectiveDate", status, "approvedById", "approvedAt", "relatedEntityType", "relatedEntityId", "createdById", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: employee_contracts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.employee_contracts (id, "contractCode", "userId", "contractTemplateId", "contractTemplateVersionId", "contractType", title, "startDate", "endDate", status, "baseSalarySnapshot", "positionSnapshot", "departmentSnapshot", "filledFields", "draftFileUrl", "signedFileUrl", "scannedDocumentUrl", "employeeSignatureUrl", "rejectReason", "createdById", "approvedById", "approvedAt", "employeeSignedAt", "companySignedAt", "effectiveAt", "terminatedAt", "terminationReason", "employeeAcknowledgementStatus", "employeeAcknowledgedAt", "employeeAcknowledgementNote", "employeeAcknowledgedByIp", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: employee_deductions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.employee_deductions (id, "userId", "deductionType", title, description, amount, "effectiveDate", status, "approvedById", "approvedAt", "relatedEntityType", "relatedEntityId", "createdById", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: employee_documents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.employee_documents (id, "employeeId", "userId", "documentTypeId", type, "fileName", "documentNumber", title, description, "issueDate", "expiryDate", "issuedBy", "fileUrl", "storageKey", "mimeType", "fileSize", status, "verifiedById", "verifiedAt", "rejectionReason", "acknowledgementStatus", "acknowledgedAt", "acknowledgementNote", "acknowledgedByIp", "createdAt", "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: employee_kpi_assignments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.employee_kpi_assignments (id, "userId", "kpiTemplateId", "periodStart", "periodEnd", status, "assignedById", "assignedAt", "submittedAt", "reviewedAt", "finalizedAt", "finalScore", snapshot, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: employee_kpi_results; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.employee_kpi_results (id, "employeeKpiAssignmentId", "criteriaId", "targetValue", "actualValue", "employeeScore", "leaderScore", "finalScore", "employeeComment", "leaderComment", "finalComment", "evidenceUrl", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: employee_levels; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.employee_levels (id, "levelNumber", "levelName", "colorHex", "rewardType", "promotionBonusAmount", "physicalItemName", "physicalItemImageUrl", "retentionMultiplier", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: employee_profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.employee_profiles (id, "userId", "fullName", "dateOfBirth", gender, "idCardNumber", "idCardIssueDate", "idCardIssuePlace", "idCardFrontUrl", "idCardBackUrl", "permanentAddress", "temporaryAddress", "avatarUrl", "joinDate", "officialDate", "employmentStatus", "emergencyContactName", "emergencyContactPhone", "positionId", "createdAt", "updatedAt", "currentLevelNumber") FROM stdin;
04db89fb-dfd5-439d-aae5-54b236e37fa6	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	Đoàn Nam Dương	\N	MALE	666666666666	\N	\N	\N	\N	\N	\N	\N	\N	\N	PROBATION	\N	\N	\N	2026-08-20 02:34:22.586	2026-09-08 07:45:31.397	1
abc99408-1d49-4307-b1dd-244ff7beb2b5	d5f49e78-0b72-4304-8413-b90446ced4a0	Admin Miền Bắc	\N	\N	ADMIN-MB-1788930744841	\N	\N	\N	\N	\N	\N	\N	\N	\N	OFFICIAL	\N	\N	\N	2026-09-09 05:12:24.848	2026-09-09 05:12:27.11	1
c8674add-e514-4792-9b2b-f1c5504841a8	2a45f36d-2da9-492c-8bce-91a3440e71c1	Admin Miền Nam	\N	\N	ADMIN-MN-1788930748388	\N	\N	\N	\N	\N	\N	\N	\N	\N	OFFICIAL	\N	\N	\N	2026-09-09 05:12:28.39	2026-09-09 05:12:29.652	1
9868a564-6c5b-4721-ac2e-f69b59e3f31d	49098001-4375-47f0-b36d-c8758d8715ff	System Admin	\N	\N	ADMIN-000001	\N	\N	\N	\N	\N	\N	\N	\N	\N	OFFICIAL	\N	\N	\N	2026-08-19 05:28:15.473	2026-09-08 04:24:07.956	8
f02c3272-7af5-4ac9-afb1-84e9b6be1887	e159d26b-5fba-452b-b5ce-44b52c18e8c3	Cao Việt Đức	2001-01-01 00:00:00	MALE	026203009999	\N	\N	\N	\N	\N	\N	\N	\N	\N	PROBATION	\N	\N	\N	2026-08-27 16:08:03.704	2026-09-08 04:24:08.139	1
05bcfbe9-3f74-4628-a82a-57816d7b425c	89ab6a07-e01e-40ed-b498-32d955c35a1c	NGUYỄN DUY PHONG	1998-05-26 00:00:00	MALE	001098039639	\N	\N	\N	\N	\N	\N	\N	\N	\N	PROBATION	\N	\N	\N	2026-09-05 07:39:53.12	2026-09-08 04:24:08.32	1
06fc8142-c1a3-48d4-a7fc-c29e1894bfee	cbb85058-9ce2-4eca-ac7b-a6c491a331f0	Nguyễn Thị Ngà	2004-11-18 00:00:00	FEMALE	001304032243	\N	\N	\N	\N	\N	\N	\N	\N	\N	PROBATION	\N	\N	\N	2026-09-05 08:47:55.131	2026-09-08 04:24:08.503	1
44cd1a8f-0657-4d6a-a353-a9711baf6168	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	Phùng Thanh Bình	2003-11-19 00:00:00	MALE	025203012961	\N	\N	\N	\N	\N	\N	https://res.cloudinary.com/dqxsqiglg/image/upload/v1787992902/hrm/employee_document/2026-08-29/6604d338-1073-4d96-b478-361919c9e3c4.jpg	\N	\N	PROBATION	\N	\N	\N	2026-08-19 11:03:46.346	2026-09-08 04:24:08.687	2
43c32256-e670-411e-bd7c-4fa949a536af	334b2294-9bba-4f31-8290-5a87484a62f0	Hồ Đức	2001-08-30 00:00:00	MALE	040201000021	\N	\N	\N	\N	\N	\N	https://res.cloudinary.com/dqxsqiglg/image/upload/v1787992803/hrm/employee_document/2026-08-29/3df4149b-4366-4cba-a5b0-69da5cd0fa4f.jpg	\N	\N	PROBATION	\N	\N	\N	2026-08-29 08:35:28.809	2026-09-08 04:24:08.872	2
42872d77-48fa-4085-9f47-cb1a3b7a0d14	846641e3-667b-4e7f-b505-afdc1d66b54a	Lê văn hà	2000-11-08 00:00:00	MALE	036200012159	\N	\N	\N	\N	\N	\N	https://res.cloudinary.com/dqxsqiglg/image/upload/v1787992821/hrm/employee_document/2026-08-29/a15afebf-ad34-49a0-af2e-4c0994fc9d1a.jpg	\N	\N	PROBATION	\N	\N	\N	2026-08-29 08:37:57.009	2026-09-08 04:24:09.055	2
0ded3376-f9d4-4027-aa20-b9dadf69f2fd	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	Đinh Văn Học	2003-02-21 00:00:00	MALE	034203001605	\N	\N	\N	\N	\N	\N	\N	\N	\N	PROBATION	\N	\N	\N	2026-08-20 02:08:38.294	2026-09-08 04:24:09.24	5
0cc9f8a2-f865-4436-9b67-4b88b42b2293	c2a06e5b-22fd-4862-bf12-8c36f5e07d9c	Dương Văn Thuận	2001-07-28 00:00:00	MALE	001201030079	\N	\N	\N	\N	\N	\N	https://res.cloudinary.com/dqxsqiglg/image/upload/v1787992857/hrm/employee_document/2026-08-29/e4e0e9a6-a0a1-42ae-946f-600857503823.jpg	\N	\N	PROBATION	\N	\N	\N	2026-08-29 08:37:24.814	2026-09-08 04:24:09.486	2
cd51e998-dbea-48c0-b7e9-32e51b8531bf	545ef296-1135-4885-8e61-89932645af6c	Cường Test 1	2001-10-27 00:00:00	MALE	001201012636	\N	\N	\N	\N	\N	\N	https://res.cloudinary.com/dqxsqiglg/image/upload/v1787991218/hrm/employee_document/2026-08-29/d657e4e4-2d96-4943-85b9-4ea095ec8083.jpg	\N	\N	PROBATION	\N	\N	\N	2026-08-29 03:07:07.303	2026-09-08 04:24:09.889	1
ddabf78b-7f29-4053-9fc2-a0930f5def15	31bb72f7-e5e2-493e-827d-3320e1054461	Đinh Văn Thái	2003-02-02 00:00:00	MALE	078965432132	\N	\N	\N	\N	\N	\N	\N	\N	\N	PROBATION	\N	\N	\N	2026-09-06 11:25:24.271	2026-09-08 04:24:10.071	5
b340e84a-f55c-4426-8292-6d58100651a6	05ff1cc9-4cb6-4d87-a74b-0391a5539537	Đinh Ngọc Tiến	2003-01-01 00:00:00	MALE	147258369147	\N	\N	\N	\N	\N	\N	\N	\N	\N	PROBATION	\N	\N	\N	2026-09-06 09:15:21.364	2026-09-08 04:24:10.293	5
\.


--
-- Data for Name: employee_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.employee_requests (id, "userId", "departmentId", type, status, title, content, amount, "attachmentMetadata", "referenceId", "currentApproverUserId", "decidedByUserId", "decidedAt", "createdAt", "updatedAt") FROM stdin;
8cfa2d57-b4c2-4f3c-81e4-624f447c0425	545ef296-1135-4885-8e61-89932645af6c	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	LEAVE	REJECTED	Nghỉ đi ngủ	Đình công	\N	{"toDate": "2026-09-06T08:22:45.000Z", "fromDate": "2026-08-29T08:22:25.549Z", "leaveType": "Nghỉ phép năm", "handoverUserId": "bea82bc5-c3e5-45d8-bd50-82be7ade4b4c", "handoverEmployee": "Đinh Văn Học", "leaveDurationType": "Nhiều ngày"}	\N	\N	49098001-4375-47f0-b36d-c8758d8715ff	2026-08-29 08:23:26.21	2026-08-29 08:23:11.755	2026-08-29 08:23:26.211
c03e5352-06f7-436d-b7eb-43b57e9036e6	545ef296-1135-4885-8e61-89932645af6c	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	ADVANCE	REJECTED	Tạm ứng - 5.000.000.000 VNĐ	Mua lại công ty	5000000000.00	{"fromDate": "2026-08-29T08:36:08.184Z"}	\N	\N	49098001-4375-47f0-b36d-c8758d8715ff	2026-08-29 08:37:49.772	2026-08-29 08:36:33.447	2026-08-29 08:37:49.773
67f62e57-57ce-405b-b47a-de121ffaea8d	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	ADVANCE	APPROVED	Tạm ứng - 5.000.001 VNĐ	Em muốn ứng lương	5000001.00	{"fromDate": "2026-09-07T09:11:47.020Z"}	\N	\N	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-07 09:12:16.88	2026-09-07 09:12:03.456	2026-09-07 09:12:16.881
bca89d47-959a-454c-ae10-d6e32a3f4584	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	ADVANCE	APPROVED	Tạm ứng - 5.000.001 VNĐ	Em muốn mua cty	5000001.00	{"stage": "DISBURSED", "fromDate": "2026-09-07T09:24:39.481Z", "approvalSteps": [{"at": "2026-09-07T09:25:28.259Z", "note": "Đã duyệt sơ bộ", "stage": "PENDING_LEADER", "action": "APPROVED", "actorId": "bea82bc5-c3e5-45d8-bd50-82be7ade4b4c", "actorName": "Đinh Văn Học"}, {"at": "2026-09-07T09:26:20.163Z", "note": "HR đã đối chứng công & lương hợp lệ, chuyển Admin phê duyệt", "stage": "PENDING_HR", "action": "VERIFIED", "actorId": "05ff1cc9-4cb6-4d87-a74b-0391a5539537", "actorName": "Đinh Ngọc Tiến"}, {"at": "2026-09-07T09:26:48.853Z", "note": "Ban Giám Đốc đã phê duyệt chi", "stage": "PENDING_ADMIN", "action": "APPROVED", "actorId": "49098001-4375-47f0-b36d-c8758d8715ff", "actorName": "System Admin"}, {"at": "2026-09-07T09:37:51.944Z", "note": "Đã chuyển tiền / giải ngân thành công", "stage": "PENDING_DISBURSEMENT", "action": "DISBURSED", "actorId": "31bb72f7-e5e2-493e-827d-3320e1054461", "actorName": "Đinh Văn Thái", "disbursementProofUrl": "https://res.cloudinary.com/dqxsqiglg/image/upload/v1788773870/hrm/employee_document/2026-09-07/0fdd360b-967e-4978-8634-1b86bcace27e.jpg"}], "disbursementProofUrl": "https://res.cloudinary.com/dqxsqiglg/image/upload/v1788773870/hrm/employee_document/2026-09-07/0fdd360b-967e-4978-8634-1b86bcace27e.jpg"}	\N	\N	31bb72f7-e5e2-493e-827d-3320e1054461	2026-09-07 09:37:51.944	2026-09-07 09:24:53.892	2026-09-07 09:37:51.945
\.


--
-- Data for Name: employee_salary_components; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.employee_salary_components (id, "userId", "componentId", amount, percentage, "effectiveFrom", "effectiveTo", "createdById", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: face_profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.face_profiles (id, "userId", status, "createdAt", "updatedAt") FROM stdin;
56dbfda3-504b-49aa-82e3-2232d1611c09	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	APPROVED	2026-08-20 02:01:42.584	2026-08-20 02:01:42.584
66d81fd6-105f-4718-9263-37df3f72d6f7	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	APPROVED	2026-08-24 02:00:12.204	2026-08-24 02:00:12.204
12058468-7f11-4ee6-a109-5c1ffcec23ef	846641e3-667b-4e7f-b505-afdc1d66b54a	APPROVED	2026-08-29 08:40:51.501	2026-08-29 08:40:51.501
\.


--
-- Data for Name: face_registration_images; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.face_registration_images (id, "faceProfileId", pose, "imageUrl", "createdAt", "updatedAt") FROM stdin;
75413aa5-bfa0-4b93-b8e2-96d7f51675a1	56dbfda3-504b-49aa-82e3-2232d1611c09	FRONT	https://pub-7d69ec28111e4d0b89308dc0ae7571ed.r2.dev/face_registration/2026-08-20/13659962-6eae-4655-8760-2f6d308cbdf0.jpg	2026-08-20 02:01:42.683	2026-08-20 02:01:42.683
7a02cabb-94aa-443b-8358-f71b10658c91	56dbfda3-504b-49aa-82e3-2232d1611c09	LEFT	https://pub-7d69ec28111e4d0b89308dc0ae7571ed.r2.dev/face_registration/2026-08-20/c5b95614-8c06-4d4f-988e-12b69245db25.jpg	2026-08-20 02:01:42.683	2026-08-20 02:01:42.683
9bcf5da7-d3f1-42ab-a181-b3cf15caa10d	56dbfda3-504b-49aa-82e3-2232d1611c09	RIGHT	https://pub-7d69ec28111e4d0b89308dc0ae7571ed.r2.dev/face_registration/2026-08-20/fdce93f6-fbc9-458e-9be3-65507680f00b.jpg	2026-08-20 02:01:42.683	2026-08-20 02:01:42.683
0108beb7-9b2f-4416-8206-4d6f42c3194f	66d81fd6-105f-4718-9263-37df3f72d6f7	FRONT	https://pub-7d69ec28111e4d0b89308dc0ae7571ed.r2.dev/face_registration/2026-08-24/7c88c0fa-6bfb-4137-aa3d-ea2df6033811.jpg	2026-08-24 02:00:12.305	2026-08-24 02:00:12.305
cfb8ae51-289e-4eb5-aa89-28b25c006ffd	66d81fd6-105f-4718-9263-37df3f72d6f7	LEFT	https://pub-7d69ec28111e4d0b89308dc0ae7571ed.r2.dev/face_registration/2026-08-24/6b8a551f-f632-4ed9-a861-25b263c5239e.jpg	2026-08-24 02:00:12.305	2026-08-24 02:00:12.305
3496d02e-e735-4c5f-987b-9cc09706fe93	66d81fd6-105f-4718-9263-37df3f72d6f7	RIGHT	https://pub-7d69ec28111e4d0b89308dc0ae7571ed.r2.dev/face_registration/2026-08-24/04c16beb-e183-45ce-a522-ad50bb0c9589.jpg	2026-08-24 02:00:12.305	2026-08-24 02:00:12.305
2315397c-160a-4f04-b0d7-f7577fde4e1c	12058468-7f11-4ee6-a109-5c1ffcec23ef	FRONT	https://pub-7d69ec28111e4d0b89308dc0ae7571ed.r2.dev/face_registration/2026-08-29/31de498e-98f5-4ed9-935d-2125ae078451.jpg	2026-08-29 08:40:51.605	2026-08-29 08:40:51.605
78525c07-23d1-4617-a74d-eeb2305f2c80	12058468-7f11-4ee6-a109-5c1ffcec23ef	LEFT	https://pub-7d69ec28111e4d0b89308dc0ae7571ed.r2.dev/face_registration/2026-08-29/b749ea8f-fed0-413f-8bda-dd9fd751cc24.jpg	2026-08-29 08:40:51.605	2026-08-29 08:40:51.605
927ea1ca-e8c3-44a1-802e-5eb58508d5f8	12058468-7f11-4ee6-a109-5c1ffcec23ef	RIGHT	https://pub-7d69ec28111e4d0b89308dc0ae7571ed.r2.dev/face_registration/2026-08-29/76b99ce7-5eea-45e0-8f11-07c977db5c48.jpg	2026-08-29 08:40:51.605	2026-08-29 08:40:51.605
\.


--
-- Data for Name: feedbacks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.feedbacks (id, title, content, "senderUserId", "isAnonymous", status, reason, "reviewedAt", img, "createdAt", "updatedAt", "deletedAt") FROM stdin;
8a0b0d87-eb01-457d-a6a2-c667d000c892	Tăng lươngggggg	Ước gì trúng vietlott	545ef296-1135-4885-8e61-89932645af6c	t	RESOLVED	Khó ang ơu	2026-08-29 08:21:42.894	https://res.cloudinary.com/dqxsqiglg/image/upload/v1787991513/hrm/asset_incident/2026-08-29/d02b3865-b581-4429-94e2-c9912831f3af.jpg	2026-08-29 08:18:34.312	2026-08-29 08:21:42.895	\N
e7e5d299-5880-40d8-8b84-14a79bc5bc8e	Ứng lươngggg	Mua công ty thôi	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	f	RESOLVED	\N	2026-09-09 04:03:41.757	https://res.cloudinary.com/dqxsqiglg/image/upload/v1788769687/hrm/asset_incident/2026-09-07/3120518d-d53a-4403-bf8e-e32abeaa274e.jpg	2026-09-07 08:28:08.502	2026-09-09 04:03:41.757	\N
\.


--
-- Data for Name: grant_milestones; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.grant_milestones (id, "packageId", "milestoneIndex", title, "unlockDate", "pointsToUnlock", "cashAmount", "withdrawnPoints", "isUnlocked", "isWithdrawn", "withdrawnAt", "createdAt", "updatedAt") FROM stdin;
f9047fa2-ea7b-4806-8e8e-f491c1b417d1	5e2b0bbb-bcd2-48c2-a937-288fa504007b	1	Đợt 1 (Sau 3 tháng)	2026-12-08 00:00:00	2500	2500000.00	0	f	f	\N	2026-09-08 12:10:25.435	2026-09-08 12:10:25.435
91be0414-b73d-4ac8-80bd-d50d94bad29c	5e2b0bbb-bcd2-48c2-a937-288fa504007b	2	Đợt 2 (Sau 6 tháng)	2027-03-08 00:00:00	2500	2500000.00	0	f	f	\N	2026-09-08 12:10:25.534	2026-09-08 12:10:25.534
f9f4bb2c-790b-4cf6-b7f2-7f477c836276	5e2b0bbb-bcd2-48c2-a937-288fa504007b	3	Đợt 3 (Sau 9 tháng)	2027-06-08 00:00:00	2500	2500000.00	0	f	f	\N	2026-09-08 12:10:25.588	2026-09-08 12:10:25.588
11db1e9f-937d-4721-a694-dc81c22aa8b2	5e2b0bbb-bcd2-48c2-a937-288fa504007b	4	Đợt 4 (Sau 12 tháng)	2027-09-08 00:00:00	2500	2500000.00	0	f	f	\N	2026-09-08 12:10:25.639	2026-09-08 12:10:25.639
5c8ed9fe-6894-4c42-8914-d4bbd704be58	da015c70-e3cd-4eb3-8c44-8c00138ae15a	2	Đợt 2 (Sau 2 tháng)	2026-10-09 00:00:00	833	833000.00	0	f	f	\N	2026-09-09 04:20:17.269	2026-09-09 04:20:17.269
915eabbf-2195-4c1b-97d6-9923b690e20c	da015c70-e3cd-4eb3-8c44-8c00138ae15a	3	Đợt 3 (Sau 3 tháng)	2026-11-09 00:00:00	833	833000.00	0	f	f	\N	2026-09-09 04:20:17.321	2026-09-09 04:20:17.321
d8f0302a-04a9-4442-91ab-78316193275f	da015c70-e3cd-4eb3-8c44-8c00138ae15a	4	Đợt 4 (Sau 4 tháng)	2026-12-09 00:00:00	833	833000.00	0	f	f	\N	2026-09-09 04:20:17.372	2026-09-09 04:20:17.372
a733261a-ead3-4d18-bc87-87afe8273270	da015c70-e3cd-4eb3-8c44-8c00138ae15a	5	Đợt 5 (Sau 5 tháng)	2027-01-09 00:00:00	833	833000.00	0	f	f	\N	2026-09-09 04:20:17.424	2026-09-09 04:20:17.424
a8c539ef-e165-4c9f-93ac-603f21bb9539	da015c70-e3cd-4eb3-8c44-8c00138ae15a	6	Đợt 6 (Sau 6 tháng)	2027-02-09 00:00:00	833	833000.00	0	f	f	\N	2026-09-09 04:20:17.476	2026-09-09 04:20:17.476
a4686ff6-3333-4d71-9358-bf125be86590	da015c70-e3cd-4eb3-8c44-8c00138ae15a	7	Đợt 7 (Sau 7 tháng)	2027-03-09 00:00:00	833	833000.00	0	f	f	\N	2026-09-09 04:20:17.527	2026-09-09 04:20:17.527
3538334a-5a25-483b-9855-d4297fd54156	da015c70-e3cd-4eb3-8c44-8c00138ae15a	8	Đợt 8 (Sau 8 tháng)	2027-04-09 00:00:00	833	833000.00	0	f	f	\N	2026-09-09 04:20:17.578	2026-09-09 04:20:17.578
1bfff6b4-cc15-499a-8d65-7ff19c627694	da015c70-e3cd-4eb3-8c44-8c00138ae15a	9	Đợt 9 (Sau 9 tháng)	2027-05-09 00:00:00	833	833000.00	0	f	f	\N	2026-09-09 04:20:17.629	2026-09-09 04:20:17.629
dcfdf973-3917-44e6-ac15-227ffdeffa39	da015c70-e3cd-4eb3-8c44-8c00138ae15a	10	Đợt 10 (Sau 10 tháng)	2027-06-09 00:00:00	833	833000.00	0	f	f	\N	2026-09-09 04:20:17.698	2026-09-09 04:20:17.698
af3f949c-908c-4e18-95b6-9e90963a3d82	da015c70-e3cd-4eb3-8c44-8c00138ae15a	11	Đợt 11 (Sau 11 tháng)	2027-07-09 00:00:00	833	833000.00	0	f	f	\N	2026-09-09 04:20:17.75	2026-09-09 04:20:17.75
53768671-61fd-40e0-8375-70844f03e586	da015c70-e3cd-4eb3-8c44-8c00138ae15a	12	Đợt 12 (Sau 12 tháng)	2027-08-09 00:00:00	837	837000.00	0	f	f	\N	2026-09-09 04:20:17.802	2026-09-09 04:20:17.802
1881a65e-9945-4014-bc78-0b3865445dae	da015c70-e3cd-4eb3-8c44-8c00138ae15a	1	Đợt 1 (Sau 1 tháng)	2026-09-09 00:00:00	833	833000.00	833	t	t	2026-09-09 04:21:16.082	2026-09-09 04:20:17.167	2026-09-09 04:21:16.083
d4701b49-a305-4ef3-a30f-ab8e588fc706	89a8be07-261f-4564-8b00-cd49c8cbec8a	1	Đợt 1 (Sau 3 tháng)	2026-12-08 00:00:00	2500	2500000.00	0	f	f	\N	2026-09-08 10:01:06.871	2026-09-08 10:01:06.871
37815e65-5bd0-4b7d-b2c3-64c6cbf86f59	89a8be07-261f-4564-8b00-cd49c8cbec8a	2	Đợt 2 (Sau 6 tháng)	2027-03-08 00:00:00	2500	2500000.00	0	f	f	\N	2026-09-08 10:01:06.975	2026-09-08 10:01:06.975
68f058bc-5a28-4633-bbb2-bc105c5498d9	89a8be07-261f-4564-8b00-cd49c8cbec8a	3	Đợt 3 (Sau 9 tháng)	2027-06-08 00:00:00	2500	2500000.00	0	f	f	\N	2026-09-08 10:01:07.027	2026-09-08 10:01:07.027
c29cb594-4874-448f-b0a8-8f7a7535d8d4	89a8be07-261f-4564-8b00-cd49c8cbec8a	4	Đợt 4 (Sau 12 tháng)	2027-09-08 00:00:00	2500	2500000.00	0	f	f	\N	2026-09-08 10:01:07.08	2026-09-08 10:01:07.08
\.


--
-- Data for Name: inventory_check_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inventory_check_items (id, "inventoryCheckId", "materialId", "systemQuantity", "actualQuantity", "differenceQuantity", note) FROM stdin;
\.


--
-- Data for Name: inventory_checks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inventory_checks (id, "warehouseId", "checkCode", status, "startedAt", "completedAt", "createdById", "approvedById", note, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: job_execution_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.job_execution_logs (id, "jobName", "executionKey", status, "startedAt", "finishedAt", "processedCount", "successCount", "failureCount", "errorSummary", "createdAt") FROM stdin;
\.


--
-- Data for Name: kpi_criteria; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.kpi_criteria (id, "kpiTemplateId", code, name, description, weight, "targetValue", unit, "scoringMethod", "sortOrder", "isRequired", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: kpi_templates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.kpi_templates (id, "companyId", "departmentId", "positionId", code, name, description, "periodType", "isActive", "createdById", "createdAt", "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: leave_balances; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.leave_balances (id, "userId", "leaveTypeId", year, "balanceDays", "usedDays", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: leave_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.leave_requests (id, "userId", "departmentId", "leaveTypeId", "startDate", "endDate", "totalDays", reason, status, "decidedByUserId", "decidedAt", "rejectionReason", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: leave_types; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.leave_types (id, code, name, "annualQuotaDays", "isPaid", "isActive", "createdAt", "updatedAt") FROM stdin;
0b390c79-b1b1-453c-9e25-b0262287fbd0	LATE_EXCUSE	Xin phép đi trễ	5.00	t	t	2026-08-01 11:48:15.157	2026-08-01 11:48:15.157
\.


--
-- Data for Name: level_promotion_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.level_promotion_requests (id, "userId", "departmentId", "fromLevelNumber", "toLevelNumber", "submissionNote", "evidenceImages", status, "leaderNote", "decidedByUserId", "decidedAt", "createdAt", "updatedAt") FROM stdin;
97d23d30-0a53-4f2f-8026-11d2a60635cc	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	1	2	Em đã hoàn thành xuất sắc	[]	APPROVED	\N	49098001-4375-47f0-b36d-c8758d8715ff	2026-09-08 07:21:43.054	2026-09-08 07:08:06.326	2026-09-08 07:21:43.055
246bc050-703e-470a-b3ef-b749b1d20d55	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	1	2	Hoàn thành	["https://res.cloudinary.com/dqxsqiglg/image/upload/v1788852171/hrm/kpi_evidence/2026-09-08/87659428-5bc0-4a10-b2ea-fcb154467399.jpg"]	APPROVED	\N	49098001-4375-47f0-b36d-c8758d8715ff	2026-09-08 07:45:15.608	2026-09-08 07:22:59.205	2026-09-08 07:45:15.609
\.


--
-- Data for Name: location_trackings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.location_trackings (id, "userId", latitude, longitude, "accuracyMeters", "recordedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: material_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.material_categories (id, code, name, description, "isActive", "createdAt", "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: material_issue_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.material_issue_items (id, "materialIssueId", "materialId", "quantityRequested", "quantityApproved", "quantityIssued", note) FROM stdin;
\.


--
-- Data for Name: material_issues; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.material_issues (id, "issueCode", "warehouseId", "issueTargetType", "issuedToUserId", "issuedToDepartmentId", status, "requestedById", "approvedById", "issuedById", "issueDate", note, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: material_return_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.material_return_items (id, "materialReturnId", "materialId", quantity, "conditionNote") FROM stdin;
\.


--
-- Data for Name: material_returns; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.material_returns (id, "returnCode", "warehouseId", "returnedByUserId", "returnedByDepartmentId", status, "receivedById", "receivedAt", note, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: materials; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.materials (id, "categoryId", "materialCode", name, description, unit, "minimumStock", "maximumStock", "isActive", "createdAt", "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: monthly_competition_reviews; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.monthly_competition_reviews (id, "userId", "departmentId", period, "actualMetricValue", "completedTaskRate", "leaderStatus", "leaderNote", "leaderReviewedAt", "adminStatus", "fromLevelNumber", "toLevelNumber", "adminNote", "adminApprovedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: newsfeed_posts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.newsfeed_posts (id, "authorId", "departmentId", title, content, images, attachments, status, "approvedById", "approvedAt", "rejectionReason", "createdAt", "updatedAt") FROM stdin;
c2df5353-65c3-460a-85a0-99b426f04f85	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa		lẹt gô	{https://res.cloudinary.com/dqxsqiglg/image/upload/v1787365202/hrm/task_attachment/2026-08-22/75100f5f-154c-40b1-93c4-42157b4792f1.webp}	{}	APPROVED	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-27 03:20:38.432	\N	2026-08-22 02:20:04.099	2026-08-27 03:20:38.433
b38a60cf-a061-48a9-8242-3a61db3e6470	545ef296-1135-4885-8e61-89932645af6c	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	Thủ tiêu mục tiêu này thưởng 10k	Khử mục tiêu	{https://res.cloudinary.com/dqxsqiglg/image/upload/v1787991281/hrm/task_attachment/2026-08-29/43d1bc89-fa01-47ef-b08c-de226a98c848.jpg}	{}	APPROVED	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-29 08:15:01.996	\N	2026-08-29 08:14:49.737	2026-08-29 08:15:01.997
aa92cbda-a396-4c36-850a-975c6e733e5b	545ef296-1135-4885-8e61-89932645af6c	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	Nhi Anh mời nước cả công ty. Chọn nước đi ae	https://shopeefood.shopee.vn/u/ZRhnVqL	{}	{}	PENDING	\N	\N	\N	2026-08-29 08:44:36.65	2026-08-29 08:44:36.65
\.


--
-- Data for Name: notification_deliveries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notification_deliveries (id, "notificationId", "userId", "deviceTokenId", status, "errorMessage", "sentAt", "createdAt") FROM stdin;
4f6438cc-66d2-45f1-acbc-3a645e326b5d	851de599-66c5-4b5a-9d54-9a718bbdb551	49098001-4375-47f0-b36d-c8758d8715ff	\N	PENDING	\N	\N	2026-08-19 11:03:47.513
b192bb3b-1026-4027-8cb4-7a82a880cca4	c942c8d4-c38a-42a4-a4b5-ea409205ddee	49098001-4375-47f0-b36d-c8758d8715ff	\N	PENDING	\N	\N	2026-08-20 02:01:01.143
d4cc5899-17fa-4af7-8a46-8d7990496398	a0ee9d5c-025c-4155-9430-812b6f97d1b9	49098001-4375-47f0-b36d-c8758d8715ff	\N	PENDING	\N	\N	2026-08-20 02:08:39.3
c7bc2705-1b80-4d60-a1d7-8ed059620a77	83a94171-3683-4f48-a421-d13e0e45a83f	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-08-20 02:10:06.522
467ff425-49a4-4bd0-9cf0-81af97dc9a0e	33e85cce-ced0-4d52-9acd-e4b45f23368c	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-08-20 02:11:58.978
2e623968-4993-440d-bc85-13d095759496	64cb8e14-e023-4a0a-808c-1e13f659ea65	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-08-20 02:12:50.158
b9d69cc9-0fce-4716-a939-5c818828c3d1	e4a34f11-8368-4b03-b135-7eeacee0d84f	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-08-20 02:18:00.041
32176280-d736-468c-85ba-7b3fcbccd172	5fd18db5-d7bd-4ad9-a0b5-fa5ebb6a19f3	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-08-20 02:21:53.896
c95fdea6-01a9-41f9-af92-fbb44b965e1c	09467733-c51d-48f9-941f-e17ceb877870	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-08-20 02:23:00.951
b62e1a34-c402-4464-98bf-174bfc225124	76f65a34-05fb-48cd-b914-322e7f40d440	49098001-4375-47f0-b36d-c8758d8715ff	\N	PENDING	\N	\N	2026-08-20 02:34:23.58
f6afe4bc-8c19-45e7-a55f-d28f24418d66	76f65a34-05fb-48cd-b914-322e7f40d440	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-08-20 02:34:23.58
0948c9e3-1c08-4890-b43e-b6ac18acb12a	fc2f0a54-0ffd-47bc-94a7-759ab988edd6	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-08-20 02:48:28.125
7dfafcd4-d823-4158-a0b8-1938ae5edd95	3aa7eab4-3b9e-4603-90eb-0b1bb4a47ffa	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-08-20 02:50:31.271
41ee6bab-f989-40cb-b4a6-0d7985cefb51	7cba22cf-4839-43c5-b556-c607b8beb140	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-08-20 02:51:51.101
e158f3c2-981e-4e5f-b3e6-3c75e238f1e4	7a8688c6-21bd-4fed-904a-392e0c6e4589	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-08-20 02:53:19.865
cb56de7b-85bc-4d73-ace3-057d7b78c3e0	0b57fe30-efca-4d76-8ab6-42fb77cca684	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-08-20 03:35:54.413
467ff3b1-7f56-47fd-9674-fe548e19a40f	d6a14fec-6bba-43a0-bf4c-1bc914fe9037	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-08-20 04:45:49.686
c6cd934d-9001-4cdd-a12b-2dcceb199ab4	2f4756b8-2bf4-4b4f-a120-0878d17edba5	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-08-20 08:49:25.688
11bd7f88-476f-475b-bbaf-0c4aa768d5c2	e1c4e5c6-22de-4707-ad4d-9c14be0ab1ed	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-08-21 02:04:58.148
4ec9e2f6-065d-4408-acbe-a35c87307dd4	3b220fa6-cfa2-49bd-ba19-2b57b904090c	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-08-21 02:05:18.992
610b8f46-e0de-433a-b593-d3201e33154a	64c52e44-0f1b-4d6a-9f24-e31a8c8fa365	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-08-21 02:07:58.051
3d060e35-885a-4109-8084-fedeaae46f74	ede256bb-9f22-4014-a9dc-14cb3b9594d3	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-08-21 02:09:08.884
d3418db3-c7c2-4a3d-860d-e9d44d48eb2a	5734fd68-fe87-40c4-ac58-2871c72156ca	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-08-21 02:09:22.284
c60c24ee-16bf-4a40-9978-d61759dec92d	18169196-acb4-41c0-96ef-5b63fc6921d7	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-08-21 02:10:18.275
100a0a42-251a-4a64-bd52-505669258bbe	54962ef9-5b94-4581-9d24-e6e8c8088a20	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-08-21 02:11:25.933
335255e7-a020-4484-bb5c-a8701675fbb5	0d15d0f6-94d5-43f1-9a3f-41fa215f2ab4	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-08-21 02:12:10.719
d1cc82a9-786b-4841-896e-c176056a55c4	b74189c2-134c-4549-b962-974520084e5f	49098001-4375-47f0-b36d-c8758d8715ff	\N	PENDING	\N	\N	2026-08-21 02:12:41.027
416ef416-7580-4965-a668-117148abe9bc	6a0071b1-f7b5-4ff3-89da-1408076e6be2	49098001-4375-47f0-b36d-c8758d8715ff	\N	PENDING	\N	\N	2026-08-21 02:12:48.793
ca8f94cc-35b0-4398-bd9b-df2c4b16acbf	da009527-db18-4239-acf0-e564082f3ad8	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-08-21 02:46:51.518
705f5369-fee3-457d-92b7-771a20a06a92	98b1b2fa-1096-4aff-b5ff-9445e7432d85	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-08-21 03:14:08.611
1990782e-9f86-4068-9ab3-08267b6dd7b7	c70dc573-1cde-4daa-9e93-ee9ec1752b7a	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-08-21 04:33:03.845
9e554a94-9c28-443a-828b-c2f30b245aba	4153b6a4-3cdf-4681-9d2e-7999c927208d	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-08-21 06:33:31.75
5966abe1-ebd7-42f4-9122-1511982815ff	5509389d-5820-4e6c-a705-566d83c8167e	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-08-21 06:33:35.77
462d40f8-1f12-4260-9e7f-408adbbfde63	39dfdfef-f96f-4056-878d-dbea1632814a	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-08-21 06:33:37.373
54e4d2e5-8023-43e6-8123-591d3c311a9a	229b137a-1356-453f-9c21-a12a74fff5fb	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-08-21 10:15:45.033
0e5d34e4-6455-4430-9e17-6f584c5c043d	19ca97cb-b0d0-4f56-8763-7b79b9747ab6	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-08-22 02:20:04.666
22de40ab-23ca-429f-be7b-55acdccc6d83	82198158-2a38-40ba-9a37-9846847ddc90	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-08-22 02:20:27.003
a59adcca-7ffd-4035-8f15-a3cbecee5bad	82198158-2a38-40ba-9a37-9846847ddc90	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-08-22 02:20:27.003
6b2b178a-27b2-47b1-ac6b-e3e48b83db62	78abe25e-6ae1-4d0c-8812-bfff0c78b247	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-08-22 02:20:54.135
1aaf1645-1856-4886-be34-39bc244700e7	78abe25e-6ae1-4d0c-8812-bfff0c78b247	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-08-22 02:20:54.135
89be80f6-c0ea-413a-8a62-b967b8c62c49	c78925a0-b9c2-44d7-8c4c-e6fa3354e185	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-08-22 11:20:07.807
771b94bf-e7fc-4ffa-a8c0-9ddb19583138	c78925a0-b9c2-44d7-8c4c-e6fa3354e185	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-08-22 11:20:07.807
0b3bc7c0-6afa-40cb-a166-322d8a2269fb	1363ac9c-d6c8-4d5b-ae34-d9bfc56bf54c	49098001-4375-47f0-b36d-c8758d8715ff	\N	PENDING	\N	\N	2026-08-24 08:59:45.849
04d319ba-c911-4343-8dc9-1e46491224ae	74ac9c49-3e44-4932-913e-612778acca99	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-08-24 19:19:05.335
b7b1ab95-9668-48dc-801c-8f5b2383536a	01e2571e-2cb0-4055-af25-6d72b989cdc6	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-08-24 19:19:07.102
e703c45b-e3f4-447d-8177-b87a493f2615	6a24cbc0-6fc6-4903-add9-a7dc7723de20	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-08-24 19:19:07.857
27e9bc18-0275-4641-b9da-370eb7530a25	305fddb7-5c73-4a79-8475-cfc80e53b6be	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-08-27 03:18:07.679
9366e848-f15e-4e50-8a87-732ae59182c8	305fddb7-5c73-4a79-8475-cfc80e53b6be	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-08-27 03:18:07.679
26401b1f-b1a0-482c-8681-d2a1073ba4d1	b21cd152-8572-44de-a33e-abac40d5eb36	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-08-27 03:20:38.588
f0342e80-46ef-432b-915c-e642a948bc2a	de2b5571-9bfb-4359-b753-9fb92c2f9b60	49098001-4375-47f0-b36d-c8758d8715ff	\N	PENDING	\N	\N	2026-08-27 03:20:39.201
0d9e829a-ab46-43a2-9296-b375fa5aa172	de2b5571-9bfb-4359-b753-9fb92c2f9b60	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-08-27 03:20:39.201
894c43db-7b24-430f-8b73-474c6b19d0f5	0d2286dd-3391-41cb-85e1-eb29c8861a75	49098001-4375-47f0-b36d-c8758d8715ff	\N	PENDING	\N	\N	2026-08-27 16:08:04.695
054380be-3fdb-4f0f-be53-611c7e98639a	0d2286dd-3391-41cb-85e1-eb29c8861a75	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-08-27 16:08:04.695
82ede7d0-63f2-4ead-8c1b-436391f01d99	370339e3-35bf-4323-bdb8-9a132f889ec8	49098001-4375-47f0-b36d-c8758d8715ff	\N	PENDING	\N	\N	2026-08-29 03:07:08.313
9bb9ea51-7e19-44cc-94e1-c73eac1b0cb4	370339e3-35bf-4323-bdb8-9a132f889ec8	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-08-29 03:07:08.313
ff21b040-89c9-412e-b1d3-757eecc4a53c	f39fc4bd-48e0-48d9-8b94-2ea80bd7cc4d	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-08-29 04:19:47.487
6d24fada-3e38-4f64-ae31-aec5b2afbd6b	f39fc4bd-48e0-48d9-8b94-2ea80bd7cc4d	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-08-29 04:19:47.487
26f49adb-5ce6-4ada-9a91-78c14ad4b82b	27fe1017-359a-41eb-8824-3deca3cc884e	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-08-29 04:56:08.639
553c4ff7-97fe-4bfa-9bb6-d91d69a154b4	4541d7ba-2d70-472e-a20c-71375a64c9f1	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-08-29 04:56:25.191
8436c617-6af1-4b6b-80e5-359d64633121	4541d7ba-2d70-472e-a20c-71375a64c9f1	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-08-29 04:56:25.191
072b6e75-bc64-470e-ab4c-ffec6a053100	4541d7ba-2d70-472e-a20c-71375a64c9f1	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-08-29 04:56:25.191
dcb54702-7728-4c95-bfce-3af08075d308	63d9597c-0f35-4122-a1a2-a9d050136150	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-08-29 04:56:31.618
b98134b2-4303-4485-9582-413ecb52c2b8	63d9597c-0f35-4122-a1a2-a9d050136150	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-08-29 04:56:31.618
0b538f6d-556a-4e7d-8568-c997b9ebec85	63d9597c-0f35-4122-a1a2-a9d050136150	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-08-29 04:56:31.618
583ed191-b620-442a-a61c-92e9525fafb0	994fc17b-4c4f-4554-bc9c-bd2fed32b4aa	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-08-29 05:09:05.936
e355c9e6-fb2f-4739-ad00-231ca7cbdb7d	994fc17b-4c4f-4554-bc9c-bd2fed32b4aa	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-08-29 05:09:05.936
fef8117a-a21d-43ca-aa68-872064970c52	994fc17b-4c4f-4554-bc9c-bd2fed32b4aa	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-08-29 05:09:05.936
8e1f003b-a54e-4dcd-a76b-03c22d5ef1b6	ed21aad4-87dd-4dc6-aef8-8445ab862d94	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-08-29 05:09:29.891
44b68cd7-f19e-4597-9e82-ab2c70e972cd	ed21aad4-87dd-4dc6-aef8-8445ab862d94	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-08-29 05:09:29.891
f798a478-2b78-4749-af55-c0f7f4c7d160	ed21aad4-87dd-4dc6-aef8-8445ab862d94	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-08-29 05:09:29.891
e3c2721a-6c68-45ac-8899-dbf2a5b2ce6f	268e681f-390a-48bc-815f-d864994ed0b1	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-08-29 08:13:04.097
d4dbad0d-d7d8-4c8a-97f6-a4527f498e5f	268e681f-390a-48bc-815f-d864994ed0b1	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-08-29 08:13:04.097
5a55fb08-2c7a-4892-b6c5-1d51fb472b73	268e681f-390a-48bc-815f-d864994ed0b1	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-08-29 08:13:04.097
77c4aab0-4b92-47fd-83b9-da2fb1cc3f01	c6036169-d766-44fe-810a-dfc23ac65173	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-08-29 08:13:14.562
adca1b32-7226-4ff0-b145-082a844ed09c	c6036169-d766-44fe-810a-dfc23ac65173	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-08-29 08:13:14.562
7806d5bf-3793-4e97-85e7-618725bdb7d8	c6036169-d766-44fe-810a-dfc23ac65173	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-08-29 08:13:14.562
3518c122-6f59-450e-afed-9c98fc6e4ec0	c8f6b1c3-ed06-425e-966f-4ea43b2c3166	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-08-29 08:13:58.641
b1e2cbfe-9120-4f84-8f95-cad3050c2390	c8f6b1c3-ed06-425e-966f-4ea43b2c3166	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-08-29 08:13:58.641
9fec79d4-7a55-4c9f-815f-a01616146b71	c8f6b1c3-ed06-425e-966f-4ea43b2c3166	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-08-29 08:13:58.641
bf744c61-ed7b-4e88-b9dd-817eb3156bf5	c8f6b1c3-ed06-425e-966f-4ea43b2c3166	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-08-29 08:13:58.641
ed233967-baef-42ff-9387-ec7016646fdc	78ef3650-b526-4a94-a607-345e5a54d468	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-08-29 08:14:02.359
c073f399-a260-47f1-bf82-a5ec7ead8be5	78ef3650-b526-4a94-a607-345e5a54d468	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-08-29 08:14:02.359
42a68b52-4e8d-45d3-99b4-01b1b4c3cf3b	78ef3650-b526-4a94-a607-345e5a54d468	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-08-29 08:14:02.359
5f2e1757-1448-4f64-a3cb-477134ba2185	78ef3650-b526-4a94-a607-345e5a54d468	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-08-29 08:14:02.359
1b968132-0e0d-4503-b686-6e3c182e68d7	b6941d90-a7db-411d-ad1f-44243b9cf01c	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-08-29 08:14:50.202
3e28fb67-80c3-4af0-87da-22407cb6f220	a4c503e2-8970-40a4-b85a-aac9fac0df78	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-08-29 08:15:02.198
8ce46f8a-21de-4910-b058-1aa8582c7a28	2d4b0332-6d24-4c3b-9d05-5b43e7aaa193	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-08-29 08:15:03.297
190f2f6f-a5e4-4ced-ba0b-d121147cb563	2d4b0332-6d24-4c3b-9d05-5b43e7aaa193	49098001-4375-47f0-b36d-c8758d8715ff	\N	PENDING	\N	\N	2026-08-29 08:15:03.297
712c1a8c-8249-4cf6-89fb-25b45eb23c1a	2d4b0332-6d24-4c3b-9d05-5b43e7aaa193	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-08-29 08:15:03.297
767f4aff-3b15-4a8e-ad1f-8875e91c0f0a	428d431e-84d4-4774-9579-80ec54ab25da	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-08-29 08:15:11.581
f0486179-b531-4a51-b599-e95c16928c1d	292f4185-bad4-4f81-8a3a-c8c841c7d510	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-08-29 08:15:28.125
7c7f068d-2308-4036-9b0d-60af583faf67	292f4185-bad4-4f81-8a3a-c8c841c7d510	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-08-29 08:15:28.125
2e3713d1-e8df-4d76-bead-e06a32fca82c	292f4185-bad4-4f81-8a3a-c8c841c7d510	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-08-29 08:15:28.125
728be524-b2d7-41c9-a93e-3cfe538c43d0	df607f3d-3c8a-4099-b423-9367bf55dc19	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-08-29 08:15:28.29
92f47498-d65c-4a7b-a14f-f95e26f2b8d4	df607f3d-3c8a-4099-b423-9367bf55dc19	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-08-29 08:15:28.29
2578d0e9-7f51-4a6e-b52c-21c1f3dedaac	df607f3d-3c8a-4099-b423-9367bf55dc19	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-08-29 08:15:28.29
26d2b48b-ef22-4c7b-aa72-188b31ab3c35	da0fc039-d5ae-4ca0-8c95-2bd9e753b09e	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-08-29 08:15:44.75
63738065-ae1a-4c98-ba04-1555ef1033b2	da0fc039-d5ae-4ca0-8c95-2bd9e753b09e	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-08-29 08:15:44.75
bc21f32a-8548-4d6c-9004-e67169e1d1bf	da0fc039-d5ae-4ca0-8c95-2bd9e753b09e	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-08-29 08:15:44.75
89988c54-446b-46a2-a06b-f789c1963399	e5b3edec-3c31-49f3-b00d-1288ca14b5df	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-08-29 08:15:50.131
442d1298-6db8-4c06-bad4-baf57328c5a3	6b300ded-d565-4ad7-9982-5c16e159d8f0	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-08-29 08:16:03.623
4f7c4e88-8cd1-4874-a82e-c33daa8153c7	6b300ded-d565-4ad7-9982-5c16e159d8f0	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-08-29 08:16:03.623
21a1d00d-fbff-4b83-9fe4-844b570c1bb9	6b300ded-d565-4ad7-9982-5c16e159d8f0	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-08-29 08:16:03.623
e126aebc-027a-443a-a9ab-127998ae4de7	766e8743-14d4-42b8-bb8d-7bf92cd63684	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-08-29 08:16:17.335
276e5612-2ce5-41e8-8bea-625355ed116f	766e8743-14d4-42b8-bb8d-7bf92cd63684	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-08-29 08:16:17.335
01927f00-8120-4cd3-b4d3-0107e914d493	766e8743-14d4-42b8-bb8d-7bf92cd63684	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-08-29 08:16:17.335
94455e92-b831-40e9-b98b-6e117832fa21	09471fd9-50b2-4843-8d4d-94d32fd15797	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-08-29 08:16:36.507
ee052450-911d-4b38-908a-4c4633bffb3e	09471fd9-50b2-4843-8d4d-94d32fd15797	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-08-29 08:16:36.507
ef5f5c3b-21e8-4c1c-8a16-3d14f7630d40	09471fd9-50b2-4843-8d4d-94d32fd15797	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-08-29 08:16:36.507
5a25185d-e24d-4a46-87a9-a6ccff57acc4	fb0faaa5-debc-4214-a48b-6d3e66c76727	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-08-29 08:16:42.94
66bc0a0d-644d-4f64-9849-9c612a842ec1	fb0faaa5-debc-4214-a48b-6d3e66c76727	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-08-29 08:16:42.94
b6491b88-1a1b-41c7-af37-44346aa16915	fb0faaa5-debc-4214-a48b-6d3e66c76727	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-08-29 08:16:42.94
6b050e6f-b2c3-4183-aab6-09780551cce8	695f2624-62ba-4936-9263-38393c630568	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-08-29 08:17:00
9996eddc-929f-45d8-8bc8-eba2cf04c4ed	695f2624-62ba-4936-9263-38393c630568	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-08-29 08:17:00
e750cc60-2979-44da-bace-ff646e81caba	695f2624-62ba-4936-9263-38393c630568	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-08-29 08:17:00
56a6a0db-b205-4806-a10c-7ab8baa9d0c3	695f2624-62ba-4936-9263-38393c630568	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-08-29 08:17:00
c5293f35-16ed-4baa-991a-8bf40505e0e7	2123f217-471a-45e0-a736-e10406abd923	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-08-29 08:17:07.573
6fa4ebf1-3668-442f-8797-262aa0ecf097	2123f217-471a-45e0-a736-e10406abd923	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-08-29 08:17:07.573
6f5509ff-7600-42dd-952e-b6d2a0239379	2123f217-471a-45e0-a736-e10406abd923	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-08-29 08:17:07.573
13b81b6a-0c19-4f6b-8a7d-7e40a2cef356	af6b22cd-35ea-4b6b-be6e-bed64708e29d	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-08-29 08:17:09.019
16160185-6109-48be-8c5e-eb8f76a970e6	af6b22cd-35ea-4b6b-be6e-bed64708e29d	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-08-29 08:17:09.019
69165bb7-09f1-4152-a652-b8614a28c0c9	af6b22cd-35ea-4b6b-be6e-bed64708e29d	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-08-29 08:17:09.019
0ea7fd8e-3eec-469e-870d-5ff66d2b3ce9	af6b22cd-35ea-4b6b-be6e-bed64708e29d	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-08-29 08:17:09.019
5eccb19d-fab1-44c0-b571-e6b9b16cffac	fcd497fa-efbb-4f51-bed0-05dfd27c5a03	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-08-29 08:17:33.793
f1fd1bc6-5402-4cfa-b5a4-18c20a651d92	fcd497fa-efbb-4f51-bed0-05dfd27c5a03	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-08-29 08:17:33.793
c746658c-cb74-4217-85d9-c5e17f917b3d	fcd497fa-efbb-4f51-bed0-05dfd27c5a03	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-08-29 08:17:33.793
664b75a3-c485-44be-8a65-30300a7b4d2c	c7012f8e-d85a-4347-8b88-390314baeaa5	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-08-29 08:17:45.94
31ca8b33-da82-4a27-a71a-db5a292579eb	c7012f8e-d85a-4347-8b88-390314baeaa5	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-08-29 08:17:45.94
c0900f6f-4a48-4496-b743-f7a40ed4d120	c7012f8e-d85a-4347-8b88-390314baeaa5	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-08-29 08:17:45.94
bceb111c-757b-41c0-9918-a4209ebb86bb	c7012f8e-d85a-4347-8b88-390314baeaa5	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-08-29 08:17:45.94
eaf1f57b-e3c6-43db-b0c7-0d6e70dbe0f5	dbb09470-7f57-436d-9817-a92ea74127fe	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-08-29 08:18:20.036
472d41b3-2a9a-48b1-aaad-1e4413350a0e	dbb09470-7f57-436d-9817-a92ea74127fe	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-08-29 08:18:20.036
cc3d2381-e65c-4082-9808-b02209b462e1	dbb09470-7f57-436d-9817-a92ea74127fe	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-08-29 08:18:20.036
3241674c-b9e6-47f6-9f90-7a70c87435d8	dbb09470-7f57-436d-9817-a92ea74127fe	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-08-29 08:18:20.036
9b7fb111-76e5-4ce8-9725-8000b8278ee1	6ab232fd-0647-45ea-b546-5affb9de59f5	49098001-4375-47f0-b36d-c8758d8715ff	\N	PENDING	\N	\N	2026-08-29 08:18:34.579
ba11a25f-fbe8-4435-8e2c-194164422701	d8625dde-a109-41f0-ad12-8587b45058af	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-08-29 08:21:43.044
b52dae48-9dc9-47c8-839d-5c47f843a81c	22ef04d4-f2c7-46eb-a8dc-22b3b7837ce9	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-08-29 08:21:45.866
6388ab1e-d994-4fc8-88ba-f68e5650c77f	22ef04d4-f2c7-46eb-a8dc-22b3b7837ce9	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-08-29 08:21:45.866
4335bb6b-90ff-4329-9136-cd414bbfaa49	22ef04d4-f2c7-46eb-a8dc-22b3b7837ce9	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-08-29 08:21:45.866
a947d569-74d9-4a9b-a17f-68fe1ca16e5c	f53486c1-2ddc-425e-9075-03dcac7fda59	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-08-29 08:21:59.157
078ba699-e1cb-4e51-b3a1-11feff717408	f53486c1-2ddc-425e-9075-03dcac7fda59	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-08-29 08:21:59.157
572ec98d-034c-412a-a768-59c81abcd3ac	f53486c1-2ddc-425e-9075-03dcac7fda59	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-08-29 08:21:59.157
19069036-601e-4eb7-9e4b-68267ea631a5	3dcb7c76-e139-41c5-811b-ef00d6a39135	49098001-4375-47f0-b36d-c8758d8715ff	\N	PENDING	\N	\N	2026-08-29 08:23:12.498
21a5e1c5-4191-4d65-9c0e-0fc4c6489dd9	3dcb7c76-e139-41c5-811b-ef00d6a39135	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-08-29 08:23:12.498
2cab2148-d5c6-4927-a3ca-bd5ea447678d	21d92fd6-4429-473d-a814-b0d536838997	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-08-29 08:23:16.735
730bca6b-e18a-41e1-8182-a6ae9cedb71e	21d92fd6-4429-473d-a814-b0d536838997	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-08-29 08:23:16.735
9564f6c7-17f7-45b3-a0f3-bf5bdaedc3dd	21d92fd6-4429-473d-a814-b0d536838997	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-08-29 08:23:16.735
9535c83f-a3d2-40ce-9243-e7d34210f58a	21d92fd6-4429-473d-a814-b0d536838997	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-08-29 08:23:16.735
4f7b72c3-80f1-4413-8c5c-1073ab4ff4f7	e8a7413c-c55d-4ad9-8300-4171cef43a55	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-08-29 08:23:26.317
19d78615-0589-45d8-818c-70ec53719b7c	958e7754-561e-4860-89e8-5cdb0ad11bf1	49098001-4375-47f0-b36d-c8758d8715ff	\N	PENDING	\N	\N	2026-08-29 08:35:29.846
109a4311-9989-4901-9c5f-7033178f869a	a038ef60-2a46-4ff9-a721-2c69e9a0e450	49098001-4375-47f0-b36d-c8758d8715ff	\N	PENDING	\N	\N	2026-08-29 08:36:34.15
d46ead95-2c78-4150-9a1d-e7ed2cfa13d6	a038ef60-2a46-4ff9-a721-2c69e9a0e450	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-08-29 08:36:34.15
7f06e7fa-4636-42b6-8450-80f88114e603	3c474ba9-4d68-433d-bf10-867a9fe3b37c	49098001-4375-47f0-b36d-c8758d8715ff	\N	PENDING	\N	\N	2026-08-29 08:37:25.914
8690c5f9-1a9e-4ee6-a831-4426196b42dd	601a13a8-4974-4d8e-88fc-9854bf706428	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-08-29 08:37:49.876
7951a2f5-861c-4c0e-8889-8efba8c18410	61213425-1896-4cbd-84b7-10de70d7b6d2	49098001-4375-47f0-b36d-c8758d8715ff	\N	PENDING	\N	\N	2026-08-29 08:37:57.551
d1772ab6-5546-460e-be20-3e465aa29b5f	4bf95c82-40af-40dd-bce8-40827da59ee4	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-08-29 08:42:21.453
33b06c3e-f649-490e-88f5-3b684d5503eb	5db03681-df0c-4f26-bb0d-dd0625b84e48	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-08-29 08:42:22.412
8e84c76d-7fcc-43fe-a0fc-55bf9e58553d	1b35cd31-eb5c-4495-b31c-79764853a51c	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-08-29 08:42:24.957
c2187f78-d79e-4d9d-b32f-113a4c490cb6	ddd1cff1-cc41-4d2b-b4d7-e2497fd36990	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-08-29 08:42:25.446
a4de07eb-e304-48da-951d-f25ebc944283	0aa462a0-caf0-48ba-babf-05fe9e201601	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-08-29 08:42:26.997
25013932-e1d1-4c0d-a1fc-111faa428386	705eaf1b-f836-42b8-82b2-e1aa389caa83	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-08-29 08:42:28.697
5f880f5b-4978-4408-868a-f4ceff681aa2	820578dc-4d1f-4aa4-8583-aa0277e8782b	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-08-29 08:42:30.692
d6170633-a161-4739-bdcf-c3e4d3ad6fee	eebfaa92-378b-47a6-bf00-c9190266d8e2	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-08-29 08:42:31.641
892db7ff-2bb1-4dea-90ac-38d09258810e	f66e59a8-a4c7-4724-a8e6-91a18f02e3ed	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-08-29 08:42:32.492
436bedb3-885b-4b4f-a716-8fbd18ac0326	693734c5-2dd6-46ae-90a3-009b35b93142	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-08-29 08:42:33.001
7479b8f6-432d-4aef-8d89-ebb6354889ba	fe21082c-3adc-4bb5-a86b-33f8e06b5dcc	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-08-29 08:42:35.475
1afb360d-ed83-4e6a-877e-a7071a7cdb43	15285d76-f07b-4ec4-b702-1b2b16314d88	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-08-29 08:42:37.38
b90dd665-c8ca-4dcf-bc7d-357e1c2bbfdf	b06aa45d-2d11-4257-a6b8-aea7e04d43db	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-08-29 08:42:40.901
2931fe7d-a794-42dd-81a6-976639d3f1d7	89b1d450-f261-4044-a350-1e3388daff6b	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-08-29 08:42:46.791
f355ee98-9bff-417c-bfbe-97816e7bc714	bffbb772-0858-47c8-9fa0-13f833381f54	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-08-29 08:43:03.784
af9584f2-b3e8-403a-a524-3fe56cdeba1e	9a6db4c6-3c0b-4011-a45e-6acf204ca32e	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-08-29 08:43:08.74
116318aa-7378-4286-b70a-d47f160ea551	9a6db4c6-3c0b-4011-a45e-6acf204ca32e	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-08-29 08:43:08.74
1ae3687f-ef80-4072-a52d-081e548b4e3c	9a6db4c6-3c0b-4011-a45e-6acf204ca32e	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-08-29 08:43:08.74
5492f150-da58-466b-a67b-3923d56c9814	a806257c-53ce-4be4-a8bd-b3501157c897	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-08-29 08:43:16.645
242b6978-c510-4c3a-8bf1-ee8e01d6260e	dd4bcb7f-12dc-49c7-ade5-02ba69eae32c	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-08-29 08:43:34.146
a8d97cb1-58e1-4f21-a4bc-a09a7baf9d9c	2c9ff59a-7397-4118-8f68-b65dcccaf8d2	846641e3-667b-4e7f-b505-afdc1d66b54a	\N	PENDING	\N	\N	2026-08-29 08:43:51.85
b2719293-0710-4a58-b4da-f06b51ac5def	03f25f55-e28a-4f52-9fdc-b3d7307e0362	846641e3-667b-4e7f-b505-afdc1d66b54a	\N	PENDING	\N	\N	2026-08-29 08:44:25.327
82825b4f-8fb7-42f8-8066-07f50927c07f	67100b6f-4b92-4789-8bea-15910f0cb44d	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-08-29 08:44:37.101
a4d554c2-db22-48cf-92a4-b90e982ebd75	73a223bd-663f-427a-ab05-82e00838e088	c2a06e5b-22fd-4862-bf12-8c36f5e07d9c	\N	PENDING	\N	\N	2026-08-29 08:45:04.998
a102575f-0691-4133-bf45-22a30ceb771e	0e7da5eb-358d-4529-832f-e2dba068391a	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-08-29 09:18:03.555
d01348bf-2c32-463b-ba89-fb980545cb4a	7dd81eb6-33cb-4673-ad29-eb2feff61abb	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-08-30 10:06:59.719
18df3e43-0adc-4cf9-9ec5-59c00cf9525c	7dd81eb6-33cb-4673-ad29-eb2feff61abb	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-08-30 10:06:59.719
0dba5a16-860a-4708-b388-f65ce3181182	7dd81eb6-33cb-4673-ad29-eb2feff61abb	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-08-30 10:06:59.719
e7d1ef07-60a5-43a9-9d1a-5ca9d281648b	17828a99-e8ba-4eb8-b15a-793e2d2dc970	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-03 04:12:03.639
7e9e1bf0-fa94-4eb6-9250-c91042f29070	d34b450e-eca2-4a32-b426-d309f40665c7	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-03 04:12:54.067
bc7a268b-32b9-46c9-bd0d-353a0c0a629b	ee798423-06ee-44c0-a90c-f372ba0804a0	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-03 09:12:22.523
14598d3d-793c-4554-92e4-1978328ea3c0	448147e4-4ba0-471a-a2e5-6ebbc848f861	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-03 13:58:02.792
a8de7007-adb0-4b0c-ae4d-5c00e27de4c8	bc171f41-f076-404e-9bfa-8424aca1bc5d	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-04 01:09:54.849
803751ba-a314-4bec-8a4e-95419bb1f7d9	69c52c48-331f-4425-a24c-317a6cc59a59	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-04 01:10:56.366
0493da7e-1161-4957-9963-62c0ce8265b1	653a95c8-3d5f-4c42-a72b-9afc682b6c96	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-04 02:26:26.002
a75a4963-6538-47ed-bbd3-81ce939855e1	b62e6d9d-626b-4f9d-8900-373029ccf0d2	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-04 03:21:56.63
3f80a137-7be9-4913-94d8-18c290b08d39	b62e6d9d-626b-4f9d-8900-373029ccf0d2	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-04 03:21:56.63
29893a90-ebc7-4289-85bb-d5595dc2f8f2	b62e6d9d-626b-4f9d-8900-373029ccf0d2	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-04 03:21:56.63
0eccc5ec-4013-4452-8848-c694253ef8c5	b62e6d9d-626b-4f9d-8900-373029ccf0d2	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-04 03:21:56.63
7437ee7d-8457-4da5-a1a0-1409c9018d9f	a53b37bd-2dc6-4c52-845b-2dbc24b0cef4	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-04 07:19:29.993
9be680c1-2c20-442b-8e6a-de0a61af8424	dbf4791a-76b2-41aa-b33a-f2d859996fcc	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-05 03:17:38.516
32bb66c6-9c90-4463-8ee9-bce9044de58e	5b567612-a27b-4e04-94ea-ff2284dac672	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-05 03:17:50.934
e922493f-f895-42f5-898b-4a7ef748ba15	792a7c1b-22f5-4129-bb57-7eea42579a4b	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-05 03:20:38.856
64463971-a2f2-4677-86a8-9553390a221d	c463ccf1-c3c4-46ae-8cdd-b71b4aad60b6	49098001-4375-47f0-b36d-c8758d8715ff	\N	PENDING	\N	\N	2026-09-05 07:39:54.252
27b9b240-9907-4de7-a7ae-f88894457916	7d74843b-a185-4927-9218-612d1125d7cf	49098001-4375-47f0-b36d-c8758d8715ff	\N	PENDING	\N	\N	2026-09-05 08:47:56.115
e9df167b-a156-4708-820a-a559008c8f7a	78ad60c4-26e1-4668-afd8-0023b04c6ab2	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-05 10:15:40.784
5e589efc-85cb-46eb-bc87-11701ccdf546	6b8c086c-4eec-424c-b32f-00641fd7e180	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-05 10:45:50.564
865f906f-64f6-43d3-85ac-8b5ee211fb1b	4653ad1a-f410-466a-90be-2c5e303a5695	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-05 11:25:29.168
219c4894-5933-4e42-a0cc-1d303a4c20ae	8514dd6f-2028-4a90-bf85-a75267dc2774	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-05 11:26:04.748
47e9ea72-b467-4778-90ad-db50a4f09f33	65de5f4a-c1ea-419d-b290-2d6733f879c8	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-06 06:31:51.68
1df941ae-577d-4a5c-a1cd-70260b75b6fb	65de5f4a-c1ea-419d-b290-2d6733f879c8	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-06 06:31:51.68
7705188a-fa32-44e0-a1bf-adc7d8b1184c	65de5f4a-c1ea-419d-b290-2d6733f879c8	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-06 06:31:51.68
53e763a2-499a-45cf-bfa3-bd13dedaa2b3	dcf39b97-85f2-4c2d-8df6-ee44452f5971	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-06 06:32:46.126
e4a92d07-eecb-4f02-9906-cc35ac62a7d5	dcf39b97-85f2-4c2d-8df6-ee44452f5971	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-06 06:32:46.126
0fc4654b-e03e-4804-a541-72b460c300ae	dcf39b97-85f2-4c2d-8df6-ee44452f5971	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-06 06:32:46.126
142e7c15-fe6b-4184-8df1-bfbadb4ba918	0f364069-d542-499f-a5be-b5ed4ce72da3	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-06 06:36:45.392
fa00b5fa-1a43-4c7d-a094-a8b3bafe19c9	0f364069-d542-499f-a5be-b5ed4ce72da3	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-06 06:36:45.392
0688b75c-c9cc-49ba-a8ee-b71ff0f8f406	0f364069-d542-499f-a5be-b5ed4ce72da3	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-06 06:36:45.392
c0282bc2-f497-4652-bce7-4aea724be25e	d154998c-ac1d-4315-89a7-499fb526f269	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-06 06:36:49.454
7f66e4cf-1e7a-45c4-bd87-144035594ffe	d154998c-ac1d-4315-89a7-499fb526f269	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-06 06:36:49.454
b9954726-f400-4439-93c1-6580cd7b48be	d154998c-ac1d-4315-89a7-499fb526f269	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-06 06:36:49.454
444882c4-f493-430f-a83f-2304504d9768	d2492f80-a0bc-4066-ba2c-d3fa6fdc9ba2	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-06 06:39:24.089
2285d9ac-410b-4e54-b8e3-7c4b0d41aedd	d2492f80-a0bc-4066-ba2c-d3fa6fdc9ba2	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-06 06:39:24.089
ebb5f869-04b1-4e01-b609-9d334a9a1cba	d2492f80-a0bc-4066-ba2c-d3fa6fdc9ba2	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-06 06:39:24.089
b9b66a2c-e9af-4629-bd4d-1aec75a0caf5	abea9818-d1dc-4f1f-b961-249129f72554	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-06 06:39:26.644
688a8657-a235-465d-9bed-c4e54a276921	abea9818-d1dc-4f1f-b961-249129f72554	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-06 06:39:26.644
38b063fa-d01f-4a11-a1a8-a84bfb3d7f97	abea9818-d1dc-4f1f-b961-249129f72554	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-06 06:39:26.644
27f5dcd3-52f0-4058-b254-7088ab0197f5	75b89d2e-2453-4859-8cb8-5d9bfc6b52d3	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-06 06:43:57.771
c4e89a89-3d32-40fa-bd7a-bf00f50f9ebd	75b89d2e-2453-4859-8cb8-5d9bfc6b52d3	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-06 06:43:57.771
8364c42f-77b3-4b61-97b4-9b81acd7325b	75b89d2e-2453-4859-8cb8-5d9bfc6b52d3	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-06 06:43:57.771
0daa3ad6-5e6a-45a5-ad15-fbf42ac13e20	25082c70-4048-4235-9643-43f56e7e6b09	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-06 07:26:37.668
f8cdaf0b-9a64-4e65-9cb4-c471f915738e	25082c70-4048-4235-9643-43f56e7e6b09	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-06 07:26:37.668
983bbd61-3e69-4146-8241-7549f0c948c6	25082c70-4048-4235-9643-43f56e7e6b09	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-06 07:26:37.668
182dbede-d860-4d1c-b8c2-eaaf9d3b6421	41a39099-85ee-41b5-9d50-6a096665e172	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-06 07:26:52.499
6411f90c-ddfb-4c01-bc88-d5e033311eef	41a39099-85ee-41b5-9d50-6a096665e172	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-06 07:26:52.499
8bf6827a-0d02-4dee-8df4-f272f5886d9a	41a39099-85ee-41b5-9d50-6a096665e172	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-06 07:26:52.499
cccd97f1-2759-4931-866d-583cbc44e259	60ca619e-c9af-48a0-9e49-05d109c8e1c2	49098001-4375-47f0-b36d-c8758d8715ff	\N	PENDING	\N	\N	2026-09-06 07:56:58.226
14c8a3ca-976e-4483-b4ef-9cddb1e012de	2873bac6-89b9-43e4-8008-b52a10bcd9f1	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-06 07:56:58.63
117f7d1f-8aed-4819-ae42-3bbcb73df6f8	e6138958-5cff-42fe-bb24-453313f8b07c	49098001-4375-47f0-b36d-c8758d8715ff	\N	PENDING	\N	\N	2026-09-06 07:59:39.191
803a20f1-039b-4403-8796-86b5506d98d3	59261b15-950f-42be-9505-b5ad0db0b21b	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-06 07:59:39.584
bd94d856-5aa8-4927-a379-dfd9154e2d07	1f0c8f41-df6e-4b85-b017-fe35dc9a3544	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-06 08:42:25.28
a937681e-e84e-4164-8172-fb88e5ef90c9	cde2cedc-c7e8-4c21-8bc6-3b023d321e7e	49098001-4375-47f0-b36d-c8758d8715ff	\N	PENDING	\N	\N	2026-09-06 09:15:22.365
3e889d9e-342c-4c4d-927e-157dc5eea5ba	226e0435-740e-423c-9305-ccc46dd276ed	05ff1cc9-4cb6-4d87-a74b-0391a5539537	\N	PENDING	\N	\N	2026-09-06 09:16:04.876
05ffa4d8-88c2-4461-9640-924fbe934b99	171d326a-f786-4aa2-a427-5c9d1160d433	49098001-4375-47f0-b36d-c8758d8715ff	\N	PENDING	\N	\N	2026-09-06 10:53:23.999
b55f9d4a-d88f-49a1-a8b9-d1f12d2ccdd2	cdf229f0-65e5-45e7-9552-c8a00234c139	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-06 10:53:24.499
3022017b-47a4-4bd4-86d9-53a35e84a577	6ca3de38-a4a3-4e4b-abac-ea9709dc76b1	49098001-4375-47f0-b36d-c8758d8715ff	\N	PENDING	\N	\N	2026-09-06 11:25:25.257
1df40749-a1e8-4c6a-acdd-c0298c01b788	e5f8db5c-ed32-4a7a-9335-fec282aaf0ac	31bb72f7-e5e2-493e-827d-3320e1054461	\N	PENDING	\N	\N	2026-09-06 11:32:58.082
9d4397db-081a-45a5-80ed-79c30a3dd398	ca07801a-f41a-44a7-9b25-a7bab11fa95b	49098001-4375-47f0-b36d-c8758d8715ff	\N	PENDING	\N	\N	2026-09-07 08:28:08.998
0d6d7a9b-3104-44a5-9219-3ef76be927d4	9874ebb3-f6ef-4d28-86f1-652a7b0730e6	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-07 08:29:10.845
55ad78bf-af8b-41d8-842e-3a1090c748a0	9874ebb3-f6ef-4d28-86f1-652a7b0730e6	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-07 08:29:10.845
7149fc2a-1705-4516-ad8f-800b4820d569	9874ebb3-f6ef-4d28-86f1-652a7b0730e6	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-07 08:29:10.845
03d8d1b5-0c91-4a92-9699-7987ef67c400	f7f86a78-b866-4423-ab11-2d2ca479669c	49098001-4375-47f0-b36d-c8758d8715ff	\N	PENDING	\N	\N	2026-09-07 09:12:04.376
e66b4592-0d45-4157-bcae-a01cf7f343d7	f7f86a78-b866-4423-ab11-2d2ca479669c	05ff1cc9-4cb6-4d87-a74b-0391a5539537	\N	PENDING	\N	\N	2026-09-07 09:12:04.376
a970ec2a-10da-4765-ba49-3057bdc108ee	f7f86a78-b866-4423-ab11-2d2ca479669c	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-07 09:12:04.376
ef34efa0-6186-40ef-be52-df163f1ec088	64e5b84d-cd4f-4fa8-8ce9-d764a08c8880	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-07 09:12:16.994
9f6bf8a0-c838-42e0-bf8a-7e0bb24b83ab	d079a338-f5b5-4036-b299-47b06db5780e	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-07 09:24:54.526
396a9bf6-e335-4967-abbf-d864e8f588e5	50e11353-431e-43ac-8eb7-77418d93941a	05ff1cc9-4cb6-4d87-a74b-0391a5539537	\N	PENDING	\N	\N	2026-09-07 09:25:28.483
dbd494e9-1545-4057-af10-041b3c16158e	c19a5b21-509d-41b7-b452-59dddd3f0600	49098001-4375-47f0-b36d-c8758d8715ff	\N	PENDING	\N	\N	2026-09-07 09:26:20.362
86ea10fa-1518-40ef-8357-a8440952e67c	d29ba1a3-5dea-4c05-9bc5-764795cd475e	31bb72f7-e5e2-493e-827d-3320e1054461	\N	PENDING	\N	\N	2026-09-07 09:26:49.071
cc888abb-b7f8-41a9-9e38-c3be65803dc6	e1aba79b-e9e2-44a1-9ddb-4ddc53b19c4c	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-07 09:37:52.054
01e449ec-70a9-43ba-b204-b912a1772cf7	ed3c36b9-1560-428a-b6c9-51c0eeb9b927	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-08 07:46:45.044
5ac1b88e-54c6-4857-8815-e037a819e40b	6f846fa2-215c-4970-9543-8603e3314052	05ff1cc9-4cb6-4d87-a74b-0391a5539537	\N	PENDING	\N	\N	2026-09-08 10:01:07.48
6ea99a39-82e0-43de-841e-bb6ccd4337a4	b571a06c-be6c-40bb-bcba-7b5ed18c402c	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-08 12:10:25.993
1964a74c-d44a-42eb-8564-b4efa09b44e4	80950a3f-8db7-47f1-972d-d4ff3318931b	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-09 02:40:15.205
36678acd-1abb-4341-900e-8efa7476050a	80950a3f-8db7-47f1-972d-d4ff3318931b	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 02:40:15.205
08c353ff-a9c2-49a7-9585-d06e568577b7	80950a3f-8db7-47f1-972d-d4ff3318931b	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-09 02:40:15.205
05cee602-3557-44ea-8163-c776a6d58ab7	80950a3f-8db7-47f1-972d-d4ff3318931b	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-09 02:40:15.205
4fe7b7d6-d0e8-4893-a5da-6d1f1be470b6	aae37d11-1ad1-41c5-a9f4-44941c5bd266	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 02:41:29.384
d1ed7c99-99e2-4f4a-94cc-1be5c8acf0d1	1e66e0f1-6cba-4595-80b9-9d1789e20d2f	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 02:41:33.679
7c12380b-c76f-482c-a664-3ea648f47a5e	3d608b62-c261-47ad-aaf1-7f62feed3d8c	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-09 02:41:42.548
265fc30e-c7a1-4bc3-bbaa-76847ca063c6	c3b27657-32b6-46fe-a21e-8819a9c21388	49098001-4375-47f0-b36d-c8758d8715ff	\N	PENDING	\N	\N	2026-09-09 02:42:18.746
bf138c90-4bc8-4905-84c2-12184a1ea61b	c3b27657-32b6-46fe-a21e-8819a9c21388	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 02:42:18.746
9648a68f-b3ae-4cfc-93d7-a65d2b826d21	c3b27657-32b6-46fe-a21e-8819a9c21388	05ff1cc9-4cb6-4d87-a74b-0391a5539537	\N	PENDING	\N	\N	2026-09-09 02:42:18.746
265f7907-d15e-4033-b6fe-1a63c01c8e77	c3b27657-32b6-46fe-a21e-8819a9c21388	31bb72f7-e5e2-493e-827d-3320e1054461	\N	PENDING	\N	\N	2026-09-09 02:42:18.746
d129e139-b625-4b91-83ee-9729cb571057	8ed308fe-c321-4d5b-bd6d-90c1c934ebbc	49098001-4375-47f0-b36d-c8758d8715ff	\N	PENDING	\N	\N	2026-09-09 02:42:33.035
651b6312-93d6-4c44-844a-54aabef5fd94	8ed308fe-c321-4d5b-bd6d-90c1c934ebbc	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 02:42:33.035
becb500d-929d-4454-8b11-cff51da2394b	8ed308fe-c321-4d5b-bd6d-90c1c934ebbc	05ff1cc9-4cb6-4d87-a74b-0391a5539537	\N	PENDING	\N	\N	2026-09-09 02:42:33.035
76d54533-36e4-4fa7-8d31-0f4004bca09a	8ed308fe-c321-4d5b-bd6d-90c1c934ebbc	31bb72f7-e5e2-493e-827d-3320e1054461	\N	PENDING	\N	\N	2026-09-09 02:42:33.035
ab5cd3f0-9a3b-4e55-9d57-e6eab240b766	e1b0d87e-3fad-43e2-984a-2fb718838999	49098001-4375-47f0-b36d-c8758d8715ff	\N	PENDING	\N	\N	2026-09-09 02:43:35.85
e6218db2-3435-48e8-a821-6a9511398fe3	e1b0d87e-3fad-43e2-984a-2fb718838999	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 02:43:35.85
8405bece-8a63-4314-b3b1-035cd55413f7	e1b0d87e-3fad-43e2-984a-2fb718838999	05ff1cc9-4cb6-4d87-a74b-0391a5539537	\N	PENDING	\N	\N	2026-09-09 02:43:35.85
a6391c5a-ac3c-4163-bae4-6cc9f7aac114	e1b0d87e-3fad-43e2-984a-2fb718838999	31bb72f7-e5e2-493e-827d-3320e1054461	\N	PENDING	\N	\N	2026-09-09 02:43:35.85
2bbfc621-19d3-4134-a9ce-aefe62624748	7528f5ea-e2db-4623-b283-359a81bffe5f	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-09 03:21:03.98
b12840a0-9dc8-4e91-86d4-afc5d55c011c	7528f5ea-e2db-4623-b283-359a81bffe5f	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 03:21:03.98
69bc3bcb-8eb5-4f9a-83ca-6e98af9738bd	7528f5ea-e2db-4623-b283-359a81bffe5f	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-09 03:21:03.98
8b9cfd82-db15-4da6-8c4e-68cfa2fe5829	7528f5ea-e2db-4623-b283-359a81bffe5f	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-09 03:21:03.98
76212b3e-b5aa-479a-9ab3-62e633a97db2	11b3f540-f823-4504-8973-4b6329933f96	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 03:22:15.252
b95d4c4b-7121-495d-9a36-0c13e322cdf0	8524b96b-d517-4bb6-9a83-e80d50e5961f	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-09 03:22:22.457
48e6787f-b3a3-4051-87e3-edc60c4f0f3d	08b5a31e-7bf6-446e-b558-31b500226f6b	49098001-4375-47f0-b36d-c8758d8715ff	\N	PENDING	\N	\N	2026-09-09 03:22:31.248
c693b20c-4cb3-455d-9610-73c04a2cad6d	08b5a31e-7bf6-446e-b558-31b500226f6b	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 03:22:31.248
aec7fdff-7f52-4e6e-b2fd-b6d9a9623cb8	08b5a31e-7bf6-446e-b558-31b500226f6b	05ff1cc9-4cb6-4d87-a74b-0391a5539537	\N	PENDING	\N	\N	2026-09-09 03:22:31.248
1af8962a-70eb-4ba6-9dce-bbdc9dbd18c2	08b5a31e-7bf6-446e-b558-31b500226f6b	31bb72f7-e5e2-493e-827d-3320e1054461	\N	PENDING	\N	\N	2026-09-09 03:22:31.248
8291d0fe-0a7c-4ff0-8e7d-466a645c1268	601bed66-401d-4c4f-a4ff-8e0ea46720d4	49098001-4375-47f0-b36d-c8758d8715ff	\N	PENDING	\N	\N	2026-09-09 03:22:35.457
c5dc125b-b5fd-48db-b84f-ec549efaf617	601bed66-401d-4c4f-a4ff-8e0ea46720d4	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 03:22:35.457
b72d4e43-8b45-4f41-b559-69f3080679e4	601bed66-401d-4c4f-a4ff-8e0ea46720d4	05ff1cc9-4cb6-4d87-a74b-0391a5539537	\N	PENDING	\N	\N	2026-09-09 03:22:35.457
773800b4-4b7c-49a0-91d7-ecda1e288fd0	601bed66-401d-4c4f-a4ff-8e0ea46720d4	31bb72f7-e5e2-493e-827d-3320e1054461	\N	PENDING	\N	\N	2026-09-09 03:22:35.457
f970b655-1f1e-4888-afbf-33ee6768b627	3b5022b5-cc97-4821-853b-c837bc0ce7d4	49098001-4375-47f0-b36d-c8758d8715ff	\N	PENDING	\N	\N	2026-09-09 03:23:31.562
56f32a82-6925-42fb-80d6-02b8217d4544	3b5022b5-cc97-4821-853b-c837bc0ce7d4	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 03:23:31.562
5d287013-fe91-4d6d-9ea1-a86a2c588d09	3b5022b5-cc97-4821-853b-c837bc0ce7d4	05ff1cc9-4cb6-4d87-a74b-0391a5539537	\N	PENDING	\N	\N	2026-09-09 03:23:31.562
579a5154-08f6-42b1-bb63-fa2aa9c10993	3b5022b5-cc97-4821-853b-c837bc0ce7d4	31bb72f7-e5e2-493e-827d-3320e1054461	\N	PENDING	\N	\N	2026-09-09 03:23:31.562
34508d14-757f-4a45-b3fa-db1258e8b4dd	68bdc058-091d-453e-aff6-6a38c6a77de3	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-09 03:24:07.859
24a5f474-1af6-4ab0-9a30-e3aa23a3c09a	784ad660-7831-4e58-8682-9edd30f889d6	49098001-4375-47f0-b36d-c8758d8715ff	\N	PENDING	\N	\N	2026-09-09 03:24:29.368
7fa197af-a232-4df7-a42f-9e6583034a66	b4aad350-ec01-4690-b919-a419dd3f97cc	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-09 03:24:58.279
70939ecb-94c8-45ac-a55b-301f96be2d3f	b4aad350-ec01-4690-b919-a419dd3f97cc	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 03:24:58.279
40f148c0-eeae-474e-9ec4-87b2a4a3919c	b4aad350-ec01-4690-b919-a419dd3f97cc	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-09 03:24:58.279
bca8e4ea-8f15-432c-b8c8-764bcc36c4da	b4aad350-ec01-4690-b919-a419dd3f97cc	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-09 03:24:58.279
516e59b3-f3d8-47ea-8e07-6aa9f70fd6d7	59978d9a-51f6-496f-89d4-13c1ffaaa712	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-09 03:51:44.912
3f6c0323-2c14-48da-a40d-d41eda455733	59978d9a-51f6-496f-89d4-13c1ffaaa712	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 03:51:44.912
3c01f69b-42ba-45a4-98d1-f765539ac910	59978d9a-51f6-496f-89d4-13c1ffaaa712	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-09 03:51:44.912
7d4a3104-bad6-4287-856e-9ccb35c69550	59978d9a-51f6-496f-89d4-13c1ffaaa712	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-09 03:51:44.912
9a2b12a7-6dbc-41db-a801-73f496112a19	21501813-cfea-478f-b38f-98247eda0ac3	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-09 03:52:03.092
8f64d8a2-ca3d-4626-b2e0-0c43f6e810e7	21501813-cfea-478f-b38f-98247eda0ac3	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 03:52:03.092
f90d5ea4-32bd-40ec-b057-7918cb49f025	21501813-cfea-478f-b38f-98247eda0ac3	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-09 03:52:03.092
b07e51fe-ba88-45a5-9ba2-3cc581b9c6d0	21501813-cfea-478f-b38f-98247eda0ac3	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-09 03:52:03.092
38d89d6b-02da-4462-b02f-66ad71cd2ae5	4fe39037-03a4-4325-ac6a-a0d25945ded5	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-09 03:55:10.027
b75ec669-bde7-4ad3-8f64-485021af1a11	4fe39037-03a4-4325-ac6a-a0d25945ded5	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 03:55:10.027
d07d7ac6-101b-4636-bb97-346ce86a2c85	4fe39037-03a4-4325-ac6a-a0d25945ded5	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-09 03:55:10.027
127bbf71-fc97-4a6e-8ae5-5bff5ae7e921	4fe39037-03a4-4325-ac6a-a0d25945ded5	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-09 03:55:10.027
420b9301-055b-420d-82c4-fadc584fedd7	ac4ee8b3-739f-4d2a-a2d5-49dc105b09fa	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-09 03:55:28.564
a8bb5486-2bd6-4b23-9926-71b91872b492	ac4ee8b3-739f-4d2a-a2d5-49dc105b09fa	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 03:55:28.564
0838fb76-fc29-4776-8cfd-db8ef2e6c79c	ac4ee8b3-739f-4d2a-a2d5-49dc105b09fa	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-09 03:55:28.564
397e8d9a-5a76-45f8-8e16-6e4f9f905d16	ac4ee8b3-739f-4d2a-a2d5-49dc105b09fa	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-09 03:55:28.564
8942732d-1b39-46a9-97a2-7b82ee48d970	2acdc5a8-1bbe-4509-872e-d04d35c507a0	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-09 04:03:41.906
386dfdf5-bf93-40fb-8b68-43bfd724477d	bbddaeb2-8b2d-4f55-a9a9-c812907f0b3c	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 04:20:18.177
dabca6c7-0eca-4085-aade-6c0a59b0a6e5	545be964-5288-42e1-8fda-7a2d66b2fb12	49098001-4375-47f0-b36d-c8758d8715ff	\N	PENDING	\N	\N	2026-09-09 04:21:16.491
5c233aa1-2ccd-4d7a-8df2-c9bde10f5291	03903f78-6d29-404e-8182-28988c459574	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 04:21:16.878
97ee607f-a7b2-4dab-944c-6cded8597e6b	412a6ebd-2393-4aaf-aa68-60409dfd1ce7	49098001-4375-47f0-b36d-c8758d8715ff	\N	PENDING	\N	\N	2026-09-09 04:22:06.713
6c2fd7f0-c42c-4ec4-8ea4-401583409745	a9a2f679-7351-4b4a-8908-20e869a1825f	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 04:22:07.23
c02cc6f7-e363-47e6-9711-b7be3b6db74f	5acdfa35-cfde-42d6-a464-9552a4743d86	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-09 06:36:09.857
0799198a-baaf-4130-b008-027b192e3caa	5acdfa35-cfde-42d6-a464-9552a4743d86	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 06:36:09.857
6bf6b491-a4be-4e2d-a86a-9c317f566a56	5acdfa35-cfde-42d6-a464-9552a4743d86	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-09 06:36:09.857
8b2a8774-99d5-454a-b743-4afba855b7c1	5acdfa35-cfde-42d6-a464-9552a4743d86	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-09 06:36:09.857
01c533cc-a9c7-4d7e-93f4-4b6d7e8debee	5acdfa35-cfde-42d6-a464-9552a4743d86	49098001-4375-47f0-b36d-c8758d8715ff	\N	PENDING	\N	\N	2026-09-09 06:36:09.857
b9a6e508-4fea-445d-91b5-ec5a94e41546	908be3fa-a9ba-413f-948b-d44fd6773291	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 07:35:33.367
da2acd21-0bd4-4c37-8213-6f2e6fb4e0b6	593bed64-fd9e-4714-b91a-b444dcfcb4ec	d5f49e78-0b72-4304-8413-b90446ced4a0	\N	PENDING	\N	\N	2026-09-09 08:03:17.993
c43495f5-c4f2-4316-b530-b264abdde30e	593bed64-fd9e-4714-b91a-b444dcfcb4ec	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-09 08:03:17.993
5a2a3775-b1ae-4713-95ee-bc7d1e4f77a4	593bed64-fd9e-4714-b91a-b444dcfcb4ec	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 08:03:17.993
9ee6953b-c2c0-4255-82ad-eddfd006e02e	593bed64-fd9e-4714-b91a-b444dcfcb4ec	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-09 08:03:17.993
14622272-a1d7-445a-bfe7-cc5c38e3d7c8	593bed64-fd9e-4714-b91a-b444dcfcb4ec	334b2294-9bba-4f31-8290-5a87484a62f0	\N	PENDING	\N	\N	2026-09-09 08:03:17.993
a87e8484-fa73-4395-b0f8-011f1fb850bc	593bed64-fd9e-4714-b91a-b444dcfcb4ec	846641e3-667b-4e7f-b505-afdc1d66b54a	\N	PENDING	\N	\N	2026-09-09 08:03:17.993
de340535-c801-46e6-bbfa-245e49edc334	593bed64-fd9e-4714-b91a-b444dcfcb4ec	2a45f36d-2da9-492c-8bce-91a3440e71c1	\N	PENDING	\N	\N	2026-09-09 08:03:17.993
7bf18e24-04ac-4563-8fa7-6103bdd1920f	593bed64-fd9e-4714-b91a-b444dcfcb4ec	c2a06e5b-22fd-4862-bf12-8c36f5e07d9c	\N	PENDING	\N	\N	2026-09-09 08:03:17.993
a0a532bd-f1b5-4a59-a3ab-29d769864e97	593bed64-fd9e-4714-b91a-b444dcfcb4ec	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-09 08:03:17.993
a5e7437b-e9aa-4218-aa87-2e805b4371df	593bed64-fd9e-4714-b91a-b444dcfcb4ec	31bb72f7-e5e2-493e-827d-3320e1054461	\N	PENDING	\N	\N	2026-09-09 08:03:17.993
c9dab793-994a-45e5-847e-bc66ee26e4db	593bed64-fd9e-4714-b91a-b444dcfcb4ec	05ff1cc9-4cb6-4d87-a74b-0391a5539537	\N	PENDING	\N	\N	2026-09-09 08:03:17.993
5d8d05e8-a0f7-4dd5-8389-408223f954b9	fdab3cf6-cf3e-4f2d-8de7-4d928a895993	d5f49e78-0b72-4304-8413-b90446ced4a0	\N	PENDING	\N	\N	2026-09-09 08:03:27.787
cdaa65ca-ebe8-4023-8a97-a82951a3155a	fdab3cf6-cf3e-4f2d-8de7-4d928a895993	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-09 08:03:27.787
43727a13-7748-4541-8ede-ae5980da2b49	fdab3cf6-cf3e-4f2d-8de7-4d928a895993	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 08:03:27.787
f9611a36-fa04-41b5-9a2d-8468c0b956a4	fdab3cf6-cf3e-4f2d-8de7-4d928a895993	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-09 08:03:27.787
45fbe170-fb83-4f27-89dd-0bba1f848506	fdab3cf6-cf3e-4f2d-8de7-4d928a895993	334b2294-9bba-4f31-8290-5a87484a62f0	\N	PENDING	\N	\N	2026-09-09 08:03:27.787
187409a6-f169-491d-8b13-d2d2e9045339	fdab3cf6-cf3e-4f2d-8de7-4d928a895993	846641e3-667b-4e7f-b505-afdc1d66b54a	\N	PENDING	\N	\N	2026-09-09 08:03:27.787
1f509fd3-ffd3-422d-b0db-bfabbae952ed	fdab3cf6-cf3e-4f2d-8de7-4d928a895993	2a45f36d-2da9-492c-8bce-91a3440e71c1	\N	PENDING	\N	\N	2026-09-09 08:03:27.787
50bdc56a-1823-4c61-8fea-9b6140ee69d9	fdab3cf6-cf3e-4f2d-8de7-4d928a895993	c2a06e5b-22fd-4862-bf12-8c36f5e07d9c	\N	PENDING	\N	\N	2026-09-09 08:03:27.787
f1a7a1a3-ef70-4faa-a29e-e75be0300fd2	fdab3cf6-cf3e-4f2d-8de7-4d928a895993	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-09 08:03:27.787
fc4e4c4f-b9a5-488b-b95c-14500301f0e1	fdab3cf6-cf3e-4f2d-8de7-4d928a895993	31bb72f7-e5e2-493e-827d-3320e1054461	\N	PENDING	\N	\N	2026-09-09 08:03:27.787
77e2bbef-5460-4549-91a9-82660d28b6a0	fdab3cf6-cf3e-4f2d-8de7-4d928a895993	05ff1cc9-4cb6-4d87-a74b-0391a5539537	\N	PENDING	\N	\N	2026-09-09 08:03:27.787
749a90f0-f1af-46d4-aae5-ab330a0e4462	55be8ba5-d425-4821-bbea-c8011b614375	d5f49e78-0b72-4304-8413-b90446ced4a0	\N	PENDING	\N	\N	2026-09-09 08:03:33.83
2c6cf871-0752-4391-bd35-715ae46d7bb2	55be8ba5-d425-4821-bbea-c8011b614375	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-09 08:03:33.83
aa3e530e-4746-46e5-8cf8-26fb79366e7a	55be8ba5-d425-4821-bbea-c8011b614375	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 08:03:33.83
cd429325-81f6-406c-a4c2-128afc85fc7a	55be8ba5-d425-4821-bbea-c8011b614375	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-09 08:03:33.83
791034f7-9392-4a15-9689-61a686d4cc1f	55be8ba5-d425-4821-bbea-c8011b614375	334b2294-9bba-4f31-8290-5a87484a62f0	\N	PENDING	\N	\N	2026-09-09 08:03:33.83
ac76c10e-019e-464e-a507-36ea0c0186b0	55be8ba5-d425-4821-bbea-c8011b614375	846641e3-667b-4e7f-b505-afdc1d66b54a	\N	PENDING	\N	\N	2026-09-09 08:03:33.83
9c982724-fbaf-4c07-b278-3826769a81b0	55be8ba5-d425-4821-bbea-c8011b614375	2a45f36d-2da9-492c-8bce-91a3440e71c1	\N	PENDING	\N	\N	2026-09-09 08:03:33.83
1eac6554-2da2-4b1b-b1b2-a1453fa4896b	55be8ba5-d425-4821-bbea-c8011b614375	c2a06e5b-22fd-4862-bf12-8c36f5e07d9c	\N	PENDING	\N	\N	2026-09-09 08:03:33.83
e82a2045-8eb0-4d39-9143-73dfcc11e4f8	55be8ba5-d425-4821-bbea-c8011b614375	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-09 08:03:33.83
7b2f061f-2a29-40fb-aff7-ba55233b6401	55be8ba5-d425-4821-bbea-c8011b614375	31bb72f7-e5e2-493e-827d-3320e1054461	\N	PENDING	\N	\N	2026-09-09 08:03:33.83
0ad4fb0a-ec79-48d7-90dd-3906a9fc7d59	55be8ba5-d425-4821-bbea-c8011b614375	05ff1cc9-4cb6-4d87-a74b-0391a5539537	\N	PENDING	\N	\N	2026-09-09 08:03:33.83
378ac36d-9ef4-4e8f-a6a1-22abe66f0e0e	d625cc7e-63ca-47e6-904f-a0473ec78d18	d5f49e78-0b72-4304-8413-b90446ced4a0	\N	PENDING	\N	\N	2026-09-09 08:04:06.597
92756d14-4228-4ec4-a0f7-8552c5718e78	d625cc7e-63ca-47e6-904f-a0473ec78d18	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-09 08:04:06.597
edaa2110-6722-4b51-934e-400f69bd70d2	d625cc7e-63ca-47e6-904f-a0473ec78d18	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 08:04:06.597
cf2de8dc-4976-4bad-a640-0df4d43cbe51	d625cc7e-63ca-47e6-904f-a0473ec78d18	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-09 08:04:06.597
1b4f5c2d-dcba-4ca4-a369-e1133c20a686	d625cc7e-63ca-47e6-904f-a0473ec78d18	334b2294-9bba-4f31-8290-5a87484a62f0	\N	PENDING	\N	\N	2026-09-09 08:04:06.597
e8b4dec2-5b97-482c-addc-048d8469f8d2	d625cc7e-63ca-47e6-904f-a0473ec78d18	846641e3-667b-4e7f-b505-afdc1d66b54a	\N	PENDING	\N	\N	2026-09-09 08:04:06.597
db13d477-0d0a-4f6b-a061-8be150102430	d625cc7e-63ca-47e6-904f-a0473ec78d18	2a45f36d-2da9-492c-8bce-91a3440e71c1	\N	PENDING	\N	\N	2026-09-09 08:04:06.597
1257a877-07d8-4b9e-994a-8263e0dd9150	d625cc7e-63ca-47e6-904f-a0473ec78d18	c2a06e5b-22fd-4862-bf12-8c36f5e07d9c	\N	PENDING	\N	\N	2026-09-09 08:04:06.597
6cb9d841-4cdd-45c0-97e0-b9a4e3cc1ef5	d625cc7e-63ca-47e6-904f-a0473ec78d18	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-09 08:04:06.597
32a85fb2-1104-40fa-9c8a-1c465b113b1e	d625cc7e-63ca-47e6-904f-a0473ec78d18	31bb72f7-e5e2-493e-827d-3320e1054461	\N	PENDING	\N	\N	2026-09-09 08:04:06.597
52a0b610-7258-438a-b3fd-48b6625f5c37	d625cc7e-63ca-47e6-904f-a0473ec78d18	05ff1cc9-4cb6-4d87-a74b-0391a5539537	\N	PENDING	\N	\N	2026-09-09 08:04:06.597
73582bfd-f3c8-4d11-924a-dd08d7d01454	4186f6b9-f193-48c1-8ef9-77e69437a477	d5f49e78-0b72-4304-8413-b90446ced4a0	\N	PENDING	\N	\N	2026-09-09 08:04:10.844
dd967dbe-70dc-4c12-91dd-cbd3a057111c	4186f6b9-f193-48c1-8ef9-77e69437a477	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-09 08:04:10.844
40d372df-7c2a-43f3-9b8d-46eaeead663e	4186f6b9-f193-48c1-8ef9-77e69437a477	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 08:04:10.844
0ade7f1d-dbbe-400f-a5f0-8cf151f01ca3	4186f6b9-f193-48c1-8ef9-77e69437a477	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-09 08:04:10.844
a9490136-70d6-4fb4-88e4-96fdfb128581	4186f6b9-f193-48c1-8ef9-77e69437a477	334b2294-9bba-4f31-8290-5a87484a62f0	\N	PENDING	\N	\N	2026-09-09 08:04:10.844
01027fb0-7587-4fde-bb0c-f9c647f0079f	4186f6b9-f193-48c1-8ef9-77e69437a477	846641e3-667b-4e7f-b505-afdc1d66b54a	\N	PENDING	\N	\N	2026-09-09 08:04:10.844
f39e59b2-ac08-4695-a149-5a27c4a6f9e1	4186f6b9-f193-48c1-8ef9-77e69437a477	2a45f36d-2da9-492c-8bce-91a3440e71c1	\N	PENDING	\N	\N	2026-09-09 08:04:10.844
2f7e4668-de3c-45f6-a19b-5259fe00a1d7	4186f6b9-f193-48c1-8ef9-77e69437a477	c2a06e5b-22fd-4862-bf12-8c36f5e07d9c	\N	PENDING	\N	\N	2026-09-09 08:04:10.844
cb2a6f08-26c4-46cb-9528-082b99acc490	4186f6b9-f193-48c1-8ef9-77e69437a477	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-09 08:04:10.844
ea3b749b-6677-4db6-a837-55805a480ddf	4186f6b9-f193-48c1-8ef9-77e69437a477	31bb72f7-e5e2-493e-827d-3320e1054461	\N	PENDING	\N	\N	2026-09-09 08:04:10.844
ceee404c-8a0e-4314-b80a-e295c838a0ad	4186f6b9-f193-48c1-8ef9-77e69437a477	05ff1cc9-4cb6-4d87-a74b-0391a5539537	\N	PENDING	\N	\N	2026-09-09 08:04:10.844
44fc0a07-fa2e-4eaf-a1b7-ba8869a20615	fb2559de-4e7c-4b94-a615-8c2d7e435be6	d5f49e78-0b72-4304-8413-b90446ced4a0	\N	PENDING	\N	\N	2026-09-09 08:05:53.711
7ae23ec5-d9e7-4496-8a99-d491c36d5df7	fb2559de-4e7c-4b94-a615-8c2d7e435be6	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-09 08:05:53.711
aa03a707-f713-4df3-a9dc-3f43b08bc3cd	fb2559de-4e7c-4b94-a615-8c2d7e435be6	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 08:05:53.711
5afa8850-9d94-4a59-a332-0e1adfffbab9	fb2559de-4e7c-4b94-a615-8c2d7e435be6	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-09 08:05:53.711
abdb7b7f-f8f7-4f69-a38d-ca1171216b1a	fb2559de-4e7c-4b94-a615-8c2d7e435be6	334b2294-9bba-4f31-8290-5a87484a62f0	\N	PENDING	\N	\N	2026-09-09 08:05:53.711
ffc515dd-2540-41be-aace-99a99842c61c	fb2559de-4e7c-4b94-a615-8c2d7e435be6	846641e3-667b-4e7f-b505-afdc1d66b54a	\N	PENDING	\N	\N	2026-09-09 08:05:53.711
38025ee9-5757-45f8-8938-0de0ff3a0348	fb2559de-4e7c-4b94-a615-8c2d7e435be6	2a45f36d-2da9-492c-8bce-91a3440e71c1	\N	PENDING	\N	\N	2026-09-09 08:05:53.711
a0b43c5d-67a0-4320-9dd9-2eea432b8f7d	fb2559de-4e7c-4b94-a615-8c2d7e435be6	c2a06e5b-22fd-4862-bf12-8c36f5e07d9c	\N	PENDING	\N	\N	2026-09-09 08:05:53.711
172a52b4-944a-4997-b99a-a34df4ee4a63	fb2559de-4e7c-4b94-a615-8c2d7e435be6	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-09 08:05:53.711
ffd11018-0e94-4a5c-8830-60fd90a44592	fb2559de-4e7c-4b94-a615-8c2d7e435be6	31bb72f7-e5e2-493e-827d-3320e1054461	\N	PENDING	\N	\N	2026-09-09 08:05:53.711
892a5a38-8a00-4167-812a-f95081c97932	fb2559de-4e7c-4b94-a615-8c2d7e435be6	05ff1cc9-4cb6-4d87-a74b-0391a5539537	\N	PENDING	\N	\N	2026-09-09 08:05:53.711
fdfbaa5f-b2bb-4dfe-9792-6e8e948129ee	6bcb9f28-4f2b-4e46-8c6a-bcc38bd81c61	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-09 08:06:16.499
fc0329a2-3e2c-4b85-8928-bc8d1944148c	6bcb9f28-4f2b-4e46-8c6a-bcc38bd81c61	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 08:06:16.499
1f310ec7-2cde-43c6-aa74-1ef142e37c3f	6bcb9f28-4f2b-4e46-8c6a-bcc38bd81c61	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-09 08:06:16.499
3ba1fabd-68b5-4823-961b-bd9a55120f5d	6bcb9f28-4f2b-4e46-8c6a-bcc38bd81c61	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-09 08:06:16.499
00b998cb-e594-49fa-a220-35000d4462ff	6bcb9f28-4f2b-4e46-8c6a-bcc38bd81c61	49098001-4375-47f0-b36d-c8758d8715ff	\N	PENDING	\N	\N	2026-09-09 08:06:16.499
5b82c5e8-9886-45fc-b2dd-62ffee65e3bf	38590739-2d87-4e8a-8d4d-a8c84a3c8b19	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-09 08:13:03.467
43c21886-deca-4104-bfd8-cdd72c2b43fa	38590739-2d87-4e8a-8d4d-a8c84a3c8b19	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 08:13:03.467
986beda9-1ed7-4709-811d-c83eb85cd710	38590739-2d87-4e8a-8d4d-a8c84a3c8b19	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-09 08:13:03.467
c546ff39-a8ce-4ea6-beaa-895d919a2ae1	38590739-2d87-4e8a-8d4d-a8c84a3c8b19	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-09 08:13:03.467
61b9f8a0-51a1-41ef-ac0b-0ca503b37add	38590739-2d87-4e8a-8d4d-a8c84a3c8b19	49098001-4375-47f0-b36d-c8758d8715ff	\N	PENDING	\N	\N	2026-09-09 08:13:03.467
941039e4-b63d-4c0b-a6ac-62bd03e2322c	48b56abb-678f-493e-8325-8b93490088d8	d5f49e78-0b72-4304-8413-b90446ced4a0	\N	PENDING	\N	\N	2026-09-09 08:21:24.752
1f5bba83-91a4-4c7a-ad3c-92104872a7e0	48b56abb-678f-493e-8325-8b93490088d8	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-09 08:21:24.752
18a8daac-10f0-4bfe-a68b-7601f50dd964	48b56abb-678f-493e-8325-8b93490088d8	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 08:21:24.752
f37c4a1f-4632-47f1-b4ab-7bf3e57499ba	48b56abb-678f-493e-8325-8b93490088d8	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-09 08:21:24.752
924d607e-3c55-465c-aac8-cc60e365a409	48b56abb-678f-493e-8325-8b93490088d8	334b2294-9bba-4f31-8290-5a87484a62f0	\N	PENDING	\N	\N	2026-09-09 08:21:24.752
75e98827-07e5-4927-ba97-830893672a0f	48b56abb-678f-493e-8325-8b93490088d8	846641e3-667b-4e7f-b505-afdc1d66b54a	\N	PENDING	\N	\N	2026-09-09 08:21:24.752
d1e8115d-bb7c-4515-81fa-9349449205f2	48b56abb-678f-493e-8325-8b93490088d8	2a45f36d-2da9-492c-8bce-91a3440e71c1	\N	PENDING	\N	\N	2026-09-09 08:21:24.752
7e3bcba2-8d20-4364-adf7-c0f13f3abdd2	48b56abb-678f-493e-8325-8b93490088d8	c2a06e5b-22fd-4862-bf12-8c36f5e07d9c	\N	PENDING	\N	\N	2026-09-09 08:21:24.752
3a0e818d-7e91-413b-b16d-5eec4eed06f9	48b56abb-678f-493e-8325-8b93490088d8	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-09 08:21:24.752
4fbf1169-0962-468a-9648-5d9e0ac926ff	48b56abb-678f-493e-8325-8b93490088d8	31bb72f7-e5e2-493e-827d-3320e1054461	\N	PENDING	\N	\N	2026-09-09 08:21:24.752
23f50aba-55d9-4daa-bb9a-8fbbcf73b8b5	48b56abb-678f-493e-8325-8b93490088d8	05ff1cc9-4cb6-4d87-a74b-0391a5539537	\N	PENDING	\N	\N	2026-09-09 08:21:24.752
92b22d51-da82-451b-8580-0364200b90d3	4a852f49-25e1-4d8c-8df7-a21e9fe9f5d0	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-09 09:41:42.855
f2d6ea15-59c3-4359-a1a5-3a4d607454ec	4a852f49-25e1-4d8c-8df7-a21e9fe9f5d0	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-09 09:41:42.855
2376a1ae-8b1d-463c-b830-3ccdfd8a963c	4a852f49-25e1-4d8c-8df7-a21e9fe9f5d0	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-09 09:41:42.855
4d8ab695-8bb0-49a0-9ff7-aea221e79d6a	2e85bc08-99de-4809-a004-b611ce890b0b	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-09 09:41:59.95
0476a6c0-5a20-45fc-99e3-b12fd1a91f53	2e85bc08-99de-4809-a004-b611ce890b0b	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-09 09:41:59.95
0bcbdeed-29a8-48b2-86ca-f9996e7ce750	2e85bc08-99de-4809-a004-b611ce890b0b	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-09 09:41:59.95
11713896-77b6-4a2a-a08f-1c4904ef0379	1784b288-6094-4d79-94d0-9ac9ba2bbedf	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-09 09:42:21.814
76d79224-150a-4dff-9eb8-15a4c6e981a3	1784b288-6094-4d79-94d0-9ac9ba2bbedf	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-09 09:42:21.814
8a7738e2-4637-43e0-92de-84c70c856639	1784b288-6094-4d79-94d0-9ac9ba2bbedf	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-09 09:42:21.814
2b0aeeeb-bb3b-428f-8e71-a7d3f18c6f99	a2270b9e-ff6c-402d-9325-c40e9c722833	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-09 09:42:24.837
5ebd914b-3cd4-47a9-98b5-a3e070bde478	a2270b9e-ff6c-402d-9325-c40e9c722833	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 09:42:24.837
f1a03c0e-617c-4753-8eab-003d455d9ef9	a2270b9e-ff6c-402d-9325-c40e9c722833	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-09 09:42:24.837
77d5c5af-0b29-4955-bf85-4aac8fd069ab	dc99fdba-a7c6-4cce-96f8-66df9336c1d2	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-09 09:42:32.338
fc46214a-2c2a-49ce-b658-a7d6a0b89ba9	dc99fdba-a7c6-4cce-96f8-66df9336c1d2	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 09:42:32.338
ae1daf18-46e4-4291-9703-520a4030b62a	dc99fdba-a7c6-4cce-96f8-66df9336c1d2	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-09 09:42:32.338
2e6c8dc4-721c-45a4-8504-7995c982a8eb	467922fa-d36e-4093-87f8-997457716dd9	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-09 09:43:48.368
6eb37292-26d7-4949-8f7c-7bcee53c40ec	467922fa-d36e-4093-87f8-997457716dd9	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 09:43:48.368
1d3b6351-8ea9-485d-ad7f-257310a8d977	467922fa-d36e-4093-87f8-997457716dd9	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-09 09:43:48.368
2214cba5-660d-4835-8aec-3024b4f914d2	467922fa-d36e-4093-87f8-997457716dd9	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-09 09:43:48.368
2c961ffd-cf53-4fc3-b592-1a765dee39fd	164ee85f-915b-46a3-b824-4727a540a2f8	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-09 09:44:06.34
c5b77daf-4bcc-476f-a208-3316c6f0591e	164ee85f-915b-46a3-b824-4727a540a2f8	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 09:44:06.34
c4a11731-6027-46dd-a0a3-39c23360e84e	164ee85f-915b-46a3-b824-4727a540a2f8	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-09 09:44:06.34
6dc82472-ca82-4737-b3be-6ab5af5ada2b	164ee85f-915b-46a3-b824-4727a540a2f8	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-09 09:44:06.34
295d1564-4a3e-4f52-aeed-ec9481de8437	dd111423-4727-4f80-88f4-c6a78deaea82	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-09 09:47:18.616
54947bed-3ae5-484a-a1a4-62c8211a1176	dd111423-4727-4f80-88f4-c6a78deaea82	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 09:47:18.616
9249b859-ef56-4085-9f4f-a578a0ab040d	dd111423-4727-4f80-88f4-c6a78deaea82	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-09 09:47:18.616
b950afeb-a105-4942-879f-aed79a64227f	dd111423-4727-4f80-88f4-c6a78deaea82	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-09 09:47:18.616
41bec781-9853-4b49-bdf4-3fddc6699aad	7874e095-cc16-4a64-aba2-6293ef01607c	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-09 09:49:39.695
5ecead53-98af-4387-bb98-828ba08275ca	b03abd7d-f1a1-4ffa-91d8-1dd955b6af0f	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-09 09:49:58.637
0ed3f9e3-8edc-415f-a961-09afe5173d45	b03abd7d-f1a1-4ffa-91d8-1dd955b6af0f	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 09:49:58.637
5be9cc2c-f286-4ff3-bbea-3f1356c0348d	b03abd7d-f1a1-4ffa-91d8-1dd955b6af0f	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-09 09:49:58.637
6f325647-0860-43ae-9cc8-8208576b340f	f98ad09b-c081-470a-8645-13871070c39a	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-09 09:50:07.449
1e519358-054c-416d-bc94-aab8467c4a47	f98ad09b-c081-470a-8645-13871070c39a	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 09:50:07.449
9ec230af-ffbf-45ef-8ed5-2d7b320e75eb	f98ad09b-c081-470a-8645-13871070c39a	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-09 09:50:07.449
d33cbae4-7838-464b-94bb-b1a1327dbc32	bb67ebac-40ab-4a04-b5cd-1480ab65c358	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-09 09:50:11.078
57ee1dd2-8a2b-42fe-91a7-ed458bfbaba6	bb67ebac-40ab-4a04-b5cd-1480ab65c358	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 09:50:11.078
d1a3d44f-8e55-4cc7-886c-4e229888e97a	bb67ebac-40ab-4a04-b5cd-1480ab65c358	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-09 09:50:11.078
eb550fab-bf3b-4c8a-b08f-543e432d7c90	82096f76-ddae-47a1-ad0b-97056a0ce26d	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-09 09:50:15.567
0d427053-c990-4a43-997d-bb507e6512f9	82096f76-ddae-47a1-ad0b-97056a0ce26d	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 09:50:15.567
69485e98-6071-46f6-9d52-ce11ad6dede6	82096f76-ddae-47a1-ad0b-97056a0ce26d	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-09 09:50:15.567
f8898189-0f6a-4236-b88e-c254d5de102b	3b85c091-1612-4823-8051-55bf161bd674	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-09 09:50:21.544
2c8de47a-9d41-4307-af01-3e3169cfca12	3b85c091-1612-4823-8051-55bf161bd674	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 09:50:21.544
e6f2c2a7-ddd4-4ce0-968e-717e9d68de9d	3b85c091-1612-4823-8051-55bf161bd674	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-09 09:50:21.544
9b872210-e142-4b22-ab3c-2f9540123b59	f76d1ccd-37ba-4713-b3dc-ee9fa305cf9b	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-09 09:50:52.768
a2246ef9-99d0-4f93-a989-5c65109f6310	f76d1ccd-37ba-4713-b3dc-ee9fa305cf9b	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 09:50:52.768
327e7aa5-8295-4065-a023-101136004eac	f76d1ccd-37ba-4713-b3dc-ee9fa305cf9b	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-09 09:50:52.768
d4bf9b5e-16f8-4b09-8717-19df23de8a0e	84c4ece4-e7b8-4d49-92aa-4ce9b4c0d540	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-09 09:51:13.311
cb057a09-32eb-44e8-9949-7a84cb741a86	84c4ece4-e7b8-4d49-92aa-4ce9b4c0d540	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 09:51:13.311
fca3c1ff-99cf-4443-bfc0-aaf7078c0530	84c4ece4-e7b8-4d49-92aa-4ce9b4c0d540	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-09 09:51:13.311
f03c03a0-8256-4649-9f21-469ae52fa21a	9b173091-beae-4b37-b052-54783dc42247	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-09 09:51:25.536
ff20ab29-7d97-47fd-9aa8-8d6089fbf3a0	9b173091-beae-4b37-b052-54783dc42247	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 09:51:25.536
c05e09d6-7fe7-442c-a59d-5c875004dfd3	9b173091-beae-4b37-b052-54783dc42247	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-09 09:51:25.536
b095e176-60dc-49ea-8f18-4e8609c619a4	b73df914-936a-4d07-bbbb-800a7354276a	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 09:51:28.562
2eefd110-750f-4976-8407-5ba2b9d99a3f	b73df914-936a-4d07-bbbb-800a7354276a	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-09 09:51:28.562
723038a2-974e-4866-aef9-9ad61d0a2371	b73df914-936a-4d07-bbbb-800a7354276a	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-09 09:51:28.562
9d8e21aa-89f3-44c9-83b8-943fff7576fc	f0e0bbeb-fc44-428d-9c49-5d303fd4d7ae	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-09 09:51:38.483
c3a563a7-a16f-43e1-918c-5ea452b71406	f0e0bbeb-fc44-428d-9c49-5d303fd4d7ae	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 09:51:38.483
9ada32a5-0ade-4f70-93fb-d4ede3dae779	f0e0bbeb-fc44-428d-9c49-5d303fd4d7ae	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-09 09:51:38.483
0b2b645a-705a-42db-b756-d45474903608	59065cf0-04b7-4b13-86ae-040056df5612	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-09 09:51:41.65
b0306646-7f9a-4336-b0b4-162eaa4a1086	59065cf0-04b7-4b13-86ae-040056df5612	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 09:51:41.65
9e3785df-58bd-41af-9e06-980fa25cded7	59065cf0-04b7-4b13-86ae-040056df5612	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-09 09:51:41.65
5d114119-94d5-48e7-84a2-5903fcd0e592	96524952-ae4d-4b52-bea3-76980451081c	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-09 09:52:02.38
bc5c0b57-2323-4002-8dfd-52901e960831	96524952-ae4d-4b52-bea3-76980451081c	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 09:52:02.38
6dfb24db-18e4-4586-85e4-16d29721c7bd	96524952-ae4d-4b52-bea3-76980451081c	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-09 09:52:02.38
6bc20c34-39e0-4187-bae8-683d27386ad4	2186e87c-7382-4c39-9e3f-a6a4e32aff98	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 09:52:20.061
e13214e4-da44-42bb-a747-701f53531a24	2186e87c-7382-4c39-9e3f-a6a4e32aff98	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-09 09:52:20.061
04ba0283-b066-46c7-ac89-cb374420fcc5	2186e87c-7382-4c39-9e3f-a6a4e32aff98	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-09 09:52:20.061
7c5a77cc-7aaa-4bc4-896d-56a59799d4a2	0855325f-fbb8-4209-8d3b-afb21e12f0e2	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-09 09:52:42.837
41743e5b-f35c-4b33-bcd3-7319fb2d8816	0855325f-fbb8-4209-8d3b-afb21e12f0e2	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 09:52:42.837
fc57c98e-6712-4e4c-a0bd-f3972d7f476d	0855325f-fbb8-4209-8d3b-afb21e12f0e2	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-09 09:52:42.837
399b4eeb-1b78-4fdf-8379-89c134674778	5b54e0b7-fb90-4a68-8263-e24fb5fa8b20	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-09 09:52:53.063
6b26d8cd-24a8-4b10-be62-ad7158b42967	5b54e0b7-fb90-4a68-8263-e24fb5fa8b20	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 09:52:53.063
6cade1a4-9f26-429d-a35b-f39f51835c31	5b54e0b7-fb90-4a68-8263-e24fb5fa8b20	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-09 09:52:53.063
e53813e9-ba5a-43d5-b744-ef1e4a160093	fe7443d5-2c4f-4e57-839e-02aed71b814d	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-09 09:54:06.936
c2c5b2a1-5869-4a9e-9872-d6f327359200	fe7443d5-2c4f-4e57-839e-02aed71b814d	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 09:54:06.936
8c08522d-165d-4e99-9178-6a4f71656c53	fe7443d5-2c4f-4e57-839e-02aed71b814d	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-09 09:54:06.936
4d5d63dd-c016-415f-830a-73d2e0b1a6db	1da44f94-3e53-4759-be95-0a84b14fdc72	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-09 09:54:30.558
6c35d356-ce81-4add-b271-8279342c1603	1da44f94-3e53-4759-be95-0a84b14fdc72	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 09:54:30.558
509503a6-8460-4200-b1e3-44bcac5a3ad9	1da44f94-3e53-4759-be95-0a84b14fdc72	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-09 09:54:30.558
c8ff2d29-f413-4884-b12c-545ecc541e1d	c861adb9-7af3-46d5-9863-8e6905bd76de	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-09 09:54:23.52
caf52ed2-8c48-4d64-b97a-62376ae49e53	c861adb9-7af3-46d5-9863-8e6905bd76de	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-09 09:54:23.52
5d0c79e9-d7af-49c1-a46b-8bb232eeb70d	c861adb9-7af3-46d5-9863-8e6905bd76de	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-09 09:54:23.52
529f967b-d4c2-4896-b6bd-e8f2d2248ab7	c5d48869-2cc1-4f3a-a8f0-1eb0eb27d41c	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-09 09:55:49.335
b17316bc-bc57-4146-b505-ad0366bae6a2	c5d48869-2cc1-4f3a-a8f0-1eb0eb27d41c	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-09 09:55:49.335
8b8af570-190d-4119-a889-30e5ec04607e	c5d48869-2cc1-4f3a-a8f0-1eb0eb27d41c	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-09 09:55:49.335
4bbbd137-f9c8-4c5c-8638-3b1e5782ce02	a65cd0da-d280-4cc0-91fa-b8375c6c9fef	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-09 09:56:17.616
033c5e7f-947e-4587-b286-78ee56634e24	a65cd0da-d280-4cc0-91fa-b8375c6c9fef	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 09:56:17.616
881788b4-cc9f-4002-a54d-60c5f6343ac9	a65cd0da-d280-4cc0-91fa-b8375c6c9fef	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-09 09:56:17.616
78a79de4-358c-4b73-b1c9-58c084711843	3ce4c675-45a1-4753-b5cf-4ff0dab5ea1c	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-09 09:56:25.392
5f562d03-f1dd-4248-9e72-5a96524f184b	3ce4c675-45a1-4753-b5cf-4ff0dab5ea1c	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 09:56:25.392
c890b7e5-0d7c-49da-8f00-9c88f2a39244	3ce4c675-45a1-4753-b5cf-4ff0dab5ea1c	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-09 09:56:25.392
e2814b80-c25e-4c09-8228-5b9562d59bc3	29650f93-94bc-4162-ad99-e1b9920cb20b	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-09 10:04:29.712
0d27ccb4-8391-4420-aaa2-14607c7a0b5c	29650f93-94bc-4162-ad99-e1b9920cb20b	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 10:04:29.712
d5dfcaa6-21c8-447f-839e-8815b1521d46	29650f93-94bc-4162-ad99-e1b9920cb20b	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-09 10:04:29.712
b9527702-c279-4dce-97a6-7a46349ca12f	29650f93-94bc-4162-ad99-e1b9920cb20b	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-09 10:04:29.712
e3f9cae5-f356-4613-b408-43a0d5101124	7f6536ec-75fb-4ac4-b59e-438e774bc8d3	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-09 10:06:27.62
d843b6f7-67ee-4465-9b61-dc19f7214562	7f6536ec-75fb-4ac4-b59e-438e774bc8d3	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 10:06:27.62
40d8eb43-9ceb-4ae3-8672-0c950565da11	7f6536ec-75fb-4ac4-b59e-438e774bc8d3	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-09 10:06:27.62
686f7e8f-0270-4a4e-8f7c-78899e879095	9fb8725c-887c-4b1c-b694-46fff7d6ecf9	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-09 10:06:37.017
db1a84a9-5926-4ffc-86ed-98548d0547af	9fb8725c-887c-4b1c-b694-46fff7d6ecf9	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-09 10:06:37.017
6b38a137-e633-4cff-affc-e56556f35714	9fb8725c-887c-4b1c-b694-46fff7d6ecf9	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-09 10:06:37.017
0b9439b0-4c2e-491c-94cd-a62633b8b58d	faed012d-8ea7-47d7-9e3d-52f1f6adf579	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-09 10:06:50.349
208a5168-1350-478b-8025-556ecbe3fa5d	faed012d-8ea7-47d7-9e3d-52f1f6adf579	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 10:06:50.349
d6ba976f-2625-44de-9af2-4434e7498dc6	faed012d-8ea7-47d7-9e3d-52f1f6adf579	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-09 10:06:50.349
1b2c1232-a66b-4874-9238-465f156d4d22	2eb35ab1-6305-4862-bd9b-314006a95fa3	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-09 10:07:45.105
8e0f5d34-0044-49fc-8b2b-b85f257fe9dd	2eb35ab1-6305-4862-bd9b-314006a95fa3	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 10:07:45.105
2995ab52-862b-4644-8172-5f3d4f5e6fd8	2eb35ab1-6305-4862-bd9b-314006a95fa3	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-09 10:07:45.105
24977e11-a094-4100-b02d-ba405ef64677	9b9368c9-8d2b-4117-9200-e772fa014b80	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-09 10:08:05.194
bdd40742-14b2-4a21-8205-af81c10f6195	9b9368c9-8d2b-4117-9200-e772fa014b80	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 10:08:05.194
8ea7145c-3d72-44f6-920c-025db09ec0d2	9b9368c9-8d2b-4117-9200-e772fa014b80	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-09 10:08:05.194
07d8fab4-2fdd-4526-a7e4-ed9c46ad7d64	9b9368c9-8d2b-4117-9200-e772fa014b80	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-09 10:08:05.194
96a0bdb9-0b21-45e5-a53d-384fdb209b94	14841dac-3a57-48e2-9c95-ceb9d39b1dbc	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-09 10:13:43.757
6ae747b1-6b2d-48d8-986f-1598f4b39fbf	7e175463-5116-4ad4-ac64-25b42e23852e	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	PENDING	\N	\N	2026-09-09 10:17:44.699
13470b75-c139-4e38-8cba-6ccd13eaba06	7e175463-5116-4ad4-ac64-25b42e23852e	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	PENDING	\N	\N	2026-09-09 10:17:44.699
777fbb50-cb48-4f9b-a630-8e3e48a4c861	7e175463-5116-4ad4-ac64-25b42e23852e	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	PENDING	\N	\N	2026-09-09 10:17:44.699
3daa6946-5797-4986-aea7-3e870d99206e	7e175463-5116-4ad4-ac64-25b42e23852e	545ef296-1135-4885-8e61-89932645af6c	\N	PENDING	\N	\N	2026-09-09 10:17:44.699
\.


--
-- Data for Name: notification_targets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notification_targets (id, "notificationId", "userId", "readAt", "createdAt") FROM stdin;
cfedc931-7155-4924-af3e-2eaee7ffc504	851de599-66c5-4b5a-9d54-9a718bbdb551	49098001-4375-47f0-b36d-c8758d8715ff	2026-08-19 11:29:13.221	2026-08-19 11:03:47.513
c4ea6a3a-3cb0-4e83-b959-d861f5a1d5ae	c942c8d4-c38a-42a4-a4b5-ea409205ddee	49098001-4375-47f0-b36d-c8758d8715ff	2026-08-20 02:03:14.89	2026-08-20 02:01:01.143
2f8cb9fa-e9c7-499b-891c-f270551fca3b	a0ee9d5c-025c-4155-9430-812b6f97d1b9	49098001-4375-47f0-b36d-c8758d8715ff	2026-08-20 02:09:54.181	2026-08-20 02:08:39.3
06594c07-231d-4897-aa23-875771674147	83a94171-3683-4f48-a421-d13e0e45a83f	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-20 02:12:26.718	2026-08-20 02:10:06.522
da1194f0-e838-4398-b043-275b0ba5bdd9	dbb09470-7f57-436d-9817-a92ea74127fe	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-08-29 08:18:24.394	2026-08-29 08:18:20.036
63955b8f-290e-4bcf-adfc-1dfb6fbd0246	33e85cce-ced0-4d52-9acd-e4b45f23368c	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-20 02:13:17.25	2026-08-20 02:11:58.978
74aa2a0a-c8fa-48a6-9f8c-377aa4ca6d29	64cb8e14-e023-4a0a-808c-1e13f659ea65	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-08-20 02:13:23.304	2026-08-20 02:12:50.158
66e714a7-f3be-4c3e-89e4-1eb994ad6007	dbb09470-7f57-436d-9817-a92ea74127fe	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-08-29 08:18:45.796	2026-08-29 08:18:20.036
00c7269c-cb12-4138-bc89-62ba328c47eb	e4a34f11-8368-4b03-b135-7eeacee0d84f	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-20 02:19:10.309	2026-08-20 02:18:00.041
f017d5a2-473a-4519-a025-b7a314fe19b4	5fd18db5-d7bd-4ad9-a0b5-fa5ebb6a19f3	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-20 02:33:18.883	2026-08-20 02:21:53.896
95f6aa70-6624-4a79-ae00-c1a69db4e5ec	09467733-c51d-48f9-941f-e17ceb877870	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-20 02:33:18.883	2026-08-20 02:23:00.951
757da6f2-5309-47f6-bf06-0c606a8f90b0	f53486c1-2ddc-425e-9075-03dcac7fda59	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-08-29 08:44:23.76	2026-08-29 08:21:59.157
79d0083a-d6cf-42fd-94c6-b432dc9bbc75	dbb09470-7f57-436d-9817-a92ea74127fe	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-29 10:23:03.694	2026-08-29 08:18:20.036
5235be56-5f3b-409b-be73-f38cf5781a4c	76f65a34-05fb-48cd-b914-322e7f40d440	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-20 02:34:34.886	2026-08-20 02:34:23.58
085e34ee-69d0-4af3-a462-487e94fc3cae	467922fa-d36e-4093-87f8-997457716dd9	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 09:46:50.095	2026-09-09 09:43:48.368
2d3e2c21-a16c-4c1b-b7e8-eecba558e1b5	164ee85f-915b-46a3-b824-4727a540a2f8	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 09:46:50.095	2026-09-09 09:44:06.34
7a4c72a7-08c8-4435-ae89-166afd1cc4f4	467922fa-d36e-4093-87f8-997457716dd9	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-09 09:49:48.203	2026-09-09 09:43:48.368
19866d70-ca71-4b21-90bc-4d61bb95a86e	164ee85f-915b-46a3-b824-4727a540a2f8	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-09 09:49:48.203	2026-09-09 09:44:06.34
476a6084-dde2-4fa3-a150-6b79b4c9cd8d	dd111423-4727-4f80-88f4-c6a78deaea82	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 09:51:17.959	2026-09-09 09:47:18.616
9e89b831-a104-4ee3-a468-6de91d963c4a	b03abd7d-f1a1-4ffa-91d8-1dd955b6af0f	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 09:51:17.959	2026-09-09 09:49:58.637
98857d68-15ed-4edc-be5b-ec50997fb71b	f98ad09b-c081-470a-8645-13871070c39a	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 09:51:17.959	2026-09-09 09:50:07.449
567c1758-9a5f-4463-a70d-5b366f9e5994	82096f76-ddae-47a1-ad0b-97056a0ce26d	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 09:51:17.959	2026-09-09 09:50:15.567
aadda6ec-ca50-47bb-98ac-d7491d2be89c	3b85c091-1612-4823-8051-55bf161bd674	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 09:51:17.959	2026-09-09 09:50:21.544
f9014901-4986-49d1-9b47-7922e279d7ca	f76d1ccd-37ba-4713-b3dc-ee9fa305cf9b	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 09:51:17.959	2026-09-09 09:50:52.768
0152b915-61dc-4838-91b2-7389aec1a97a	467922fa-d36e-4093-87f8-997457716dd9	545ef296-1135-4885-8e61-89932645af6c	2026-09-09 09:51:32.018	2026-09-09 09:43:48.368
28621556-e31b-45e0-ac6f-9f50899a2e71	164ee85f-915b-46a3-b824-4727a540a2f8	545ef296-1135-4885-8e61-89932645af6c	2026-09-09 09:51:32.018	2026-09-09 09:44:06.34
39b8cfe8-e3fc-432f-ad76-9bfa5beb9a08	59065cf0-04b7-4b13-86ae-040056df5612	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-09 09:52:15.08	2026-09-09 09:51:41.65
4aab0d98-733b-4779-aff5-46240be48795	fc2f0a54-0ffd-47bc-94a7-759ab988edd6	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-09 10:05:23.581	2026-08-20 02:48:28.125
63117acf-5b38-441e-afd7-21eca3a07e60	7a8688c6-21bd-4fed-904a-392e0c6e4589	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-09 10:05:23.581	2026-08-20 02:53:19.865
5d465e9f-23af-41b9-b9d7-1d28d43c69e4	76f65a34-05fb-48cd-b914-322e7f40d440	49098001-4375-47f0-b36d-c8758d8715ff	2026-08-21 10:23:29.782	2026-08-20 02:34:23.58
a05a7079-0df3-422b-b8e1-e1656c9f1ead	b74189c2-134c-4549-b962-974520084e5f	49098001-4375-47f0-b36d-c8758d8715ff	2026-08-21 10:23:29.782	2026-08-21 02:12:41.027
0850651f-d647-4692-a5fe-8fecb762215c	6a0071b1-f7b5-4ff3-89da-1408076e6be2	49098001-4375-47f0-b36d-c8758d8715ff	2026-08-21 10:23:29.782	2026-08-21 02:12:48.793
f31898de-a20d-4bf2-a28b-24d3fce0c2b5	0b57fe30-efca-4d76-8ab6-42fb77cca684	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-21 10:24:11.261	2026-08-20 03:35:54.413
a994dc1e-c497-4926-92fc-daf776a8aa34	d6a14fec-6bba-43a0-bf4c-1bc914fe9037	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-21 10:24:11.261	2026-08-20 04:45:49.686
7d51d32b-b618-49ee-a672-210b0889efab	2f4756b8-2bf4-4b4f-a120-0878d17edba5	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-21 10:24:11.261	2026-08-20 08:49:25.688
eefb4006-3921-43cf-9215-52546dfd6931	64c52e44-0f1b-4d6a-9f24-e31a8c8fa365	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-21 10:24:11.261	2026-08-21 02:07:58.051
855900cd-842a-4602-87d8-10f608ce8b67	da009527-db18-4239-acf0-e564082f3ad8	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-21 10:24:11.261	2026-08-21 02:46:51.518
5d56b493-f838-427b-a776-799bc50f6a0c	98b1b2fa-1096-4aff-b5ff-9445e7432d85	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-21 10:24:11.261	2026-08-21 03:14:08.611
6c6e8d55-d7b3-4446-92e5-590a737936bc	c70dc573-1cde-4daa-9e93-ee9ec1752b7a	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-21 10:24:11.261	2026-08-21 04:33:03.845
5ac248f9-004d-4739-afbe-a77ec409bb50	229b137a-1356-453f-9c21-a12a74fff5fb	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-21 10:24:11.261	2026-08-21 10:15:45.033
2fba7b17-4921-4f87-9764-9b6151dfbc38	5509389d-5820-4e6c-a705-566d83c8167e	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-08-22 02:03:22.421	2026-08-21 06:33:35.77
71c8d7ed-c8b2-4a5e-b4e4-56a4173ee2d0	59065cf0-04b7-4b13-86ae-040056df5612	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 10:13:27.431	2026-09-09 09:51:41.65
2e0aecd3-c537-4dc0-9ecb-0140cb23e10f	0855325f-fbb8-4209-8d3b-afb21e12f0e2	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 10:13:27.431	2026-09-09 09:52:42.837
90b4f7c0-a6d8-4fa4-848d-1bba1c9b6c89	3aa7eab4-3b9e-4603-90eb-0b1bb4a47ffa	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-08-22 02:48:31.29	2026-08-20 02:50:31.271
787cef49-1ad5-42d0-bac6-71148f59095b	7cba22cf-4839-43c5-b556-c607b8beb140	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-08-22 02:48:31.29	2026-08-20 02:51:51.101
f4c62fce-d679-4200-9c7b-acd9d4132430	e1c4e5c6-22de-4707-ad4d-9c14be0ab1ed	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-08-22 02:48:31.29	2026-08-21 02:04:58.148
1392bc00-cb6f-4b45-a4c3-c7fe3a2b7ab1	5734fd68-fe87-40c4-ac58-2871c72156ca	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-08-22 02:48:31.29	2026-08-21 02:09:22.284
c932d457-5083-4829-9848-32a0aaf729b4	18169196-acb4-41c0-96ef-5b63fc6921d7	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-08-22 02:48:31.29	2026-08-21 02:10:18.275
6144f23f-2399-4c60-8e4d-51aa127b24be	54962ef9-5b94-4581-9d24-e6e8c8088a20	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-08-22 02:48:31.29	2026-08-21 02:11:25.933
e9eb09d9-c98c-4763-acd6-465cbdea59ca	4153b6a4-3cdf-4681-9d2e-7999c927208d	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-08-22 02:48:31.29	2026-08-21 06:33:31.75
7808aaad-1a6c-4446-803b-6af5a521e1d5	82198158-2a38-40ba-9a37-9846847ddc90	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-08-22 11:22:49.814	2026-08-22 02:20:27.003
bba921dd-c1cc-4f53-b9ab-d5315b52ab52	78abe25e-6ae1-4d0c-8812-bfff0c78b247	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-08-22 11:22:49.814	2026-08-22 02:20:54.135
00c828a3-139d-4d09-b19d-2669cc09e859	c78925a0-b9c2-44d7-8c4c-e6fa3354e185	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-08-22 11:22:49.814	2026-08-22 11:20:07.807
49b6765a-d0f8-4aff-ac83-f15d1c2af9cc	1363ac9c-d6c8-4d5b-ae34-d9bfc56bf54c	49098001-4375-47f0-b36d-c8758d8715ff	2026-08-24 08:59:58.82	2026-08-24 08:59:45.849
941758ee-3e17-41e3-8243-703f551e52eb	6a24cbc0-6fc6-4903-add9-a7dc7723de20	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-08-25 01:29:43.244	2026-08-24 19:19:07.857
b75f0ae7-a151-44bc-8a6a-24a73e3ad804	82198158-2a38-40ba-9a37-9846847ddc90	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-27 03:17:58.295	2026-08-22 02:20:27.003
ad33c403-7fbe-433c-952f-b4b144269037	78abe25e-6ae1-4d0c-8812-bfff0c78b247	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-27 03:17:58.295	2026-08-22 02:20:54.135
e7f8bdb6-9d65-46b2-8648-353851a9772b	c78925a0-b9c2-44d7-8c4c-e6fa3354e185	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-27 03:17:58.295	2026-08-22 11:20:07.807
986f3373-1248-4682-9231-187cf2c7e0e8	305fddb7-5c73-4a79-8475-cfc80e53b6be	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-08-27 03:18:21.013	2026-08-27 03:18:07.679
67462d9c-b064-47e1-8ff6-092560e2ea68	74ac9c49-3e44-4932-913e-612778acca99	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-27 03:18:27.906	2026-08-24 19:19:05.335
c3bd2423-1649-4ca5-a985-27c5d4ef92e7	19ca97cb-b0d0-4f56-8763-7b79b9747ab6	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-27 03:20:33.341	2026-08-22 02:20:04.666
db7459ba-9276-4d8b-b00e-777ca60f64cd	b21cd152-8572-44de-a33e-abac40d5eb36	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-08-27 11:32:16.27	2026-08-27 03:20:38.588
efcb05db-f598-401c-871b-15dcd109354e	0d2286dd-3391-41cb-85e1-eb29c8861a75	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-28 04:44:34.099	2026-08-27 16:08:04.695
3ac7cecc-d60a-4cee-84fb-59b7f22c5389	de2b5571-9bfb-4359-b753-9fb92c2f9b60	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-08-29 04:18:54.758	2026-08-27 03:20:39.201
cde98c5b-f284-45a4-909b-5f16edf4bec3	305fddb7-5c73-4a79-8475-cfc80e53b6be	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-08-29 04:19:23.795	2026-08-27 03:18:07.679
1b74e288-852e-4aba-b61c-cd35dfa1b44d	370339e3-35bf-4323-bdb8-9a132f889ec8	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-29 04:54:39.408	2026-08-29 03:07:08.313
41c15786-b11e-4d84-9bb9-1eee4043962a	27fe1017-359a-41eb-8824-3deca3cc884e	545ef296-1135-4885-8e61-89932645af6c	\N	2026-08-29 04:56:08.639
785d9f39-f446-404d-b907-94f0a61e7f80	f39fc4bd-48e0-48d9-8b94-2ea80bd7cc4d	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-29 04:56:16.28	2026-08-29 04:19:47.487
bc26ffac-b087-48cd-ae26-ca22355324c4	4541d7ba-2d70-472e-a20c-71375a64c9f1	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-08-29 04:56:53.557	2026-08-29 04:56:25.191
b390b0ae-7a52-4c01-baaf-cac8c9ea3714	63d9597c-0f35-4122-a1a2-a9d050136150	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-08-29 04:56:53.557	2026-08-29 04:56:31.618
1d1156e9-df54-4c67-9cd4-52f31d30c547	994fc17b-4c4f-4554-bc9c-bd2fed32b4aa	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-29 05:09:17.16	2026-08-29 05:09:05.936
ce3f8d5d-c48d-440c-8e73-f5e475db589b	de2b5571-9bfb-4359-b753-9fb92c2f9b60	49098001-4375-47f0-b36d-c8758d8715ff	2026-08-29 08:12:27.331	2026-08-27 03:20:39.201
6e5a20ed-bd5d-470d-a6ad-b47115ac66ee	0d2286dd-3391-41cb-85e1-eb29c8861a75	49098001-4375-47f0-b36d-c8758d8715ff	2026-08-29 08:12:27.331	2026-08-27 16:08:04.695
3b982b99-f65c-41e6-acf5-b9b0b78ed1ed	370339e3-35bf-4323-bdb8-9a132f889ec8	49098001-4375-47f0-b36d-c8758d8715ff	2026-08-29 08:12:27.331	2026-08-29 03:07:08.313
293556d6-29cd-45ce-8e50-137882d5d645	4541d7ba-2d70-472e-a20c-71375a64c9f1	545ef296-1135-4885-8e61-89932645af6c	2026-08-29 08:12:54.798	2026-08-29 04:56:25.191
b7766699-f12c-4f3a-9b59-22403f987d07	63d9597c-0f35-4122-a1a2-a9d050136150	545ef296-1135-4885-8e61-89932645af6c	2026-08-29 08:12:54.798	2026-08-29 04:56:31.618
3d491f86-0b1f-4fcd-8413-600b1b83ec19	994fc17b-4c4f-4554-bc9c-bd2fed32b4aa	545ef296-1135-4885-8e61-89932645af6c	2026-08-29 08:12:54.798	2026-08-29 05:09:05.936
32f87f36-1cf0-4a4a-ac4a-08dba8b7aa56	ed21aad4-87dd-4dc6-aef8-8445ab862d94	545ef296-1135-4885-8e61-89932645af6c	2026-08-29 08:12:54.798	2026-08-29 05:09:29.891
f3abab32-132a-4786-b755-543bbd4ee0d9	f39fc4bd-48e0-48d9-8b94-2ea80bd7cc4d	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-08-29 08:16:50.488	2026-08-29 04:19:47.487
895e6c6f-bc0d-4db3-a42b-85263242efd5	d079a338-f5b5-4036-b299-47b06db5780e	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-07 09:25:21.148	2026-09-07 09:24:54.526
70180412-b744-4a0f-b80a-c171d1aecd23	6ab232fd-0647-45ea-b546-5affb9de59f5	49098001-4375-47f0-b36d-c8758d8715ff	2026-08-29 08:20:17.514	2026-08-29 08:18:34.579
7eb666a2-a65e-4903-bac3-3b1c31441e28	994fc17b-4c4f-4554-bc9c-bd2fed32b4aa	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-08-29 08:13:28.261	2026-08-29 05:09:05.936
3195f35d-70ea-4ecd-a8e5-4ff218d75f69	ed21aad4-87dd-4dc6-aef8-8445ab862d94	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-08-29 08:13:28.261	2026-08-29 05:09:29.891
d0dae6f0-270b-4037-9c9a-54eb16c81796	268e681f-390a-48bc-815f-d864994ed0b1	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-08-29 08:13:28.261	2026-08-29 08:13:04.097
99481c51-f482-4c2e-ba97-26fe695cfe5d	c6036169-d766-44fe-810a-dfc23ac65173	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-08-29 08:13:28.261	2026-08-29 08:13:14.562
5eebe4b1-3b6c-4432-9ceb-ab759885e66f	c6036169-d766-44fe-810a-dfc23ac65173	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-29 08:14:53.469	2026-08-29 08:13:14.562
1a79a516-3168-4b0f-b321-dfcea4dfbf8a	d29ba1a3-5dea-4c05-9bc5-764795cd475e	31bb72f7-e5e2-493e-827d-3320e1054461	2026-09-07 09:27:20.649	2026-09-07 09:26:49.071
da5e4104-6846-43f4-b357-f460794f9a2f	ed3c36b9-1560-428a-b6c9-51c0eeb9b927	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-08 08:25:55.862	2026-09-08 07:46:45.044
1e0af5dc-b340-4dd3-b6e6-7a05b7da1b16	b571a06c-be6c-40bb-bcba-7b5ed18c402c	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 02:22:35.824	2026-09-08 12:10:25.993
bc6e06ca-fac0-4cee-b568-497eb63d7621	78ad60c4-26e1-4668-afd8-0023b04c6ab2	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 02:40:54.042	2026-09-05 10:15:40.784
50267240-b99d-47eb-8350-88ac7cda895b	8514dd6f-2028-4a90-bf85-a75267dc2774	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 02:41:09.674	2026-09-05 11:26:04.748
4e028800-337e-40b3-9b68-e560b94429af	4653ad1a-f410-466a-90be-2c5e303a5695	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 02:41:13.931	2026-09-05 11:25:29.168
dee50f24-39e5-405e-ada8-dd22b16a11ca	958e7754-561e-4860-89e8-5cdb0ad11bf1	49098001-4375-47f0-b36d-c8758d8715ff	2026-08-29 08:36:34.357	2026-08-29 08:35:29.846
c7d84a95-f59c-4f53-a470-d2a46478a71e	a038ef60-2a46-4ff9-a721-2c69e9a0e450	49098001-4375-47f0-b36d-c8758d8715ff	2026-08-29 08:37:37.743	2026-08-29 08:36:34.15
d52f67b7-8cee-4e58-a748-3c340f669b5f	601a13a8-4974-4d8e-88fc-9854bf706428	545ef296-1135-4885-8e61-89932645af6c	\N	2026-08-29 08:37:49.876
0a45ac8c-0140-4bc6-aedb-59a7d9371bd5	6b8c086c-4eec-424c-b32f-00641fd7e180	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 02:41:17.107	2026-09-05 10:45:50.564
a3dd0d30-90b5-4768-93e2-5ed8ef41ca51	61213425-1896-4cbd-84b7-10de70d7b6d2	49098001-4375-47f0-b36d-c8758d8715ff	2026-08-29 08:38:13.563	2026-08-29 08:37:57.551
195388a5-f1d3-4496-8e6f-2f2e124b3119	5db03681-df0c-4f26-bb0d-dd0625b84e48	545ef296-1135-4885-8e61-89932645af6c	\N	2026-08-29 08:42:22.412
2763f8e7-4b33-468c-886f-c977e4e5bfe2	ddd1cff1-cc41-4d2b-b4d7-e2497fd36990	545ef296-1135-4885-8e61-89932645af6c	\N	2026-08-29 08:42:25.446
ba79074e-8976-483f-8ec7-bba542d2e00c	705eaf1b-f836-42b8-82b2-e1aa389caa83	545ef296-1135-4885-8e61-89932645af6c	\N	2026-08-29 08:42:28.697
415b22d0-3da0-45bb-a3d6-292ca1b7de3b	f66e59a8-a4c7-4724-a8e6-91a18f02e3ed	545ef296-1135-4885-8e61-89932645af6c	\N	2026-08-29 08:42:32.492
76bcd8ab-3aa0-43c0-a185-8a09f19e8973	dd111423-4727-4f80-88f4-c6a78deaea82	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-09 09:49:48.203	2026-09-09 09:47:18.616
564ab090-900b-4d88-bbdd-87fe02ea49b4	15285d76-f07b-4ec4-b702-1b2b16314d88	545ef296-1135-4885-8e61-89932645af6c	\N	2026-08-29 08:42:37.38
94a89e36-0d0a-4722-b05b-d82fa8e43c60	fe21082c-3adc-4bb5-a86b-33f8e06b5dcc	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-08-29 08:42:47.578	2026-08-29 08:42:35.475
927c756f-df70-490e-9237-803b72eec8a2	dbb09470-7f57-436d-9817-a92ea74127fe	545ef296-1135-4885-8e61-89932645af6c	2026-08-29 08:43:00.818	2026-08-29 08:18:20.036
d24fd2d8-c0ef-4459-aa2a-58b32e48d435	21d92fd6-4429-473d-a814-b0d536838997	545ef296-1135-4885-8e61-89932645af6c	2026-08-29 08:43:00.818	2026-08-29 08:23:16.735
fc039d25-855b-4f6f-91f6-11fb32646438	695f2624-62ba-4936-9263-38393c630568	545ef296-1135-4885-8e61-89932645af6c	2026-08-29 08:43:00.818	2026-08-29 08:17:00
4b0c74ec-b7c2-4234-ba77-e9722d30547b	af6b22cd-35ea-4b6b-be6e-bed64708e29d	545ef296-1135-4885-8e61-89932645af6c	2026-08-29 08:43:00.818	2026-08-29 08:17:09.019
80b85fff-1ae8-4716-bb8a-71598be349ea	c7012f8e-d85a-4347-8b88-390314baeaa5	545ef296-1135-4885-8e61-89932645af6c	2026-08-29 08:43:00.818	2026-08-29 08:17:45.94
d9ab5dfc-40aa-4c95-ad58-49d709b8c47b	bffbb772-0858-47c8-9fa0-13f833381f54	545ef296-1135-4885-8e61-89932645af6c	\N	2026-08-29 08:43:03.784
6b33040b-51ef-471b-b03c-c0c492333d82	dd111423-4727-4f80-88f4-c6a78deaea82	545ef296-1135-4885-8e61-89932645af6c	2026-09-09 09:51:32.018	2026-09-09 09:47:18.616
c8cb7b08-f7ce-416a-8f93-314011c3cfbf	a806257c-53ce-4be4-a8bd-b3501157c897	545ef296-1135-4885-8e61-89932645af6c	\N	2026-08-29 08:43:16.645
3b8885bc-9a3b-4506-8d88-fd04b849a492	dd4bcb7f-12dc-49c7-ade5-02ba69eae32c	545ef296-1135-4885-8e61-89932645af6c	\N	2026-08-29 08:43:34.146
f698f362-c3c9-49d1-b293-5041986952b7	21d92fd6-4429-473d-a814-b0d536838997	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-08-29 08:44:23.76	2026-08-29 08:23:16.735
8fe09d07-0880-47bb-97c1-0e23641849b3	9a6db4c6-3c0b-4011-a45e-6acf204ca32e	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-08-29 08:44:23.76	2026-08-29 08:43:08.74
db69e5bf-57b6-4a1b-9d2c-eb8958f5d920	fcd497fa-efbb-4f51-bed0-05dfd27c5a03	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-08-29 08:44:23.76	2026-08-29 08:17:33.793
d0b17823-cf57-4280-94e4-690c0b2cd9c2	c7012f8e-d85a-4347-8b88-390314baeaa5	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-08-29 08:44:23.76	2026-08-29 08:17:45.94
f88cd9e1-a13d-4997-9bc3-6f30d84ffa52	22ef04d4-f2c7-46eb-a8dc-22b3b7837ce9	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-08-29 08:44:23.76	2026-08-29 08:21:45.866
b6156c38-d9c3-4b39-91e3-04c43f996765	aae37d11-1ad1-41c5-a9f4-44941c5bd266	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 02:41:59.896	2026-09-09 02:41:29.384
00d0735d-2742-43bc-9e4a-22327179a58c	03f25f55-e28a-4f52-9fdc-b3d7307e0362	846641e3-667b-4e7f-b505-afdc1d66b54a	2026-08-29 08:44:34.357	2026-08-29 08:44:25.327
3d5d755e-fda0-4784-bf98-351cb66af7fa	73a223bd-663f-427a-ab05-82e00838e088	c2a06e5b-22fd-4862-bf12-8c36f5e07d9c	\N	2026-08-29 08:45:04.998
473a6340-f6f7-4580-a063-385797373ff8	f53486c1-2ddc-425e-9075-03dcac7fda59	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-08-29 08:45:22.515	2026-08-29 08:21:59.157
c27b4508-af99-4dda-a666-84f690d006b0	21d92fd6-4429-473d-a814-b0d536838997	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-08-29 08:45:22.515	2026-08-29 08:23:16.735
b3d17ef5-b993-4ecf-8ed1-15b4108aa6fa	9a6db4c6-3c0b-4011-a45e-6acf204ca32e	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-08-29 08:45:22.515	2026-08-29 08:43:08.74
561796b9-6e5e-4e93-bb51-230859dffb7f	f53486c1-2ddc-425e-9075-03dcac7fda59	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-29 10:23:03.694	2026-08-29 08:21:59.157
50c0e8c1-6555-4c05-b01a-8a07d504a55c	21d92fd6-4429-473d-a814-b0d536838997	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-29 10:23:03.694	2026-08-29 08:23:16.735
7250a98a-23f8-4056-b333-32e9b6e9e94e	a038ef60-2a46-4ff9-a721-2c69e9a0e450	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-29 10:23:03.694	2026-08-29 08:36:34.15
e507bee6-85f9-4f9b-bbff-a50b05ad001c	9a6db4c6-3c0b-4011-a45e-6acf204ca32e	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-29 10:23:03.694	2026-08-29 08:43:08.74
bc497d24-1140-41b0-8b8e-1c7426b26b16	09471fd9-50b2-4843-8d4d-94d32fd15797	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-29 10:23:03.694	2026-08-29 08:16:36.507
785e6af7-59b1-4761-8cd4-d9d687305a46	695f2624-62ba-4936-9263-38393c630568	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-29 10:23:03.694	2026-08-29 08:17:00
b1f5ff87-b021-4ebd-91be-8ff792411da7	2123f217-471a-45e0-a736-e10406abd923	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-29 10:23:03.694	2026-08-29 08:17:07.573
39aae979-686f-497d-afd5-2c453d05277a	af6b22cd-35ea-4b6b-be6e-bed64708e29d	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-29 10:23:03.694	2026-08-29 08:17:09.019
106e8a03-6df8-4f3a-b69b-3d7707ab0651	fcd497fa-efbb-4f51-bed0-05dfd27c5a03	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-29 10:23:03.694	2026-08-29 08:17:33.793
6482121a-d865-4b45-82c9-029ef0aa9c5a	c7012f8e-d85a-4347-8b88-390314baeaa5	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-29 10:23:03.694	2026-08-29 08:17:45.94
b65a5268-7320-4f15-a5b0-36cda80fb3bd	22ef04d4-f2c7-46eb-a8dc-22b3b7837ce9	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-29 10:23:03.694	2026-08-29 08:21:45.866
bd6cad22-8bd0-4994-8164-ed2629d3848c	3dcb7c76-e139-41c5-811b-ef00d6a39135	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-29 10:23:03.694	2026-08-29 08:23:12.498
7daefa4b-53d4-4e9e-b220-d94e6fdc0f4b	67100b6f-4b92-4789-8bea-15910f0cb44d	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-29 10:23:03.694	2026-08-29 08:44:37.101
93c903a2-69bb-4818-8b08-862aea62324b	0e7da5eb-358d-4529-832f-e2dba068391a	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-29 10:23:03.694	2026-08-29 09:18:03.555
5d9b39fd-8fbb-457f-a166-8bd1f0a37aa2	dd111423-4727-4f80-88f4-c6a78deaea82	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 09:54:14.233	2026-09-09 09:47:18.616
8bae196b-222e-4713-903f-9f98a04af6df	1e66e0f1-6cba-4595-80b9-9d1789e20d2f	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 02:42:03.22	2026-09-09 02:41:33.679
9299590f-f35a-4eef-8dbd-0b71357056f8	b03abd7d-f1a1-4ffa-91d8-1dd955b6af0f	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 09:54:14.233	2026-09-09 09:49:58.637
01f7b953-108d-4909-b9dc-4ece3ffd7bf1	bc171f41-f076-404e-9bfa-8424aca1bc5d	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-04 02:47:04.871	2026-09-04 01:09:54.849
ecf01dc9-9417-40b3-a89b-2373be0494e1	b62e6d9d-626b-4f9d-8900-373029ccf0d2	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-04 04:27:18.12	2026-09-04 03:21:56.63
e21ea647-16d1-4298-a6aa-b958d2974194	a53b37bd-2dc6-4c52-845b-2dbc24b0cef4	545ef296-1135-4885-8e61-89932645af6c	\N	2026-09-04 07:19:29.993
612a3bd5-8669-4eaa-bab3-ba68f99efd4e	ee798423-06ee-44c0-a90c-f372ba0804a0	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-04 10:18:05.241	2026-09-03 09:12:22.523
7d7f70ef-a0b5-458e-9e6f-2c2b514123d7	b62e6d9d-626b-4f9d-8900-373029ccf0d2	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-04 10:24:30.675	2026-09-04 03:21:56.63
c12b214d-3b0b-404c-b81b-55bebfb66685	8ed308fe-c321-4d5b-bd6d-90c1c934ebbc	05ff1cc9-4cb6-4d87-a74b-0391a5539537	\N	2026-09-09 02:42:33.035
cc9433ad-f4c0-4671-b3b5-f82e6509dca1	8ed308fe-c321-4d5b-bd6d-90c1c934ebbc	31bb72f7-e5e2-493e-827d-3320e1054461	\N	2026-09-09 02:42:33.035
47843710-2b4c-4843-9775-6743fa3fd307	792a7c1b-22f5-4129-bb57-7eea42579a4b	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-05 03:22:28.727	2026-09-05 03:20:38.856
efe3a4fd-b3d1-41d9-9ed9-1de1c9935bd1	3d608b62-c261-47ad-aaf1-7f62feed3d8c	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-09 02:43:17.391	2026-09-09 02:41:42.548
25d0e6d2-a3bc-4926-8b3e-d946e369deca	dbf4791a-76b2-41aa-b33a-f2d859996fcc	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-05 03:22:23.724	2026-09-05 03:17:38.516
03a8f9b2-ac28-4abe-8582-98451d3bd43b	5b567612-a27b-4e04-94ea-ff2284dac672	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-05 03:22:26.945	2026-09-05 03:17:50.934
b5d81820-d0dd-430f-aeff-92a795c9f2ff	c463ccf1-c3c4-46ae-8cdd-b71b4aad60b6	49098001-4375-47f0-b36d-c8758d8715ff	2026-09-05 08:19:33.824	2026-09-05 07:39:54.252
44d83a0a-ac3d-4c67-87dc-0936c9e91127	7d74843b-a185-4927-9218-612d1125d7cf	49098001-4375-47f0-b36d-c8758d8715ff	2026-09-05 10:16:06.025	2026-09-05 08:47:56.115
e06bceb8-064d-4b01-b291-09993da3f483	e1b0d87e-3fad-43e2-984a-2fb718838999	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 02:44:12.559	2026-09-09 02:43:35.85
39b84016-03d0-41d9-aa70-404f19cb85b8	e1b0d87e-3fad-43e2-984a-2fb718838999	49098001-4375-47f0-b36d-c8758d8715ff	2026-09-09 02:45:15.01	2026-09-09 02:43:35.85
13c0059a-9725-439b-a45c-60eada8d8d61	65de5f4a-c1ea-419d-b290-2d6733f879c8	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-06 06:32:14.027	2026-09-06 06:31:51.68
8ebad4d8-80b2-40ac-9cb9-5d25d15b3a75	b62e6d9d-626b-4f9d-8900-373029ccf0d2	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-06 06:32:14.027	2026-09-04 03:21:56.63
b4a949db-4a53-4389-95c5-2ba1907f668e	8ed308fe-c321-4d5b-bd6d-90c1c934ebbc	49098001-4375-47f0-b36d-c8758d8715ff	2026-09-09 02:45:41.405	2026-09-09 02:42:33.035
cf0e709e-c035-4f85-8c82-84b023961697	dcf39b97-85f2-4c2d-8df6-ee44452f5971	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-06 06:36:33.249	2026-09-06 06:32:46.126
cbbf7fbe-b8c7-47ad-b204-211bd24e0f6e	65de5f4a-c1ea-419d-b290-2d6733f879c8	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-07 08:06:54.791	2026-09-06 06:31:51.68
0e1755ef-a839-4b83-9b06-abe66c7a0606	dcf39b97-85f2-4c2d-8df6-ee44452f5971	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-07 08:06:54.791	2026-09-06 06:32:46.126
96a4c29b-eb86-4654-b14d-80bcb28d196d	0f364069-d542-499f-a5be-b5ed4ce72da3	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-07 08:06:54.791	2026-09-06 06:36:45.392
a4bc7758-d9b8-454a-b3c5-43466697fefb	d154998c-ac1d-4315-89a7-499fb526f269	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-07 08:06:54.791	2026-09-06 06:36:49.454
746fbd2b-2403-465f-943b-bf3af068f4dc	d2492f80-a0bc-4066-ba2c-d3fa6fdc9ba2	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-07 08:06:54.791	2026-09-06 06:39:24.089
fd6700c5-f85d-4612-bc06-bb7b1b7a0a81	c8f6b1c3-ed06-425e-966f-4ea43b2c3166	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-08-29 08:18:45.796	2026-08-29 08:13:58.641
bc9eed3b-0c7e-4838-83d9-2e26bcd10e6d	7874e095-cc16-4a64-aba2-6293ef01607c	545ef296-1135-4885-8e61-89932645af6c	\N	2026-09-09 09:49:39.695
dd29841d-fc8b-4a68-9a78-803fb6a64fd9	78ef3650-b526-4a94-a607-345e5a54d468	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-08-29 08:18:45.796	2026-08-29 08:14:02.359
71064ffb-248c-443f-bbb4-d04fec07937e	292f4185-bad4-4f81-8a3a-c8c841c7d510	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-08-29 08:18:45.796	2026-08-29 08:15:28.125
98b1bd74-5e1b-4c45-93da-87e209f5695d	df607f3d-3c8a-4099-b423-9367bf55dc19	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-08-29 08:18:45.796	2026-08-29 08:15:28.29
798fd31e-cd34-46c1-b80c-ecba6aa90ecd	50e11353-431e-43ac-8eb7-77418d93941a	05ff1cc9-4cb6-4d87-a74b-0391a5539537	2026-09-07 09:26:11.89	2026-09-07 09:25:28.483
1ac9a5dc-43e9-43cd-a926-78177d50cf2e	da0fc039-d5ae-4ca0-8c95-2bd9e753b09e	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-08-29 08:18:45.796	2026-08-29 08:15:44.75
57cd368d-de7e-49ae-b6b2-4e2f5363e877	268e681f-390a-48bc-815f-d864994ed0b1	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-29 08:14:53.469	2026-08-29 08:13:04.097
a5cb2836-8d76-4e5f-8804-fb6bfe8cce4a	c8f6b1c3-ed06-425e-966f-4ea43b2c3166	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-29 08:14:53.469	2026-08-29 08:13:58.641
e74aa8be-bd25-4fdb-aab1-fd5bcfb5bfd9	78ef3650-b526-4a94-a607-345e5a54d468	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-29 08:14:53.469	2026-08-29 08:14:02.359
bee3d806-481d-4c24-b483-3727b455aa16	a4c503e2-8970-40a4-b85a-aac9fac0df78	545ef296-1135-4885-8e61-89932645af6c	\N	2026-08-29 08:15:02.198
832d09b7-26f8-4f73-aeab-6c65fc4907d1	c8f6b1c3-ed06-425e-966f-4ea43b2c3166	545ef296-1135-4885-8e61-89932645af6c	2026-08-29 08:15:02.346	2026-08-29 08:13:58.641
14d9bcfc-8bfd-4a8f-8949-bda06b3deed5	78ef3650-b526-4a94-a607-345e5a54d468	545ef296-1135-4885-8e61-89932645af6c	2026-08-29 08:15:02.346	2026-08-29 08:14:02.359
1a847cfe-bb37-4d12-93a9-4cb3c010fa0f	6b300ded-d565-4ad7-9982-5c16e159d8f0	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-08-29 08:18:45.796	2026-08-29 08:16:03.623
1584a6ba-cb68-4b7b-9942-c94d95d95fdc	b73df914-936a-4d07-bbbb-800a7354276a	545ef296-1135-4885-8e61-89932645af6c	2026-09-09 09:51:32.018	2026-09-09 09:51:28.562
f952a2f8-7b35-4a14-8525-137a5f6c31d4	428d431e-84d4-4774-9579-80ec54ab25da	545ef296-1135-4885-8e61-89932645af6c	\N	2026-08-29 08:15:11.581
5033563c-8559-4857-9c68-d35af3678694	766e8743-14d4-42b8-bb8d-7bf92cd63684	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-08-29 08:18:45.796	2026-08-29 08:16:17.335
d75a3bda-7322-44ad-8726-cb9b8a9091c6	09471fd9-50b2-4843-8d4d-94d32fd15797	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-08-29 08:18:45.796	2026-08-29 08:16:36.507
79f0d80f-00b6-49c6-9a93-440f205943b9	fb0faaa5-debc-4214-a48b-6d3e66c76727	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-08-29 08:18:45.796	2026-08-29 08:16:42.94
cd6e0d94-8e67-4b06-a72e-d5bfafb1be08	695f2624-62ba-4936-9263-38393c630568	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-08-29 08:18:45.796	2026-08-29 08:17:00
f629d7b0-a788-4e5e-85a1-52280b700e65	b73df914-936a-4d07-bbbb-800a7354276a	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-09 09:52:15.08	2026-09-09 09:51:28.562
2870a563-7cd4-49aa-a18d-75086c584980	292f4185-bad4-4f81-8a3a-c8c841c7d510	545ef296-1135-4885-8e61-89932645af6c	2026-08-29 08:15:32.451	2026-08-29 08:15:28.125
c6628ef7-66b7-4520-831a-d874fcbc9f5b	2123f217-471a-45e0-a736-e10406abd923	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-08-29 08:18:45.796	2026-08-29 08:17:07.573
af68e34a-c425-4abc-87d0-91f022843892	f0e0bbeb-fc44-428d-9c49-5d303fd4d7ae	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-09 09:52:15.08	2026-09-09 09:51:38.483
61f3e352-40b1-4583-9c9b-ce245d88319f	af6b22cd-35ea-4b6b-be6e-bed64708e29d	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-08-29 08:18:45.796	2026-08-29 08:17:09.019
e7c7fbe2-b42e-4fa2-b760-99e6472bee44	e5b3edec-3c31-49f3-b00d-1288ca14b5df	545ef296-1135-4885-8e61-89932645af6c	\N	2026-08-29 08:15:50.131
7828cad8-44db-478e-a8c5-cf9a95ae106b	da0fc039-d5ae-4ca0-8c95-2bd9e753b09e	545ef296-1135-4885-8e61-89932645af6c	2026-08-29 08:15:54.892	2026-08-29 08:15:44.75
8d78fd32-1b35-460d-8eff-ca24821f8f7d	df607f3d-3c8a-4099-b423-9367bf55dc19	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-29 08:16:01.012	2026-08-29 08:15:28.29
31addf06-d50e-4cfb-baa2-4e2b3e424430	fcd497fa-efbb-4f51-bed0-05dfd27c5a03	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-08-29 08:18:45.796	2026-08-29 08:17:33.793
11eb8b37-16b4-478d-a958-b9ffed1ce4b0	b73df914-936a-4d07-bbbb-800a7354276a	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 09:54:14.233	2026-09-09 09:51:28.562
9dc25a89-6a82-49a5-a1eb-f87f1a7d8dc4	c7012f8e-d85a-4347-8b88-390314baeaa5	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-08-29 08:18:45.796	2026-08-29 08:17:45.94
17636918-8657-4178-8331-9e9a7cb7e90f	f0e0bbeb-fc44-428d-9c49-5d303fd4d7ae	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 09:54:14.233	2026-09-09 09:51:38.483
62f142d5-9aa0-49dd-a81a-0b8a5129854f	fe7443d5-2c4f-4e57-839e-02aed71b814d	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 09:54:14.233	2026-09-09 09:54:06.936
b1d3c772-8efa-4754-849f-da163ee6d085	2d4b0332-6d24-4c3b-9d05-5b43e7aaa193	49098001-4375-47f0-b36d-c8758d8715ff	2026-08-29 08:20:17.514	2026-08-29 08:15:03.297
cd372ae2-9d7c-4954-b9e8-995a639d91f8	1da44f94-3e53-4759-be95-0a84b14fdc72	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 09:55:40.628	2026-09-09 09:54:30.558
fc01b9b4-11bf-4a50-a245-9f70e9c638df	d8625dde-a109-41f0-ad12-8587b45058af	545ef296-1135-4885-8e61-89932645af6c	\N	2026-08-29 08:21:43.044
b64277ea-524c-420f-a524-63b0374ce3c9	4541d7ba-2d70-472e-a20c-71375a64c9f1	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-08-29 08:16:50.488	2026-08-29 04:56:25.191
dd68e649-baf0-468f-a6ec-a2a30a144c34	63d9597c-0f35-4122-a1a2-a9d050136150	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-08-29 08:16:50.488	2026-08-29 04:56:31.618
c56d510d-c419-444d-92ac-ded230c1ff24	ed21aad4-87dd-4dc6-aef8-8445ab862d94	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-08-29 08:16:50.488	2026-08-29 05:09:29.891
a875b8be-eab8-4759-a30a-afa19f449355	268e681f-390a-48bc-815f-d864994ed0b1	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-08-29 08:16:50.488	2026-08-29 08:13:04.097
5bab36e2-46e7-4874-bc0c-f3712b530f46	c6036169-d766-44fe-810a-dfc23ac65173	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-08-29 08:16:50.488	2026-08-29 08:13:14.562
b10f4ce5-6d4a-4f55-8c7e-8a92b5cb17a0	c8f6b1c3-ed06-425e-966f-4ea43b2c3166	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-08-29 08:16:50.488	2026-08-29 08:13:58.641
1dde3ef9-1069-4caa-9cfd-3482470f8557	78ef3650-b526-4a94-a607-345e5a54d468	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-08-29 08:16:50.488	2026-08-29 08:14:02.359
ed76b4f2-2608-4ce8-8501-8f295364522b	2d4b0332-6d24-4c3b-9d05-5b43e7aaa193	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-08-29 08:16:50.488	2026-08-29 08:15:03.297
eddb4a1b-bab4-4f17-8ee0-a64a4f62f1fa	292f4185-bad4-4f81-8a3a-c8c841c7d510	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-08-29 08:16:50.488	2026-08-29 08:15:28.125
cb43360d-94e9-495f-840c-017f0fc30225	df607f3d-3c8a-4099-b423-9367bf55dc19	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-08-29 08:16:50.488	2026-08-29 08:15:28.29
113b85e5-f622-4df0-9615-c6dfb1ea2702	da0fc039-d5ae-4ca0-8c95-2bd9e753b09e	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-08-29 08:16:50.488	2026-08-29 08:15:44.75
784030b0-f98c-465d-b42a-616922b08d29	6b300ded-d565-4ad7-9982-5c16e159d8f0	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-08-29 08:16:50.488	2026-08-29 08:16:03.623
0f3135f1-d08a-466a-8a2a-e137f685ea8b	766e8743-14d4-42b8-bb8d-7bf92cd63684	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-08-29 08:16:50.488	2026-08-29 08:16:17.335
084c0c47-8207-4118-8695-979cca531194	09471fd9-50b2-4843-8d4d-94d32fd15797	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-08-29 08:16:50.488	2026-08-29 08:16:36.507
abbccdff-a7ec-47c9-a538-86b5817e7e96	fb0faaa5-debc-4214-a48b-6d3e66c76727	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-08-29 08:16:50.488	2026-08-29 08:16:42.94
a7b42fb1-a4ae-421d-a508-9bff960702f9	fe7443d5-2c4f-4e57-839e-02aed71b814d	545ef296-1135-4885-8e61-89932645af6c	2026-09-09 09:56:04.724	2026-09-09 09:54:06.936
e985f156-1c45-4e00-8859-c43eb6d1b8f0	c5d48869-2cc1-4f3a-a8f0-1eb0eb27d41c	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-09 09:56:08.085	2026-09-09 09:55:49.335
b73a4e27-403d-438f-b3e6-e0ab877b3841	2d4b0332-6d24-4c3b-9d05-5b43e7aaa193	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-09 10:05:23.581	2026-08-29 08:15:03.297
b70ab2d6-a43d-4c7e-8722-d3fe052c8510	a65cd0da-d280-4cc0-91fa-b8375c6c9fef	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 10:06:19.493	2026-09-09 09:56:17.616
a3562961-15e3-4ab8-b97d-17d5d391c3b2	f0e0bbeb-fc44-428d-9c49-5d303fd4d7ae	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 10:13:27.431	2026-09-09 09:51:38.483
a20300c6-ba1c-449a-9a05-f750cbf16d5f	fe7443d5-2c4f-4e57-839e-02aed71b814d	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 10:13:27.431	2026-09-09 09:54:06.936
a4a5dd8f-e606-4109-9566-ed23ccb940bc	e8a7413c-c55d-4ad9-8300-4171cef43a55	545ef296-1135-4885-8e61-89932645af6c	\N	2026-08-29 08:23:26.317
2edcef65-6ed3-461d-951f-56f77c1433f6	3dcb7c76-e139-41c5-811b-ef00d6a39135	49098001-4375-47f0-b36d-c8758d8715ff	2026-08-29 08:23:41.633	2026-08-29 08:23:12.498
65689757-867f-4197-bb88-b52ecb7e3e7a	3c474ba9-4d68-433d-bf10-867a9fe3b37c	49098001-4375-47f0-b36d-c8758d8715ff	2026-08-29 08:37:37.743	2026-08-29 08:37:25.914
8f2f19b3-86fa-47c2-b625-5f4b0de040db	4bf95c82-40af-40dd-bce8-40827da59ee4	545ef296-1135-4885-8e61-89932645af6c	\N	2026-08-29 08:42:21.453
20673c8b-2453-4d54-a05d-771653844e52	1b35cd31-eb5c-4495-b31c-79764853a51c	545ef296-1135-4885-8e61-89932645af6c	\N	2026-08-29 08:42:24.957
b7126bc1-eca1-4b57-8b3f-f63e81510dbf	0aa462a0-caf0-48ba-babf-05fe9e201601	545ef296-1135-4885-8e61-89932645af6c	\N	2026-08-29 08:42:26.997
6452ef86-22b4-4aaa-88f3-bfa015dfba23	820578dc-4d1f-4aa4-8583-aa0277e8782b	545ef296-1135-4885-8e61-89932645af6c	\N	2026-08-29 08:42:30.692
8d3689b0-d74e-481b-84fc-a57c1fb7b092	eebfaa92-378b-47a6-bf00-c9190266d8e2	545ef296-1135-4885-8e61-89932645af6c	\N	2026-08-29 08:42:31.641
64b0ee3d-aee1-4a98-8920-e01ab93d7e42	693734c5-2dd6-46ae-90a3-009b35b93142	545ef296-1135-4885-8e61-89932645af6c	\N	2026-08-29 08:42:33.001
3bece27e-d06d-4e15-adad-81f178d07931	b06aa45d-2d11-4257-a6b8-aea7e04d43db	545ef296-1135-4885-8e61-89932645af6c	\N	2026-08-29 08:42:40.901
a1eddcbe-bf06-4c49-b1fb-4243c00646e6	89b1d450-f261-4044-a350-1e3388daff6b	545ef296-1135-4885-8e61-89932645af6c	\N	2026-08-29 08:42:46.791
2679a577-99ed-4905-a96e-527d4b328b40	fb0faaa5-debc-4214-a48b-6d3e66c76727	545ef296-1135-4885-8e61-89932645af6c	2026-08-29 08:43:00.818	2026-08-29 08:16:42.94
dbacedcc-3ef2-4ff6-8c25-d505d6925752	695f2624-62ba-4936-9263-38393c630568	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-08-29 08:44:23.76	2026-08-29 08:17:00
e09cab66-986e-472a-9c90-593278c9bff8	2123f217-471a-45e0-a736-e10406abd923	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-08-29 08:44:23.76	2026-08-29 08:17:07.573
f8358f5c-70b1-4b87-b025-700e882fc34b	af6b22cd-35ea-4b6b-be6e-bed64708e29d	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-08-29 08:44:23.76	2026-08-29 08:17:09.019
487fb61b-265a-43c5-8bb4-d105256617c9	2c9ff59a-7397-4118-8f68-b65dcccaf8d2	846641e3-667b-4e7f-b505-afdc1d66b54a	2026-08-29 08:44:34.357	2026-08-29 08:43:51.85
9891a13e-b99b-4a91-9586-d844c3ef505c	22ef04d4-f2c7-46eb-a8dc-22b3b7837ce9	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-08-29 08:45:22.515	2026-08-29 08:21:45.866
02aff123-7590-4098-9400-292e4c6eb139	b6941d90-a7db-411d-ad1f-44243b9cf01c	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-29 10:23:03.694	2026-08-29 08:14:50.202
35686d32-e358-421d-89d8-04b80babb86c	6b300ded-d565-4ad7-9982-5c16e159d8f0	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-29 10:23:03.694	2026-08-29 08:16:03.623
fed18d55-71e2-43ad-a6cb-dade18febea0	766e8743-14d4-42b8-bb8d-7bf92cd63684	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-29 10:23:03.694	2026-08-29 08:16:17.335
c40c58e5-8f82-4b25-a1b3-b84d21092118	7dd81eb6-33cb-4673-ad29-eb2feff61abb	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-08-30 19:50:06.027	2026-08-30 10:06:59.719
b6a39250-f195-475e-b758-4022d757ccfe	7dd81eb6-33cb-4673-ad29-eb2feff61abb	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-03 04:11:05.115	2026-08-30 10:06:59.719
827eb734-9072-4857-8fb3-599cd9d1ddb4	448147e4-4ba0-471a-a2e5-6ebbc848f861	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-04 02:47:04.871	2026-09-03 13:58:02.792
832b53b0-bbf4-4ce1-b9de-c31230d1fb98	69c52c48-331f-4425-a24c-317a6cc59a59	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-04 02:47:04.871	2026-09-04 01:10:56.366
9aef380c-71d2-410e-9437-56bc2555f17a	7dd81eb6-33cb-4673-ad29-eb2feff61abb	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-06 06:32:14.027	2026-08-30 10:06:59.719
c8affc5b-aa7b-4540-9e96-9ea8653b2ef5	b62e6d9d-626b-4f9d-8900-373029ccf0d2	545ef296-1135-4885-8e61-89932645af6c	2026-09-06 06:43:56.838	2026-09-04 03:21:56.63
470b4dde-0ba7-49eb-83f4-35ed524fd8d4	65de5f4a-c1ea-419d-b290-2d6733f879c8	545ef296-1135-4885-8e61-89932645af6c	2026-09-06 06:43:56.838	2026-09-06 06:31:51.68
234ec51b-d850-46e2-bfc0-1a968c445520	dcf39b97-85f2-4c2d-8df6-ee44452f5971	545ef296-1135-4885-8e61-89932645af6c	2026-09-06 06:43:56.838	2026-09-06 06:32:46.126
47874475-e142-4b38-a04e-c69a54719b22	0f364069-d542-499f-a5be-b5ed4ce72da3	545ef296-1135-4885-8e61-89932645af6c	2026-09-06 06:43:56.838	2026-09-06 06:36:45.392
b4fec0f7-b5f3-450d-8987-c8ebcc6828b4	d154998c-ac1d-4315-89a7-499fb526f269	545ef296-1135-4885-8e61-89932645af6c	2026-09-06 06:43:56.838	2026-09-06 06:36:49.454
0ada657f-538f-49cc-bdfd-f794b403b8a0	d2492f80-a0bc-4066-ba2c-d3fa6fdc9ba2	545ef296-1135-4885-8e61-89932645af6c	2026-09-06 06:43:56.838	2026-09-06 06:39:24.089
77088ee6-c9ee-4bd9-b5de-60824d7d9471	abea9818-d1dc-4f1f-b961-249129f72554	545ef296-1135-4885-8e61-89932645af6c	2026-09-06 06:43:56.838	2026-09-06 06:39:26.644
b50923e8-1ff0-423a-98f5-08b31982d644	ca07801a-f41a-44a7-9b25-a7bab11fa95b	49098001-4375-47f0-b36d-c8758d8715ff	2026-09-07 09:25:43.012	2026-09-07 08:28:08.998
3289986d-edb0-44f1-af74-ebcf34326c8e	c19a5b21-509d-41b7-b452-59dddd3f0600	49098001-4375-47f0-b36d-c8758d8715ff	2026-09-07 09:26:45.694	2026-09-07 09:26:20.362
66603237-857e-4200-b3e7-0d44dfdd1263	75b89d2e-2453-4859-8cb8-5d9bfc6b52d3	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-06 07:26:24.492	2026-09-06 06:43:57.771
36e1c00e-2712-4901-9892-f87556991db3	bb67ebac-40ab-4a04-b5cd-1480ab65c358	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 09:51:17.959	2026-09-09 09:50:11.078
0a596058-185b-448f-8b56-90734cced713	b03abd7d-f1a1-4ffa-91d8-1dd955b6af0f	545ef296-1135-4885-8e61-89932645af6c	2026-09-09 09:51:32.018	2026-09-09 09:49:58.637
7f9fec2d-72a0-4c71-872f-988c037fceee	bb67ebac-40ab-4a04-b5cd-1480ab65c358	545ef296-1135-4885-8e61-89932645af6c	2026-09-09 09:51:32.018	2026-09-09 09:50:11.078
ef05e580-2636-47c5-9250-02819eb95e16	e1aba79b-e9e2-44a1-9ddb-4ddc53b19c4c	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-07 09:38:47.363	2026-09-07 09:37:52.054
5c8fc1c9-f093-487a-9244-d8d8eecbe2b5	64e5b84d-cd4f-4fa8-8ce9-d764a08c8880	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-07 10:04:44.476	2026-09-07 09:12:16.994
a43843d4-2932-4e05-9f74-ea098702efd7	60ca619e-c9af-48a0-9e49-05d109c8e1c2	49098001-4375-47f0-b36d-c8758d8715ff	2026-09-06 07:57:57.347	2026-09-06 07:56:58.226
67253e8f-c5a0-4344-88db-dc7c173ccdff	1f0c8f41-df6e-4b85-b017-fe35dc9a3544	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-08 08:42:42.327	2026-09-06 08:42:25.28
9d3ee33d-1468-40d9-b1d1-ed3cbb136a48	467922fa-d36e-4093-87f8-997457716dd9	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 09:54:14.233	2026-09-09 09:43:48.368
039c484b-d873-47e6-b967-2c5ccb8e75b6	e6138958-5cff-42fe-bb24-453313f8b07c	49098001-4375-47f0-b36d-c8758d8715ff	2026-09-06 08:35:26.312	2026-09-06 07:59:39.191
3131120b-b228-44bf-91c0-02436760cb5b	164ee85f-915b-46a3-b824-4727a540a2f8	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 09:54:14.233	2026-09-09 09:44:06.34
a540f8d4-d93c-46b6-83f8-9ff64fa29fd4	cdf229f0-65e5-45e7-9552-c8a00234c139	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-08 08:42:45.129	2026-09-06 10:53:24.499
cd4995d7-0ec1-43db-bf11-f2101539650b	cde2cedc-c7e8-4c21-8bc6-3b023d321e7e	49098001-4375-47f0-b36d-c8758d8715ff	2026-09-06 09:15:40.469	2026-09-06 09:15:22.365
5677e995-a493-4861-8131-1fbe7ad31bc7	2186e87c-7382-4c39-9e3f-a6a4e32aff98	545ef296-1135-4885-8e61-89932645af6c	2026-09-09 09:56:04.724	2026-09-09 09:52:20.061
7bbfe499-ffa3-4338-968b-052a779c4aef	226e0435-740e-423c-9305-ccc46dd276ed	05ff1cc9-4cb6-4d87-a74b-0391a5539537	2026-09-08 09:06:00.458	2026-09-06 09:16:04.876
8305844d-b11b-44fc-8515-4163a2db860d	2186e87c-7382-4c39-9e3f-a6a4e32aff98	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-09 09:58:10.637	2026-09-09 09:52:20.061
35bd3eb3-440f-4ac7-9976-277bf18a7b4e	171d326a-f786-4aa2-a427-5c9d1160d433	49098001-4375-47f0-b36d-c8758d8715ff	2026-09-06 10:53:33.399	2026-09-06 10:53:23.999
ea1e4614-1f4c-4124-9860-cd535f1c3059	9874ebb3-f6ef-4d28-86f1-652a7b0730e6	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-08 09:08:14.721	2026-09-07 08:29:10.845
cccdaa8a-e673-4607-b16b-2e9db295756d	6ca3de38-a4a3-4e4b-abac-ea9709dc76b1	49098001-4375-47f0-b36d-c8758d8715ff	2026-09-06 11:25:44.163	2026-09-06 11:25:25.257
d779e0cb-4a51-4b1d-9ebb-0620f15da5bd	e5f8db5c-ed32-4a7a-9335-fec282aaf0ac	31bb72f7-e5e2-493e-827d-3320e1054461	\N	2026-09-06 11:32:58.082
2fd76a80-ccf5-4b73-aff7-ae59e45f73d4	abea9818-d1dc-4f1f-b961-249129f72554	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-07 08:06:54.791	2026-09-06 06:39:26.644
db4adb88-0baa-4d0a-ac3c-03c46b07ec29	75b89d2e-2453-4859-8cb8-5d9bfc6b52d3	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-07 08:06:54.791	2026-09-06 06:43:57.771
5ed7e804-ff79-4c2a-aef2-a87cd3c2ccd2	25082c70-4048-4235-9643-43f56e7e6b09	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-07 08:06:54.791	2026-09-06 07:26:37.668
80e587b8-11d0-4897-aa31-4b9bc0b7573e	41a39099-85ee-41b5-9d50-6a096665e172	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-07 08:06:54.791	2026-09-06 07:26:52.499
2c4a546d-0e12-4915-be93-85302f2fbe1a	80950a3f-8db7-47f1-972d-d4ff3318931b	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-09 10:05:23.581	2026-09-09 02:40:15.205
7a0249b4-a5eb-44d6-892c-1f399a267704	6f846fa2-215c-4970-9543-8603e3314052	05ff1cc9-4cb6-4d87-a74b-0391a5539537	2026-09-08 10:01:15.161	2026-09-08 10:01:07.48
fa1780ea-0619-42b8-9fb4-1ee073d52360	f7f86a78-b866-4423-ab11-2d2ca479669c	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-07 09:12:11.364	2026-09-07 09:12:04.376
d3be4d1d-d05e-401a-aaae-6bfd00600294	f7f86a78-b866-4423-ab11-2d2ca479669c	05ff1cc9-4cb6-4d87-a74b-0391a5539537	2026-09-07 09:12:48.56	2026-09-07 09:12:04.376
40368b72-b334-4e4e-b573-ef2f5527d6d1	f7f86a78-b866-4423-ab11-2d2ca479669c	49098001-4375-47f0-b36d-c8758d8715ff	2026-09-07 09:13:25.133	2026-09-07 09:12:04.376
2de1a928-1293-425f-95a8-3164023393f3	59261b15-950f-42be-9505-b5ad0db0b21b	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 02:37:32.918	2026-09-06 07:59:39.584
ab76313d-a73f-4879-ad18-2ef9a9f402a0	80950a3f-8db7-47f1-972d-d4ff3318931b	545ef296-1135-4885-8e61-89932645af6c	\N	2026-09-09 02:40:15.205
7607b426-498b-4c47-8330-e9ec518a467b	80950a3f-8db7-47f1-972d-d4ff3318931b	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 02:40:31.445	2026-09-09 02:40:15.205
b276f1ff-d6ce-4e29-b7ab-8e9f034367b0	2873bac6-89b9-43e4-8008-b52a10bcd9f1	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 02:41:05.386	2026-09-06 07:56:58.63
e664fd9f-9033-4d27-8184-aad12603562f	80950a3f-8db7-47f1-972d-d4ff3318931b	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 02:41:22.193	2026-09-09 02:40:15.205
8059b733-6376-4ccc-9efb-6479fb3d7555	c3b27657-32b6-46fe-a21e-8819a9c21388	05ff1cc9-4cb6-4d87-a74b-0391a5539537	\N	2026-09-09 02:42:18.746
48792a9a-2cd8-4f91-a266-6cc68738bb31	c3b27657-32b6-46fe-a21e-8819a9c21388	31bb72f7-e5e2-493e-827d-3320e1054461	\N	2026-09-09 02:42:18.746
049ef4ed-1a22-4840-9044-dc088d59d747	e1b0d87e-3fad-43e2-984a-2fb718838999	05ff1cc9-4cb6-4d87-a74b-0391a5539537	\N	2026-09-09 02:43:35.85
d697c8f4-6c3f-4701-af91-79e52928f53f	e1b0d87e-3fad-43e2-984a-2fb718838999	31bb72f7-e5e2-493e-827d-3320e1054461	\N	2026-09-09 02:43:35.85
e1e60db4-78ba-44dc-8824-06b367c5e039	c3b27657-32b6-46fe-a21e-8819a9c21388	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 02:44:07.586	2026-09-09 02:42:18.746
28a7ba50-60b5-4b29-9561-c6dcf8557e53	8ed308fe-c321-4d5b-bd6d-90c1c934ebbc	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 02:44:10.348	2026-09-09 02:42:33.035
f301c589-2a09-4daa-8e43-04a49aca6dc1	c3b27657-32b6-46fe-a21e-8819a9c21388	49098001-4375-47f0-b36d-c8758d8715ff	2026-09-09 02:45:50.093	2026-09-09 02:42:18.746
afef6ad5-2e2e-46b4-9828-a3e7e1fee08c	7528f5ea-e2db-4623-b283-359a81bffe5f	545ef296-1135-4885-8e61-89932645af6c	\N	2026-09-09 03:21:03.98
bfb101fe-1936-4341-a640-959f30b6f2a4	7528f5ea-e2db-4623-b283-359a81bffe5f	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 03:22:07.949	2026-09-09 03:21:03.98
574653ee-0c0b-4635-af91-7fb62b4db8c5	08b5a31e-7bf6-446e-b558-31b500226f6b	05ff1cc9-4cb6-4d87-a74b-0391a5539537	\N	2026-09-09 03:22:31.248
7b59c482-39f2-4dc1-ac17-c62febb4cdbf	08b5a31e-7bf6-446e-b558-31b500226f6b	31bb72f7-e5e2-493e-827d-3320e1054461	\N	2026-09-09 03:22:31.248
4320c223-0bde-4a25-ac55-6578e747a436	601bed66-401d-4c4f-a4ff-8e0ea46720d4	05ff1cc9-4cb6-4d87-a74b-0391a5539537	\N	2026-09-09 03:22:35.457
377b0492-57e2-4eb3-96c9-9ea23a10b744	601bed66-401d-4c4f-a4ff-8e0ea46720d4	31bb72f7-e5e2-493e-827d-3320e1054461	\N	2026-09-09 03:22:35.457
93c88ae5-6825-4407-b16a-4a8c7bbf94c0	601bed66-401d-4c4f-a4ff-8e0ea46720d4	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 03:22:43.869	2026-09-09 03:22:35.457
a50ad3dc-dfd0-4315-9954-c7c0d2e1fc96	11b3f540-f823-4504-8973-4b6329933f96	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 03:23:01.165	2026-09-09 03:22:15.252
77581182-8331-45f3-9a17-020f1f4949c1	08b5a31e-7bf6-446e-b558-31b500226f6b	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 03:23:03.301	2026-09-09 03:22:31.248
6569da47-df2f-43dd-a7c2-9ee38b969ce7	8524b96b-d517-4bb6-9a83-e80d50e5961f	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-09 03:23:22.307	2026-09-09 03:22:22.457
47170abc-79ae-45e8-9f64-4bc8ed045f16	3b5022b5-cc97-4821-853b-c837bc0ce7d4	05ff1cc9-4cb6-4d87-a74b-0391a5539537	\N	2026-09-09 03:23:31.562
305254a4-e2e1-40bf-bdfa-b9e8ec7546c3	3b5022b5-cc97-4821-853b-c837bc0ce7d4	31bb72f7-e5e2-493e-827d-3320e1054461	\N	2026-09-09 03:23:31.562
8a817b71-ea14-41ce-8cea-fd0710f20fd9	3b5022b5-cc97-4821-853b-c837bc0ce7d4	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 03:23:59.173	2026-09-09 03:23:31.562
3e93742e-175f-4baf-bb14-ccec1263cbbb	b4aad350-ec01-4690-b919-a419dd3f97cc	545ef296-1135-4885-8e61-89932645af6c	\N	2026-09-09 03:24:58.279
79e932a6-f185-43c1-8b9d-d578ed79d995	b4aad350-ec01-4690-b919-a419dd3f97cc	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 03:37:24.22	2026-09-09 03:24:58.279
1fe3d711-793e-4fa9-94b5-992d697b2a9a	59978d9a-51f6-496f-89d4-13c1ffaaa712	545ef296-1135-4885-8e61-89932645af6c	\N	2026-09-09 03:51:44.912
1f9c4ee9-ad80-45e9-9a31-77c9c5745a6a	21501813-cfea-478f-b38f-98247eda0ac3	545ef296-1135-4885-8e61-89932645af6c	\N	2026-09-09 03:52:03.092
61d50196-67b7-4b37-9a26-5bcab97499d6	4fe39037-03a4-4325-ac6a-a0d25945ded5	545ef296-1135-4885-8e61-89932645af6c	\N	2026-09-09 03:55:10.027
4233d4e4-9193-4702-8ff9-af3238c92113	59978d9a-51f6-496f-89d4-13c1ffaaa712	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 04:36:57.934	2026-09-09 03:51:44.912
ab5406d8-8bc8-4058-a366-12704b1c54bb	21501813-cfea-478f-b38f-98247eda0ac3	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 04:37:02.441	2026-09-09 03:52:03.092
9cf4e966-999a-4bfc-9919-6d8f63236455	4fe39037-03a4-4325-ac6a-a0d25945ded5	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 04:37:05.025	2026-09-09 03:55:10.027
6fbf1872-e780-4c1b-a476-24ded97b8f5e	601bed66-401d-4c4f-a4ff-8e0ea46720d4	49098001-4375-47f0-b36d-c8758d8715ff	2026-09-09 04:39:01.475	2026-09-09 03:22:35.457
a9517124-7a58-49fd-95e5-394d606b85b1	784ad660-7831-4e58-8682-9edd30f889d6	49098001-4375-47f0-b36d-c8758d8715ff	2026-09-09 04:39:34.912	2026-09-09 03:24:29.368
f72fe8bd-9e46-4f6b-93c6-66f3e66028da	3b5022b5-cc97-4821-853b-c837bc0ce7d4	49098001-4375-47f0-b36d-c8758d8715ff	2026-09-09 04:40:43.215	2026-09-09 03:23:31.562
fbdd31b2-fce3-43ac-a7f4-32e346f57ecb	08b5a31e-7bf6-446e-b558-31b500226f6b	49098001-4375-47f0-b36d-c8758d8715ff	2026-09-09 04:41:04.661	2026-09-09 03:22:31.248
5d617330-8786-424a-a95b-c398210ba69b	75b89d2e-2453-4859-8cb8-5d9bfc6b52d3	545ef296-1135-4885-8e61-89932645af6c	2026-09-09 09:10:53.451	2026-09-06 06:43:57.771
ba5d0f18-c242-4dd0-b8de-ac58bf7ae373	25082c70-4048-4235-9643-43f56e7e6b09	545ef296-1135-4885-8e61-89932645af6c	2026-09-09 09:10:53.451	2026-09-06 07:26:37.668
ac2383a0-7487-49a9-bc89-d551269a0ce5	41a39099-85ee-41b5-9d50-6a096665e172	545ef296-1135-4885-8e61-89932645af6c	2026-09-09 09:10:53.451	2026-09-06 07:26:52.499
c70dbd96-1c61-472b-b839-d24b7826f919	9874ebb3-f6ef-4d28-86f1-652a7b0730e6	545ef296-1135-4885-8e61-89932645af6c	2026-09-09 09:10:53.451	2026-09-07 08:29:10.845
66e0397b-d97c-48b3-92ae-7b9954d7487c	25082c70-4048-4235-9643-43f56e7e6b09	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 09:42:38.722	2026-09-06 07:26:37.668
5b56cf56-59fd-4675-a4b6-3503b9a6c230	41a39099-85ee-41b5-9d50-6a096665e172	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 09:42:38.722	2026-09-06 07:26:52.499
5ac35559-acf7-4b9a-aa39-7b96a31a6166	9874ebb3-f6ef-4d28-86f1-652a7b0730e6	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 09:42:38.722	2026-09-07 08:29:10.845
befff07c-0dad-4e8b-8c7d-39a0ce85f13b	ac4ee8b3-739f-4d2a-a2d5-49dc105b09fa	545ef296-1135-4885-8e61-89932645af6c	\N	2026-09-09 03:55:28.564
31be2070-8359-4faa-953f-1ad1b447aed8	38590739-2d87-4e8a-8d4d-a8c84a3c8b19	49098001-4375-47f0-b36d-c8758d8715ff	2026-09-09 09:45:18.277	2026-09-09 08:13:03.467
b6c0f70c-cdc4-4ac6-b19d-825dedceb2a3	bbddaeb2-8b2d-4f55-a9a9-c812907f0b3c	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 04:20:47.823	2026-09-09 04:20:18.177
25212388-8025-4bef-b31a-d6b30b7b1bbb	545be964-5288-42e1-8fda-7a2d66b2fb12	49098001-4375-47f0-b36d-c8758d8715ff	2026-09-09 04:21:49.94	2026-09-09 04:21:16.491
fe55511e-d20a-446c-a300-f87ad5405adc	a9a2f679-7351-4b4a-8908-20e869a1825f	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 04:22:33.945	2026-09-09 04:22:07.23
a6df65bc-1673-409e-b241-f2246193908d	03903f78-6d29-404e-8182-28988c459574	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 04:35:31.379	2026-09-09 04:21:16.878
148d6c81-182a-4bfc-9208-85076dc2585f	ac4ee8b3-739f-4d2a-a2d5-49dc105b09fa	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 04:35:34.679	2026-09-09 03:55:28.564
b3e08350-63ac-4945-9f05-1994b9149fec	412a6ebd-2393-4aaf-aa68-60409dfd1ce7	49098001-4375-47f0-b36d-c8758d8715ff	2026-09-09 04:39:31.269	2026-09-09 04:22:06.713
1db46635-7bed-4a44-8460-4e4395e97e48	5acdfa35-cfde-42d6-a464-9552a4743d86	545ef296-1135-4885-8e61-89932645af6c	\N	2026-09-09 06:36:09.857
25571f5d-56f7-4216-86d4-9aacd162d15b	5acdfa35-cfde-42d6-a464-9552a4743d86	49098001-4375-47f0-b36d-c8758d8715ff	2026-09-09 06:36:31.315	2026-09-09 06:36:09.857
64f28d4a-a3e8-453b-9a2c-d3f19d044c8c	5acdfa35-cfde-42d6-a464-9552a4743d86	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 07:19:30.373	2026-09-09 06:36:09.857
f8d64027-e263-490c-9d25-667ae5f420b8	908be3fa-a9ba-413f-948b-d44fd6773291	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 07:35:47.361	2026-09-09 07:35:33.367
98b48a6d-a5a1-49df-b1ba-efd12e8a8f98	593bed64-fd9e-4714-b91a-b444dcfcb4ec	d5f49e78-0b72-4304-8413-b90446ced4a0	\N	2026-09-09 08:03:17.993
dc5f7d89-58f5-4cd1-a009-681a16376542	593bed64-fd9e-4714-b91a-b444dcfcb4ec	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	2026-09-09 08:03:17.993
45c4bf4c-93e8-404a-8e03-32442b472292	593bed64-fd9e-4714-b91a-b444dcfcb4ec	334b2294-9bba-4f31-8290-5a87484a62f0	\N	2026-09-09 08:03:17.993
d1b33139-5655-4624-b17c-9b40b7925157	593bed64-fd9e-4714-b91a-b444dcfcb4ec	846641e3-667b-4e7f-b505-afdc1d66b54a	\N	2026-09-09 08:03:17.993
19643178-5ba1-440e-9433-bc8e7bc84d7b	593bed64-fd9e-4714-b91a-b444dcfcb4ec	2a45f36d-2da9-492c-8bce-91a3440e71c1	\N	2026-09-09 08:03:17.993
29db2117-6003-42aa-8037-893ba2126a97	593bed64-fd9e-4714-b91a-b444dcfcb4ec	c2a06e5b-22fd-4862-bf12-8c36f5e07d9c	\N	2026-09-09 08:03:17.993
75e74964-6e04-4d99-9a83-b1bccb78b2cb	593bed64-fd9e-4714-b91a-b444dcfcb4ec	545ef296-1135-4885-8e61-89932645af6c	\N	2026-09-09 08:03:17.993
40d01945-7dab-4bf0-be2b-f9b0badeb97c	593bed64-fd9e-4714-b91a-b444dcfcb4ec	31bb72f7-e5e2-493e-827d-3320e1054461	\N	2026-09-09 08:03:17.993
3fb7db93-3f0b-4366-8151-7ad94ab0ea04	593bed64-fd9e-4714-b91a-b444dcfcb4ec	05ff1cc9-4cb6-4d87-a74b-0391a5539537	\N	2026-09-09 08:03:17.993
b064daef-f1ec-4daa-bd4d-ef959ca0aa03	fdab3cf6-cf3e-4f2d-8de7-4d928a895993	d5f49e78-0b72-4304-8413-b90446ced4a0	\N	2026-09-09 08:03:27.787
4b73c457-3c1c-4f28-b905-9ed8a449544e	fdab3cf6-cf3e-4f2d-8de7-4d928a895993	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	2026-09-09 08:03:27.787
c5459cc8-43f1-4c87-b823-736ec8003548	fdab3cf6-cf3e-4f2d-8de7-4d928a895993	334b2294-9bba-4f31-8290-5a87484a62f0	\N	2026-09-09 08:03:27.787
f0060972-d6fe-4421-94cb-b0f9464905ca	fdab3cf6-cf3e-4f2d-8de7-4d928a895993	846641e3-667b-4e7f-b505-afdc1d66b54a	\N	2026-09-09 08:03:27.787
34b68576-e90b-4d7d-9326-24708a06ae6b	fdab3cf6-cf3e-4f2d-8de7-4d928a895993	2a45f36d-2da9-492c-8bce-91a3440e71c1	\N	2026-09-09 08:03:27.787
077d5d99-ca97-4060-95e4-e42ae38d60d4	fdab3cf6-cf3e-4f2d-8de7-4d928a895993	c2a06e5b-22fd-4862-bf12-8c36f5e07d9c	\N	2026-09-09 08:03:27.787
fc647c21-1b4b-4aef-a670-866f9ec9a1d6	fdab3cf6-cf3e-4f2d-8de7-4d928a895993	545ef296-1135-4885-8e61-89932645af6c	\N	2026-09-09 08:03:27.787
5d91d29a-1bb8-4ea6-a5c4-be67e73f17e3	fdab3cf6-cf3e-4f2d-8de7-4d928a895993	31bb72f7-e5e2-493e-827d-3320e1054461	\N	2026-09-09 08:03:27.787
5dda7944-de70-4657-b064-faf82f0a9b1a	fdab3cf6-cf3e-4f2d-8de7-4d928a895993	05ff1cc9-4cb6-4d87-a74b-0391a5539537	\N	2026-09-09 08:03:27.787
1319aa4d-b8a1-45e1-972d-8b4c0d2a6faa	55be8ba5-d425-4821-bbea-c8011b614375	d5f49e78-0b72-4304-8413-b90446ced4a0	\N	2026-09-09 08:03:33.83
2098c2fa-e5e0-4b83-b6a1-526a010c2e82	55be8ba5-d425-4821-bbea-c8011b614375	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	2026-09-09 08:03:33.83
8e130b9a-2700-493c-a2a0-9883ea6317a3	f98ad09b-c081-470a-8645-13871070c39a	545ef296-1135-4885-8e61-89932645af6c	2026-09-09 09:51:32.018	2026-09-09 09:50:07.449
a189f6be-733e-4f62-b420-e33f88429755	55be8ba5-d425-4821-bbea-c8011b614375	334b2294-9bba-4f31-8290-5a87484a62f0	\N	2026-09-09 08:03:33.83
288688e5-7915-444a-9e9a-ff08dcdd5dcb	55be8ba5-d425-4821-bbea-c8011b614375	846641e3-667b-4e7f-b505-afdc1d66b54a	\N	2026-09-09 08:03:33.83
67f4e13a-4c31-4307-b537-ad560002bc75	55be8ba5-d425-4821-bbea-c8011b614375	2a45f36d-2da9-492c-8bce-91a3440e71c1	\N	2026-09-09 08:03:33.83
c48ab469-0e61-4df3-8c93-f5f9f8b8a187	55be8ba5-d425-4821-bbea-c8011b614375	c2a06e5b-22fd-4862-bf12-8c36f5e07d9c	\N	2026-09-09 08:03:33.83
bcd26095-729d-44ad-abb7-6c5eefeb1d33	55be8ba5-d425-4821-bbea-c8011b614375	545ef296-1135-4885-8e61-89932645af6c	\N	2026-09-09 08:03:33.83
e184b9ec-d055-45f1-b8b5-f6493b7e4e8d	55be8ba5-d425-4821-bbea-c8011b614375	31bb72f7-e5e2-493e-827d-3320e1054461	\N	2026-09-09 08:03:33.83
9bd52e20-5eaf-4ed4-b998-f4ade9328af8	55be8ba5-d425-4821-bbea-c8011b614375	05ff1cc9-4cb6-4d87-a74b-0391a5539537	\N	2026-09-09 08:03:33.83
77288f96-cd59-451c-872e-b007ebe1b927	d625cc7e-63ca-47e6-904f-a0473ec78d18	d5f49e78-0b72-4304-8413-b90446ced4a0	\N	2026-09-09 08:04:06.597
98053979-9056-4b1e-a6d3-63e8239ba5ac	d625cc7e-63ca-47e6-904f-a0473ec78d18	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	2026-09-09 08:04:06.597
216f56df-02a2-4ef8-b6e0-47d6557f76a0	82096f76-ddae-47a1-ad0b-97056a0ce26d	545ef296-1135-4885-8e61-89932645af6c	2026-09-09 09:51:32.018	2026-09-09 09:50:15.567
158724bc-cc27-48db-9363-565396e2d29d	d625cc7e-63ca-47e6-904f-a0473ec78d18	334b2294-9bba-4f31-8290-5a87484a62f0	\N	2026-09-09 08:04:06.597
c1c824cd-b97b-4985-a634-e465ec7a5299	d625cc7e-63ca-47e6-904f-a0473ec78d18	846641e3-667b-4e7f-b505-afdc1d66b54a	\N	2026-09-09 08:04:06.597
b1b6cc4a-1866-4de4-a9d2-2de38a4f032b	d625cc7e-63ca-47e6-904f-a0473ec78d18	2a45f36d-2da9-492c-8bce-91a3440e71c1	\N	2026-09-09 08:04:06.597
d7ea16a3-78ef-4a07-aab6-1897c971f151	d625cc7e-63ca-47e6-904f-a0473ec78d18	c2a06e5b-22fd-4862-bf12-8c36f5e07d9c	\N	2026-09-09 08:04:06.597
79ebad5f-02ae-4cd9-9bf0-17c4b8d5ed44	d625cc7e-63ca-47e6-904f-a0473ec78d18	545ef296-1135-4885-8e61-89932645af6c	\N	2026-09-09 08:04:06.597
b401d84d-5499-4a38-aaae-03cecb3fddf4	d625cc7e-63ca-47e6-904f-a0473ec78d18	31bb72f7-e5e2-493e-827d-3320e1054461	\N	2026-09-09 08:04:06.597
6201f64a-c873-46fb-83fa-02892d76be93	d625cc7e-63ca-47e6-904f-a0473ec78d18	05ff1cc9-4cb6-4d87-a74b-0391a5539537	\N	2026-09-09 08:04:06.597
dd9ddf63-00d6-4f7b-b4a7-ecfed0305a0e	4186f6b9-f193-48c1-8ef9-77e69437a477	d5f49e78-0b72-4304-8413-b90446ced4a0	\N	2026-09-09 08:04:10.844
31b3e69a-b0ec-4e69-990e-3accba82a5e5	4186f6b9-f193-48c1-8ef9-77e69437a477	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	2026-09-09 08:04:10.844
80c21c36-4eda-42e3-b854-2478456f5e7f	3b85c091-1612-4823-8051-55bf161bd674	545ef296-1135-4885-8e61-89932645af6c	2026-09-09 09:51:32.018	2026-09-09 09:50:21.544
7478b12e-0146-438b-afd4-b7a85aedafe2	4186f6b9-f193-48c1-8ef9-77e69437a477	334b2294-9bba-4f31-8290-5a87484a62f0	\N	2026-09-09 08:04:10.844
a9aeaa77-915a-4c2d-be7e-04d0eaaeaee9	f98ad09b-c081-470a-8645-13871070c39a	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 09:54:14.233	2026-09-09 09:50:07.449
164ee9b9-8ab8-44a7-a90f-fdbb255054d9	4186f6b9-f193-48c1-8ef9-77e69437a477	2a45f36d-2da9-492c-8bce-91a3440e71c1	\N	2026-09-09 08:04:10.844
a439ff82-ec53-412b-b170-1ff226c3c359	4186f6b9-f193-48c1-8ef9-77e69437a477	c2a06e5b-22fd-4862-bf12-8c36f5e07d9c	\N	2026-09-09 08:04:10.844
8b6893de-5b4e-43e9-b332-47bc0a08ecd7	4186f6b9-f193-48c1-8ef9-77e69437a477	545ef296-1135-4885-8e61-89932645af6c	\N	2026-09-09 08:04:10.844
d2d5a0aa-87dc-4af5-9546-6c98d1b568bc	4186f6b9-f193-48c1-8ef9-77e69437a477	31bb72f7-e5e2-493e-827d-3320e1054461	\N	2026-09-09 08:04:10.844
3b76ce23-685d-4836-85d0-cfc83c86a8a9	4186f6b9-f193-48c1-8ef9-77e69437a477	05ff1cc9-4cb6-4d87-a74b-0391a5539537	\N	2026-09-09 08:04:10.844
90bafc40-b658-44e1-8218-f0a991f55092	fb2559de-4e7c-4b94-a615-8c2d7e435be6	d5f49e78-0b72-4304-8413-b90446ced4a0	\N	2026-09-09 08:05:53.711
22a07ba5-3db6-4b60-a520-3596ff0d3248	fb2559de-4e7c-4b94-a615-8c2d7e435be6	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	2026-09-09 08:05:53.711
f12f31f9-af79-413b-a327-7954d249b17d	82096f76-ddae-47a1-ad0b-97056a0ce26d	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 09:54:14.233	2026-09-09 09:50:15.567
dc68f100-ffe6-4d21-b877-3747d73114d9	fb2559de-4e7c-4b94-a615-8c2d7e435be6	334b2294-9bba-4f31-8290-5a87484a62f0	\N	2026-09-09 08:05:53.711
741e1227-b80e-479f-ae1c-02a17ddd68d2	3b85c091-1612-4823-8051-55bf161bd674	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 09:54:14.233	2026-09-09 09:50:21.544
66afab08-0c6e-464a-8eda-97a99224bcb6	fb2559de-4e7c-4b94-a615-8c2d7e435be6	2a45f36d-2da9-492c-8bce-91a3440e71c1	\N	2026-09-09 08:05:53.711
1fb07ff3-9940-411c-899d-19ff597db34b	fb2559de-4e7c-4b94-a615-8c2d7e435be6	c2a06e5b-22fd-4862-bf12-8c36f5e07d9c	\N	2026-09-09 08:05:53.711
54b252b9-840f-4d50-aa01-3d9ea770e309	fb2559de-4e7c-4b94-a615-8c2d7e435be6	545ef296-1135-4885-8e61-89932645af6c	\N	2026-09-09 08:05:53.711
d2f8f99d-1934-4eab-80b2-b358ea50b93c	fb2559de-4e7c-4b94-a615-8c2d7e435be6	31bb72f7-e5e2-493e-827d-3320e1054461	\N	2026-09-09 08:05:53.711
35ff0a3a-964e-48ff-9a7e-0079249f1a52	fb2559de-4e7c-4b94-a615-8c2d7e435be6	05ff1cc9-4cb6-4d87-a74b-0391a5539537	\N	2026-09-09 08:05:53.711
f5d480fd-ee06-41db-a013-9683d29ee35b	fb2559de-4e7c-4b94-a615-8c2d7e435be6	846641e3-667b-4e7f-b505-afdc1d66b54a	2026-09-09 08:06:12.989	2026-09-09 08:05:53.711
1d0c8106-73ba-42a9-800a-79d87ad344e6	6bcb9f28-4f2b-4e46-8c6a-bcc38bd81c61	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	2026-09-09 08:06:16.499
cc390a1b-a488-4a5d-80b8-a6797f706584	ac4ee8b3-739f-4d2a-a2d5-49dc105b09fa	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-09 10:05:23.581	2026-09-09 03:55:28.564
5961b623-31b2-450d-8d7d-906c299d5803	6bcb9f28-4f2b-4e46-8c6a-bcc38bd81c61	545ef296-1135-4885-8e61-89932645af6c	\N	2026-09-09 08:06:16.499
483e0943-fc97-4d19-9d92-841af9940a08	2acdc5a8-1bbe-4509-872e-d04d35c507a0	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-09 10:05:23.581	2026-09-09 04:03:41.906
f2925fce-5de6-484e-a69e-05ea8d89bf7b	4186f6b9-f193-48c1-8ef9-77e69437a477	846641e3-667b-4e7f-b505-afdc1d66b54a	2026-09-09 08:06:16.257	2026-09-09 08:04:10.844
7d89f7db-979a-4613-9251-4df1d2dfeb42	38590739-2d87-4e8a-8d4d-a8c84a3c8b19	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	2026-09-09 08:13:03.467
dd3c983b-f9de-4c83-bfee-fd6ecaffeaa8	5acdfa35-cfde-42d6-a464-9552a4743d86	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-09 10:05:23.581	2026-09-09 06:36:09.857
7fd4e0e0-1595-4fdb-b4c9-1fd33323e353	48b56abb-678f-493e-8325-8b93490088d8	d5f49e78-0b72-4304-8413-b90446ced4a0	\N	2026-09-09 08:21:24.752
8dce4db8-58ed-4ae6-afd4-97a3e60f93ea	48b56abb-678f-493e-8325-8b93490088d8	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	2026-09-09 08:21:24.752
e5ff611f-397d-4f7d-b9da-e19b6b27d380	5acdfa35-cfde-42d6-a464-9552a4743d86	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 09:42:38.722	2026-09-09 06:36:09.857
a790d563-bd74-4bbe-ad50-97ccf748b094	6bcb9f28-4f2b-4e46-8c6a-bcc38bd81c61	49098001-4375-47f0-b36d-c8758d8715ff	2026-09-09 09:43:03.421	2026-09-09 08:06:16.499
ab93fcf1-4bb3-462e-b42c-4e591844663d	48b56abb-678f-493e-8325-8b93490088d8	334b2294-9bba-4f31-8290-5a87484a62f0	\N	2026-09-09 08:21:24.752
976581cf-432f-41d6-8a8b-ca776ed0721b	48b56abb-678f-493e-8325-8b93490088d8	846641e3-667b-4e7f-b505-afdc1d66b54a	\N	2026-09-09 08:21:24.752
e7d4537f-2124-446d-95b4-f8fe8cc96824	48b56abb-678f-493e-8325-8b93490088d8	2a45f36d-2da9-492c-8bce-91a3440e71c1	\N	2026-09-09 08:21:24.752
bd310c8f-14e0-4d77-97fb-8aed7b15ba2b	48b56abb-678f-493e-8325-8b93490088d8	c2a06e5b-22fd-4862-bf12-8c36f5e07d9c	\N	2026-09-09 08:21:24.752
a468354c-2a57-4a0e-9f0c-9542eef95227	4a852f49-25e1-4d8c-8df7-a21e9fe9f5d0	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-09 09:49:48.203	2026-09-09 09:41:42.855
2f014372-ef38-4975-a71c-7ad99173d849	48b56abb-678f-493e-8325-8b93490088d8	31bb72f7-e5e2-493e-827d-3320e1054461	\N	2026-09-09 08:21:24.752
acda527c-97cf-4593-b610-82b19ab99500	48b56abb-678f-493e-8325-8b93490088d8	05ff1cc9-4cb6-4d87-a74b-0391a5539537	\N	2026-09-09 08:21:24.752
afef3f7a-060a-47fa-8201-e6cc19812ec7	48b56abb-678f-493e-8325-8b93490088d8	545ef296-1135-4885-8e61-89932645af6c	2026-09-09 09:10:44.268	2026-09-09 08:21:24.752
fd3d7bba-f4d7-406d-85ec-0540f6f216c9	2e85bc08-99de-4809-a004-b611ce890b0b	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-09 09:49:48.203	2026-09-09 09:41:59.95
a30025a6-6180-4ad0-b29b-9286355ffc38	1784b288-6094-4d79-94d0-9ac9ba2bbedf	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-09 09:49:48.203	2026-09-09 09:42:21.814
14550ff5-4ed3-43d8-9f1c-b414737911aa	38590739-2d87-4e8a-8d4d-a8c84a3c8b19	545ef296-1135-4885-8e61-89932645af6c	2026-09-09 09:10:46.975	2026-09-09 08:13:03.467
a2d0821f-9b3f-419a-b300-12bd55ce4aab	a2270b9e-ff6c-402d-9325-c40e9c722833	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-09 09:49:48.203	2026-09-09 09:42:24.837
ba23db91-3ad5-4439-95c4-be4888fe5664	dc99fdba-a7c6-4cce-96f8-66df9336c1d2	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-09 09:49:48.203	2026-09-09 09:42:32.338
f42923ad-d0ee-4e65-aeb8-60eee6fcc70c	4a852f49-25e1-4d8c-8df7-a21e9fe9f5d0	545ef296-1135-4885-8e61-89932645af6c	2026-09-09 09:42:13.66	2026-09-09 09:41:42.855
0c620dcb-632d-4e81-986f-8c4bdd98aabb	2e85bc08-99de-4809-a004-b611ce890b0b	545ef296-1135-4885-8e61-89932645af6c	2026-09-09 09:42:13.66	2026-09-09 09:41:59.95
9298eea4-a3fa-4d16-82f6-c1be45c3268a	17828a99-e8ba-4eb8-b15a-793e2d2dc970	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 09:42:38.722	2026-09-03 04:12:03.639
8c72c9f7-0b97-4644-b865-5703bb5876c8	653a95c8-3d5f-4c42-a72b-9afc682b6c96	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 09:42:38.722	2026-09-04 02:26:26.002
0b8d4fc6-6989-4289-9ef0-0e3a77b276c3	0f364069-d542-499f-a5be-b5ed4ce72da3	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 09:42:38.722	2026-09-06 06:36:45.392
1ccdf046-aac5-46d2-bb8f-56caf7a2b907	d154998c-ac1d-4315-89a7-499fb526f269	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 09:42:38.722	2026-09-06 06:36:49.454
5106253b-b39e-4362-a4e5-1d5a36522f30	d2492f80-a0bc-4066-ba2c-d3fa6fdc9ba2	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 09:42:38.722	2026-09-06 06:39:24.089
6bebc65e-334a-4b11-ba87-ca5aa2dc120c	abea9818-d1dc-4f1f-b961-249129f72554	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 09:42:38.722	2026-09-06 06:39:26.644
daaa94b6-9fa8-4f6e-9ef8-4860ffa7b483	7528f5ea-e2db-4623-b283-359a81bffe5f	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 09:42:38.722	2026-09-09 03:21:03.98
639bf1ba-f98b-498d-bdaa-aecb4ef94db3	b4aad350-ec01-4690-b919-a419dd3f97cc	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 09:42:38.722	2026-09-09 03:24:58.279
858cb42a-67d8-414a-8f85-b467a1434bbb	59978d9a-51f6-496f-89d4-13c1ffaaa712	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 09:42:38.722	2026-09-09 03:51:44.912
34d346b6-5465-4f5f-8d1b-635a64029b3f	21501813-cfea-478f-b38f-98247eda0ac3	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 09:42:38.722	2026-09-09 03:52:03.092
c54cb78a-ffe1-49f0-b2dc-7b2a22d59dd2	4fe39037-03a4-4325-ac6a-a0d25945ded5	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 09:42:38.722	2026-09-09 03:55:10.027
9bed80e7-7610-4508-9365-92c50d959952	ac4ee8b3-739f-4d2a-a2d5-49dc105b09fa	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 09:42:38.722	2026-09-09 03:55:28.564
277a6ddc-3dbb-4153-9377-05f9f04383ed	593bed64-fd9e-4714-b91a-b444dcfcb4ec	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 09:42:38.722	2026-09-09 08:03:17.993
c62507e6-95be-4896-a88c-06f9d5e5f88f	fdab3cf6-cf3e-4f2d-8de7-4d928a895993	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 09:42:38.722	2026-09-09 08:03:27.787
7fc1e8bb-f258-412a-b1d8-0a39c16bf6d7	55be8ba5-d425-4821-bbea-c8011b614375	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 09:42:38.722	2026-09-09 08:03:33.83
e6c0185f-5284-449a-b89e-63ef0f2d7b67	d625cc7e-63ca-47e6-904f-a0473ec78d18	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 09:42:38.722	2026-09-09 08:04:06.597
b3b802a8-c4fd-41c7-8eca-b6ea2fa58d83	4186f6b9-f193-48c1-8ef9-77e69437a477	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 09:42:38.722	2026-09-09 08:04:10.844
ac349380-fa82-447c-9710-6fe7b15b8a2f	fb2559de-4e7c-4b94-a615-8c2d7e435be6	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 09:42:38.722	2026-09-09 08:05:53.711
f43d7888-f7b0-46ff-aebb-e202e7c37672	6bcb9f28-4f2b-4e46-8c6a-bcc38bd81c61	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 09:42:38.722	2026-09-09 08:06:16.499
01d6bd10-cff9-4009-b62b-b45b38a59b2e	38590739-2d87-4e8a-8d4d-a8c84a3c8b19	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 09:42:38.722	2026-09-09 08:13:03.467
a330d9d6-eada-4a7e-9724-fd53074afaab	48b56abb-678f-493e-8325-8b93490088d8	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 09:42:38.722	2026-09-09 08:21:24.752
01ec4f89-2ea1-4650-8f30-8ab36dd3f1ba	4a852f49-25e1-4d8c-8df7-a21e9fe9f5d0	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 09:42:38.722	2026-09-09 09:41:42.855
0029fcac-6ae5-4583-9d61-b212265f29fa	2e85bc08-99de-4809-a004-b611ce890b0b	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 09:42:38.722	2026-09-09 09:41:59.95
d3733105-6205-45ce-9976-eef11eb70dca	1784b288-6094-4d79-94d0-9ac9ba2bbedf	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 09:42:38.722	2026-09-09 09:42:21.814
8f4804d5-64bd-4d83-a88b-fee8b0575cba	a2270b9e-ff6c-402d-9325-c40e9c722833	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 09:42:38.722	2026-09-09 09:42:24.837
65f7e66b-77fb-465e-bb05-54862dada439	dc99fdba-a7c6-4cce-96f8-66df9336c1d2	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 09:42:38.722	2026-09-09 09:42:32.338
89b69146-ed9b-44d9-af50-30ac29d96c7a	84c4ece4-e7b8-4d49-92aa-4ce9b4c0d540	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 09:51:17.959	2026-09-09 09:51:13.311
b3155822-46b8-473d-8e08-0107d438ef2b	f76d1ccd-37ba-4713-b3dc-ee9fa305cf9b	545ef296-1135-4885-8e61-89932645af6c	2026-09-09 09:51:32.018	2026-09-09 09:50:52.768
e44947e5-77f2-4ac7-a34c-8b354683a961	1784b288-6094-4d79-94d0-9ac9ba2bbedf	545ef296-1135-4885-8e61-89932645af6c	2026-09-09 09:51:32.018	2026-09-09 09:42:21.814
7b1cbb9e-6af7-41e9-8aaa-176baeb03494	84c4ece4-e7b8-4d49-92aa-4ce9b4c0d540	545ef296-1135-4885-8e61-89932645af6c	2026-09-09 09:51:32.018	2026-09-09 09:51:13.311
997c2747-c549-41c7-a7c3-25cc155a758d	9b173091-beae-4b37-b052-54783dc42247	545ef296-1135-4885-8e61-89932645af6c	2026-09-09 09:51:32.018	2026-09-09 09:51:25.536
123e8fbb-8b6e-413b-9fc3-5b3e20e10d39	59065cf0-04b7-4b13-86ae-040056df5612	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 09:54:14.233	2026-09-09 09:51:41.65
b44ec792-74e3-4a75-97a9-b48edb66dc4c	bb67ebac-40ab-4a04-b5cd-1480ab65c358	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 09:54:14.233	2026-09-09 09:50:11.078
601f4e37-9e32-4f67-b9b9-00edac9072d8	2186e87c-7382-4c39-9e3f-a6a4e32aff98	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 09:54:14.233	2026-09-09 09:52:20.061
dd8bde8d-b4a9-4279-b19d-33c26cd8d1f4	f76d1ccd-37ba-4713-b3dc-ee9fa305cf9b	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 09:54:14.233	2026-09-09 09:50:52.768
3048d7bb-43b4-4b98-a040-c58a19fd1082	84c4ece4-e7b8-4d49-92aa-4ce9b4c0d540	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 09:54:14.233	2026-09-09 09:51:13.311
9295a607-380d-4e83-9fcf-9cb164bcc812	a2270b9e-ff6c-402d-9325-c40e9c722833	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 09:54:14.233	2026-09-09 09:42:24.837
e89ddd15-111d-4b4f-bc5f-f1f208aabcaa	dc99fdba-a7c6-4cce-96f8-66df9336c1d2	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 09:54:14.233	2026-09-09 09:42:32.338
f4685188-45e0-41ca-9a7f-ca09a6f7395b	9b173091-beae-4b37-b052-54783dc42247	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 09:54:14.233	2026-09-09 09:51:25.536
6ea1fca9-b0a0-4e53-994d-31c634af7734	96524952-ae4d-4b52-bea3-76980451081c	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 09:54:14.233	2026-09-09 09:52:02.38
88830d02-13e7-4f6c-bfb1-a5717d2c697a	0855325f-fbb8-4209-8d3b-afb21e12f0e2	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 09:54:14.233	2026-09-09 09:52:42.837
f3ff6ceb-f0bb-425d-9d18-00871fdd32db	5b54e0b7-fb90-4a68-8263-e24fb5fa8b20	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 09:54:14.233	2026-09-09 09:52:53.063
f4f78e69-2f34-423c-9e2b-0f0cb10b8a67	1da44f94-3e53-4759-be95-0a84b14fdc72	545ef296-1135-4885-8e61-89932645af6c	2026-09-09 09:56:04.724	2026-09-09 09:54:30.558
b6904acb-a8bc-428c-9d93-e54bdc369a33	c5d48869-2cc1-4f3a-a8f0-1eb0eb27d41c	545ef296-1135-4885-8e61-89932645af6c	2026-09-09 09:56:04.724	2026-09-09 09:55:49.335
77c2850e-43d8-436e-bf18-d209d5d8d5d4	96524952-ae4d-4b52-bea3-76980451081c	545ef296-1135-4885-8e61-89932645af6c	2026-09-09 09:56:04.724	2026-09-09 09:52:02.38
142b6f7d-417a-49f3-92e9-d844e3048f2d	c861adb9-7af3-46d5-9863-8e6905bd76de	545ef296-1135-4885-8e61-89932645af6c	2026-09-09 09:56:04.724	2026-09-09 09:54:23.52
5517480f-735b-4e84-a920-6d463ffad1cf	a65cd0da-d280-4cc0-91fa-b8375c6c9fef	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-09 09:58:10.637	2026-09-09 09:56:17.616
32592249-87cf-4f86-97ea-074cbf6b6bbe	0855325f-fbb8-4209-8d3b-afb21e12f0e2	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-09 09:58:10.637	2026-09-09 09:52:42.837
16c96daf-f030-46b7-b1d5-063c901d3474	5b54e0b7-fb90-4a68-8263-e24fb5fa8b20	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-09 09:58:10.637	2026-09-09 09:52:53.063
82318d05-e6c3-48f7-b8fd-4da23b1968e3	c861adb9-7af3-46d5-9863-8e6905bd76de	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-09 09:58:10.637	2026-09-09 09:54:23.52
a40fe326-562d-4d0d-9d07-8c6949086e08	3ce4c675-45a1-4753-b5cf-4ff0dab5ea1c	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-09 09:58:10.637	2026-09-09 09:56:25.392
5ae1f141-88cc-411d-8d2a-b22997a36018	29650f93-94bc-4162-ad99-e1b9920cb20b	545ef296-1135-4885-8e61-89932645af6c	\N	2026-09-09 10:04:29.712
734e8a22-e1d0-4e09-8df1-856d3ab52dc9	29650f93-94bc-4162-ad99-e1b9920cb20b	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-09 10:04:50.628	2026-09-09 10:04:29.712
246b83c5-a272-4282-b664-a37c314f0ed5	3b220fa6-cfa2-49bd-ba19-2b57b904090c	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-09 10:05:23.581	2026-08-21 02:05:18.992
a6c03604-408a-4102-bc1d-bd8e7ed4fbf7	ede256bb-9f22-4014-a9dc-14cb3b9594d3	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-09 10:05:23.581	2026-08-21 02:09:08.884
83462434-d44b-4c86-a395-c1c9a2d33f1d	0d15d0f6-94d5-43f1-9a3f-41fa215f2ab4	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-09 10:05:23.581	2026-08-21 02:12:10.719
8c4e36b0-625f-4ac1-9bbe-99c607b46b54	39dfdfef-f96f-4056-878d-dbea1632814a	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-09 10:05:23.581	2026-08-21 06:33:37.373
2ea056ed-29ed-4f2e-aa4e-81428804ba5a	01e2571e-2cb0-4055-af25-6d72b989cdc6	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-09 10:05:23.581	2026-08-24 19:19:07.102
4ae55d51-3c63-44ac-b7d5-6689a1d85809	d34b450e-eca2-4a32-b426-d309f40665c7	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-09 10:05:23.581	2026-09-03 04:12:54.067
488922c4-94cc-4b24-96cc-d277f3adeb8d	7528f5ea-e2db-4623-b283-359a81bffe5f	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-09 10:05:23.581	2026-09-09 03:21:03.98
1e912419-144a-4cbc-bff0-ebfb5b190eed	68bdc058-091d-453e-aff6-6a38c6a77de3	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-09 10:05:23.581	2026-09-09 03:24:07.859
52ab8fd7-d22c-4c6e-b6a8-10f66f4e0f27	b4aad350-ec01-4690-b919-a419dd3f97cc	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-09 10:05:23.581	2026-09-09 03:24:58.279
05a3e714-99b4-428b-915b-97eea139c913	59978d9a-51f6-496f-89d4-13c1ffaaa712	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-09 10:05:23.581	2026-09-09 03:51:44.912
e5734e43-34b9-48f2-a6fe-88c6af135d54	21501813-cfea-478f-b38f-98247eda0ac3	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-09 10:05:23.581	2026-09-09 03:52:03.092
804b5745-0aea-4106-830e-6e96611c858b	4fe39037-03a4-4325-ac6a-a0d25945ded5	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-09 10:05:23.581	2026-09-09 03:55:10.027
36cdb9a8-89f9-4b0a-bc89-11b20fa40827	9b173091-beae-4b37-b052-54783dc42247	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 10:13:27.431	2026-09-09 09:51:25.536
d1cfa298-c1a9-456a-93f0-fdb017c56cc6	96524952-ae4d-4b52-bea3-76980451081c	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 10:13:27.431	2026-09-09 09:52:02.38
a25a7e17-f3d0-4769-b04f-9221669d1a07	593bed64-fd9e-4714-b91a-b444dcfcb4ec	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-09 10:05:23.581	2026-09-09 08:03:17.993
1a587a51-bac6-4f83-ba8e-b3d225552f51	fdab3cf6-cf3e-4f2d-8de7-4d928a895993	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-09 10:05:23.581	2026-09-09 08:03:27.787
a657d17f-44cf-4d23-b5bc-edbbd6f7a471	55be8ba5-d425-4821-bbea-c8011b614375	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-09 10:05:23.581	2026-09-09 08:03:33.83
794353f5-848c-47d2-acc5-6a36e5cae02e	d625cc7e-63ca-47e6-904f-a0473ec78d18	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-09 10:05:23.581	2026-09-09 08:04:06.597
834a9cad-4765-44ca-bbab-02a5b91eab71	4186f6b9-f193-48c1-8ef9-77e69437a477	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-09 10:05:23.581	2026-09-09 08:04:10.844
2651ee12-ffe3-4b54-b589-f9a51ba08b1c	fb2559de-4e7c-4b94-a615-8c2d7e435be6	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-09 10:05:23.581	2026-09-09 08:05:53.711
37a6def2-7845-4d4d-ad59-b579c97c18df	6bcb9f28-4f2b-4e46-8c6a-bcc38bd81c61	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-09 10:05:23.581	2026-09-09 08:06:16.499
3ad03b6b-7e71-4deb-a208-d3342f4544af	38590739-2d87-4e8a-8d4d-a8c84a3c8b19	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-09 10:05:23.581	2026-09-09 08:13:03.467
420cbd21-8872-4ceb-b0ae-d7ff1c48b686	48b56abb-678f-493e-8325-8b93490088d8	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-09 10:05:23.581	2026-09-09 08:21:24.752
0a56b265-b316-454a-bb76-b7fe560522f9	3ce4c675-45a1-4753-b5cf-4ff0dab5ea1c	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 10:06:19.493	2026-09-09 09:56:25.392
1de39de1-6f88-442d-98f2-1ad3e0d96b87	29650f93-94bc-4162-ad99-e1b9920cb20b	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 10:06:19.493	2026-09-09 10:04:29.712
39b03b5f-856c-4747-adb1-9efc7f6187a9	7f6536ec-75fb-4ac4-b59e-438e774bc8d3	545ef296-1135-4885-8e61-89932645af6c	\N	2026-09-09 10:06:27.62
8d1f6563-732d-4f4d-a8bc-0f0310c80634	9fb8725c-887c-4b1c-b694-46fff7d6ecf9	545ef296-1135-4885-8e61-89932645af6c	\N	2026-09-09 10:06:37.017
3672aced-6f05-40a3-b1db-142c55799769	faed012d-8ea7-47d7-9e3d-52f1f6adf579	545ef296-1135-4885-8e61-89932645af6c	\N	2026-09-09 10:06:50.349
6499aeb5-1690-4f49-9f1f-f48288350a40	2eb35ab1-6305-4862-bd9b-314006a95fa3	545ef296-1135-4885-8e61-89932645af6c	\N	2026-09-09 10:07:45.105
6f8d29f4-bb24-49ee-9d1b-58cbd9483f93	9b9368c9-8d2b-4117-9200-e772fa014b80	545ef296-1135-4885-8e61-89932645af6c	\N	2026-09-09 10:08:05.194
568da219-9d84-4141-a8fe-97aa48312881	9fb8725c-887c-4b1c-b694-46fff7d6ecf9	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-09 10:08:11.618	2026-09-09 10:06:37.017
d1844268-6043-47c0-90aa-f9c0a85841c7	9b9368c9-8d2b-4117-9200-e772fa014b80	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-09 10:08:11.618	2026-09-09 10:08:05.194
3ffe966f-eaf0-4942-8a94-34971d8f0707	1da44f94-3e53-4759-be95-0a84b14fdc72	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 10:13:27.431	2026-09-09 09:54:30.558
515a5e98-306a-43f5-a600-1bf9746cdccd	c5d48869-2cc1-4f3a-a8f0-1eb0eb27d41c	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 10:13:27.431	2026-09-09 09:55:49.335
bef446b6-5ae7-4b0f-99d7-90ccf834f6df	a65cd0da-d280-4cc0-91fa-b8375c6c9fef	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 10:13:27.431	2026-09-09 09:56:17.616
5fa67473-a86b-4b1b-be3b-b7791ba0f657	5b54e0b7-fb90-4a68-8263-e24fb5fa8b20	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 10:13:27.431	2026-09-09 09:52:53.063
26744123-c0c4-422d-80c5-50029461e8e0	c861adb9-7af3-46d5-9863-8e6905bd76de	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 10:13:27.431	2026-09-09 09:54:23.52
3a9767cb-b8ad-4364-be18-98299a53b65c	3ce4c675-45a1-4753-b5cf-4ff0dab5ea1c	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 10:13:27.431	2026-09-09 09:56:25.392
09d397f6-c491-40dc-9dbd-5adf176b229d	29650f93-94bc-4162-ad99-e1b9920cb20b	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 10:13:27.431	2026-09-09 10:04:29.712
188a95e5-00eb-45af-9282-54a5b870c200	7f6536ec-75fb-4ac4-b59e-438e774bc8d3	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 10:13:27.431	2026-09-09 10:06:27.62
e6ce0a4c-44a8-4342-bd90-d4692663e149	9fb8725c-887c-4b1c-b694-46fff7d6ecf9	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 10:13:27.431	2026-09-09 10:06:37.017
27df581e-f4f0-4845-883a-2502aea5bb1c	faed012d-8ea7-47d7-9e3d-52f1f6adf579	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 10:13:27.431	2026-09-09 10:06:50.349
25d9869e-4967-4c8d-8fd8-2b95cf94524a	2eb35ab1-6305-4862-bd9b-314006a95fa3	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 10:13:27.431	2026-09-09 10:07:45.105
367ebc3d-fa36-4c41-84c8-9a66c4fba2c8	9b9368c9-8d2b-4117-9200-e772fa014b80	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 10:13:27.431	2026-09-09 10:08:05.194
23f46dd1-ac06-43c5-93b9-72c0117fe8e4	14841dac-3a57-48e2-9c95-ceb9d39b1dbc	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-09 10:13:52.399	2026-09-09 10:13:43.757
c8153cc2-2f9c-4a2d-b28b-0ec1cc3b102e	9b9368c9-8d2b-4117-9200-e772fa014b80	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 10:16:46.209	2026-09-09 10:08:05.194
2638f66e-06cc-4250-8a8f-09a65150cbe0	2eb35ab1-6305-4862-bd9b-314006a95fa3	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 10:16:48.987	2026-09-09 10:07:45.105
1b3af517-e46b-4562-b2b5-ea6a93c4e5a8	7f6536ec-75fb-4ac4-b59e-438e774bc8d3	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 10:17:01.25	2026-09-09 10:06:27.62
3762fe17-ef93-40c7-9dc3-584ce815599e	faed012d-8ea7-47d7-9e3d-52f1f6adf579	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 10:17:01.25	2026-09-09 10:06:50.349
8c5a4007-de20-408a-b89c-aef9d3f8281c	7e175463-5116-4ad4-ac64-25b42e23852e	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	2026-09-09 10:17:44.699
3857822f-9eb4-4b83-98dc-a721936e46cc	7e175463-5116-4ad4-ac64-25b42e23852e	545ef296-1135-4885-8e61-89932645af6c	\N	2026-09-09 10:17:44.699
af0afa14-1a6e-4087-8b75-cc3ed92ac0c1	7e175463-5116-4ad4-ac64-25b42e23852e	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-09 10:17:54.171	2026-09-09 10:17:44.699
00e9a7d8-5c0d-437e-b10e-ecb8f00e4dcc	7e175463-5116-4ad4-ac64-25b42e23852e	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-09 10:19:17.844	2026-09-09 10:17:44.699
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, type, title, body, "taskId", "dedupKey", metadata, "createdAt") FROM stdin;
851de599-66c5-4b5a-9d54-9a718bbdb551	ACCOUNT_APPROVAL_REQUESTED	Yêu cầu đăng ký tài khoản mới	Nhân viên Phùng Thanh Bình (SĐT: 0961416137) vừa gửi yêu cầu tạo tài khoản mới. Vui lòng kiểm tra và xét duyệt.	\N	\N	{"approvalRequestId": "80e135c1-2d9f-48c0-9c96-63d66fbe8f22"}	2026-08-19 11:03:47.513
c942c8d4-c38a-42a4-a4b5-ea409205ddee	ACCOUNT_APPROVAL_REQUESTED	Yêu cầu đăng ký tài khoản mới	Nhân viên Đoàn Nam Dương (SĐT: 0347094104) vừa gửi yêu cầu tạo tài khoản mới. Vui lòng kiểm tra và xét duyệt.	\N	\N	{"approvalRequestId": "0584bd4c-10aa-4b1e-b0f8-677385e86c10"}	2026-08-20 02:01:01.143
a0ee9d5c-025c-4155-9430-812b6f97d1b9	ACCOUNT_APPROVAL_REQUESTED	Yêu cầu đăng ký tài khoản mới	Nhân viên Đinh Văn Học (SĐT: 0362021436) vừa gửi yêu cầu tạo tài khoản mới. Vui lòng kiểm tra và xét duyệt.	\N	\N	{"approvalRequestId": "bbaba29b-e648-4a8e-a5ce-c9cf8df592a0"}	2026-08-20 02:08:39.3
83a94171-3683-4f48-a421-d13e0e45a83f	SYSTEM	Bổ nhiệm quản lý	Bạn vừa được bổ nhiệm làm quản lý chi nhánh/phòng ban DEV.	\N	\N	\N	2026-08-20 02:10:06.522
33e85cce-ced0-4d52-9acd-e4b45f23368c	SYSTEM	Phân ca mới	Bạn đã được phân ca Ca sáng  từ ngày 20/8/2026 đến ngày 22/8/2026.	\N	\N	{"shiftId": "1d04d87f-ee21-472b-8abe-b502f5c2c11f", "totalDays": 3}	2026-08-20 02:11:58.978
64cb8e14-e023-4a0a-808c-1e13f659ea65	SYSTEM	Phân ca mới	Bạn đã được phân ca Ca sáng  từ ngày 17/8/2026 đến ngày 22/8/2026.	\N	\N	{"shiftId": "1d04d87f-ee21-472b-8abe-b502f5c2c11f", "totalDays": 6}	2026-08-20 02:12:50.158
57833fd7-6d91-4cb3-a9e7-3a8b01fbf045	SYSTEM	Phân ca mới	Bạn đã được phân ca Ca sáng  từ ngày 17/8/2026 đến ngày 22/8/2026.	\N	\N	{"shiftId": "1d04d87f-ee21-472b-8abe-b502f5c2c11f", "totalDays": 6}	2026-08-20 02:12:51.235
e4a34f11-8368-4b03-b135-7eeacee0d84f	TASK_ASSIGNED	New task assigned	App hướng dẫn sử dụng máy chiếu	f248050b-a30f-420f-820d-aa21104ae480	\N	\N	2026-08-20 02:18:00.041
5fd18db5-d7bd-4ad9-a0b5-fa5ebb6a19f3	TASK_ASSIGNED	New task assigned	App Giao diện cho máy chiếu	1b33570d-7112-41ea-9af8-f1292569a577	\N	\N	2026-08-20 02:21:53.896
09467733-c51d-48f9-941f-e17ceb877870	TASK_ASSIGNED	New task assigned	App giao diện cho home dịch vụ	aecf0c65-74c6-4611-8cba-417a5c6bc044	\N	\N	2026-08-20 02:23:00.951
76f65a34-05fb-48cd-b914-322e7f40d440	ACCOUNT_APPROVAL_REQUESTED	Yêu cầu đăng ký tài khoản mới	Nhân viên Đoàn Nam Dương (SĐT: 0347941047) vừa gửi yêu cầu tạo tài khoản mới. Vui lòng kiểm tra và xét duyệt.	\N	\N	{"approvalRequestId": "282602c6-5574-480d-b9ba-c73bc4d47685"}	2026-08-20 02:34:23.58
a81905f6-d2d6-439e-aeda-1f14716f24b6	TASK_ASSIGNED	New task assigned	Sửa lại cho anh backend OTP, frontend web	0641fe45-497a-4f73-b16d-b65155641479	\N	\N	2026-08-20 02:46:43.487
fc2f0a54-0ffd-47bc-94a7-759ab988edd6	TASK_ASSIGNED	New task assigned	sửa lại backend, frontend đang chưa ổn	2a1f5cec-a02e-4d56-adae-ee357bceb47d	\N	\N	2026-08-20 02:48:28.125
3aa7eab4-3b9e-4603-90eb-0b1bb4a47ffa	TASK_ASSIGNED	New task assigned	fix lại cho anh lỗi khi out app nhé	cc34421e-67c5-485b-a773-81faf5713efd	\N	\N	2026-08-20 02:50:31.271
7cba22cf-4839-43c5-b556-c607b8beb140	TASK_ASSIGNED	New task assigned	Hoàn thiện phần giao diện của web	263c454d-f384-46bb-92ea-13c9baa380e0	\N	\N	2026-08-20 02:51:51.101
7a8688c6-21bd-4fed-904a-392e0c6e4589	TASK_ASSIGNED	New task assigned	Hoàn thiện chuẩn về giao diện và đưa ra demo	7144b02a-5c75-481c-affc-e2726d2f0e11	\N	\N	2026-08-20 02:53:19.865
0b57fe30-efca-4d76-8ab6-42fb77cca684	TASK_REVIEW_REQUESTED	Công việc cần duyệt/đã hoàn thành	Nhân viên Đoàn Nam Dương đã nộp công việc: sửa lại backend, frontend đang chưa ổn	2a1f5cec-a02e-4d56-adae-ee357bceb47d	\N	{"taskId": "2a1f5cec-a02e-4d56-adae-ee357bceb47d"}	2026-08-20 03:35:54.413
d6a14fec-6bba-43a0-bf4c-1bc914fe9037	TASK_REVIEW_REQUESTED	Công việc cần duyệt/đã hoàn thành	Nhân viên Phùng Thanh Bình đã nộp công việc: fix lại cho anh lỗi khi out app nhé	cc34421e-67c5-485b-a773-81faf5713efd	\N	{"taskId": "cc34421e-67c5-485b-a773-81faf5713efd"}	2026-08-20 04:45:49.686
2f4756b8-2bf4-4b4f-a120-0878d17edba5	TASK_REVIEW_REQUESTED	Công việc cần duyệt/đã hoàn thành	Nhân viên Phùng Thanh Bình đã nộp công việc: Hoàn thiện phần giao diện của web	263c454d-f384-46bb-92ea-13c9baa380e0	\N	{"taskId": "263c454d-f384-46bb-92ea-13c9baa380e0"}	2026-08-20 08:49:25.688
e1c4e5c6-22de-4707-ad4d-9c14be0ab1ed	TASK_UPDATED	Công việc đã được duyệt	Công việc "fix lại cho anh lỗi khi out app nhé" của bạn đã được duyệt.	cc34421e-67c5-485b-a773-81faf5713efd	\N	\N	2026-08-21 02:04:58.148
3b220fa6-cfa2-49bd-ba19-2b57b904090c	TASK_UPDATED	Công việc đã được duyệt	Công việc "sửa lại backend, frontend đang chưa ổn" của bạn đã được duyệt.	2a1f5cec-a02e-4d56-adae-ee357bceb47d	\N	\N	2026-08-21 02:05:18.992
64c52e44-0f1b-4d6a-9f24-e31a8c8fa365	TASK_UPDATED	Yêu cầu gia hạn công việc mới	Đoàn Nam Dương đã xin gia hạn công việc "Hoàn thiện chuẩn về giao diện và đưa ra demo". Lý do: Làm thêm api	7144b02a-5c75-481c-affc-e2726d2f0e11	\N	{"taskId": "7144b02a-5c75-481c-affc-e2726d2f0e11", "extensionRequestId": "c2ad92c9-53cb-4eb6-a1bb-71738947e53b"}	2026-08-21 02:07:58.051
ede256bb-9f22-4014-a9dc-14cb3b9594d3	TASK_UPDATED	Yêu cầu gia hạn được phê duyệt	Yêu cầu gia hạn công việc "Hoàn thiện chuẩn về giao diện và đưa ra demo" của bạn đã được chấp nhận.	7144b02a-5c75-481c-affc-e2726d2f0e11	\N	{"taskId": "7144b02a-5c75-481c-affc-e2726d2f0e11", "extensionRequestId": "c2ad92c9-53cb-4eb6-a1bb-71738947e53b"}	2026-08-21 02:09:08.884
5734fd68-fe87-40c4-ac58-2871c72156ca	TASK_UPDATED	Công việc đã được duyệt	Công việc "Hoàn thiện phần giao diện của web" của bạn đã được duyệt.	263c454d-f384-46bb-92ea-13c9baa380e0	\N	\N	2026-08-21 02:09:22.284
18169196-acb4-41c0-96ef-5b63fc6921d7	TASK_ASSIGNED	New task assigned	lấy api của youtube, movie, game, app store	31d6d0a6-9abf-4675-a0c9-9fd1d0599c7f	\N	\N	2026-08-21 02:10:18.275
54962ef9-5b94-4581-9d24-e6e8c8088a20	TASK_ASSIGNED	New task assigned	nghiên cứu phần premium giá với lại các gói của app dịch vụ home	b7dc98d4-8c24-44ce-922b-a1506e087e24	\N	\N	2026-08-21 02:11:25.933
0d15d0f6-94d5-43f1-9a3f-41fa215f2ab4	TASK_ASSIGNED	New task assigned	thực hiện là gắn api vào app giao diện	6a93af02-a691-4a49-a78c-e86c59add3c4	\N	\N	2026-08-21 02:12:10.719
b74189c2-134c-4549-b962-974520084e5f	TASK_REVIEW_REQUESTED	Công việc cần duyệt/đã hoàn thành	Nhân viên Đinh Văn Học đã nộp công việc: App Giao diện cho máy chiếu	1b33570d-7112-41ea-9af8-f1292569a577	\N	{"taskId": "1b33570d-7112-41ea-9af8-f1292569a577"}	2026-08-21 02:12:41.027
6a0071b1-f7b5-4ff3-89da-1408076e6be2	TASK_REVIEW_REQUESTED	Công việc cần duyệt/đã hoàn thành	Nhân viên Đinh Văn Học đã nộp công việc: App hướng dẫn sử dụng máy chiếu	f248050b-a30f-420f-820d-aa21104ae480	\N	{"taskId": "f248050b-a30f-420f-820d-aa21104ae480"}	2026-08-21 02:12:48.793
da009527-db18-4239-acf0-e564082f3ad8	TASK_REVIEW_REQUESTED	Công việc cần duyệt/đã hoàn thành	Nhân viên Đoàn Nam Dương đã nộp công việc: Hoàn thiện chuẩn về giao diện và đưa ra demo	7144b02a-5c75-481c-affc-e2726d2f0e11	\N	{"taskId": "7144b02a-5c75-481c-affc-e2726d2f0e11"}	2026-08-21 02:46:51.518
98b1b2fa-1096-4aff-b5ff-9445e7432d85	TASK_REVIEW_REQUESTED	Công việc cần duyệt/đã hoàn thành	Nhân viên Phùng Thanh Bình đã nộp công việc: lấy api của youtube, movie, game, app store	31d6d0a6-9abf-4675-a0c9-9fd1d0599c7f	\N	{"taskId": "31d6d0a6-9abf-4675-a0c9-9fd1d0599c7f"}	2026-08-21 03:14:08.611
c70dc573-1cde-4daa-9e93-ee9ec1752b7a	TASK_REVIEW_REQUESTED	Công việc cần duyệt/đã hoàn thành	Nhân viên Phùng Thanh Bình đã nộp công việc: nghiên cứu phần premium giá với lại các gói của app dịch vụ home	b7dc98d4-8c24-44ce-922b-a1506e087e24	\N	{"taskId": "b7dc98d4-8c24-44ce-922b-a1506e087e24"}	2026-08-21 04:33:03.845
4153b6a4-3cdf-4681-9d2e-7999c927208d	TASK_UPDATED	Công việc đã được duyệt	Công việc "nghiên cứu phần premium giá với lại các gói của app dịch vụ home" của bạn đã được duyệt.	b7dc98d4-8c24-44ce-922b-a1506e087e24	\N	\N	2026-08-21 06:33:31.75
5509389d-5820-4e6c-a705-566d83c8167e	TASK_UPDATED	Công việc đã được duyệt	Công việc "lấy api của youtube, movie, game, app store" của bạn đã được duyệt.	31d6d0a6-9abf-4675-a0c9-9fd1d0599c7f	\N	\N	2026-08-21 06:33:35.77
39dfdfef-f96f-4056-878d-dbea1632814a	TASK_UPDATED	Công việc đã được duyệt	Công việc "Hoàn thiện chuẩn về giao diện và đưa ra demo" của bạn đã được duyệt.	7144b02a-5c75-481c-affc-e2726d2f0e11	\N	\N	2026-08-21 06:33:37.373
229b137a-1356-453f-9c21-a12a74fff5fb	TASK_REVIEW_REQUESTED	Công việc cần duyệt/đã hoàn thành	Nhân viên Đoàn Nam Dương đã nộp công việc: thực hiện là gắn api vào app giao diện	6a93af02-a691-4a49-a78c-e86c59add3c4	\N	{"taskId": "6a93af02-a691-4a49-a78c-e86c59add3c4"}	2026-08-21 10:15:45.033
19ca97cb-b0d0-4f56-8763-7b79b9747ab6	NEWSFEED_POST_PENDING	Bài đăng mới cần duyệt	Phùng Thanh Bình vừa đăng một bài viết mới trong phòng ban.	\N	\N	{"postId": "c2df5353-65c3-460a-85a0-99b426f04f85"}	2026-08-22 02:20:04.666
82198158-2a38-40ba-9a37-9846847ddc90	CHAT_MESSAGE	Tin nhắn mới từ Phùng Thanh Bình (Nhóm: Nhóm DEV)		\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "7151d258-f96c-4793-911a-4e9058dacf0a"}	2026-08-22 02:20:27.003
78abe25e-6ae1-4d0c-8812-bfff0c78b247	CHAT_MESSAGE	Tin nhắn mới từ Phùng Thanh Bình (Nhóm: Nhóm DEV)	alo	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "5de4c09f-91e1-4464-9a93-8aee8d9c8271"}	2026-08-22 02:20:54.135
c78925a0-b9c2-44d7-8c4c-e6fa3354e185	CHAT_MESSAGE	Tin nhắn mới từ Phùng Thanh Bình (Nhóm: Nhóm DEV)	[Nhãn dán]	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "cfbd1156-8480-425b-b53f-45cc5ff59da2"}	2026-08-22 11:20:07.807
1363ac9c-d6c8-4d5b-ae34-d9bfc56bf54c	TASK_REVIEW_REQUESTED	Công việc cần duyệt/đã hoàn thành	Nhân viên Đinh Văn Học đã nộp công việc: App giao diện cho home dịch vụ	aecf0c65-74c6-4611-8cba-417a5c6bc044	\N	{"taskId": "aecf0c65-74c6-4611-8cba-417a5c6bc044"}	2026-08-24 08:59:45.849
74ac9c49-3e44-4932-913e-612778acca99	SYSTEM	Phân ca mới	Bạn đã được phân ca Ca sáng  từ ngày 25/8/2026 đến ngày 29/8/2026.	\N	\N	{"shiftId": "1d04d87f-ee21-472b-8abe-b502f5c2c11f", "totalDays": 5}	2026-08-24 19:19:05.335
5057a1cd-4493-4d60-8bd5-0c5eb96e152b	SYSTEM	Phân ca mới	Bạn đã được phân ca Ca sáng  từ ngày 25/8/2026 đến ngày 29/8/2026.	\N	\N	{"shiftId": "1d04d87f-ee21-472b-8abe-b502f5c2c11f", "totalDays": 5}	2026-08-24 19:19:06.369
01e2571e-2cb0-4055-af25-6d72b989cdc6	SYSTEM	Phân ca mới	Bạn đã được phân ca Ca sáng  từ ngày 25/8/2026 đến ngày 29/8/2026.	\N	\N	{"shiftId": "1d04d87f-ee21-472b-8abe-b502f5c2c11f", "totalDays": 5}	2026-08-24 19:19:07.102
6a24cbc0-6fc6-4903-add9-a7dc7723de20	SYSTEM	Phân ca mới	Bạn đã được phân ca Ca sáng  từ ngày 25/8/2026 đến ngày 29/8/2026.	\N	\N	{"shiftId": "1d04d87f-ee21-472b-8abe-b502f5c2c11f", "totalDays": 5}	2026-08-24 19:19:07.857
305fddb7-5c73-4a79-8475-cfc80e53b6be	CHAT_MESSAGE	Tin nhắn mới từ Đinh Văn Học (Nhóm: Nhóm DEV)	[Nhãn dán]	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "404d413d-706d-4009-aa1d-a76d0fccf2db"}	2026-08-27 03:18:07.679
b21cd152-8572-44de-a33e-abac40d5eb36	NEWSFEED_POST_APPROVED	Bài đăng đã được duyệt	Bài đăng của bạn đã được duyệt và hiển thị trên bảng tin.	\N	\N	{"postId": "c2df5353-65c3-460a-85a0-99b426f04f85"}	2026-08-27 03:20:38.588
de2b5571-9bfb-4359-b753-9fb92c2f9b60	SYSTEM	Bảng tin công ty	Có một bài đăng mới: 	\N	\N	{"postId": "c2df5353-65c3-460a-85a0-99b426f04f85"}	2026-08-27 03:20:39.201
0d2286dd-3391-41cb-85e1-eb29c8861a75	ACCOUNT_APPROVAL_REQUESTED	Yêu cầu đăng ký tài khoản mới	Nhân viên Cao Việt Đức (SĐT: 0339143776) vừa gửi yêu cầu tạo tài khoản mới. Vui lòng kiểm tra và xét duyệt.	\N	\N	{"approvalRequestId": "1476d00f-201b-404b-b975-5a3083cc9759"}	2026-08-27 16:08:04.695
370339e3-35bf-4323-bdb8-9a132f889ec8	ACCOUNT_APPROVAL_REQUESTED	Yêu cầu đăng ký tài khoản mới	Nhân viên Cường Test 1 (SĐT: 0362102201) vừa gửi yêu cầu tạo tài khoản mới. Vui lòng kiểm tra và xét duyệt.	\N	\N	{"approvalRequestId": "45dd6098-cb4e-4fcf-9250-7dcab236566c"}	2026-08-29 03:07:08.313
f39fc4bd-48e0-48d9-8b94-2ea80bd7cc4d	CHAT_MESSAGE	Tin nhắn mới từ Đoàn Nam Dương (Nhóm: Nhóm DEV)	[Nhãn dán]	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "0e8ea5b1-f454-4297-abfb-2b7559c9f52d"}	2026-08-29 04:19:47.487
27fe1017-359a-41eb-8824-3deca3cc884e	SYSTEM	Phân ca mới	Bạn đã được phân ca Ca sáng  từ ngày 24/8/2026 đến ngày 29/8/2026.	\N	\N	{"shiftId": "1d04d87f-ee21-472b-8abe-b502f5c2c11f", "totalDays": 6}	2026-08-29 04:56:08.639
4541d7ba-2d70-472e-a20c-71375a64c9f1	CHAT_MESSAGE	Tin nhắn mới từ Đinh Văn Học (Nhóm: Nhóm DEV)	@Cường Test 1 hi	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "9118d1d1-ae02-4318-95d6-fe2710457a5d"}	2026-08-29 04:56:25.191
63d9597c-0f35-4122-a1a2-a9d050136150	CHAT_MESSAGE	Tin nhắn mới từ Đinh Văn Học (Nhóm: Nhóm DEV)	[Nhãn dán]	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "a37941e2-c231-4370-9596-43c2cbcb4d30"}	2026-08-29 04:56:31.618
994fc17b-4c4f-4554-bc9c-bd2fed32b4aa	CHAT_MESSAGE	Tin nhắn mới từ Phùng Thanh Bình (Nhóm: Nhóm DEV)	[Nhãn dán]	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "54e76513-24d4-4eaa-bfe2-340ea95429fc"}	2026-08-29 05:09:05.936
ed21aad4-87dd-4dc6-aef8-8445ab862d94	CHAT_MESSAGE	Tin nhắn mới từ Đinh Văn Học (Nhóm: Nhóm DEV)	[Nhãn dán]	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "f1a15a68-7c61-4d30-bb20-8f6fb29ac316"}	2026-08-29 05:09:29.891
268e681f-390a-48bc-815f-d864994ed0b1	CHAT_MESSAGE	Tin nhắn mới từ Cường Test 1 (Nhóm: Nhóm DEV)	Update bao giờ xong ae ơi	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "87c7c071-2afc-499b-8da9-a4cc13909f0f"}	2026-08-29 08:13:04.097
c6036169-d766-44fe-810a-dfc23ac65173	CHAT_MESSAGE	Tin nhắn mới từ Cường Test 1 (Nhóm: Nhóm DEV)	Gửi tin nhắn hơi lắc	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "96cb49d5-0fa7-49aa-aa20-2f43345acfa4"}	2026-08-29 08:13:14.562
c8f6b1c3-ed06-425e-966f-4ea43b2c3166	CHAT_MESSAGE	Tin nhắn mới từ Admin (Nhóm: Nhóm DEV)	cái này là do phần lưu database free đó anh ơi 	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "56172bc2-00fb-4bf9-9f5a-8d65155bc396"}	2026-08-29 08:13:58.641
78ef3650-b526-4a94-a607-345e5a54d468	CHAT_MESSAGE	Tin nhắn mới từ Admin (Nhóm: Nhóm DEV)	haha 	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "b80fe3b1-9bb7-4da1-8ffa-2ced5d3187b9"}	2026-08-29 08:14:02.359
b6941d90-a7db-411d-ad1f-44243b9cf01c	NEWSFEED_POST_PENDING	Bài đăng mới cần duyệt	Cường Test 1 vừa đăng một bài viết mới trong phòng ban.	\N	\N	{"postId": "b38a60cf-a061-48a9-8242-3a61db3e6470"}	2026-08-29 08:14:50.202
a4c503e2-8970-40a4-b85a-aac9fac0df78	NEWSFEED_POST_APPROVED	Bài đăng đã được duyệt	Bài đăng của bạn đã được duyệt và hiển thị trên bảng tin.	\N	\N	{"postId": "b38a60cf-a061-48a9-8242-3a61db3e6470"}	2026-08-29 08:15:02.198
2d4b0332-6d24-4c3b-9d05-5b43e7aaa193	SYSTEM	Bảng tin công ty	Có một bài đăng mới: Thủ tiêu mục tiêu này thưởng 10k	\N	\N	{"postId": "b38a60cf-a061-48a9-8242-3a61db3e6470"}	2026-08-29 08:15:03.297
428d431e-84d4-4774-9579-80ec54ab25da	SYSTEM	Bình luận mới về bài viết của bạn	Đinh Văn Học đã bình luận: "Phạt"	\N	\N	{"action": "COMMENT", "postId": "b38a60cf-a061-48a9-8242-3a61db3e6470"}	2026-08-29 08:15:11.581
292f4185-bad4-4f81-8a3a-c8c841c7d510	CHAT_MESSAGE	Tin nhắn mới từ Đinh Văn Học (Nhóm: Nhóm DEV)	[Nhãn dán]	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "9265b2cd-a75c-48dc-8d01-897073c30722"}	2026-08-29 08:15:28.125
df607f3d-3c8a-4099-b423-9367bf55dc19	CHAT_MESSAGE	Tin nhắn mới từ Cường Test 1 (Nhóm: Nhóm DEV)	Có vẻ nó căn lề các thứ chưa chuẩn nhỉ	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "900b2b89-848c-4ecd-bd91-a89a78da5557"}	2026-08-29 08:15:28.29
da0fc039-d5ae-4ca0-8c95-2bd9e753b09e	CHAT_MESSAGE	Tin nhắn mới từ Đinh Văn Học (Nhóm: Nhóm DEV)	Căn lề phần nào đó anh	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "97963f2e-4dda-43fb-8146-403b1a07121c"}	2026-08-29 08:15:44.75
e5b3edec-3c31-49f3-b00d-1288ca14b5df	SYSTEM	Bình luận mới về bài viết của bạn	Phùng Thanh Bình đã bình luận: "🙃"	\N	\N	{"action": "COMMENT", "postId": "b38a60cf-a061-48a9-8242-3a61db3e6470"}	2026-08-29 08:15:50.131
6b300ded-d565-4ad7-9982-5c16e159d8f0	CHAT_MESSAGE	Tin nhắn mới từ Cường Test 1 (Nhóm: Nhóm DEV)	[Hình ảnh]	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "a95587e8-08f1-424e-900e-50122b059aea"}	2026-08-29 08:16:03.623
766e8743-14d4-42b8-bb8d-7bf92cd63684	CHAT_MESSAGE	Tin nhắn mới từ Cường Test 1 (Nhóm: Nhóm DEV)	Trên cùng bên trái	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "bbbd65f2-4fc8-4aa6-8a26-393c0afb6e2b"}	2026-08-29 08:16:17.335
09471fd9-50b2-4843-8d4d-94d32fd15797	CHAT_MESSAGE	Tin nhắn mới từ Cường Test 1 (Nhóm: Nhóm DEV)	Lắc quá ae ơi. Phải tìm gói nào rẻ rẻ cho nó mượt mượt tý	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "3337544d-2680-4cbb-8013-9f58f1d1cb6d"}	2026-08-29 08:16:36.507
fb0faaa5-debc-4214-a48b-6d3e66c76727	CHAT_MESSAGE	Tin nhắn mới từ Đinh Văn Học (Nhóm: Nhóm DEV)	Rùi em thấy rùi	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "2d418642-e52b-44a4-8f87-473a6a8caa10"}	2026-08-29 08:16:42.94
695f2624-62ba-4936-9263-38393c630568	CHAT_MESSAGE	Tin nhắn mới từ Admin (Nhóm: Nhóm DEV)	rẻ có đó nhưng chưa chắc đã mượn mà 	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "d85c3b9b-1910-4359-9454-150c1c1a8061"}	2026-08-29 08:17:00
2123f217-471a-45e0-a736-e10406abd923	CHAT_MESSAGE	Tin nhắn mới từ Cường Test 1 (Nhóm: Nhóm DEV)	Phần cmt ở dưới nữa lệch	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "e9646fb4-9c3a-42f9-a460-1a38524898e3"}	2026-08-29 08:17:07.573
af6b22cd-35ea-4b6b-be6e-bed64708e29d	CHAT_MESSAGE	Tin nhắn mới từ Admin (Nhóm: Nhóm DEV)	mượt 	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "fd604455-1712-402e-93c1-22b4df5aa342"}	2026-08-29 08:17:09.019
fcd497fa-efbb-4f51-bed0-05dfd27c5a03	CHAT_MESSAGE	Tin nhắn mới từ Cường Test 1 (Nhóm: Nhóm DEV)	Không thể lắc như này được =)))))	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "8940dca5-b943-4f73-a8f0-dbb07418e3e3"}	2026-08-29 08:17:33.793
c7012f8e-d85a-4347-8b88-390314baeaa5	CHAT_MESSAGE	Tin nhắn mới từ Admin (Nhóm: Nhóm DEV)	trên web mượt hơn xíu 	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "59d24ad2-231d-48df-8702-15631cb29db7"}	2026-08-29 08:17:45.94
dbb09470-7f57-436d-9817-a92ea74127fe	CHAT_MESSAGE	Tin nhắn mới từ Admin (Nhóm: Nhóm DEV)	nhưng mà anh ơi anh đang thấy đoạn lệch anh cái chi tiết bài đăng thì đúng lệch thaath 	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "a08a1d49-5c2f-4324-9ef2-bc4b769114b8"}	2026-08-29 08:18:20.036
6ab232fd-0647-45ea-b546-5affb9de59f5	SYSTEM	Góp ý mới (Ẩn danh)	Tiêu đề: Tăng lươngggggg	\N	\N	{"feedbackId": "8a0b0d87-eb01-457d-a6a2-c667d000c892"}	2026-08-29 08:18:34.579
d8625dde-a109-41f0-ad12-8587b45058af	SYSTEM	Phản hồi góp ý	Góp ý của bạn đã được chuyển sang trạng thái: RESOLVED.	\N	\N	{"feedbackId": "8a0b0d87-eb01-457d-a6a2-c667d000c892"}	2026-08-29 08:21:43.044
22ef04d4-f2c7-46eb-a8dc-22b3b7837ce9	CHAT_MESSAGE	Tin nhắn mới từ Cường Test 1 (Nhóm: Nhóm DEV)	Thử thay ava app sang logo + 2/9 được không em	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "bd4beedb-c2e6-49ca-8d5b-da183a59b343"}	2026-08-29 08:21:45.866
f53486c1-2ddc-425e-9075-03dcac7fda59	CHAT_MESSAGE	Tin nhắn mới từ Cường Test 1 (Nhóm: Nhóm DEV)	Ví dụ sau mình thay đổi ảnh nền của app ấy	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "022ccf6b-4901-4721-942e-33471d3b3e4b"}	2026-08-29 08:21:59.157
3dcb7c76-e139-41c5-811b-ef00d6a39135	SYSTEM	Yêu cầu mới	Nhân viên Cường Test 1 vừa gửi yêu cầu: Nghỉ đi ngủ	\N	\N	{"requestId": "8cfa2d57-b4c2-4f3c-81e4-624f447c0425"}	2026-08-29 08:23:12.498
21d92fd6-4429-473d-a814-b0d536838997	CHAT_MESSAGE	Tin nhắn mới từ Admin (Nhóm: Nhóm DEV)	cái này phải làm trừ truwos anh ơi 	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "859f3160-039f-44fd-9f74-cfe1c446284a"}	2026-08-29 08:23:16.735
e8a7413c-c55d-4ad9-8300-4171cef43a55	SYSTEM	Yêu cầu bị từ chối	Yêu cầu "Nghỉ đi ngủ" của bạn đã bị từ chối.	\N	\N	{"requestId": "8cfa2d57-b4c2-4f3c-81e4-624f447c0425"}	2026-08-29 08:23:26.317
958e7754-561e-4860-89e8-5cdb0ad11bf1	ACCOUNT_APPROVAL_REQUESTED	Yêu cầu đăng ký tài khoản mới	Nhân viên Hồ Đức (SĐT: 0366682460) vừa gửi yêu cầu tạo tài khoản mới. Vui lòng kiểm tra và xét duyệt.	\N	\N	{"approvalRequestId": "470a5b2e-e812-4dfb-af40-be5adad698b7"}	2026-08-29 08:35:29.846
a038ef60-2a46-4ff9-a721-2c69e9a0e450	SYSTEM	Yêu cầu mới	Nhân viên Cường Test 1 vừa gửi yêu cầu: Tạm ứng - 5.000.000.000 VNĐ	\N	\N	{"requestId": "c03e5352-06f7-436d-b7eb-43b57e9036e6"}	2026-08-29 08:36:34.15
3c474ba9-4d68-433d-bf10-867a9fe3b37c	ACCOUNT_APPROVAL_REQUESTED	Yêu cầu đăng ký tài khoản mới	Nhân viên Dương Văn Thuận (SĐT: 0326642921) vừa gửi yêu cầu tạo tài khoản mới. Vui lòng kiểm tra và xét duyệt.	\N	\N	{"approvalRequestId": "6c1acc8c-b627-4b10-8cc0-bdeaf0adff2f"}	2026-08-29 08:37:25.914
601a13a8-4974-4d8e-88fc-9854bf706428	SYSTEM	Yêu cầu bị từ chối	Yêu cầu "Tạm ứng - 5.000.000.000 VNĐ" của bạn đã bị từ chối.	\N	\N	{"requestId": "c03e5352-06f7-436d-b7eb-43b57e9036e6"}	2026-08-29 08:37:49.876
61213425-1896-4cbd-84b7-10de70d7b6d2	ACCOUNT_APPROVAL_REQUESTED	Yêu cầu đăng ký tài khoản mới	Nhân viên Lê văn hà (SĐT: 0359990001) vừa gửi yêu cầu tạo tài khoản mới. Vui lòng kiểm tra và xét duyệt.	\N	\N	{"approvalRequestId": "cc209493-51d6-45d8-8eb4-92e32bbe31d9"}	2026-08-29 08:37:57.551
4bf95c82-40af-40dd-bce8-40827da59ee4	SYSTEM	Có người vừa thả tim bài viết của bạn	Lê văn hà đã thích bài viết của bạn.	\N	\N	{"action": "LIKE", "postId": "b38a60cf-a061-48a9-8242-3a61db3e6470"}	2026-08-29 08:42:21.453
5db03681-df0c-4f26-bb0d-dd0625b84e48	SYSTEM	Có người vừa thả tim bài viết của bạn	Lê văn hà đã thích bài viết của bạn.	\N	\N	{"action": "LIKE", "postId": "b38a60cf-a061-48a9-8242-3a61db3e6470"}	2026-08-29 08:42:22.412
1b35cd31-eb5c-4495-b31c-79764853a51c	SYSTEM	Có người vừa thả tim bài viết của bạn	Lê văn hà đã thích bài viết của bạn.	\N	\N	{"action": "LIKE", "postId": "b38a60cf-a061-48a9-8242-3a61db3e6470"}	2026-08-29 08:42:24.957
ddd1cff1-cc41-4d2b-b4d7-e2497fd36990	SYSTEM	Có người vừa thả tim bài viết của bạn	Lê văn hà đã thích bài viết của bạn.	\N	\N	{"action": "LIKE", "postId": "b38a60cf-a061-48a9-8242-3a61db3e6470"}	2026-08-29 08:42:25.446
0aa462a0-caf0-48ba-babf-05fe9e201601	SYSTEM	Có người vừa thả tim bài viết của bạn	Lê văn hà đã thích bài viết của bạn.	\N	\N	{"action": "LIKE", "postId": "b38a60cf-a061-48a9-8242-3a61db3e6470"}	2026-08-29 08:42:26.997
705eaf1b-f836-42b8-82b2-e1aa389caa83	SYSTEM	Có người vừa thả tim bài viết của bạn	Hồ Đức đã thích bài viết của bạn.	\N	\N	{"action": "LIKE", "postId": "b38a60cf-a061-48a9-8242-3a61db3e6470"}	2026-08-29 08:42:28.697
820578dc-4d1f-4aa4-8583-aa0277e8782b	SYSTEM	Có người vừa thả tim bài viết của bạn	Hồ Đức đã thích bài viết của bạn.	\N	\N	{"action": "LIKE", "postId": "b38a60cf-a061-48a9-8242-3a61db3e6470"}	2026-08-29 08:42:30.692
eebfaa92-378b-47a6-bf00-c9190266d8e2	SYSTEM	Có người vừa thả tim bài viết của bạn	Lê văn hà đã thích bài viết của bạn.	\N	\N	{"action": "LIKE", "postId": "b38a60cf-a061-48a9-8242-3a61db3e6470"}	2026-08-29 08:42:31.641
f66e59a8-a4c7-4724-a8e6-91a18f02e3ed	SYSTEM	Có người vừa thả tim bài viết của bạn	Lê văn hà đã thích bài viết của bạn.	\N	\N	{"action": "LIKE", "postId": "b38a60cf-a061-48a9-8242-3a61db3e6470"}	2026-08-29 08:42:32.492
693734c5-2dd6-46ae-90a3-009b35b93142	SYSTEM	Có người vừa thả tim bài viết của bạn	Lê văn hà đã thích bài viết của bạn.	\N	\N	{"action": "LIKE", "postId": "b38a60cf-a061-48a9-8242-3a61db3e6470"}	2026-08-29 08:42:33.001
fe21082c-3adc-4bb5-a86b-33f8e06b5dcc	SYSTEM	Có người vừa thả tim bài viết của bạn	Lê văn hà đã thích bài viết của bạn.	\N	\N	{"action": "LIKE", "postId": "c2df5353-65c3-460a-85a0-99b426f04f85"}	2026-08-29 08:42:35.475
15285d76-f07b-4ec4-b702-1b2b16314d88	SYSTEM	Có người vừa thả tim bài viết của bạn	Hồ Đức đã thích bài viết của bạn.	\N	\N	{"action": "LIKE", "postId": "b38a60cf-a061-48a9-8242-3a61db3e6470"}	2026-08-29 08:42:37.38
b06aa45d-2d11-4257-a6b8-aea7e04d43db	SYSTEM	Có người vừa thả tim bài viết của bạn	Hồ Đức đã thích bài viết của bạn.	\N	\N	{"action": "LIKE", "postId": "b38a60cf-a061-48a9-8242-3a61db3e6470"}	2026-08-29 08:42:40.901
89b1d450-f261-4044-a350-1e3388daff6b	SYSTEM	Có người vừa thả tim bài viết của bạn	Hồ Đức đã thích bài viết của bạn.	\N	\N	{"action": "LIKE", "postId": "b38a60cf-a061-48a9-8242-3a61db3e6470"}	2026-08-29 08:42:46.791
bffbb772-0858-47c8-9fa0-13f833381f54	SYSTEM	Có người vừa thả tim bài viết của bạn	Admin đã thích bài viết của bạn.	\N	\N	{"action": "LIKE", "postId": "b38a60cf-a061-48a9-8242-3a61db3e6470"}	2026-08-29 08:43:03.784
9a6db4c6-3c0b-4011-a45e-6acf204ca32e	CHAT_MESSAGE	Tin nhắn mới từ Cường Test 1 (Nhóm: Nhóm DEV)	[Nhãn dán]	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "a2a1a90e-0779-4239-8763-678fc797f00e"}	2026-08-29 08:43:08.74
dd4bcb7f-12dc-49c7-ade5-02ba69eae32c	SYSTEM	Bình luận mới về bài viết của bạn	Lê văn hà đã bình luận: "10k ít quá thêm 100k đi"	\N	\N	{"action": "COMMENT", "postId": "b38a60cf-a061-48a9-8242-3a61db3e6470"}	2026-08-29 08:43:34.146
a806257c-53ce-4be4-a8bd-b3501157c897	SYSTEM	Bình luận mới về bài viết của bạn	Hồ Đức đã bình luận: "."	\N	\N	{"action": "COMMENT", "postId": "b38a60cf-a061-48a9-8242-3a61db3e6470"}	2026-08-29 08:43:16.645
2c9ff59a-7397-4118-8f68-b65dcccaf8d2	CHAT_MESSAGE	Tin nhắn mới từ Admin	📞 Cuộc gọi thoại (00:07)	\N	\N	{"groupId": "b41b7beb-4dad-40b9-878e-52c57ce54908", "messageId": "90b9bc24-5b49-4d02-a1bd-9af061d4f488"}	2026-08-29 08:43:51.85
03f25f55-e28a-4f52-9fdc-b3d7307e0362	CHAT_MESSAGE	Tin nhắn mới từ Admin	Hello	\N	\N	{"groupId": "b41b7beb-4dad-40b9-878e-52c57ce54908", "messageId": "9a51c8a9-7f0a-45c3-a18d-1b4fec509077"}	2026-08-29 08:44:25.327
67100b6f-4b92-4789-8bea-15910f0cb44d	NEWSFEED_POST_PENDING	Bài đăng mới cần duyệt	Cường Test 1 vừa đăng một bài viết mới trong phòng ban.	\N	\N	{"postId": "aa92cbda-a396-4c36-850a-975c6e733e5b"}	2026-08-29 08:44:37.101
73a223bd-663f-427a-ab05-82e00838e088	CHAT_MESSAGE	Tin nhắn mới từ Admin	📞 Cuộc gọi thoại nhỡ	\N	\N	{"groupId": "5320a19b-fe16-42ba-8a0a-f58807d15af7", "messageId": "9bad071d-d06a-4500-bc02-209fc6ee248b"}	2026-08-29 08:45:04.998
0e7da5eb-358d-4529-832f-e2dba068391a	TASK_UPDATED	Công việc đã được duyệt	Công việc "App Giao diện cho máy chiếu" của bạn đã được duyệt.	1b33570d-7112-41ea-9af8-f1292569a577	\N	\N	2026-08-29 09:18:03.555
7dd81eb6-33cb-4673-ad29-eb2feff61abb	CHAT_MESSAGE	Tin nhắn mới từ Cường Test 1 (Nhóm: Nhóm DEV)	Dự kiến bao giờ update và fix lỗi xong @Đinh Văn Học	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "d06dd12b-f49f-4e02-b10a-79ee8bb4dd30"}	2026-08-30 10:06:59.719
17828a99-e8ba-4eb8-b15a-793e2d2dc970	TASK_ASSIGNED	New task assigned	phân tích và hoàn thiện demo giao diện web	733b777b-bbd6-4e8b-92c1-1cb8075031e1	\N	\N	2026-09-03 04:12:03.639
d34b450e-eca2-4a32-b426-d309f40665c7	TASK_ASSIGNED	New task assigned	hoàn thiện chức năng quản lý seri và kích hoạt bảo hành của khách hàng	ba60cab8-23cd-4079-95e6-af3ce9b684e7	\N	\N	2026-09-03 04:12:54.067
ee798423-06ee-44c0-a90c-f372ba0804a0	TASK_UPDATED	Công việc đã được duyệt	Công việc "thực hiện là gắn api vào app giao diện" của bạn đã được duyệt.	6a93af02-a691-4a49-a78c-e86c59add3c4	\N	\N	2026-09-03 09:12:22.523
448147e4-4ba0-471a-a2e5-6ebbc848f861	TASK_REVIEW_REQUESTED	Công việc cần duyệt/đã hoàn thành	Nhân viên Đoàn Nam Dương đã nộp công việc: hoàn thiện chức năng quản lý seri và kích hoạt bảo hành của khách hàng	ba60cab8-23cd-4079-95e6-af3ce9b684e7	\N	{"taskId": "ba60cab8-23cd-4079-95e6-af3ce9b684e7"}	2026-09-03 13:58:02.792
bc171f41-f076-404e-9bfa-8424aca1bc5d	TASK_UPDATED	Yêu cầu gia hạn công việc mới	Đoàn Nam Dương đã xin gia hạn công việc "hoàn thiện chức năng quản lý seri và kích hoạt bảo hành của khách hàng". Lý do: xin em thêm	ba60cab8-23cd-4079-95e6-af3ce9b684e7	\N	{"taskId": "ba60cab8-23cd-4079-95e6-af3ce9b684e7", "extensionRequestId": "31a39226-6b00-4ce3-8afb-616942543ecc"}	2026-09-04 01:09:54.849
69c52c48-331f-4425-a24c-317a6cc59a59	TASK_UPDATED	Yêu cầu gia hạn công việc mới	Phùng Thanh Bình đã xin gia hạn công việc "phân tích và hoàn thiện demo giao diện web". Lý do: cần tìm hiểu UI các web và animation chi tiết nếu cần thiết có thể cả video	733b777b-bbd6-4e8b-92c1-1cb8075031e1	\N	{"taskId": "733b777b-bbd6-4e8b-92c1-1cb8075031e1", "extensionRequestId": "da919e5c-1164-47ec-92af-8f31d28a9f4a"}	2026-09-04 01:10:56.366
653a95c8-3d5f-4c42-a72b-9afc682b6c96	TASK_UPDATED	Yêu cầu gia hạn được phê duyệt	Yêu cầu gia hạn công việc "phân tích và hoàn thiện demo giao diện web" của bạn đã được chấp nhận.	733b777b-bbd6-4e8b-92c1-1cb8075031e1	\N	{"taskId": "733b777b-bbd6-4e8b-92c1-1cb8075031e1", "extensionRequestId": "da919e5c-1164-47ec-92af-8f31d28a9f4a"}	2026-09-04 02:26:26.002
b62e6d9d-626b-4f9d-8900-373029ccf0d2	CHAT_MESSAGE	Tin nhắn mới từ Admin (Nhóm: Nhóm DEV)	[Tệp tin đính kèm]	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "a5866224-5e58-42d9-a926-00fbc58fe3e9"}	2026-09-04 03:21:56.63
a53b37bd-2dc6-4c52-845b-2dbc24b0cef4	SYSTEM	Có người vừa thả tim bài viết của bạn	Đinh Văn Học đã thích bài viết của bạn.	\N	\N	{"action": "LIKE", "postId": "b38a60cf-a061-48a9-8242-3a61db3e6470"}	2026-09-04 07:19:29.993
dbf4791a-76b2-41aa-b33a-f2d859996fcc	SYSTEM	Trao thưởng Đặc quyền Ví Tết 🧧	Ban Giám Đốc vừa trao tặng bạn 50.000 điểm thưởng Ví Tết (~50.000.000 VNĐ)!	\N	\N	\N	2026-09-05 03:17:38.516
5b567612-a27b-4e04-94ea-ff2284dac672	SYSTEM	Thưởng dự án Tích lũy 📈	Bạn vừa được thưởng dự án 20.000 điểm (~20.000.000 VNĐ) từ "Thưởng dự án cộng dồn quý", phân bổ đều vào các quý còn lại trong năm!	\N	\N	\N	2026-09-05 03:17:50.934
792a7c1b-22f5-4129-bb57-7eea42579a4b	SYSTEM	Trao thưởng Đặc quyền Ví Tết 🧧	Ban Giám Đốc vừa trao tặng bạn 10.000 điểm thưởng Ví Tết (~10.000.000 VNĐ)!	\N	\N	\N	2026-09-05 03:20:38.856
c463ccf1-c3c4-46ae-8cdd-b71b4aad60b6	ACCOUNT_APPROVAL_REQUESTED	Yêu cầu đăng ký tài khoản mới	Nhân viên NGUYỄN DUY PHONG (SĐT: 0389548398) vừa gửi yêu cầu tạo tài khoản mới. Vui lòng kiểm tra và xét duyệt.	\N	\N	{"approvalRequestId": "7bf38d36-61e9-4d73-a7a1-83b6b8c93169"}	2026-09-05 07:39:54.252
7d74843b-a185-4927-9218-612d1125d7cf	ACCOUNT_APPROVAL_REQUESTED	Yêu cầu đăng ký tài khoản mới	Nhân viên Nguyễn Thị Ngà (SĐT: 0961980290) vừa gửi yêu cầu tạo tài khoản mới. Vui lòng kiểm tra và xét duyệt.	\N	\N	{"approvalRequestId": "91555730-197b-4034-8023-876241f2ed5a"}	2026-09-05 08:47:56.115
78ad60c4-26e1-4668-afd8-0023b04c6ab2	SYSTEM	Trao thưởng Đặc quyền Ví Tết 🧧	Ban Giám Đốc vừa trao tặng bạn 20.000 điểm thưởng Ví Tết (~20.000.000 VNĐ)!	\N	\N	\N	2026-09-05 10:15:40.784
6b8c086c-4eec-424c-b32f-00641fd7e180	SYSTEM	Trao gói thưởng: Thưởng Dự án 🎁	Bạn vừa được trao gói thưởng "Thưởng Dự án" với 20.000 điểm (~20.000.000 VNĐ), chia thành 4 đợt rút trong 12 tháng!	\N	\N	\N	2026-09-05 10:45:50.564
4653ad1a-f410-466a-90be-2c5e303a5695	SYSTEM	Trao gói thưởng: Thưởng Dự án 🎁	Bạn vừa được trao gói thưởng "Thưởng Dự án" với 50.000 điểm (~50.000.000 VNĐ), chia thành 8 đợt rút trong 24 tháng!	\N	\N	\N	2026-09-05 11:25:29.168
8514dd6f-2028-4a90-bf85-a75267dc2774	SYSTEM	Trao gói thưởng: Thưởng Dự án 🎁	Bạn vừa được trao gói thưởng "Thưởng Dự án" với 10.000 điểm (~10.000.000 VNĐ), chia thành 6 đợt rút trong 12 tháng!	\N	\N	\N	2026-09-05 11:26:04.748
65de5f4a-c1ea-419d-b290-2d6733f879c8	CHAT_MESSAGE	Tin nhắn mới từ Đinh Văn Học (Nhóm: Nhóm DEV)	[Hình ảnh]	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "deb29973-db8b-4a87-9f98-a1536199efbc"}	2026-09-06 06:31:51.68
dcf39b97-85f2-4c2d-8df6-ee44452f5971	CHAT_MESSAGE	Tin nhắn mới từ Phùng Thanh Bình (Nhóm: Nhóm DEV)	Bộ đếm h sao nó hồng hồng thí a	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "983b92b7-8907-444f-8938-a68fcfe37e2c"}	2026-09-06 06:32:46.126
0f364069-d542-499f-a5be-b5ed4ce72da3	CHAT_MESSAGE	Tin nhắn mới từ Đinh Văn Học (Nhóm: Nhóm DEV)	Cho nó nổi á	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "a7bf3d79-d47d-459d-a68e-598e789b6fea"}	2026-09-06 06:36:45.392
d154998c-ac1d-4315-89a7-499fb526f269	CHAT_MESSAGE	Tin nhắn mới từ Đinh Văn Học (Nhóm: Nhóm DEV)	Hahaa	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "f62456a3-cd4a-4bf0-9764-92d599685ac1"}	2026-09-06 06:36:49.454
d2492f80-a0bc-4066-ba2c-d3fa6fdc9ba2	CHAT_MESSAGE	Tin nhắn mới từ Đinh Văn Học (Nhóm: Nhóm DEV)	[Hình ảnh]	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "4033bdfb-d097-4a5e-b02e-2df768fcf25c"}	2026-09-06 06:39:24.089
abea9818-d1dc-4f1f-b961-249129f72554	CHAT_MESSAGE	Tin nhắn mới từ Đinh Văn Học (Nhóm: Nhóm DEV)	Đây nó như này	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "9085f4f9-9397-47cd-8aeb-e97da9c6fe56"}	2026-09-06 06:39:26.644
75b89d2e-2453-4859-8cb8-5d9bfc6b52d3	CHAT_MESSAGE	Tin nhắn mới từ Phùng Thanh Bình (Nhóm: Nhóm DEV)	Sao cục vân nó khác khác thế a	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "3e7212dc-23e8-4fa3-98f0-04d13ee4b503"}	2026-09-06 06:43:57.771
25082c70-4048-4235-9643-43f56e7e6b09	CHAT_MESSAGE	Tin nhắn mới từ Đinh Văn Học (Nhóm: Nhóm DEV)	Nó cũm hơn hơu ảo	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "6bcaad44-4f10-4c4e-b2ff-90621610b67b"}	2026-09-06 07:26:37.668
41a39099-85ee-41b5-9d50-6a096665e172	CHAT_MESSAGE	Tin nhắn mới từ Đinh Văn Học (Nhóm: Nhóm DEV)	Nhưng khum sao	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "2b09ad74-6f00-4437-933b-89895c08b139"}	2026-09-06 07:26:52.499
60ca619e-c9af-48a0-9e49-05d109c8e1c2	SYSTEM	Yêu cầu rút Ví Thưởng mới ⏳	Nhân viên Đinh Văn Học vừa gửi yêu cầu rút 10.000 điểm (~10.000.000 VNĐ). Vui lòng phê duyệt.	\N	\N	\N	2026-09-06 07:56:58.226
2873bac6-89b9-43e4-8008-b52a10bcd9f1	SYSTEM	Yêu cầu rút điểm Ví Tết đã được gửi 💸	Bạn đã gửi yêu cầu rút 10.000 điểm (~10.000.000 VNĐ) về tài khoản undefined. Yêu cầu đang được chuyển đến Ban Giám Đốc để phê duyệt.	\N	\N	\N	2026-09-06 07:56:58.63
e6138958-5cff-42fe-bb24-453313f8b07c	SYSTEM	Yêu cầu rút Ví Thưởng mới ⏳	Nhân viên Đinh Văn Học vừa gửi yêu cầu rút 50.000 điểm (~50.000.000 VNĐ). Vui lòng phê duyệt.	\N	\N	\N	2026-09-06 07:59:39.191
59261b15-950f-42be-9505-b5ad0db0b21b	SYSTEM	Yêu cầu rút điểm Ví Tết đã được gửi 💸	Bạn đã gửi yêu cầu rút 50.000 điểm (~50.000.000 VNĐ) về tài khoản undefined. Yêu cầu đang được chuyển đến Ban Giám Đốc để phê duyệt.	\N	\N	\N	2026-09-06 07:59:39.584
1f0c8f41-df6e-4b85-b017-fe35dc9a3544	SYSTEM	Trao gói thưởng: Thưởng Dự án 🎁	Bạn vừa được trao gói thưởng "Thưởng Dự án" với 10.000 điểm (~10.000.000 VNĐ), chia thành 6 đợt rút trong 12 tháng!	\N	\N	\N	2026-09-06 08:42:25.28
cde2cedc-c7e8-4c21-8bc6-3b023d321e7e	ACCOUNT_APPROVAL_REQUESTED	Yêu cầu đăng ký tài khoản mới	Nhân viên Đinh Ngọc Tiến (SĐT: 0584286688) vừa gửi yêu cầu tạo tài khoản mới. Vui lòng kiểm tra và xét duyệt.	\N	\N	{"approvalRequestId": "bbf4a8f4-2257-4077-a346-4e33b0b90e86"}	2026-09-06 09:15:22.365
226e0435-740e-423c-9305-ccc46dd276ed	SYSTEM	Bổ nhiệm quản lý	Bạn vừa được bổ nhiệm làm Trưởng phòng Nhân sự và tự động cấp quyền Quản trị HR toàn công ty.	\N	\N	\N	2026-09-06 09:16:04.876
171d326a-f786-4aa2-a427-5c9d1160d433	SYSTEM	Yêu cầu rút Ví Thưởng mới ⏳	Nhân viên Đinh Văn Học vừa gửi yêu cầu rút 10.000 điểm (~10.000.000 VNĐ). Vui lòng phê duyệt.	\N	\N	\N	2026-09-06 10:53:23.999
cdf229f0-65e5-45e7-9552-c8a00234c139	SYSTEM	Yêu cầu rút điểm Ví Tết đã được gửi 💸	Bạn đã gửi yêu cầu rút 10.000 điểm (~10.000.000 VNĐ) về tài khoản undefined. Yêu cầu đang được chuyển đến Ban Giám Đốc để phê duyệt.	\N	\N	\N	2026-09-06 10:53:24.499
6ca3de38-a4a3-4e4b-abac-ea9709dc76b1	ACCOUNT_APPROVAL_REQUESTED	Yêu cầu đăng ký tài khoản mới	Nhân viên Đinh Văn Thái (SĐT: 0359466666) vừa gửi yêu cầu tạo tài khoản mới. Vui lòng kiểm tra và xét duyệt.	\N	\N	{"approvalRequestId": "38c94859-891c-4f1b-b0eb-21f9c5dad3e8"}	2026-09-06 11:25:25.257
e5f8db5c-ed32-4a7a-9335-fec282aaf0ac	SYSTEM	Bổ nhiệm quản lý	Bạn vừa được bổ nhiệm làm quản lý chi nhánh/phòng ban Kế Toán.	\N	\N	\N	2026-09-06 11:32:58.082
ca07801a-f41a-44a7-9b25-a7bab11fa95b	SYSTEM	Có góp ý mới từ nhân viên	Tiêu đề: Ứng lươngggg	\N	\N	{"feedbackId": "e7e5d299-5880-40d8-8b84-14a79bc5bc8e"}	2026-09-07 08:28:08.998
9874ebb3-f6ef-4d28-86f1-652a7b0730e6	CHAT_MESSAGE	Tin nhắn mới từ Đoàn Nam Dương (Nhóm: Nhóm DEV)	[Tệp tin đính kèm]	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "b83afb2c-daf8-4fe9-a3ea-b70101943278"}	2026-09-07 08:29:10.845
f7f86a78-b866-4423-ab11-2d2ca479669c	SYSTEM	Yêu cầu mới	Nhân viên Đoàn Nam Dương vừa gửi yêu cầu: Tạm ứng - 5.000.001 VNĐ	\N	\N	{"requestId": "67f62e57-57ce-405b-b47a-de121ffaea8d"}	2026-09-07 09:12:04.376
64e5b84d-cd4f-4fa8-8ce9-d764a08c8880	SYSTEM	Yêu cầu đã được duyệt	Yêu cầu "Tạm ứng - 5.000.001 VNĐ" của bạn đã được duyệt.	\N	\N	{"requestId": "67f62e57-57ce-405b-b47a-de121ffaea8d"}	2026-09-07 09:12:16.994
d079a338-f5b5-4036-b299-47b06db5780e	SYSTEM	Đơn ứng lương mới	Đoàn Nam Dương vừa gửi yêu cầu: Tạm ứng - 5.000.001 VNĐ	\N	\N	{"requestId": "bca89d47-959a-454c-ae10-d6e32a3f4584"}	2026-09-07 09:24:54.526
50e11353-431e-43ac-8eb7-77418d93941a	SYSTEM	Đơn cần đối chứng (HR)	Leader đã duyệt đơn "Tạm ứng - 5.000.001 VNĐ". Vui lòng đối chứng hồ sơ.	\N	\N	{"requestId": "bca89d47-959a-454c-ae10-d6e32a3f4584"}	2026-09-07 09:25:28.483
c19a5b21-509d-41b7-b452-59dddd3f0600	SYSTEM	Đơn trên 5 triệu cần duyệt (Admin)	HR đã đối chứng đơn "Tạm ứng - 5.000.001 VNĐ" (5.000.001 VNĐ). Vui lòng phê duyệt.	\N	\N	{"requestId": "bca89d47-959a-454c-ae10-d6e32a3f4584"}	2026-09-07 09:26:20.362
d29ba1a3-5dea-4c05-9bc5-764795cd475e	SYSTEM	Đơn đã duyệt - Chờ giải ngân	Admin đã duyệt đơn "Tạm ứng - 5.000.001 VNĐ" (5.000.001 VNĐ). Vui lòng thực hiện giải ngân.	\N	\N	{"requestId": "bca89d47-959a-454c-ae10-d6e32a3f4584"}	2026-09-07 09:26:49.071
e1aba79b-e9e2-44a1-9ddb-4ddc53b19c4c	SYSTEM	Đã giải ngân thành công 💸	Đơn "Tạm ứng - 5.000.001 VNĐ" (5.000.001 VNĐ) của bạn đã được Kế toán giải ngân thành công.	\N	\N	{"requestId": "bca89d47-959a-454c-ae10-d6e32a3f4584", "disbursementProofUrl": "https://res.cloudinary.com/dqxsqiglg/image/upload/v1788773870/hrm/employee_document/2026-09-07/0fdd360b-967e-4978-8634-1b86bcace27e.jpg"}	2026-09-07 09:37:52.054
ed3c36b9-1560-428a-b6c9-51c0eeb9b927	SYSTEM	Trao gói thưởng: Thưởng Tết 2026 🎁	Bạn vừa được trao gói thưởng "Thưởng Tết 2026" với 50.000 điểm (~50.000.000 VNĐ), chia thành 4 đợt rút trong 12 tháng!	\N	\N	\N	2026-09-08 07:46:45.044
6f846fa2-215c-4970-9543-8603e3314052	SYSTEM	Trao gói thưởng: Thưởng Tết 2026 🎁	Bạn vừa được trao gói thưởng "Thưởng Tết 2026" với 10.000 điểm (~10.000.000 VNĐ), chia thành 4 đợt rút trong 12 tháng!	\N	\N	\N	2026-09-08 10:01:07.48
b571a06c-be6c-40bb-bcba-7b5ed18c402c	SYSTEM	Trao gói thưởng: Thưởng Cuối Năm 2026 🎁	Bạn vừa được trao gói thưởng "Thưởng Cuối Năm 2026" với 10.000 điểm (~10.000.000 VNĐ), chia thành 4 đợt rút trong 12 tháng!	\N	\N	\N	2026-09-08 12:10:25.993
80950a3f-8db7-47f1-972d-d4ff3318931b	SYSTEM	Dự án cấp bậc mới được cập nhật 🏆	Ban Giám Đốc đã cập nhật cấu hình dự án và danh mục công việc cho phòng DEV.	\N	\N	{"type": "LEVEL_CONFIG_UPDATED", "departmentId": "63ab8aa8-c030-45c0-bec0-aa438fb5c2aa", "departmentName": "DEV"}	2026-09-09 02:40:15.205
aae37d11-1ad1-41c5-a9f4-44941c5bd266	SYSTEM	Giao việc dự án mới 📋	Bạn vừa được giao đầu việc "Alo" thuộc Dự án nâng cấp sản phẩm.	\N	\N	{"type": "LEVEL_PROJECT_ASSIGNED", "subTaskId": "st_1_1", "levelNumber": 1, "departmentId": "63ab8aa8-c030-45c0-bec0-aa438fb5c2aa", "departmentName": "DEV"}	2026-09-09 02:41:29.384
1e66e0f1-6cba-4595-80b9-9d1789e20d2f	SYSTEM	Giao việc dự án mới 📋	Bạn vừa được giao đầu việc "Alo" thuộc Dự án nâng cấp sản phẩm.	\N	\N	{"type": "LEVEL_PROJECT_ASSIGNED", "subTaskId": "st_1_2", "levelNumber": 1, "departmentId": "63ab8aa8-c030-45c0-bec0-aa438fb5c2aa", "departmentName": "DEV"}	2026-09-09 02:41:33.679
3d608b62-c261-47ad-aaf1-7f62feed3d8c	SYSTEM	Giao việc dự án mới 📋	Bạn vừa được giao đầu việc "Alo" thuộc Dự án nâng cấp sản phẩm.	\N	\N	{"type": "LEVEL_PROJECT_ASSIGNED", "subTaskId": "st_1_3", "levelNumber": 1, "departmentId": "63ab8aa8-c030-45c0-bec0-aa438fb5c2aa", "departmentName": "DEV"}	2026-09-09 02:41:42.548
c3b27657-32b6-46fe-a21e-8819a9c21388	SYSTEM	Nhân sự nộp báo cáo dự án 📑	Đinh Văn Học đã nộp báo cáo việc con "Alo" (Dự án nâng cấp sản phẩm).	\N	\N	{"type": "LEVEL_PROJECT_SUBMITTED", "subTaskId": "st_1_1", "levelNumber": 1, "departmentId": "63ab8aa8-c030-45c0-bec0-aa438fb5c2aa", "departmentName": "DEV"}	2026-09-09 02:42:18.746
8ed308fe-c321-4d5b-bd6d-90c1c934ebbc	SYSTEM	Nhân sự nộp báo cáo dự án 📑	Đinh Văn Học đã nộp báo cáo việc con "Alo" (Dự án nâng cấp sản phẩm).	\N	\N	{"type": "LEVEL_PROJECT_SUBMITTED", "subTaskId": "st_1_2", "levelNumber": 1, "departmentId": "63ab8aa8-c030-45c0-bec0-aa438fb5c2aa", "departmentName": "DEV"}	2026-09-09 02:42:33.035
e1b0d87e-3fad-43e2-984a-2fb718838999	SYSTEM	Nhân sự nộp báo cáo dự án 📑	Đoàn Nam Dương đã nộp báo cáo việc con "Alo" (Dự án nâng cấp sản phẩm).	\N	\N	{"type": "LEVEL_PROJECT_SUBMITTED", "subTaskId": "st_1_3", "levelNumber": 1, "departmentId": "63ab8aa8-c030-45c0-bec0-aa438fb5c2aa", "departmentName": "DEV"}	2026-09-09 02:43:35.85
7528f5ea-e2db-4623-b283-359a81bffe5f	SYSTEM	Dự án cấp bậc mới được cập nhật 🏆	Ban Giám Đốc đã cập nhật cấu hình dự án và danh mục công việc cho phòng DEV.	\N	\N	{"type": "LEVEL_CONFIG_UPDATED", "departmentId": "63ab8aa8-c030-45c0-bec0-aa438fb5c2aa", "departmentName": "DEV"}	2026-09-09 03:21:03.98
11b3f540-f823-4504-8973-4b6329933f96	SYSTEM	Giao việc dự án mới 📋	Bạn vừa được giao đầu việc "Alo" thuộc Dự án 1.	\N	\N	{"type": "LEVEL_PROJECT_ASSIGNED", "subTaskId": "st_1_1", "levelNumber": 1, "departmentId": "63ab8aa8-c030-45c0-bec0-aa438fb5c2aa", "departmentName": "DEV"}	2026-09-09 03:22:15.252
8524b96b-d517-4bb6-9a83-e80d50e5961f	SYSTEM	Giao việc dự án mới 📋	Bạn vừa được giao đầu việc "Alo" thuộc Dự án 1.	\N	\N	{"type": "LEVEL_PROJECT_ASSIGNED", "subTaskId": "st_1_2", "levelNumber": 1, "departmentId": "63ab8aa8-c030-45c0-bec0-aa438fb5c2aa", "departmentName": "DEV"}	2026-09-09 03:22:22.457
08b5a31e-7bf6-446e-b558-31b500226f6b	SYSTEM	Nhân sự nộp báo cáo dự án 📑	Đinh Văn Học đã nộp báo cáo việc con "Alo" (Dự án 1).	\N	\N	{"type": "LEVEL_PROJECT_SUBMITTED", "subTaskId": "st_1_1", "levelNumber": 1, "departmentId": "63ab8aa8-c030-45c0-bec0-aa438fb5c2aa", "departmentName": "DEV"}	2026-09-09 03:22:31.248
601bed66-401d-4c4f-a4ff-8e0ea46720d4	SYSTEM	Nhân sự nộp báo cáo dự án 📑	Đinh Văn Học đã nộp báo cáo việc con "Alo" (Dự án 1).	\N	\N	{"type": "LEVEL_PROJECT_SUBMITTED", "subTaskId": "st_1_1", "levelNumber": 1, "departmentId": "63ab8aa8-c030-45c0-bec0-aa438fb5c2aa", "departmentName": "DEV"}	2026-09-09 03:22:35.457
3b5022b5-cc97-4821-853b-c837bc0ce7d4	SYSTEM	Nhân sự nộp báo cáo dự án 📑	Đoàn Nam Dương đã nộp báo cáo việc con "Alo" (Dự án 1).	\N	\N	{"type": "LEVEL_PROJECT_SUBMITTED", "subTaskId": "st_1_2", "levelNumber": 1, "departmentId": "63ab8aa8-c030-45c0-bec0-aa438fb5c2aa", "departmentName": "DEV"}	2026-09-09 03:23:31.562
68bdc058-091d-453e-aff6-6a38c6a77de3	SYSTEM	Duyệt hoàn thành việc con 🎉	Leader Leader đã duyệt Vòng 1 việc con "Alo" (Dự án 1).	\N	\N	{"type": "LEVEL_PROJECT_APPROVED", "subTaskId": "st_1_2", "levelNumber": 1, "departmentId": "63ab8aa8-c030-45c0-bec0-aa438fb5c2aa", "departmentName": "DEV"}	2026-09-09 03:24:07.859
784ad660-7831-4e58-8682-9edd30f889d6	SYSTEM	Nghiệm thu dự án cấp bậc 📑	Trưởng bộ phận phòng DEV đã nộp báo cáo nghiệm thu dự án "Dự án 1". Vui lòng kiểm tra và phê duyệt!	\N	\N	{"type": "LEVEL_PROJECT_SUBMITTED_TO_ADMIN", "levelNumber": 1, "departmentId": "63ab8aa8-c030-45c0-bec0-aa438fb5c2aa", "departmentName": "DEV"}	2026-09-09 03:24:29.368
b4aad350-ec01-4690-b919-a419dd3f97cc	SYSTEM	Nghiệm thu dự án thành công 🏆🎉	Ban Giám Đốc (Ban Giám Đốc) đã chính thức phê duyệt nghiệm thu dự án "Dự án 1" cho phòng DEV!	\N	\N	{"type": "LEVEL_PROJECT_ADMIN_APPROVED", "levelNumber": 1, "departmentId": "63ab8aa8-c030-45c0-bec0-aa438fb5c2aa", "departmentName": "DEV"}	2026-09-09 03:24:58.279
59978d9a-51f6-496f-89d4-13c1ffaaa712	SYSTEM	Nghiệm thu dự án thành công 🏆🎉	Ban Giám Đốc (Ban Giám Đốc) đã chính thức phê duyệt nghiệm thu dự án "Dự án 1" cho phòng DEV!	\N	\N	{"type": "LEVEL_PROJECT_ADMIN_APPROVED", "levelNumber": 1, "departmentId": "63ab8aa8-c030-45c0-bec0-aa438fb5c2aa", "departmentName": "DEV"}	2026-09-09 03:51:44.912
21501813-cfea-478f-b38f-98247eda0ac3	SYSTEM	Nghiệm thu dự án thành công 🏆🎉	Ban Giám Đốc (Ban Giám Đốc) đã chính thức phê duyệt nghiệm thu dự án "Dự án 1" cho phòng DEV!	\N	\N	{"type": "LEVEL_PROJECT_ADMIN_APPROVED", "levelNumber": 1, "departmentId": "63ab8aa8-c030-45c0-bec0-aa438fb5c2aa", "departmentName": "DEV"}	2026-09-09 03:52:03.092
4fe39037-03a4-4325-ac6a-a0d25945ded5	SYSTEM	Nghiệm thu dự án thành công 🏆🎉	Ban Giám Đốc (Ban Giám Đốc) đã chính thức phê duyệt nghiệm thu dự án "Dự án 1" cho phòng DEV!	\N	\N	{"type": "LEVEL_PROJECT_ADMIN_APPROVED", "levelNumber": 1, "departmentId": "63ab8aa8-c030-45c0-bec0-aa438fb5c2aa", "departmentName": "DEV"}	2026-09-09 03:55:10.027
ac4ee8b3-739f-4d2a-a2d5-49dc105b09fa	SYSTEM	Nghiệm thu dự án thành công 🏆🎉	Ban Giám Đốc (Ban Giám Đốc) đã chính thức phê duyệt nghiệm thu dự án "Dự án 1" cho phòng DEV!	\N	\N	{"type": "LEVEL_PROJECT_ADMIN_APPROVED", "levelNumber": 1, "departmentId": "63ab8aa8-c030-45c0-bec0-aa438fb5c2aa", "departmentName": "DEV"}	2026-09-09 03:55:28.564
2acdc5a8-1bbe-4509-872e-d04d35c507a0	SYSTEM	Phản hồi góp ý	Góp ý của bạn đã được chuyển sang trạng thái: RESOLVED.	\N	\N	{"feedbackId": "e7e5d299-5880-40d8-8b84-14a79bc5bc8e"}	2026-09-09 04:03:41.906
bbddaeb2-8b2d-4f55-a9a9-c812907f0b3c	SYSTEM	Trao gói thưởng: Thưởng Cuối Năm 2026 🎁	Bạn vừa được trao gói thưởng "Thưởng Cuối Năm 2026" với 10.000 điểm (~10.000.000 VNĐ), chia thành 12 đợt rút trong 12 tháng!	\N	\N	\N	2026-09-09 04:20:18.177
545be964-5288-42e1-8fda-7a2d66b2fb12	SYSTEM	Yêu cầu rút Ví Thưởng mới ⏳	Nhân viên Đinh Văn Học vừa gửi yêu cầu rút 833 điểm (~833.000 VNĐ). Vui lòng phê duyệt.	\N	\N	\N	2026-09-09 04:21:16.491
03903f78-6d29-404e-8182-28988c459574	SYSTEM	Yêu cầu rút điểm Ví Tết đã được gửi 💸	Bạn đã gửi yêu cầu rút 833 điểm (~833.000 VNĐ) về tài khoản undefined. Yêu cầu đang được chuyển đến Ban Giám Đốc để phê duyệt.	\N	\N	\N	2026-09-09 04:21:16.878
412a6ebd-2393-4aaf-aa68-60409dfd1ce7	SYSTEM	Lệnh chi tiền Ví Thưởng 💼	Admin đã phê duyệt yêu cầu rút tiền của Đinh Văn Học (~833.000 VNĐ). Vui lòng thực hiện chuyển khoản vào TK Quy đổi ngoài (Nội bộ) - N/A (ĐINH VĂN HỌC) và xác nhận.	\N	\N	\N	2026-09-09 04:22:06.713
a9a2f679-7351-4b4a-8908-20e869a1825f	SYSTEM	Yêu cầu rút tiền đã được Ban Giám Đốc duyệt ✅	Ban Giám Đốc đã phê duyệt yêu cầu rút 833.000 VNĐ của bạn. Yêu cầu đang được chuyển sang bộ phận Kế toán để thực hiện chi trả 💸.	\N	\N	\N	2026-09-09 04:22:07.23
5acdfa35-cfde-42d6-a464-9552a4743d86	SYSTEM	Tài liệu phòng ban mới	Phòng DEV vừa có tài liệu mới: "tai lieu mau".	\N	\N	{"screen": "DocumentList", "documentId": "63770387-32a5-48f3-9ab3-c9d0c663edfb", "departmentId": "63ab8aa8-c030-45c0-bec0-aa438fb5c2aa"}	2026-09-09 06:36:09.857
908be3fa-a9ba-413f-948b-d44fd6773291	SYSTEM	Chuyển tiền thưởng thành công	Bộ phận Kế toán đã hoàn tất chuyển 833.000 VNĐ về tài khoản Quy đổi ngoài (Nội bộ) (N/A - ĐINH VĂN HỌC). Vui lòng kiểm tra tài khoản ngân hàng!	\N	\N	\N	2026-09-09 07:35:33.367
593bed64-fd9e-4714-b91a-b444dcfcb4ec	SYSTEM	Tài liệu nội bộ mới	Tài liệu toàn công ty "Đề ôn tập Hệ quản trị CSDL 1 16 (1)" vừa được phát hành.	\N	\N	{"screen": "DocumentList", "documentId": "1a42c855-5a90-4d70-a637-9275b213deb8", "departmentId": null}	2026-09-09 08:03:17.993
fdab3cf6-cf3e-4f2d-8de7-4d928a895993	SYSTEM	Tài liệu nội bộ mới	Tài liệu toàn công ty "Đề ôn tập Hệ quản trị CSDL 1 16 (1)" vừa được phát hành.	\N	\N	{"screen": "DocumentList", "documentId": "7087f8c4-9852-42b0-8323-c670e40816ac", "departmentId": null}	2026-09-09 08:03:27.787
55be8ba5-d425-4821-bbea-c8011b614375	SYSTEM	Tài liệu nội bộ mới	Tài liệu toàn công ty "Đề ôn tập Hệ quản trị CSDL 1 16 (1)" vừa được phát hành.	\N	\N	{"screen": "DocumentList", "documentId": "f8134deb-cb36-4940-91a0-1141092a7b94", "departmentId": null}	2026-09-09 08:03:33.83
d625cc7e-63ca-47e6-904f-a0473ec78d18	SYSTEM	Tài liệu nội bộ mới	Tài liệu toàn công ty "Đề ôn tập Hệ quản trị CSDL 1 16 (1)" vừa được phát hành.	\N	\N	{"screen": "DocumentList", "documentId": "4623e310-0d55-4259-89cd-fee906e45f28", "departmentId": null}	2026-09-09 08:04:06.597
4186f6b9-f193-48c1-8ef9-77e69437a477	SYSTEM	Tài liệu nội bộ mới	Tài liệu toàn công ty "Đề ôn tập Hệ quản trị CSDL 1 16 (1)" vừa được phát hành.	\N	\N	{"screen": "DocumentList", "documentId": "cdb3d292-d090-4381-ac95-c196f7862511", "departmentId": null}	2026-09-09 08:04:10.844
fb2559de-4e7c-4b94-a615-8c2d7e435be6	SYSTEM	Tài liệu nội bộ mới	Tài liệu toàn công ty "Điện Toán Đám Mây" vừa được phát hành.	\N	\N	{"screen": "DocumentList", "documentId": "9d411539-1099-4854-b575-b66bf93bf528", "departmentId": null}	2026-09-09 08:05:53.711
6bcb9f28-4f2b-4e46-8c6a-bcc38bd81c61	SYSTEM	Tài liệu phòng ban mới	Phòng DEV vừa có tài liệu mới: "bang cham cong 2026 09 09".	\N	\N	{"screen": "DocumentList", "documentId": "34b0400b-cc5d-4340-a94e-7c72296279fd", "departmentId": "63ab8aa8-c030-45c0-bec0-aa438fb5c2aa"}	2026-09-09 08:06:16.499
38590739-2d87-4e8a-8d4d-a8c84a3c8b19	SYSTEM	Tài liệu phòng ban mới	Phòng DEV vừa có tài liệu mới: "tai lieu mau".	\N	\N	{"screen": "DocumentList", "documentId": "1414e16d-bfb9-4a03-b3ec-235875692f23", "departmentId": "63ab8aa8-c030-45c0-bec0-aa438fb5c2aa"}	2026-09-09 08:13:03.467
48b56abb-678f-493e-8325-8b93490088d8	SYSTEM	Tài liệu nội bộ mới	Tài liệu toàn công ty "Screenshot 2026 07 31 17 45 37 29 f73b71075b1de7323614b647fe394240" vừa được phát hành.	\N	\N	{"screen": "DocumentList", "documentId": "a8308339-43d7-4c56-97e4-3576675f3b43", "departmentId": null}	2026-09-09 08:21:24.752
4a852f49-25e1-4d8c-8df7-a21e9fe9f5d0	CHAT_MESSAGE	Tin nhắn mới từ Đinh Văn Học (Nhóm: Nhóm DEV)	Hi	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "6babddfa-1eb2-49f9-935f-61ca26eebcbb"}	2026-09-09 09:41:42.855
2e85bc08-99de-4809-a004-b611ce890b0b	CHAT_MESSAGE	Tin nhắn mới từ Đinh Văn Học (Nhóm: Nhóm DEV)	Hello	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "d3825ee5-ccee-4167-b624-3502b8e3ee48"}	2026-09-09 09:41:59.95
1784b288-6094-4d79-94d0-9ac9ba2bbedf	CHAT_MESSAGE	Tin nhắn mới từ Đinh Văn Học (Nhóm: Nhóm DEV)	[Hình ảnh]	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "a6034d65-160a-408d-8d9b-ea1bfcec1902"}	2026-09-09 09:42:21.814
a2270b9e-ff6c-402d-9325-c40e9c722833	CHAT_MESSAGE	Tin nhắn mới từ Cường Test 1 (Nhóm: Nhóm DEV)	Có bánh gì ăn à	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "56c75f04-ba1c-402d-889e-e5913e21dc93"}	2026-09-09 09:42:24.837
dc99fdba-a7c6-4cce-96f8-66df9336c1d2	CHAT_MESSAGE	Tin nhắn mới từ Cường Test 1 (Nhóm: Nhóm DEV)	Vẫn lag ae ơi	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "33c0305c-eedc-4c60-acb1-c40edafa3fcd"}	2026-09-09 09:42:32.338
467922fa-d36e-4093-87f8-997457716dd9	CHAT_MESSAGE	Tin nhắn mới từ Admin (Nhóm: Nhóm DEV)	Em đang test cái vps mới xem sao	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "77d57a1b-e355-4289-877e-7629071b293f"}	2026-09-09 09:43:48.368
164ee85f-915b-46a3-b824-4727a540a2f8	CHAT_MESSAGE	Tin nhắn mới từ Admin (Nhóm: Nhóm DEV)	Nó vẫn hơi chậm anh nhỉ	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "79bc04a8-1c4b-47ce-9655-51b71eaaaee1"}	2026-09-09 09:44:06.34
dd111423-4727-4f80-88f4-c6a78deaea82	CHAT_MESSAGE	Tin nhắn mới từ Admin (Nhóm: Nhóm DEV)	Em đang dc test cái vps mới	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "ec439dd4-9fdd-4871-817f-cd4b2b1ef44a"}	2026-09-09 09:47:18.616
7874e095-cc16-4a64-aba2-6293ef01607c	SYSTEM	Có người vừa thả tim bài viết của bạn	Đoàn Nam Dương đã thích bài viết của bạn.	\N	\N	{"action": "LIKE", "postId": "b38a60cf-a061-48a9-8242-3a61db3e6470"}	2026-09-09 09:49:39.695
b03abd7d-f1a1-4ffa-91d8-1dd955b6af0f	CHAT_MESSAGE	Tin nhắn mới từ Đoàn Nam Dương (Nhóm: Nhóm DEV)	Alo	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "ca402e6d-0196-4b76-96b7-8f9d1b716fc9"}	2026-09-09 09:49:58.637
f98ad09b-c081-470a-8645-13871070c39a	CHAT_MESSAGE	Tin nhắn mới từ Đoàn Nam Dương (Nhóm: Nhóm DEV)	Hello	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "6e4406ef-5f26-468b-baa3-692bec1ad4e8"}	2026-09-09 09:50:07.449
bb67ebac-40ab-4a04-b5cd-1480ab65c358	CHAT_MESSAGE	Tin nhắn mới từ Đoàn Nam Dương (Nhóm: Nhóm DEV)	Anh em thấy nhanh hơn ko	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "a20e37b2-fe6d-4f2e-94cf-5601aa7947c4"}	2026-09-09 09:50:11.078
82096f76-ddae-47a1-ad0b-97056a0ce26d	CHAT_MESSAGE	Tin nhắn mới từ Đoàn Nam Dương (Nhóm: Nhóm DEV)	Hello	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "3fb9fd62-e63a-4e17-a1f2-94bacabd3d09"}	2026-09-09 09:50:15.567
3b85c091-1612-4823-8051-55bf161bd674	CHAT_MESSAGE	Tin nhắn mới từ Đoàn Nam Dương (Nhóm: Nhóm DEV)	[Hình ảnh]	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "571eddec-bd44-4ef2-a156-2e2ef5923b15"}	2026-09-09 09:50:21.544
f76d1ccd-37ba-4713-b3dc-ee9fa305cf9b	CHAT_MESSAGE	Tin nhắn mới từ Đoàn Nam Dương (Nhóm: Nhóm DEV)	Alu	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "5f8413e6-2188-4fc0-ad06-0869c490eef9"}	2026-09-09 09:50:52.768
84c4ece4-e7b8-4d49-92aa-4ce9b4c0d540	CHAT_MESSAGE	Tin nhắn mới từ Đoàn Nam Dương (Nhóm: Nhóm DEV)	Alo	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "fcd079c9-8a3d-4255-b762-e4e701847d80"}	2026-09-09 09:51:13.311
9b173091-beae-4b37-b052-54783dc42247	CHAT_MESSAGE	Tin nhắn mới từ Đoàn Nam Dương (Nhóm: Nhóm DEV)	Alu	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "88151216-a004-4d9b-aa4a-7706ee1c6508"}	2026-09-09 09:51:25.536
b73df914-936a-4d07-bbbb-800a7354276a	CHAT_MESSAGE	Tin nhắn mới từ Phùng Thanh Bình (Nhóm: Nhóm DEV)	Bjg	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "a4ddb58a-a11b-456d-a881-76ebb13cb280"}	2026-09-09 09:51:28.562
f0e0bbeb-fc44-428d-9c49-5d303fd4d7ae	CHAT_MESSAGE	Tin nhắn mới từ Cường Test 1 (Nhóm: Nhóm DEV)	Anh thấy	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "008a419f-ab08-4bee-a304-3289db3502b6"}	2026-09-09 09:51:38.483
59065cf0-04b7-4b13-86ae-040056df5612	CHAT_MESSAGE	Tin nhắn mới từ Cường Test 1 (Nhóm: Nhóm DEV)	Mà vẫn lag	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "1c2a3d2c-6f83-4edc-bbb0-b0aa41c65f91"}	2026-09-09 09:51:41.65
96524952-ae4d-4b52-bea3-76980451081c	CHAT_MESSAGE	Tin nhắn mới từ Đoàn Nam Dương (Nhóm: Nhóm DEV)	Của anh bản cũ	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "3a7e85ee-1ee8-4a6e-947f-bdfe0001f6ff"}	2026-09-09 09:52:02.38
2186e87c-7382-4c39-9e3f-a6a4e32aff98	CHAT_MESSAGE	Tin nhắn mới từ Phùng Thanh Bình (Nhóm: Nhóm DEV)	Bjbub	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "e7079d62-1e5a-40d4-b779-c8cb3264bdb7"}	2026-09-09 09:52:20.061
0855325f-fbb8-4209-8d3b-afb21e12f0e2	CHAT_MESSAGE	Tin nhắn mới từ Cường Test 1 (Nhóm: Nhóm DEV)	À uh	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "db12d664-a039-4d63-acae-9f15bc24307b"}	2026-09-09 09:52:42.837
5b54e0b7-fb90-4a68-8263-e24fb5fa8b20	CHAT_MESSAGE	Tin nhắn mới từ Cường Test 1 (Nhóm: Nhóm DEV)	Gửi apk cho anh. Xíu anh test	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "566044b6-48e7-4e6a-b73e-35de39e2a441"}	2026-09-09 09:52:53.063
fe7443d5-2c4f-4e57-839e-02aed71b814d	CHAT_MESSAGE	Tin nhắn mới từ Đoàn Nam Dương (Nhóm: Nhóm DEV)	Alu mn	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "4ac42d5c-acc7-44b3-8066-08eb295fa870"}	2026-09-09 09:54:06.936
1da44f94-3e53-4759-be95-0a84b14fdc72	CHAT_MESSAGE	Tin nhắn mới từ Đoàn Nam Dương (Nhóm: Nhóm DEV)	Alu	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "856ea378-3287-4dbd-ad22-4a2c4a02c4ba"}	2026-09-09 09:54:30.558
c861adb9-7af3-46d5-9863-8e6905bd76de	CHAT_MESSAGE	Tin nhắn mới từ Đinh Văn Học (Nhóm: Nhóm DEV)	Test 1	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "1da68907-9629-4f20-a58a-d1f3a99e4b2b"}	2026-09-09 09:54:23.52
c5d48869-2cc1-4f3a-a8f0-1eb0eb27d41c	CHAT_MESSAGE	Tin nhắn mới từ Đinh Văn Học (Nhóm: Nhóm DEV)	Test 2	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "5c2e83d9-0478-4146-87a0-fe20537a3e27"}	2026-09-09 09:55:49.335
a65cd0da-d280-4cc0-91fa-b8375c6c9fef	CHAT_MESSAGE	Tin nhắn mới từ Cường Test 1 (Nhóm: Nhóm DEV)	Thêm cho anh cái tắt thông báo cho admin nhé	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "e0b2b834-352f-4ab4-8efd-466431aff0db"}	2026-09-09 09:56:17.616
3ce4c675-45a1-4753-b5cf-4ff0dab5ea1c	CHAT_MESSAGE	Tin nhắn mới từ Cường Test 1 (Nhóm: Nhóm DEV)	Nhưng @ thì vẫn nổi nên	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "275d55ed-614c-45f6-baa8-880038e57486"}	2026-09-09 09:56:25.392
29650f93-94bc-4162-ad99-e1b9920cb20b	CHAT_MESSAGE	Tin nhắn mới từ Admin (Nhóm: Nhóm DEV)	Test 4	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "fbc72689-4d92-4a72-9c5a-c9b432866741"}	2026-09-09 10:04:29.712
7f6536ec-75fb-4ac4-b59e-438e774bc8d3	CHAT_MESSAGE	Tin nhắn mới từ Đoàn Nam Dương (Nhóm: Nhóm DEV)	Helli	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "626f968e-7fe6-4520-8bda-4501faf7982b"}	2026-09-09 10:06:27.62
9fb8725c-887c-4b1c-b694-46fff7d6ecf9	CHAT_MESSAGE	Tin nhắn mới từ Đinh Văn Học (Nhóm: Nhóm DEV)	Hello	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "cd3c9888-6fa2-465d-bbfb-df040fcc24c6"}	2026-09-09 10:06:37.017
faed012d-8ea7-47d7-9e3d-52f1f6adf579	CHAT_MESSAGE	Tin nhắn mới từ Đoàn Nam Dương (Nhóm: Nhóm DEV)	Hello	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "423a808d-97b9-4c8c-8eb6-721d0f6c7304"}	2026-09-09 10:06:50.349
2eb35ab1-6305-4862-bd9b-314006a95fa3	CHAT_MESSAGE	Tin nhắn mới từ Đoàn Nam Dương (Nhóm: Nhóm DEV)	Hello	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "e7c3ae13-70e2-4a04-a226-5f753d8f26a3"}	2026-09-09 10:07:45.105
9b9368c9-8d2b-4117-9200-e772fa014b80	CHAT_MESSAGE	Tin nhắn mới từ Admin (Nhóm: Nhóm DEV)	Console Error Error rendering guide PDF: Error: Download status: 404 for https://movielegend-hrm-hfjo.onrender.com/uploads/employee_document/2026-09-09/63d4674d-2169-415f-908f-2d1b3edf1175.pdf Source: F:\\CODE\\Movie Legend\\movielegend-hrm\\movielegend-hrm-mobile\\src\\components\\UserGuideModal.tsx (170:0) Call Stack: setWarningHandler (F:\\CODE\\Movie Legend\\movielegend-hrm\\movielegend-hrm-mobile\\node_modules\\react-native\\Libraries\\Utilities\\RCTLog.js:52) parseGecko (F:\\CODE\\Movie Legend\\movielegend-hrm\\movielegend-hrm-mobile\\node_modules\\stacktrace-parser\\dist\\stack-trace-parser.cjs.js:89) renderElement (F:\\CODE\\Movie Legend\\movielegend-hrm\\movielegend-hrm-mobile\\node_modules\\react-native\\Libraries\\ReactNative\\RendererImplementation.js:36) anonymous (http://192.168.31.134:8081/node_modules/expo-router/entry.bundle?platform=android&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.bytecode=1&transform.routerRoot=app&unstable_transformProfile=hermes-stable) loadPdf (F:\\CODE\\Movie Legend\\movielegend-hrm\\movielegend-hrm-mobile\\src\\components\\UserGuideModal.tsx:170)	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "02d677a3-c77a-4ac4-824e-1463bafbae2a"}	2026-09-09 10:08:05.194
14841dac-3a57-48e2-9c95-ceb9d39b1dbc	CHAT_MESSAGE	Tin nhắn mới từ Admin	Cuộc gọi thoại nhỡ	\N	\N	{"groupId": "66a56333-980e-4439-9763-7588f3f4b52e", "messageId": "bea9f81f-05fb-4b89-b24b-5953f5a6728a"}	2026-09-09 10:13:43.757
7e175463-5116-4ad4-ac64-25b42e23852e	CHAT_MESSAGE	Tin nhắn mới từ Admin (Nhóm: Nhóm DEV)	test 5	\N	\N	{"groupId": "4a9cc108-beff-4c07-98da-78d36e2dfdf0", "messageId": "75c450bb-abcd-4742-9bfa-df5ad11d995e"}	2026-09-09 10:17:44.699
\.


--
-- Data for Name: overtime_rate_rules; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.overtime_rate_rules (id, "companyId", "departmentId", "overtimeType", multiplier, "effectiveFrom", "effectiveTo", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: overtime_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.overtime_requests (id, "userId", "departmentId", "workDate", "startAt", "endAt", reason, status, "decidedByUserId", "decidedAt", "rejectionReason", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: payroll_calculation_snapshots; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payroll_calculation_snapshots (id, "payrollId", "attendanceSummary", "leaveSummary", "overtimeSummary", "salaryProfileSnapshot", "componentSnapshot", "bonusSnapshot", "deductionSnapshot", "createdAt") FROM stdin;
\.


--
-- Data for Name: payroll_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payroll_items (id, "payrollId", "componentId", "itemCode", "itemName", "itemType", "sourceType", "sourceId", quantity, rate, amount, note, "createdAt") FROM stdin;
\.


--
-- Data for Name: payroll_periods; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payroll_periods (id, "periodCode", "companyId", month, year, "startDate", "endDate", status, "calculatedAt", "reviewedAt", "approvedAt", "lockedAt", "createdById", "reviewedById", "approvedById", "lockedById", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: payrolls; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payrolls (id, "payrollPeriodId", "userId", "salaryProfileId", "baseSalary", "standardWorkingDays", "actualWorkingDays", "paidLeaveDays", "unpaidLeaveDays", "regularWorkedMinutes", "overtimeMinutes", "overtimeAmount", "allowanceAmount", "bonusAmount", "deductionAmount", "insuranceAmount", "taxAmount", "grossSalary", "netSalary", "calculationVersion", "calculatedAt", status, "employeeAcknowledgedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: performance_review_cycles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.performance_review_cycles (id, "companyId", code, name, "periodStart", "periodEnd", "selfReviewStart", "selfReviewEnd", "leaderReviewStart", "leaderReviewEnd", "finalReviewStart", "finalReviewEnd", status, "createdById", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: performance_reviews; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.performance_reviews (id, "cycleId", "userId", "reviewerUserId", status, "selfSummary", "leaderSummary", "finalSummary", "selfScore", "leaderScore", "finalScore", "submittedAt", "reviewedAt", "finalizedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.permissions (id, code, name, description, "createdAt", "updatedAt") FROM stdin;
df0ee1dd-cb70-45c1-80ec-1ca6aff000f6	user.read	user.read	\N	2026-07-31 11:31:17.259	2026-07-31 11:31:17.259
7c1e0f23-7cee-4e5d-ab04-579dec088f7d	shift.update	shift.update	\N	2026-07-31 11:31:17.26	2026-07-31 11:31:17.26
e670154d-604d-46e3-becf-96a1c4206382	attendance.checkin	attendance.checkin	\N	2026-07-31 11:31:17.26	2026-07-31 11:31:17.26
1ec925bb-9664-47e3-9bf9-797dc85cfea5	shift.delete	shift.delete	\N	2026-07-31 11:31:17.26	2026-07-31 11:31:17.26
1699cbab-2137-4549-9521-19ea6b726963	attendance.adjust	attendance.adjust	\N	2026-07-31 11:31:17.26	2026-07-31 11:31:17.26
fce3bf11-8f91-4697-888b-d01080c724af	leave.balance.read	leave.balance.read	\N	2026-07-31 11:31:17.26	2026-07-31 11:31:17.26
e0d5a0c9-c953-4d63-8b26-a30bed6160ab	approval.approve	approval.approve	\N	2026-07-31 11:31:17.26	2026-07-31 11:31:17.26
740ae2d0-eb8a-4812-a6d8-2ba55b7ec11c	shift.assign	shift.assign	\N	2026-07-31 11:31:17.26	2026-07-31 11:31:17.26
fa823bbf-2fe8-4f94-a0df-4b55dd06172c	attendance.location.manage	attendance.location.manage	\N	2026-07-31 11:31:17.26	2026-07-31 11:31:17.26
56d5136a-543f-4c30-9d77-46b1fec2bde7	approval.reject	approval.reject	\N	2026-07-31 11:31:17.26	2026-07-31 11:31:17.26
d0510b35-8c22-422a-a258-a77c4b7d5642	leave.request	leave.request	\N	2026-07-31 11:31:17.26	2026-07-31 11:31:17.26
b936a83f-2ead-40b3-b745-d821f8cffb31	leave.approve	leave.approve	\N	2026-07-31 11:31:17.26	2026-07-31 11:31:17.26
e0bf3e87-cf53-4c7d-97d1-384f6aab92fc	face.read	face.read	\N	2026-07-31 11:31:17.26	2026-07-31 11:31:17.26
f47534b3-529c-4a64-8e7f-0f8770a329bc	leave.type.manage	leave.type.manage	\N	2026-07-31 11:31:17.26	2026-07-31 11:31:17.26
25e6a179-c13b-422d-8c2b-9cac647fdc28	upload.create	upload.create	\N	2026-07-31 11:31:17.26	2026-07-31 11:31:17.26
ca16fc48-ae77-42f6-b0b4-c1c17c98b2d1	overtime.request	overtime.request	\N	2026-07-31 11:31:17.26	2026-07-31 11:31:17.26
ff1f370e-fb6d-401c-8c38-99e0c58701fb	task.read_own	task.read_own	\N	2026-07-31 11:31:17.26	2026-07-31 11:31:17.26
683efa6d-0036-4cc0-a607-b7b0d6086a2d	employee.request	employee.request	\N	2026-07-31 11:31:17.26	2026-07-31 11:31:17.26
f942c793-cc0c-4c2c-be30-a064511b25a3	task.read_all	task.read_all	\N	2026-07-31 11:31:17.26	2026-07-31 11:31:17.26
cd40d61a-64e8-41ee-a756-74a6a380b261	overtime.approve	overtime.approve	\N	2026-07-31 11:31:17.26	2026-07-31 11:31:17.26
9464e130-e023-4d73-9c7a-143c32047ab4	task.assign_any	task.assign_any	\N	2026-07-31 11:31:17.26	2026-07-31 11:31:17.26
79fa8bc3-acc1-48b2-a582-16e4a417f2cd	task.review_all	task.review_all	\N	2026-07-31 11:31:17.261	2026-07-31 11:31:17.261
c80671ca-4776-40fa-9b90-e9cd1ce04f03	employee.request.approve	employee.request.approve	\N	2026-07-31 11:31:17.261	2026-07-31 11:31:17.261
0535f840-8910-437c-aebb-cf57339632d6	task.read_department	task.read_department	\N	2026-07-31 11:31:17.261	2026-07-31 11:31:17.261
86881426-4689-470f-8cb7-fab86d542288	task.review_department	task.review_department	\N	2026-07-31 11:31:17.261	2026-07-31 11:31:17.261
d007fd2c-3494-4b9f-b25a-26fa7bcbd036	task.assign_department	task.assign_department	\N	2026-07-31 11:31:17.261	2026-07-31 11:31:17.261
065a92d1-c998-404e-9f3b-31a251ca3662	task.accept_own	task.accept_own	\N	2026-07-31 11:31:17.261	2026-07-31 11:31:17.261
84520dcd-0b42-468c-924d-7188c7097dcc	attendance.read	attendance.read	\N	2026-07-31 11:31:17.261	2026-07-31 11:31:17.261
adbe9800-1f4b-4517-9ac3-9f1e0b6089f2	user.update	user.update	\N	2026-07-31 11:31:17.26	2026-07-31 11:31:17.26
4a1cdfc6-e124-4e29-8444-b7a5b92148d9	shift.swap	shift.swap	\N	2026-07-31 11:31:17.261	2026-07-31 11:31:17.261
6b059063-6a74-4929-9375-67c0935baccf	shift.register	shift.register	\N	2026-07-31 11:31:17.261	2026-07-31 11:31:17.261
76866a59-ea44-4199-9747-5e456a6b89d3	task.update_progress_own	task.update_progress_own	\N	2026-07-31 11:31:17.261	2026-07-31 11:31:17.261
50d846f2-aa7f-40c1-9430-9f1f38758f57	task.submit_own	task.submit_own	\N	2026-07-31 11:31:17.261	2026-07-31 11:31:17.261
3c774b60-8b9e-4e5f-b233-4326e5b3b3a2	task.extension_review_department	task.extension_review_department	\N	2026-07-31 11:31:17.261	2026-07-31 11:31:17.261
f36fd45e-92ce-40c6-94be-32183c652f6f	task.group.manage_all	task.group.manage_all	\N	2026-07-31 11:31:17.261	2026-07-31 11:31:17.261
bcf2798c-a4b0-47cd-ac3a-d9c1c3fab3a4	task.comment_own	task.comment_own	\N	2026-07-31 11:31:17.261	2026-07-31 11:31:17.261
6b1a3f88-15f0-45bd-a76b-1633c2c23e12	task.extension_review_all	task.extension_review_all	\N	2026-07-31 11:31:17.261	2026-07-31 11:31:17.261
22e1c1b1-9816-42c6-978d-bd1f0462268e	task.extension_request_own	task.extension_request_own	\N	2026-07-31 11:31:17.261	2026-07-31 11:31:17.261
fd6edba7-cbd1-4b28-920d-925695c78b8a	cross_department.create	cross_department.create	\N	2026-07-31 11:31:17.261	2026-07-31 11:31:17.261
08b3489b-a163-461d-986a-9a576503a3b9	cross_department.source_approve	cross_department.source_approve	\N	2026-07-31 11:31:17.261	2026-07-31 11:31:17.261
b67784df-2a18-4f4d-bb04-99a0aad2be81	cross_department.read_all	cross_department.read_all	\N	2026-07-31 11:31:17.261	2026-07-31 11:31:17.261
0a3b653c-f30e-48a0-ae55-3a5fca0d57f3	task.group.manage_department	task.group.manage_department	\N	2026-07-31 11:31:17.261	2026-07-31 11:31:17.261
02e0e608-4d37-4ed3-88be-47f0bb22511f	cross_department.target_receive	cross_department.target_receive	\N	2026-07-31 11:31:17.261	2026-07-31 11:31:17.261
2cd16ad2-82ec-40ec-b720-51d7a0d241bc	notification.read	notification.read	\N	2026-07-31 11:31:17.261	2026-07-31 11:31:17.261
4c993a3d-9f44-4db6-ab9b-3477b12ca7ab	device_token.manage_own	device_token.manage_own	\N	2026-07-31 11:31:17.261	2026-07-31 11:31:17.261
8242a1eb-3059-41b6-9b07-1d495bdb88ce	warehouse.read	warehouse.read	\N	2026-07-31 11:31:17.261	2026-07-31 11:31:17.261
2e4cb809-5a07-4287-b78d-05880fd4cd2e	warehouse.create	warehouse.create	\N	2026-07-31 11:31:17.261	2026-07-31 11:31:17.261
140f53dd-b1bd-495d-bd58-b369b0cbe331	warehouse.update	warehouse.update	\N	2026-07-31 11:31:17.261	2026-07-31 11:31:17.261
7215bf34-e198-488d-adf6-a66ba3f36a88	warehouse.manage	warehouse.manage	\N	2026-07-31 11:31:17.261	2026-07-31 11:31:17.261
fa54d18f-69f5-4ed9-a73d-0c436f6e9ff7	material.create	material.create	\N	2026-07-31 11:31:17.261	2026-07-31 11:31:17.261
1db7bde4-7276-46ca-bde3-2f49ac1838bf	material.update	material.update	\N	2026-07-31 11:31:17.261	2026-07-31 11:31:17.261
033226a0-40c1-4344-a4f9-9d6520738eb1	material.read	material.read	\N	2026-07-31 11:31:17.261	2026-07-31 11:31:17.261
3231c521-f303-4a5f-b530-df76068d9055	stock.read	stock.read	\N	2026-07-31 11:31:17.261	2026-07-31 11:31:17.261
8846c6ac-c020-45eb-a15c-98e77837b3a9	stock.import	stock.import	\N	2026-07-31 11:31:17.261	2026-07-31 11:31:17.261
3ef88bfc-a7e7-48d4-b4b4-54ba0afbc5de	stock.export	stock.export	\N	2026-07-31 11:31:17.261	2026-07-31 11:31:17.261
ffb082a4-e6a9-4ef2-9ec5-d361990fdc77	stock.adjust	stock.adjust	\N	2026-07-31 11:31:17.261	2026-07-31 11:31:17.261
ce422422-bf99-4728-bb72-112c64164da1	stock.transfer	stock.transfer	\N	2026-07-31 11:31:17.261	2026-07-31 11:31:17.261
d7c14859-c077-4dc5-9159-24c46d8614f3	material_issue.read	material_issue.read	\N	2026-07-31 11:31:17.261	2026-07-31 11:31:17.261
17474300-6128-446d-8b46-e62e0a711df6	material_issue.issue	material_issue.issue	\N	2026-07-31 11:31:17.261	2026-07-31 11:31:17.261
37c0f8ee-850a-4045-8178-6c1b941ae86a	material_issue.approve	material_issue.approve	\N	2026-07-31 11:31:17.261	2026-07-31 11:31:17.261
38a18d4a-2502-4f99-8da2-c777ec360662	asset.read	asset.read	\N	2026-07-31 11:31:17.261	2026-07-31 11:31:17.261
a1339e8f-d773-418a-b63e-21e06f86d7f9	asset.create	asset.create	\N	2026-07-31 11:31:17.261	2026-07-31 11:31:17.261
3d109bb5-4efe-4f40-8791-c9ba0c4bdc19	asset.assign	asset.assign	\N	2026-07-31 11:31:17.261	2026-07-31 11:31:17.261
be18c7a7-deba-4ace-be60-32e22834c593	asset.return	asset.return	\N	2026-07-31 11:31:17.261	2026-07-31 11:31:17.261
f2112fff-65be-4fcf-a5b6-dc7eb62998fd	user.manage	user.manage	\N	2026-07-31 11:31:17.26	2026-07-31 11:31:17.26
aa517192-a87b-4714-b9d3-55f9dc6ce5d3	asset.incident.create	asset.incident.create	\N	2026-07-31 11:31:17.261	2026-07-31 11:31:17.261
6aee6b79-0057-4fe5-8b66-cf712c539cae	asset.incident.read	asset.incident.read	\N	2026-07-31 11:31:17.261	2026-07-31 11:31:17.261
2390eccb-9f3f-4bbc-b571-28acb5529593	material_issue.create	material_issue.create	\N	2026-07-31 11:31:17.261	2026-07-31 11:31:17.261
d47d4a5d-b053-42b9-a60f-5d0e2eb80609	asset.transfer	asset.transfer	\N	2026-07-31 11:31:17.261	2026-07-31 11:31:17.261
67849923-36f3-4c54-826f-14e8829aa95b	asset.incident.resolve	asset.incident.resolve	\N	2026-07-31 11:31:17.261	2026-07-31 11:31:17.261
5b04f5f9-74b3-4746-b0a5-e02a44b988e4	asset.maintenance.manage	asset.maintenance.manage	\N	2026-07-31 11:31:17.261	2026-07-31 11:31:17.261
56636640-f352-42b4-b61a-eb8bcf1f896f	inventory_check.read	inventory_check.read	\N	2026-07-31 11:31:17.261	2026-07-31 11:31:17.261
ca25a119-5cc2-4518-adb3-d20b32f1088f	inventory_check.submit	inventory_check.submit	\N	2026-07-31 11:31:17.261	2026-07-31 11:31:17.261
e9bf5f01-2fe7-40c4-907e-815abfbd094a	salary_profile.create	salary_profile.create	\N	2026-07-31 11:31:17.261	2026-07-31 11:31:17.261
f47838ac-a229-477c-a8c2-bb66482cf486	inventory_check.approve	inventory_check.approve	\N	2026-07-31 11:31:17.261	2026-07-31 11:31:17.261
1c8b5a33-5ac5-4953-9abe-75723b7948fd	salary_profile.read	salary_profile.read	\N	2026-07-31 11:31:17.262	2026-07-31 11:31:17.262
66d1168d-a5a7-423c-82ab-7685bed52e8a	salary_profile.update	salary_profile.update	\N	2026-07-31 11:31:17.262	2026-07-31 11:31:17.262
349397fc-5d4f-4ffe-8d54-1feafde159f4	salary_component.read	salary_component.read	\N	2026-07-31 11:31:17.262	2026-07-31 11:31:17.262
95f376c8-800c-4d76-86c4-a8176b20e901	salary_component.update	salary_component.update	\N	2026-07-31 11:31:17.262	2026-07-31 11:31:17.262
4f9392ab-270d-4502-8ca6-94fff75f1253	salary_component.create	salary_component.create	\N	2026-07-31 11:31:17.262	2026-07-31 11:31:17.262
39f10dc5-1e4d-4ccb-a674-3e0e399e915a	payroll_period.read	payroll_period.read	\N	2026-07-31 11:31:17.262	2026-07-31 11:31:17.262
af900d07-e032-463c-9a62-ce40ec3b863e	payroll.calculate	payroll.calculate	\N	2026-07-31 11:31:17.262	2026-07-31 11:31:17.262
39948cf2-c527-47fd-9d95-5b35d60443bb	payroll.review	payroll.review	\N	2026-07-31 11:31:17.262	2026-07-31 11:31:17.262
a3a3534f-9ad8-43d4-9a2c-5ef9d9d387ed	payroll.approve	payroll.approve	\N	2026-07-31 11:31:17.262	2026-07-31 11:31:17.262
293ef276-fc77-4c9d-b2a8-7df8806edf6d	payroll.lock	payroll.lock	\N	2026-07-31 11:31:17.262	2026-07-31 11:31:17.262
d3aeb885-06c0-4c74-9ab0-4bfcf2450308	payroll.read_all	payroll.read_all	\N	2026-07-31 11:31:17.262	2026-07-31 11:31:17.262
615ce2f1-8b45-4073-884c-938dcec8ce14	payroll.read_own	payroll.read_own	\N	2026-07-31 11:31:17.262	2026-07-31 11:31:17.262
ab8b86aa-9d42-470a-ac0a-6e9b906c0f9d	bonus.create	bonus.create	\N	2026-07-31 11:31:17.262	2026-07-31 11:31:17.262
40c16d45-fb4d-4576-b199-35c906205817	bonus.read	bonus.read	\N	2026-07-31 11:31:17.262	2026-07-31 11:31:17.262
62109245-aed6-41ca-92da-3a33264263c7	bonus.approve	bonus.approve	\N	2026-07-31 11:31:17.262	2026-07-31 11:31:17.262
bd2d52c5-7f7c-49fa-bbba-5d5a77dafdd0	deduction.read	deduction.read	\N	2026-07-31 11:31:17.262	2026-07-31 11:31:17.262
127aac98-9593-4847-a090-3c7f561f883c	violation.create	violation.create	\N	2026-07-31 11:31:17.262	2026-07-31 11:31:17.262
5d50a8be-12fc-4c46-9764-c073ca89e4fb	violation.confirm	violation.confirm	\N	2026-07-31 11:31:17.262	2026-07-31 11:31:17.262
3064cc49-40a0-4622-84e6-18086e6ec715	disciplinary_action.approve	disciplinary_action.approve	\N	2026-07-31 11:31:17.262	2026-07-31 11:31:17.262
e1d3b13a-fd7a-4530-9322-7008a6caeadf	employee_document.read_department	employee_document.read_department	\N	2026-07-31 11:31:17.262	2026-07-31 11:31:17.262
382b42b1-e21f-49cc-bce8-75aa1d2e26e8	employee_document.read_sensitive	employee_document.read_sensitive	\N	2026-07-31 11:31:17.262	2026-07-31 11:31:17.262
b81f54b9-408e-420f-adea-8123a67b063a	employee_document.create	employee_document.create	\N	2026-07-31 11:31:17.262	2026-07-31 11:31:17.262
daeda1f5-810a-49c9-81de-03fa553ce31f	contract_template.read	contract_template.read	\N	2026-07-31 11:31:17.262	2026-07-31 11:31:17.262
1d9347e5-129a-490f-86c1-b27df5891668	contract.create	contract.create	\N	2026-07-31 11:31:17.262	2026-07-31 11:31:17.262
7dbf0cbe-b68e-48e0-8ec3-3be6908fba11	contract.read_department	contract.read_department	\N	2026-07-31 11:31:17.262	2026-07-31 11:31:17.262
cfbcf0b3-ef5c-4584-9d1a-83a6cee2495c	contract.approve	contract.approve	\N	2026-07-31 11:31:17.263	2026-07-31 11:31:17.263
300e6166-b3d4-4756-bd3d-5e6be628d559	contract.terminate	contract.terminate	\N	2026-07-31 11:31:17.263	2026-07-31 11:31:17.263
a71247cc-8965-4ea1-a52d-159f4a9352da	kpi_template.read	kpi_template.read	\N	2026-07-31 11:31:17.263	2026-07-31 11:31:17.263
9c61877a-9926-4bb9-911d-3f0c63ca2d04	kpi.assign	kpi.assign	\N	2026-07-31 11:31:17.263	2026-07-31 11:31:17.263
e42af89a-16a8-4163-ba5b-fe6ce8544c77	kpi.read_department	kpi.read_department	\N	2026-07-31 11:31:17.263	2026-07-31 11:31:17.263
4d34b1a1-6688-4b8b-8c43-c79574f13171	kpi.self_review	kpi.self_review	\N	2026-07-31 11:31:17.263	2026-07-31 11:31:17.263
a63e189e-e564-4cba-8e52-8cf42b3349e0	kpi.finalize	kpi.finalize	\N	2026-07-31 11:31:17.263	2026-07-31 11:31:17.263
318d1b36-1a96-4ea2-9520-b3aaee2c2213	review_cycle.create	review_cycle.create	\N	2026-07-31 11:31:17.263	2026-07-31 11:31:17.263
51e8d70f-d211-4996-846d-d27523e247b2	performance_review.read_own	performance_review.read_own	\N	2026-07-31 11:31:17.263	2026-07-31 11:31:17.263
37f060fd-8d99-4dee-b196-c77cf5ff124d	dashboard.department.read	dashboard.department.read	\N	2026-07-31 11:31:17.263	2026-07-31 11:31:17.263
fb8d9b0f-fa2c-45c8-b304-f584920e36fd	performance_review.read_department	performance_review.read_department	\N	2026-07-31 11:31:17.263	2026-07-31 11:31:17.263
ff924b0d-1604-4dd4-8bd1-0b234cd45502	performance_review.leader_submit	performance_review.leader_submit	\N	2026-07-31 11:31:17.263	2026-07-31 11:31:17.263
7ce68843-03e2-48ce-9843-06da64203870	report.employee.read	report.employee.read	\N	2026-07-31 11:31:17.263	2026-07-31 11:31:17.263
aad8430e-5e45-4cba-a1ca-89d416e12ccf	performance_review.read_all	performance_review.read_all	\N	2026-07-31 11:31:17.263	2026-07-31 11:31:17.263
86cfef87-434f-4f51-aa29-981a06ffccc1	report.attendance.read	report.attendance.read	\N	2026-07-31 11:31:17.263	2026-07-31 11:31:17.263
57a3e214-9a26-4380-9ca7-cc7b3a0e3b0c	report.payroll.detail	report.payroll.detail	\N	2026-07-31 11:31:17.263	2026-07-31 11:31:17.263
3336a605-5f4d-43f7-b37b-e11213e1a2b8	report.kpi.read	report.kpi.read	\N	2026-07-31 11:31:17.263	2026-07-31 11:31:17.263
6bd38e7a-8567-4d52-bc3f-a485fda5b219	system_setting.read	system_setting.read	\N	2026-07-31 11:31:17.263	2026-07-31 11:31:17.263
a2970c39-cc5d-46fc-a26c-03c31be74749	notification_preference.read_own	notification_preference.read_own	\N	2026-07-31 11:31:17.263	2026-07-31 11:31:17.263
79881ce2-f7a2-4205-8b9a-2e58a0708a05	audit.read	audit.read	\N	2026-07-31 11:31:17.263	2026-07-31 11:31:17.263
daca7d69-0fe5-4a1a-8c1d-7e31d1792204	feedback.create	feedback.create	\N	2026-07-31 11:31:17.263	2026-07-31 11:31:17.263
8387782b-a978-42d3-85f5-da846b74e766	payroll_period.create	payroll_period.create	\N	2026-07-31 11:31:17.262	2026-07-31 11:31:17.262
e2b6218f-9464-4a3a-94c2-aeba7de531a7	deduction.create	deduction.create	\N	2026-07-31 11:31:17.262	2026-07-31 11:31:17.262
15022f24-1eec-4e5c-9f2c-76bc8af96994	deduction.approve	deduction.approve	\N	2026-07-31 11:31:17.262	2026-07-31 11:31:17.262
dac5dd4e-9ba3-44ff-af18-df0f46aa77fc	violation.read	violation.read	\N	2026-07-31 11:31:17.262	2026-07-31 11:31:17.262
bafbdb06-5df1-4987-8d61-8b0c1e95a53b	disciplinary_action.create	disciplinary_action.create	\N	2026-07-31 11:31:17.262	2026-07-31 11:31:17.262
149a71cd-8a41-49e8-ba84-5262b6347891	employee_document.read_own	employee_document.read_own	\N	2026-07-31 11:31:17.262	2026-07-31 11:31:17.262
64e4abaf-9d70-4b69-846e-cd4ff88be5c1	employee_document.read_all	employee_document.read_all	\N	2026-07-31 11:31:17.262	2026-07-31 11:31:17.262
c5304fb0-7831-4ab4-877f-7e9cb59ee502	employee_document.verify	employee_document.verify	\N	2026-07-31 11:31:17.262	2026-07-31 11:31:17.262
789ee04f-cb9b-479f-aef5-1ee75b67446c	contract_template.create	contract_template.create	\N	2026-07-31 11:31:17.262	2026-07-31 11:31:17.262
7741adb9-7c1c-4bbd-966a-24e0f5f547e5	contract_template.update	contract_template.update	\N	2026-07-31 11:31:17.262	2026-07-31 11:31:17.262
0bc07725-2bf8-4c51-9c76-47c8cb158054	contract.read_own	contract.read_own	\N	2026-07-31 11:31:17.262	2026-07-31 11:31:17.262
6e74d280-9baf-41b0-8b7a-23010e950382	contract.read_all	contract.read_all	\N	2026-07-31 11:31:17.262	2026-07-31 11:31:17.262
c4be8531-447d-440f-b065-98bc9338ee80	contract.sign_company	contract.sign_company	\N	2026-07-31 11:31:17.263	2026-07-31 11:31:17.263
bde13fc1-85df-4cea-8e9d-e12d1b9acdce	kpi_template.create	kpi_template.create	\N	2026-07-31 11:31:17.263	2026-07-31 11:31:17.263
68593ab7-ec91-4918-a8dd-8e19bf0c35d3	kpi_template.update	kpi_template.update	\N	2026-07-31 11:31:17.263	2026-07-31 11:31:17.263
a4fa5480-909b-429c-8c9e-1ab5cb8eb5fe	kpi.read_own	kpi.read_own	\N	2026-07-31 11:31:17.263	2026-07-31 11:31:17.263
9694f2b2-407f-49ec-b3a0-2e3d8a29f001	kpi.read_all	kpi.read_all	\N	2026-07-31 11:31:17.263	2026-07-31 11:31:17.263
08a66dbc-6204-4de1-b23e-1b553d7a979f	kpi.leader_review	kpi.leader_review	\N	2026-07-31 11:31:17.263	2026-07-31 11:31:17.263
cc01b521-8686-4445-b9f9-a9540f4062bf	review_cycle.manage	review_cycle.manage	\N	2026-07-31 11:31:17.263	2026-07-31 11:31:17.263
032b9405-38e7-40cd-8254-8d082370fc07	review_cycle.read	review_cycle.read	\N	2026-07-31 11:31:17.263	2026-07-31 11:31:17.263
30db9e1b-a5c2-42b2-875b-ac40b4a1cfb0	dashboard.admin.read	dashboard.admin.read	\N	2026-07-31 11:31:17.263	2026-07-31 11:31:17.263
4e0fa767-3558-4d71-b986-e96a88b84594	performance_review.self_submit	performance_review.self_submit	\N	2026-07-31 11:31:17.263	2026-07-31 11:31:17.263
13f99a1a-79bd-415c-8589-b7cdef7ed39b	dashboard.own.read	dashboard.own.read	\N	2026-07-31 11:31:17.263	2026-07-31 11:31:17.263
3e2114f8-716f-4eac-a15f-468429c859df	performance_review.finalize	performance_review.finalize	\N	2026-07-31 11:31:17.263	2026-07-31 11:31:17.263
fe789135-b250-4714-a120-e7189498c043	report.payroll.summary	report.payroll.summary	\N	2026-07-31 11:31:17.263	2026-07-31 11:31:17.263
5619c44a-e412-45bb-a30e-f7aa4a910fff	report.warehouse.read	report.warehouse.read	\N	2026-07-31 11:31:17.263	2026-07-31 11:31:17.263
4e7033e1-1124-4334-8bc5-835507c4c091	report.asset.read	report.asset.read	\N	2026-07-31 11:31:17.263	2026-07-31 11:31:17.263
aefd535d-c849-4501-b47d-c8a962490ecd	position.read	position.read	\N	2026-07-31 11:31:17.26	2026-07-31 11:31:17.26
4077023d-6096-4fc7-9372-5705a06eece7	report.task.read	report.task.read	\N	2026-07-31 11:31:17.263	2026-07-31 11:31:17.263
3debeb00-2d01-47c1-9d74-969eab967abf	report.export.excel	report.export.excel	\N	2026-07-31 11:31:17.263	2026-07-31 11:31:17.263
05de376b-5d87-4678-89d7-8a07b7c20132	report.export.csv	report.export.csv	\N	2026-07-31 11:31:17.263	2026-07-31 11:31:17.263
94e6a6fe-90d2-473d-b408-ee6eee28be9e	system_setting.update	system_setting.update	\N	2026-07-31 11:31:17.263	2026-07-31 11:31:17.263
0f98bfd9-4cb0-45a2-a2b3-95f541bdbae4	notification_preference.update_own	notification_preference.update_own	\N	2026-07-31 11:31:17.263	2026-07-31 11:31:17.263
d14f236a-1034-44b5-a158-419de6398e41	job.run_manual	job.run_manual	\N	2026-07-31 11:31:17.263	2026-07-31 11:31:17.263
3f39f1ae-abee-480c-9d81-6cf17783cc8c	job.read	job.read	\N	2026-07-31 11:31:17.263	2026-07-31 11:31:17.263
bdef25f5-437b-4fbe-b026-fbcbf6cd529b	feedback.read_all	feedback.read_all	\N	2026-07-31 11:31:17.263	2026-07-31 11:31:17.263
3737e4ab-d6d0-447e-99f4-c14c4d0a549b	feedback.read_own	feedback.read_own	\N	2026-07-31 11:31:17.263	2026-07-31 11:31:17.263
59440001-b2bd-4c6e-a461-40c50f6bc129	feedback.update_status	feedback.update_status	\N	2026-07-31 11:31:17.264	2026-07-31 11:31:17.264
0500928c-0c9d-4349-b555-5bfe0189da7b	inventory_check.create	inventory_check.create	\N	2026-07-31 11:31:17.261	2026-07-31 11:31:17.261
0059bd23-d088-4a0f-8198-d4c3198f75b4	position.update	position.update	\N	2026-07-31 11:31:17.26	2026-07-31 11:31:17.26
fb47d4c5-a049-447e-b9b8-3b4745604202	department.read	department.read	\N	2026-07-31 11:31:17.26	2026-07-31 11:31:17.26
3d2fbece-98b5-48aa-bf1a-72cad87829b4	permission.read	permission.read	\N	2026-07-31 11:31:17.26	2026-07-31 11:31:17.26
a82d44ba-e2ce-48f8-9f5e-b936bc71b368	employee.approve	employee.approve	\N	2026-07-31 11:31:17.26	2026-07-31 11:31:17.26
1af4fc0b-8fb9-4265-96ba-063907472ed9	shift.create	shift.create	\N	2026-07-31 11:31:17.26	2026-07-31 11:31:17.26
aa7616fd-c979-4c93-9324-06c7a113d1fb	employee.read	employee.read	\N	2026-07-31 11:31:17.26	2026-07-31 11:31:17.26
ee6cb187-ab75-41c8-8614-d2d5d125000d	face.approve	face.approve	\N	2026-07-31 11:31:17.26	2026-07-31 11:31:17.26
98e12656-4a55-4037-b6a8-8909813eed80	position.delete	position.delete	\N	2026-07-31 11:31:17.26	2026-07-31 11:31:17.26
adfc8307-4603-4aa2-a3c0-49e5e6fb7603	department.create	department.create	\N	2026-07-31 11:31:17.26	2026-07-31 11:31:17.26
e4b2bc48-8bdc-4848-bcb1-0756e1015e68	employee.update	employee.update	\N	2026-07-31 11:31:17.26	2026-07-31 11:31:17.26
36e8db0c-7755-4d05-aa63-19ff7f8fd931	shift.read	shift.read	\N	2026-07-31 11:31:17.26	2026-07-31 11:31:17.26
3c209de4-4f85-4bd0-be7d-6fb4f5551d25	role.assign	role.assign	\N	2026-07-31 11:31:17.26	2026-07-31 11:31:17.26
a5ace99d-252e-4a0e-a3d0-5d5ffaf44a03	approval.read	approval.read	\N	2026-07-31 11:31:17.26	2026-07-31 11:31:17.26
0d76865b-43c2-4923-9675-ea0fcfe2698d	department.delete	department.delete	\N	2026-07-31 11:31:17.26	2026-07-31 11:31:17.26
7ffd1fa3-cab7-4910-8925-6876f8c607ca	position.create	position.create	\N	2026-07-31 11:31:17.26	2026-07-31 11:31:17.26
19bb1473-90cd-4d51-acec-5b0248951fb9	department.update	department.update	\N	2026-07-31 11:31:17.26	2026-07-31 11:31:17.26
\.


--
-- Data for Name: positions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.positions (id, "departmentId", code, name, description, "isActive", "createdAt", "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: post_comments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.post_comments (id, "postId", "authorId", content, "createdAt", "updatedAt") FROM stdin;
0cec977a-c74f-4701-b1e9-d5db932c5d5a	b38a60cf-a061-48a9-8242-3a61db3e6470	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	Phạt	2026-08-29 08:15:10.914	2026-08-29 08:15:10.914
ca0194fd-5ee1-43ff-afbf-fe9a9389889a	b38a60cf-a061-48a9-8242-3a61db3e6470	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	🙃	2026-08-29 08:15:49.618	2026-08-29 08:15:49.618
afc5921f-fe1e-4347-a917-ca250f617154	b38a60cf-a061-48a9-8242-3a61db3e6470	545ef296-1135-4885-8e61-89932645af6c	Khử loáaa ae ơi	2026-08-29 08:42:36.419	2026-08-29 08:42:36.419
21e8fdb1-81fb-44d6-96b8-fb869531bacc	b38a60cf-a061-48a9-8242-3a61db3e6470	334b2294-9bba-4f31-8290-5a87484a62f0	.	2026-08-29 08:43:15.932	2026-08-29 08:43:15.932
af31bdc7-70d6-49de-9428-c06e5c823ff5	b38a60cf-a061-48a9-8242-3a61db3e6470	846641e3-667b-4e7f-b505-afdc1d66b54a	10k ít quá thêm 100k đi	2026-08-29 08:43:33.509	2026-08-29 08:43:33.509
\.


--
-- Data for Name: post_likes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.post_likes (id, "postId", "userId", "createdAt") FROM stdin;
869cf75c-bfb4-4fba-bf5a-46373b34d7f3	b38a60cf-a061-48a9-8242-3a61db3e6470	334b2294-9bba-4f31-8290-5a87484a62f0	2026-08-29 08:42:46.127
def2ff51-2bc2-4892-b709-cddbb78987a8	c2df5353-65c3-460a-85a0-99b426f04f85	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-08-29 08:42:52.025
ca967eab-6838-499f-9285-e8b9af9dc6df	b38a60cf-a061-48a9-8242-3a61db3e6470	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-04 07:19:29.525
1e815113-58ae-43a2-b85b-f2e2ed154a69	b38a60cf-a061-48a9-8242-3a61db3e6470	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-09 09:49:37.781
\.


--
-- Data for Name: project_grant_packages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.project_grant_packages (id, "vaultId", "userId", title, "totalPoints", "cashValuePerPoint", "startDate", "durationMonths", "intervalMonths", status, note, "createdAt", "updatedAt") FROM stdin;
89a8be07-261f-4564-8b00-cd49c8cbec8a	b29752ac-08d4-4a13-b3de-8f067d7f5bf1	05ff1cc9-4cb6-4d87-a74b-0391a5539537	Thưởng Tết 2026	10000	1000.00	2026-09-08 00:00:00	12	3	ACTIVE	\N	2026-09-08 10:01:06.765	2026-09-08 10:01:06.765
5e2b0bbb-bcd2-48c2-a937-288fa504007b	8fe89cc2-f550-4467-ad4f-81e211c79c77	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	Thưởng Cuối Năm 2026	10000	1000.00	2026-09-08 00:00:00	12	3	ACTIVE	\N	2026-09-08 12:10:25.333	2026-09-08 12:10:25.333
da015c70-e3cd-4eb3-8c44-8c00138ae15a	8fe89cc2-f550-4467-ad4f-81e211c79c77	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	Thưởng Cuối Năm 2026	10000	1000.00	2026-08-09 00:00:00	12	1	ACTIVE	\N	2026-09-09 04:20:17.065	2026-09-09 04:20:17.065
\.


--
-- Data for Name: refresh_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.refresh_sessions (id, "userId", "tokenHash", "deviceId", "userAgent", "ipAddress", "expiresAt", "revokedAt", "createdAt") FROM stdin;
fca318cf-cf91-42d1-a3d8-77fcc4bf6b90	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$Ueed5X7EtGrdZVRQGnxFF.4TicdLLsoCp8wPJxV.2TScMDF6kACvu	\N	node	127.0.0.1	2026-09-18 06:25:37.353	\N	2026-08-19 06:25:37.354
7e51ff11-9759-410d-bd42-f2dd70a76e62	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$6BVSBhMKdNXpHxZrfeHFoOSUU6.N5B7wMxCpBU7249lpCvtJ9.vf6	\N	node	127.0.0.1	2026-09-18 11:29:06.087	\N	2026-08-19 11:29:06.088
b9732205-d4be-4c82-b411-c5d2ac52ad96	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$YhEbrQB3YeAVLJk6w4DCieUZaxvV/6OGO5nyV83TDiW.BmDTqltnq	\N	MLGroup/8 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-09-19 02:09:47.187	2026-08-20 02:12:04.847	2026-08-20 02:09:47.188
ef84553b-5a7d-41d7-b64f-06c05ac1f8e3	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$nX/Bbaq5Dmwcfpv6msPdleXnPbxqE/x/d/F59DzkYGPTwEttlmfaW	\N	MLGroup/8 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-09-19 02:12:16.035	2026-08-20 02:14:25.019	2026-08-20 02:12:16.036
de66b5f3-9dad-40a6-b95b-461d68e117b3	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$yGaIp0199pvhq7IzzL2hQOwmsRAm1e2HoeyU53I.amdeyufaFyYrm	\N	MLGroup/8 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-09-19 02:14:35.557	2026-08-20 02:18:37.283	2026-08-20 02:14:35.558
73791881-41ff-44a7-89c6-d5b07fb90cbd	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$SRonwNazMAmAD/k9q.vcsuZxU3XBur31CPpomZMmB8k2Gd7XSl1pe	\N	\N	\N	2026-10-07 05:01:34.717	2026-09-07 07:08:55.418	2026-09-07 05:01:34.718
3e21cba0-5efa-42aa-8f39-49c06d33d007	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$gTMjTwKynrqGsA2FIS.WlOufG0YyLMsOUn/940pRwMM4WWYVLJg4W	\N	node	127.0.0.1	2026-09-19 02:20:04.481	\N	2026-08-20 02:20:04.482
12e0bd24-1d2b-4954-a9ec-67851683ae87	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	$2b$12$ogPPxsYZd8EmPV6ZA5jQTe2TsYLZ3ZAZz8dx.Vz47IBq38ckg.a9a	\N	okhttp/4.12.0	127.0.0.1	2026-09-18 11:33:11	2026-08-20 02:28:17.636	2026-08-19 11:33:11.001
dda6c934-3bb7-4877-8332-2cba86165ece	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$T905J0ZNYDDogz9cmZ42V.rEAEV5ayLfwF7DCHSLFZ/rDupU3/tEW	\N	node	127.0.0.1	2026-09-19 02:19:02.398	2026-08-20 02:31:54.841	2026-08-20 02:19:02.399
fac11d96-63b8-4b10-9f92-c471d4be98ca	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$9kiJCx20Ga4Nyh/09uvZaO7H4DPOMYYf4AMFZ7JP8gfswEwimuikW	\N	MLGroup/8 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-09-19 02:31:55.245	2026-08-20 02:32:50.021	2026-08-20 02:31:55.284
111df95b-d23d-461d-b17c-3cbb69e9b9db	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$/URwKNUG5euj6FMDY73oNe3.Wdsdp12kgIYieuSmDhljE.tcrD89u	\N	node	127.0.0.1	2026-09-19 02:32:50.455	2026-08-20 02:34:11.213	2026-08-20 02:32:50.456
f3951cad-e31b-4ed7-8421-e51670bd3ca3	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$omDlCqwRa8UdkUZmFbY2ruqGJmIFgDDIeLztk1S8OWvvOIeWCgwNi	\N	node	127.0.0.1	2026-09-19 02:35:32.932	\N	2026-08-20 02:35:32.933
de7d76aa-dbfa-43eb-8a91-bb6923ca5685	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$7vLWI5sQHMZ/uvc9rULMKOvytxcEYvY8DHS/It238bdriP8RZdUWS	\N	MLGroup/8 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-09-19 02:34:11.651	2026-08-20 02:36:08.262	2026-08-20 02:34:11.652
4e1cc5bc-c575-4d3b-af7a-c760789d8491	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	$2b$12$fCbRiZiLDBrz8tK9fsBuj.iBxLaixQyVgm7K5Nu.aI6w0xVAf5IGm	\N	MLGroup/8 CFNetwork/3860.700.1 Darwin/25.6.0	127.0.0.1	2026-09-19 02:34:57.09	2026-08-20 02:46:27.595	2026-08-20 02:34:57.091
66f0199f-54be-416f-9a1e-eae7bf4cbd0f	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	$2b$12$v5EcDKcg6kqE6.jX9JSny.xi8ka/8XW9AwBocR9ymSbE6gTNrGdNS	\N	okhttp/4.12.0	127.0.0.1	2026-09-19 02:30:09.448	2026-08-20 02:58:40.184	2026-08-20 02:30:09.449
7af1202a-b4ab-49ab-a92a-14d2e2d02058	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	$2b$12$NFLZ6YKnbYnu5O1mLowBweNtVOjME0NWYaR1yBlrWVH9Qz2uvAMia	\N	node	127.0.0.1	2026-09-19 02:46:27.988	2026-08-20 03:00:44.696	2026-08-20 02:46:27.989
c2f4d0ff-c7c0-4420-9858-fddb0eb13aef	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	$2b$12$lbM6ERBVNvhVwZszcSa/5uziumMusNJwqsNuFHXfrvXYzA/quqarW	\N	node	127.0.0.1	2026-09-19 02:58:40.581	2026-08-20 03:07:22.689	2026-08-20 02:58:40.582
3b7c41eb-f389-4ea7-b5fe-45e9d55a3afc	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	$2b$12$CRFD3/51PKtNI/2yNWW83Ox8cLopjr7JQkFv84UJm/c3whAWNhbyq	\N	node	127.0.0.1	2026-09-19 03:00:45.192	2026-08-20 03:12:02.145	2026-08-20 03:00:45.193
eded2e90-a760-46b9-83a5-260a7c9128e3	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	$2b$12$6bFl/0K4M70/3gLT/aayaednwQiC96LZ9XQGbCvuUQ9pB46EuTocy	\N	node	127.0.0.1	2026-09-19 03:12:02.537	2026-08-20 03:12:52.488	2026-08-20 03:12:02.538
1c7a82aa-3f79-4a30-94ce-688e43a89e06	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	$2b$12$sGOBIiRpCB8K97a/2iZfUu2.M0oBBgnqdGcPHoqlIONPWb/ISjhxm	\N	node	127.0.0.1	2026-09-19 03:12:52.932	2026-08-20 03:19:42.416	2026-08-20 03:12:52.933
95f38eea-56af-4c0c-b050-3554a6397051	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	$2b$12$BFU1ucLLQua2JuZTnRFmSuu8ZMGGZGxcyhRcN3WM4IGR0lY4LzBwW	\N	node	127.0.0.1	2026-09-19 03:19:42.825	2026-08-20 03:22:21.44	2026-08-20 03:19:42.826
5af0990c-6136-46af-b809-170ab5fb2cb0	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	$2b$12$4brW.HYQ2vDU7/y6iUcyB.hoK/XHl9FvNZyDiOW0Yusw/vS9QsIWe	\N	node	127.0.0.1	2026-09-19 03:22:21.83	2026-08-20 03:24:31.446	2026-08-20 03:22:21.831
25fe6795-36a1-4099-8099-0e9c874585c8	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	$2b$12$rV/Llar8AwHI7U9qKH.gceY7ue98bdbKG0vVPC0RH/cXFDd.moLKG	\N	node	127.0.0.1	2026-09-19 03:24:31.844	2026-08-20 03:29:30.498	2026-08-20 03:24:31.845
24aa21b0-168f-416b-9454-d533601ca2ef	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	$2b$12$o/FxYtmUViRME22ixtEQ..aj7ul5puiFleOQoCm3CKKCqMfYT.vpG	\N	node	127.0.0.1	2026-09-19 03:29:30.89	2026-08-20 04:31:12.697	2026-08-20 03:29:30.891
7f431225-a7ee-4832-b926-38f395285f3d	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	$2b$12$NsHEAC5bbH9n8wG1p02qtebZlLTXUExnr5aW1vbCt0FgZURRZKkMS	\N	node	127.0.0.1	2026-09-19 03:07:23.081	2026-08-20 09:26:56.496	2026-08-20 03:07:23.082
bda386c1-4395-41b1-9a3f-6f8b8e15e22c	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	$2b$12$VT9vT6weLFy3Gug50Hqh/.ZZfuZtq0i/wfAV7/2ZRDu6BMbtBUbGO	\N	node	127.0.0.1	2026-09-19 09:26:56.893	2026-08-20 11:40:38.004	2026-08-20 09:26:56.894
32214a58-0941-4d62-9cb8-11f83b113ebe	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$wd0Lr73KsQxXHkEm9OJAee3QfN6eZIsQlppHbZjkIBsFFp9.5PPbG	\N	node	127.0.0.1	2026-09-20 10:01:53.758	\N	2026-08-21 10:01:53.759
b84a31d9-5a51-4a36-b039-6bc5d36c8b60	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$zpVof6gCb7g0qCWCU9bIeeyTt.8YngsoKxmlQd2jk4bOJI1RNG8aS	\N	node	127.0.0.1	2026-09-20 10:09:20.98	\N	2026-08-21 10:09:20.981
2e357292-5ab4-44b7-9402-78552047e28f	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$j3OEAG2uo978LOfQnVm8MehFMw982V61JoHTRm/D/ZtJKrum34fny	\N	node	127.0.0.1	2026-09-19 02:36:08.704	2026-08-21 10:24:02.562	2026-08-20 02:36:08.705
75afbe89-55eb-4255-8b7e-b2766388a68a	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	$2b$12$qqvRPCR77S2JuCkJbu1Ocu379Ejn4YJGOveyXs1jMEhQOpLUM95/m	\N	okhttp/4.12.0	127.0.0.1	2026-09-19 11:40:38.412	2026-08-22 02:16:21.91	2026-08-20 11:40:38.413
92a9eae0-c26b-489c-bc96-985306fa972f	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$s80LQb8fkwHUenwe8GFcgOmwxckvRHoiAxYqZQTB5rbYjxpWhs9Am	\N	node	127.0.0.1	2026-09-21 02:48:00.976	\N	2026-08-22 02:48:00.977
bfb30834-8661-41b5-90e3-d07724f70367	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$4jLMHTgO1AyTiqJr7gEvHO8qqc6.VpvnWGYj.5Z4YotVBLIFtM3S.	\N	MLGroup/8 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-09-19 02:39:50.461	2026-08-23 07:26:34.511	2026-08-20 02:39:50.462
31c26ddf-6dd9-4897-ba1e-1d7686f2a951	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$bmkWkWAFnTE.wfXO4iDnIuivTYXtx7kpWMez/eHvatMcpnEXVp7K2	\N	node	127.0.0.1	2026-09-20 10:24:03.017	2026-08-23 07:26:51.803	2026-08-21 10:24:03.019
5999308e-7e61-451c-b88c-ae5922b9fc5e	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$rBSIcFtnkxSsazWDuuO5QuD4QOkVOQeFVUubDqcUcan.LZAkYjIrq	\N	MLGroup/8 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-09-22 07:26:52.156	2026-08-23 07:27:04.31	2026-08-23 07:26:52.157
dac6159f-5f69-4464-aaff-4c9e844cd307	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$LMjNAJfPFkVxUD2MZKr5wOtJOAwH7R52wD3vPr3zjlhH9vGgUbZHq	\N	MLGroup/8 CFNetwork/3860.300.31 Darwin/25.2.0	127.0.0.1	2026-09-22 15:51:25.381	\N	2026-08-23 15:51:25.383
686caa94-bafa-4081-8b84-374abf84204d	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$km9/q7JWGVVR2wLRHnlTquAWFbbJonvBx0CvDk0PJeXm2dfiZxOKS	\N	MLGroup/8 CFNetwork/3860.700.1 Darwin/25.6.0	127.0.0.1	2026-09-22 16:02:09.119	\N	2026-08-23 16:02:09.12
7265fd32-9adf-4608-a1c3-a5b2ef652c8d	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$PvFr6bDz7h8XZQYlGsL0VuaI8mWl2MU3jutvO7OqBbFcbStC/KaKG	\N	MLGroup/8 CFNetwork/3860.600.12 Darwin/25.5.0	127.0.0.1	2026-09-22 16:05:09.959	\N	2026-08-23 16:05:09.96
2fb302c0-1d67-4852-96cd-fb8ebea2c2c3	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$.lWUOz.iaUXrSITmTiH4peZuDt/rm8GChwSGCESKsu5bzgmvbOXOa	\N	node	127.0.0.1	2026-09-23 19:17:51.364	\N	2026-08-24 19:17:51.365
804e96d3-8611-4ac0-9b72-c530d39a8159	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$W9wmCZDVGEQAbXcKzQi6NubXY9OjGSUPrD8j/fkfK7xSlGQcbTO6C	\N	MLGroup/8 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-09-22 07:27:24.371	2026-08-27 03:17:36.934	2026-08-23 07:27:24.372
7d7da382-226c-4fdf-9d47-5684fac246d3	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$jC9qdoKw5Opyo8Z0T2uxEOc5lalpTLZEgqKZUQ1D7idG.bATsix7u	\N	node	127.0.0.1	2026-09-23 08:59:00.023	2026-08-27 03:17:48.899	2026-08-24 08:59:00.024
9df33aca-1446-4b77-b2b7-148384a32940	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	$2b$12$7U0h4X1LeELYavQV7ZrvOukeU8oAgdvq5VY.vB.frYZvl5Zp4qyxC	\N	node	127.0.0.1	2026-09-19 04:31:13.101	2026-08-27 03:18:39.953	2026-08-20 04:31:13.102
5e99f8ad-69ca-4434-8de1-21d75c44a504	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	$2b$12$yx9WbTdehjQQ8MZmcsVg8urD/8YCTJBhlvWpXqstiETjH5Kxn4wKm	\N	node	127.0.0.1	2026-09-21 02:16:22.314	2026-08-28 01:55:38.396	2026-08-22 02:16:22.315
63b33246-7d0a-4fd2-a7b2-89674f7fcc04	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$ZkzPoancUrINJSID4tGQUerSb23L/k1TWAVGtEupBukR5IRmMPp6W	\N	MLGroup/9 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-09-26 03:17:49.255	2026-08-29 08:20:34.825	2026-08-27 03:17:49.256
31007269-1548-4c94-95a5-8c897700c470	545ef296-1135-4885-8e61-89932645af6c	$2b$12$lRk/qAlitvL5jRmgcg7b5OIr60Jv33N.NJUHCZvoTNrZJ7AadXGR.	\N	MLGroup/11 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-09-28 04:55:32.252	2026-09-06 06:43:47.217	2026-08-29 04:55:32.253
d6b92551-1d14-47bc-b286-2d6a6f55f4ee	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$Ualb0PbhAwYoeMcUOK1NLuQg0MHrHOG6Xz.k2f9DpVkceeK7HhHAC	\N	MLGroup/10 CFNetwork/3860.600.12 Darwin/25.5.0	127.0.0.1	2026-09-26 04:08:15.218	\N	2026-08-27 04:08:15.221
8535a6a7-43f0-4678-8b86-828837b9889e	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$Bf8U8lqZALI4LCktkp0xn.nA8HauEEYApP7ptUk/6IjivGiGrjyBC	\N	MLGroup/11 CFNetwork/3860.600.12 Darwin/25.5.0	127.0.0.1	2026-09-26 04:45:06.924	\N	2026-08-27 04:45:06.925
9c312e85-8e1c-4b4f-8313-2ef0ce7a8e29	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$tDLnxTBQH44KsBHd2H3.J.HR0F6LORHlXKjlnGfb9twMqPON.FPSu	\N	MLGroup/11 CFNetwork/3860.700.1 Darwin/25.6.0	127.0.0.1	2026-09-26 04:59:30.232	\N	2026-08-27 04:59:30.233
f026b42b-b259-421e-b754-c4383f95f496	c2a06e5b-22fd-4862-bf12-8c36f5e07d9c	$2b$12$R3T3UptOR.eoNPx6dtgdaevbdGpHtsTPxJ8Zj3ROt1AnLY6YqWnWK	\N	MLGroup/11 CFNetwork/3826.600.41 Darwin/24.6.0	127.0.0.1	2026-09-28 08:39:51.959	\N	2026-08-29 08:39:51.96
2488dbf1-37b5-40fb-abc2-ddf4aa7167a7	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$hGWVw4SUhhuAwaP8uAKuJuPcXVjED.uhteT6ec3qCHm2pY7IzylsW	\N	MLGroup/11 CFNetwork/3860.700.1 Darwin/25.6.0	127.0.0.1	2026-09-26 15:59:53.753	2026-08-27 16:01:07.078	2026-08-27 15:59:53.754
01e84391-5ce0-46f9-aa48-804fef92d7af	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$73oaALNKUPjMcSudYwAIvek23tIEXOE43LGIV6QVTzqJiLwYA/sDS	\N	MLGroup/8 CFNetwork/3860.300.31 Darwin/25.2.0	127.0.0.1	2026-09-26 00:37:13.449	2026-08-27 16:04:37.223	2026-08-27 00:37:13.45
ea43e58d-dd8b-4d23-9cd4-cae2df6dd587	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$P3/n7kjnDFMrLxBCHmJrs.Kk9z/S8UowKvjxayFSKhC0e65Teii7m	\N	MLGroup/11 CFNetwork/3860.700.1 Darwin/25.6.0	127.0.0.1	2026-09-26 16:26:24.626	\N	2026-08-27 16:26:24.627
01bfc665-e0b9-4fea-9e7e-ff577bcaf207	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$SeEEnfEZ9zKX6.Rd2kFJIu8DGfV.g4QkLKK9BXt0wN7Mtqz5pyPWC	\N	\N	127.0.0.1	2026-09-28 09:02:42.022	\N	2026-08-29 09:02:42.024
72bf8abf-e12b-443b-8d35-44dc2c02d47a	31bb72f7-e5e2-493e-827d-3320e1054461	$2b$12$oQtF1vlFyWU4uaeaxw9SqespaoYzBj2pr9KNdl5tm69kkx4uXAXPO	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-07 03:19:12.032	2026-09-07 03:36:11.476	2026-09-07 03:19:12.033
3c57a0aa-7640-4587-b33b-eb9e21aaf0aa	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$7oHeyJBZN8A/seSwnXEVN.IKjgnh7zCFTIgmHUIH3t63KlMTMqjxa	\N	MLGroup/11 CFNetwork/3860.700.1 Darwin/25.6.0	127.0.0.1	2026-09-27 08:40:24.154	\N	2026-08-28 08:40:24.155
499e2d59-4bb4-40d1-990b-3eb8c818451c	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$POeUUjGKU3YeVnq34S.X3OFhaXHGw4mrW63z8cZx.42V2KPfOdaLS	\N	MLGroup/8 CFNetwork/3860.700.1 Darwin/25.6.0	127.0.0.1	2026-09-25 19:20:25.077	2026-08-28 20:59:41.548	2026-08-26 19:20:25.078
063df1d8-3ffd-410a-9150-ac3bfded1fe9	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$NPp2IdK7wJo079gK0VHlyOn4dusyFawCgrYF9iQ.mdBbRgHTJzzi.	\N	MLGroup/11 CFNetwork/3860.700.1 Darwin/25.6.0	127.0.0.1	2026-09-27 21:01:24.045	\N	2026-08-28 21:01:24.046
6c880207-0602-45b3-a3bc-361d00ebb063	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$W6BWAiVwVquxs7f/qPUuie1lwILj9/J183zPQgyriqCojE197OiN2	\N	node	127.0.0.1	2026-09-28 10:50:08.404	\N	2026-08-29 10:50:08.405
9d626a98-4d16-4430-bf60-31b67dda0ded	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$l3Rs2AoTp4fXGV5Yk2WrCeTtccdaS49ZB8AQUTS5jYFAR2.6bpkVi	\N	node	127.0.0.1	2026-09-28 08:12:08.326	\N	2026-08-29 08:12:08.326
67f01507-4d41-44bd-ac00-d6cfd2b10944	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$r/MGYvC4K11b4iMvBdjPx.LFojC620hiLdVFVSKL8bz1paSSbb7ji	\N	node	127.0.0.1	2026-09-28 10:22:54.093	2026-09-03 04:10:52.584	2026-08-29 10:22:54.095
6e99f0d6-2616-463f-8f29-d21a94097778	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	$2b$12$F3Vl0O/DQVyn.QnEC/mwS.k7o488AAw/r7hAhFJtG9pqf/WxCN42m	\N	MLGroup/8 CFNetwork/3860.700.1 Darwin/25.6.0	127.0.0.1	2026-09-26 03:18:40.351	2026-09-03 04:13:56.632	2026-08-27 03:18:40.352
12e743bd-7300-4700-bc76-94aba8db560e	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$wqZj71jzUMovrm0.xhEsM.PQQ7rm3mQWeYh3Zs9Nu0CzfgXcAmdIy	\N	MLGroup/11 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-09-28 08:20:46.903	2026-09-03 09:07:28.266	2026-08-29 08:20:46.905
f29b5177-74fc-4159-8a6d-c912de286b1b	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$5I367nNnsVvOQJYXZ6McNOuMNsqRxx0bjftBfho/b3.lbpYGHaBku	\N	node	127.0.0.1	2026-10-03 04:10:52.99	2026-09-03 09:07:42.254	2026-09-03 04:10:52.991
74cedf00-b87b-46b7-9e72-030c589e3ba4	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$OltCUTqdGBwGX8fJVHSPZ.S6tAXp.77VUhGius4LKuZBfDKkrxF4W	\N	MLGroup/13 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-03 09:07:42.604	2026-09-03 09:28:03.367	2026-09-03 09:07:42.605
603ca683-b145-4d83-ab51-21afe66c79fe	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$U5gxJdcmWPNWs06cS5iJFumvmwh2qn1lJj8NlMn37zRNST0pGPFhW	\N	MLGroup/14 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-03 09:28:20.772	2026-09-03 09:48:14.187	2026-09-03 09:28:20.773
703651b1-e53d-4a4c-9ef6-2fce44e6f497	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$zzg6UqN55twv/qsXIU6IF.F/VIawaqPjHmeTxkS1QpCC4cb6mbamq	\N	MLGroup/16 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-03 09:48:30.423	2026-09-03 09:58:36.228	2026-09-03 09:48:30.424
544e5a88-3e70-4d9a-8af7-84bd0289b4c9	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$JUA26RFJAupijO9xKT1MAOhRnS2/NnLTVMdyt8GSXpKqAZ/6L7GEa	\N	MLGroup/16 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-03 09:58:46.278	2026-09-03 10:25:27.774	2026-09-03 09:58:46.279
88c680b2-8dd1-46c5-881c-f51c6c4d5d60	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$wz1rI5bJgv.YiAC9hPP3Y.i0oTFCmdVwmcGsgZBO72qtcvHEMRBum	\N	MLGroup/17 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-03 10:25:38.022	2026-09-03 11:03:15.16	2026-09-03 10:25:38.023
e77a8e2d-7afb-4161-8c4b-1dad7109c955	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$CzFdUCxT2mZoAmBBGyfkXe3WIhQDbUKqzHrGxEgg84hHzz2PWZYw2	\N	Expo/1017756 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-03 11:26:16.551	2026-09-03 11:26:33.257	2026-09-03 11:26:16.552
d60b2553-f328-423c-8bac-3cfad69f5e4b	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$/igQqc57vF/5U2.oIDkzE.Oocua4tLiZx/OTBa7l93WH6ZRWJOMRG	\N	Expo/1017756 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-03 11:26:44.322	2026-09-03 11:40:55.821	2026-09-03 11:26:44.322
0312bb60-321b-425b-8653-9fef891ab58b	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$g4kyB91c/OXSN8iT/Uca8.O3xzrAF3so.HoyeXje1S8F1O7ihtWLu	\N	Expo/1017756 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-03 11:41:03.423	2026-09-03 11:42:39.39	2026-09-03 11:41:03.425
204687c7-82f3-4179-9c2a-273057e498f4	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$4JZBlErj3wotlGIuw4pexO9DnGeynmV08H4NADu1av2HSnPMeKXtG	\N	Expo/1017756 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-03 11:42:50.436	2026-09-03 11:44:59.343	2026-09-03 11:42:50.437
1a1c9c5c-737d-419c-a04d-c9f065dab002	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$7zZX20dtajp7eYuRQGXvI.0HIIjdewM21zWOnws/8NMlFzjuMQM5S	\N	MLGroup/11 CFNetwork/3860.700.1 Darwin/25.6.0	127.0.0.1	2026-10-03 15:59:24.504	\N	2026-09-03 15:59:24.505
96e2a075-f6b8-4192-9254-0225aa30763e	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	$2b$12$B3WE.fZfTmhLKtAFBfHjReuMJAQfM7RlyEaL2bsC2WbH5gzRxUOaq	\N	okhttp/4.12.0	127.0.0.1	2026-09-27 01:55:38.805	2026-09-04 00:57:47.847	2026-08-28 01:55:38.806
2f9cc7de-0972-4e02-a7b9-36a1ebc407f6	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	$2b$12$GzombC/FvDdK4nHB.wYymupo4uynG3ujyEnC8WcYFrblM/Ses125y	\N	\N	\N	2026-10-03 04:13:57.242	2026-09-04 00:59:47.196	2026-09-03 04:13:57.244
e9a28efa-f35f-4b78-82a2-c68ee83152c4	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	$2b$12$evt58U1pmerqH8qoyhe9cOGaeIiLSCR7MqEAYlABYOQUCej2JTn.a	\N	node	127.0.0.1	2026-10-04 00:57:48.245	2026-09-04 00:59:50.455	2026-09-04 00:57:48.246
9b98b49f-055e-405a-957e-6de3aef19f9c	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	$2b$12$96qI8zkRbJUzhUdkd3Bzf.7KGWCpaxnqvW0KRMK2BK3lEoVkJmM4y	\N	okhttp/4.12.0	127.0.0.1	2026-10-04 00:59:50.762	\N	2026-09-04 00:59:50.763
15d96344-9dc5-4160-b17e-78761cb88d64	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$EFA83CjlbfGrqMjhsViOFOKgpmBC1gELPI9gLATMT2.8DV3cwheDO	\N	node	127.0.0.1	2026-10-04 01:03:25.33	\N	2026-09-04 01:03:25.33
22f55b85-26c8-4961-aebd-cddd9e224902	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	$2b$12$hVadriLM5/OLHbX1SmE1beotuoGCvE1nY7CNDdSFnDDc/w6KqKG6C	\N	node	127.0.0.1	2026-10-04 00:59:47.647	2026-09-04 01:06:35.955	2026-09-04 00:59:47.648
1cbe81a4-dd27-417e-97c3-7e876442c9d1	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$xJjZUuHDrTGZoGPV2ab/zeRFYwosNHSvhM.b4IpmSKhnYUQ6mr1BK	\N	\N	\N	2026-10-03 11:44:59.975	2026-09-04 03:17:24.096	2026-09-03 11:44:59.976
1700c7bd-952c-4ba8-9888-0fa60b1fb721	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	$2b$12$mUHhbjlvOkB6n6LLB76leO0YhAOKrubTuCpZRn6KlOWn6tS57mUm.	\N	node	127.0.0.1	2026-10-04 01:06:36.395	2026-09-04 10:14:22.294	2026-09-04 01:06:36.396
64044b03-6738-48bc-854a-cec723513ead	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$aeqHUBbfM/941EuxMgrIKuo19JDF.de2SkhLCk0YZ4S8iV4vaLA3C	\N	\N	127.0.0.1	2026-10-04 10:53:12.828	\N	2026-09-04 10:53:12.829
81d4f878-3312-430a-8e68-46061f6d7023	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$wNjVhBR4CZ7/S6if.pZT1OppmIOIiBBTJYiY1Bkq.J94TXSJpjOMm	\N	MLGroup/18 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-03 11:03:26.601	2026-09-04 02:25:51.192	2026-09-03 11:03:26.602
ace70931-5af9-44ff-aa71-b6fba8a73c20	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$gz54tfI9LaBg9vxcDg3x6el1Fscvslz8ovsyK2QhwVtcfFAPMBbR6	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-04 11:03:06.186	2026-09-04 11:03:24.049	2026-09-04 11:03:06.187
073d8725-7aa3-448c-b6a2-226fde0a744e	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$mca.uviCEIDCot2Z9qyZuu/M8aQQIwqRv7e217UhqA9aKO/OQFzDW	\N	MLGroup/18 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-04 02:26:04.341	2026-09-04 02:26:54.625	2026-09-04 02:26:04.342
d9711a96-c176-46a9-a1b6-cccd56c1c5be	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$dLJmuMycFgjgAaAYZFunPO/Vz2rzykBkZZ4cZne7iPYbz/OA.tdbK	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-04 03:17:30.944	2026-09-04 03:17:54.799	2026-09-04 03:17:30.945
e1e1777f-6553-452b-bdc2-b2dd72dfe641	31bb72f7-e5e2-493e-827d-3320e1054461	$2b$12$EVh8e8Ptd4WOsZgyLr9IROwepBBBKFAINhoD08SrhfAAlB01S2cj2	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-07 02:53:17.798	2026-09-07 02:54:18.674	2026-09-07 02:53:17.799
a63ee845-f39d-4e02-9a39-1975cb567922	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$uczbPjzpforJeiT7oibPB.rXnIB9eIt8ZEX8OB4/e5aJM3dQsLH7W	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-04 03:18:11.38	2026-09-04 04:24:38.057	2026-09-04 03:18:11.381
1bdc7ea3-4ea1-4f4c-b72e-9fbd28eb951a	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$EAX7tMbqrr7OkWsIVujiEOuF4g0MUytZNWCJvIaQleojnaV.0pS3.	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-04 11:03:30.531	2026-09-04 11:15:21.671	2026-09-04 11:03:30.532
2fe115fe-7f30-49e0-9079-38ce87636639	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$lDm6ACUKxmLV.wWk18QazeHBqIH7kUt21YHVDYR9WJrwbXQIP0f2e	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-04 11:42:37.707	2026-09-04 12:02:53.019	2026-09-04 11:42:37.708
90058ba3-ae03-4742-823c-eaa5bee8c4d9	05ff1cc9-4cb6-4d87-a74b-0391a5539537	$2b$12$VHELp0jkHyzsJs.zxtxGAul4tQ0g5tz2fP5HSxJqjkzrVmQ5BiKg6	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-07 02:54:50.888	2026-09-07 02:55:08.548	2026-09-07 02:54:50.889
3dedb4aa-dc21-4b27-ab90-bf127b262738	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	$2b$12$YvMSwMMwLq4wJG2oBEO2FO.k0f2kYI4lszsHxjllMW37r1iUi0bHa	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-04 12:03:19.173	2026-09-04 12:09:24.566	2026-09-04 12:03:19.174
61cc77cf-6057-4949-8111-939a4633cd94	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$.kIx1gPSu1pxCL1skHXf3OqSlzXUZOLnuZLnB0fNLOXgxb07p9kWC	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-05 03:22:02.017	2026-09-05 03:26:20.414	2026-09-05 03:22:02.018
73c6527b-6e0a-4b36-998b-134bae41812b	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	$2b$12$ojj2izKN0LQDZA/s4e7Tg.ADQc.6KxUcFZhmCgnZf.z4MQFNbAnHu	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-05 03:26:54.492	2026-09-05 03:27:09.329	2026-09-05 03:26:54.493
fe15ad48-2558-4367-b1b4-b9990be4f068	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$k0tVsAlgRILHr8glxMSFw.SpyR89G0YljciQ67hSv8aRHwIMAhCxO	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-05 04:12:12.041	2026-09-05 04:24:37.938	2026-09-05 04:12:12.042
5f579e84-0745-406b-97f2-5b91c3151350	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$1GzPRGgnJrmQsKCp/D9Vau86RrvGEvvSHzJ.zxjC01QENrDPMn/kW	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-05 04:24:51.36	2026-09-05 06:58:56.286	2026-09-05 04:24:51.361
50fa1934-bab1-4f34-b9c3-dae3a89362e5	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$ouIWwLaF.Mpf2J9YoNnZE.Kaf9pyY/ERZIRO63RZibkptouLXAHGS	\N	MLGroup/18 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-05 08:39:47.496	2026-09-05 09:20:42.962	2026-09-05 08:39:47.497
ae585998-2bf4-466a-87c8-1bc90d1f3267	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$z2Yn5NwUnQw0ceMC1HU5DuLG.8eHiTJYM6dwHfa1mv3s6mFV/G6dG	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-07 02:55:21.464	2026-09-07 02:56:06.089	2026-09-07 02:55:21.468
ef587f45-815e-4be8-8b08-933824760490	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$4EdVScLvH0RTXP5lM.rcaegPQ6AZjCXeip1xKX9SeHa/KCEak/SEO	\N	MLGroup/18 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-05 09:21:00.066	2026-09-05 09:38:52.218	2026-09-05 09:21:00.067
9f003617-14e0-4d6f-a85a-d7091a708c53	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$uUz4J0kM67sO6hoRjSSahuW4VUeGkvsCeyiM9S3KYjgsVER5YyyVG	\N	MLGroup/18 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-05 09:40:41.921	2026-09-05 09:40:57.728	2026-09-05 09:40:41.922
12396a64-1ad0-43ba-9f2f-f19422926f91	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$Lqz9N7.p/yXDxRQls6b28.Wtv7oQpUO/mdo2aHUWfbKUUI3IsHyR6	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-05 09:40:58.13	2026-09-05 10:04:29.342	2026-09-05 09:40:58.131
3f821849-c168-4b1e-95ee-e86147ab920d	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$k60Ol/z5hO.AahDKm6oBhekksh7F1txv.VcOXeMVZZc8mtwKwyyWi	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-05 10:07:17.16	2026-09-05 10:46:23.814	2026-09-05 10:07:17.161
129bdab7-adfc-4f58-821e-8e731dd72cdc	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$bbzYE/usqiw79KL.Kqr9OeCNpQXEY1omlVGQOX4Xd8a8zzcWpnaWO	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-07 03:36:23.109	2026-09-07 03:43:18.903	2026-09-07 03:36:23.11
432aed7e-ec18-4eed-b3fc-b37421aa586b	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$Xtpmu7vSZtaf7E0hs55DEOzcy0I1WxMyH4FSsmh7uVAiDCMRZ0izO	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-05 10:46:36.326	2026-09-05 10:47:49.368	2026-09-05 10:46:36.327
ff689cf6-dc65-439e-b2f0-0b11c308ade1	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$dKFtjURxY5I7NyAcfaQRMuYXfBkJdkPt0MI/EogXS76MoGChSGmF2	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	127.0.0.1	2026-10-06 01:13:00.099	\N	2026-09-06 01:13:00.1
185303bb-a0d7-4361-9f61-a3e619e370cc	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$VRS90TLRaLymkx1Urxpi5.bqFGOoNHPAIHDE0qFqIeY2j106hEZUK	\N	Expo/1017880 CFNetwork/3860.700.1 Darwin/25.6.0	127.0.0.1	2026-10-06 03:55:56.81	\N	2026-09-06 03:55:56.811
90928e90-bfa0-4d5d-bb8c-b3278f61f107	334b2294-9bba-4f31-8290-5a87484a62f0	$2b$12$UIudhLePk4xS/uo6y74oIe77zQo.YpBODj3A7CLKwHGaeSdV1LYMa	\N	MLGroup/11 CFNetwork/3826.500.111.2.2 Darwin/24.4.0	127.0.0.1	2026-09-28 08:37:13.608	2026-09-06 04:47:46.625	2026-08-29 08:37:13.609
95eb9817-3cd9-47b4-9124-23349b166c57	334b2294-9bba-4f31-8290-5a87484a62f0	$2b$12$iLD53CoezVL7VDWnBk1/SeSM28oUYyUuAWDynKByvmCnAsd8.RRAC	\N	\N	\N	2026-10-06 04:47:47.264	\N	2026-09-06 04:47:47.265
6fad349c-339d-4c0b-9ddc-730b6ca215d1	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$8j94lFvkayaky6wAL0OWEui6Dodjge8HrXej5bugIKe/RGPLfGscW	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-06 06:30:58.922	2026-09-06 07:27:25.432	2026-09-06 06:30:58.923
cdcb8c0f-9e9a-487b-9a4d-1408ac6a283c	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$suWezsHKZvsZ4jIlAMQEteznmIvJnjmu1zyJ/g0isevv.Isitk1la	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-07 07:08:55.82	2026-09-07 07:16:26.32	2026-09-07 07:08:55.821
edec374a-b0fd-43dc-8030-561f58495312	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$sRklBkqgUNenwNvKEs.TFO/CHhK2ZAFhac/WhrCJUJJEXxV2TFhjm	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-06 07:28:11.526	2026-09-06 07:28:35.38	2026-09-06 07:28:11.527
54541b47-9c0a-4fd1-a66c-d41541970e02	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$jKpk6tPDECMScYc5HOr9EeEn7wfNJ/bN09WglSjXeK8V9GnXPWjV6	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-06 07:28:47.649	2026-09-06 07:43:44.783	2026-09-06 07:28:47.65
a7909ca4-ec02-42d5-a7fb-3f67b7cc6d1f	31bb72f7-e5e2-493e-827d-3320e1054461	$2b$12$q3vQzswiZafXZXaFxg97IesSx5wOKghp9FfJQ3k6.IwzWpZZm2l.W	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-07 07:50:17.505	2026-09-07 08:00:38.382	2026-09-07 07:50:17.506
f299a3b9-cd6e-44cf-8d2c-e9407cc75b37	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$o8grhfH8FWXdxc6um/WcAOP6sM3tnJKBqzRs5rf7jlr6xMnM7E9Ke	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-06 08:28:12.527	2026-09-06 09:13:19.872	2026-09-06 08:28:12.528
1af211bc-23e5-494a-8779-1fa392c323f5	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$bZotilD0qW82FreNS7qDz.f735HIqM3qjfOe11AbdDq8KNJDXPCPa	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-06 11:25:39.583	2026-09-06 11:30:55.059	2026-09-06 11:25:39.584
f8d904f3-9027-46e3-a5d3-b6090aea04b5	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	$2b$12$TA.FQTpD/5Ui.WsLtSBiaONbKaHRWXyHiEhkqqFTn2fhIk1lwOBSS	\N	\N	\N	2026-10-07 09:05:49.68	2026-09-07 09:12:31.138	2026-09-07 09:05:49.682
0400a328-bbb1-4193-a176-e2fd419d5aa9	31bb72f7-e5e2-493e-827d-3320e1054461	$2b$12$VbTmBsfW0H1cZHZCr2sAu./.128kd2IIOxdHr1WUWXToBTB4p.Vbi	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-06 11:33:47.077	2026-09-06 11:34:29.312	2026-09-06 11:33:47.078
ccf75642-33f5-45e5-b64b-ea4f054b5ba7	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$FB9yS54eqIfDNnkSErMMA.lkn/.Y.xnrnC.zw5bddAqAc.idwMSK6	\N	okhttp/4.12.0	127.0.0.1	2026-10-06 08:30:24.263	2026-09-07 02:44:42.452	2026-09-06 08:30:24.264
1e29a9ab-bc6b-408f-b9ec-6b0205ef34b3	05ff1cc9-4cb6-4d87-a74b-0391a5539537	$2b$12$Egpk1X37fH.yvqmN90PtW.bzkH4uukuHGjr5XBhSMlMc95t5qk1SK	\N	MLGroup/18 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-06 09:17:23.919	2026-09-07 02:53:44.356	2026-09-06 09:17:23.92
582a5993-13f7-4e91-bd9e-7bb01dcb98b6	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$GirIKogBTS6llRC64nKgRO3isPj7peBPPVyVX0BjH8Rxz08lPpcXi	\N	\N	\N	2026-10-08 03:05:18.589	2026-09-08 04:06:21.269	2026-09-08 03:05:18.591
0f99d7b9-dee1-408e-8cf2-7ba9e5065ac8	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$z4Foj5y0o2u/wKckOfSgzufViBF/zfrWh0dkU4th.YTfaC/SqH9KK	\N	MLGroup/16 CFNetwork/3860.700.1 Darwin/25.6.0	127.0.0.1	2026-10-04 03:28:21.987	2026-09-04 03:28:48.797	2026-09-04 03:28:21.988
f4269c09-c7e8-4caf-b271-870ed5676cf5	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$qi60MlHRKut40uFtL9nMHOamCndx.rQ1OKYspikDzEW2nT0Es5DCK	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-07 02:56:17.399	2026-09-07 02:56:36.551	2026-09-07 02:56:17.4
7e0cedd2-2f95-48f5-8abc-9bb28a96be5c	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$VU5B1YZuXD.jTt17MnOT3.4uDo3pgdG/rZR1Qby0JxqWhDUI4kctu	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-04 11:15:32.788	2026-09-04 11:15:46.497	2026-09-04 11:15:32.789
60583115-c50f-4680-96dc-a8210cdfeb43	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$GjJAQlmvEwpI3cT6twdDQOX0K9bs0hC2RJHeAP77Nn48h6PYILSgy	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-04 12:22:21.127	2026-09-05 02:50:06.068	2026-09-04 12:22:21.128
adcf45e5-6234-4c11-b0ad-f17d8acc92c3	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$n1w5aa05TGXBhEfKlrkY.eCzF1Ze/LVyhRWpkbgRXt/h7kVpJYnW6	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-05 03:27:30.332	2026-09-05 03:52:49.838	2026-09-05 03:27:30.333
c0b4618b-ebaf-4399-ae28-975e68ee9a71	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$Jvclr.0cZCoX6dVQFQhkSuaad7m7hU.xdkpEi31x7G9IlREXHH48e	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-07 02:56:49.104	2026-09-07 03:16:53.441	2026-09-07 02:56:49.105
fad9bb11-56cb-4531-966a-012857ac884d	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$uqyyMPj3ZjqmoLJIe98ga.5esic3n18Sx3RFzIY8sSnUujr6rWmvC	\N	okhttp/4.12.0	127.0.0.1	2026-10-09 04:57:22.249	2026-09-09 05:00:25.798	2026-09-09 04:57:22.25
d1bf5dc5-7bec-4e6e-8cf8-7f0fde916a3a	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$eflZ5bMp8Y8017kqRJzHi.piEzuXNjwZUEqTdfy33oIGs07pusa7m	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-05 06:58:56.684	2026-09-05 06:58:58.184	2026-09-05 06:58:56.685
ebe35dac-3143-44a1-832b-5fe9fe702c9a	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$EogoVXZlsXMK9pnY3v1y3OqdsMFwO1e4G/ftyNBmGq./1faJfyRwS	\N	MLGroup/18 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-05 06:58:58.637	2026-09-05 06:59:09.622	2026-09-05 06:58:58.638
b6e5b26b-a0e4-44d9-afbe-d8ecd94dc48a	31bb72f7-e5e2-493e-827d-3320e1054461	$2b$12$.lfqc.F/Mh99zaE2xtsuNOnlj5ku3dt7fy48S3LtGt84PFNeoSz3m	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-07 03:41:24.647	2026-09-07 03:43:06.842	2026-09-07 03:41:24.648
e7fac546-89f0-465d-a72f-744cd217602c	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$0RsXK/UO.ppwna3Ls6sJDupYnDp1jQeFYMq/Q.PXm08wxqnoVmcU.	\N	\N	\N	2026-10-05 09:38:56.822	\N	2026-09-05 09:38:56.823
4de76fc2-bc61-4d2b-b8d5-8a55a3018178	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$0pZDg5ZSqioj9vf5bjVWguJIZIybEfEbhBso91pj/uj4uQp8lYetu	\N	MLGroup/18 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-05 09:38:58.369	2026-09-05 09:39:27.426	2026-09-05 09:38:58.417
c164f4af-c740-4a7b-9e9b-5ac7102f97de	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$2I5Ab0NsoN0rGHsdmtiNU.misdRdN3b3JbIxegSitGvyVVN3bUj/G	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-05 10:04:39.957	2026-09-05 10:06:24.773	2026-09-05 10:04:39.958
dacc448c-3c31-4b8c-b684-a01f39d54f40	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$qdUeHq740gWywf89J8faH.FxzirtIXXMikhYbIjOF..6de9ctitji	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-05 10:48:09.103	2026-09-05 11:26:13.948	2026-09-05 10:48:09.105
ff18d22c-d64e-4dab-a2f8-2c383d7ea7f8	31bb72f7-e5e2-493e-827d-3320e1054461	$2b$12$5dTQ9RcepXGXhRj55kqhsuZrVPAR7BEImTD.eSdR4F6EFtozJ4NWe	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-07 07:16:44.781	2026-09-07 07:30:09.772	2026-09-07 07:16:44.782
8598c2da-75de-4ca0-a641-77ab85a3dc5a	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$d8.j.7QFYfLli3T5WUQuMeqzNKfPh2Ny0OSVGUkko.oyQopDzrpzO	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-06 03:54:30.588	2026-09-06 04:20:07.897	2026-09-06 03:54:30.589
bec5456d-0a37-4cd9-8b1c-146f2491d421	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$BxaH2lDi87P.RS9TXAdqOO3JY6kQ3YuypPKS7KYhWKKtFeUwK7UPK	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-06 04:20:18.485	2026-09-06 04:20:49.696	2026-09-06 04:20:18.486
d5a689e7-3771-4b26-86ca-fe91b11ef4bc	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$8d6hqXSeTe3a8YMFrZ0gkuEbI5iwVMEhr8eEFDZGXbG9dP6zeR/PW	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-06 06:24:23.46	2026-09-06 06:29:27.873	2026-09-06 06:24:23.461
44640f5f-9251-4688-bf25-a58207c4aa1d	05ff1cc9-4cb6-4d87-a74b-0391a5539537	$2b$12$hgh408EfniW3cML6B2ul4.okJdE9.EnXeH6/XTz6viquAp/ml7WtO	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-07 08:00:51.607	2026-09-07 08:03:10.712	2026-09-07 08:00:51.61
eace46c4-c4f5-4b35-93b8-e92fc0c56d80	545ef296-1135-4885-8e61-89932645af6c	$2b$12$pkRUhVq3.SHSE46Obrlvie1Sjl6f1NKonRLVkpqEJE4uFtrOG7ehG	\N	\N	\N	2026-10-06 06:43:47.83	\N	2026-09-06 06:43:47.831
23305a30-deda-4da2-80a7-2492e1ae2e77	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$SkxTR64Hagc.qzMht/fS/.i8RXyg40uLybtXFLp8KKWE1.H8iFdsO	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-06 07:43:58.785	2026-09-06 08:27:38.075	2026-09-06 07:43:58.786
10949881-de63-4620-90f7-aadc8817288d	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$Yqel0jzXu1X9St4BN5YePuYDkVwJIotclKG/TyNnFPJNzUGx9J7mC	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-06 09:15:34.852	2026-09-06 09:16:11.047	2026-09-06 09:15:34.853
c957171e-55a3-4aa5-8ba8-62b93b51bbb7	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$q0zMjRv.onPcCa7uLvJ.fOsHpDKf.BYZw7GtIB50KUpTET6XzQpwK	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-07 08:03:20.82	2026-09-07 08:04:17.907	2026-09-07 08:03:20.821
b3eb4068-3492-4b87-9dfb-8c2849ff378f	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	$2b$12$bhMSx/cQeQTbo7UDXGnpwuxBCnJJTmX2NuBn7XOStEkiqEpvXE2Xq	\N	Expo/1017880 CFNetwork/3860.700.1 Darwin/25.6.0	127.0.0.1	2026-10-06 09:50:14.075	2026-09-07 08:04:34.876	2026-09-06 09:50:14.076
9ca54717-3666-4fbf-a350-ae349445e665	31bb72f7-e5e2-493e-827d-3320e1054461	$2b$12$5mo5hrCiZ0TVQY7UzEVPiuX6j2kVHw9FrXGsWQZMwOr9TGQSPlNC.	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-06 11:31:13.537	2026-09-06 11:32:00.247	2026-09-06 11:31:13.538
d9d41621-7d28-4afa-9c65-65804e82d283	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$KgBX.RsDHKmiPLBBkNox9OFBRoyFI5n9joaOGV639cBWr9hzo9N8C	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-06 11:34:42.504	2026-09-07 02:44:29.811	2026-09-06 11:34:42.505
0ef31646-92fc-47c3-a229-80125d537c7d	05ff1cc9-4cb6-4d87-a74b-0391a5539537	$2b$12$l6Osyr7FYEA83xmnlauo/eoT1wZBVera.4cS.Wt7PRy.O.aUK.Wxe	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-07 09:12:43.513	2026-09-07 09:13:03.988	2026-09-07 09:12:43.514
1f3ce3dd-793a-467c-9f31-64f0f12a3c89	31bb72f7-e5e2-493e-827d-3320e1054461	$2b$12$jnYqpX4TgfWKapMgM6dSzOGTMmXVmMoDWgccKGZAmrvrU.DpiUwPK	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-07 09:13:47.063	2026-09-07 09:16:57.476	2026-09-07 09:13:47.064
87c710e7-9d27-4738-b652-cd24964ff9c4	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	$2b$12$jhq5LS3ZImGlgzcaeYQSR.8olyq6WjbVE/ldsUmsnQsJ36M/Bn7ue	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-07 09:24:21.238	2026-09-07 09:25:06.505	2026-09-07 09:24:21.24
ee7c4b5d-36ad-4f37-b811-ffa524f177c2	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$FDVy1/38iyaEp0kRpuiaE.iOcr2PEvmAR57sT50dLD8H2vjj9n4Q.	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-07 09:25:23.548	2026-09-07 09:25:52.265	2026-09-07 09:25:23.549
d2aa3243-32c6-4c50-a4c8-90c3bfeeb075	31bb72f7-e5e2-493e-827d-3320e1054461	$2b$12$LtTo51MfJUxynFb4zjOMjOyDWJlFIe5w1fCUiU.EvH3M2dmsD7sY.	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-07 09:27:13.451	2026-09-07 09:38:33.089	2026-09-07 09:27:13.452
765bdd79-5936-459d-b8d8-5e3d7d2bb5f5	31bb72f7-e5e2-493e-827d-3320e1054461	$2b$12$pKUgUqke2o8WBZd9Lp5O4uy4xJ3MsDV8D4tOK2Xx1KlBT6TZRjaFy	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-07 09:42:06.02	2026-09-07 10:04:20.816	2026-09-07 09:42:06.021
adcdbfb4-4856-46a0-9eb0-0a1ae2bc93fa	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$XJKhnS9FXWE3zgyucYpP5e5dU4PJslsOMha1ZGZU9drHF7bIrPqD2	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-07 10:29:54.047	2026-09-07 10:42:05.229	2026-09-07 10:29:54.048
588a9178-43fc-4779-beb3-ffebe1bf5d2b	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$eHa.l3CDnbrSoN14B8/l7e1ztKWvuIc8Ts4qgwXB7zgHQw2i5jGL2	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-07 11:02:23.48	2026-09-07 11:05:07.586	2026-09-07 11:02:23.481
37e7e8aa-a6e8-495e-88e9-c64f3b249165	05ff1cc9-4cb6-4d87-a74b-0391a5539537	$2b$12$YIoDkDsE1P5HL3b3LT136.ldMJHN..q65dq.7NwUiTGGHdE8yF1Vu	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-07 11:06:09.64	2026-09-07 11:08:07.083	2026-09-07 11:06:09.641
fd90f6ec-b8f4-47d1-873f-1b3fc2739476	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$c8g3XfXBh9Q8oojGC2RI5u2Jp2YQ7imiZy9.5OUMDbH15hiqG2A32	\N	\N	\N	2026-10-08 04:06:21.9	\N	2026-09-08 04:06:21.902
b2fbcf71-f296-4e3f-a465-93b4a20209cf	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$fZlCJKJwspAP98xdmZwfEeWysuT4FsUzNvFlMVGKCZ98/VLJx5SEq	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-08 04:06:34.045	2026-09-08 04:49:42.841	2026-09-08 04:06:34.046
d388a768-6652-4ce8-b2cb-868057031daa	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$C8H32zfwqqzJW/LTwcqa8eAMLXBLks/mE5a4MnVbxjWqzcjzYC2Bu	\N	okhttp/4.12.0	127.0.0.1	2026-10-08 06:49:18.387	2026-09-08 08:31:30.999	2026-09-08 06:49:18.388
632b24c4-bbf2-484f-aec3-c05edcf416e9	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$yREUzBCGWY1pdCeVDrGhfO0HTBt5/AsxbE1vcfEO2wL.WqBB4eveC	\N	MLGroup/16 CFNetwork/3860.700.1 Darwin/25.6.0	127.0.0.1	2026-10-04 03:29:05.265	2026-09-04 04:24:43.59	2026-09-04 03:29:05.266
3ea65c29-41ff-4245-85d9-46b802433d10	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$H4Xly89FmKPZL.43gZTgrOcC474pUNb4yp2wbzSMBzDbawg/KprFO	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-04 11:15:52.578	2026-09-04 11:16:01.711	2026-09-04 11:15:52.579
5b944ee1-964e-4d7b-b3d3-5a8ecce8eefa	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$.fsejfIveDfYaJc0Ar4jpOMuGNd1uOje69OL721Wb7ufgDB6bSU0G	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-05 02:50:19.273	2026-09-05 03:02:39.968	2026-09-05 02:50:19.274
12d297fc-6f6d-4a17-89b7-218758e6b619	05ff1cc9-4cb6-4d87-a74b-0391a5539537	$2b$12$XhIKscBZfP8RNC132t5hKelQHoc0YigqG/XvJ7RhLeBbZYyTEnwPK	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-07 03:17:18.284	2026-09-07 03:18:57.558	2026-09-07 03:17:18.285
e868acbc-969c-4156-a19d-839a8b2ffa85	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$nsp3PRfbM.uj4k0d9/N0reB33ygNXMk9i8TsWezfSgzqbMzhM8cLK	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-05 03:53:02.035	2026-09-05 03:53:29.144	2026-09-05 03:53:02.036
0d13eb06-09a9-429b-a472-d7124c39f74d	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$wgqCI1z6GxVQOTQr84eNAeFM.3sww8W64MxTgmmP1HyIqAPNQbGjm	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-05 06:59:10.024	2026-09-05 06:59:26.703	2026-09-05 06:59:10.025
c6057716-072b-42a4-a523-b4000e5c2aa2	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$Q5fYBJtLcVU4sqK9WA6PsewawpBKmj3AQOd9bB1egTcSIo2wURQui	\N	MLGroup/18 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-05 06:59:27.048	2026-09-05 06:59:53.638	2026-09-05 06:59:27.049
dd19c833-4b37-47ed-889b-fa7b2c8bb000	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$gmkm0ov0KYpV4byz9A.nx.FjTqpTPsUG3BkuM4InTsMkpgLt1fLsq	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-07 03:43:19.302	2026-09-07 03:43:37.808	2026-09-07 03:43:19.303
941d9fe5-7fcc-493a-ae4c-63fbcea6967a	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$OO2lrjuMGzEA1AbtLN8JlOgble6oKGEO53UjXcrph010DHyxKeE6W	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-05 06:59:53.939	2026-09-05 07:08:33.729	2026-09-05 06:59:53.94
7453e56b-0092-4300-86bb-eeab139e4755	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$3x4XtDkV4qHgeFKmh3aC7e4AY6xMLKzAxcXeaildpX6ROXIcdm3Xu	\N	MLGroup/18 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-05 09:39:41.504	2026-09-05 09:40:30.015	2026-09-05 09:39:41.505
1349379a-0e91-4c7d-8e5c-7cbe884787c5	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$dmPfc9MzYniFQuqQtAjbWuNOn8.TKZcOoABIIDy1B8sIPH1jsfst6	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-05 10:06:41.012	2026-09-05 10:07:05.034	2026-09-05 10:06:41.013
85635f52-af2d-43f8-a070-baa29f6e0701	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$t1DZMW7r2LzCKHlJesH89O8s7nKV08sUxN3pdQbKpwJ9OMQMTrlP2	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-07 03:43:38.102	2026-09-07 05:01:34.103	2026-09-07 03:43:38.103
2fc15fc0-5f4d-467d-a0ca-2efb4d17fbb6	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$c4iMQyiW/6uqioxIV/IVtuRlu5vJrVLNptUBVL7EmRcHAXYK221I.	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-05 11:26:25.304	2026-09-06 03:54:19.601	2026-09-05 11:26:25.305
25bdc491-ca8a-415a-925a-30c7383e5671	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	$2b$12$Wnib2wEc5akmgrkZBOjwOeZ5Y.RzL1SmYp.GxFBPVN/k0evvoTzTS	\N	Expo/1017880 CFNetwork/3860.700.1 Darwin/25.6.0	127.0.0.1	2026-10-06 03:55:28.53	2026-09-06 03:55:47.513	2026-09-06 03:55:28.531
d414ef77-6ee3-4dd9-b4dc-c8b82fdeda88	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$VThG1UnNcyNfrSaiHs7cSe/fmo3.j3kqJC.LUth8MsHU26O3.u5nq	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-06 04:21:05.814	2026-09-06 06:24:11.876	2026-09-06 04:21:05.815
6d5eabe8-ce92-44ef-8588-59ad24b752ad	05ff1cc9-4cb6-4d87-a74b-0391a5539537	$2b$12$XYiGbWiXt/4ODBJOJu31TuPZInNVDVgTamss5MjEkovTTs3s6ZMma	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-07 07:30:39.294	2026-09-07 07:49:53.696	2026-09-07 07:30:39.295
7f1d01a5-367d-4b71-a170-99d0c51392cd	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$ZiTNjUjQEO/cHRdBCoWEE.GgRPb1yLycSoZ1WfwsFSSphiRAfjKGS	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-06 06:29:40.451	2026-09-06 06:30:43.545	2026-09-06 06:29:40.452
2e6deff8-05f1-490a-8890-19e2d8f46e44	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$w83YvOEnM7vXCq7zaQQgleudmT.ygRFZzX/cQsTQ4b8TcifO14f3S	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-06 07:27:36.743	2026-09-06 07:28:00.237	2026-09-06 07:27:36.743
14373c0d-0441-45d6-9545-a4e285429a4c	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$pBUdmJZu3qvUoUI/7dfT2OcqaMI9LNLzIJQFI23KH1cf19CvAQ0sa	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-06 08:27:54.246	2026-09-06 08:28:01.148	2026-09-06 08:27:54.247
eca7531c-7789-43c8-8d33-ec2d8d145e7f	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	$2b$12$e7o.SFmHRHCFrsPhpwE3LOLs.9zvbxpG8VCMH.TTRyg.2y3qCO.a6	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-07 08:04:35.22	2026-09-07 09:05:49.073	2026-09-07 08:04:35.221
53818ed7-17fe-468a-97a8-6f7efbb4bf91	05ff1cc9-4cb6-4d87-a74b-0391a5539537	$2b$12$0QojGeJ.ZjSvTomen5D6au.F0QRWIAnXfeovPLeYwYc3DHP3gYFky	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-06 09:16:21.859	2026-09-06 09:17:23.564	2026-09-06 09:16:21.862
b0c1dd68-4052-4efb-bc92-b9dafae093a9	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$2fldZCZOjYPWo2p4H/SyCOw2OBj3Mt4/r4SrO.688iRuRPY5KePkS	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-06 10:07:50.18	2026-09-06 11:24:28.003	2026-09-06 10:07:50.181
e72607a1-20f4-42cb-9f5a-bc84127cda5b	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$3n7DBN00E/oeyg9W1jzfpetz1/cWhvweu0oRfYwxyJFoXpIPTEKiG	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-06 11:32:16.949	2026-09-06 11:33:05.657	2026-09-06 11:32:16.952
e2a1a77c-b895-448a-88e7-572b683eb493	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$RF2sJE/dtFVegtxsqHQNRe.QfCHrTWM4u.spEpVdQlo.Gk9YlyxtS	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-07 09:13:20.376	2026-09-07 09:13:33.556	2026-09-07 09:13:20.377
7cc690eb-7d31-4e13-acb8-25a8c2a767e9	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$xB0FN6rlx8XeqUmzuWr/s.zC3T2j5v0mKAJlAByfONy8kWsyEG6vW	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-07 02:44:42.834	2026-09-07 02:52:59.93	2026-09-07 02:44:42.835
afa4d9f1-6825-470c-b917-da97352e096e	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$yWfhmuEZSyTmlXtNWjzhXuP1H2iATYDpgLkeyeHYsdDYcvXL.F79W	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-07 09:17:09.606	2026-09-07 09:23:57.125	2026-09-07 09:17:09.606
21a9cb70-c86f-4cd3-9906-ee703bbd6658	05ff1cc9-4cb6-4d87-a74b-0391a5539537	$2b$12$9.1NppIeV6Y.MBkiWAuSt.t9dQ5n5IWnRgqc3pv6SNg.rbx28CaUm	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-07 09:26:05.547	2026-09-07 09:26:26.86	2026-09-07 09:26:05.55
181183bd-a603-4e5b-85af-4b6a7bd4aa11	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$7f9EjgAGZGs88YDUDD2OdeD/5dz3IPuQVy84oqILhGp6jbmwti10S	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-07 09:26:40.928	2026-09-07 09:26:56.109	2026-09-07 09:26:40.929
90993c87-7d70-4475-87dd-8094a218d519	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	$2b$12$s5EY/spmfajkBM5jaLPCAu0Afrl1C8CGsnpQgbyY27gh/X0sJGlr.	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-07 09:38:42.097	2026-09-07 09:41:48.951	2026-09-07 09:38:42.098
00e05c4d-5c4e-4009-bfb9-6cdbf758330a	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	$2b$12$yWEYXfCD8rz9TKi.zN3/8eN5z8VC9luO7vt8hwyW3lTaNhCbIj7WW	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-07 10:04:27.302	2026-09-07 10:29:33.272	2026-09-07 10:04:27.303
93a9404a-d1ed-4f46-9edc-344d7004965c	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	$2b$12$NPbE5iT49uy7eB64/sz3JuaUZkrxg5zwuXQa8ydeXVDEpMKhrCWKW	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-07 10:43:07.387	2026-09-07 10:44:12.738	2026-09-07 10:43:07.388
67212a63-268a-4583-b275-b1ec9256b6bc	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	$2b$12$msSjeXwflp7nQ9NME58EQ.jXBomhoamZSqzptdVNZ03o/QconC4SC	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-07 10:45:35.019	2026-09-07 10:50:55.973	2026-09-07 10:45:35.02
ca1d77ba-2f19-447f-8da6-2d945d9eb35f	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	$2b$12$OuhW.Ek2D9nNwpIWGfjr1.ZMqJTp3brJghNVPiCk73Ixc.D5zjxaK	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-07 11:05:13.307	2026-09-07 11:05:53.84	2026-09-07 11:05:13.308
0a986912-740c-42d4-9c5e-832fe5cea91e	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$FIMM9/hrqzuCRBZPahs5ReATOlDN4Gclc0CP6IAxWi0ziS3FDnEZ6	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-07 11:08:19.998	2026-09-08 03:05:17.96	2026-09-07 11:08:19.999
bd860ec0-0d1b-4100-90b1-208d841af710	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	$2b$12$skHq6ItIKiHUkPGu/1nvOeTA48fAol4m0LU8MmobavUNOn8bXesay	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-08 04:49:49.045	2026-09-08 07:14:59.384	2026-09-08 04:49:49.046
4251ad73-bdd9-4ce7-934f-9c3a79041221	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$UXPLSMK28YRSsfEfUaICB.opV/5Pxj826Z/ChT2Mo7.OjbO5AV7kO	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-08 07:15:14.546	2026-09-08 07:15:29.305	2026-09-08 07:15:14.547
c86830f6-6bdb-4c81-bd3c-e62ec9d94eac	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$LsAnM4BOT2ee4CoFxkxKVeRqOgtwVo/viJ46gEGJFHxOS.pKNmziu	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-04 04:24:43.971	2026-09-04 04:30:32.139	2026-09-04 04:24:43.972
b660e5b4-e80a-4c6e-b49d-c6276a028a86	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$07aDzT8asZf8IuRExyGSjOj1dDtnJJskseJfDYYjEqa.ikwFU1KuG	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-04 10:59:29.784	2026-09-04 11:02:50.622	2026-09-04 10:59:29.785
18689865-cabe-4662-86be-5305a785e03a	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$DKuiLTAEJijMuisKjnFFvOidOFX7pXSprrytf1ghN2bSwUu9YB9mG	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-04 04:30:45.745	2026-09-04 04:31:11.252	2026-09-04 04:30:45.752
03917c93-00ad-4215-ae81-f9df4b26bf32	31bb72f7-e5e2-493e-827d-3320e1054461	$2b$12$wozZ1isf3bIgCn576eTaGuAt/IMpYnCfwet/IgeMHDgGQgCm4vUiO	\N	MLGroup/18 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-07 02:54:18.974	2026-09-07 03:19:11.647	2026-09-07 02:54:18.975
02dd22ce-e466-44db-a281-a1bf1e92a2a8	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$IoPydlE7.N1HzZDyuidhmuuKyd0coAQ6Li5D08.zVG/p.7BtiBfs2	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-04 04:31:17.472	2026-09-04 08:34:52.978	2026-09-04 04:31:17.473
0081a62e-d89c-4ce1-8160-da9986338887	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$bDaAthWRSyASHJ/nDYtVNeUjO78jtM8VRfViy0x967QWixyvT084O	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-04 08:35:03.631	2026-09-04 08:36:12.005	2026-09-04 08:35:03.632
b847d6e1-056a-460d-8916-8d16ab06d4ad	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$F2UTUJKMFvBFl0Li8ek/cevlKsHT.xxLNqmPEmyJpxuESNgFtX4ma	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-04 11:16:13.374	2026-09-04 11:42:28.069	2026-09-04 11:16:13.378
3fb42557-a9a1-442b-b9ea-0dcfe6664357	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$ooBU2UwzRDDRsoK7U1ntJOIqWOEIx8otnyOD1LEy23JpRkrll5L1S	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-04 08:36:19.052	2026-09-04 08:42:13.772	2026-09-04 08:36:19.053
4a8af2af-84f1-470d-9d69-8d7a9f655b7e	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$21czwLT9s8YNwzxB2jJGs.7FHQKCSP5ZiYnqNUjA25YEBdZpjs3w6	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-04 08:42:24.83	2026-09-04 08:43:20.464	2026-09-04 08:42:24.831
f02550b4-a3da-4475-bb34-eefc1acb95a9	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$mPz9vluUM8APaSyVU2zob.OVeFApHhcXILS2XYHVXxAwvnMpH8Aeq	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-04 08:43:26.745	2026-09-04 09:09:09.209	2026-09-04 08:43:26.746
456da125-ce34-4c4e-95f0-294df23c15b0	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$Lu5X6ij7uS9P4CeyponGyOyDJ31NBNlk6/lYTt37uVZqiE8Mp53YW	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-05 03:02:57.341	2026-09-05 03:21:40.918	2026-09-05 03:02:57.342
f3259d2d-addf-4560-b0c4-ab07fe9f6de0	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$OamzjaunOqbTCbBTofGkde9w7B4wp0StK7AJndhUD0AjQawvbOjmK	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-04 09:09:19.773	2026-09-04 09:11:34.348	2026-09-04 09:09:19.774
a61bd499-24a2-4270-9377-627df21641af	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$rVk5pFAJXSQsRZI/jvLJbOUGg41TfQdWmSJxiMLu223erXoWOuSH6	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-04 09:11:40.436	2026-09-04 09:12:00.571	2026-09-04 09:11:40.437
1d3ab82d-57ae-47b5-af4f-661495e97980	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$4v.kuClRQmqAjdYwbtaMruiyfu2NboNVVcq.t3/fZqDIBKDk5TB7a	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-04 09:12:12.622	2026-09-04 09:18:38.467	2026-09-04 09:12:12.623
2f977b9b-be5c-4aa1-aeb4-1cc8c9a81dbf	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$1FVfD1x9o8zXTZjSdmkfruGJMbhoMjMiLLcwdRjsitF0IiGL8vPMu	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-05 03:53:43.811	2026-09-05 04:11:58.96	2026-09-05 03:53:43.812
9c3c801b-3999-4e26-aa5b-b6536b963b62	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$1hS5O12uP8N6erI5Iix37OmJ4vp7WdridCO1/WTApJJzwJGrjBpC2	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-04 09:18:44.635	2026-09-04 09:19:03.837	2026-09-04 09:18:44.636
5edb672d-25fc-4001-b112-d001892f934e	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$4ZdGHbUyYKXwLgeWzxu8Luxr3ocz9P2Dr6s.nlc4tzOLiP8nhgDLi	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-04 09:19:31.264	2026-09-04 09:38:07.192	2026-09-04 09:19:31.265
d4b4b05e-0020-4772-9c11-7f404e4a1477	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$s4LSD0xGa033g4Iri/kBFO.ebSyu6/lQ/jruLsbG/8tSB/juiMd0a	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-04 09:38:14.565	2026-09-04 09:45:19.732	2026-09-04 09:38:14.566
25118bc4-2e20-4285-bd1d-9ad1e7fc6756	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$oKTiEYAD9VoiLvvN/cWa8uBfmFEHvNs3M2.nEMawpZe.j6tXx.euy	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-05 07:08:48.422	2026-09-05 09:38:55.917	2026-09-05 07:08:48.423
03093513-faa4-45be-8f14-16e41b399b80	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$NbnmVsE5hN4wThi6YngR.uwCZz7n/2NOkIXOLUeEP857KeqSM53Di	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-04 09:45:36.989	2026-09-04 09:54:22.337	2026-09-04 09:45:36.99
a7fbb651-2df4-41b1-8794-6314dc7c4f5c	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$xMmos2pGbpVPDQCuLA9Vee5IWl7utkgvDiYF5Lpx4w8kdNbtYwQJG	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-04 09:54:29	2026-09-04 09:58:06.491	2026-09-04 09:54:29.001
c5d3c14e-8a01-4570-9401-419e76a31889	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$8iUgH8f0tMD.ZlbVYnLSZ.dXwq4zUNuEXHMxzjcVfCNpJF9EVvkru	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-04 09:58:17.463	2026-09-04 10:00:13.415	2026-09-04 09:58:17.464
b0ca5f08-e791-4814-a954-574a1628a1ff	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$R8pt9pBrBmYyE/4Ymd0HLu6n4HcqT6aTbUHnTiA2NhUmJno3p4ISS	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-04 10:00:19.95	2026-09-04 10:01:06.918	2026-09-04 10:00:19.951
cbcd6ea7-5724-4ec3-bdbe-250d3a6b1e69	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$zVxNSUkBhqdqpvRef1L8LO/1ebTaDVwFq8tCoikpp8/T2TInk5Uze	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-04 10:01:19.335	2026-09-04 10:03:35.57	2026-09-04 10:01:19.335
c1b8d65e-8f30-428d-99ed-de7b7dd66da7	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$sGDq.sh8/3S3rDU2k/Bj0.dtEyaeJXVNacly4j.yh8A3tz348tD0a	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-04 10:03:42.442	2026-09-04 10:12:11.458	2026-09-04 10:03:42.443
512ed6a6-6362-4e6e-89db-2afaa7569d69	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$ikY9NQx/KYrxSn7Ji6VmROlduIk9RnzeUV91KUsnHIHNRR3DQWFS6	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-04 10:12:22.62	2026-09-04 10:12:45.127	2026-09-04 10:12:22.621
c9723783-fe97-480e-b1cd-074e7611dbd1	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$0UOkud1chjpylguyDNGTweCvQKNlWeVgihQniPDny24kiWZG.55vO	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-04 10:12:51.098	2026-09-04 10:14:04.948	2026-09-04 10:12:51.099
4e40baac-e310-4b78-a62b-8c568f3a0e6d	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	$2b$12$TypstyNgHSh/3UhtAVP2hOcRvcb7SIKFKPIgNiWaeO15ytmeqtqre	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-04 10:14:22.648	2026-09-04 10:24:53.368	2026-09-04 10:14:22.649
b9180c1e-c937-4e3d-b536-8836884eaf76	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$XDYFJuIAyzhlRA9DzHsU7ezZr0qIqkOVHlCvw3gad.XcgTvYtmZz6	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-04 10:25:04.875	2026-09-04 10:25:30.736	2026-09-04 10:25:04.876
9f56159b-7750-4712-8f3f-06d01e92f43b	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$ECj7TvqW77mFdGhKRGvH8uFQsiAet4EitghDyh2.YB01fJZxAHLee	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-04 10:25:36.943	2026-09-04 10:28:50.462	2026-09-04 10:25:36.944
527936f2-ded2-46e3-af34-ed314ea81f31	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$Q8jSndbM5U3niVSs4Mn.kO2OObZLd5v8cqAIxu6klXf4hItC.UX0q	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-04 10:29:12.564	2026-09-04 10:30:26.432	2026-09-04 10:29:12.565
f058085a-0598-43d7-88f1-fb716202aa16	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$YmOPPKCBhpegsvGs3kEk.uyaqlQmfHmUcs4xNBEiDXUQG0.tOQxk.	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-04 10:30:34.782	2026-09-04 10:31:04.058	2026-09-04 10:30:34.783
353e1658-c876-4726-99ff-177fb9d049ea	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$wZo.kaGVCMucNaxi9XZO8ecqPvJj1qAfcsWXsBfnJmQxjaY8LkWZC	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-04 10:31:17.865	2026-09-04 10:31:29.561	2026-09-04 10:31:17.865
9546531b-9c08-452c-b20b-af7aab7d7753	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$lw5Ntuq4Yp1l3BDUj62/zusPTauwIe7RH57krV796poDXMEqic7y.	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-04 10:31:35.995	2026-09-04 10:34:14.444	2026-09-04 10:31:35.996
2f1eb4a9-23d2-44dd-994b-565894628a5f	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$paRSv.AJR6/3x7VuD6F63uq2.JEjsawralhkT06ntQ0eYfuDT0R6a	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-04 10:34:31.462	2026-09-04 10:39:21.936	2026-09-04 10:34:31.463
26b0bbad-583c-4e4f-9c32-af7d9a18e3c4	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$9idY.2vHMAzjG.KPlOgjAuJ6gbdaht/93FgsqbC0zi9ABRRVQwv5.	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-04 10:39:31.338	2026-09-04 10:40:28.482	2026-09-04 10:39:31.339
bdf70b07-5b66-4768-87bb-09bdcab1272d	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$QRCfQ0Za7vtsBkVYPjI5kONTvEgSUpZAvpoK5XP.YdJGEVrVQsucW	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-04 10:40:42.506	2026-09-04 10:59:23.175	2026-09-04 10:40:42.507
0d0bd070-c5d7-45dc-985b-0ae12b28e13c	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$kpAHM9IYX8lZMhgCkaZmsuHg3oZ6Z/YAKxzalfWU8jRF1SWJOHOP2	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-08 07:15:29.73	2026-09-08 07:22:18.38	2026-09-08 07:15:29.731
4afba328-f37c-41b7-bf15-3a17dfd62326	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$6bQ057BRbJz7uaqNwPXjzuXoe.v9zv/ALcidrBcTlb7jyhxitrfZq	\N	okhttp/4.12.0	127.0.0.1	2026-10-09 05:01:47.959	2026-09-09 05:13:18.232	2026-09-09 05:01:47.96
6a6718e4-01b2-4719-9ce2-35e2625ff702	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	$2b$12$CviUrbx9oqpsASW0b7gl/.Qo3QA.hnVqfrx/RIEnoO6HhHStAsDAK	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-08 07:22:27.886	2026-09-08 07:23:07.06	2026-09-08 07:22:27.887
d3b91d5d-5ddd-4e36-8d94-dc8a2e0b981a	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$Q73jlQjuIMK3NOG/MEPZfOAk/iFIfhbD2V54N2ximdrDQpSYxcLaq	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-08 07:23:20.862	2026-09-08 07:23:53.609	2026-09-08 07:23:20.863
f9c9f32a-65ad-4083-bff4-e68c9d701970	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$o.WiG/D.3ucA3s/DDbjpNuTr87GjCsXGz2NrbgvVRmGEl1vVPgKSG	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-08 07:23:54.013	2026-09-08 07:24:19.056	2026-09-08 07:23:54.017
e0c8fa58-134d-4af7-92eb-e061f8ef16c9	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$vedBcBBgKW4j4gkap78z9OCxi5nl0/WUudvtlL/6iPXUS5tuOx8J.	\N	MLGroup/11 CFNetwork/3860.700.1 Darwin/25.6.0	127.0.0.1	2026-10-08 07:27:56.742	\N	2026-09-08 07:27:56.743
a835eb41-0fa9-49f3-b9cc-e326529389fa	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	$2b$12$0xzU6t7A1aXjFbRKS1snvuQ01HKEBf8Gwxm4.V7kKvQpZtmtUD88u	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-08 07:24:25.474	2026-09-08 09:05:20.462	2026-09-08 07:24:25.475
3d6e2bec-23e2-4beb-9cf5-da711cc8ad54	05ff1cc9-4cb6-4d87-a74b-0391a5539537	$2b$12$V1T9cHYVdFNt4tffyrq.6O6W.6BoiaS3PxNWIwfAZ5.xsTjEa6vAC	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-08 09:05:32.851	2026-09-08 09:07:29.368	2026-09-08 09:05:32.852
b1f7f935-38eb-497e-9b05-1aeeef86ba02	31bb72f7-e5e2-493e-827d-3320e1054461	$2b$12$/L0yXqULf8oNo90xfHZw/OOEClD2CJ7C4c9U7vq8LNpBKWqLvcO0y	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-08 09:07:43.644	2026-09-08 09:08:52.657	2026-09-08 09:07:43.645
bf632195-741b-4386-8f75-5127952c5005	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$BBVQvQw.0.mAdO.yTTlAJu.oIjEad5h4iZiSSPrOOcWvZRTTs5.5K	\N	okhttp/4.12.0	127.0.0.1	2026-10-08 08:31:48.488	2026-09-08 09:18:19.125	2026-09-08 08:31:48.489
e22fb481-c467-4565-aee4-c187eb59f2c8	05ff1cc9-4cb6-4d87-a74b-0391a5539537	$2b$12$lNnIqKRFPFnSXA8YbRQniuiKgzu6N6gYYzNi6XyIFRQyUGfoCDUEi	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-08 09:09:21.899	2026-09-08 09:57:28.223	2026-09-08 09:09:21.9
b81fd710-e5f7-4de8-9f81-fadc0ca0feb7	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	$2b$12$MZ.1Y2wqIsRew5wrCqB5/uJRZzeq23hKKoViFz/XJ47YgdS7Vedsa	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-08 09:57:37.722	2026-09-08 09:58:00.534	2026-09-08 09:57:37.723
1f4fd9c1-7fd1-4419-b4e0-1216d5acec55	05ff1cc9-4cb6-4d87-a74b-0391a5539537	$2b$12$Amqhk/vF9VBHZAgbgGGy.OFu4yuE7Ul6EB6vbERXuH/mRIsoHHK2a	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-08 09:58:13.352	2026-09-08 10:15:31.695	2026-09-08 09:58:13.353
a15a4531-855e-4cfb-aeac-8d8750fadc46	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	$2b$12$9zIGWCVikqaZu8MxphxuGuzw1eO.QNF0MzuiG446OMUFQ4uHn7iWG	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-08 10:15:38.313	2026-09-08 10:21:17.578	2026-09-08 10:15:38.314
c7d1689f-cfcd-465f-b792-8a2df5140114	05ff1cc9-4cb6-4d87-a74b-0391a5539537	$2b$12$GpnbI.3P.bedOkECo5fhDu.dZ8h2Xy2AinHIC5qgwtyN3P9E2iEZW	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-08 10:21:31.114	2026-09-08 10:48:12.661	2026-09-08 10:21:31.115
5ef23e33-8d8d-4816-872a-d99c606982af	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	$2b$12$hIuMvdEphiml7yYPwxXGruYRvie6.8KU4QzPq06ZXrBdLUVDL5QTe	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-08 10:48:18.45	2026-09-08 10:49:08.677	2026-09-08 10:48:18.451
0476f5a9-5382-4ee3-a77b-b124692358cc	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$VqBxgeyF8tlh.iPw4.uMSexaAidw5Q6yN9nQYDPNmFbmFVP5WZxfG	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-08 10:49:19.694	2026-09-08 11:14:37.22	2026-09-08 10:49:19.695
81a3db73-a1fb-45ee-8d37-be75198b24e9	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	$2b$12$wZVFEv720YQvn3d1vZZcqOzIknQU1S/BMsgw57dvG/9gwSH7UfVbu	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-08 11:14:44.529	2026-09-08 11:15:23.515	2026-09-08 11:14:44.53
bbdda7cd-ad47-4e5a-b41c-8fb88b3e4d64	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$61WgqRSRz2wh.gIppMaXMehYP9dArfhgt8ZVIEF/orDm3SclSWRgW	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-08 11:15:36.001	2026-09-08 11:17:06.604	2026-09-08 11:15:36.003
618aa2e8-dc46-4172-87d3-4b38680d4a0d	05ff1cc9-4cb6-4d87-a74b-0391a5539537	$2b$12$Cizuj/RnIV28DUOZwbYmjuAntWiiJEeGuaMPXKT9KZrxVgh5qHafi	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-08 11:17:19.956	2026-09-08 11:17:37.404	2026-09-08 11:17:19.957
2eb85aed-5e59-42fa-87bc-6afaa53fa017	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$L1fVRkzSgrAzdH6JnbNX4uCUFZNGVsyCicYYvi9qkiWXK6mik4Fdu	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-08 11:17:49.417	2026-09-08 11:25:58.834	2026-09-08 11:17:49.418
56703cc3-3d99-4e77-92e8-eead25dd1f82	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	$2b$12$1uyvaMfGollfesyhTAxe9.9n4QrT54XfP0r4Zrq0ttm9.IkySELM6	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-08 11:26:04.652	2026-09-08 11:26:40.478	2026-09-08 11:26:04.653
a6beb98e-6c9d-4aad-bf78-31f0b3d4981d	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$j9Uhl54tvwBNg30UDa7g1eFYMQUeDEzsuGohCI52NFSVfV5wBkjqG	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-08 11:26:55.623	2026-09-09 02:12:10.955	2026-09-08 11:26:55.624
ca8f516d-9b42-4ba1-b8e1-88df98fe0ac4	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$njA1CXZv0WCIxmfYCwppA.4RZTIkY9rZBloLNVYdvcqYITkxxDjt.	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-09 02:37:58.587	2026-09-09 02:40:31.673	2026-09-09 02:37:58.588
a50eddc5-87ac-43cb-b0cb-3de4333d828d	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$3JjZ3hiYJnjf2y4234suTeyrtYS7PO9/emRXNWkCX0fTAQLToessG	\N	MLGroup/18 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-09 02:12:11.473	2026-09-09 02:40:46.308	2026-09-09 02:12:11.475
74653e29-2de7-440d-837c-fdb2cb4ebce2	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$IymA11OxQeyHeS057BtBtOZ0.Z.s9BVzBdOlkPCDQ0femUxiZjeny	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-09 02:40:46.654	2026-09-09 02:43:05.673	2026-09-09 02:40:46.655
564b1168-c2dd-4dfb-9999-b151e11d8f69	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	$2b$12$McRt2vGRVe2B.Des9iR5ROJCjWwiA4.rb3N9sDF6Bq5pTi75j/Adq	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-09 02:43:12.567	2026-09-09 02:43:47.025	2026-09-09 02:43:12.568
69175706-d95b-435f-9462-f84a3a8c9186	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$b4JxvM5C4Db9wlaslJjHeO5aeQa/9c7AXfNjRI/ebVQQ9ORECrh06	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-09 02:44:01.59	2026-09-09 02:44:33.061	2026-09-09 02:44:01.591
40d65a2e-bcc7-4d7c-bf56-393821ba1a43	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$DQGebN6/s4JyZ4JH/w8ateX/b7ihznVXtmgu4xJJiI.7NbFGTof2a	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-09 02:44:45.478	2026-09-09 03:21:37.695	2026-09-09 02:44:45.479
1b50b7f6-ab40-4fa7-b09b-f7db49c4efe8	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$66ogXEiHIJCe07uX5MZPC.3Kr0d5cqOShpgFFCqwWzgB7qSa9Aml.	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-09 03:21:59.357	2026-09-09 03:23:08.86	2026-09-09 03:21:59.358
910dd0b3-74da-49a3-bcda-75547e67d6d6	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	$2b$12$rd2zv0B4qrXbPFaVkqBmtO27ALf17GN7MOx6aO9A3f2b0QZxza5.q	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-09 03:23:16.252	2026-09-09 03:23:36.349	2026-09-09 03:23:16.253
9d8e0b10-17da-4bf2-a163-87e17295087f	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$81qfM9Cw/RNNKbvABCF5IOBkIg5lfUYN2jBDAItoT8e/GiLf2RSyu	\N	okhttp/4.12.0	127.0.0.1	2026-10-08 09:18:29.209	2026-09-09 03:41:45.995	2026-09-08 09:18:29.21
dc51cde7-b491-428f-955a-c1c195bf0788	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$d6OeXGl1ZwgXk.fyk0P2N.FS5h/55EjjIFB7uQRSK2sIkFX6Hiqwe	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-09 03:23:51.83	2026-09-09 03:42:06.233	2026-09-09 03:23:51.831
f72770be-a1ca-4de9-81c0-fce13c4ffbfa	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$n5RotDu6mzTre9maEMsATeJyl5TBqt/DLEPNGK7qUnZWCw61T6SB6	\N	okhttp/4.12.0	127.0.0.1	2026-10-09 03:42:06.586	2026-09-09 03:42:36.242	2026-09-09 03:42:06.587
9eedf1a1-2fea-4a94-907f-ff032561d554	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$NvB8/7UffSbLfX7uzHS3y.1UVIVxTNScg8IjEO5f6YvQbicL4X4Gm	\N	okhttp/4.12.0	127.0.0.1	2026-10-09 03:42:48.202	2026-09-09 04:20:24.347	2026-09-09 03:42:48.203
210a1313-0f6b-4ce2-9fe4-dfec852c8e35	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$J/JLGDqnF9yJ5AhsKJ.1JeD.QfBxiBUvBp6xBPEdRa0bux0ryYJwG	\N	okhttp/4.12.0	127.0.0.1	2026-10-09 04:20:41.77	2026-09-09 04:21:34.008	2026-09-09 04:20:41.771
dad23874-05ed-4a26-b6f1-c55016afd6d0	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$dsI5ow6LPX6zKKcOIo0sH.PNDVPm08Fps7dmXoga52mfjs.lZzv3C	\N	okhttp/4.12.0	127.0.0.1	2026-10-09 04:21:43.985	2026-09-09 04:22:14.847	2026-09-09 04:21:43.986
d1477f53-f4b2-4711-838f-a69223774e64	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	$2b$12$pq9JC9vRbFSkIB7QEWmAze5konzBR263vCWQMe.9iMR.i1EiHWRNS	\N	MLGroup/18 CFNetwork/3860.700.1 Darwin/25.6.0	127.0.0.1	2026-10-09 03:27:34.484	2026-09-09 04:41:43.958	2026-09-09 03:27:34.485
4b388a6f-59ea-4d5f-8ea8-6a085a77fc99	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$i5VtyhnfTJnB.HuOqhPtFOHw57dqgiETuzkIfIeIh2dZu.W6UAqtq	\N	okhttp/4.12.0	127.0.0.1	2026-10-09 04:22:27.854	2026-09-09 04:38:45.803	2026-09-09 04:22:27.855
27125267-2534-42db-8988-46478ea272f0	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$ageKPa6thwXhQz.7Czsnp.EMWsHpJr2/B9wtK1tnZsvQ.hXlnb3KS	\N	okhttp/4.12.0	127.0.0.1	2026-10-09 04:38:52.65	2026-09-09 04:56:56.419	2026-09-09 04:38:52.651
8ff51600-5755-435d-b33a-fe6b2900e6de	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$ul.cmuS/iIgU6U/ED6WYkern8l8bu7GTWQ6KfnmnTjUx/R.9Sgf/W	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-09 04:36:37.492	2026-09-09 04:41:16.779	2026-09-09 04:36:37.493
ca823b5e-e07c-4916-b955-d8efaaa2ceeb	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$DbZf9.dCFnSK288gzGAdd.CJ6iorg6o1bC9r.erkbsh6LkNOXIkNC	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-09 04:41:28.675	2026-09-09 04:41:38.275	2026-09-09 04:41:28.676
acd4ac42-1f43-4f4d-b0eb-7d92902f4a58	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	$2b$12$K3CrQ.Y8Jh7BPh0c0Zaz5.GINieIqDSFx2CQtweokdKhakuqWiMYW	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-09 04:41:44.303	2026-09-09 04:48:22.828	2026-09-09 04:41:44.304
17d8ffba-9ae4-4717-98f4-c5f56f25c0c6	d5f49e78-0b72-4304-8413-b90446ced4a0	$2b$12$R6roD704U6TcUQhR9ah5xuNIPtef37Fcq.JQr8Njjn9lYO5sxU5OK	\N	okhttp/4.12.0	127.0.0.1	2026-10-09 05:13:34.769	2026-09-09 05:13:44.212	2026-09-09 05:13:34.77
3f223cc8-0b1e-436e-b78e-6b266c08293c	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$MOPnJhgNxrCo0huN6YUcgOY747Kw8SKFjme1dxm8OtHT35Y2XVt32	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-09 04:50:47.709	2026-09-09 04:51:13.819	2026-09-09 04:50:47.71
93d4a21b-5029-4f8c-a03c-3bd35e0be8a8	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$u0IsGrtsXQyVDxCp1YSYgumDYsqjOqadnVwSnTjdTxR6Skzo1nC0K	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-09 04:52:05.229	2026-09-09 04:54:09.66	2026-09-09 04:52:05.23
59eabebb-ca5d-4117-822b-e233f5c8abd4	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$wzySqlS5VDnx0cgKa/SET.3e/D/rCiOfTdGZfrDsHdd0YEuwi0JOK	\N	okhttp/4.12.0	127.0.0.1	2026-10-09 06:32:23.073	\N	2026-09-09 06:32:23.074
a260b53e-1ffc-4673-af43-f2fa3009d2b0	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$CQdc1uDiLKUvjwAZTQtibujyIWOLYngDolT/D4XGaBcStN/o1LguO	\N	okhttp/4.12.0	127.0.0.1	2026-10-09 05:13:56.764	2026-09-09 06:38:24.798	2026-09-09 05:13:56.765
9dd26d3f-fe1c-4bb2-bd9c-3a5716d11aab	d5f49e78-0b72-4304-8413-b90446ced4a0	$2b$12$3IWw2RRoOBbGrfnhYh9NaO1KFy0tAPx3taYl2uPccA7vQIPsU3nlu	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	127.0.0.1	2026-10-09 06:29:38.456	2026-09-09 06:43:55.98	2026-09-09 06:29:38.457
7d404c5c-e856-4031-9e41-d865097a0aba	d5f49e78-0b72-4304-8413-b90446ced4a0	$2b$12$6cE0L2lVWRoNgneng.LEZOoQmaUUAMTdculVN1NrmKDH/wcljqlNe	\N	okhttp/4.12.0	127.0.0.1	2026-10-09 06:38:53.91	2026-09-09 06:54:53.61	2026-09-09 06:38:53.911
0e82b0e8-6386-434b-a8f1-d618caad5c2a	2a45f36d-2da9-492c-8bce-91a3440e71c1	$2b$12$bw8eqzGewfzDXbCy1L4VRemUTvBISc.3NmfjkdBWdiKwdp/Ud/iD2	\N	okhttp/4.12.0	127.0.0.1	2026-10-09 06:55:06.361	2026-09-09 07:02:34.521	2026-09-09 06:55:06.362
d862d1c9-31ac-46f0-bba1-04ec924d15fd	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$9t9IJnSC/v./sJLE0SE1Ue4.TouueMLwM8FVYcky2pXTGWOHv7Aja	\N	okhttp/4.12.0	127.0.0.1	2026-10-09 07:02:46.651	\N	2026-09-09 07:02:46.652
398a2ff6-1b93-473e-9780-af02fbad0ee9	d5f49e78-0b72-4304-8413-b90446ced4a0	$2b$12$rILgUW3ZXWKSJI87kTowl.7JY72ZVvwb4bQ/mAZPKG3e35b5kw4nu	\N	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	127.0.0.1	2026-10-09 07:21:30.993	\N	2026-09-09 07:21:30.994
8b6cd82a-c6e2-4113-9752-3f377e6007e7	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$tV6iwGl4Z3KI9/9mxS/F8.3Q6AF9/HATVXLjCGe2Q7gpXKkk9vcpW	\N	node	127.0.0.1	2026-10-09 07:55:50.4	\N	2026-09-09 07:55:50.401
4e56137d-9129-4de0-a142-b6e04830ae3a	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$zMvcKRC9QMokOeD3U9AzcOmKu3wu/1JW7zh8lEcenvzReLeB8Kts.	\N	node	127.0.0.1	2026-10-09 07:56:47.59	\N	2026-09-09 07:56:47.591
837f64f0-11b8-4af2-bdf9-a095e6ebe915	846641e3-667b-4e7f-b505-afdc1d66b54a	$2b$12$7.cbZTBJ4obTdIoLj5HtRuMX1Lbio.ilopDQ10LeekgDyPgXvvskW	\N	MLGroup/11 CFNetwork/3860.700.1 Darwin/25.6.0	127.0.0.1	2026-09-28 08:38:56.324	2026-09-09 08:06:04.814	2026-08-29 08:38:56.325
3181d399-978a-4f15-996a-27fe3e161f28	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$ivcVc7aWhHLf2dOwg/WoSeOirhdvxhbuQzzPQQ4Zh82MmAQ.YKRfm	\N	Expo/1017880 CFNetwork/3860.700.1 Darwin/25.6.0	127.0.0.1	2026-10-09 07:49:33.924	2026-09-09 08:53:51.343	2026-09-09 07:49:33.925
9abac6c3-7de4-47c1-8aff-a63a4bfe8290	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$iO3zXQ5Nufg1y3J.P8App.v1cUQcKg13wh3DM7MKK19OWsw8FWpce	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	127.0.0.1	2026-10-09 04:54:25.92	2026-09-09 08:54:04.097	2026-09-09 04:54:25.922
0f4ea50c-6e7f-49ee-8eb3-3b2c7214323a	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	$2b$12$riBzodU3ygJewu4So4V1aOHZ4IGHeMn5pMZ1ECwZHy.FFRj.N6Jq.	\N	Expo/1017880 CFNetwork/3860.700.1 Darwin/25.6.0	127.0.0.1	2026-10-09 08:54:04.433	\N	2026-09-09 08:54:04.433
fa23f14e-cad4-4e70-a6d9-b25005042103	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$iMdpN99aVX8V258m0TpYOeimsTYMiexqVqNTXPnYWz00kGykcmYsO	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	127.0.0.1	2026-10-09 06:44:02.893	2026-09-09 09:07:39.175	2026-09-09 06:44:02.894
07ef2908-d316-4af1-bca2-b94abcf6cff3	49098001-4375-47f0-b36d-c8758d8715ff	$2b$12$rg4NJZphbcTzw2JbquogSOo802a67L2JhTTLAOD/NnRq9jkJF0uHO	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	1.55.188.205	2026-10-09 09:42:54.061	2026-09-09 09:47:59.709	2026-09-09 09:42:54.063
35f123a1-e6f9-4ae4-b771-23828d06da63	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	$2b$12$hzzj7R5fYY6mNgyzyCzi6u4T3gfINBUaUZWaqkg7c7ieL6n2HcDku	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	127.0.0.1	2026-10-09 09:07:52.115	2026-09-09 09:48:10.783	2026-09-09 09:07:52.116
4667febe-88bc-4620-83ef-012ebdb06e78	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	$2b$12$kP/jG1fqhpLdrFT0NilvOeCCEF1DVTOnhst2Uelx7L6WsvVChAsZ.	\N	Expo/1017880 CFNetwork/3860.400.51 Darwin/25.3.0	1.55.188.205	2026-10-09 09:48:12.271	2026-09-09 09:55:58.815	2026-09-09 09:48:12.282
ed3d8205-d2bb-47d0-9f1d-63f16c7308e7	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	$2b$12$eGLGUIV6NuIwgpse8HL4m.YEndm/C/CXdvJ0hPXm/RtQAduqUOoGC	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	127.0.0.1	2026-10-09 09:55:59.214	\N	2026-09-09 09:55:59.215
028a4e40-4481-49ed-9a85-e8a28ee92666	846641e3-667b-4e7f-b505-afdc1d66b54a	$2b$12$YhnMr.kl9TK61Ex9UUUTW.02.n2iZ56ZE/F7aiNKY/OvLlb8xdOyO	\N	\N	\N	2026-10-09 08:06:05.381	2026-09-09 14:08:49.715	2026-09-09 08:06:05.382
c254c60a-dba7-442f-bdb2-202586f771b1	846641e3-667b-4e7f-b505-afdc1d66b54a	$2b$12$47lKr0VMTi6bT7rDmb2rPuLkip1xX6lSvw.Zg/t.31OgXmutQa5cO	\N	\N	\N	2026-10-09 14:08:50.945	\N	2026-09-09 14:08:50.946
\.


--
-- Data for Name: regions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.regions (id, "companyId", code, name, description, "isActive", "createdAt", "updatedAt", "deletedAt") FROM stdin;
073f9933-8845-4c3f-a25f-8116105e3185	034d3d0b-83ea-42d8-bcd5-a6ae99cd0cc6	MIEN_BAC	Miền Bắc	Khu vực Miền Bắc	t	2026-09-09 05:12:23.69	2026-09-09 05:12:23.69	\N
9f6f0409-e5fe-48c5-b4d9-949fa9c12345	034d3d0b-83ea-42d8-bcd5-a6ae99cd0cc6	MIEN_NAM	Miền Nam	Khu vực Miền Nam (Tập trung Livestream bán hàng & CSKH)	t	2026-09-09 05:12:24.054	2026-09-09 05:12:24.054	\N
\.


--
-- Data for Name: report_snapshots; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.report_snapshots (id, "reportType", "scopeType", "scopeId", "periodStart", "periodEnd", "parametersJson", "resultSummaryJson", "generatedById", "generatedAt", "expiresAt") FROM stdin;
\.


--
-- Data for Name: reviewer_assignments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reviewer_assignments (id, "reviewCycleId", "employeeUserId", "reviewerUserId", "reviewerType", "createdAt") FROM stdin;
\.


--
-- Data for Name: reward_withdrawal_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reward_withdrawal_requests (id, "userId", "pointsWithdrawn", "cashAmount", "bankAccountName", "bankAccountNumber", "bankName", status, "createdAt", "updatedAt", "accountantConfirmedAt", "accountantConfirmedBy", "accountantNote", "adminApprovedAt", "adminApprovedBy", "adminNote", note, "rejectReason", "rejectedAt", "rejectedBy", "transactionReference") FROM stdin;
e044bf05-caf6-483e-8e16-78ac82043268	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	833	833000.00	ĐINH VĂN HỌC	N/A	Quy đổi ngoài (Nội bộ)	PAID	2026-09-09 04:21:16.28	2026-09-09 07:35:32.728	2026-09-09 07:35:32.727	49098001-4375-47f0-b36d-c8758d8715ff	\N	2026-09-09 04:22:05.93	49098001-4375-47f0-b36d-c8758d8715ff	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.role_permissions (id, "roleId", "permissionId", "createdAt") FROM stdin;
ab507e2c-e4a3-4f23-a08f-24edf3dcc060	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	df0ee1dd-cb70-45c1-80ec-1ca6aff000f6	2026-07-31 11:31:17.517
57a8e367-057b-4462-b2d9-e1a84863ffb7	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	adbe9800-1f4b-4517-9ac3-9f1e0b6089f2	2026-07-31 11:31:17.521
a52e0c4e-804f-4053-a323-2aedce166821	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	f2112fff-65be-4fcf-a5b6-dc7eb62998fd	2026-07-31 11:31:17.523
08b9b5c2-f5e3-49c3-bd24-c45819c85015	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	aa7616fd-c979-4c93-9324-06c7a113d1fb	2026-07-31 11:31:17.524
6ed03de4-ce09-4660-87b1-c0c3cd8b5019	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	e4b2bc48-8bdc-4848-bcb1-0756e1015e68	2026-07-31 11:31:17.526
1312a34d-ec1a-4a45-a9dd-63e98b659e1f	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	a82d44ba-e2ce-48f8-9f5e-b936bc71b368	2026-07-31 11:31:17.527
9cb1aaf4-3b74-4bf7-899e-ce3dd700ddd3	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	adfc8307-4603-4aa2-a3c0-49e5e6fb7603	2026-07-31 11:31:17.528
5d372479-7970-4056-87bf-13cdebdd3605	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	fb47d4c5-a049-447e-b9b8-3b4745604202	2026-07-31 11:31:17.53
8b8e9e93-b913-4be9-8e8c-08f48e9daf8e	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	19bb1473-90cd-4d51-acec-5b0248951fb9	2026-07-31 11:31:17.531
4eb92cf9-a544-4f27-8e4c-e4a62de4b3f5	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	0d76865b-43c2-4923-9675-ea0fcfe2698d	2026-07-31 11:31:17.532
13a84aec-16b7-453c-b64a-f7ca5277bb9a	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	7ffd1fa3-cab7-4910-8925-6876f8c607ca	2026-07-31 11:31:17.533
c72b691f-e984-4e43-94aa-2cb28b43c432	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	aefd535d-c849-4501-b47d-c8a962490ecd	2026-07-31 11:31:17.534
6df86215-e7f5-491b-951e-02c078c52c28	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	0059bd23-d088-4a0f-8198-d4c3198f75b4	2026-07-31 11:31:17.535
17afb418-8288-4b34-b9f4-03952c01d33a	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	98e12656-4a55-4037-b6a8-8909813eed80	2026-07-31 11:31:17.536
f500a562-4903-4200-8636-78c1211ee5f6	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	25e6a179-c13b-422d-8c2b-9cac647fdc28	2026-07-31 11:31:17.538
db019efb-d7d8-48d7-b81a-cff1c152832f	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	3c209de4-4f85-4bd0-be7d-6fb4f5551d25	2026-07-31 11:31:17.539
2d95ac90-0d55-4424-9cd9-605a4eca5b83	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	3d2fbece-98b5-48aa-bf1a-72cad87829b4	2026-07-31 11:31:17.54
68fedae2-921b-4dee-911a-5c4979b74f10	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	a5ace99d-252e-4a0e-a3d0-5d5ffaf44a03	2026-07-31 11:31:17.541
92d6e56c-3b0b-461e-96b5-6be2ef9a030c	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	e0d5a0c9-c953-4d63-8b26-a30bed6160ab	2026-07-31 11:31:17.542
d63db1be-29e9-413f-84b9-c9b308dd1510	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	56d5136a-543f-4c30-9d77-46b1fec2bde7	2026-07-31 11:31:17.544
b477c9bc-9c18-48f3-8e61-74c5633c1b91	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	e0bf3e87-cf53-4c7d-97d1-384f6aab92fc	2026-07-31 11:31:17.545
ab60d156-de4c-4be6-8268-8ee71ecc8083	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	ee6cb187-ab75-41c8-8614-d2d5d125000d	2026-07-31 11:31:17.546
55be0461-8b83-4fce-b412-43f6deb7aacb	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	1af4fc0b-8fb9-4265-96ba-063907472ed9	2026-07-31 11:31:17.547
441e2487-5567-41c5-b3ab-ff6d63dbe2a0	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	36e8db0c-7755-4d05-aa63-19ff7f8fd931	2026-07-31 11:31:17.548
756ccecd-d345-49b8-beca-d2a6c53b62a9	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	7c1e0f23-7cee-4e5d-ab04-579dec088f7d	2026-07-31 11:31:17.549
7190fcda-614c-4c76-a509-87d3d902a1f2	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	1ec925bb-9664-47e3-9bf9-797dc85cfea5	2026-07-31 11:31:17.551
a0a260a9-abf3-443b-bf20-47526afa09fc	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	740ae2d0-eb8a-4812-a6d8-2ba55b7ec11c	2026-07-31 11:31:17.552
394d6db1-5f81-4d94-b3f5-5a5a6188f5af	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	6b059063-6a74-4929-9375-67c0935baccf	2026-07-31 11:31:17.553
4977f948-f625-4e15-8c4c-3c0cb5b06367	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	4a1cdfc6-e124-4e29-8444-b7a5b92148d9	2026-07-31 11:31:17.555
091e048e-df42-4a6a-9f59-a47b54b75ca1	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	84520dcd-0b42-468c-924d-7188c7097dcc	2026-07-31 11:31:17.556
a8b8798c-0a51-46f0-b17b-ec8abb981777	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	e670154d-604d-46e3-becf-96a1c4206382	2026-07-31 11:31:17.557
266e6922-48de-4d95-95c9-cd6525da5e05	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	1699cbab-2137-4549-9521-19ea6b726963	2026-07-31 11:31:17.558
d74b3e88-d09c-40da-9f06-6d66e04168c2	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	fa823bbf-2fe8-4f94-a0df-4b55dd06172c	2026-07-31 11:31:17.559
fac54dd7-34e1-4c9f-8ebe-8aef80c061dd	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	f47534b3-529c-4a64-8e7f-0f8770a329bc	2026-07-31 11:31:17.561
2326831e-6a6b-478c-8054-8b63f4e9e11a	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	fce3bf11-8f91-4697-888b-d01080c724af	2026-07-31 11:31:17.562
dd1609be-36eb-435e-be31-451478044a31	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	d0510b35-8c22-422a-a258-a77c4b7d5642	2026-07-31 11:31:17.563
670eaeeb-98f1-45eb-90b6-3dfcfd9268ca	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	b936a83f-2ead-40b3-b745-d821f8cffb31	2026-07-31 11:31:17.564
17b01860-f201-488a-936e-fd7c69c88224	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	ca16fc48-ae77-42f6-b0b4-c1c17c98b2d1	2026-07-31 11:31:17.565
fd70b02d-9d98-4806-bf71-c703cafd456c	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	cd40d61a-64e8-41ee-a756-74a6a380b261	2026-07-31 11:31:17.566
99044e1e-2658-4c5d-ab9b-e6709d2ad4b6	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	683efa6d-0036-4cc0-a607-b7b0d6086a2d	2026-07-31 11:31:17.567
4c5e9c2b-83e1-4af7-bac1-87e472046328	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	c80671ca-4776-40fa-9b90-e9cd1ce04f03	2026-07-31 11:31:17.568
d484edc1-e966-4ee7-8b59-e3b715944430	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	9464e130-e023-4d73-9c7a-143c32047ab4	2026-07-31 11:31:17.569
ad9cfd7a-57bf-4ede-bc5f-9be989b585ee	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	d007fd2c-3494-4b9f-b25a-26fa7bcbd036	2026-07-31 11:31:17.571
8c7fcdad-70e7-4a4f-b4f3-ada145cec797	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	f942c793-cc0c-4c2c-be30-a064511b25a3	2026-07-31 11:31:17.573
c62e8c3b-bb67-4b41-aa38-6fe2dc20f93a	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	0535f840-8910-437c-aebb-cf57339632d6	2026-07-31 11:31:17.574
296a56ae-102f-458e-ab89-510a70ba83c0	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	ff1f370e-fb6d-401c-8c38-99e0c58701fb	2026-07-31 11:31:17.575
56dd8aca-6178-484d-861d-735c89519f37	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	79fa8bc3-acc1-48b2-a582-16e4a417f2cd	2026-07-31 11:31:17.576
095bd356-e3c2-484f-9856-807f161852c6	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	86881426-4689-470f-8cb7-fab86d542288	2026-07-31 11:31:17.577
b2cd0fb6-6b91-48df-bde2-866c941f45f5	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	065a92d1-c998-404e-9f3b-31a251ca3662	2026-07-31 11:31:17.578
573b9884-674b-40b7-93a3-bdcdbcd506d9	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	76866a59-ea44-4199-9747-5e456a6b89d3	2026-07-31 11:31:17.579
7308ec31-8fb4-4c59-9aa3-3f81079810cf	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	50d846f2-aa7f-40c1-9430-9f1f38758f57	2026-07-31 11:31:17.58
f6a1449b-3203-4632-8c84-8c41fde4da91	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	bcf2798c-a4b0-47cd-ac3a-d9c1c3fab3a4	2026-07-31 11:31:17.581
53578aa3-0321-4221-a21a-f7104e79dd98	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	22e1c1b1-9816-42c6-978d-bd1f0462268e	2026-07-31 11:31:17.583
6c714beb-a0aa-4565-b884-04ba05bc8af6	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	6b1a3f88-15f0-45bd-a76b-1633c2c23e12	2026-07-31 11:31:17.584
d814f059-dca8-4677-a656-dab1cbb778f7	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	3c774b60-8b9e-4e5f-b233-4326e5b3b3a2	2026-07-31 11:31:17.585
d9911d2d-0ee1-47b1-ab4d-7aec0a798a79	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	f36fd45e-92ce-40c6-94be-32183c652f6f	2026-07-31 11:31:17.586
1382bd95-07e3-4862-a3c9-96843641f493	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	0a3b653c-f30e-48a0-ae55-3a5fca0d57f3	2026-07-31 11:31:17.587
412d8b45-7cc4-4e29-97d4-efcc91a13a42	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	fd6edba7-cbd1-4b28-920d-925695c78b8a	2026-07-31 11:31:17.589
f007c830-ce00-4ff1-889c-0c7f1f90700f	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	b67784df-2a18-4f4d-bb04-99a0aad2be81	2026-07-31 11:31:17.59
f36960ad-e54b-4484-a442-87572428a8fc	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	08b3489b-a163-461d-986a-9a576503a3b9	2026-07-31 11:31:17.591
c1054fcc-701e-4451-a427-465effce19b8	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	02e0e608-4d37-4ed3-88be-47f0bb22511f	2026-07-31 11:31:17.592
71ae1aee-9464-4949-8e84-596da46d5bab	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	2cd16ad2-82ec-40ec-b720-51d7a0d241bc	2026-07-31 11:31:17.593
575920d3-41b0-4d72-9ca3-daf132b16766	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	4c993a3d-9f44-4db6-ab9b-3477b12ca7ab	2026-07-31 11:31:17.594
2fcb358a-1b01-443f-8076-022551c79002	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	2e4cb809-5a07-4287-b78d-05880fd4cd2e	2026-07-31 11:31:17.595
913af890-4881-4393-a573-8e8b6e1844f5	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	8242a1eb-3059-41b6-9b07-1d495bdb88ce	2026-07-31 11:31:17.596
11ea6cf1-7278-425b-8035-c1c1429ab2ed	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	140f53dd-b1bd-495d-bd58-b369b0cbe331	2026-07-31 11:31:17.597
1e166a4b-4376-49d6-8827-6b73e4216657	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	7215bf34-e198-488d-adf6-a66ba3f36a88	2026-07-31 11:31:17.598
ec777560-1344-4177-9b86-8a28e0aec353	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	fa54d18f-69f5-4ed9-a73d-0c436f6e9ff7	2026-07-31 11:31:17.599
d5defa1b-29d1-4973-931e-36d790b00316	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	033226a0-40c1-4344-a4f9-9d6520738eb1	2026-07-31 11:31:17.6
eb10c134-3e47-40a2-a6f5-e0a19234c207	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	1db7bde4-7276-46ca-bde3-2f49ac1838bf	2026-07-31 11:31:17.601
ae12ef47-7deb-4bc1-89f4-d3a7a14e283f	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	3231c521-f303-4a5f-b530-df76068d9055	2026-07-31 11:31:17.602
9d7d1cde-f9b5-4d18-a609-562c30182f48	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	8846c6ac-c020-45eb-a15c-98e77837b3a9	2026-07-31 11:31:17.603
0ef48d05-bfca-43d9-acd6-5f0046a788b0	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	3ef88bfc-a7e7-48d4-b4b4-54ba0afbc5de	2026-07-31 11:31:17.604
c1c25047-7dcb-4373-a525-ac9ca4cf6e90	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	ffb082a4-e6a9-4ef2-9ec5-d361990fdc77	2026-07-31 11:31:17.606
c7a5a40b-6b43-472b-a3af-d591add32090	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	ce422422-bf99-4728-bb72-112c64164da1	2026-07-31 11:31:17.607
eb12025e-ef17-47cb-88d6-ac67b19d1c5e	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	2390eccb-9f3f-4bbc-b571-28acb5529593	2026-07-31 11:31:17.608
27682519-43e4-4dc4-b394-3bdbcb263845	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	d7c14859-c077-4dc5-9159-24c46d8614f3	2026-07-31 11:31:17.609
29d1c837-c66a-43be-a0b1-90779ae95d18	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	37c0f8ee-850a-4045-8178-6c1b941ae86a	2026-07-31 11:31:17.609
0dd587ab-40bc-4f8f-87ea-12a8d2008a1f	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	17474300-6128-446d-8b46-e62e0a711df6	2026-07-31 11:31:17.61
02333376-a84b-4244-9988-0d1a58a089c9	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	a1339e8f-d773-418a-b63e-21e06f86d7f9	2026-07-31 11:31:17.611
07034b32-3dde-452d-b641-970fdd36f482	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	38a18d4a-2502-4f99-8da2-c777ec360662	2026-07-31 11:31:17.612
9c03eef7-f3c3-46b6-b7d4-1334490f05c2	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	3d109bb5-4efe-4f40-8791-c9ba0c4bdc19	2026-07-31 11:31:17.613
b6bf04c4-b320-42ff-883a-04b2a5b7e6f6	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	be18c7a7-deba-4ace-be60-32e22834c593	2026-07-31 11:31:17.614
c2ad2938-348a-468a-87cb-5004535222e3	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	d47d4a5d-b053-42b9-a60f-5d0e2eb80609	2026-07-31 11:31:17.615
dfc4efdc-23c6-4510-acdb-e02e9cd3722f	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	aa517192-a87b-4714-b9d3-55f9dc6ce5d3	2026-07-31 11:31:17.616
2f6ed8ef-fac8-4193-b3ef-d3a39042903f	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	6aee6b79-0057-4fe5-8b66-cf712c539cae	2026-07-31 11:31:17.617
2ce9f498-a1d1-443e-a8d5-39ea0d9576cd	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	67849923-36f3-4c54-826f-14e8829aa95b	2026-07-31 11:31:17.618
59d6d01a-206b-4950-9461-b176d053023b	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	5b04f5f9-74b3-4746-b0a5-e02a44b988e4	2026-07-31 11:31:17.619
6bad84d8-3102-4cbf-8520-75b62c89d633	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	0500928c-0c9d-4349-b555-5bfe0189da7b	2026-07-31 11:31:17.62
1e308ae4-00a5-4553-a17d-96d6a4c8be32	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	56636640-f352-42b4-b61a-eb8bcf1f896f	2026-07-31 11:31:17.622
b0d6b877-d7f5-444e-844f-d8e0160908ae	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	ca25a119-5cc2-4518-adb3-d20b32f1088f	2026-07-31 11:31:17.623
b4bb73be-8ab4-4efa-9f1b-e008fe2102ab	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	f47838ac-a229-477c-a8c2-bb66482cf486	2026-07-31 11:31:17.624
e31f388f-3ac5-41cb-836c-63ef5721787e	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	e9bf5f01-2fe7-40c4-907e-815abfbd094a	2026-07-31 11:31:17.625
6a70b916-af4e-4d7d-9dc6-c97323e9721a	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	1c8b5a33-5ac5-4953-9abe-75723b7948fd	2026-07-31 11:31:17.626
57725e4a-1aab-4f7d-ab16-8e4539f581b3	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	66d1168d-a5a7-423c-82ab-7685bed52e8a	2026-07-31 11:31:17.627
8de2532c-99e4-47ad-91aa-5a773d4669b8	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	4f9392ab-270d-4502-8ca6-94fff75f1253	2026-07-31 11:31:17.628
668b424e-b481-4bd3-9121-9df354c6744e	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	349397fc-5d4f-4ffe-8d54-1feafde159f4	2026-07-31 11:31:17.629
ed0808d8-0763-4a1c-9553-5ba135d6f7da	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	95f376c8-800c-4d76-86c4-a8176b20e901	2026-07-31 11:31:17.63
270e096c-2cd4-436f-beb2-072010c754f8	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	8387782b-a978-42d3-85f5-da846b74e766	2026-07-31 11:31:17.631
f7809a41-5e15-4bdd-8cd3-ae4dba4afca6	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	39f10dc5-1e4d-4ccb-a674-3e0e399e915a	2026-07-31 11:31:17.632
adca8f36-838f-4df6-afb9-ff45065e9357	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	af900d07-e032-463c-9a62-ce40ec3b863e	2026-07-31 11:31:17.633
a3a2aa15-5895-4c0c-a8bd-16ad21bac0e0	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	39948cf2-c527-47fd-9d95-5b35d60443bb	2026-07-31 11:31:17.634
29dc4b37-17b7-444f-a5af-68a2d51f9ddf	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	a3a3534f-9ad8-43d4-9a2c-5ef9d9d387ed	2026-07-31 11:31:17.635
a523173d-fd54-4012-9358-f9262327e0e0	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	293ef276-fc77-4c9d-b2a8-7df8806edf6d	2026-07-31 11:31:17.636
b96cd477-84a2-47c7-8155-4413d6c68fb1	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	d3aeb885-06c0-4c74-9ab0-4bfcf2450308	2026-07-31 11:31:17.638
0146507c-b636-4900-a9da-4126dde0f961	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	615ce2f1-8b45-4073-884c-938dcec8ce14	2026-07-31 11:31:17.639
0ba57ffd-fd19-4dc8-b6e5-c3a8bd89db48	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	ab8b86aa-9d42-470a-ac0a-6e9b906c0f9d	2026-07-31 11:31:17.641
b1853728-745e-496f-8df5-42c5049a52f5	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	40c16d45-fb4d-4576-b199-35c906205817	2026-07-31 11:31:17.642
7a8def3b-9f8b-4ee2-a268-5aafa29b4b37	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	62109245-aed6-41ca-92da-3a33264263c7	2026-07-31 11:31:17.643
2a6262a8-b2d6-4b07-8534-3f8f18684518	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	e2b6218f-9464-4a3a-94c2-aeba7de531a7	2026-07-31 11:31:17.644
935d7586-1b8c-4efd-8d73-a7bc87baaec8	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	bd2d52c5-7f7c-49fa-bbba-5d5a77dafdd0	2026-07-31 11:31:17.645
4cc99e83-dffb-440a-a245-bc8f7445587f	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	15022f24-1eec-4e5c-9f2c-76bc8af96994	2026-07-31 11:31:17.646
b8e2a096-2e2e-44d4-907a-d636a7b11bea	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	127aac98-9593-4847-a090-3c7f561f883c	2026-07-31 11:31:17.647
1d2c7729-abec-48a9-970e-a1e0d1e7c822	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	dac5dd4e-9ba3-44ff-af18-df0f46aa77fc	2026-07-31 11:31:17.648
d8433f05-f7c0-4cdc-bc9c-60f9074d2f6a	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	5d50a8be-12fc-4c46-9764-c073ca89e4fb	2026-07-31 11:31:17.649
2efbccf2-acd9-4702-a9f4-2d6281e1ccc8	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	bafbdb06-5df1-4987-8d61-8b0c1e95a53b	2026-07-31 11:31:17.65
fd0c1ba5-e3ed-4d25-ae80-ba13cac0605a	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	3064cc49-40a0-4622-84e6-18086e6ec715	2026-07-31 11:31:17.651
1300b3ea-f80e-4813-865c-64b147cb4ded	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	149a71cd-8a41-49e8-ba84-5262b6347891	2026-07-31 11:31:17.653
4cf8bfb2-779b-4106-9ebc-1a9536b040fb	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	e1d3b13a-fd7a-4530-9322-7008a6caeadf	2026-07-31 11:31:17.654
e8476d9b-57b4-40d8-a40d-d3c96d98d468	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	64e4abaf-9d70-4b69-846e-cd4ff88be5c1	2026-07-31 11:31:17.656
580187e3-c75e-4c0c-b914-5e2474d11de8	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	382b42b1-e21f-49cc-bce8-75aa1d2e26e8	2026-07-31 11:31:17.657
98374a52-1a6a-4c2c-96a7-247b36dff288	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	b81f54b9-408e-420f-adea-8123a67b063a	2026-07-31 11:31:17.658
9e08c035-ddb4-47b6-b608-a39469de7d67	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	c5304fb0-7831-4ab4-877f-7e9cb59ee502	2026-07-31 11:31:17.659
f05e9c58-9f83-4f35-819f-b7ae8e3cac5a	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	789ee04f-cb9b-479f-aef5-1ee75b67446c	2026-07-31 11:31:17.66
0975947d-b050-4b85-9236-884eae0ef7b7	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	daeda1f5-810a-49c9-81de-03fa553ce31f	2026-07-31 11:31:17.661
ee2e127e-b087-4105-897c-20cf3b237f21	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	7741adb9-7c1c-4bbd-966a-24e0f5f547e5	2026-07-31 11:31:17.662
bf4392fb-6518-4536-b2d2-7dd7f0ab6000	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	1d9347e5-129a-490f-86c1-b27df5891668	2026-07-31 11:31:17.663
19a02de0-c3cc-4879-8162-78a38772088f	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	0bc07725-2bf8-4c51-9c76-47c8cb158054	2026-07-31 11:31:17.664
8c505bc1-0759-4e72-86f8-e0e51c7b9424	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	7dbf0cbe-b68e-48e0-8ec3-3be6908fba11	2026-07-31 11:31:17.665
cc8785df-6fc0-4fe7-9353-e37cb6665006	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	6e74d280-9baf-41b0-8b7a-23010e950382	2026-07-31 11:31:17.666
e26e1d6c-a0cd-4500-9af0-1f96c4500c5b	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	cfbcf0b3-ef5c-4584-9d1a-83a6cee2495c	2026-07-31 11:31:17.667
2536baac-5821-40ce-86c0-39345bf7ea74	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	c4be8531-447d-440f-b065-98bc9338ee80	2026-07-31 11:31:17.668
8d4a65e2-513a-4cc3-903d-9c42f85ef350	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	300e6166-b3d4-4756-bd3d-5e6be628d559	2026-07-31 11:31:17.669
ebebe182-309a-4d3f-861c-c230a1345fad	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	bde13fc1-85df-4cea-8e9d-e12d1b9acdce	2026-07-31 11:31:17.67
06119abf-f8de-4ec0-b4ad-b14d62f3520d	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	a71247cc-8965-4ea1-a52d-159f4a9352da	2026-07-31 11:31:17.672
8e2cfd05-665c-4d73-a0a5-97166e72a7da	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	68593ab7-ec91-4918-a8dd-8e19bf0c35d3	2026-07-31 11:31:17.673
a6c4b953-3d35-4400-a78d-a2847fca212e	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	9c61877a-9926-4bb9-911d-3f0c63ca2d04	2026-07-31 11:31:17.674
c1bdc44c-718f-4b70-8431-38ea3b4a0b5d	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	a4fa5480-909b-429c-8c9e-1ab5cb8eb5fe	2026-07-31 11:31:17.675
088fee04-4971-4d2d-9fdf-64319029b975	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	e42af89a-16a8-4163-ba5b-fe6ce8544c77	2026-07-31 11:31:17.676
3bbe0629-b175-4c7d-8076-a72a2f09c576	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	9694f2b2-407f-49ec-b3a0-2e3d8a29f001	2026-07-31 11:31:17.677
66d8fec6-7924-4ca3-91c1-b7a0b9b21f25	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	4d34b1a1-6688-4b8b-8c43-c79574f13171	2026-07-31 11:31:17.678
ebe52153-5252-40aa-a7db-d4b7a6f94044	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	08a66dbc-6204-4de1-b23e-1b553d7a979f	2026-07-31 11:31:17.679
5ac0f7ce-a393-42b0-8ab4-df2185dd59c1	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	a63e189e-e564-4cba-8e52-8cf42b3349e0	2026-07-31 11:31:17.68
1fa4d94e-525f-4dbb-8807-6663a424ba52	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	318d1b36-1a96-4ea2-9520-b3aaee2c2213	2026-07-31 11:31:17.681
151a5a24-6778-48cd-bc3c-baa00e8ec4de	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	032b9405-38e7-40cd-8254-8d082370fc07	2026-07-31 11:31:17.682
f033c7a7-118a-4ab0-85be-27d03731e05d	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	cc01b521-8686-4445-b9f9-a9540f4062bf	2026-07-31 11:31:17.683
727d3903-5f0a-4255-b35a-9ed2368b49ce	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	51e8d70f-d211-4996-846d-d27523e247b2	2026-07-31 11:31:17.684
5aa656d3-6d4b-4f90-b12f-a7c32d6c34c5	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	fb8d9b0f-fa2c-45c8-b304-f584920e36fd	2026-07-31 11:31:17.685
3b3c3c91-547f-4dca-8ba7-8b6cfc556074	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	aad8430e-5e45-4cba-a1ca-89d416e12ccf	2026-07-31 11:31:17.686
6fefc141-bc5e-499a-b874-800b4f5348f6	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	4e0fa767-3558-4d71-b986-e96a88b84594	2026-07-31 11:31:17.687
8d10bbcb-715c-4608-9546-8fa0db185e49	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	ff924b0d-1604-4dd4-8bd1-0b234cd45502	2026-07-31 11:31:17.689
75b2768c-ec9d-4651-bdf3-f7060cce13b4	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	3e2114f8-716f-4eac-a15f-468429c859df	2026-07-31 11:31:17.69
f37ebd11-5b20-4a45-b1bb-adfbf4108fe7	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	30db9e1b-a5c2-42b2-875b-ac40b4a1cfb0	2026-07-31 11:31:17.691
030ef931-22ce-4196-98cb-9b6aa48aeaec	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	37f060fd-8d99-4dee-b196-c77cf5ff124d	2026-07-31 11:31:17.692
326bdc35-d620-4df1-a3d0-e874bc2de99b	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	13f99a1a-79bd-415c-8589-b7cdef7ed39b	2026-07-31 11:31:17.693
66580898-887a-45d2-8472-b56fe3d12d2c	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	7ce68843-03e2-48ce-9843-06da64203870	2026-07-31 11:31:17.694
e61b68a6-a337-4329-9463-6e2c9ee6499e	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	86cfef87-434f-4f51-aa29-981a06ffccc1	2026-07-31 11:31:17.695
2fb21fd0-f19b-4f54-bc1b-b6b8a4b208c2	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	4077023d-6096-4fc7-9372-5705a06eece7	2026-07-31 11:31:17.696
8d918834-fc6e-4d83-940f-b150a4f40658	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	fe789135-b250-4714-a120-e7189498c043	2026-07-31 11:31:17.697
49c3a520-e829-4bbc-827c-b3f14510688d	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	57a3e214-9a26-4380-9ca7-cc7b3a0e3b0c	2026-07-31 11:31:17.699
889fbd82-1b74-496f-ba39-704761e157ba	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	5619c44a-e412-45bb-a30e-f7aa4a910fff	2026-07-31 11:31:17.7
01cff62c-fbd8-4479-b653-c8505a9ae19d	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	4e7033e1-1124-4334-8bc5-835507c4c091	2026-07-31 11:31:17.701
302b7188-01f7-4c01-a640-dab4b3c89808	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	3336a605-5f4d-43f7-b37b-e11213e1a2b8	2026-07-31 11:31:17.702
0ece0992-63b5-4f03-bb1f-01f1eb7cd4f7	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	05de376b-5d87-4678-89d7-8a07b7c20132	2026-07-31 11:31:17.703
b6e2c259-6ed3-422c-834a-472684646aa2	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	3debeb00-2d01-47c1-9d74-969eab967abf	2026-07-31 11:31:17.704
f7fbc537-dd06-4959-b46b-0c57c445c0df	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	6bd38e7a-8567-4d52-bc3f-a485fda5b219	2026-07-31 11:31:17.705
798b982e-7a69-496c-8363-b6a8324e8d58	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	94e6a6fe-90d2-473d-b408-ee6eee28be9e	2026-07-31 11:31:17.706
ebf0c0d7-984b-48e0-8848-6e718fb25a57	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	a2970c39-cc5d-46fc-a26c-03c31be74749	2026-07-31 11:31:17.707
5b08a902-34ec-40ec-b864-46bb541aed73	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	0f98bfd9-4cb0-45a2-a2b3-95f541bdbae4	2026-07-31 11:31:17.708
560abe1b-6745-4b99-822b-4adf56223bfd	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	79881ce2-f7a2-4205-8b9a-2e58a0708a05	2026-07-31 11:31:17.709
192ca2a6-6abc-40aa-802e-56026ef0e2fc	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	3f39f1ae-abee-480c-9d81-6cf17783cc8c	2026-07-31 11:31:17.711
208c5924-95de-4065-b0f1-5ca1525514d0	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	d14f236a-1034-44b5-a158-419de6398e41	2026-07-31 11:31:17.712
d3690a23-3c22-4853-978c-46f9a4522c6a	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	daca7d69-0fe5-4a1a-8c1d-7e31d1792204	2026-07-31 11:31:17.713
99623a95-7c4e-4ed3-9f64-0bef3551141c	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	3737e4ab-d6d0-447e-99f4-c14c4d0a549b	2026-07-31 11:31:17.714
196320a0-59c9-43a2-a70c-ff72511d1caa	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	bdef25f5-437b-4fbe-b026-fbcbf6cd529b	2026-07-31 11:31:17.715
dafaf7cf-b6cb-4445-a16e-37ed158db10d	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	59440001-b2bd-4c6e-a461-40c50f6bc129	2026-07-31 11:31:17.716
f4752cb0-62b6-422b-b4fe-6e5609eeecaf	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	df0ee1dd-cb70-45c1-80ec-1ca6aff000f6	2026-07-31 11:31:17.717
f7039b1e-c3fb-4094-9ce2-2239c86e948f	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	aa7616fd-c979-4c93-9324-06c7a113d1fb	2026-07-31 11:31:17.718
e908c445-a924-47cf-9b1e-5824101544ff	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	a82d44ba-e2ce-48f8-9f5e-b936bc71b368	2026-07-31 11:31:17.719
3069d68d-05be-4924-8660-64603290b867	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	fb47d4c5-a049-447e-b9b8-3b4745604202	2026-07-31 11:31:17.72
14df0ab5-630d-4e70-835a-f9b6cc159c4f	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	aefd535d-c849-4501-b47d-c8a962490ecd	2026-07-31 11:31:17.721
df162da6-1884-49b1-b51c-94d1041b9ba9	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	25e6a179-c13b-422d-8c2b-9cac647fdc28	2026-07-31 11:31:17.723
f6d557a6-cb12-4f3c-9dd3-1906af7a3039	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	a5ace99d-252e-4a0e-a3d0-5d5ffaf44a03	2026-07-31 11:31:17.724
f5a80e39-bfad-4719-a1f8-4d6e21769857	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	e0d5a0c9-c953-4d63-8b26-a30bed6160ab	2026-07-31 11:31:17.725
82589020-5443-4864-857e-2abbdf5bbc72	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	56d5136a-543f-4c30-9d77-46b1fec2bde7	2026-07-31 11:31:17.726
582bfe53-7ca8-45ce-a619-3f00731ed3e3	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	e0bf3e87-cf53-4c7d-97d1-384f6aab92fc	2026-07-31 11:31:17.727
97d7c663-8f81-4d52-acae-21ece8021b87	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	36e8db0c-7755-4d05-aa63-19ff7f8fd931	2026-07-31 11:31:17.728
2b66e84e-8604-4fa1-9520-4f1948f4434a	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	740ae2d0-eb8a-4812-a6d8-2ba55b7ec11c	2026-07-31 11:31:17.729
21fbd895-9107-4de2-8d22-e5010665eba4	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	84520dcd-0b42-468c-924d-7188c7097dcc	2026-07-31 11:31:17.73
bef59944-6465-4f18-8140-c7ae2b536e78	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	fce3bf11-8f91-4697-888b-d01080c724af	2026-07-31 11:31:17.731
64bf6b90-5f63-4fd1-984d-c3c9c13358ef	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	b936a83f-2ead-40b3-b745-d821f8cffb31	2026-07-31 11:31:17.732
9fb550df-0eaa-445c-8e14-a280eeae0b18	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	cd40d61a-64e8-41ee-a756-74a6a380b261	2026-07-31 11:31:17.733
b8effc17-1027-42e7-8308-7169a8ce6e3a	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	c80671ca-4776-40fa-9b90-e9cd1ce04f03	2026-07-31 11:31:17.734
4e0ed641-9a1b-4f85-9f82-334c0d80fe96	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	d007fd2c-3494-4b9f-b25a-26fa7bcbd036	2026-07-31 11:31:17.735
3166154f-0205-4c86-92b4-df5d1d417140	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	0535f840-8910-437c-aebb-cf57339632d6	2026-07-31 11:31:17.736
30147b7c-e24b-4a19-9aae-322c5723d617	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	86881426-4689-470f-8cb7-fab86d542288	2026-07-31 11:31:17.737
c5da254d-cab1-4e5c-a1ce-460e3a589f23	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	3c774b60-8b9e-4e5f-b233-4326e5b3b3a2	2026-07-31 11:31:17.739
3fc92030-5209-4ef5-a19c-dd6fccfcd5b0	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	0a3b653c-f30e-48a0-ae55-3a5fca0d57f3	2026-07-31 11:31:17.74
6ad29c2a-6c82-4ff1-bfa1-cb455ec04db3	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	08b3489b-a163-461d-986a-9a576503a3b9	2026-07-31 11:31:17.741
c6b43d9d-1c6a-4293-8cbb-64a110fec7ab	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	02e0e608-4d37-4ed3-88be-47f0bb22511f	2026-07-31 11:31:17.742
98d7beef-c11b-4e29-b14e-a0961693de76	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	2cd16ad2-82ec-40ec-b720-51d7a0d241bc	2026-07-31 11:31:17.743
ac0ba180-8bb3-4e3f-b1ee-9f1d9c50cd26	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	4c993a3d-9f44-4db6-ab9b-3477b12ca7ab	2026-07-31 11:31:17.744
bc2015c5-8f58-4bf0-912a-290dc6ef7b44	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	033226a0-40c1-4344-a4f9-9d6520738eb1	2026-07-31 11:31:17.745
d4053330-6f00-4874-a746-29abb5178575	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	3231c521-f303-4a5f-b530-df76068d9055	2026-07-31 11:31:17.746
1234941d-30a3-4876-9223-cabf72830000	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	2390eccb-9f3f-4bbc-b571-28acb5529593	2026-07-31 11:31:17.747
6ed39b14-c91a-44ff-8d05-94a2afd6cbdf	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	d7c14859-c077-4dc5-9159-24c46d8614f3	2026-07-31 11:31:17.748
b2e1ad87-3fe1-4d7a-a68c-906d013fd064	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	38a18d4a-2502-4f99-8da2-c777ec360662	2026-07-31 11:31:17.749
9cc72574-1a7b-4299-86a5-cca70c877641	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	aa517192-a87b-4714-b9d3-55f9dc6ce5d3	2026-07-31 11:31:17.75
9852038d-73b9-4195-b023-12f4c1caa9e2	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	56636640-f352-42b4-b61a-eb8bcf1f896f	2026-07-31 11:31:17.751
2b7034e8-d6ab-4a55-b2c4-f1bc2d5f7d8a	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	ab8b86aa-9d42-470a-ac0a-6e9b906c0f9d	2026-07-31 11:31:17.752
caa5cb2a-c357-4d5a-a481-e605dfd5e4c7	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	40c16d45-fb4d-4576-b199-35c906205817	2026-07-31 11:31:17.753
451234df-c9c7-4c99-96da-8ec283bd2dcc	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	127aac98-9593-4847-a090-3c7f561f883c	2026-07-31 11:31:17.754
3d1d72d1-5ceb-4a42-b5c2-8cb2449d57e0	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	dac5dd4e-9ba3-44ff-af18-df0f46aa77fc	2026-07-31 11:31:17.756
8af5fd87-abba-48ca-aacb-ab6a480fbbad	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	e1d3b13a-fd7a-4530-9322-7008a6caeadf	2026-07-31 11:31:17.757
e2738500-5c32-4402-8399-87d3a86f4595	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	e42af89a-16a8-4163-ba5b-fe6ce8544c77	2026-07-31 11:31:17.758
e9ca3d69-6957-4f51-bf2e-b1a1ce8b3e9c	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	08a66dbc-6204-4de1-b23e-1b553d7a979f	2026-07-31 11:31:17.76
0d118efb-0878-47e2-b6a4-a658c64f2d23	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	fb8d9b0f-fa2c-45c8-b304-f584920e36fd	2026-07-31 11:31:17.761
27722527-3bb4-4ce5-b3d8-534c0149d640	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	ff924b0d-1604-4dd4-8bd1-0b234cd45502	2026-07-31 11:31:17.762
9f1f963d-4830-4c38-9448-acc5f5bc8fe0	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	37f060fd-8d99-4dee-b196-c77cf5ff124d	2026-07-31 11:31:17.763
e5f5cc42-6f72-43d8-8f0f-36efef722091	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	7ce68843-03e2-48ce-9843-06da64203870	2026-07-31 11:31:17.765
f952014f-234f-44b1-922e-61789f80ed39	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	86cfef87-434f-4f51-aa29-981a06ffccc1	2026-07-31 11:31:17.766
53ef3877-565e-4286-969e-fa812d32a5e0	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	4077023d-6096-4fc7-9372-5705a06eece7	2026-07-31 11:31:17.767
2cec74d9-4823-4a5c-b30d-5b85cf456fe0	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	4e7033e1-1124-4334-8bc5-835507c4c091	2026-07-31 11:31:17.768
4ac0b98b-8b9c-44b6-98ee-e9ae3b22af36	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	3336a605-5f4d-43f7-b37b-e11213e1a2b8	2026-07-31 11:31:17.769
60320a7f-3cc5-4a66-9816-ef87709c169e	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	05de376b-5d87-4678-89d7-8a07b7c20132	2026-07-31 11:31:17.77
af87ff40-51fe-4b5d-9597-316d493af4af	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	daca7d69-0fe5-4a1a-8c1d-7e31d1792204	2026-07-31 11:31:17.772
df70a3b2-f050-4bc9-8fce-7aadd0120b21	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	3737e4ab-d6d0-447e-99f4-c14c4d0a549b	2026-07-31 11:31:17.774
9bb39712-67f8-4a6f-b83c-94cc0757946f	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	aa7616fd-c979-4c93-9324-06c7a113d1fb	2026-07-31 11:31:17.775
d504f01a-8b2e-479e-b5dc-2789fa7ae9dc	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	fb47d4c5-a049-447e-b9b8-3b4745604202	2026-07-31 11:31:17.777
109f91ea-3b76-4580-a542-28afe673673e	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	aefd535d-c849-4501-b47d-c8a962490ecd	2026-07-31 11:31:17.778
b2d0a366-65c2-47f2-a291-c8ae90bddbc3	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	25e6a179-c13b-422d-8c2b-9cac647fdc28	2026-07-31 11:31:17.779
ff10bf95-531b-4373-bb55-d74877a1094d	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	e0bf3e87-cf53-4c7d-97d1-384f6aab92fc	2026-07-31 11:31:17.78
255d36e6-c61f-4105-b22c-cc083053bb0d	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	36e8db0c-7755-4d05-aa63-19ff7f8fd931	2026-07-31 11:31:17.781
c5360e3b-82ce-475b-80e1-f1394724df1c	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	6b059063-6a74-4929-9375-67c0935baccf	2026-07-31 11:31:17.782
d6604aa2-10b6-40fa-a421-c43a7b81215a	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	4a1cdfc6-e124-4e29-8444-b7a5b92148d9	2026-07-31 11:31:17.783
39bf8a8b-5417-4eb4-91ed-877aaa79fc20	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	84520dcd-0b42-468c-924d-7188c7097dcc	2026-07-31 11:31:17.785
00ba9e22-37c1-4d93-8930-cbb63bbc8d8b	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	e670154d-604d-46e3-becf-96a1c4206382	2026-07-31 11:31:17.786
a26e0445-1c79-406d-b33b-3e27e12c63f2	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	1699cbab-2137-4549-9521-19ea6b726963	2026-07-31 11:31:17.787
c6618125-d493-4051-ac71-d21fcae9ae21	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	fce3bf11-8f91-4697-888b-d01080c724af	2026-07-31 11:31:17.789
cfca2e6d-3eff-4992-92ef-e3ffd5ae1be3	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	d0510b35-8c22-422a-a258-a77c4b7d5642	2026-07-31 11:31:17.79
a5e5eb5f-1fad-4802-ba27-3cd8356e7e26	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	ca16fc48-ae77-42f6-b0b4-c1c17c98b2d1	2026-07-31 11:31:17.791
fb6cde39-608a-4f6d-a056-f721d0eab4e9	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	683efa6d-0036-4cc0-a607-b7b0d6086a2d	2026-07-31 11:31:17.792
5da33611-54f4-4ead-9bcf-bf24aa3d3323	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	ff1f370e-fb6d-401c-8c38-99e0c58701fb	2026-07-31 11:31:17.793
c1813571-e048-44aa-89f1-cf2862474aa6	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	065a92d1-c998-404e-9f3b-31a251ca3662	2026-07-31 11:31:17.794
6a96b03c-ed3e-4bb5-86da-6e5a5d3200b4	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	76866a59-ea44-4199-9747-5e456a6b89d3	2026-07-31 11:31:17.795
a286946c-2a82-4cef-a7d8-ccce7a9bdb0c	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	50d846f2-aa7f-40c1-9430-9f1f38758f57	2026-07-31 11:31:17.796
1a770461-ce46-4a43-90e8-74df09e169c9	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	bcf2798c-a4b0-47cd-ac3a-d9c1c3fab3a4	2026-07-31 11:31:17.797
7b2dbf25-6cbb-400d-9599-2e0c8ae0aab9	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	22e1c1b1-9816-42c6-978d-bd1f0462268e	2026-07-31 11:31:17.798
ab6c64fd-faaa-4916-bd49-c6b6e4e119c6	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	fd6edba7-cbd1-4b28-920d-925695c78b8a	2026-07-31 11:31:17.799
bb154bfa-9a27-48ca-ba5d-be877403936f	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	2cd16ad2-82ec-40ec-b720-51d7a0d241bc	2026-07-31 11:31:17.8
42336c4b-64b5-40ec-9d55-d8abdd6e3ee3	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	4c993a3d-9f44-4db6-ab9b-3477b12ca7ab	2026-07-31 11:31:17.801
c18f2d77-5ffb-40db-ab28-a9bfc2dade83	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	033226a0-40c1-4344-a4f9-9d6520738eb1	2026-07-31 11:31:17.802
58b67b06-69dc-4ba8-9e5f-6ce85c8f72ab	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	2390eccb-9f3f-4bbc-b571-28acb5529593	2026-07-31 11:31:17.804
cd006b2b-2a67-4976-823e-362c0cd1e190	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	d7c14859-c077-4dc5-9159-24c46d8614f3	2026-07-31 11:31:17.805
161febb3-8fcd-4f2a-b15e-ec56ea93655e	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	38a18d4a-2502-4f99-8da2-c777ec360662	2026-07-31 11:31:17.806
68eae46d-5c0f-4335-80a6-7f7fb36f5327	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	be18c7a7-deba-4ace-be60-32e22834c593	2026-07-31 11:31:17.808
c4d6377b-543c-4f08-97a9-90f014ae2a72	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	aa517192-a87b-4714-b9d3-55f9dc6ce5d3	2026-07-31 11:31:17.809
02258013-fe58-43e0-b0da-2ecd8f97b406	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	615ce2f1-8b45-4073-884c-938dcec8ce14	2026-07-31 11:31:17.81
95c791f4-96e0-4713-bf55-2ecdb15d00be	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	149a71cd-8a41-49e8-ba84-5262b6347891	2026-07-31 11:31:17.811
8a67e9e7-7477-4fcd-ae71-53b85e38b2db	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	b81f54b9-408e-420f-adea-8123a67b063a	2026-07-31 11:31:17.812
e6935c27-e32e-428a-afe7-d7eed7ee4d9e	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	0bc07725-2bf8-4c51-9c76-47c8cb158054	2026-07-31 11:31:17.813
c0169f0c-e996-4ba8-8b41-00a542adc44e	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	a4fa5480-909b-429c-8c9e-1ab5cb8eb5fe	2026-07-31 11:31:17.814
c031a84c-8754-438b-ab8f-e572f8cc201e	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	4d34b1a1-6688-4b8b-8c43-c79574f13171	2026-07-31 11:31:17.815
d64bd128-ab93-4b47-add1-41ebd4acea2c	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	51e8d70f-d211-4996-846d-d27523e247b2	2026-07-31 11:31:17.816
419c214b-587d-4d15-a613-9d8c52c98a17	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	4e0fa767-3558-4d71-b986-e96a88b84594	2026-07-31 11:31:17.817
163cdc08-53ba-4a30-baed-93b1f5959f99	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	13f99a1a-79bd-415c-8589-b7cdef7ed39b	2026-07-31 11:31:17.818
aaaf2087-2adc-49c0-9399-b75af39740de	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	a2970c39-cc5d-46fc-a26c-03c31be74749	2026-07-31 11:31:17.819
f616ea3f-c74d-4622-8ed4-720f32ee93d6	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	0f98bfd9-4cb0-45a2-a2b3-95f541bdbae4	2026-07-31 11:31:17.82
a8ce5570-a08f-4c46-a09a-6c10cff8f9b0	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	daca7d69-0fe5-4a1a-8c1d-7e31d1792204	2026-07-31 11:31:17.822
a0989c58-6f8d-4d9f-8a47-72f87639bd8a	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	3737e4ab-d6d0-447e-99f4-c14c4d0a549b	2026-07-31 11:31:17.823
0721f4ea-137f-4bcd-8053-5b5146f24014	dcfd5545-3953-4baf-b993-e43a46ca6d3d	149a71cd-8a41-49e8-ba84-5262b6347891	2026-07-31 11:31:17.824
993abae8-0fcb-45ab-b806-990e669b75e0	dcfd5545-3953-4baf-b993-e43a46ca6d3d	e1d3b13a-fd7a-4530-9322-7008a6caeadf	2026-07-31 11:31:17.825
c407c644-7932-4330-bda3-9a6a6ba2c2c2	dcfd5545-3953-4baf-b993-e43a46ca6d3d	64e4abaf-9d70-4b69-846e-cd4ff88be5c1	2026-07-31 11:31:17.826
de170469-5045-464e-b3cd-5308ff736d97	dcfd5545-3953-4baf-b993-e43a46ca6d3d	382b42b1-e21f-49cc-bce8-75aa1d2e26e8	2026-07-31 11:31:17.827
3b1b2c8c-5278-46a7-9d32-6f451b64be06	dcfd5545-3953-4baf-b993-e43a46ca6d3d	b81f54b9-408e-420f-adea-8123a67b063a	2026-07-31 11:31:17.828
cbc20f72-6f2b-4df9-ae13-05ae41e2e044	dcfd5545-3953-4baf-b993-e43a46ca6d3d	aefd535d-c849-4501-b47d-c8a962490ecd	2026-07-31 11:31:17.83
968d4e37-7dc6-4e71-8fc2-4538becb5e59	dcfd5545-3953-4baf-b993-e43a46ca6d3d	7ffd1fa3-cab7-4910-8925-6876f8c607ca	2026-07-31 11:31:17.831
41b0741f-15df-4378-a5fe-d0b6aa652e30	dcfd5545-3953-4baf-b993-e43a46ca6d3d	0059bd23-d088-4a0f-8198-d4c3198f75b4	2026-07-31 11:31:17.832
5913760e-4f65-402d-8417-cb7f3bde0119	dcfd5545-3953-4baf-b993-e43a46ca6d3d	25e6a179-c13b-422d-8c2b-9cac647fdc28	2026-07-31 11:31:17.833
d06b0079-7181-40e4-b2d5-ace7a7dd0009	dcfd5545-3953-4baf-b993-e43a46ca6d3d	36e8db0c-7755-4d05-aa63-19ff7f8fd931	2026-07-31 11:31:17.834
2d1fbf6f-e76e-4a60-b60d-f44ec7012a70	dcfd5545-3953-4baf-b993-e43a46ca6d3d	1af4fc0b-8fb9-4265-96ba-063907472ed9	2026-07-31 11:31:17.835
19d977a3-1b3e-4817-b86c-92a4eeb3dd10	dcfd5545-3953-4baf-b993-e43a46ca6d3d	7c1e0f23-7cee-4e5d-ab04-579dec088f7d	2026-07-31 11:31:17.836
25b6e18e-7d5e-4855-914d-d12f46e0e201	dcfd5545-3953-4baf-b993-e43a46ca6d3d	740ae2d0-eb8a-4812-a6d8-2ba55b7ec11c	2026-07-31 11:31:17.838
677b34a0-4f8c-4134-9e8f-eabc96acce3d	dcfd5545-3953-4baf-b993-e43a46ca6d3d	c5304fb0-7831-4ab4-877f-7e9cb59ee502	2026-07-31 11:31:17.839
348f7212-eb80-4c3f-b00d-bb48c171ac8d	dcfd5545-3953-4baf-b993-e43a46ca6d3d	789ee04f-cb9b-479f-aef5-1ee75b67446c	2026-07-31 11:31:17.841
dc30c6a3-ff17-4a68-bfa7-e4603942ac61	dcfd5545-3953-4baf-b993-e43a46ca6d3d	daeda1f5-810a-49c9-81de-03fa553ce31f	2026-07-31 11:31:17.842
c7219d82-941f-4459-831e-21d2b5447d0d	dcfd5545-3953-4baf-b993-e43a46ca6d3d	7741adb9-7c1c-4bbd-966a-24e0f5f547e5	2026-07-31 11:31:17.843
74b7e960-dac4-469d-90c6-f46373df08af	dcfd5545-3953-4baf-b993-e43a46ca6d3d	1d9347e5-129a-490f-86c1-b27df5891668	2026-07-31 11:31:17.844
b7addbf8-30f6-43e6-a790-ba6d66374a2f	dcfd5545-3953-4baf-b993-e43a46ca6d3d	0bc07725-2bf8-4c51-9c76-47c8cb158054	2026-07-31 11:31:17.845
bb5d5cd9-9ede-4929-a73b-e69922f5f350	dcfd5545-3953-4baf-b993-e43a46ca6d3d	7dbf0cbe-b68e-48e0-8ec3-3be6908fba11	2026-07-31 11:31:17.846
a20dd52b-0d1f-42a3-a95a-6484c3d5b9a8	dcfd5545-3953-4baf-b993-e43a46ca6d3d	6e74d280-9baf-41b0-8b7a-23010e950382	2026-07-31 11:31:17.847
68e4d3b0-ef2b-448d-9a75-ac2105f9e626	dcfd5545-3953-4baf-b993-e43a46ca6d3d	cfbcf0b3-ef5c-4584-9d1a-83a6cee2495c	2026-07-31 11:31:17.848
c2d61451-4322-4c49-8d50-3106bcaad9c3	dcfd5545-3953-4baf-b993-e43a46ca6d3d	c4be8531-447d-440f-b065-98bc9338ee80	2026-07-31 11:31:17.849
ed029ee6-7def-4e3a-ba1d-8856dd3969b8	dcfd5545-3953-4baf-b993-e43a46ca6d3d	300e6166-b3d4-4756-bd3d-5e6be628d559	2026-07-31 11:31:17.85
eb932282-eedf-449b-a5dc-9d6f8c7975d9	dcfd5545-3953-4baf-b993-e43a46ca6d3d	bde13fc1-85df-4cea-8e9d-e12d1b9acdce	2026-07-31 11:31:17.851
a8e61651-e0fb-4127-9215-73ec418c04e7	dcfd5545-3953-4baf-b993-e43a46ca6d3d	a71247cc-8965-4ea1-a52d-159f4a9352da	2026-07-31 11:31:17.852
cf79ddf7-d9f9-4f8b-b177-e95be8211ded	dcfd5545-3953-4baf-b993-e43a46ca6d3d	68593ab7-ec91-4918-a8dd-8e19bf0c35d3	2026-07-31 11:31:17.854
d913ca4f-2f44-4929-9792-75b52f5e45c8	dcfd5545-3953-4baf-b993-e43a46ca6d3d	9c61877a-9926-4bb9-911d-3f0c63ca2d04	2026-07-31 11:31:17.855
b87d4652-ac4a-4605-ad65-f737acdf3f61	dcfd5545-3953-4baf-b993-e43a46ca6d3d	a4fa5480-909b-429c-8c9e-1ab5cb8eb5fe	2026-07-31 11:31:17.857
fdaf43e3-3784-4f16-9889-06783605ccda	dcfd5545-3953-4baf-b993-e43a46ca6d3d	e42af89a-16a8-4163-ba5b-fe6ce8544c77	2026-07-31 11:31:17.858
633f1767-1bd4-43ff-9808-fe701dbcec26	dcfd5545-3953-4baf-b993-e43a46ca6d3d	9694f2b2-407f-49ec-b3a0-2e3d8a29f001	2026-07-31 11:31:17.859
c601658c-f354-4b4b-a6c6-486ef3aa5f45	dcfd5545-3953-4baf-b993-e43a46ca6d3d	4d34b1a1-6688-4b8b-8c43-c79574f13171	2026-07-31 11:31:17.86
c316246a-3e96-4992-96cc-96a8707d5fa8	dcfd5545-3953-4baf-b993-e43a46ca6d3d	08a66dbc-6204-4de1-b23e-1b553d7a979f	2026-07-31 11:31:17.861
ad1f86b4-2359-49bf-9738-9bc90db07347	dcfd5545-3953-4baf-b993-e43a46ca6d3d	a63e189e-e564-4cba-8e52-8cf42b3349e0	2026-07-31 11:31:17.862
4175bdcd-09d4-48bf-a41e-6a7e7ced9302	dcfd5545-3953-4baf-b993-e43a46ca6d3d	318d1b36-1a96-4ea2-9520-b3aaee2c2213	2026-07-31 11:31:17.863
dc856e39-be43-4a74-abc6-888abdf1bf83	dcfd5545-3953-4baf-b993-e43a46ca6d3d	032b9405-38e7-40cd-8254-8d082370fc07	2026-07-31 11:31:17.864
e1a41ec9-ae74-4b74-9cda-066d1741ae29	dcfd5545-3953-4baf-b993-e43a46ca6d3d	cc01b521-8686-4445-b9f9-a9540f4062bf	2026-07-31 11:31:17.865
9d8203e8-d963-46d4-a649-3404df69a552	dcfd5545-3953-4baf-b993-e43a46ca6d3d	51e8d70f-d211-4996-846d-d27523e247b2	2026-07-31 11:31:17.866
de7f820c-9e82-4e13-8bca-fd1da9bf34c4	dcfd5545-3953-4baf-b993-e43a46ca6d3d	fb8d9b0f-fa2c-45c8-b304-f584920e36fd	2026-07-31 11:31:17.867
2702021a-9f62-49f7-9abd-d74271315f1f	dcfd5545-3953-4baf-b993-e43a46ca6d3d	aad8430e-5e45-4cba-a1ca-89d416e12ccf	2026-07-31 11:31:17.868
38425ba9-1b03-465f-8ac8-06c5076171eb	dcfd5545-3953-4baf-b993-e43a46ca6d3d	4e0fa767-3558-4d71-b986-e96a88b84594	2026-07-31 11:31:17.869
98732109-fb1f-412e-b894-7afcfc943e02	dcfd5545-3953-4baf-b993-e43a46ca6d3d	ff924b0d-1604-4dd4-8bd1-0b234cd45502	2026-07-31 11:31:17.87
910aba5e-2f6a-4385-ac08-6a00ec935d7d	dcfd5545-3953-4baf-b993-e43a46ca6d3d	3e2114f8-716f-4eac-a15f-468429c859df	2026-07-31 11:31:17.872
1a387469-7687-4973-9727-5cf3947ca17c	dcfd5545-3953-4baf-b993-e43a46ca6d3d	30db9e1b-a5c2-42b2-875b-ac40b4a1cfb0	2026-07-31 11:31:17.873
59cc89f3-7994-4aef-8200-4087040d557f	dcfd5545-3953-4baf-b993-e43a46ca6d3d	37f060fd-8d99-4dee-b196-c77cf5ff124d	2026-07-31 11:31:17.875
834ffd52-eb29-4b7d-992c-585f2b0c63e3	dcfd5545-3953-4baf-b993-e43a46ca6d3d	13f99a1a-79bd-415c-8589-b7cdef7ed39b	2026-07-31 11:31:17.876
0156981d-f476-4ae2-a527-241c012b1263	dcfd5545-3953-4baf-b993-e43a46ca6d3d	7ce68843-03e2-48ce-9843-06da64203870	2026-07-31 11:31:17.877
0100851d-266e-42d7-a092-48f8d163b909	dcfd5545-3953-4baf-b993-e43a46ca6d3d	86cfef87-434f-4f51-aa29-981a06ffccc1	2026-07-31 11:31:17.878
c5771cf5-4933-4ace-9a7a-62738c306a7f	dcfd5545-3953-4baf-b993-e43a46ca6d3d	4077023d-6096-4fc7-9372-5705a06eece7	2026-07-31 11:31:17.879
52c79281-99ec-4dc3-858b-3563cd9bbb06	dcfd5545-3953-4baf-b993-e43a46ca6d3d	3336a605-5f4d-43f7-b37b-e11213e1a2b8	2026-07-31 11:31:17.88
78ee3cc2-b852-41a7-9d47-5f19ea60f5ee	dcfd5545-3953-4baf-b993-e43a46ca6d3d	05de376b-5d87-4678-89d7-8a07b7c20132	2026-07-31 11:31:17.881
3c054606-3a55-4de6-ad6a-8d1221377cf2	dcfd5545-3953-4baf-b993-e43a46ca6d3d	3debeb00-2d01-47c1-9d74-969eab967abf	2026-07-31 11:31:17.882
3d8a7400-8815-4f42-85cf-9b97600ed2c2	dcfd5545-3953-4baf-b993-e43a46ca6d3d	6bd38e7a-8567-4d52-bc3f-a485fda5b219	2026-07-31 11:31:17.883
ee4ef4b7-bf7f-4ce4-bbe6-d4bcae6f5ad6	dcfd5545-3953-4baf-b993-e43a46ca6d3d	94e6a6fe-90d2-473d-b408-ee6eee28be9e	2026-07-31 11:31:17.884
3ef00ace-4a7f-4989-beb7-1db5fade9a53	dcfd5545-3953-4baf-b993-e43a46ca6d3d	79881ce2-f7a2-4205-8b9a-2e58a0708a05	2026-07-31 11:31:17.885
6c4088a8-f77d-478d-9095-07714eed34b8	dcfd5545-3953-4baf-b993-e43a46ca6d3d	3f39f1ae-abee-480c-9d81-6cf17783cc8c	2026-07-31 11:31:17.886
e0933df4-75e0-4a53-86f8-4896bec10a36	dcfd5545-3953-4baf-b993-e43a46ca6d3d	d14f236a-1034-44b5-a158-419de6398e41	2026-07-31 11:31:17.888
23674d5e-78a5-457a-a07d-dd422ea8ee59	dcfd5545-3953-4baf-b993-e43a46ca6d3d	2cd16ad2-82ec-40ec-b720-51d7a0d241bc	2026-07-31 11:31:17.89
8bef10ef-d509-4450-88a0-ad4a1d632871	dcfd5545-3953-4baf-b993-e43a46ca6d3d	4c993a3d-9f44-4db6-ab9b-3477b12ca7ab	2026-07-31 11:31:17.891
f416eb67-f499-4109-b400-f73f107ac276	dcfd5545-3953-4baf-b993-e43a46ca6d3d	daca7d69-0fe5-4a1a-8c1d-7e31d1792204	2026-07-31 11:31:17.893
0038f0ad-c0ef-45e0-8d21-05f7c5ec4b0c	dcfd5545-3953-4baf-b993-e43a46ca6d3d	3737e4ab-d6d0-447e-99f4-c14c4d0a549b	2026-07-31 11:31:17.894
2a8a1b85-386d-4507-aa62-42ac2c871ffa	dcfd5545-3953-4baf-b993-e43a46ca6d3d	bdef25f5-437b-4fbe-b026-fbcbf6cd529b	2026-07-31 11:31:17.895
b1b48005-6ccd-466a-9cdb-bccde92bc335	dcfd5545-3953-4baf-b993-e43a46ca6d3d	59440001-b2bd-4c6e-a461-40c50f6bc129	2026-07-31 11:31:17.896
a6c28739-b5a8-4776-aa43-669c66792e54	6c26bf20-3796-4367-bd41-ee8286f2984d	e9bf5f01-2fe7-40c4-907e-815abfbd094a	2026-07-31 11:31:17.897
91f9eb7e-63cf-4bd4-99ef-57a9b0e16a64	6c26bf20-3796-4367-bd41-ee8286f2984d	1c8b5a33-5ac5-4953-9abe-75723b7948fd	2026-07-31 11:31:17.898
cd7fba4f-1665-4bc9-8b11-48adafdf43ae	6c26bf20-3796-4367-bd41-ee8286f2984d	66d1168d-a5a7-423c-82ab-7685bed52e8a	2026-07-31 11:31:17.899
8a984a8c-8526-4a89-9b56-4f87d728b310	6c26bf20-3796-4367-bd41-ee8286f2984d	4f9392ab-270d-4502-8ca6-94fff75f1253	2026-07-31 11:31:17.9
6ec71891-d350-49be-88dd-e88444c17411	6c26bf20-3796-4367-bd41-ee8286f2984d	349397fc-5d4f-4ffe-8d54-1feafde159f4	2026-07-31 11:31:17.901
c4f1c47a-2580-4159-b37f-c688646f4716	6c26bf20-3796-4367-bd41-ee8286f2984d	95f376c8-800c-4d76-86c4-a8176b20e901	2026-07-31 11:31:17.902
2f532ce3-ccfd-4e27-a424-54406c6c8929	6c26bf20-3796-4367-bd41-ee8286f2984d	8387782b-a978-42d3-85f5-da846b74e766	2026-07-31 11:31:17.903
a90b8b21-1c20-4dd4-990c-87e495ba806e	6c26bf20-3796-4367-bd41-ee8286f2984d	39f10dc5-1e4d-4ccb-a674-3e0e399e915a	2026-07-31 11:31:17.905
52ee31d1-e585-44c4-a326-92fb00ceeb79	6c26bf20-3796-4367-bd41-ee8286f2984d	af900d07-e032-463c-9a62-ce40ec3b863e	2026-07-31 11:31:17.906
2d1a7e22-04ae-4ade-a29d-41d843fc69f2	6c26bf20-3796-4367-bd41-ee8286f2984d	39948cf2-c527-47fd-9d95-5b35d60443bb	2026-07-31 11:31:17.908
3954f813-b353-45bc-a0b6-6e5a60777f96	6c26bf20-3796-4367-bd41-ee8286f2984d	a3a3534f-9ad8-43d4-9a2c-5ef9d9d387ed	2026-07-31 11:31:17.909
eac04b66-6de0-4a31-817d-0da82debf1c0	6c26bf20-3796-4367-bd41-ee8286f2984d	293ef276-fc77-4c9d-b2a8-7df8806edf6d	2026-07-31 11:31:17.91
c664af63-be3a-480e-9b7d-fb2cb77a2128	6c26bf20-3796-4367-bd41-ee8286f2984d	d3aeb885-06c0-4c74-9ab0-4bfcf2450308	2026-07-31 11:31:17.911
a93bf637-2ab9-4273-924e-4fa71df01f34	6c26bf20-3796-4367-bd41-ee8286f2984d	fe789135-b250-4714-a120-e7189498c043	2026-07-31 11:31:17.912
5083a431-6912-48fc-95b9-5238b74d3ab0	6c26bf20-3796-4367-bd41-ee8286f2984d	57a3e214-9a26-4380-9ca7-cc7b3a0e3b0c	2026-07-31 11:31:17.914
c7363fe1-8d34-4cbe-9a7b-2f4e14fda23f	6c26bf20-3796-4367-bd41-ee8286f2984d	05de376b-5d87-4678-89d7-8a07b7c20132	2026-07-31 11:31:17.915
bdf84f35-fc68-4cfb-b19b-3aefec060142	6c26bf20-3796-4367-bd41-ee8286f2984d	3debeb00-2d01-47c1-9d74-969eab967abf	2026-07-31 11:31:17.916
dcfd0df2-ce80-437f-ba5c-6adaf422a002	6c26bf20-3796-4367-bd41-ee8286f2984d	ab8b86aa-9d42-470a-ac0a-6e9b906c0f9d	2026-07-31 11:31:17.917
aaf270d3-ba1a-453d-852b-8ca3a1e5d05f	6c26bf20-3796-4367-bd41-ee8286f2984d	40c16d45-fb4d-4576-b199-35c906205817	2026-07-31 11:31:17.918
ebcbd290-806f-4ac9-a501-3a000bad12c6	6c26bf20-3796-4367-bd41-ee8286f2984d	62109245-aed6-41ca-92da-3a33264263c7	2026-07-31 11:31:17.919
d6541496-5590-4cab-9c49-5c2709927142	6c26bf20-3796-4367-bd41-ee8286f2984d	e2b6218f-9464-4a3a-94c2-aeba7de531a7	2026-07-31 11:31:17.921
6ac78acd-0269-4806-b943-b241e0a5904a	6c26bf20-3796-4367-bd41-ee8286f2984d	bd2d52c5-7f7c-49fa-bbba-5d5a77dafdd0	2026-07-31 11:31:17.922
3f2583f2-7116-4321-9eb2-74412e3b0b83	6c26bf20-3796-4367-bd41-ee8286f2984d	15022f24-1eec-4e5c-9f2c-76bc8af96994	2026-07-31 11:31:17.924
6376bc0f-7a63-4d2c-9881-52d07123d0e8	6c26bf20-3796-4367-bd41-ee8286f2984d	dac5dd4e-9ba3-44ff-af18-df0f46aa77fc	2026-07-31 11:31:17.925
ef201ba7-a40e-4c55-a9fc-a831f9b40032	6c26bf20-3796-4367-bd41-ee8286f2984d	3064cc49-40a0-4622-84e6-18086e6ec715	2026-07-31 11:31:17.926
777b64f8-6dec-4e69-b8ff-b384b6d9bd62	6c26bf20-3796-4367-bd41-ee8286f2984d	2cd16ad2-82ec-40ec-b720-51d7a0d241bc	2026-07-31 11:31:17.927
781f6caf-f547-4dfb-b641-0f9ddcfc0b0f	325aca85-0535-4236-889b-b96c38179578	8242a1eb-3059-41b6-9b07-1d495bdb88ce	2026-07-31 11:31:17.928
e7997c05-f6de-4db3-b082-3051b8c33bb2	325aca85-0535-4236-889b-b96c38179578	140f53dd-b1bd-495d-bd58-b369b0cbe331	2026-07-31 11:31:17.929
59ed796a-14c9-4044-ba81-ab044325ba6b	325aca85-0535-4236-889b-b96c38179578	7215bf34-e198-488d-adf6-a66ba3f36a88	2026-07-31 11:31:17.93
b429e0ac-66cb-4641-bf1d-20429db6c0d2	325aca85-0535-4236-889b-b96c38179578	033226a0-40c1-4344-a4f9-9d6520738eb1	2026-07-31 11:31:17.931
07476c6d-b537-468e-86d4-ba844e200402	325aca85-0535-4236-889b-b96c38179578	3231c521-f303-4a5f-b530-df76068d9055	2026-07-31 11:31:17.932
c69b9eba-f06d-417a-8fed-1b343127e9b3	325aca85-0535-4236-889b-b96c38179578	8846c6ac-c020-45eb-a15c-98e77837b3a9	2026-07-31 11:31:17.933
82f7e0d6-904e-4b4d-b6a4-1504c5f5aa72	325aca85-0535-4236-889b-b96c38179578	3ef88bfc-a7e7-48d4-b4b4-54ba0afbc5de	2026-07-31 11:31:17.934
40b24655-ac3c-48aa-9e08-1c90e29f1426	325aca85-0535-4236-889b-b96c38179578	ffb082a4-e6a9-4ef2-9ec5-d361990fdc77	2026-07-31 11:31:17.936
fc5101a7-21b6-4694-a383-4946a621c14a	325aca85-0535-4236-889b-b96c38179578	ce422422-bf99-4728-bb72-112c64164da1	2026-07-31 11:31:17.937
e7eee08f-da12-4747-9a85-4a30798ace23	325aca85-0535-4236-889b-b96c38179578	d7c14859-c077-4dc5-9159-24c46d8614f3	2026-07-31 11:31:17.939
ef2826bd-e46f-42d6-9f9d-b21dcf920b4d	325aca85-0535-4236-889b-b96c38179578	37c0f8ee-850a-4045-8178-6c1b941ae86a	2026-07-31 11:31:17.94
1fc74f5f-eb40-49e1-86ee-bdc186e14c8f	325aca85-0535-4236-889b-b96c38179578	17474300-6128-446d-8b46-e62e0a711df6	2026-07-31 11:31:17.941
ed3b2646-d181-4e5e-aabf-34e097380c51	325aca85-0535-4236-889b-b96c38179578	38a18d4a-2502-4f99-8da2-c777ec360662	2026-07-31 11:31:17.943
e932850c-5217-4fe5-b530-2f65673b297a	325aca85-0535-4236-889b-b96c38179578	3d109bb5-4efe-4f40-8791-c9ba0c4bdc19	2026-07-31 11:31:17.944
ca693359-f6b1-419c-a51f-4d7cdf2872c3	325aca85-0535-4236-889b-b96c38179578	be18c7a7-deba-4ace-be60-32e22834c593	2026-07-31 11:31:17.945
b015b701-6d8e-45f3-bd22-2a446bbb8bd1	325aca85-0535-4236-889b-b96c38179578	6aee6b79-0057-4fe5-8b66-cf712c539cae	2026-07-31 11:31:17.946
9350ba27-44e5-4a6a-8aef-9580a52e2857	325aca85-0535-4236-889b-b96c38179578	67849923-36f3-4c54-826f-14e8829aa95b	2026-07-31 11:31:17.947
48d92496-0e57-43de-9c45-287ba238f3f6	325aca85-0535-4236-889b-b96c38179578	5b04f5f9-74b3-4746-b0a5-e02a44b988e4	2026-07-31 11:31:17.949
20b4c1d7-f29a-4ef4-963e-6f45a408b558	325aca85-0535-4236-889b-b96c38179578	0500928c-0c9d-4349-b555-5bfe0189da7b	2026-07-31 11:31:17.95
1ea59efa-f9ba-4b35-b34b-964a62a6526d	325aca85-0535-4236-889b-b96c38179578	56636640-f352-42b4-b61a-eb8bcf1f896f	2026-07-31 11:31:17.951
9d3fc66a-a7bc-4639-93a3-f725bf58851e	325aca85-0535-4236-889b-b96c38179578	ca25a119-5cc2-4518-adb3-d20b32f1088f	2026-07-31 11:31:17.952
f6e01fe8-ed97-4e97-a228-da7f5c0e3523	325aca85-0535-4236-889b-b96c38179578	f47838ac-a229-477c-a8c2-bb66482cf486	2026-07-31 11:31:17.953
19de0b1c-fea9-487a-b5d3-b4a4c6a1a727	325aca85-0535-4236-889b-b96c38179578	37f060fd-8d99-4dee-b196-c77cf5ff124d	2026-07-31 11:31:17.954
01115ad7-169c-4148-8304-2299221321f6	325aca85-0535-4236-889b-b96c38179578	5619c44a-e412-45bb-a30e-f7aa4a910fff	2026-07-31 11:31:17.956
43f1d2a3-6395-422a-9cdd-66ae10f651fc	325aca85-0535-4236-889b-b96c38179578	4e7033e1-1124-4334-8bc5-835507c4c091	2026-07-31 11:31:17.957
862535f4-734c-45da-a29b-f9f2f6115624	325aca85-0535-4236-889b-b96c38179578	05de376b-5d87-4678-89d7-8a07b7c20132	2026-07-31 11:31:17.958
3a542233-85f3-427d-bd0a-3dd65df4223c	325aca85-0535-4236-889b-b96c38179578	3debeb00-2d01-47c1-9d74-969eab967abf	2026-07-31 11:31:17.959
415ac8a9-818e-4bf2-8c0c-a3e25417057b	325aca85-0535-4236-889b-b96c38179578	2cd16ad2-82ec-40ec-b720-51d7a0d241bc	2026-07-31 11:31:17.96
6f0ee1c5-c4fd-412a-8f4b-64c2180ea5c5	325aca85-0535-4236-889b-b96c38179578	4c993a3d-9f44-4db6-ab9b-3477b12ca7ab	2026-07-31 11:31:17.961
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (id, code, name, description, "isSystem", "createdAt", "updatedAt") FROM stdin;
66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	ADMIN	Quản trị hệ thống	\N	t	2026-07-31 11:31:16.047	2026-07-31 11:31:16.047
96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	LEADER	Leader	\N	t	2026-07-31 11:31:17.51	2026-07-31 11:31:17.51
6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	EMPLOYEE	Employee	\N	t	2026-07-31 11:31:17.512	2026-07-31 11:31:17.512
325aca85-0535-4236-889b-b96c38179578	WAREHOUSE_MANAGER	Warehouse Manager	\N	t	2026-07-31 11:31:17.513	2026-07-31 11:31:17.513
6c26bf20-3796-4367-bd41-ee8286f2984d	ACCOUNTANT	Accountant	\N	t	2026-07-31 11:31:17.514	2026-07-31 11:31:17.514
dcfd5545-3953-4baf-b993-e43a46ca6d3d	HR	Human Resources	\N	t	2026-07-31 11:31:17.515	2026-07-31 11:31:17.515
\.


--
-- Data for Name: salary_components; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.salary_components (id, code, name, "componentType", "calculationType", "defaultAmount", "formulaKey", taxable, "insuranceApplicable", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: salary_profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.salary_profiles (id, "userId", "salaryType", "baseSalary", "standardWorkingDays", "standardWorkingHours", "hourlyRate", "dailyRate", currency, "effectiveFrom", "effectiveTo", "createdById", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: shift_assignments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shift_assignments (id, "userId", "departmentId", "shiftId", "workDate", status, "assignedByUserId", "createdAt", "updatedAt") FROM stdin;
02cf7e26-dad5-4c37-91ef-dc26228befce	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	1d04d87f-ee21-472b-8abe-b502f5c2c11f	2026-08-20	ASSIGNED	49098001-4375-47f0-b36d-c8758d8715ff	2026-08-20 02:11:58.671	2026-08-20 02:11:58.671
f041ec80-2dd4-4f16-8b10-345592c93508	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	1d04d87f-ee21-472b-8abe-b502f5c2c11f	2026-08-21	ASSIGNED	49098001-4375-47f0-b36d-c8758d8715ff	2026-08-20 02:11:58.825	2026-08-20 02:11:58.825
b4723309-1652-456d-bf46-959a7a43c392	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	1d04d87f-ee21-472b-8abe-b502f5c2c11f	2026-08-22	ASSIGNED	49098001-4375-47f0-b36d-c8758d8715ff	2026-08-20 02:11:58.927	2026-08-20 02:11:58.927
f3c90c25-5921-4832-aea4-01c625bbf3bf	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	1d04d87f-ee21-472b-8abe-b502f5c2c11f	2026-08-17	ASSIGNED	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-20 02:12:49.565	2026-08-20 02:12:49.565
e221d01b-3bba-4b59-bc13-b28529bb07d1	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	1d04d87f-ee21-472b-8abe-b502f5c2c11f	2026-08-18	ASSIGNED	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-20 02:12:49.712	2026-08-20 02:12:49.712
f32f2f62-6488-4aaf-8f67-eaf7cf18109e	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	1d04d87f-ee21-472b-8abe-b502f5c2c11f	2026-08-19	ASSIGNED	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-20 02:12:49.812	2026-08-20 02:12:49.812
ce40f63f-4133-4f0e-b8b9-c1ab910ef1a1	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	1d04d87f-ee21-472b-8abe-b502f5c2c11f	2026-08-20	ASSIGNED	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-20 02:12:49.91	2026-08-20 02:12:49.91
15f66d1b-06e0-42c7-9c29-fcb2fb25b3fc	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	1d04d87f-ee21-472b-8abe-b502f5c2c11f	2026-08-21	ASSIGNED	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-20 02:12:50.009	2026-08-20 02:12:50.009
df1c36aa-b7ac-4696-9b2d-74bb87d46bf0	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	1d04d87f-ee21-472b-8abe-b502f5c2c11f	2026-08-22	ASSIGNED	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-20 02:12:50.108	2026-08-20 02:12:50.108
5feca5e7-3668-4636-b71e-a10fea3233d0	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	1d04d87f-ee21-472b-8abe-b502f5c2c11f	2026-08-25	ASSIGNED	49098001-4375-47f0-b36d-c8758d8715ff	2026-08-24 19:19:04.84	2026-08-24 19:19:04.84
abf6fc49-da69-4dd0-af4a-4a5bd23c3029	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	1d04d87f-ee21-472b-8abe-b502f5c2c11f	2026-08-26	ASSIGNED	49098001-4375-47f0-b36d-c8758d8715ff	2026-08-24 19:19:04.99	2026-08-24 19:19:04.99
66404c83-70dd-478e-ad02-a036677a6b7f	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	1d04d87f-ee21-472b-8abe-b502f5c2c11f	2026-08-27	ASSIGNED	49098001-4375-47f0-b36d-c8758d8715ff	2026-08-24 19:19:05.088	2026-08-24 19:19:05.088
b7e6bb74-2fcc-4b12-b624-1e37383f366c	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	1d04d87f-ee21-472b-8abe-b502f5c2c11f	2026-08-28	ASSIGNED	49098001-4375-47f0-b36d-c8758d8715ff	2026-08-24 19:19:05.187	2026-08-24 19:19:05.187
b22e8d0b-5047-4efc-9ec8-35785a716e80	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	1d04d87f-ee21-472b-8abe-b502f5c2c11f	2026-08-29	ASSIGNED	49098001-4375-47f0-b36d-c8758d8715ff	2026-08-24 19:19:05.285	2026-08-24 19:19:05.285
5f19f389-0953-4a08-955a-09ba3b513d45	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	1d04d87f-ee21-472b-8abe-b502f5c2c11f	2026-08-25	ASSIGNED	49098001-4375-47f0-b36d-c8758d8715ff	2026-08-24 19:19:06.662	2026-08-24 19:19:06.662
4ff9bf9d-3756-45e7-81b9-aa8ab447382e	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	1d04d87f-ee21-472b-8abe-b502f5c2c11f	2026-08-26	ASSIGNED	49098001-4375-47f0-b36d-c8758d8715ff	2026-08-24 19:19:06.759	2026-08-24 19:19:06.759
6099773d-d50e-4460-8d0a-d5bf141f0c27	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	1d04d87f-ee21-472b-8abe-b502f5c2c11f	2026-08-27	ASSIGNED	49098001-4375-47f0-b36d-c8758d8715ff	2026-08-24 19:19:06.856	2026-08-24 19:19:06.856
70f6db91-8d25-4fd4-bc2a-d3f280e2f5df	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	1d04d87f-ee21-472b-8abe-b502f5c2c11f	2026-08-28	ASSIGNED	49098001-4375-47f0-b36d-c8758d8715ff	2026-08-24 19:19:06.954	2026-08-24 19:19:06.954
8a2adb9b-9513-4772-8033-054673b6b8ff	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	1d04d87f-ee21-472b-8abe-b502f5c2c11f	2026-08-29	ASSIGNED	49098001-4375-47f0-b36d-c8758d8715ff	2026-08-24 19:19:07.051	2026-08-24 19:19:07.051
932c8d51-ebeb-4beb-82b7-8d157c8c1ed3	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	1d04d87f-ee21-472b-8abe-b502f5c2c11f	2026-08-25	ASSIGNED	49098001-4375-47f0-b36d-c8758d8715ff	2026-08-24 19:19:07.417	2026-08-24 19:19:07.417
cd65205d-8adf-4415-ace2-bfc9e27e2c9c	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	1d04d87f-ee21-472b-8abe-b502f5c2c11f	2026-08-26	ASSIGNED	49098001-4375-47f0-b36d-c8758d8715ff	2026-08-24 19:19:07.516	2026-08-24 19:19:07.516
e3139d94-ec03-4cbc-99e6-4a4154595340	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	1d04d87f-ee21-472b-8abe-b502f5c2c11f	2026-08-27	ASSIGNED	49098001-4375-47f0-b36d-c8758d8715ff	2026-08-24 19:19:07.614	2026-08-24 19:19:07.614
afa1e3c4-0b04-4fdd-9a0d-40f82a4402b2	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	1d04d87f-ee21-472b-8abe-b502f5c2c11f	2026-08-28	ASSIGNED	49098001-4375-47f0-b36d-c8758d8715ff	2026-08-24 19:19:07.711	2026-08-24 19:19:07.711
45663cb0-9fea-4e5b-9ba4-dd1796519905	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	1d04d87f-ee21-472b-8abe-b502f5c2c11f	2026-08-29	ASSIGNED	49098001-4375-47f0-b36d-c8758d8715ff	2026-08-24 19:19:07.808	2026-08-24 19:19:07.808
6271af3e-f6a2-4900-ad59-d22d1e7167a0	545ef296-1135-4885-8e61-89932645af6c	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	1d04d87f-ee21-472b-8abe-b502f5c2c11f	2026-08-24	ASSIGNED	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-29 04:56:08.002	2026-08-29 04:56:08.002
e8ca6bed-45f5-4a2c-b434-dddd1e81ad87	545ef296-1135-4885-8e61-89932645af6c	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	1d04d87f-ee21-472b-8abe-b502f5c2c11f	2026-08-25	ASSIGNED	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-29 04:56:08.16	2026-08-29 04:56:08.16
a2929f6a-e886-4a54-9ba7-109ae6f3b9d4	545ef296-1135-4885-8e61-89932645af6c	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	1d04d87f-ee21-472b-8abe-b502f5c2c11f	2026-08-26	ASSIGNED	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-29 04:56:08.266	2026-08-29 04:56:08.266
4165a1dc-b71f-4ed6-bfa3-2e241733c437	545ef296-1135-4885-8e61-89932645af6c	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	1d04d87f-ee21-472b-8abe-b502f5c2c11f	2026-08-27	ASSIGNED	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-29 04:56:08.373	2026-08-29 04:56:08.373
f2ef11af-6f72-4eda-b660-8467d9008f21	545ef296-1135-4885-8e61-89932645af6c	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	1d04d87f-ee21-472b-8abe-b502f5c2c11f	2026-08-28	ASSIGNED	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-29 04:56:08.479	2026-08-29 04:56:08.479
e78ce85f-56fb-4f84-9b19-fcadcb9196b9	545ef296-1135-4885-8e61-89932645af6c	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	1d04d87f-ee21-472b-8abe-b502f5c2c11f	2026-08-29	ASSIGNED	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-29 04:56:08.585	2026-08-29 04:56:08.585
\.


--
-- Data for Name: shift_registrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shift_registrations (id, "userId", "departmentId", "shiftId", "workDate", status, reason, "decidedByUserId", "decidedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: shift_swaps; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shift_swaps (id, "requesterUserId", "targetUserId", "departmentId", "fromShiftId", "toShiftId", "fromDate", "toDate", status, reason, "decidedByUserId", "decidedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: shifts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shifts (id, code, name, "startTime", "endTime", "breakMinutes", "checkInEarlyMinutes", "checkInLateMinutes", "checkOutEarlyMinutes", "checkOutLateMinutes", "isNightShift", "isActive", "createdAt", "updatedAt", "deletedAt") FROM stdin;
1d04d87f-ee21-472b-8abe-b502f5c2c11f	Ca_Sang	Ca sáng 	09:00	18:30	0	15	60	0	30	f	t	2026-08-20 02:11:30.435	2026-08-20 02:11:30.435	\N
\.


--
-- Data for Name: stock_receipt_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.stock_receipt_items (id, "receiptId", "materialId", quantity, "unitCost", note) FROM stdin;
\.


--
-- Data for Name: stock_receipts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.stock_receipts (id, "receiptCode", "warehouseId", "supplierName", "referenceNumber", "receiptDate", status, note, "createdById", "approvedById", "approvedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: stock_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.stock_transactions (id, "transactionCode", "warehouseId", "materialId", "transactionType", quantity, "quantityBefore", "quantityAfter", "unitCost", "referenceType", "referenceId", note, "performedById", "createdAt") FROM stdin;
\.


--
-- Data for Name: stock_transfer_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.stock_transfer_items (id, "transferId", "materialId", quantity) FROM stdin;
\.


--
-- Data for Name: stock_transfers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.stock_transfers (id, "transferCode", "sourceWarehouseId", "targetWarehouseId", status, "requestedById", "approvedById", "shippedById", "receivedById", "shippedAt", "receivedAt", note, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.system_settings (id, "companyId", key, "valueJson", category, description, "isSensitive", "updatedById", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: talent_retention_vaults; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.talent_retention_vaults (id, "userId", year, "grantedPoints", "cashValuePerPoint", status, "createdAt", "updatedAt", "instantBonusPoints") FROM stdin;
b29752ac-08d4-4a13-b3de-8f067d7f5bf1	05ff1cc9-4cb6-4d87-a74b-0391a5539537	2026	10000	1000.00	ACTIVE	2026-09-08 10:01:06.662	2026-09-08 10:01:06.662	0
8fe89cc2-f550-4467-ad4f-81e211c79c77	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026	20000	1000.00	ACTIVE	2026-09-08 12:10:25.231	2026-09-09 04:20:16.964	0
\.


--
-- Data for Name: task_assignments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.task_assignments (id, "taskId", "userId", "assignedByUserId", "reviewedByUserId", status, "progressPercent", "assignmentDueAt", "acceptedAt", "startedAt", "submittedAt", "completedAt", "reviewedAt", "reviewNote", "completionNote", "createdAt", "updatedAt") FROM stdin;
3d90b818-b848-4c5b-86f9-0e30f95ae2a2	7144b02a-5c75-481c-affc-e2726d2f0e11	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	COMPLETED	100	2026-08-22 10:00:00	\N	2026-08-20 11:41:59.117	2026-08-21 02:46:50.478	2026-08-21 06:33:37.065	2026-08-21 06:33:37.065	Duyệt qua thao tác kéo thả		2026-08-20 02:53:18.851	2026-08-21 06:33:37.066
561653bc-2053-4cb4-b8b1-b26b06f1e5dc	aecf0c65-74c6-4611-8cba-417a5c6bc044	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	49098001-4375-47f0-b36d-c8758d8715ff	\N	WAITING_REVIEW	40	2026-08-26 17:00:00	\N	2026-08-20 02:37:35.154	2026-08-24 08:59:44.787	\N	\N	\N	Cập nhật tiến độ qua thao tác kéo thả	2026-08-20 02:23:00.025	2026-08-24 08:59:45.005
8795922d-41cb-4775-bbd5-87dded36ff74	1b33570d-7112-41ea-9af8-f1292569a577	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	49098001-4375-47f0-b36d-c8758d8715ff	49098001-4375-47f0-b36d-c8758d8715ff	COMPLETED	20	2026-08-29 17:00:00	\N	2026-08-20 02:42:19.637	2026-08-21 02:12:40.027	2026-08-29 09:18:02.998	2026-08-29 09:18:02.998	Duyệt qua thao tác kéo thả	Cập nhật tiến độ qua thao tác kéo thả	2026-08-20 02:21:52.392	2026-08-29 09:18:03
dd1a295a-abac-40ec-ab64-5b005199f1d4	cc34421e-67c5-485b-a773-81faf5713efd	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	COMPLETED	100	2026-08-20 17:00:00	\N	2026-08-20 02:59:31.664	2026-08-20 04:45:48.874	2026-08-21 02:04:57.57	2026-08-21 02:04:57.57	\N		2026-08-20 02:50:29.458	2026-08-21 02:04:57.571
3e708fbc-bde0-4b4f-a801-cbd6c066677a	2a1f5cec-a02e-4d56-adae-ee357bceb47d	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	COMPLETED	100	2026-08-20 13:00:00	\N	2026-08-20 02:57:17.175	2026-08-20 03:35:53.539	2026-08-21 02:05:18.435	2026-08-21 02:05:18.435	\N		2026-08-20 02:48:27.153	2026-08-21 02:05:18.436
0dea1f22-2a00-49e6-89d7-6002bb0b2f9d	263c454d-f384-46bb-92ea-13c9baa380e0	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	COMPLETED	92	2026-08-21 09:00:00	\N	2026-08-20 02:59:28.418	2026-08-20 08:49:24.829	2026-08-21 02:09:21.723	2026-08-21 02:09:21.723	\N		2026-08-20 02:51:50.081	2026-08-21 02:09:21.724
a3a9092f-8094-4854-b45c-f8d5b3cb100e	f248050b-a30f-420f-820d-aa21104ae480	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	49098001-4375-47f0-b36d-c8758d8715ff	\N	WAITING_REVIEW	0	2026-08-24 17:00:00	\N	2026-08-20 02:42:37.901	2026-08-21 02:12:47.848	\N	\N	\N	Cập nhật tiến độ qua thao tác kéo thả	2026-08-20 02:17:58.303	2026-08-21 02:12:47.997
1f747620-b2a2-42e9-add4-f5606e635794	6a93af02-a691-4a49-a78c-e86c59add3c4	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	COMPLETED	100	2026-08-21 17:00:00	\N	2026-08-21 06:21:34.206	2026-08-21 10:15:43.936	2026-09-03 09:12:21.962	2026-09-03 09:12:21.962	\N		2026-08-21 02:12:09.667	2026-09-03 09:12:21.964
d129200b-d73d-4a72-a29a-0fba24b00375	ba60cab8-23cd-4079-95e6-af3ce9b684e7	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	WAITING_REVIEW	100	2026-09-03 17:00:00	\N	2026-09-03 04:14:16.339	2026-09-03 13:58:01.82	\N	\N	\N		2026-09-03 04:12:52.767	2026-09-03 13:58:01.985
c07381c2-8691-4068-95d0-7b364aadadf8	733b777b-bbd6-4e8b-92c1-1cb8075031e1	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	IN_PROGRESS	55	2026-09-06 17:00:00	\N	2026-09-03 04:12:37.121	\N	\N	\N	\N	\N	2026-09-03 04:12:01.973	2026-09-04 02:27:19.55
a10b79bd-d996-4cf1-bb75-87fa7a6f3c40	b7dc98d4-8c24-44ce-922b-a1506e087e24	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	COMPLETED	100	2026-08-22 17:00:00	\N	2026-08-21 03:12:39.955	2026-08-21 04:33:03.04	2026-08-21 06:33:31.19	2026-08-21 06:33:31.19	Duyệt qua thao tác kéo thả		2026-08-21 02:11:24.873	2026-08-21 06:33:31.191
75d8295a-cbc9-4f71-9cbe-1ec11db17a9c	31d6d0a6-9abf-4675-a0c9-9fd1d0599c7f	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	COMPLETED	100	2026-08-21 17:00:00	\N	2026-08-21 03:12:41.341	2026-08-21 03:14:07.806	2026-08-21 06:33:35.203	2026-08-21 06:33:35.203	Duyệt qua thao tác kéo thả		2026-08-21 02:10:16.928	2026-08-21 06:33:35.204
\.


--
-- Data for Name: task_attachments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.task_attachments (id, "taskId", "uploadedByUserId", type, "fileName", "fileUrl", "storageKey", "mimeType", "sizeBytes", "createdAt") FROM stdin;
336b9892-5d52-4032-80e5-3fbe7e4cace1	aecf0c65-74c6-4611-8cba-417a5c6bc044	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	FILE	1787193274603_6944964074410677281_g5284810894799670039_23ea3c5855edb729b9f063a1b7f98ed0.jpg	https://res.cloudinary.com/dqxsqiglg/image/upload/v1787193458/hrm/task_attachment/2026-08-20/c493026e-cb21-4539-84e3-a22919b63c53.jpg#type=RESULT	\N	\N	94820	2026-08-20 02:37:39.702
1254bfe5-3275-4e7b-8572-6f0eb7808a71	aecf0c65-74c6-4611-8cba-417a5c6bc044	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	FILE	1787193302140_6944964074410677281_g5284810894799670039_e4c6ef47f6c35358ba1948bce9eeee67.jpg	https://res.cloudinary.com/dqxsqiglg/image/upload/v1787193461/hrm/task_attachment/2026-08-20/a506c55b-3dd8-48a9-a935-a0ac5108ccee.jpg#type=RESULT	\N	\N	85138	2026-08-20 02:37:42.905
d11f0501-4020-4072-b60e-ae458ec12dd1	aecf0c65-74c6-4611-8cba-417a5c6bc044	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	FILE	1787193310440_6944964074410677281_g5284810894799670039_d111a2a10b2576e1f9df4c498b328378.jpg	https://res.cloudinary.com/dqxsqiglg/image/upload/v1787193464/hrm/task_attachment/2026-08-20/b17a5b50-94eb-4c09-8604-9702e8f059a6.jpg#type=RESULT	\N	\N	148938	2026-08-20 02:37:45.592
1459257c-cf02-4c7c-9b9a-7a86e3faa7e3	31d6d0a6-9abf-4675-a0c9-9fd1d0599c7f	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	FILE	Screenshot 2026-08-21 101341.png	https://res.cloudinary.com/dqxsqiglg/image/upload/v1787282034/hrm/task_attachment/2026-08-21/932dbdf5-bb9f-44fd-9a33-7e77535b245b.png#type=RESULT	\N	\N	263895	2026-08-21 03:13:57.092
af1df8b6-70c4-4c84-b2cb-f41b06ca2bd3	b7dc98d4-8c24-44ce-922b-a1506e087e24	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	FILE	demo.pdf	/uploads/task_attachment%2F2026-08-21%2F37061c86-0c2e-4911-869f-60a20bbb71eb.pdf#type=RESULT	\N	\N	93499	2026-08-21 04:32:30.186
17b3563a-b521-4aa0-891c-ba41562eafb2	733b777b-bbd6-4e8b-92c1-1cb8075031e1	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	IMAGE	1000028286.jpg	https://res.cloudinary.com/dqxsqiglg/image/upload/v1788483760/hrm/task_attachment/2026-09-04/e4660c80-acca-48c2-ac2a-d33e2dea11b6.jpg	\N	image/jpeg	97791	2026-09-04 01:02:43.065
\.


--
-- Data for Name: task_comments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.task_comments (id, "taskId", "userId", content, "createdAt", "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: task_extension_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.task_extension_requests (id, "taskId", "assignmentId", "requestedByUserId", "decidedByUserId", "currentDueAt", "requestedDueAt", reason, status, "rejectionReason", "decidedAt", "createdAt", "updatedAt") FROM stdin;
c2ad92c9-53cb-4eb6-a1bb-71738947e53b	7144b02a-5c75-481c-affc-e2726d2f0e11	3d90b818-b848-4c5b-86f9-0e30f95ae2a2	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-20 17:00:00	2026-08-22 10:00:00	Làm thêm api	APPROVED	nay phải xong nhé 	2026-08-21 02:09:08.697	2026-08-21 02:07:57.463	2026-08-21 02:09:08.698
31a39226-6b00-4ce3-8afb-616942543ecc	ba60cab8-23cd-4079-95e6-af3ce9b684e7	d129200b-d73d-4a72-a29a-0fba24b00375	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	\N	2026-09-03 17:00:00	2026-09-04 17:00:00	xin em thêm	PENDING	\N	\N	2026-09-04 01:09:54.351	2026-09-04 01:09:54.351
da919e5c-1164-47ec-92af-8f31d28a9f4a	733b777b-bbd6-4e8b-92c1-1cb8075031e1	c07381c2-8691-4068-95d0-7b364aadadf8	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-09-03 17:00:00	2026-09-06 17:00:00	cần tìm hiểu UI các web và animation chi tiết nếu cần thiết có thể cả video	APPROVED	\N	2026-09-04 02:26:25.801	2026-09-04 01:10:55.819	2026-09-04 02:26:25.802
\.


--
-- Data for Name: task_group_members; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.task_group_members (id, "groupId", "userId", "createdAt") FROM stdin;
\.


--
-- Data for Name: task_groups; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.task_groups (id, "departmentId", name, description, "createdByUserId", "isActive", "createdAt", "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: task_status_histories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.task_status_histories (id, "taskId", "actorUserId", "assignmentId", action, "fromStatus", "toStatus", note, metadata, "createdAt") FROM stdin;
3adf8f73-ca5f-4c0e-84cf-fecb9671e0d6	f248050b-a30f-420f-820d-aa21104ae480	49098001-4375-47f0-b36d-c8758d8715ff	\N	CREATED	\N	NEW	\N	{"assigneeIds": ["bea82bc5-c3e5-45d8-bd50-82be7ade4b4c"]}	2026-08-20 02:17:58.303
315b0d96-e57c-4833-87bc-63b74b77efde	1b33570d-7112-41ea-9af8-f1292569a577	49098001-4375-47f0-b36d-c8758d8715ff	\N	CREATED	\N	NEW	\N	{"assigneeIds": ["bea82bc5-c3e5-45d8-bd50-82be7ade4b4c"]}	2026-08-20 02:21:52.392
0c7af98c-ffea-4c69-aaef-479f307c5f0d	aecf0c65-74c6-4611-8cba-417a5c6bc044	49098001-4375-47f0-b36d-c8758d8715ff	\N	CREATED	\N	NEW	\N	{"assigneeIds": ["bea82bc5-c3e5-45d8-bd50-82be7ade4b4c"]}	2026-08-20 02:23:00.025
467b4313-0551-4dd2-9d50-46a75a57402f	aecf0c65-74c6-4611-8cba-417a5c6bc044	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	561653bc-2053-4cb4-b8b1-b26b06f1e5dc	STARTED	NEW	IN_PROGRESS	\N	\N	2026-08-20 02:37:35.648
12ed2c76-aa54-4122-9b2b-8a5d950278dc	aecf0c65-74c6-4611-8cba-417a5c6bc044	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	ATTACHED	\N	\N	\N	\N	2026-08-20 02:37:39.898
ed01d553-5290-4bd8-b792-cfdb983d2f55	aecf0c65-74c6-4611-8cba-417a5c6bc044	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	ATTACHED	\N	\N	\N	\N	2026-08-20 02:37:42.956
40310864-bd2c-4565-9ee2-4c63df0eceaa	aecf0c65-74c6-4611-8cba-417a5c6bc044	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	ATTACHED	\N	\N	\N	\N	2026-08-20 02:37:45.642
93cc55cb-9275-4dd3-82e0-c2d6e37543fb	aecf0c65-74c6-4611-8cba-417a5c6bc044	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	561653bc-2053-4cb4-b8b1-b26b06f1e5dc	PROGRESS_UPDATED	\N	\N	\N	{"progressPercent": 40}	2026-08-20 02:38:14.287
11f8175e-8cf1-4c7c-a719-d713c0c703c0	aecf0c65-74c6-4611-8cba-417a5c6bc044	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	561653bc-2053-4cb4-b8b1-b26b06f1e5dc	PROGRESS_UPDATED	\N	\N	\N	{"progressPercent": 40}	2026-08-20 02:39:18.609
ccfc5c39-0dec-4240-9fab-6c360e415290	1b33570d-7112-41ea-9af8-f1292569a577	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	8795922d-41cb-4775-bbd5-87dded36ff74	STARTED	NEW	IN_PROGRESS	\N	\N	2026-08-20 02:42:20.144
fff1ca4f-ec8b-41d9-99aa-cad8e39f8c0e	1b33570d-7112-41ea-9af8-f1292569a577	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	8795922d-41cb-4775-bbd5-87dded36ff74	PROGRESS_UPDATED	\N	\N	\N	{"progressPercent": 20}	2026-08-20 02:42:21.256
d5d2221a-9925-45ff-b3fd-81ce3c28759a	f248050b-a30f-420f-820d-aa21104ae480	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	a3a9092f-8094-4854-b45c-f8d5b3cb100e	STARTED	NEW	IN_PROGRESS	\N	\N	2026-08-20 02:42:38.462
684f18e7-2a15-4c28-b8c1-447ef9ba8466	0641fe45-497a-4f73-b16d-b65155641479	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	CREATED	\N	NEW	\N	{"assigneeIds": ["a6da6610-b5b2-40dc-b7fd-349fb534a4de"]}	2026-08-20 02:46:41.748
07014bf0-d5ec-40f0-9dbf-82fea6a632fd	2a1f5cec-a02e-4d56-adae-ee357bceb47d	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	CREATED	\N	NEW	\N	{"assigneeIds": ["1eb90142-2416-4bfb-a9a0-7dda4616bbb9"]}	2026-08-20 02:48:27.153
1a5e5c2d-489b-4804-bf11-ba2f615d1d58	cc34421e-67c5-485b-a773-81faf5713efd	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	CREATED	\N	NEW	\N	{"assigneeIds": ["9bb92634-e2ad-4d0c-9955-2ecb696ae52b"]}	2026-08-20 02:50:29.458
cf2075d4-0ec2-4229-8c63-74cf16443586	263c454d-f384-46bb-92ea-13c9baa380e0	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	CREATED	\N	NEW	\N	{"assigneeIds": ["9bb92634-e2ad-4d0c-9955-2ecb696ae52b"]}	2026-08-20 02:51:50.081
597ab8ca-5d82-4d92-ab7f-a1f1b663bf85	7144b02a-5c75-481c-affc-e2726d2f0e11	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	CREATED	\N	NEW	\N	{"assigneeIds": ["1eb90142-2416-4bfb-a9a0-7dda4616bbb9"]}	2026-08-20 02:53:18.851
1a457250-6d44-49a8-ae62-0e084686b411	2a1f5cec-a02e-4d56-adae-ee357bceb47d	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	3e708fbc-bde0-4b4f-a801-cbd6c066677a	STARTED	NEW	IN_PROGRESS	\N	\N	2026-08-20 02:57:17.688
8240e4f5-1f8b-4149-b255-ec06f6d43ce6	2a1f5cec-a02e-4d56-adae-ee357bceb47d	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	3e708fbc-bde0-4b4f-a801-cbd6c066677a	PROGRESS_UPDATED	\N	\N	\N	{"progressPercent": 52}	2026-08-20 02:57:19.024
d458ddc3-176d-483b-9754-be9b81bfa1c4	263c454d-f384-46bb-92ea-13c9baa380e0	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	0dea1f22-2a00-49e6-89d7-6002bb0b2f9d	STARTED	NEW	IN_PROGRESS	\N	\N	2026-08-20 02:59:28.827
a01d32e1-802b-4111-aba6-a02d399a60ab	cc34421e-67c5-485b-a773-81faf5713efd	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	dd1a295a-abac-40ec-ab64-5b005199f1d4	STARTED	NEW	IN_PROGRESS	\N	\N	2026-08-20 02:59:31.917
59792bbc-7c14-4923-af4c-a8530928594a	cc34421e-67c5-485b-a773-81faf5713efd	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	dd1a295a-abac-40ec-ab64-5b005199f1d4	PROGRESS_UPDATED	\N	\N	\N	{"progressPercent": 92}	2026-08-20 03:13:45.975
ce8f49d5-ad26-4636-a635-9c132884a0ed	2a1f5cec-a02e-4d56-adae-ee357bceb47d	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	3e708fbc-bde0-4b4f-a801-cbd6c066677a	PROGRESS_UPDATED	\N	\N	\N	{"progressPercent": 100}	2026-08-20 03:35:47.447
b747232d-4184-4c8c-9749-a9194f370e11	2a1f5cec-a02e-4d56-adae-ee357bceb47d	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	3e708fbc-bde0-4b4f-a801-cbd6c066677a	PROGRESS_UPDATED	\N	\N	\N	{"progressPercent": 100}	2026-08-20 03:35:52.968
0ebe1ee3-4926-4ae1-aabc-23f0421e9b61	2a1f5cec-a02e-4d56-adae-ee357bceb47d	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	3e708fbc-bde0-4b4f-a801-cbd6c066677a	SUBMITTED	IN_PROGRESS	WAITING_REVIEW	\N	\N	2026-08-20 03:35:54.085
0f0bacb0-7690-43ed-b0c5-2a27044c89f5	cc34421e-67c5-485b-a773-81faf5713efd	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	dd1a295a-abac-40ec-ab64-5b005199f1d4	PROGRESS_UPDATED	\N	\N	\N	{"progressPercent": 100}	2026-08-20 04:45:47.338
9010d615-8afc-4bc4-a608-900ea017b37a	cc34421e-67c5-485b-a773-81faf5713efd	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	dd1a295a-abac-40ec-ab64-5b005199f1d4	SUBMITTED	IN_PROGRESS	WAITING_REVIEW	\N	\N	2026-08-20 04:45:49.38
bf1c46c3-816a-4fa7-87d9-af20fb557e55	263c454d-f384-46bb-92ea-13c9baa380e0	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	0dea1f22-2a00-49e6-89d7-6002bb0b2f9d	PROGRESS_UPDATED	\N	\N	\N	{"progressPercent": 92}	2026-08-20 08:49:23.827
fa40f90c-9eff-470e-8e2a-bc7fc61355c9	263c454d-f384-46bb-92ea-13c9baa380e0	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	0dea1f22-2a00-49e6-89d7-6002bb0b2f9d	SUBMITTED	IN_PROGRESS	WAITING_REVIEW	\N	\N	2026-08-20 08:49:25.365
3024b039-ddc5-4cf0-935e-bd2663926d83	7144b02a-5c75-481c-affc-e2726d2f0e11	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	3d90b818-b848-4c5b-86f9-0e30f95ae2a2	STARTED	NEW	IN_PROGRESS	\N	\N	2026-08-20 11:41:59.518
40f40ed8-2f6b-4e71-b5a2-9b291a691509	7144b02a-5c75-481c-affc-e2726d2f0e11	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	3d90b818-b848-4c5b-86f9-0e30f95ae2a2	PROGRESS_UPDATED	\N	\N	\N	{"progressPercent": 50}	2026-08-20 11:42:11.847
c7514112-b122-45ad-9755-991f18acd63e	cc34421e-67c5-485b-a773-81faf5713efd	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	dd1a295a-abac-40ec-ab64-5b005199f1d4	APPROVED	WAITING_REVIEW	COMPLETED	\N	\N	2026-08-21 02:04:57.824
46e3d53c-c0b6-42f5-9917-55380d5f4268	2a1f5cec-a02e-4d56-adae-ee357bceb47d	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	3e708fbc-bde0-4b4f-a801-cbd6c066677a	APPROVED	WAITING_REVIEW	COMPLETED	\N	\N	2026-08-21 02:05:18.686
91e4e336-a130-4bc6-b83d-1555ba037f0e	7144b02a-5c75-481c-affc-e2726d2f0e11	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	3d90b818-b848-4c5b-86f9-0e30f95ae2a2	EXTENSION_REQUESTED	\N	\N	\N	\N	2026-08-21 02:07:57.575
77a12bcd-2cd1-4904-a806-ef5940b49807	7144b02a-5c75-481c-affc-e2726d2f0e11	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	3d90b818-b848-4c5b-86f9-0e30f95ae2a2	EXTENSION_APPROVED	\N	\N	\N	\N	2026-08-21 02:09:08.817
b14aaef7-93ef-4c5e-ace0-302e9d9b54b0	263c454d-f384-46bb-92ea-13c9baa380e0	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	0dea1f22-2a00-49e6-89d7-6002bb0b2f9d	APPROVED	WAITING_REVIEW	COMPLETED	\N	\N	2026-08-21 02:09:21.98
5026a81b-621c-4210-874c-d4b0c4a2f46a	31d6d0a6-9abf-4675-a0c9-9fd1d0599c7f	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	CREATED	\N	NEW	\N	{"assigneeIds": ["9bb92634-e2ad-4d0c-9955-2ecb696ae52b"]}	2026-08-21 02:10:16.928
c6502636-2494-480f-a4b5-9f4ab39e1ecf	b7dc98d4-8c24-44ce-922b-a1506e087e24	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	CREATED	\N	NEW	\N	{"assigneeIds": ["9bb92634-e2ad-4d0c-9955-2ecb696ae52b"]}	2026-08-21 02:11:24.873
9c00ee7a-c105-495f-963f-7d65f0416eda	6a93af02-a691-4a49-a78c-e86c59add3c4	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	CREATED	\N	NEW	\N	{"assigneeIds": ["1eb90142-2416-4bfb-a9a0-7dda4616bbb9"]}	2026-08-21 02:12:09.667
671b0525-3102-43bc-a3dc-a2c5d504f920	1b33570d-7112-41ea-9af8-f1292569a577	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	8795922d-41cb-4775-bbd5-87dded36ff74	SUBMITTED	IN_PROGRESS	WAITING_REVIEW	\N	\N	2026-08-21 02:12:40.711
397d4650-f616-4812-beda-9494572b7069	f248050b-a30f-420f-820d-aa21104ae480	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	a3a9092f-8094-4854-b45c-f8d5b3cb100e	SUBMITTED	IN_PROGRESS	WAITING_REVIEW	\N	\N	2026-08-21 02:12:48.491
551955a7-6884-4a24-878d-5a9c25813fac	7144b02a-5c75-481c-affc-e2726d2f0e11	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	3d90b818-b848-4c5b-86f9-0e30f95ae2a2	PROGRESS_UPDATED	\N	\N	\N	{"progressPercent": 100}	2026-08-21 02:46:41.833
922853ab-8981-4b0d-8193-aeffc56f4358	7144b02a-5c75-481c-affc-e2726d2f0e11	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	3d90b818-b848-4c5b-86f9-0e30f95ae2a2	SUBMITTED	IN_PROGRESS	WAITING_REVIEW	\N	\N	2026-08-21 02:46:51.183
01b1fa27-88c1-44cd-9809-3bbd67ee2cb2	b7dc98d4-8c24-44ce-922b-a1506e087e24	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	a10b79bd-d996-4cf1-bb75-87fa7a6f3c40	STARTED	NEW	IN_PROGRESS	\N	\N	2026-08-21 03:12:40.378
8e8bf22c-0987-419a-be96-c3dfa406da4c	31d6d0a6-9abf-4675-a0c9-9fd1d0599c7f	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	75d8295a-cbc9-4f71-9cbe-1ec11db17a9c	STARTED	NEW	IN_PROGRESS	\N	\N	2026-08-21 03:12:41.598
5fac2887-f754-4e02-9d24-ef218c274ae7	31d6d0a6-9abf-4675-a0c9-9fd1d0599c7f	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	ATTACHED	\N	\N	\N	\N	2026-08-21 03:13:57.193
a1bb2345-a927-4dbe-ac3a-0aa6c1d8144a	31d6d0a6-9abf-4675-a0c9-9fd1d0599c7f	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	75d8295a-cbc9-4f71-9cbe-1ec11db17a9c	PROGRESS_UPDATED	\N	\N	\N	{"progressPercent": 100}	2026-08-21 03:14:01.82
45cfff20-91b5-40ff-941c-4ca281c4bd60	31d6d0a6-9abf-4675-a0c9-9fd1d0599c7f	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	75d8295a-cbc9-4f71-9cbe-1ec11db17a9c	PROGRESS_UPDATED	\N	\N	\N	{"progressPercent": 100}	2026-08-21 03:14:07.273
2553b0f3-d509-48e3-b9d6-56519c501228	31d6d0a6-9abf-4675-a0c9-9fd1d0599c7f	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	75d8295a-cbc9-4f71-9cbe-1ec11db17a9c	SUBMITTED	IN_PROGRESS	WAITING_REVIEW	\N	\N	2026-08-21 03:14:08.309
54780c83-7505-4597-9630-23d0abd15882	b7dc98d4-8c24-44ce-922b-a1506e087e24	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	ATTACHED	\N	\N	\N	\N	2026-08-21 04:32:30.33
efe919b7-b894-4915-bdfc-fd90be04269a	b7dc98d4-8c24-44ce-922b-a1506e087e24	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	a10b79bd-d996-4cf1-bb75-87fa7a6f3c40	PROGRESS_UPDATED	\N	\N	\N	{"progressPercent": 100}	2026-08-21 04:33:01.998
37583ac5-e538-4e38-aae0-c7a3c059f43a	b7dc98d4-8c24-44ce-922b-a1506e087e24	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	a10b79bd-d996-4cf1-bb75-87fa7a6f3c40	SUBMITTED	IN_PROGRESS	WAITING_REVIEW	\N	\N	2026-08-21 04:33:03.531
a9744574-e13f-4c93-8ac9-cf17c04b6b90	6a93af02-a691-4a49-a78c-e86c59add3c4	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	1f747620-b2a2-42e9-add4-f5606e635794	STARTED	NEW	IN_PROGRESS	\N	\N	2026-08-21 06:21:35.047
aa7dccd0-df52-4d43-8aea-1d00e59c927a	6a93af02-a691-4a49-a78c-e86c59add3c4	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	1f747620-b2a2-42e9-add4-f5606e635794	PROGRESS_UPDATED	\N	\N	\N	{"progressPercent": 60}	2026-08-21 06:21:41.503
6fe699b6-13f5-47d6-86d6-37b0b8fcf533	b7dc98d4-8c24-44ce-922b-a1506e087e24	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	a10b79bd-d996-4cf1-bb75-87fa7a6f3c40	APPROVED	WAITING_REVIEW	COMPLETED	Duyệt qua thao tác kéo thả	\N	2026-08-21 06:33:31.446
43e430b9-e884-43b8-93b4-c3b68f3cf332	31d6d0a6-9abf-4675-a0c9-9fd1d0599c7f	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	75d8295a-cbc9-4f71-9cbe-1ec11db17a9c	APPROVED	WAITING_REVIEW	COMPLETED	Duyệt qua thao tác kéo thả	\N	2026-08-21 06:33:35.461
fb435767-c7f5-4d13-9973-c153b8915e10	7144b02a-5c75-481c-affc-e2726d2f0e11	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	3d90b818-b848-4c5b-86f9-0e30f95ae2a2	APPROVED	WAITING_REVIEW	COMPLETED	Duyệt qua thao tác kéo thả	\N	2026-08-21 06:33:37.219
61d93a18-9d9f-428f-a181-c7d1cae113bb	6a93af02-a691-4a49-a78c-e86c59add3c4	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	1f747620-b2a2-42e9-add4-f5606e635794	PROGRESS_UPDATED	\N	\N	\N	{"progressPercent": 100}	2026-08-21 10:15:40.845
abe4206c-45c0-4643-86bd-7a09ffba71b8	6a93af02-a691-4a49-a78c-e86c59add3c4	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	1f747620-b2a2-42e9-add4-f5606e635794	SUBMITTED	IN_PROGRESS	WAITING_REVIEW	\N	\N	2026-08-21 10:15:44.717
24a0d3c5-66e2-4f15-998b-2d1f18ffc013	aecf0c65-74c6-4611-8cba-417a5c6bc044	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	561653bc-2053-4cb4-b8b1-b26b06f1e5dc	SUBMITTED	IN_PROGRESS	WAITING_REVIEW	\N	\N	2026-08-24 08:59:45.534
1254fe04-765e-4e07-be19-b6a28091eabb	1b33570d-7112-41ea-9af8-f1292569a577	49098001-4375-47f0-b36d-c8758d8715ff	8795922d-41cb-4775-bbd5-87dded36ff74	APPROVED	WAITING_REVIEW	COMPLETED	Duyệt qua thao tác kéo thả	\N	2026-08-29 09:18:03.252
12fb660f-b8ed-4136-8f71-2f6bbfc98ada	733b777b-bbd6-4e8b-92c1-1cb8075031e1	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	CREATED	\N	NEW	\N	{"assigneeIds": ["9bb92634-e2ad-4d0c-9955-2ecb696ae52b"]}	2026-09-03 04:12:01.973
a3ed7438-c968-4131-b2eb-118cd8e61690	733b777b-bbd6-4e8b-92c1-1cb8075031e1	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	c07381c2-8691-4068-95d0-7b364aadadf8	STARTED	NEW	IN_PROGRESS	\N	\N	2026-09-03 04:12:37.673
50629039-3545-4489-a97e-9b19aa13dfd9	ba60cab8-23cd-4079-95e6-af3ce9b684e7	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	CREATED	\N	NEW	\N	{"assigneeIds": ["1eb90142-2416-4bfb-a9a0-7dda4616bbb9"]}	2026-09-03 04:12:52.767
ba6d92c4-cb5a-4e64-a6d0-822c0fd44c0d	ba60cab8-23cd-4079-95e6-af3ce9b684e7	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	d129200b-d73d-4a72-a29a-0fba24b00375	STARTED	NEW	IN_PROGRESS	\N	\N	2026-09-03 04:14:16.885
7d0ec1dc-7027-46d0-ac0d-42752acbf5fb	ba60cab8-23cd-4079-95e6-af3ce9b684e7	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	d129200b-d73d-4a72-a29a-0fba24b00375	PROGRESS_UPDATED	\N	\N	\N	{"progressPercent": 100}	2026-09-03 06:30:59.757
28c66355-ddee-4425-ad5f-7df22b43d08d	6a93af02-a691-4a49-a78c-e86c59add3c4	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	1f747620-b2a2-42e9-add4-f5606e635794	APPROVED	WAITING_REVIEW	COMPLETED	\N	\N	2026-09-03 09:12:22.219
2527be96-d96f-4632-a4f6-7054083ecdad	ba60cab8-23cd-4079-95e6-af3ce9b684e7	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	d129200b-d73d-4a72-a29a-0fba24b00375	SUBMITTED	IN_PROGRESS	WAITING_REVIEW	\N	\N	2026-09-03 13:58:02.489
06c6f1fb-424e-4df9-960a-1b10730a3463	733b777b-bbd6-4e8b-92c1-1cb8075031e1	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	\N	ATTACHED	\N	\N	\N	\N	2026-09-04 01:02:43.174
7ae8cc2b-b2a0-4c9c-9410-4636d5220d60	ba60cab8-23cd-4079-95e6-af3ce9b684e7	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	d129200b-d73d-4a72-a29a-0fba24b00375	EXTENSION_REQUESTED	\N	\N	\N	\N	2026-09-04 01:09:54.453
799bbb1a-6b1d-456c-8a77-239eec443a40	733b777b-bbd6-4e8b-92c1-1cb8075031e1	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	c07381c2-8691-4068-95d0-7b364aadadf8	EXTENSION_REQUESTED	\N	\N	\N	\N	2026-09-04 01:10:55.929
c89e3caa-36f9-4dab-8870-c5b3ec47c52f	733b777b-bbd6-4e8b-92c1-1cb8075031e1	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	c07381c2-8691-4068-95d0-7b364aadadf8	EXTENSION_APPROVED	\N	\N	\N	\N	2026-09-04 02:26:25.9
e958a08a-16db-4c80-a362-d16710fc7bde	733b777b-bbd6-4e8b-92c1-1cb8075031e1	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	c07381c2-8691-4068-95d0-7b364aadadf8	PROGRESS_UPDATED	\N	\N	\N	{"progressPercent": 55}	2026-09-04 02:27:19.856
\.


--
-- Data for Name: task_targets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.task_targets (id, "taskId", "targetType", "targetId", "createdAt") FROM stdin;
1414b416-44b0-4c00-8468-6f32b6f8bacb	f248050b-a30f-420f-820d-aa21104ae480	USER	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-20 02:17:58.303
aa45b4c0-2c8c-4cdd-8f28-e326251a4458	1b33570d-7112-41ea-9af8-f1292569a577	DEPARTMENT	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	2026-08-20 02:21:52.392
08052a00-943f-40bf-a66a-68f51e247d82	aecf0c65-74c6-4611-8cba-417a5c6bc044	DEPARTMENT	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	2026-08-20 02:23:00.025
8094b251-fcf9-4b82-8144-9f42201db0ae	0641fe45-497a-4f73-b16d-b65155641479	USER	a6da6610-b5b2-40dc-b7fd-349fb534a4de	2026-08-20 02:46:41.748
76b282a4-1011-415b-93ab-0fb0a8362fc4	2a1f5cec-a02e-4d56-adae-ee357bceb47d	USER	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-08-20 02:48:27.153
d2c68df3-20a7-4040-976e-ffd5218db945	cc34421e-67c5-485b-a773-81faf5713efd	USER	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-08-20 02:50:29.458
3cdb4b04-5b18-4942-9363-e3f56780a51b	263c454d-f384-46bb-92ea-13c9baa380e0	USER	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-08-20 02:51:50.081
4152f32b-4d3c-4c24-824d-b4a94306628f	7144b02a-5c75-481c-affc-e2726d2f0e11	USER	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-08-20 02:53:18.851
e9c773a7-9a4b-4545-b131-bf11273642a9	31d6d0a6-9abf-4675-a0c9-9fd1d0599c7f	USER	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-08-21 02:10:16.928
c0a3bcf6-7ae6-411e-aa8d-802bc7165ac6	b7dc98d4-8c24-44ce-922b-a1506e087e24	USER	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-08-21 02:11:24.873
a8a2ed6a-d3b2-4c69-ba13-3b19a07a5753	6a93af02-a691-4a49-a78c-e86c59add3c4	USER	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-08-21 02:12:09.667
40e3807c-ace8-4d03-9b78-163acca737cf	733b777b-bbd6-4e8b-92c1-1cb8075031e1	USER	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	2026-09-03 04:12:01.973
161b0e55-db39-400d-b54b-68674e31661f	ba60cab8-23cd-4079-95e6-af3ce9b684e7	USER	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	2026-09-03 04:12:52.767
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tasks (id, "taskCode", title, description, type, priority, status, "departmentContextId", "createdByUserId", "groupLeaderId", "parentTaskId", "startAt", "dueAt", "completedAt", "cancelledAt", "createdAt", "updatedAt", "deletedAt") FROM stdin;
0641fe45-497a-4f73-b16d-b65155641479	TASK000004	Sửa lại cho anh backend OTP, frontend web	sửa lại cho anh backend OTP kiểm tra lỗi giao diện	INDIVIDUAL	URGENT	NEW	\N	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	\N	2026-08-20 09:47:00	2026-08-20 00:00:00	\N	\N	2026-08-20 02:46:41.748	2026-08-20 02:46:41.748	\N
cc34421e-67c5-485b-a773-81faf5713efd	TASK000006	fix lại cho anh lỗi khi out app nhé	fix lại cho anh lỗi khi out app nhé, và phát triển web	INDIVIDUAL	NORMAL	COMPLETED	\N	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	\N	2026-08-20 08:00:00	2026-08-20 17:00:00	2026-08-21 02:04:58.043	\N	2026-08-20 02:50:29.458	2026-08-21 02:04:58.044	\N
2a1f5cec-a02e-4d56-adae-ee357bceb47d	TASK000005	sửa lại backend, frontend đang chưa ổn	sửa lại backend, frontend đang chưa ổn	INDIVIDUAL	URGENT	COMPLETED	\N	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	\N	2026-08-20 08:00:00	2026-08-20 13:00:00	2026-08-21 02:05:18.89	\N	2026-08-20 02:48:27.153	2026-08-21 02:05:18.891	\N
263c454d-f384-46bb-92ea-13c9baa380e0	TASK000007	Hoàn thiện phần giao diện của web	Hoàn thiện phần giao diện của web về chiến dịch, set ảnh cho app trong 1 thời gian dài	INDIVIDUAL	NORMAL	COMPLETED	\N	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	\N	2026-08-20 08:00:00	2026-08-21 09:00:00	2026-08-21 02:09:22.182	\N	2026-08-20 02:51:50.081	2026-08-21 02:09:22.183	\N
f248050b-a30f-420f-820d-aa21104ae480	TASK000001	App hướng dẫn sử dụng máy chiếu	Viết 1 app apk về hướng dẫn sử dụng máy chiếu dành cho khách hàng	INDIVIDUAL	NORMAL	WAITING_REVIEW	\N	49098001-4375-47f0-b36d-c8758d8715ff	\N	\N	2026-08-20 08:00:00	2026-08-24 17:00:00	\N	\N	2026-08-20 02:17:58.303	2026-08-21 02:12:48.691	\N
b7dc98d4-8c24-44ce-922b-a1506e087e24	TASK000010	nghiên cứu phần premium giá với lại các gói của app dịch vụ home	đưa ra bảng chi tiết các gói có kèm theo giá	INDIVIDUAL	NORMAL	COMPLETED	\N	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	\N	2026-08-21 08:00:00	2026-08-22 17:00:00	2026-08-21 06:33:31.649	\N	2026-08-21 02:11:24.873	2026-08-21 06:33:31.65	\N
31d6d0a6-9abf-4675-a0c9-9fd1d0599c7f	TASK000009	lấy api của youtube, movie, game, app store	lấy api của youtube, movie, game, app store	INDIVIDUAL	NORMAL	COMPLETED	\N	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	\N	2026-08-21 08:00:00	2026-08-21 17:00:00	2026-08-21 06:33:35.665	\N	2026-08-21 02:10:16.928	2026-08-21 06:33:35.666	\N
7144b02a-5c75-481c-affc-e2726d2f0e11	TASK000008	Hoàn thiện chuẩn về giao diện và đưa ra demo	clone lại phần giao diện của ngày hôm qua và demo cuối chiều	INDIVIDUAL	NORMAL	COMPLETED	\N	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	\N	2026-08-20 08:00:00	2026-08-22 10:00:00	2026-08-21 06:33:37.32	\N	2026-08-20 02:53:18.851	2026-08-21 06:33:37.321	\N
aecf0c65-74c6-4611-8cba-417a5c6bc044	TASK000003	App giao diện cho home dịch vụ	App giao diện cho home dịch vụ xây dựng apk	DEPARTMENT	HIGH	WAITING_REVIEW	\N	49098001-4375-47f0-b36d-c8758d8715ff	\N	\N	2026-08-20 08:00:00	2026-08-26 17:00:00	\N	\N	2026-08-20 02:23:00.025	2026-08-24 08:59:45.743	\N
1b33570d-7112-41ea-9af8-f1292569a577	TASK000002	App Giao diện cho máy chiếu	Viết 1 app apk giao diện cho máy chiếu	DEPARTMENT	URGENT	COMPLETED	\N	49098001-4375-47f0-b36d-c8758d8715ff	\N	\N	2026-08-20 08:00:00	2026-08-29 17:00:00	2026-08-29 09:18:03.45	\N	2026-08-20 02:21:52.392	2026-08-29 09:18:03.451	\N
6a93af02-a691-4a49-a78c-e86c59add3c4	TASK000011	thực hiện là gắn api vào app giao diện	gắn và thực hiện demo	INDIVIDUAL	NORMAL	COMPLETED	\N	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	\N	2026-08-21 08:00:00	2026-08-21 17:00:00	2026-09-03 09:12:22.417	\N	2026-08-21 02:12:09.667	2026-09-03 09:12:22.418	\N
ba60cab8-23cd-4079-95e6-af3ce9b684e7	TASK000013	hoàn thiện chức năng quản lý seri và kích hoạt bảo hành của khách hàng	hoàn thiện chức năng quản lý seri và kích hoạt bảo hành của khách hàng	INDIVIDUAL	HIGH	WAITING_REVIEW	\N	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	\N	2026-09-03 08:00:00	2026-09-03 17:00:00	\N	\N	2026-09-03 04:12:52.767	2026-09-03 13:58:02.69	\N
733b777b-bbd6-4e8b-92c1-1cb8075031e1	TASK000012	phân tích và hoàn thiện demo giao diện web	phân tích và hoàn thiện demo giao diện web	INDIVIDUAL	HIGH	IN_PROGRESS	\N	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	\N	\N	2026-09-03 08:00:00	2026-09-06 17:00:00	\N	\N	2026-09-03 04:12:01.973	2026-09-04 02:26:25.7	\N
\.


--
-- Data for Name: tiktok_live_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tiktok_live_sessions (id, "sessionTitle", "streamerId", "departmentId", "totalGmv", "totalOrders", "peakViewers", "totalViews", "startTime", "endTime", "createdAt") FROM stdin;
\.


--
-- Data for Name: uploaded_files; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.uploaded_files (id, "uploadedById", purpose, "fileName", "storageKey", "fileUrl", "mimeType", size, checksum, status, "createdAt", "updatedAt", "deletedAt") FROM stdin;
04777487-7d4b-4d45-ae34-91e12b4c450d	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	FACE_REGISTRATION	63674381-816a-4602-ab61-19f1debff726.jpg	face_registration/2026-08-20/13659962-6eae-4655-8760-2f6d308cbdf0.jpg	https://pub-7d69ec28111e4d0b89308dc0ae7571ed.r2.dev/face_registration/2026-08-20/13659962-6eae-4655-8760-2f6d308cbdf0.jpg	image/jpeg	169121	6d0cd3b286fa2f77010b7f04ddbe00b1e44687fd9a68fde24c0f930c679a78dd	ATTACHED	2026-08-20 02:01:29.247	2026-08-20 02:01:42.884	\N
178e441f-6072-4d84-939a-5fb32dc60029	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	FACE_REGISTRATION	578cc227-b547-431d-a793-a7abb7bf47a3.jpg	face_registration/2026-08-20/c5b95614-8c06-4d4f-988e-12b69245db25.jpg	https://pub-7d69ec28111e4d0b89308dc0ae7571ed.r2.dev/face_registration/2026-08-20/c5b95614-8c06-4d4f-988e-12b69245db25.jpg	image/jpeg	163113	6ad06916a6b75c710d7e37c791e5bf34996b08cf1a3ba8cc246ae4b796eda819	ATTACHED	2026-08-20 02:01:34.481	2026-08-20 02:01:42.884	\N
38a3decd-53d3-4ce9-a6bb-31ab3a7ee10b	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	FACE_REGISTRATION	5fa9a8a9-cbec-4b62-92b9-007a1dca7897.jpg	face_registration/2026-08-20/fdce93f6-fbc9-458e-9be3-65507680f00b.jpg	https://pub-7d69ec28111e4d0b89308dc0ae7571ed.r2.dev/face_registration/2026-08-20/fdce93f6-fbc9-458e-9be3-65507680f00b.jpg	image/jpeg	166015	e9f8922d9f3d1f7db74d479a352e12e2857dc8d51d7b19e7acdf00b14148043c	ATTACHED	2026-08-20 02:01:40.236	2026-08-20 02:01:42.884	\N
c383d5ef-0205-4edc-911f-29ea25905f52	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	ATTENDANCE	attendance.jpg	attendance/2026-08-20/6a7a27b1-8968-4d1e-a228-f8f0d56a0005.jpg	https://pub-7d69ec28111e4d0b89308dc0ae7571ed.r2.dev/attendance/2026-08-20/6a7a27b1-8968-4d1e-a228-f8f0d56a0005.jpg	image/jpeg	18705	2279bf9119233c47aedfcfd4c5271fd15e24e2440938c5c840b9e25ecdc54d7d	ATTACHED	2026-08-20 02:16:05.514	2026-08-20 02:16:07.422	\N
ee0e39b7-b550-4c9c-baa8-4e41be551a10	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	TASK_ATTACHMENT	1787193274603_6944964074410677281_g5284810894799670039_23ea3c5855edb729b9f063a1b7f98ed0.jpg	hrm/task_attachment/2026-08-20/c493026e-cb21-4539-84e3-a22919b63c53	https://res.cloudinary.com/dqxsqiglg/image/upload/v1787193458/hrm/task_attachment/2026-08-20/c493026e-cb21-4539-84e3-a22919b63c53.jpg	image/jpeg	94820	04acc66eea14cdf39da7cb15a87feb4c4e022d281be73931d1e1ab3b5eca34f0	TEMPORARY	2026-08-20 02:37:38.711	2026-08-20 02:37:38.711	\N
c1c5f4c3-2220-4925-8ce3-7467901a73bd	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	TASK_ATTACHMENT	1787193302140_6944964074410677281_g5284810894799670039_e4c6ef47f6c35358ba1948bce9eeee67.jpg	hrm/task_attachment/2026-08-20/a506c55b-3dd8-48a9-a935-a0ac5108ccee	https://res.cloudinary.com/dqxsqiglg/image/upload/v1787193461/hrm/task_attachment/2026-08-20/a506c55b-3dd8-48a9-a935-a0ac5108ccee.jpg	image/jpeg	85138	bca82ff60bc58af7d93428a9464a0fc7a844075a1bd821f8f8291bcb3dc46844	TEMPORARY	2026-08-20 02:37:42.008	2026-08-20 02:37:42.008	\N
00b01b28-dde3-4bf9-b47a-e0fe99f20ee2	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	TASK_ATTACHMENT	1787193310440_6944964074410677281_g5284810894799670039_d111a2a10b2576e1f9df4c498b328378.jpg	hrm/task_attachment/2026-08-20/b17a5b50-94eb-4c09-8604-9702e8f059a6	https://res.cloudinary.com/dqxsqiglg/image/upload/v1787193464/hrm/task_attachment/2026-08-20/b17a5b50-94eb-4c09-8604-9702e8f059a6.jpg	image/jpeg	148938	bc424a081f03fe0aed73afa94b1148e8178949b11e9e12aad22e1a9702b1be4a	TEMPORARY	2026-08-20 02:37:44.843	2026-08-20 02:37:44.843	\N
33a7127f-b58d-4603-b96b-48975ab8fbf5	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	EMPLOYEE_DOCUMENT	binh3_4_2024_9.JPG	hrm/employee_document/2026-08-20/4448b17a-bc88-4180-adc0-2b5b551dbfce	https://res.cloudinary.com/dqxsqiglg/image/upload/v1787215801/hrm/employee_document/2026-08-20/4448b17a-bc88-4180-adc0-2b5b551dbfce.jpg	image/jpeg	3518537	5717a566e1b3e8c0425d9a197cece30377f89730abcd927049e0b627bb72d900	TEMPORARY	2026-08-20 08:50:02.203	2026-08-20 08:50:02.203	\N
a6ac8c64-6594-4b85-be73-4190f0ff8071	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	ATTENDANCE	86b68ec4-beaf-46aa-a736-e73c0eb4a8db.jpg	attendance/2026-08-20/71a9a6fe-21cd-4c8e-b850-5089c9b325f6.jpg	https://pub-7d69ec28111e4d0b89308dc0ae7571ed.r2.dev/attendance/2026-08-20/71a9a6fe-21cd-4c8e-b850-5089c9b325f6.jpg	image/jpeg	92550	b4168e76fea945478322f550d277101715c3631de65b4bcd0bf2ffb07e7666b7	ATTACHED	2026-08-20 11:41:01.864	2026-08-20 11:41:05.559	\N
2a1fb528-433b-4794-9f85-27f9c77ad12b	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	ATTENDANCE	attendance.jpg	attendance/2026-08-21/7d501ae1-a1d0-4958-8e83-7aa4565fe1de.jpg	https://pub-7d69ec28111e4d0b89308dc0ae7571ed.r2.dev/attendance/2026-08-21/7d501ae1-a1d0-4958-8e83-7aa4565fe1de.jpg	image/jpeg	22891	0471d0a3eee756f413c9f634b542d340f38777d8c97fb189c8c656fe4ea33629	ATTACHED	2026-08-21 01:55:05.579	2026-08-21 01:55:07.537	\N
a4c2689d-1704-48ba-9ea4-068f2e678a49	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	TASK_ATTACHMENT	Screenshot_2026-08-21_101341.png	hrm/task_attachment/2026-08-21/932dbdf5-bb9f-44fd-9a33-7e77535b245b	https://res.cloudinary.com/dqxsqiglg/image/upload/v1787282034/hrm/task_attachment/2026-08-21/932dbdf5-bb9f-44fd-9a33-7e77535b245b.png	image/png	263895	3f619bc0c9f5995c517095d16099661f25f04dce45b2286b6190191dc3ad504d	TEMPORARY	2026-08-21 03:13:55.271	2026-08-21 03:13:55.271	\N
71935492-4b63-4229-8140-cf40acdc24db	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	TASK_ATTACHMENT	demo.pdf	task_attachment/2026-08-21/37061c86-0c2e-4911-869f-60a20bbb71eb.pdf	/uploads/task_attachment%2F2026-08-21%2F37061c86-0c2e-4911-869f-60a20bbb71eb.pdf	application/pdf	93499	8186cce287232e9ae24ce2c116398460c30d9fdc93b50a58bed921757f9837a4	TEMPORARY	2026-08-21 04:32:28.743	2026-08-21 04:32:28.743	\N
d596f3de-880e-4632-bfee-202b72fcf31a	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	ATTENDANCE	attendance.jpg	attendance/2026-08-22/f75218e7-771f-4582-a801-34c460a7594c.jpg	https://pub-7d69ec28111e4d0b89308dc0ae7571ed.r2.dev/attendance/2026-08-22/f75218e7-771f-4582-a801-34c460a7594c.jpg	image/jpeg	20629	51a387a21ce9f0dc9bdce45dfb53e2e8b3597619da3dab3f388363656213eb0e	ATTACHED	2026-08-22 02:03:11.862	2026-08-22 02:03:13.905	\N
1237e7c5-bafe-4652-9780-54f850b52fec	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	TASK_ATTACHMENT	1000026902.webp	hrm/task_attachment/2026-08-22/75100f5f-154c-40b1-93c4-42157b4792f1	https://res.cloudinary.com/dqxsqiglg/image/upload/v1787365202/hrm/task_attachment/2026-08-22/75100f5f-154c-40b1-93c4-42157b4792f1.webp	image/webp	53006	a3ee513c5429035337b5f8503500eeab5507dabe503ab0ae64882b87156df62f	TEMPORARY	2026-08-22 02:20:02.711	2026-08-22 02:20:02.711	\N
d55963c9-3fab-40c9-a769-a5f1c4bf09e5	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	TASK_ATTACHMENT	1000026902.webp	hrm/task_attachment/2026-08-22/0dc5a84f-beb0-478b-a104-f7126ffb260a	https://res.cloudinary.com/dqxsqiglg/image/upload/v1787365224/hrm/task_attachment/2026-08-22/0dc5a84f-beb0-478b-a104-f7126ffb260a.webp	image/webp	53006	a3ee513c5429035337b5f8503500eeab5507dabe503ab0ae64882b87156df62f	TEMPORARY	2026-08-22 02:20:25.092	2026-08-22 02:20:25.092	\N
21f36624-e262-4ba1-be65-6c80b426a9a4	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	EMPLOYEE_DOCUMENT	1000026902.webp	hrm/employee_document/2026-08-22/e52b01d6-b536-47a0-9b0c-46bb9045558b	https://res.cloudinary.com/dqxsqiglg/image/upload/v1787365294/hrm/employee_document/2026-08-22/e52b01d6-b536-47a0-9b0c-46bb9045558b.webp	image/webp	53006	a3ee513c5429035337b5f8503500eeab5507dabe503ab0ae64882b87156df62f	TEMPORARY	2026-08-22 02:21:34.918	2026-08-22 02:21:34.918	\N
ac2f2ee4-f0e6-43af-9a6f-751fd7695add	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	ATTENDANCE	7f597e11-5baf-4a3d-8509-5daf7a70b606.jpg	attendance/2026-08-22/5f8d690a-6d27-481a-bced-48f04a466a0b.jpg	https://pub-7d69ec28111e4d0b89308dc0ae7571ed.r2.dev/attendance/2026-08-22/5f8d690a-6d27-481a-bced-48f04a466a0b.jpg	image/jpeg	211654	93409857384a87f69685635adc465291cc553647cf46be792c57d0bb9edbaf03	ATTACHED	2026-08-22 11:56:48.267	2026-08-22 11:56:51.981	\N
f971c770-15ec-497c-b242-dd15bdfe418e	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	FACE_REGISTRATION	7C28205A-39E0-48E6-B7B8-9AC0A113D55F.jpg	face_registration/2026-08-24/7c88c0fa-6bfb-4137-aa3d-ea2df6033811.jpg	https://pub-7d69ec28111e4d0b89308dc0ae7571ed.r2.dev/face_registration/2026-08-24/7c88c0fa-6bfb-4137-aa3d-ea2df6033811.jpg	image/jpeg	335514	6f1a3af8291ce299ff522198ccd88435d84d2f5d2f1bf7a82785e39a756822f9	ATTACHED	2026-08-24 01:59:54.037	2026-08-24 02:00:12.509	\N
d47ab9bb-e44c-4462-b1ae-8ba2097d7894	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	FACE_REGISTRATION	A504640F-DC10-4D9B-853B-45A395755AB1.jpg	face_registration/2026-08-24/6b8a551f-f632-4ed9-a861-25b263c5239e.jpg	https://pub-7d69ec28111e4d0b89308dc0ae7571ed.r2.dev/face_registration/2026-08-24/6b8a551f-f632-4ed9-a861-25b263c5239e.jpg	image/jpeg	363230	4c8876cdc33c9c2828282e649801dbf565342a1d5389ba89f2836365b85e0dbf	ATTACHED	2026-08-24 01:59:59.939	2026-08-24 02:00:12.509	\N
31c079da-3a34-49d8-a85d-0d6570284dab	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	FACE_REGISTRATION	A1F4BE84-8DB7-4648-A3A8-FAE8FDDE183A.jpg	face_registration/2026-08-24/04c16beb-e183-45ce-a522-ad50bb0c9589.jpg	https://pub-7d69ec28111e4d0b89308dc0ae7571ed.r2.dev/face_registration/2026-08-24/04c16beb-e183-45ce-a522-ad50bb0c9589.jpg	image/jpeg	317775	370c77c3d807240f01fc7898b20f208b0213cda7217ebe33bf97e76cd5cdf503	ATTACHED	2026-08-24 02:00:10.885	2026-08-24 02:00:12.509	\N
aae19773-fb69-4ab6-8eb1-d676a562008f	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	ATTENDANCE	attendance.jpg	attendance/2026-08-24/bacef4bc-a6c0-44cf-86d6-6cdcb2e31f07.jpg	https://pub-7d69ec28111e4d0b89308dc0ae7571ed.r2.dev/attendance/2026-08-24/bacef4bc-a6c0-44cf-86d6-6cdcb2e31f07.jpg	image/jpeg	41223	93c35cc32400eca22d8ccdafa0bb4733136c464d630e5ffadb86d4103209d714	ATTACHED	2026-08-24 02:00:30.004	2026-08-24 02:00:32.676	\N
765df136-9870-467d-ac1e-36a2b316fe0b	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	ATTENDANCE	attendance.jpg	attendance/2026-08-25/7efd67a9-2573-4e82-ab63-cb914aab8a4a.jpg	https://pub-7d69ec28111e4d0b89308dc0ae7571ed.r2.dev/attendance/2026-08-25/7efd67a9-2573-4e82-ab63-cb914aab8a4a.jpg	image/jpeg	20771	eb17c77717f6d4c9965f39d0da78263a1b5b17f82cb0d6208270fc6cb57ae0e4	ATTACHED	2026-08-25 01:29:25.976	2026-08-25 01:29:28.167	\N
5af2b6f7-2513-4205-8d8f-89e4f25abd1b	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	ATTENDANCE	c687fa8e-6b35-48c4-a443-3a03e81977dd.jpg	attendance/2026-08-25/a1f489ac-6d6b-4a62-910e-bd0d2e445f9c.jpg	https://pub-7d69ec28111e4d0b89308dc0ae7571ed.r2.dev/attendance/2026-08-25/a1f489ac-6d6b-4a62-910e-bd0d2e445f9c.jpg	image/jpeg	150908	5758c2e3b08704885303bb431251b0ee8f18581144c783143504ec7d4ea50dc6	ATTACHED	2026-08-25 11:37:14.636	2026-08-25 11:37:18.087	\N
e9a6d200-5a35-4029-8f95-f414ef371e55	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	ATTENDANCE	attendance.jpg	attendance/2026-08-26/f7fa8290-a73f-457c-8f7c-6228610fa49a.jpg	https://pub-7d69ec28111e4d0b89308dc0ae7571ed.r2.dev/attendance/2026-08-26/f7fa8290-a73f-457c-8f7c-6228610fa49a.jpg	image/jpeg	24527	ff995acf83a96b0e4c1b4f10c9dbc5f71b0e8bfb1834afe57761e4413fa175d3	ATTACHED	2026-08-26 01:48:13.506	2026-08-26 01:48:15.528	\N
966bcc2d-5bc2-43fa-b32f-78a3278edc1d	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	ATTENDANCE	attendance.jpg	attendance/2026-08-26/879053a8-b7ed-43e7-b724-79eae73e3b70.jpg	https://pub-7d69ec28111e4d0b89308dc0ae7571ed.r2.dev/attendance/2026-08-26/879053a8-b7ed-43e7-b724-79eae73e3b70.jpg	image/jpeg	35962	c96a0e13a6807b95ffd260e8b689f4b8487b7687ca82ab78ed675d32db5fdfb3	ATTACHED	2026-08-26 15:18:50.802	2026-08-26 15:18:54.222	\N
b8248a48-4fa3-4ef4-a575-a2058c6fcb08	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	ATTENDANCE	62578463-a766-4253-8c60-fa900ff3007b.jpg	attendance/2026-08-26/2be9c9c4-e9ed-484c-af53-fc49dfb1662b.jpg	https://pub-7d69ec28111e4d0b89308dc0ae7571ed.r2.dev/attendance/2026-08-26/2be9c9c4-e9ed-484c-af53-fc49dfb1662b.jpg	image/jpeg	215481	27a77035affb784bf895021d607f378109d861b0e9914b4b5ee7df7a5e4d212e	ATTACHED	2026-08-26 15:18:49.631	2026-08-26 15:18:54.324	\N
6f0fac57-7c8d-4980-b6c2-d4e81b8171f7	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	ATTENDANCE	5FF34410-F505-4615-9C2F-E595F7888964.jpg	attendance/2026-08-26/7b23496b-956a-4323-a71f-5e3e57117231.jpg	https://pub-7d69ec28111e4d0b89308dc0ae7571ed.r2.dev/attendance/2026-08-26/7b23496b-956a-4323-a71f-5e3e57117231.jpg	image/jpeg	291788	c411d30548f545ef943ce100f43b06081a6d4b7955cec8c2fcbe82738a3cd5bc	ATTACHED	2026-08-26 15:19:32.62	2026-08-26 15:19:37.044	\N
c75962cb-ebcd-4000-b158-09110a859b22	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	ATTENDANCE	A0980FBE-F643-4BE3-936E-0C57204215EA.jpg	attendance/2026-08-27/d5248571-17e4-4ba2-8f56-ecc9715d5db8.jpg	https://pub-7d69ec28111e4d0b89308dc0ae7571ed.r2.dev/attendance/2026-08-27/d5248571-17e4-4ba2-8f56-ecc9715d5db8.jpg	image/jpeg	308315	5e68295067e10586c2c5a2e3eb0b38e2775c1c3974a096397786046a42fac0f6	ATTACHED	2026-08-27 03:20:18.699	2026-08-27 03:20:23.122	\N
b03636ef-9ccc-4d54-9a02-3b8fcee7dd0f	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	ATTENDANCE	attendance.jpg	attendance/2026-08-27/b7a1ab5a-06a4-45bc-8a62-81d7debf5c89.jpg	https://pub-7d69ec28111e4d0b89308dc0ae7571ed.r2.dev/attendance/2026-08-27/b7a1ab5a-06a4-45bc-8a62-81d7debf5c89.jpg	image/jpeg	23243	ea11ebef5a562f7208cf4ca2104c0b3120633b0c39c0ac0075d57aeb32ee6698	ATTACHED	2026-08-27 08:51:33.493	2026-08-27 08:51:35.591	\N
89618409-b904-4158-8193-bc4fbeae03e9	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	ATTENDANCE	c3c41446-6fcd-40e6-af0b-86bee6b5cfed.jpg	attendance/2026-08-27/0109019e-4bf6-4af3-9915-66c8379d2933.jpg	https://pub-7d69ec28111e4d0b89308dc0ae7571ed.r2.dev/attendance/2026-08-27/0109019e-4bf6-4af3-9915-66c8379d2933.jpg	image/jpeg	271322	a037ef815426f548c7a05bb4356739bb0bad3a52b69390a1c1c17b3b811af684	ATTACHED	2026-08-27 11:31:50.091	2026-08-27 11:31:54.205	\N
02805ee0-bd98-45e0-99eb-2f0bab5085c3	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	ATTENDANCE	attendance.jpg	attendance/2026-08-28/88cdea36-f661-4d3d-b984-dc57d00fbcf1.jpg	https://pub-7d69ec28111e4d0b89308dc0ae7571ed.r2.dev/attendance/2026-08-28/88cdea36-f661-4d3d-b984-dc57d00fbcf1.jpg	image/jpeg	20428	596d64f87df11bfe08acef2f4ff9a08a480cf9662abe64b6518a947b532ad6c8	ATTACHED	2026-08-28 01:56:00.396	2026-08-28 01:56:02.763	\N
1773df83-4368-4d89-9aab-450111ecb9c8	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	ATTENDANCE	0031e032-ec2c-414f-abbf-e60b0c198647.jpg	attendance/2026-08-28/3d817c7f-d0e4-4de1-bdbc-a3ea927d485f.jpg	https://pub-7d69ec28111e4d0b89308dc0ae7571ed.r2.dev/attendance/2026-08-28/3d817c7f-d0e4-4de1-bdbc-a3ea927d485f.jpg	image/jpeg	147278	ad2ff86efb2a0702353f7891df1753362f22e21f913d1141f4f7708a112d052c	ATTACHED	2026-08-28 11:33:20.881	2026-08-28 11:33:24.805	\N
31a6359d-e509-4569-ae08-7ae288c7f405	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	ATTENDANCE	attendance.jpg	attendance/2026-08-29/f255e324-928a-49ff-82dc-e1d3e67cd890.jpg	https://pub-7d69ec28111e4d0b89308dc0ae7571ed.r2.dev/attendance/2026-08-29/f255e324-928a-49ff-82dc-e1d3e67cd890.jpg	image/jpeg	23768	63b68d7093ac2121122dd4c75bd6c2df2b59fd205440236a25f84fe3d8cbada7	ATTACHED	2026-08-29 01:51:00.594	2026-08-29 01:51:03.219	\N
2a7108db-411e-4de0-a1d4-70053df4378a	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	ATTENDANCE	attendance.jpg	attendance/2026-08-29/1786beee-cfcd-4fcf-97c7-0eb6b737ecdd.jpg	https://pub-7d69ec28111e4d0b89308dc0ae7571ed.r2.dev/attendance/2026-08-29/1786beee-cfcd-4fcf-97c7-0eb6b737ecdd.jpg	image/jpeg	38708	3cdc0ebb8f83828d4ab03765765396dfbb8c508b328119f6c18003b779c9656f	ATTACHED	2026-08-29 02:07:59.269	2026-08-29 02:08:01.441	\N
a4171543-412d-42a1-9c95-c542aff8d3b0	545ef296-1135-4885-8e61-89932645af6c	EMPLOYEE_DOCUMENT	0A46542A-0E2A-4D61-8784-FAD5DBA574A5.jpg	hrm/employee_document/2026-08-29/d657e4e4-2d96-4943-85b9-4ea095ec8083	https://res.cloudinary.com/dqxsqiglg/image/upload/v1787991218/hrm/employee_document/2026-08-29/d657e4e4-2d96-4943-85b9-4ea095ec8083.jpg	image/jpeg	219500	fce98ab8e853dd6835ede28a714a44caa194242f851a10b917d989febce08a05	TEMPORARY	2026-08-29 08:13:38.498	2026-08-29 08:13:38.498	\N
7661100c-e4f9-47ea-b794-40b669b55acd	545ef296-1135-4885-8e61-89932645af6c	TASK_ATTACHMENT	E2F10515-0BC7-46B8-AA42-31EB35BB5BB4.jpg	hrm/task_attachment/2026-08-29/43d1bc89-fa01-47ef-b08c-de226a98c848	https://res.cloudinary.com/dqxsqiglg/image/upload/v1787991281/hrm/task_attachment/2026-08-29/43d1bc89-fa01-47ef-b08c-de226a98c848.jpg	image/jpeg	324277	5612f31fe4e1e4d335c9a0ea4fe01747691db081aaf836b3a46476ffc4d491fc	TEMPORARY	2026-08-29 08:14:42.068	2026-08-29 08:14:42.068	\N
b72c7b2a-9c99-4ee8-a079-82fb962a8a2d	545ef296-1135-4885-8e61-89932645af6c	TASK_ATTACHMENT	80066738-E55F-4DD3-9EF3-22230B72E941.jpg	hrm/task_attachment/2026-08-29/c855af4d-4f72-49c8-b9aa-82cd37b10eb0	https://res.cloudinary.com/dqxsqiglg/image/upload/v1787991361/hrm/task_attachment/2026-08-29/c855af4d-4f72-49c8-b9aa-82cd37b10eb0.jpg	image/jpeg	167152	b2ff6651fadb9a8318b12b1dd9368ae4fedf0f2529db4b6dc3537b85d8066576	TEMPORARY	2026-08-29 08:16:01.975	2026-08-29 08:16:01.975	\N
9ce66426-1360-4040-ae64-3257353e3d39	545ef296-1135-4885-8e61-89932645af6c	TASK_ATTACHMENT	AAE79EFE-3DFF-4C38-87E5-FD05D18A333C.jpg	hrm/task_attachment/2026-08-29/7619879f-ff67-480a-bbea-6e0733f35b33	https://res.cloudinary.com/dqxsqiglg/image/upload/v1787991425/hrm/task_attachment/2026-08-29/7619879f-ff67-480a-bbea-6e0733f35b33.jpg	image/jpeg	271413	5d0e508c006813b40c307e4b4a25df1307e65a2ed534e688aea509ca1bf497f7	TEMPORARY	2026-08-29 08:17:05.929	2026-08-29 08:17:05.929	\N
8ffec736-fe9e-4ce4-835d-38c1c42a1658	545ef296-1135-4885-8e61-89932645af6c	ASSET_INCIDENT	4877D2B9-01E7-41BE-B44A-074B5EA1A5C4.jpg	hrm/asset_incident/2026-08-29/d02b3865-b581-4429-94e2-c9912831f3af	https://res.cloudinary.com/dqxsqiglg/image/upload/v1787991513/hrm/asset_incident/2026-08-29/d02b3865-b581-4429-94e2-c9912831f3af.jpg	image/jpeg	264835	22f0c05306e762864dc14f8354ade2104669f3cf0636eb19f478f5a1c8fb34f2	TEMPORARY	2026-08-29 08:18:33.832	2026-08-29 08:18:33.832	\N
9955255c-58f3-4c77-a564-c42ab8640c47	334b2294-9bba-4f31-8290-5a87484a62f0	EMPLOYEE_DOCUMENT	684EE983-EE01-410D-8D65-C5521CFD57CE.jpg	hrm/employee_document/2026-08-29/3df4149b-4366-4cba-a5b0-69da5cd0fa4f	https://res.cloudinary.com/dqxsqiglg/image/upload/v1787992803/hrm/employee_document/2026-08-29/3df4149b-4366-4cba-a5b0-69da5cd0fa4f.jpg	image/jpeg	414976	62bc48136e48efe515acd6a969c7ac023b26071e86fbc3e2ad019a16bd108657	TEMPORARY	2026-08-29 08:40:04.038	2026-08-29 08:40:04.038	\N
190bde95-68db-4a3d-bbd6-f31f5fd38a6a	846641e3-667b-4e7f-b505-afdc1d66b54a	EMPLOYEE_DOCUMENT	6976FF0E-4DB3-43CA-A989-471AFC25E82A.jpg	hrm/employee_document/2026-08-29/a15afebf-ad34-49a0-af2e-4c0994fc9d1a	https://res.cloudinary.com/dqxsqiglg/image/upload/v1787992821/hrm/employee_document/2026-08-29/a15afebf-ad34-49a0-af2e-4c0994fc9d1a.jpg	image/jpeg	196853	9bc3063fabad75cc0186360aa8c0c40a528a2bdf6eee294fdbd0ec6e7f996647	TEMPORARY	2026-08-29 08:40:21.688	2026-08-29 08:40:21.688	\N
a03943fa-cda0-4dfe-82f2-84fe6a0d2aaa	846641e3-667b-4e7f-b505-afdc1d66b54a	FACE_REGISTRATION	F17A9DE4-4AC9-44E1-A155-0609292903B8.jpg	face_registration/2026-08-29/31de498e-98f5-4ed9-935d-2125ae078451.jpg	https://pub-7d69ec28111e4d0b89308dc0ae7571ed.r2.dev/face_registration/2026-08-29/31de498e-98f5-4ed9-935d-2125ae078451.jpg	image/jpeg	379969	3e8f02b7fda1e5a61336e1cef6e182af4d26896f687f25b9884fab2bc85bd219	ATTACHED	2026-08-29 08:40:33.127	2026-08-29 08:40:51.813	\N
73969bdb-a535-488d-a21f-4a3f67140204	846641e3-667b-4e7f-b505-afdc1d66b54a	FACE_REGISTRATION	E6F8E644-BDCC-4A47-AACF-DA3F807E9CAB.jpg	face_registration/2026-08-29/b749ea8f-fed0-413f-8bda-dd9fd751cc24.jpg	https://pub-7d69ec28111e4d0b89308dc0ae7571ed.r2.dev/face_registration/2026-08-29/b749ea8f-fed0-413f-8bda-dd9fd751cc24.jpg	image/jpeg	350073	b6a2b2799498af12581c536c5d51dfc672f6074ad47ff9707041981dc1e40af2	ATTACHED	2026-08-29 08:40:40.255	2026-08-29 08:40:51.813	\N
bd3a5322-7312-4d9e-94c6-d21a45b6be18	846641e3-667b-4e7f-b505-afdc1d66b54a	FACE_REGISTRATION	5EFDFA2C-ED0E-4759-8F81-0AE980DC92FB.jpg	face_registration/2026-08-29/76b99ce7-5eea-45e0-8f11-07c977db5c48.jpg	https://pub-7d69ec28111e4d0b89308dc0ae7571ed.r2.dev/face_registration/2026-08-29/76b99ce7-5eea-45e0-8f11-07c977db5c48.jpg	image/jpeg	376172	9c6fd0bb8a4e149eada4c75aa27ecea0414e4cbc69262052130524045007b731	ATTACHED	2026-08-29 08:40:46.579	2026-08-29 08:40:51.813	\N
8cb7bfb8-d1b7-4422-b235-2b43825a505a	c2a06e5b-22fd-4862-bf12-8c36f5e07d9c	EMPLOYEE_DOCUMENT	C50EF538-D2A5-46B0-A7B2-3DF13B8F0E8F.jpg	hrm/employee_document/2026-08-29/e4e0e9a6-a0a1-42ae-946f-600857503823	https://res.cloudinary.com/dqxsqiglg/image/upload/v1787992857/hrm/employee_document/2026-08-29/e4e0e9a6-a0a1-42ae-946f-600857503823.jpg	image/jpeg	447347	58c44d1688761967bbef5075e5167985efc3f97c32421f81cafdbdaffb85e99c	TEMPORARY	2026-08-29 08:40:57.77	2026-08-29 08:40:57.77	\N
b03bbd0f-fc86-4e04-b60a-23160dc864b5	c2a06e5b-22fd-4862-bf12-8c36f5e07d9c	FACE_REGISTRATION	D051FF72-C145-4479-B79B-943F0BF68F37.jpg	face_registration/2026-08-29/160550b2-9b3b-4f4b-a604-9a20a1908b9f.jpg	https://pub-7d69ec28111e4d0b89308dc0ae7571ed.r2.dev/face_registration/2026-08-29/160550b2-9b3b-4f4b-a604-9a20a1908b9f.jpg	image/jpeg	500947	153974a37452bdc454ea1f4088c484e29e36facb25e7015cae571cbd45e7e270	TEMPORARY	2026-08-29 08:41:19.217	2026-08-29 08:41:19.217	\N
1864fa20-ffd7-4ae8-8d83-ee81de259c58	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	EMPLOYEE_DOCUMENT	0e2f8cf5-bc7c-4a65-a469-dff89959a7f6.jpg	hrm/employee_document/2026-08-29/6604d338-1073-4d96-b478-361919c9e3c4	https://res.cloudinary.com/dqxsqiglg/image/upload/v1787992902/hrm/employee_document/2026-08-29/6604d338-1073-4d96-b478-361919c9e3c4.jpg	image/jpeg	75076	d20d86b95847176f0936abd53fc6a1de9f829f9ada48f14fc5b5d727b9df13a2	TEMPORARY	2026-08-29 08:41:42.724	2026-08-29 08:41:42.724	\N
9c4017c8-1fc6-4c8e-82b0-c422f43b592f	846641e3-667b-4e7f-b505-afdc1d66b54a	ATTENDANCE	attendance.jpg	attendance/2026-08-29/7cb1ee25-67fe-4d3d-a73e-0e0497382d0d.jpg	https://pub-7d69ec28111e4d0b89308dc0ae7571ed.r2.dev/attendance/2026-08-29/7cb1ee25-67fe-4d3d-a73e-0e0497382d0d.jpg	image/jpeg	31887	19a164bd2d507235e13498b4df0768131a444610df047d544c4236ef35fea037	ATTACHED	2026-08-29 08:45:09.718	2026-08-29 08:45:11.882	\N
2c43a486-f5ef-4c50-b60f-07be121ea907	49098001-4375-47f0-b36d-c8758d8715ff	FACE_REGISTRATION	zalo.jpg	face_registration/2026-08-29/dfeb4458-93e1-4b20-b06a-517093c67ff6.jpg	https://pub-7d69ec28111e4d0b89308dc0ae7571ed.r2.dev/face_registration/2026-08-29/dfeb4458-93e1-4b20-b06a-517093c67ff6.jpg	image/jpeg	127347	6cd2ec9fc92e9200ee7c4f35f05cb09218b9ff0f804a53e8dc4dc1d860ccefbd	TEMPORARY	2026-08-29 09:19:15.874	2026-08-29 09:19:15.874	\N
cb6406b3-6b04-41e7-bd32-507df6a09164	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	TASK_ATTACHMENT	3bb6448a-5584-4410-bbff-493d9b09ebbc.jpg	hrm/task_attachment/2026-09-04/e4660c80-acca-48c2-ac2a-d33e2dea11b6	https://res.cloudinary.com/dqxsqiglg/image/upload/v1788483760/hrm/task_attachment/2026-09-04/e4660c80-acca-48c2-ac2a-d33e2dea11b6.jpg	image/jpeg	97791	c1fe265537092989c158179079b157200183ecca04ff38fc01945a3f8d028a7f	TEMPORARY	2026-09-04 01:02:40.696	2026-09-04 01:02:40.696	\N
d79604ea-971f-4f87-babb-884363549d65	49098001-4375-47f0-b36d-c8758d8715ff	TASK_ATTACHMENT	5614C5AA-DA44-4063-802E-B8F86EB2D5A9.jpg	hrm/task_attachment/2026-09-04/403a8a6f-3af0-4239-a2dd-436ee6b01c6d	https://res.cloudinary.com/dqxsqiglg/image/upload/v1788492114/hrm/task_attachment/2026-09-04/403a8a6f-3af0-4239-a2dd-436ee6b01c6d.jpg	image/jpeg	219395	3a2adc074401cb01d4b5e9b3f16f754d30e3a70979d4588b13ada98585c6161f	TEMPORARY	2026-09-04 03:21:54.799	2026-09-04 03:21:54.799	\N
150bf89a-e369-4c1a-a0d2-eaf87313737e	49098001-4375-47f0-b36d-c8758d8715ff	TASK_ATTACHMENT	12983699-09B2-4EBB-AB03-F71A51043873.jpg	hrm/task_attachment/2026-09-04/783fb63b-66c6-4c8d-8854-534fa4f4ce2d	https://res.cloudinary.com/dqxsqiglg/image/upload/v1788492114/hrm/task_attachment/2026-09-04/783fb63b-66c6-4c8d-8854-534fa4f4ce2d.jpg	image/jpeg	265343	db7e2d81f9c34d562800e4aafa63ff1785bdf30000871f8325ffc436e854423c	TEMPORARY	2026-09-04 03:21:54.778	2026-09-04 03:21:54.778	\N
48d1f1a8-f3e5-4f50-a8af-7cfdd8ca42cd	49098001-4375-47f0-b36d-c8758d8715ff	TASK_ATTACHMENT	922B49BB-7C74-4EBC-9D49-99459599BD19.jpg	hrm/task_attachment/2026-09-04/9ae42146-f0f4-44dd-93b8-cc05a28cbd59	https://res.cloudinary.com/dqxsqiglg/image/upload/v1788492114/hrm/task_attachment/2026-09-04/9ae42146-f0f4-44dd-93b8-cc05a28cbd59.jpg	image/jpeg	258018	ce6d75fa80541903e1de7aa10feffaf97635431dff7f9742ddf3474da0f2ba35	TEMPORARY	2026-09-04 03:21:54.822	2026-09-04 03:21:54.822	\N
a5b4ca69-86de-47c6-bc55-901b713ddd1d	49098001-4375-47f0-b36d-c8758d8715ff	TASK_ATTACHMENT	03B43346-C96B-400D-B701-6F53948EC6E8.jpg	hrm/task_attachment/2026-09-04/202b7651-3f04-4508-9c3c-ee1c5db88137	https://res.cloudinary.com/dqxsqiglg/image/upload/v1788492114/hrm/task_attachment/2026-09-04/202b7651-3f04-4508-9c3c-ee1c5db88137.jpg	image/jpeg	286799	ef4d5630cb2387c53df923845254b16e390eebf5b32094e06f99204d2fe4d44f	TEMPORARY	2026-09-04 03:21:54.865	2026-09-04 03:21:54.865	\N
0eecb8a6-3e1c-4c40-b542-307dfe87681e	49098001-4375-47f0-b36d-c8758d8715ff	TASK_ATTACHMENT	B0BBC51A-FD42-4057-A954-0BFC611C0243.jpg	hrm/task_attachment/2026-09-04/99962da0-a99e-4c42-8f4e-3213cfef6a35	https://res.cloudinary.com/dqxsqiglg/image/upload/v1788492114/hrm/task_attachment/2026-09-04/99962da0-a99e-4c42-8f4e-3213cfef6a35.jpg	image/jpeg	360962	6724f6b636443ed8b2872cdd66edce46819816bcd3b0f98ef1031b43dbdb2002	TEMPORARY	2026-09-04 03:21:54.894	2026-09-04 03:21:54.894	\N
4ea73282-61d0-4333-b280-5bdcf3976b12	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	TASK_ATTACHMENT	190BE90B-B527-439E-A3E8-C301A49F9054.jpg	hrm/task_attachment/2026-09-06/49906c1a-f773-496f-8ded-ecafdf95af2f	https://res.cloudinary.com/dqxsqiglg/image/upload/v1788676309/hrm/task_attachment/2026-09-06/49906c1a-f773-496f-8ded-ecafdf95af2f.jpg	image/jpeg	178029	0777274bf8d6f32d79a82b132adc6684cb6c90b5b818574445313e9096dfb525	TEMPORARY	2026-09-06 06:31:50.024	2026-09-06 06:31:50.024	\N
429720df-8ea0-48ba-b15b-efee81af7151	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	TASK_ATTACHMENT	4BF5CD3A-133D-4B6D-AE01-3F55B325D5BA.jpg	hrm/task_attachment/2026-09-06/5732e75d-765c-4f01-bf77-284bf2396147	https://res.cloudinary.com/dqxsqiglg/image/upload/v1788676762/hrm/task_attachment/2026-09-06/5732e75d-765c-4f01-bf77-284bf2396147.jpg	image/jpeg	263808	dfaa7058fb8a323380fb634ef23ccbf64d435acc8ac244e5f9eb457a2d488e05	TEMPORARY	2026-09-06 06:39:22.426	2026-09-06 06:39:22.426	\N
4cbaeaf5-3383-41c0-8158-1541680b8992	05ff1cc9-4cb6-4d87-a74b-0391a5539537	ATTENDANCE	3B44E4D6-D0DF-4078-848A-AD2216E04620.jpg	attendance/2026-09-07/648fa9bf-80b2-4ac6-801d-7c315432aa16.jpg	https://pub-7d69ec28111e4d0b89308dc0ae7571ed.r2.dev/attendance/2026-09-07/648fa9bf-80b2-4ac6-801d-7c315432aa16.jpg	image/jpeg	342451	85b8c8a8b0977dfbeaea3c9701bf5d2d61a6e6470b1ecf92a7bc4f7fea8593de	TEMPORARY	2026-09-07 07:32:03.292	2026-09-07 07:32:03.292	\N
a8daac20-5006-40a4-9ff5-e8735c0d6098	05ff1cc9-4cb6-4d87-a74b-0391a5539537	ATTENDANCE	33AB534F-AEDF-4D54-B102-AB4A6EC636C4.jpg	attendance/2026-09-07/08330c45-cb66-41f2-8034-fe5637250be8.jpg	https://pub-7d69ec28111e4d0b89308dc0ae7571ed.r2.dev/attendance/2026-09-07/08330c45-cb66-41f2-8034-fe5637250be8.jpg	image/jpeg	342451	85b8c8a8b0977dfbeaea3c9701bf5d2d61a6e6470b1ecf92a7bc4f7fea8593de	TEMPORARY	2026-09-07 07:36:32.936	2026-09-07 07:36:32.936	\N
a048c57f-6ef9-4f5d-9976-f7301d373a17	05ff1cc9-4cb6-4d87-a74b-0391a5539537	ATTENDANCE	34D3961C-ECEA-48B5-BDED-FDBA64E37BF2.jpg	attendance/2026-09-07/84b1d91a-8b92-4d01-8304-cb3ba1cfc474.jpg	https://pub-7d69ec28111e4d0b89308dc0ae7571ed.r2.dev/attendance/2026-09-07/84b1d91a-8b92-4d01-8304-cb3ba1cfc474.jpg	image/jpeg	320997	80c6d771124e61a5c013e202102b722081a1437f390430ca52cf3a7e41e2873a	TEMPORARY	2026-09-07 07:41:15.279	2026-09-07 07:41:15.279	\N
e004f440-2cd5-4439-b227-767385c38d73	31bb72f7-e5e2-493e-827d-3320e1054461	EMPLOYEE_DOCUMENT	E001E58E-3C9E-4241-9E29-4472EC3CADC5.jpg	hrm/employee_document/2026-09-07/f19ba38b-18ba-4505-bc6c-d84754538f22	https://res.cloudinary.com/dqxsqiglg/image/upload/v1788768027/hrm/employee_document/2026-09-07/f19ba38b-18ba-4505-bc6c-d84754538f22.jpg	image/jpeg	342451	85b8c8a8b0977dfbeaea3c9701bf5d2d61a6e6470b1ecf92a7bc4f7fea8593de	TEMPORARY	2026-09-07 08:00:28.438	2026-09-07 08:00:28.438	\N
2232337b-59e5-4f48-a752-6866e93a1685	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	ASSET_INCIDENT	75D1789C-8112-4E70-BA85-34C32AC5F51A.jpg	hrm/asset_incident/2026-09-07/2127857b-563b-4ef5-8c61-a21691b55499	https://res.cloudinary.com/dqxsqiglg/image/upload/v1788769671/hrm/asset_incident/2026-09-07/2127857b-563b-4ef5-8c61-a21691b55499.jpg	image/jpeg	342751	ca1830f82acecb98cb49e7868b483c870ae6fb996af5d623cd2861a82f24ddb4	TEMPORARY	2026-09-07 08:27:51.854	2026-09-07 08:27:51.854	\N
69b252f7-e785-416b-9dbe-3f8914a1776e	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	ASSET_INCIDENT	221812FF-DE8B-405E-ABF8-B1C394D37211.jpg	hrm/asset_incident/2026-09-07/3120518d-d53a-4403-bf8e-e32abeaa274e	https://res.cloudinary.com/dqxsqiglg/image/upload/v1788769687/hrm/asset_incident/2026-09-07/3120518d-d53a-4403-bf8e-e32abeaa274e.jpg	image/jpeg	342751	ca1830f82acecb98cb49e7868b483c870ae6fb996af5d623cd2861a82f24ddb4	TEMPORARY	2026-09-07 08:28:08.098	2026-09-07 08:28:08.098	\N
6bfb878d-1e43-41ff-8caa-82e07e1ff7b7	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	TASK_ATTACHMENT	98F7A449-5CE3-4E10-934B-ECF959223E0A.jpg	hrm/task_attachment/2026-09-07/5697d065-2fe4-4a64-a921-636774c025c6	https://res.cloudinary.com/dqxsqiglg/image/upload/v1788769747/hrm/task_attachment/2026-09-07/5697d065-2fe4-4a64-a921-636774c025c6.jpg	image/jpeg	342751	ca1830f82acecb98cb49e7868b483c870ae6fb996af5d623cd2861a82f24ddb4	TEMPORARY	2026-09-07 08:29:08.232	2026-09-07 08:29:08.232	\N
7a95d79b-bbb3-490b-8567-6c98a711f110	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	TASK_ATTACHMENT	99E1F6C7-09FA-462B-B839-4B7FE38ACE58.jpg	hrm/task_attachment/2026-09-07/ea72b076-e269-4684-ab32-92165222c111	https://res.cloudinary.com/dqxsqiglg/image/upload/v1788769747/hrm/task_attachment/2026-09-07/ea72b076-e269-4684-ab32-92165222c111.jpg	image/jpeg	321299	9bccd054f355641cc9330a7dcaf093215526dc48722a15523372a27fc5d864d4	TEMPORARY	2026-09-07 08:29:08.769	2026-09-07 08:29:08.769	\N
3c866b22-d7c6-4cc0-ad01-c2728380cd4a	31bb72f7-e5e2-493e-827d-3320e1054461	EMPLOYEE_DOCUMENT	CF42E323-2318-4808-9640-5A5E541FF949.jpg	hrm/employee_document/2026-09-07/9883e347-49cb-42f7-98d9-44c71b814402	https://res.cloudinary.com/dqxsqiglg/image/upload/v1788773260/hrm/employee_document/2026-09-07/9883e347-49cb-42f7-98d9-44c71b814402.jpg	image/jpeg	255623	64f3ae156a1214c0b0661422fa77a971baaa3cfa0bc113fc4c4a98776d1b7b9a	TEMPORARY	2026-09-07 09:27:40.86	2026-09-07 09:27:40.86	\N
f89044b6-644b-4640-b14c-dd0d9d49ae74	31bb72f7-e5e2-493e-827d-3320e1054461	EMPLOYEE_DOCUMENT	429F4BB9-5F53-46A6-B229-99B842DB45DE.jpg	hrm/employee_document/2026-09-07/78fd729c-af2f-4d2e-b632-8fe82f8a5093	https://res.cloudinary.com/dqxsqiglg/image/upload/v1788773510/hrm/employee_document/2026-09-07/78fd729c-af2f-4d2e-b632-8fe82f8a5093.jpg	image/jpeg	286419	b6ac8cda9edc89596d0e72551016dfe0a43103f0b532e89cd5590df7d11d94fb	TEMPORARY	2026-09-07 09:31:50.541	2026-09-07 09:31:50.541	\N
a2ae8ceb-55e4-4ded-b74a-8f22df057df0	31bb72f7-e5e2-493e-827d-3320e1054461	EMPLOYEE_DOCUMENT	F0CB44DD-EC46-4259-A7DF-C5E35461604C.jpg	hrm/employee_document/2026-09-07/f7d77803-5066-4295-a975-7200cc51bcf2	https://res.cloudinary.com/dqxsqiglg/image/upload/v1788773832/hrm/employee_document/2026-09-07/f7d77803-5066-4295-a975-7200cc51bcf2.jpg	image/jpeg	312520	ddcf6bd3ebf2befe12820a45f8fff57913c6ec2df5d6d85e5910daa2b152acda	TEMPORARY	2026-09-07 09:37:12.706	2026-09-07 09:37:12.706	\N
6c278147-b06c-4b56-911c-beadb3c500c2	31bb72f7-e5e2-493e-827d-3320e1054461	EMPLOYEE_DOCUMENT	AB336A54-AE41-443A-A320-2F0D96F3C28B.jpg	hrm/employee_document/2026-09-07/0fdd360b-967e-4978-8634-1b86bcace27e	https://res.cloudinary.com/dqxsqiglg/image/upload/v1788773870/hrm/employee_document/2026-09-07/0fdd360b-967e-4978-8634-1b86bcace27e.jpg	image/jpeg	262461	16b09e6a5fc29cc1404c6107da22601306aab5ad4afe8b7a1680543f101338f5	TEMPORARY	2026-09-07 09:37:50.601	2026-09-07 09:37:50.601	\N
5edf338f-8098-4507-aef3-f42ada7a1625	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	KPI_EVIDENCE	2bab15b4-958b-4a35-9eac-ac5e13be18e7.jpg	hrm/kpi_evidence/2026-09-08/3328b9a0-ea0f-45d5-888c-f39896c12a56	https://res.cloudinary.com/dqxsqiglg/image/upload/v1788843260/hrm/kpi_evidence/2026-09-08/3328b9a0-ea0f-45d5-888c-f39896c12a56.jpg	image/jpeg	208870	6ce6752e58b8ece9a2089e33b9cd8e1abfa88fa8602c73fb156083a1e7ec72d6	TEMPORARY	2026-09-08 04:54:21.335	2026-09-08 04:54:21.335	\N
a24d4471-c1b4-42f8-99be-e307e4df03e4	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	KPI_EVIDENCE	162B159D-C8D8-4F81-8BF5-B421D8166136.jpg	hrm/kpi_evidence/2026-09-08/87659428-5bc0-4a10-b2ea-fcb154467399	https://res.cloudinary.com/dqxsqiglg/image/upload/v1788852171/hrm/kpi_evidence/2026-09-08/87659428-5bc0-4a10-b2ea-fcb154467399.jpg	image/jpeg	217401	7ab5e6e56c80c41b3f2aa1355f7cc9f203969670fcbf60ee5981db174fe0e976	TEMPORARY	2026-09-08 07:22:52.139	2026-09-08 07:22:52.139	\N
92880487-a17c-4e36-b702-3afedde5722d	d5f49e78-0b72-4304-8413-b90446ced4a0	EMPLOYEE_DOCUMENT	tai_lieu_mau.pdf	employee_document/2026-09-09/7d1a506d-1e53-4824-a2cb-210015a5e519.pdf	/uploads/employee_document/2026-09-09/7d1a506d-1e53-4824-a2cb-210015a5e519.pdf	application/pdf	26963	096382f6abe1d1d389f640fc092ebda67312e59fa9cf08569a1c83fc7527f044	ATTACHED	2026-09-09 06:36:07.649	2026-09-09 06:36:09.085	\N
4a980062-9a72-42d3-90f4-67e92e9947cd	49098001-4375-47f0-b36d-c8758d8715ff	EMPLOYEE_DOCUMENT	Cam_nang_huong_dan_su_dung_cho_nhan_vien_Movielegend.pdf	employee_document/2026-09-09/a73565b2-8519-4281-9c13-ba8f5daa6ad6.pdf	/uploads/employee_document/2026-09-09/a73565b2-8519-4281-9c13-ba8f5daa6ad6.pdf	application/pdf	2176839	f4c083ae0a377cddc46da5f102ddb32a486dd82cc24869312115d1e70be3684c	TEMPORARY	2026-09-09 07:56:50.23	2026-09-09 07:56:50.23	\N
84466310-e860-4a4b-b935-4867fa2382cc	49098001-4375-47f0-b36d-c8758d8715ff	EMPLOYEE_DOCUMENT	MovieLegend_App_Guide_Chuyen_Nghiep.pdf	employee_document/2026-09-09/63d4674d-2169-415f-908f-2d1b3edf1175.pdf	/uploads/employee_document/2026-09-09/63d4674d-2169-415f-908f-2d1b3edf1175.pdf	application/pdf	3162962	000422be7bfe6795da5ac94285922a61db489915d11be1da179dffb79d9a5b59	TEMPORARY	2026-09-09 07:56:51.266	2026-09-09 07:56:51.266	\N
94bf5fd4-7190-444c-915e-9d9838f52249	49098001-4375-47f0-b36d-c8758d8715ff	EMPLOYEE_DOCUMENT	Cam_nang_huong_dan_su_dung_Role_Leader.pdf	employee_document/2026-09-09/5bb732a5-24e1-41f2-b17c-1469bdf04cf3.pdf	/uploads/employee_document/2026-09-09/5bb732a5-24e1-41f2-b17c-1469bdf04cf3.pdf	application/pdf	2195318	855ab5c579eb54a19d123911068f103b2f3722210736927ad502b5561032c4e4	TEMPORARY	2026-09-09 07:56:52.664	2026-09-09 07:56:52.664	\N
b8958542-88ec-450d-a587-dc44fe30d285	49098001-4375-47f0-b36d-c8758d8715ff	EMPLOYEE_DOCUMENT	E3791E97-B95B-4DE9-AA11-319A32E7B11A.docx	hrm/employee_document/2026-09-09/a5afcacd-1743-43b2-ba5f-89dd076ae34d.docx	https://res.cloudinary.com/dqxsqiglg/raw/upload/v1788940995/hrm/employee_document/2026-09-09/a5afcacd-1743-43b2-ba5f-89dd076ae34d.docx	application/vnd.openxmlformats-officedocument.wordprocessingml.document	21021	72c10d11d53be547f0dde368865e37ccb026188b83129a42cff6e6692b253cc6	ATTACHED	2026-09-09 08:03:16.311	2026-09-09 08:03:17.602	\N
2d2a1c98-6198-4757-9f02-1d82a425f14e	49098001-4375-47f0-b36d-c8758d8715ff	EMPLOYEE_DOCUMENT	E3791E97-B95B-4DE9-AA11-319A32E7B11A.docx	hrm/employee_document/2026-09-09/0efa13fe-4b4c-42c4-a230-cb187694986a.docx	https://res.cloudinary.com/dqxsqiglg/raw/upload/v1788941006/hrm/employee_document/2026-09-09/0efa13fe-4b4c-42c4-a230-cb187694986a.docx	application/vnd.openxmlformats-officedocument.wordprocessingml.document	21021	72c10d11d53be547f0dde368865e37ccb026188b83129a42cff6e6692b253cc6	ATTACHED	2026-09-09 08:03:26.883	2026-09-09 08:03:27.541	\N
fa2619f0-c9ad-4518-87a5-6a0d979894e7	49098001-4375-47f0-b36d-c8758d8715ff	EMPLOYEE_DOCUMENT	E3791E97-B95B-4DE9-AA11-319A32E7B11A.docx	hrm/employee_document/2026-09-09/ebe15723-07be-444a-916b-41e428665d5d.docx	https://res.cloudinary.com/dqxsqiglg/raw/upload/v1788941012/hrm/employee_document/2026-09-09/ebe15723-07be-444a-916b-41e428665d5d.docx	application/vnd.openxmlformats-officedocument.wordprocessingml.document	21021	72c10d11d53be547f0dde368865e37ccb026188b83129a42cff6e6692b253cc6	ATTACHED	2026-09-09 08:03:32.956	2026-09-09 08:03:33.582	\N
11286233-d8f6-42dd-ac50-2842f9d68bfe	49098001-4375-47f0-b36d-c8758d8715ff	EMPLOYEE_DOCUMENT	E3791E97-B95B-4DE9-AA11-319A32E7B11A.docx	hrm/employee_document/2026-09-09/06f4145a-ce33-415d-b5b8-f24e5db72929.docx	https://res.cloudinary.com/dqxsqiglg/raw/upload/v1788941045/hrm/employee_document/2026-09-09/06f4145a-ce33-415d-b5b8-f24e5db72929.docx	application/vnd.openxmlformats-officedocument.wordprocessingml.document	21021	72c10d11d53be547f0dde368865e37ccb026188b83129a42cff6e6692b253cc6	ATTACHED	2026-09-09 08:04:05.709	2026-09-09 08:04:06.347	\N
2814e500-c647-4b94-ae4a-3d7bd6a8dcb6	49098001-4375-47f0-b36d-c8758d8715ff	EMPLOYEE_DOCUMENT	E3791E97-B95B-4DE9-AA11-319A32E7B11A.docx	hrm/employee_document/2026-09-09/32a97e5d-0f79-497b-92fb-2cc024db9f44.docx	https://res.cloudinary.com/dqxsqiglg/raw/upload/v1788941049/hrm/employee_document/2026-09-09/32a97e5d-0f79-497b-92fb-2cc024db9f44.docx	application/vnd.openxmlformats-officedocument.wordprocessingml.document	21021	72c10d11d53be547f0dde368865e37ccb026188b83129a42cff6e6692b253cc6	ATTACHED	2026-09-09 08:04:09.996	2026-09-09 08:04:10.597	\N
52c0fe25-6657-4155-9748-c4bd40c7ee5d	49098001-4375-47f0-b36d-c8758d8715ff	EMPLOYEE_DOCUMENT	386F1522-A5EC-42B8-AAF8-4B885F74F2EF.docx	hrm/employee_document/2026-09-09/eeb42277-c3b0-4c68-97f5-97f1adbc32b6.docx	https://res.cloudinary.com/dqxsqiglg/raw/upload/v1788941151/hrm/employee_document/2026-09-09/eeb42277-c3b0-4c68-97f5-97f1adbc32b6.docx	application/vnd.openxmlformats-officedocument.wordprocessingml.document	115762	e2742fcc3e477063d1ac0fc67294b8aca2cb350174bf7c6bb289034abb50f679	ATTACHED	2026-09-09 08:05:52.374	2026-09-09 08:05:53.228	\N
bea99c1f-0847-4436-a063-64e853f3027c	d5f49e78-0b72-4304-8413-b90446ced4a0	EMPLOYEE_DOCUMENT	bang-cham-cong-2026-09-09.xlsx	hrm/employee_document/2026-09-09/79f702e2-e6fb-4e1f-adb2-f3aff1718fb1.xlsx	https://res.cloudinary.com/dqxsqiglg/raw/upload/v1788941174/hrm/employee_document/2026-09-09/79f702e2-e6fb-4e1f-adb2-f3aff1718fb1.xlsx	application/vnd.openxmlformats-officedocument.spreadsheetml.sheet	15275	f07008cd466bb23f4124a0c3c5a8bb9efc21d66616387b1428a4db759fc8e321	ATTACHED	2026-09-09 08:06:14.849	2026-09-09 08:06:16.111	\N
46cb0ede-0ced-43e2-a11a-bb3ccdec415e	d5f49e78-0b72-4304-8413-b90446ced4a0	EMPLOYEE_DOCUMENT	tai_lieu_mau.docx	hrm/employee_document/2026-09-09/c1cb3961-2645-4216-9051-219a7546fa87.docx	https://res.cloudinary.com/dqxsqiglg/raw/upload/v1788941580/hrm/employee_document/2026-09-09/c1cb3961-2645-4216-9051-219a7546fa87.docx	application/vnd.openxmlformats-officedocument.wordprocessingml.document	37760	1e263cc22db349cc46ea917fecb83d77c2d5c9c2fd597c1413d689012a217918	ATTACHED	2026-09-09 08:13:00.466	2026-09-09 08:13:02.612	\N
89392439-6271-4b48-96ee-44f0e6e0ea95	49098001-4375-47f0-b36d-c8758d8715ff	EMPLOYEE_DOCUMENT	7e877d0f-bdff-431e-ad5b-38f1748fb040.jpg	hrm/employee_document/2026-09-09/fc69cc9e-ac15-497e-9a91-2fed2813a622	https://res.cloudinary.com/dqxsqiglg/image/upload/v1788942082/hrm/employee_document/2026-09-09/fc69cc9e-ac15-497e-9a91-2fed2813a622.jpg	image/jpeg	134147	d1b8be113686489db81a7afce381ab04f6e53681d70cfe251b013c05e5ceb1db	ATTACHED	2026-09-09 08:21:23.311	2026-09-09 08:21:24.245	\N
2ac784c8-1ec6-4237-a059-b1bac9c08724	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	TASK_ATTACHMENT	2F92D6D7-F674-459E-9A1B-35CB6F757B1C.jpg	hrm/task_attachment/2026-09-09/17401acd-171e-45c1-a79f-ac6e11969bd8	https://res.cloudinary.com/dqxsqiglg/image/upload/v1788946935/hrm/task_attachment/2026-09-09/17401acd-171e-45c1-a79f-ac6e11969bd8.jpg	image/jpeg	228344	539bc7c49bd2938bfdab36fd5287a962f892ecad04c52fb2f0531489fab0196e	TEMPORARY	2026-09-09 09:42:15.706	2026-09-09 09:42:15.706	\N
fef745f0-53d6-4c61-8ffb-f767d1eabc0b	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	FACE_REGISTRATION	36F93C3F-5D33-4C40-B719-029A4C957303.jpg	face_registration/2026-09-09/c57d4433-dcee-41b6-ad69-17835fe3d211.jpg	https://pub-7d69ec28111e4d0b89308dc0ae7571ed.r2.dev/face_registration/2026-09-09/c57d4433-dcee-41b6-ad69-17835fe3d211.jpg	image/jpeg	685355	e1291ea4812350e464b4ccd7959b8082184feb364202fb8b2c951444c8592a29	TEMPORARY	2026-09-09 09:48:25.137	2026-09-09 09:48:25.137	\N
7298451f-0535-4322-b11c-dd89d653c736	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	FACE_REGISTRATION	4EFD6133-1D27-4932-9BD0-77FBFD3436E5.jpg	face_registration/2026-09-09/152128ee-a091-48e4-9a41-8e394c705a36.jpg	https://pub-7d69ec28111e4d0b89308dc0ae7571ed.r2.dev/face_registration/2026-09-09/152128ee-a091-48e4-9a41-8e394c705a36.jpg	image/jpeg	620930	472962862c4fd92c682c65b205aed4a5a03269714f8bd6db44822b453a7e756e	TEMPORARY	2026-09-09 09:48:35.577	2026-09-09 09:48:35.577	\N
6fba22ef-dd4d-4b75-8d71-fce0ef487237	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	FACE_REGISTRATION	E895A97D-78E8-49C9-9153-0F936B47F241.jpg	face_registration/2026-09-09/72e232ed-baab-4ef2-b4f3-41a16e1f9d50.jpg	https://pub-7d69ec28111e4d0b89308dc0ae7571ed.r2.dev/face_registration/2026-09-09/72e232ed-baab-4ef2-b4f3-41a16e1f9d50.jpg	image/jpeg	629174	6ca6c18da74155d406fc16e2c51603e9f386350fffb27c6f83552677567b239f	TEMPORARY	2026-09-09 09:48:40.014	2026-09-09 09:48:40.014	\N
e72692ca-59dc-48e4-82e8-24cda0b014e8	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	TASK_ATTACHMENT	FA2A30E4-9931-4B03-9FD7-CC26C03FCF59.jpg	hrm/task_attachment/2026-09-09/5fd986f1-6df7-42cc-9a7f-813af5499f0a	https://res.cloudinary.com/dqxsqiglg/image/upload/v1788947416/hrm/task_attachment/2026-09-09/5fd986f1-6df7-42cc-9a7f-813af5499f0a.jpg	image/jpeg	328967	4cca9e56365721ababcb45ec228f9094ac2ab84115b8922b7a6a09085f6193f0	TEMPORARY	2026-09-09 09:50:17.293	2026-09-09 09:50:17.293	\N
db17b856-0e39-47a1-96c5-39a522ab989a	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	FACE_REGISTRATION	1A72FAA3-2B11-48FD-9E02-58D4F1E60AEE.jpg	face_registration/2026-09-09/b4217f46-ef18-414c-8353-a781cdc5665e.jpg	https://pub-7d69ec28111e4d0b89308dc0ae7571ed.r2.dev/face_registration/2026-09-09/b4217f46-ef18-414c-8353-a781cdc5665e.jpg	image/jpeg	599158	aebfc696d0059dd3506b41b50f83fd6bc767158dc098c477e2c94cf8ad9888ae	TEMPORARY	2026-09-09 10:08:28.08	2026-09-09 10:08:28.08	\N
6e6db2ea-721a-4e8e-aedd-2f99af0515a5	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	FACE_REGISTRATION	9F6A7AE6-FA81-418E-B88C-D54602799EAC.jpg	face_registration/2026-09-09/7cff8e58-5618-4106-8b8f-7e1db19eb136.jpg	https://pub-7d69ec28111e4d0b89308dc0ae7571ed.r2.dev/face_registration/2026-09-09/7cff8e58-5618-4106-8b8f-7e1db19eb136.jpg	image/jpeg	673884	0938b058bc5b8cfe1025b76ba73f7ab75e9ca974629e9ded8b35b322fe71be22	TEMPORARY	2026-09-09 10:08:31.976	2026-09-09 10:08:31.976	\N
d8767377-992b-4ccf-80c7-7aa4a6009e03	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	FACE_REGISTRATION	9C739637-AE3A-4D0B-A38F-C5C039ABCF70.jpg	face_registration/2026-09-09/77482c79-077d-448a-97c7-c62e460d98b0.jpg	https://pub-7d69ec28111e4d0b89308dc0ae7571ed.r2.dev/face_registration/2026-09-09/77482c79-077d-448a-97c7-c62e460d98b0.jpg	image/jpeg	602121	7b801dad6f5817c9065196dc601fba0a512e67b3b2bdc175f83052473f028f2b	TEMPORARY	2026-09-09 10:08:35.781	2026-09-09 10:08:35.781	\N
\.


--
-- Data for Name: user_approval_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_approval_requests (id, "userId", "requestedDepartmentId", status, "rejectionReason", "decidedByUserId", "decidedAt", "createdAt", "updatedAt") FROM stdin;
80e135c1-2d9f-48c0-9c96-63d66fbe8f22	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	APPROVED	\N	49098001-4375-47f0-b36d-c8758d8715ff	2026-08-19 11:29:35.632	2026-08-19 11:03:46.819	2026-08-19 11:29:35.633
bbaba29b-e648-4a8e-a5ce-c9cf8df592a0	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	APPROVED	\N	49098001-4375-47f0-b36d-c8758d8715ff	2026-08-20 02:08:52.51	2026-08-20 02:08:38.692	2026-08-20 02:08:52.511
282602c6-5574-480d-b9ba-c73bc4d47685	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	APPROVED	\N	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-20 02:34:39.146	2026-08-20 02:34:22.985	2026-08-20 02:34:39.147
1476d00f-201b-404b-b975-5a3083cc9759	e159d26b-5fba-452b-b5ce-44b52c18e8c3	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	PENDING	\N	\N	\N	2026-08-27 16:08:04.1	2026-08-27 16:08:04.1
45dd6098-cb4e-4fcf-9250-7dcab236566c	545ef296-1135-4885-8e61-89932645af6c	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	APPROVED	\N	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	2026-08-29 04:54:43.302	2026-08-29 03:07:07.71	2026-08-29 04:54:43.303
470a5b2e-e812-4dfb-af40-be5adad698b7	334b2294-9bba-4f31-8290-5a87484a62f0	6cde681e-47b5-47b0-a29c-ff13c66dba82	APPROVED	\N	49098001-4375-47f0-b36d-c8758d8715ff	2026-08-29 08:36:48.771	2026-08-29 08:35:29.222	2026-08-29 08:36:48.772
cc209493-51d6-45d8-8eb4-92e32bbe31d9	846641e3-667b-4e7f-b505-afdc1d66b54a	15cc071a-269e-44e1-ab43-f2d00144e2d6	APPROVED	\N	49098001-4375-47f0-b36d-c8758d8715ff	2026-08-29 08:38:21.497	2026-08-29 08:37:57.223	2026-08-29 08:38:21.498
6c1acc8c-b627-4b10-8cc0-bdeaf0adff2f	c2a06e5b-22fd-4862-bf12-8c36f5e07d9c	6cde681e-47b5-47b0-a29c-ff13c66dba82	APPROVED	\N	49098001-4375-47f0-b36d-c8758d8715ff	2026-08-29 08:39:28.529	2026-08-29 08:37:25.253	2026-08-29 08:39:28.529
7bf38d36-61e9-4d73-a7a1-83b6b8c93169	89ab6a07-e01e-40ed-b498-32d955c35a1c	6cde681e-47b5-47b0-a29c-ff13c66dba82	PENDING	\N	\N	\N	2026-09-05 07:39:53.54	2026-09-05 07:39:53.54
91555730-197b-4034-8023-876241f2ed5a	cbb85058-9ce2-4eca-ac7b-a6c491a331f0	6cde681e-47b5-47b0-a29c-ff13c66dba82	PENDING	\N	\N	\N	2026-09-05 08:47:55.524	2026-09-05 08:47:55.524
bbf4a8f4-2257-4077-a346-4e33b0b90e86	05ff1cc9-4cb6-4d87-a74b-0391a5539537	15c385cd-c45a-4d00-997b-a98c05615b41	APPROVED	\N	49098001-4375-47f0-b36d-c8758d8715ff	2026-09-06 09:15:45.289	2026-09-06 09:15:21.766	2026-09-06 09:15:45.289
38c94859-891c-4f1b-b0eb-21f9c5dad3e8	31bb72f7-e5e2-493e-827d-3320e1054461	d7029d8b-7f8a-4085-bc8e-63a4ffb7ba70	APPROVED	\N	49098001-4375-47f0-b36d-c8758d8715ff	2026-09-06 11:25:47.77	2026-09-06 11:25:24.669	2026-09-06 11:25:47.771
\.


--
-- Data for Name: user_notification_preferences; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_notification_preferences (id, "userId", "notificationType", "inAppEnabled", "pushEnabled", "emailEnabled", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_roles (id, "userId", "roleId", "scopeType", "scopeId", "createdAt", "updatedAt") FROM stdin;
6cb81d29-64c3-42d9-b8ab-3c86498e0492	49098001-4375-47f0-b36d-c8758d8715ff	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	GLOBAL	\N	2026-08-19 05:28:17.306	2026-08-19 05:28:17.306
a9b62dd7-2bfd-4a7e-b3cb-8c91ee5efd6c	9bb92634-e2ad-4d0c-9955-2ecb696ae52b	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	GLOBAL	\N	2026-08-19 11:03:46.346	2026-08-19 11:03:46.346
1d24deea-e94e-49a7-b5fa-6321294a89b0	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	GLOBAL	\N	2026-08-20 02:08:38.294	2026-08-20 02:08:38.294
b167010f-c927-49f4-9b78-5a48b88118ff	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	DEPARTMENT	63ab8aa8-c030-45c0-bec0-aa438fb5c2aa	2026-08-20 02:10:05.998	2026-08-20 02:10:05.998
4d394767-2bd4-484e-9233-0479c1771d25	1eb90142-2416-4bfb-a9a0-7dda4616bbb9	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	GLOBAL	\N	2026-08-20 02:34:22.586	2026-08-20 02:34:22.586
a44d5836-e9cc-4b20-bd8d-517b8be09683	e159d26b-5fba-452b-b5ce-44b52c18e8c3	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	GLOBAL	\N	2026-08-27 16:08:03.704	2026-08-27 16:08:03.704
068d644b-67cf-4754-8416-e3edb26c1ac1	545ef296-1135-4885-8e61-89932645af6c	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	GLOBAL	\N	2026-08-29 03:07:07.303	2026-08-29 03:07:07.303
927601b0-7800-4d3c-ac34-43abeeed4d4d	334b2294-9bba-4f31-8290-5a87484a62f0	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	GLOBAL	\N	2026-08-29 08:35:28.809	2026-08-29 08:35:28.809
45ca4e47-6a00-4b76-82d4-0d73856cf4b5	c2a06e5b-22fd-4862-bf12-8c36f5e07d9c	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	GLOBAL	\N	2026-08-29 08:37:24.814	2026-08-29 08:37:24.814
9cf9bf01-64d8-4454-b5f0-0ab1c52b0c1c	846641e3-667b-4e7f-b505-afdc1d66b54a	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	GLOBAL	\N	2026-08-29 08:37:57.009	2026-08-29 08:37:57.009
21d609c4-8903-454d-8150-aa48458e6881	89ab6a07-e01e-40ed-b498-32d955c35a1c	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	GLOBAL	\N	2026-09-05 07:39:53.12	2026-09-05 07:39:53.12
c1218e97-144f-42ef-9265-0ad6f44b3865	cbb85058-9ce2-4eca-ac7b-a6c491a331f0	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	GLOBAL	\N	2026-09-05 08:47:55.131	2026-09-05 08:47:55.131
eb3dd3f5-41dd-42c4-b67e-bd36d485fe9d	05ff1cc9-4cb6-4d87-a74b-0391a5539537	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	GLOBAL	\N	2026-09-06 09:15:21.364	2026-09-06 09:15:21.364
02afee7e-1bae-4558-9cb1-928a674d50b1	05ff1cc9-4cb6-4d87-a74b-0391a5539537	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	DEPARTMENT	15c385cd-c45a-4d00-997b-a98c05615b41	2026-09-06 09:16:04.273	2026-09-06 09:16:04.273
a8337736-2741-47e1-b8b9-9e1dca9762c1	05ff1cc9-4cb6-4d87-a74b-0391a5539537	dcfd5545-3953-4baf-b993-e43a46ca6d3d	GLOBAL	\N	2026-09-06 09:16:04.623	2026-09-06 09:16:04.623
651d5bf8-0d0e-4682-9704-8bf45e676c67	31bb72f7-e5e2-493e-827d-3320e1054461	6a5aa441-64e3-4e38-8fe7-83ac4d74ef9b	GLOBAL	\N	2026-09-06 11:25:24.271	2026-09-06 11:25:24.271
e4fc310a-0a6c-4300-b782-7777a0a73e47	31bb72f7-e5e2-493e-827d-3320e1054461	96d2ed5e-bc02-40a5-ba9f-74ac0ac074f1	DEPARTMENT	d7029d8b-7f8a-4085-bc8e-63a4ffb7ba70	2026-09-06 11:32:57.574	2026-09-06 11:32:57.574
f816ca2d-8ef8-4e97-9d11-0ef1ac2d2ce3	d5f49e78-0b72-4304-8413-b90446ced4a0	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	REGION	073f9933-8845-4c3f-a25f-8116105e3185	2026-09-09 05:12:27.835	2026-09-09 05:12:27.835
8540e55c-409c-4337-8883-f6e9edf245df	2a45f36d-2da9-492c-8bce-91a3440e71c1	66d5ded8-a26f-4ca1-bc92-2926b85ae4a8	REGION	9f6f0409-e5fe-48c5-b4d9-949fa9c12345	2026-09-09 05:12:30.016	2026-09-09 05:12:30.016
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, "userCode", phone, email, "passwordHash", "accountStatus", "approvalStatus", "isActive", "lastLoginAt", "createdAt", "updatedAt", "deletedAt", "deletionScheduledAt", "isTestAccount", "isRewardVaultEnabled") FROM stdin;
d5f49e78-0b72-4304-8413-b90446ced4a0	NV000002	0900000001	admin.mienbac@movielegend.vn	$2b$12$cE1sI5fYJEezgK05X2WnD.oL5ia0galyQfQpKHZR.o4nk81eUrCe2	ACTIVE	APPROVED	t	2026-09-09 07:21:32.576	2026-09-09 05:12:24.848	2026-09-09 07:21:32.577	\N	\N	f	f
bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	NV000017	0362021436	hocdinh21022001@gmail.com	$2b$12$0xEMU5dvm599F1b8TGYd2eS7TRG/9D2EHr17/oc5XRAeQAFcrEjxS	ACTIVE	APPROVED	t	2026-09-09 08:54:06.015	2026-08-20 02:08:38.294	2026-09-09 08:54:06.016	\N	\N	f	t
49098001-4375-47f0-b36d-c8758d8715ff	NV000001	0900000000	admin@movielegend.vn	$2b$12$Uxo9m66q58UqST/1496F0.omq8Waj3uesb.7pKINA08TL5aZQKUBG	ACTIVE	APPROVED	t	2026-09-09 09:42:55.376	2026-08-19 05:28:15.473	2026-09-09 09:42:55.379	\N	\N	f	f
1eb90142-2416-4bfb-a9a0-7dda4616bbb9	NV000018	0347941047	nam9521802@gmail.com	$2b$12$AbEsB0fOYOlJ4GLYUvw1rukEA/oHtag/TDFFBRXlICn.fBj7BSxqW	ACTIVE	APPROVED	t	2026-09-09 09:56:01.509	2026-08-20 02:34:22.586	2026-09-09 09:56:01.51	\N	\N	f	f
e159d26b-5fba-452b-b5ce-44b52c18e8c3	NV000019	0339143776	alexcao194@gmail.com	$2b$12$fTze66fXCIK9oHjr7k5jCOEYHFx8y0nGsXaUp78v6EUzun2eKTRuG	PENDING	PENDING	f	\N	2026-08-27 16:08:03.704	2026-09-06 08:06:25.951	\N	\N	f	f
89ab6a07-e01e-40ed-b498-32d955c35a1c	NV000024	0389548398	hokagephong9@gmail.com	$2b$12$EFtlMaZu.gJsvm6O7g00Hek2kDgCTekELrkFnR8XRnW3xi9HyJ7RK	PENDING	PENDING	f	\N	2026-09-05 07:39:53.12	2026-09-06 08:06:25.951	\N	\N	f	f
cbb85058-9ce2-4eca-ac7b-a6c491a331f0	NV000025	0961980290	Nga86851@gmail.com	$2b$12$L.qnSrCeJgtMgFMDFcFraeGPYY7de3PLeJCYZ4zl7/d/.Obc1dm4a	PENDING	PENDING	f	\N	2026-09-05 08:47:55.131	2026-09-06 08:06:25.951	\N	\N	f	f
9bb92634-e2ad-4d0c-9955-2ecb696ae52b	NV000015	0961416137	binhphung19112003@gmail.com	$2b$12$4kN9smUYXIRi6MTTbcAJiewxDepTxoEdlw0ZE27n6YLuLWSp5PMwK	ACTIVE	APPROVED	t	2026-09-04 00:59:52.441	2026-08-19 11:03:46.346	2026-09-06 08:06:25.951	\N	\N	f	f
334b2294-9bba-4f31-8290-5a87484a62f0	NV000021	0366682460	hoduc3008@gmail.com	$2b$12$Af9XNqrRGkRgEPMaVZeNiejAdKRGQSv6OlJEI3ZaaHBJcIYmJslWa	ACTIVE	APPROVED	t	2026-08-29 08:37:15.296	2026-08-29 08:35:28.809	2026-09-06 08:06:25.951	\N	\N	f	f
846641e3-667b-4e7f-b505-afdc1d66b54a	NV000023	0359990001	levanha08112k@gmail.com	$2b$12$zHnMVR57K.KcPiyt3SqnUemEzcW4m6O0l9fEKEHzYgDVylnh4lFgS	ACTIVE	APPROVED	t	2026-08-29 08:38:57.911	2026-08-29 08:37:57.009	2026-09-06 08:06:25.951	\N	\N	f	f
2a45f36d-2da9-492c-8bce-91a3440e71c1	NV000003	0900000002	admin.miennam@movielegend.vn	$2b$12$cE1sI5fYJEezgK05X2WnD.oL5ia0galyQfQpKHZR.o4nk81eUrCe2	ACTIVE	APPROVED	t	2026-09-09 06:55:08.078	2026-09-09 05:12:28.39	2026-09-09 06:55:08.079	\N	\N	f	f
c2a06e5b-22fd-4862-bf12-8c36f5e07d9c	NV000022	0326642921	thuancoc280701@gmail.com	$2b$12$qnw3kCSxkwTvLxNvod60zOfk81tbWv4DsRMsmzToCUQbVXIz6lb1K	ACTIVE	APPROVED	t	2026-08-29 08:39:53.542	2026-08-29 08:37:24.814	2026-09-06 08:06:25.951	\N	\N	f	f
545ef296-1135-4885-8e61-89932645af6c	NV000020	0362102201	cuong2054@gmail.com	$2b$12$BkGVmm.zOPEZ3Hpkku0OFO3Bhe1S1yxDs7j6MnVyX.JBSBZd0DHbK	ACTIVE	APPROVED	t	2026-08-29 04:55:33.902	2026-08-29 03:07:07.303	2026-09-06 08:06:25.951	\N	\N	f	f
31bb72f7-e5e2-493e-827d-3320e1054461	NV000027	0359466666	thai@gmail.com	$2b$12$LOxucNg6n/Ae8f0wG6XY2u/sYBjbafaPVNb9YKY0MpbqB.mKFtFry	ACTIVE	APPROVED	t	2026-09-08 09:07:45.296	2026-09-06 11:25:24.271	2026-09-08 09:07:45.297	\N	\N	f	f
05ff1cc9-4cb6-4d87-a74b-0391a5539537	NV000026	0584286688	tien@gmail.com	$2b$12$iIAV9hsBNS8r0dOxHgYD4exML37ISvC1DqtNFKm2ki2U7.Qth/DEu	ACTIVE	APPROVED	t	2026-09-08 11:17:21.661	2026-09-06 09:15:21.364	2026-09-08 11:17:21.665	\N	\N	f	t
\.


--
-- Data for Name: vault_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vault_transactions (id, "vaultId", "userId", type, points, "cashAmount", "quarterTarget", note, "createdAt") FROM stdin;
ad195ea1-e766-4f53-9436-b15e2dff890e	b29752ac-08d4-4a13-b3de-8f067d7f5bf1	05ff1cc9-4cb6-4d87-a74b-0391a5539537	GRANT_PROJECT_VESTING	10000	10000000.00	Thưởng Tết 2026 (4 đợt)	Trao gói thưởng: Thưởng Tết 2026	2026-09-08 10:01:07.135
cbbc139d-758e-4879-bcfc-affe2f864b12	8fe89cc2-f550-4467-ad4f-81e211c79c77	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	GRANT_PROJECT_VESTING	10000	10000000.00	Thưởng Cuối Năm 2026 (4 đợt)	Trao gói thưởng: Thưởng Cuối Năm 2026	2026-09-08 12:10:25.689
b54921de-c763-4e80-8b6b-9f646d50d38f	8fe89cc2-f550-4467-ad4f-81e211c79c77	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	GRANT_PROJECT_VESTING	10000	10000000.00	Thưởng Cuối Năm 2026 (12 đợt)	Trao gói thưởng: Thưởng Cuối Năm 2026	2026-09-09 04:20:17.855
c2fa3c18-ea34-4693-8611-0b6a1a326120	8fe89cc2-f550-4467-ad4f-81e211c79c77	bea82bc5-c3e5-45d8-bd50-82be7ade4b4c	WITHDRAW_REGULAR	-833	833000.00	Thưởng Cuối Năm 2026 - Đợt 1 (Sau 1 tháng)	Rút hạn mức Thưởng Cuối Năm 2026 (Đợt 1 (Sau 1 tháng))	2026-09-09 04:21:16.181
\.


--
-- Data for Name: vesting_milestones; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vesting_milestones (id, "vaultId", quarter, "unlockDate", "pointsToUnlock", "cashAmount", "isUnlocked", "isWithdrawn", "withdrawnAt") FROM stdin;
\.


--
-- Data for Name: violations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.violations (id, "userId", "violationType", "relatedEntityType", "relatedEntityId", title, description, "violationDate", status, "createdById", "confirmedById", "confirmedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: warehouse_stocks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.warehouse_stocks (id, "warehouseId", "materialId", "quantityOnHand", "quantityReserved", version, "updatedAt") FROM stdin;
\.


--
-- Data for Name: warehouses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.warehouses (id, "companyId", "branchId", "departmentId", code, name, description, address, "managerUserId", "isActive", "createdAt", "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: wifi_configs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.wifi_configs (id, "departmentId", ssid, bssid, "isActive", "createdAt", "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Name: asset_code_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.asset_code_seq', 1, false);


--
-- Name: contract_code_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.contract_code_seq', 1, false);


--
-- Name: cross_department_request_code_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cross_department_request_code_seq', 1, false);


--
-- Name: inventory_check_code_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inventory_check_code_seq', 1, false);


--
-- Name: material_code_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.material_code_seq', 1, false);


--
-- Name: material_issue_code_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.material_issue_code_seq', 1, false);


--
-- Name: material_return_code_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.material_return_code_seq', 1, false);


--
-- Name: payroll_period_code_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payroll_period_code_seq', 1, false);


--
-- Name: stock_receipt_code_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.stock_receipt_code_seq', 1, false);


--
-- Name: stock_transaction_code_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.stock_transaction_code_seq', 1, false);


--
-- Name: stock_transfer_code_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.stock_transfer_code_seq', 1, false);


--
-- Name: task_code_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.task_code_seq', 13, true);


--
-- Name: user_code_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_code_seq', 27, true);


--
-- Name: warehouse_code_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.warehouse_code_seq', 1, false);


--
-- Name: OtpToken OtpToken_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OtpToken"
    ADD CONSTRAINT "OtpToken_pkey" PRIMARY KEY (id);


--
-- Name: _AttendanceLocationDepartments _AttendanceLocationDepartments_AB_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."_AttendanceLocationDepartments"
    ADD CONSTRAINT "_AttendanceLocationDepartments_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: approval_histories approval_histories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_histories
    ADD CONSTRAINT approval_histories_pkey PRIMARY KEY (id);


--
-- Name: asset_assignment_histories asset_assignment_histories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_assignment_histories
    ADD CONSTRAINT asset_assignment_histories_pkey PRIMARY KEY (id);


--
-- Name: asset_assignments asset_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_assignments
    ADD CONSTRAINT asset_assignments_pkey PRIMARY KEY (id);


--
-- Name: asset_incident_reports asset_incident_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_incident_reports
    ADD CONSTRAINT asset_incident_reports_pkey PRIMARY KEY (id);


--
-- Name: asset_maintenance_records asset_maintenance_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_maintenance_records
    ADD CONSTRAINT asset_maintenance_records_pkey PRIMARY KEY (id);


--
-- Name: assets assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_pkey PRIMARY KEY (id);


--
-- Name: attendance_adjustments attendance_adjustments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_adjustments
    ADD CONSTRAINT attendance_adjustments_pkey PRIMARY KEY (id);


--
-- Name: attendance_locations attendance_locations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_locations
    ADD CONSTRAINT attendance_locations_pkey PRIMARY KEY (id);


--
-- Name: attendance_records attendance_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT attendance_records_pkey PRIMARY KEY (id);


--
-- Name: attendance_verifications attendance_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_verifications
    ADD CONSTRAINT attendance_verifications_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: branches branches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_pkey PRIMARY KEY (id);


--
-- Name: chat_group_members chat_group_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_group_members
    ADD CONSTRAINT chat_group_members_pkey PRIMARY KEY (id);


--
-- Name: chat_groups chat_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_groups
    ADD CONSTRAINT chat_groups_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: company_holidays company_holidays_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_holidays
    ADD CONSTRAINT company_holidays_pkey PRIMARY KEY (id);


--
-- Name: contract_signatures contract_signatures_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_signatures
    ADD CONSTRAINT contract_signatures_pkey PRIMARY KEY (id);


--
-- Name: contract_template_versions contract_template_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_template_versions
    ADD CONSTRAINT contract_template_versions_pkey PRIMARY KEY (id);


--
-- Name: contract_templates contract_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_templates
    ADD CONSTRAINT contract_templates_pkey PRIMARY KEY (id);


--
-- Name: cross_department_requests cross_department_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cross_department_requests
    ADD CONSTRAINT cross_department_requests_pkey PRIMARY KEY (id);


--
-- Name: department_competition_configs department_competition_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.department_competition_configs
    ADD CONSTRAINT department_competition_configs_pkey PRIMARY KEY (id);


--
-- Name: department_documents department_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.department_documents
    ADD CONSTRAINT department_documents_pkey PRIMARY KEY (id);


--
-- Name: department_level_configs department_level_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.department_level_configs
    ADD CONSTRAINT department_level_configs_pkey PRIMARY KEY (id);


--
-- Name: department_members department_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.department_members
    ADD CONSTRAINT department_members_pkey PRIMARY KEY (id);


--
-- Name: department_overtime_configs department_overtime_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.department_overtime_configs
    ADD CONSTRAINT department_overtime_configs_pkey PRIMARY KEY (id);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: device_tokens device_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_tokens
    ADD CONSTRAINT device_tokens_pkey PRIMARY KEY (id);


--
-- Name: disciplinary_actions disciplinary_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disciplinary_actions
    ADD CONSTRAINT disciplinary_actions_pkey PRIMARY KEY (id);


--
-- Name: document_types document_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_types
    ADD CONSTRAINT document_types_pkey PRIMARY KEY (id);


--
-- Name: employee_bank_accounts employee_bank_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_bank_accounts
    ADD CONSTRAINT employee_bank_accounts_pkey PRIMARY KEY (id);


--
-- Name: employee_bonuses employee_bonuses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_bonuses
    ADD CONSTRAINT employee_bonuses_pkey PRIMARY KEY (id);


--
-- Name: employee_contracts employee_contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_contracts
    ADD CONSTRAINT employee_contracts_pkey PRIMARY KEY (id);


--
-- Name: employee_deductions employee_deductions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_deductions
    ADD CONSTRAINT employee_deductions_pkey PRIMARY KEY (id);


--
-- Name: employee_documents employee_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_documents
    ADD CONSTRAINT employee_documents_pkey PRIMARY KEY (id);


--
-- Name: employee_kpi_assignments employee_kpi_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_kpi_assignments
    ADD CONSTRAINT employee_kpi_assignments_pkey PRIMARY KEY (id);


--
-- Name: employee_kpi_results employee_kpi_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_kpi_results
    ADD CONSTRAINT employee_kpi_results_pkey PRIMARY KEY (id);


--
-- Name: employee_levels employee_levels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_levels
    ADD CONSTRAINT employee_levels_pkey PRIMARY KEY (id);


--
-- Name: employee_profiles employee_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_profiles
    ADD CONSTRAINT employee_profiles_pkey PRIMARY KEY (id);


--
-- Name: employee_requests employee_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_requests
    ADD CONSTRAINT employee_requests_pkey PRIMARY KEY (id);


--
-- Name: employee_salary_components employee_salary_components_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_salary_components
    ADD CONSTRAINT employee_salary_components_pkey PRIMARY KEY (id);


--
-- Name: face_profiles face_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.face_profiles
    ADD CONSTRAINT face_profiles_pkey PRIMARY KEY (id);


--
-- Name: face_registration_images face_registration_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.face_registration_images
    ADD CONSTRAINT face_registration_images_pkey PRIMARY KEY (id);


--
-- Name: feedbacks feedbacks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedbacks
    ADD CONSTRAINT feedbacks_pkey PRIMARY KEY (id);


--
-- Name: grant_milestones grant_milestones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grant_milestones
    ADD CONSTRAINT grant_milestones_pkey PRIMARY KEY (id);


--
-- Name: inventory_check_items inventory_check_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_check_items
    ADD CONSTRAINT inventory_check_items_pkey PRIMARY KEY (id);


--
-- Name: inventory_checks inventory_checks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_checks
    ADD CONSTRAINT inventory_checks_pkey PRIMARY KEY (id);


--
-- Name: job_execution_logs job_execution_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_execution_logs
    ADD CONSTRAINT job_execution_logs_pkey PRIMARY KEY (id);


--
-- Name: kpi_criteria kpi_criteria_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_criteria
    ADD CONSTRAINT kpi_criteria_pkey PRIMARY KEY (id);


--
-- Name: kpi_templates kpi_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_templates
    ADD CONSTRAINT kpi_templates_pkey PRIMARY KEY (id);


--
-- Name: leave_balances leave_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_balances
    ADD CONSTRAINT leave_balances_pkey PRIMARY KEY (id);


--
-- Name: leave_requests leave_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_pkey PRIMARY KEY (id);


--
-- Name: leave_types leave_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_types
    ADD CONSTRAINT leave_types_pkey PRIMARY KEY (id);


--
-- Name: level_promotion_requests level_promotion_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.level_promotion_requests
    ADD CONSTRAINT level_promotion_requests_pkey PRIMARY KEY (id);


--
-- Name: location_trackings location_trackings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location_trackings
    ADD CONSTRAINT location_trackings_pkey PRIMARY KEY (id);


--
-- Name: material_categories material_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.material_categories
    ADD CONSTRAINT material_categories_pkey PRIMARY KEY (id);


--
-- Name: material_issue_items material_issue_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.material_issue_items
    ADD CONSTRAINT material_issue_items_pkey PRIMARY KEY (id);


--
-- Name: material_issues material_issues_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.material_issues
    ADD CONSTRAINT material_issues_pkey PRIMARY KEY (id);


--
-- Name: material_return_items material_return_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.material_return_items
    ADD CONSTRAINT material_return_items_pkey PRIMARY KEY (id);


--
-- Name: material_returns material_returns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.material_returns
    ADD CONSTRAINT material_returns_pkey PRIMARY KEY (id);


--
-- Name: materials materials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materials
    ADD CONSTRAINT materials_pkey PRIMARY KEY (id);


--
-- Name: monthly_competition_reviews monthly_competition_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monthly_competition_reviews
    ADD CONSTRAINT monthly_competition_reviews_pkey PRIMARY KEY (id);


--
-- Name: newsfeed_posts newsfeed_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsfeed_posts
    ADD CONSTRAINT newsfeed_posts_pkey PRIMARY KEY (id);


--
-- Name: notification_deliveries notification_deliveries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_deliveries
    ADD CONSTRAINT notification_deliveries_pkey PRIMARY KEY (id);


--
-- Name: notification_targets notification_targets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_targets
    ADD CONSTRAINT notification_targets_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: overtime_rate_rules overtime_rate_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.overtime_rate_rules
    ADD CONSTRAINT overtime_rate_rules_pkey PRIMARY KEY (id);


--
-- Name: overtime_requests overtime_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.overtime_requests
    ADD CONSTRAINT overtime_requests_pkey PRIMARY KEY (id);


--
-- Name: payroll_calculation_snapshots payroll_calculation_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_calculation_snapshots
    ADD CONSTRAINT payroll_calculation_snapshots_pkey PRIMARY KEY (id);


--
-- Name: payroll_items payroll_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_items
    ADD CONSTRAINT payroll_items_pkey PRIMARY KEY (id);


--
-- Name: payroll_periods payroll_periods_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_periods
    ADD CONSTRAINT payroll_periods_pkey PRIMARY KEY (id);


--
-- Name: payrolls payrolls_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payrolls
    ADD CONSTRAINT payrolls_pkey PRIMARY KEY (id);


--
-- Name: performance_review_cycles performance_review_cycles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.performance_review_cycles
    ADD CONSTRAINT performance_review_cycles_pkey PRIMARY KEY (id);


--
-- Name: performance_reviews performance_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.performance_reviews
    ADD CONSTRAINT performance_reviews_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: positions positions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_pkey PRIMARY KEY (id);


--
-- Name: post_comments post_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT post_comments_pkey PRIMARY KEY (id);


--
-- Name: post_likes post_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_pkey PRIMARY KEY (id);


--
-- Name: project_grant_packages project_grant_packages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_grant_packages
    ADD CONSTRAINT project_grant_packages_pkey PRIMARY KEY (id);


--
-- Name: refresh_sessions refresh_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_sessions
    ADD CONSTRAINT refresh_sessions_pkey PRIMARY KEY (id);


--
-- Name: regions regions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regions
    ADD CONSTRAINT regions_pkey PRIMARY KEY (id);


--
-- Name: report_snapshots report_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_snapshots
    ADD CONSTRAINT report_snapshots_pkey PRIMARY KEY (id);


--
-- Name: reviewer_assignments reviewer_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviewer_assignments
    ADD CONSTRAINT reviewer_assignments_pkey PRIMARY KEY (id);


--
-- Name: reward_withdrawal_requests reward_withdrawal_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reward_withdrawal_requests
    ADD CONSTRAINT reward_withdrawal_requests_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: salary_components salary_components_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salary_components
    ADD CONSTRAINT salary_components_pkey PRIMARY KEY (id);


--
-- Name: salary_profiles salary_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salary_profiles
    ADD CONSTRAINT salary_profiles_pkey PRIMARY KEY (id);


--
-- Name: shift_assignments shift_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_assignments
    ADD CONSTRAINT shift_assignments_pkey PRIMARY KEY (id);


--
-- Name: shift_registrations shift_registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_registrations
    ADD CONSTRAINT shift_registrations_pkey PRIMARY KEY (id);


--
-- Name: shift_swaps shift_swaps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_swaps
    ADD CONSTRAINT shift_swaps_pkey PRIMARY KEY (id);


--
-- Name: shifts shifts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT shifts_pkey PRIMARY KEY (id);


--
-- Name: stock_receipt_items stock_receipt_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_receipt_items
    ADD CONSTRAINT stock_receipt_items_pkey PRIMARY KEY (id);


--
-- Name: stock_receipts stock_receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_receipts
    ADD CONSTRAINT stock_receipts_pkey PRIMARY KEY (id);


--
-- Name: stock_transactions stock_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_transactions
    ADD CONSTRAINT stock_transactions_pkey PRIMARY KEY (id);


--
-- Name: stock_transfer_items stock_transfer_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_transfer_items
    ADD CONSTRAINT stock_transfer_items_pkey PRIMARY KEY (id);


--
-- Name: stock_transfers stock_transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_transfers
    ADD CONSTRAINT stock_transfers_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: talent_retention_vaults talent_retention_vaults_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.talent_retention_vaults
    ADD CONSTRAINT talent_retention_vaults_pkey PRIMARY KEY (id);


--
-- Name: task_assignments task_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_assignments
    ADD CONSTRAINT task_assignments_pkey PRIMARY KEY (id);


--
-- Name: task_attachments task_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_attachments
    ADD CONSTRAINT task_attachments_pkey PRIMARY KEY (id);


--
-- Name: task_comments task_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_comments
    ADD CONSTRAINT task_comments_pkey PRIMARY KEY (id);


--
-- Name: task_extension_requests task_extension_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_extension_requests
    ADD CONSTRAINT task_extension_requests_pkey PRIMARY KEY (id);


--
-- Name: task_group_members task_group_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_group_members
    ADD CONSTRAINT task_group_members_pkey PRIMARY KEY (id);


--
-- Name: task_groups task_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_groups
    ADD CONSTRAINT task_groups_pkey PRIMARY KEY (id);


--
-- Name: task_status_histories task_status_histories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_status_histories
    ADD CONSTRAINT task_status_histories_pkey PRIMARY KEY (id);


--
-- Name: task_targets task_targets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_targets
    ADD CONSTRAINT task_targets_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: tiktok_live_sessions tiktok_live_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tiktok_live_sessions
    ADD CONSTRAINT tiktok_live_sessions_pkey PRIMARY KEY (id);


--
-- Name: uploaded_files uploaded_files_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.uploaded_files
    ADD CONSTRAINT uploaded_files_pkey PRIMARY KEY (id);


--
-- Name: user_approval_requests user_approval_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_approval_requests
    ADD CONSTRAINT user_approval_requests_pkey PRIMARY KEY (id);


--
-- Name: user_notification_preferences user_notification_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_notification_preferences
    ADD CONSTRAINT user_notification_preferences_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: vault_transactions vault_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vault_transactions
    ADD CONSTRAINT vault_transactions_pkey PRIMARY KEY (id);


--
-- Name: vesting_milestones vesting_milestones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vesting_milestones
    ADD CONSTRAINT vesting_milestones_pkey PRIMARY KEY (id);


--
-- Name: violations violations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.violations
    ADD CONSTRAINT violations_pkey PRIMARY KEY (id);


--
-- Name: warehouse_stocks warehouse_stocks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warehouse_stocks
    ADD CONSTRAINT warehouse_stocks_pkey PRIMARY KEY (id);


--
-- Name: warehouses warehouses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT warehouses_pkey PRIMARY KEY (id);


--
-- Name: wifi_configs wifi_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wifi_configs
    ADD CONSTRAINT wifi_configs_pkey PRIMARY KEY (id);


--
-- Name: OtpToken_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OtpToken_email_idx" ON public."OtpToken" USING btree (email);


--
-- Name: OtpToken_phone_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OtpToken_phone_idx" ON public."OtpToken" USING btree (phone);


--
-- Name: OtpToken_resetToken_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "OtpToken_resetToken_key" ON public."OtpToken" USING btree ("resetToken");


--
-- Name: OtpToken_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OtpToken_userId_idx" ON public."OtpToken" USING btree ("userId");


--
-- Name: _AttendanceLocationDepartments_B_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "_AttendanceLocationDepartments_B_index" ON public."_AttendanceLocationDepartments" USING btree ("B");


--
-- Name: asset_assignment_histories_assetAssignmentId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "asset_assignment_histories_assetAssignmentId_idx" ON public.asset_assignment_histories USING btree ("assetAssignmentId");


--
-- Name: asset_assignments_assetId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "asset_assignments_assetId_status_idx" ON public.asset_assignments USING btree ("assetId", status);


--
-- Name: asset_assignments_assignedToDepartmentId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "asset_assignments_assignedToDepartmentId_status_idx" ON public.asset_assignments USING btree ("assignedToDepartmentId", status);


--
-- Name: asset_assignments_assignedToUserId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "asset_assignments_assignedToUserId_status_idx" ON public.asset_assignments USING btree ("assignedToUserId", status);


--
-- Name: asset_incident_reports_assetId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "asset_incident_reports_assetId_status_idx" ON public.asset_incident_reports USING btree ("assetId", status);


--
-- Name: asset_incident_reports_status_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "asset_incident_reports_status_createdAt_idx" ON public.asset_incident_reports USING btree (status, "createdAt");


--
-- Name: asset_maintenance_records_assetId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "asset_maintenance_records_assetId_status_idx" ON public.asset_maintenance_records USING btree ("assetId", status);


--
-- Name: assets_assetCode_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "assets_assetCode_key" ON public.assets USING btree ("assetCode");


--
-- Name: assets_assetStatus_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "assets_assetStatus_idx" ON public.assets USING btree ("assetStatus");


--
-- Name: attendance_adjustments_attendanceRecordId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "attendance_adjustments_attendanceRecordId_idx" ON public.attendance_adjustments USING btree ("attendanceRecordId");


--
-- Name: attendance_adjustments_departmentId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "attendance_adjustments_departmentId_status_idx" ON public.attendance_adjustments USING btree ("departmentId", status);


--
-- Name: attendance_adjustments_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "attendance_adjustments_userId_idx" ON public.attendance_adjustments USING btree ("userId");


--
-- Name: attendance_records_checkOutPhotoFileId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "attendance_records_checkOutPhotoFileId_idx" ON public.attendance_records USING btree ("checkOutPhotoFileId");


--
-- Name: attendance_records_departmentId_workDate_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "attendance_records_departmentId_workDate_idx" ON public.attendance_records USING btree ("departmentId", "workDate");


--
-- Name: attendance_records_photoFileId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "attendance_records_photoFileId_idx" ON public.attendance_records USING btree ("photoFileId");


--
-- Name: attendance_records_userId_shiftAssignmentId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "attendance_records_userId_shiftAssignmentId_idx" ON public.attendance_records USING btree ("userId", "shiftAssignmentId");


--
-- Name: attendance_records_userId_workDate_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "attendance_records_userId_workDate_idx" ON public.attendance_records USING btree ("userId", "workDate");


--
-- Name: audit_logs_actorUserId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "audit_logs_actorUserId_idx" ON public.audit_logs USING btree ("actorUserId");


--
-- Name: audit_logs_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "audit_logs_createdAt_idx" ON public.audit_logs USING btree ("createdAt");


--
-- Name: audit_logs_entityType_entityId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "audit_logs_entityType_entityId_idx" ON public.audit_logs USING btree ("entityType", "entityId");


--
-- Name: branches_companyId_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "branches_companyId_code_key" ON public.branches USING btree ("companyId", code);


--
-- Name: branches_regionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "branches_regionId_idx" ON public.branches USING btree ("regionId");


--
-- Name: chat_group_members_groupId_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "chat_group_members_groupId_userId_key" ON public.chat_group_members USING btree ("groupId", "userId");


--
-- Name: chat_group_members_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "chat_group_members_userId_idx" ON public.chat_group_members USING btree ("userId");


--
-- Name: chat_groups_departmentId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "chat_groups_departmentId_key" ON public.chat_groups USING btree ("departmentId");


--
-- Name: chat_groups_taskId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "chat_groups_taskId_key" ON public.chat_groups USING btree ("taskId");


--
-- Name: chat_messages_groupId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "chat_messages_groupId_createdAt_idx" ON public.chat_messages USING btree ("groupId", "createdAt");


--
-- Name: chat_messages_senderId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "chat_messages_senderId_idx" ON public.chat_messages USING btree ("senderId");


--
-- Name: companies_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX companies_code_key ON public.companies USING btree (code);


--
-- Name: company_holidays_companyId_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "company_holidays_companyId_date_idx" ON public.company_holidays USING btree ("companyId", date);


--
-- Name: contract_signatures_contractId_signerRole_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "contract_signatures_contractId_signerRole_idx" ON public.contract_signatures USING btree ("contractId", "signerRole");


--
-- Name: contract_signatures_contractId_signerUserId_signerRole_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "contract_signatures_contractId_signerUserId_signerRole_key" ON public.contract_signatures USING btree ("contractId", "signerUserId", "signerRole");


--
-- Name: contract_signatures_signerUserId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "contract_signatures_signerUserId_idx" ON public.contract_signatures USING btree ("signerUserId");


--
-- Name: contract_template_versions_contractTemplateId_versionNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "contract_template_versions_contractTemplateId_versionNumber_key" ON public.contract_template_versions USING btree ("contractTemplateId", "versionNumber");


--
-- Name: contract_templates_companyId_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "contract_templates_companyId_code_key" ON public.contract_templates USING btree ("companyId", code);


--
-- Name: contract_templates_companyId_contractType_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "contract_templates_companyId_contractType_isActive_idx" ON public.contract_templates USING btree ("companyId", "contractType", "isActive");


--
-- Name: cross_department_requests_assignedToUserId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "cross_department_requests_assignedToUserId_status_idx" ON public.cross_department_requests USING btree ("assignedToUserId", status);


--
-- Name: cross_department_requests_requestCode_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "cross_department_requests_requestCode_key" ON public.cross_department_requests USING btree ("requestCode");


--
-- Name: cross_department_requests_sourceDepartmentId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "cross_department_requests_sourceDepartmentId_status_idx" ON public.cross_department_requests USING btree ("sourceDepartmentId", status);


--
-- Name: cross_department_requests_targetDepartmentId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "cross_department_requests_targetDepartmentId_status_idx" ON public.cross_department_requests USING btree ("targetDepartmentId", status);


--
-- Name: department_competition_configs_departmentId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "department_competition_configs_departmentId_key" ON public.department_competition_configs USING btree ("departmentId");


--
-- Name: department_documents_companyId_departmentId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "department_documents_companyId_departmentId_idx" ON public.department_documents USING btree ("companyId", "departmentId");


--
-- Name: department_documents_departmentId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "department_documents_departmentId_idx" ON public.department_documents USING btree ("departmentId");


--
-- Name: department_level_configs_departmentId_levelNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "department_level_configs_departmentId_levelNumber_key" ON public.department_level_configs USING btree ("departmentId", "levelNumber");


--
-- Name: department_members_departmentId_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "department_members_departmentId_userId_key" ON public.department_members USING btree ("departmentId", "userId");


--
-- Name: department_members_positionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "department_members_positionId_idx" ON public.department_members USING btree ("positionId");


--
-- Name: department_members_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "department_members_userId_idx" ON public.department_members USING btree ("userId");


--
-- Name: department_overtime_configs_departmentId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "department_overtime_configs_departmentId_key" ON public.department_overtime_configs USING btree ("departmentId");


--
-- Name: departments_branchId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "departments_branchId_idx" ON public.departments USING btree ("branchId");


--
-- Name: departments_companyId_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "departments_companyId_code_key" ON public.departments USING btree ("companyId", code);


--
-- Name: departments_leaderUserId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "departments_leaderUserId_idx" ON public.departments USING btree ("leaderUserId");


--
-- Name: departments_parentId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "departments_parentId_idx" ON public.departments USING btree ("parentId");


--
-- Name: device_tokens_tokenHash_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "device_tokens_tokenHash_key" ON public.device_tokens USING btree ("tokenHash");


--
-- Name: device_tokens_userId_revokedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "device_tokens_userId_revokedAt_idx" ON public.device_tokens USING btree ("userId", "revokedAt");


--
-- Name: disciplinary_actions_violationId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "disciplinary_actions_violationId_status_idx" ON public.disciplinary_actions USING btree ("violationId", status);


--
-- Name: document_types_companyId_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "document_types_companyId_code_key" ON public.document_types USING btree ("companyId", code);


--
-- Name: document_types_companyId_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "document_types_companyId_isActive_idx" ON public.document_types USING btree ("companyId", "isActive");


--
-- Name: employee_bonuses_userId_status_effectiveDate_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "employee_bonuses_userId_status_effectiveDate_idx" ON public.employee_bonuses USING btree ("userId", status, "effectiveDate");


--
-- Name: employee_contracts_contractCode_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "employee_contracts_contractCode_key" ON public.employee_contracts USING btree ("contractCode");


--
-- Name: employee_contracts_contractTemplateId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "employee_contracts_contractTemplateId_idx" ON public.employee_contracts USING btree ("contractTemplateId");


--
-- Name: employee_contracts_status_endDate_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "employee_contracts_status_endDate_idx" ON public.employee_contracts USING btree (status, "endDate");


--
-- Name: employee_contracts_userId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "employee_contracts_userId_status_idx" ON public.employee_contracts USING btree ("userId", status);


--
-- Name: employee_deductions_userId_status_effectiveDate_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "employee_deductions_userId_status_effectiveDate_idx" ON public.employee_deductions USING btree ("userId", status, "effectiveDate");


--
-- Name: employee_documents_documentTypeId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "employee_documents_documentTypeId_idx" ON public.employee_documents USING btree ("documentTypeId");


--
-- Name: employee_documents_employeeId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "employee_documents_employeeId_idx" ON public.employee_documents USING btree ("employeeId");


--
-- Name: employee_documents_expiryDate_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "employee_documents_expiryDate_status_idx" ON public.employee_documents USING btree ("expiryDate", status);


--
-- Name: employee_documents_userId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "employee_documents_userId_status_idx" ON public.employee_documents USING btree ("userId", status);


--
-- Name: employee_documents_verifiedById_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "employee_documents_verifiedById_idx" ON public.employee_documents USING btree ("verifiedById");


--
-- Name: employee_kpi_assignments_status_periodEnd_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "employee_kpi_assignments_status_periodEnd_idx" ON public.employee_kpi_assignments USING btree (status, "periodEnd");


--
-- Name: employee_kpi_assignments_userId_kpiTemplateId_periodStart_p_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "employee_kpi_assignments_userId_kpiTemplateId_periodStart_p_key" ON public.employee_kpi_assignments USING btree ("userId", "kpiTemplateId", "periodStart", "periodEnd");


--
-- Name: employee_kpi_assignments_userId_status_periodStart_periodEn_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "employee_kpi_assignments_userId_status_periodStart_periodEn_idx" ON public.employee_kpi_assignments USING btree ("userId", status, "periodStart", "periodEnd");


--
-- Name: employee_kpi_results_criteriaId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "employee_kpi_results_criteriaId_idx" ON public.employee_kpi_results USING btree ("criteriaId");


--
-- Name: employee_kpi_results_employeeKpiAssignmentId_criteriaId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "employee_kpi_results_employeeKpiAssignmentId_criteriaId_key" ON public.employee_kpi_results USING btree ("employeeKpiAssignmentId", "criteriaId");


--
-- Name: employee_levels_levelNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "employee_levels_levelNumber_key" ON public.employee_levels USING btree ("levelNumber");


--
-- Name: employee_profiles_idCardNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "employee_profiles_idCardNumber_key" ON public.employee_profiles USING btree ("idCardNumber");


--
-- Name: employee_profiles_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "employee_profiles_userId_key" ON public.employee_profiles USING btree ("userId");


--
-- Name: employee_requests_departmentId_status_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "employee_requests_departmentId_status_type_idx" ON public.employee_requests USING btree ("departmentId", status, type);


--
-- Name: employee_salary_components_userId_componentId_effectiveFrom_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "employee_salary_components_userId_componentId_effectiveFrom_key" ON public.employee_salary_components USING btree ("userId", "componentId", "effectiveFrom");


--
-- Name: employee_salary_components_userId_effectiveFrom_effectiveTo_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "employee_salary_components_userId_effectiveFrom_effectiveTo_idx" ON public.employee_salary_components USING btree ("userId", "effectiveFrom", "effectiveTo");


--
-- Name: face_profiles_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "face_profiles_userId_key" ON public.face_profiles USING btree ("userId");


--
-- Name: face_registration_images_faceProfileId_pose_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "face_registration_images_faceProfileId_pose_key" ON public.face_registration_images USING btree ("faceProfileId", pose);


--
-- Name: feedbacks_isAnonymous_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "feedbacks_isAnonymous_idx" ON public.feedbacks USING btree ("isAnonymous");


--
-- Name: feedbacks_senderUserId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "feedbacks_senderUserId_createdAt_idx" ON public.feedbacks USING btree ("senderUserId", "createdAt");


--
-- Name: feedbacks_status_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "feedbacks_status_createdAt_idx" ON public.feedbacks USING btree (status, "createdAt");


--
-- Name: inventory_check_items_inventoryCheckId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "inventory_check_items_inventoryCheckId_idx" ON public.inventory_check_items USING btree ("inventoryCheckId");


--
-- Name: inventory_checks_checkCode_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "inventory_checks_checkCode_key" ON public.inventory_checks USING btree ("checkCode");


--
-- Name: inventory_checks_warehouseId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "inventory_checks_warehouseId_status_idx" ON public.inventory_checks USING btree ("warehouseId", status);


--
-- Name: job_execution_logs_executionKey_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "job_execution_logs_executionKey_key" ON public.job_execution_logs USING btree ("executionKey");


--
-- Name: job_execution_logs_jobName_startedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "job_execution_logs_jobName_startedAt_idx" ON public.job_execution_logs USING btree ("jobName", "startedAt");


--
-- Name: kpi_criteria_kpiTemplateId_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "kpi_criteria_kpiTemplateId_code_key" ON public.kpi_criteria USING btree ("kpiTemplateId", code);


--
-- Name: kpi_criteria_kpiTemplateId_sortOrder_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "kpi_criteria_kpiTemplateId_sortOrder_idx" ON public.kpi_criteria USING btree ("kpiTemplateId", "sortOrder");


--
-- Name: kpi_templates_companyId_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "kpi_templates_companyId_code_key" ON public.kpi_templates USING btree ("companyId", code);


--
-- Name: kpi_templates_departmentId_positionId_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "kpi_templates_departmentId_positionId_isActive_idx" ON public.kpi_templates USING btree ("departmentId", "positionId", "isActive");


--
-- Name: leave_balances_userId_leaveTypeId_year_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "leave_balances_userId_leaveTypeId_year_key" ON public.leave_balances USING btree ("userId", "leaveTypeId", year);


--
-- Name: leave_requests_departmentId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "leave_requests_departmentId_status_idx" ON public.leave_requests USING btree ("departmentId", status);


--
-- Name: leave_requests_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "leave_requests_userId_idx" ON public.leave_requests USING btree ("userId");


--
-- Name: leave_types_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX leave_types_code_key ON public.leave_types USING btree (code);


--
-- Name: level_promotion_requests_departmentId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "level_promotion_requests_departmentId_status_idx" ON public.level_promotion_requests USING btree ("departmentId", status);


--
-- Name: level_promotion_requests_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "level_promotion_requests_userId_idx" ON public.level_promotion_requests USING btree ("userId");


--
-- Name: location_trackings_userId_recordedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "location_trackings_userId_recordedAt_idx" ON public.location_trackings USING btree ("userId", "recordedAt");


--
-- Name: material_categories_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX material_categories_code_key ON public.material_categories USING btree (code);


--
-- Name: material_issue_items_materialId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "material_issue_items_materialId_idx" ON public.material_issue_items USING btree ("materialId");


--
-- Name: material_issue_items_materialIssueId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "material_issue_items_materialIssueId_idx" ON public.material_issue_items USING btree ("materialIssueId");


--
-- Name: material_issues_issueCode_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "material_issues_issueCode_key" ON public.material_issues USING btree ("issueCode");


--
-- Name: material_issues_issuedToDepartmentId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "material_issues_issuedToDepartmentId_status_idx" ON public.material_issues USING btree ("issuedToDepartmentId", status);


--
-- Name: material_issues_issuedToUserId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "material_issues_issuedToUserId_idx" ON public.material_issues USING btree ("issuedToUserId");


--
-- Name: material_issues_warehouseId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "material_issues_warehouseId_status_idx" ON public.material_issues USING btree ("warehouseId", status);


--
-- Name: material_return_items_materialId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "material_return_items_materialId_idx" ON public.material_return_items USING btree ("materialId");


--
-- Name: material_return_items_materialReturnId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "material_return_items_materialReturnId_idx" ON public.material_return_items USING btree ("materialReturnId");


--
-- Name: material_returns_returnCode_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "material_returns_returnCode_key" ON public.material_returns USING btree ("returnCode");


--
-- Name: material_returns_warehouseId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "material_returns_warehouseId_status_idx" ON public.material_returns USING btree ("warehouseId", status);


--
-- Name: materials_categoryId_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "materials_categoryId_isActive_idx" ON public.materials USING btree ("categoryId", "isActive");


--
-- Name: materials_materialCode_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "materials_materialCode_key" ON public.materials USING btree ("materialCode");


--
-- Name: monthly_competition_reviews_userId_period_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "monthly_competition_reviews_userId_period_key" ON public.monthly_competition_reviews USING btree ("userId", period);


--
-- Name: newsfeed_posts_authorId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "newsfeed_posts_authorId_status_idx" ON public.newsfeed_posts USING btree ("authorId", status);


--
-- Name: newsfeed_posts_departmentId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "newsfeed_posts_departmentId_status_idx" ON public.newsfeed_posts USING btree ("departmentId", status);


--
-- Name: notification_deliveries_userId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "notification_deliveries_userId_status_idx" ON public.notification_deliveries USING btree ("userId", status);


--
-- Name: notification_targets_notificationId_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "notification_targets_notificationId_userId_key" ON public.notification_targets USING btree ("notificationId", "userId");


--
-- Name: notification_targets_userId_readAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "notification_targets_userId_readAt_idx" ON public.notification_targets USING btree ("userId", "readAt");


--
-- Name: notifications_dedupKey_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "notifications_dedupKey_key" ON public.notifications USING btree ("dedupKey");


--
-- Name: notifications_type_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "notifications_type_createdAt_idx" ON public.notifications USING btree (type, "createdAt");


--
-- Name: overtime_rate_rules_companyId_overtimeType_effectiveFrom_ef_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "overtime_rate_rules_companyId_overtimeType_effectiveFrom_ef_idx" ON public.overtime_rate_rules USING btree ("companyId", "overtimeType", "effectiveFrom", "effectiveTo");


--
-- Name: overtime_requests_departmentId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "overtime_requests_departmentId_status_idx" ON public.overtime_requests USING btree ("departmentId", status);


--
-- Name: overtime_requests_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "overtime_requests_userId_idx" ON public.overtime_requests USING btree ("userId");


--
-- Name: payroll_calculation_snapshots_payrollId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "payroll_calculation_snapshots_payrollId_key" ON public.payroll_calculation_snapshots USING btree ("payrollId");


--
-- Name: payroll_items_payrollId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "payroll_items_payrollId_idx" ON public.payroll_items USING btree ("payrollId");


--
-- Name: payroll_items_sourceType_sourceId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "payroll_items_sourceType_sourceId_idx" ON public.payroll_items USING btree ("sourceType", "sourceId");


--
-- Name: payroll_periods_companyId_month_year_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "payroll_periods_companyId_month_year_key" ON public.payroll_periods USING btree ("companyId", month, year);


--
-- Name: payroll_periods_periodCode_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "payroll_periods_periodCode_key" ON public.payroll_periods USING btree ("periodCode");


--
-- Name: payroll_periods_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payroll_periods_status_idx ON public.payroll_periods USING btree (status);


--
-- Name: payrolls_payrollPeriodId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "payrolls_payrollPeriodId_status_idx" ON public.payrolls USING btree ("payrollPeriodId", status);


--
-- Name: payrolls_payrollPeriodId_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "payrolls_payrollPeriodId_userId_key" ON public.payrolls USING btree ("payrollPeriodId", "userId");


--
-- Name: payrolls_userId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "payrolls_userId_status_idx" ON public.payrolls USING btree ("userId", status);


--
-- Name: performance_review_cycles_companyId_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "performance_review_cycles_companyId_code_key" ON public.performance_review_cycles USING btree ("companyId", code);


--
-- Name: performance_review_cycles_status_periodStart_periodEnd_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "performance_review_cycles_status_periodStart_periodEnd_idx" ON public.performance_review_cycles USING btree (status, "periodStart", "periodEnd");


--
-- Name: performance_reviews_cycleId_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "performance_reviews_cycleId_userId_key" ON public.performance_reviews USING btree ("cycleId", "userId");


--
-- Name: performance_reviews_reviewerUserId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "performance_reviews_reviewerUserId_status_idx" ON public.performance_reviews USING btree ("reviewerUserId", status);


--
-- Name: performance_reviews_userId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "performance_reviews_userId_status_idx" ON public.performance_reviews USING btree ("userId", status);


--
-- Name: permissions_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX permissions_code_key ON public.permissions USING btree (code);


--
-- Name: positions_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX positions_code_key ON public.positions USING btree (code);


--
-- Name: post_comments_postId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "post_comments_postId_idx" ON public.post_comments USING btree ("postId");


--
-- Name: post_likes_postId_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "post_likes_postId_userId_key" ON public.post_likes USING btree ("postId", "userId");


--
-- Name: refresh_sessions_expiresAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "refresh_sessions_expiresAt_idx" ON public.refresh_sessions USING btree ("expiresAt");


--
-- Name: refresh_sessions_tokenHash_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "refresh_sessions_tokenHash_key" ON public.refresh_sessions USING btree ("tokenHash");


--
-- Name: refresh_sessions_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "refresh_sessions_userId_idx" ON public.refresh_sessions USING btree ("userId");


--
-- Name: regions_companyId_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "regions_companyId_code_key" ON public.regions USING btree ("companyId", code);


--
-- Name: report_snapshots_reportType_periodStart_periodEnd_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "report_snapshots_reportType_periodStart_periodEnd_idx" ON public.report_snapshots USING btree ("reportType", "periodStart", "periodEnd");


--
-- Name: report_snapshots_scopeType_scopeId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "report_snapshots_scopeType_scopeId_idx" ON public.report_snapshots USING btree ("scopeType", "scopeId");


--
-- Name: reviewer_assignments_reviewCycleId_employeeUserId_reviewerU_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "reviewer_assignments_reviewCycleId_employeeUserId_reviewerU_key" ON public.reviewer_assignments USING btree ("reviewCycleId", "employeeUserId", "reviewerUserId", "reviewerType");


--
-- Name: reviewer_assignments_reviewerUserId_reviewerType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "reviewer_assignments_reviewerUserId_reviewerType_idx" ON public.reviewer_assignments USING btree ("reviewerUserId", "reviewerType");


--
-- Name: role_permissions_roleId_permissionId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "role_permissions_roleId_permissionId_key" ON public.role_permissions USING btree ("roleId", "permissionId");


--
-- Name: roles_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX roles_code_key ON public.roles USING btree (code);


--
-- Name: salary_components_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX salary_components_code_key ON public.salary_components USING btree (code);


--
-- Name: salary_profiles_userId_effectiveFrom_effectiveTo_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "salary_profiles_userId_effectiveFrom_effectiveTo_idx" ON public.salary_profiles USING btree ("userId", "effectiveFrom", "effectiveTo");


--
-- Name: salary_profiles_userId_effectiveFrom_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "salary_profiles_userId_effectiveFrom_key" ON public.salary_profiles USING btree ("userId", "effectiveFrom");


--
-- Name: shift_assignments_departmentId_workDate_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "shift_assignments_departmentId_workDate_idx" ON public.shift_assignments USING btree ("departmentId", "workDate");


--
-- Name: shift_assignments_userId_workDate_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "shift_assignments_userId_workDate_key" ON public.shift_assignments USING btree ("userId", "workDate");


--
-- Name: shift_registrations_departmentId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "shift_registrations_departmentId_status_idx" ON public.shift_registrations USING btree ("departmentId", status);


--
-- Name: shift_registrations_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "shift_registrations_userId_idx" ON public.shift_registrations USING btree ("userId");


--
-- Name: shift_registrations_workDate_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "shift_registrations_workDate_idx" ON public.shift_registrations USING btree ("workDate");


--
-- Name: shift_swaps_departmentId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "shift_swaps_departmentId_status_idx" ON public.shift_swaps USING btree ("departmentId", status);


--
-- Name: shift_swaps_requesterUserId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "shift_swaps_requesterUserId_idx" ON public.shift_swaps USING btree ("requesterUserId");


--
-- Name: shift_swaps_targetUserId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "shift_swaps_targetUserId_idx" ON public.shift_swaps USING btree ("targetUserId");


--
-- Name: shifts_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX shifts_code_key ON public.shifts USING btree (code);


--
-- Name: stock_receipt_items_materialId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "stock_receipt_items_materialId_idx" ON public.stock_receipt_items USING btree ("materialId");


--
-- Name: stock_receipt_items_receiptId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "stock_receipt_items_receiptId_idx" ON public.stock_receipt_items USING btree ("receiptId");


--
-- Name: stock_receipts_receiptCode_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "stock_receipts_receiptCode_key" ON public.stock_receipts USING btree ("receiptCode");


--
-- Name: stock_receipts_warehouseId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "stock_receipts_warehouseId_status_idx" ON public.stock_receipts USING btree ("warehouseId", status);


--
-- Name: stock_transactions_materialId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "stock_transactions_materialId_createdAt_idx" ON public.stock_transactions USING btree ("materialId", "createdAt");


--
-- Name: stock_transactions_transactionCode_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "stock_transactions_transactionCode_key" ON public.stock_transactions USING btree ("transactionCode");


--
-- Name: stock_transactions_warehouseId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "stock_transactions_warehouseId_createdAt_idx" ON public.stock_transactions USING btree ("warehouseId", "createdAt");


--
-- Name: stock_transfer_items_materialId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "stock_transfer_items_materialId_idx" ON public.stock_transfer_items USING btree ("materialId");


--
-- Name: stock_transfer_items_transferId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "stock_transfer_items_transferId_idx" ON public.stock_transfer_items USING btree ("transferId");


--
-- Name: stock_transfers_sourceWarehouseId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "stock_transfers_sourceWarehouseId_status_idx" ON public.stock_transfers USING btree ("sourceWarehouseId", status);


--
-- Name: stock_transfers_targetWarehouseId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "stock_transfers_targetWarehouseId_status_idx" ON public.stock_transfers USING btree ("targetWarehouseId", status);


--
-- Name: stock_transfers_transferCode_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "stock_transfers_transferCode_key" ON public.stock_transfers USING btree ("transferCode");


--
-- Name: system_settings_companyId_category_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "system_settings_companyId_category_idx" ON public.system_settings USING btree ("companyId", category);


--
-- Name: system_settings_companyId_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "system_settings_companyId_key_key" ON public.system_settings USING btree ("companyId", key);


--
-- Name: talent_retention_vaults_userId_year_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "talent_retention_vaults_userId_year_key" ON public.talent_retention_vaults USING btree ("userId", year);


--
-- Name: task_assignments_taskId_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "task_assignments_taskId_userId_key" ON public.task_assignments USING btree ("taskId", "userId");


--
-- Name: task_assignments_userId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "task_assignments_userId_status_idx" ON public.task_assignments USING btree ("userId", status);


--
-- Name: task_attachments_taskId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "task_attachments_taskId_idx" ON public.task_attachments USING btree ("taskId");


--
-- Name: task_comments_taskId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "task_comments_taskId_createdAt_idx" ON public.task_comments USING btree ("taskId", "createdAt");


--
-- Name: task_extension_requests_status_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "task_extension_requests_status_createdAt_idx" ON public.task_extension_requests USING btree (status, "createdAt");


--
-- Name: task_group_members_groupId_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "task_group_members_groupId_userId_key" ON public.task_group_members USING btree ("groupId", "userId");


--
-- Name: task_groups_departmentId_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "task_groups_departmentId_name_key" ON public.task_groups USING btree ("departmentId", name);


--
-- Name: task_status_histories_taskId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "task_status_histories_taskId_createdAt_idx" ON public.task_status_histories USING btree ("taskId", "createdAt");


--
-- Name: task_targets_targetType_targetId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "task_targets_targetType_targetId_idx" ON public.task_targets USING btree ("targetType", "targetId");


--
-- Name: task_targets_taskId_targetType_targetId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "task_targets_taskId_targetType_targetId_key" ON public.task_targets USING btree ("taskId", "targetType", "targetId");


--
-- Name: tasks_createdByUserId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "tasks_createdByUserId_createdAt_idx" ON public.tasks USING btree ("createdByUserId", "createdAt");


--
-- Name: tasks_departmentContextId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "tasks_departmentContextId_status_idx" ON public.tasks USING btree ("departmentContextId", status);


--
-- Name: tasks_taskCode_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "tasks_taskCode_key" ON public.tasks USING btree ("taskCode");


--
-- Name: uploaded_files_purpose_status_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "uploaded_files_purpose_status_createdAt_idx" ON public.uploaded_files USING btree (purpose, status, "createdAt");


--
-- Name: uploaded_files_storageKey_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "uploaded_files_storageKey_key" ON public.uploaded_files USING btree ("storageKey");


--
-- Name: uploaded_files_uploadedById_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "uploaded_files_uploadedById_idx" ON public.uploaded_files USING btree ("uploadedById");


--
-- Name: user_approval_requests_requestedDepartmentId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "user_approval_requests_requestedDepartmentId_status_idx" ON public.user_approval_requests USING btree ("requestedDepartmentId", status);


--
-- Name: user_approval_requests_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "user_approval_requests_userId_idx" ON public.user_approval_requests USING btree ("userId");


--
-- Name: user_notification_preferences_userId_notificationType_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "user_notification_preferences_userId_notificationType_key" ON public.user_notification_preferences USING btree ("userId", "notificationType");


--
-- Name: user_roles_userId_roleId_scopeType_scopeId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "user_roles_userId_roleId_scopeType_scopeId_key" ON public.user_roles USING btree ("userId", "roleId", "scopeType", "scopeId");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_phone_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_phone_key ON public.users USING btree (phone);


--
-- Name: users_userCode_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "users_userCode_key" ON public.users USING btree ("userCode");


--
-- Name: violations_userId_status_violationDate_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "violations_userId_status_violationDate_idx" ON public.violations USING btree ("userId", status, "violationDate");


--
-- Name: warehouse_stocks_materialId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "warehouse_stocks_materialId_idx" ON public.warehouse_stocks USING btree ("materialId");


--
-- Name: warehouse_stocks_warehouseId_materialId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "warehouse_stocks_warehouseId_materialId_key" ON public.warehouse_stocks USING btree ("warehouseId", "materialId");


--
-- Name: warehouses_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX warehouses_code_key ON public.warehouses USING btree (code);


--
-- Name: warehouses_companyId_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "warehouses_companyId_isActive_idx" ON public.warehouses USING btree ("companyId", "isActive");


--
-- Name: warehouses_departmentId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "warehouses_departmentId_idx" ON public.warehouses USING btree ("departmentId");


--
-- Name: OtpToken OtpToken_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OtpToken"
    ADD CONSTRAINT "OtpToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: _AttendanceLocationDepartments _AttendanceLocationDepartments_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."_AttendanceLocationDepartments"
    ADD CONSTRAINT "_AttendanceLocationDepartments_A_fkey" FOREIGN KEY ("A") REFERENCES public.attendance_locations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _AttendanceLocationDepartments _AttendanceLocationDepartments_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."_AttendanceLocationDepartments"
    ADD CONSTRAINT "_AttendanceLocationDepartments_B_fkey" FOREIGN KEY ("B") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: approval_histories approval_histories_actorUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_histories
    ADD CONSTRAINT "approval_histories_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: approval_histories approval_histories_approvalRequestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_histories
    ADD CONSTRAINT "approval_histories_approvalRequestId_fkey" FOREIGN KEY ("approvalRequestId") REFERENCES public.user_approval_requests(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: asset_assignment_histories asset_assignment_histories_assetAssignmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_assignment_histories
    ADD CONSTRAINT "asset_assignment_histories_assetAssignmentId_fkey" FOREIGN KEY ("assetAssignmentId") REFERENCES public.asset_assignments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: asset_assignment_histories asset_assignment_histories_performedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_assignment_histories
    ADD CONSTRAINT "asset_assignment_histories_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: asset_assignments asset_assignments_assetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_assignments
    ADD CONSTRAINT "asset_assignments_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES public.assets(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: asset_assignments asset_assignments_assignedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_assignments
    ADD CONSTRAINT "asset_assignments_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: asset_assignments asset_assignments_assignedToDepartmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_assignments
    ADD CONSTRAINT "asset_assignments_assignedToDepartmentId_fkey" FOREIGN KEY ("assignedToDepartmentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: asset_assignments asset_assignments_assignedToUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_assignments
    ADD CONSTRAINT "asset_assignments_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: asset_incident_reports asset_incident_reports_assetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_incident_reports
    ADD CONSTRAINT "asset_incident_reports_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES public.assets(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: asset_incident_reports asset_incident_reports_reportedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_incident_reports
    ADD CONSTRAINT "asset_incident_reports_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: asset_incident_reports asset_incident_reports_resolvedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_incident_reports
    ADD CONSTRAINT "asset_incident_reports_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: asset_maintenance_records asset_maintenance_records_assetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_maintenance_records
    ADD CONSTRAINT "asset_maintenance_records_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES public.assets(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: asset_maintenance_records asset_maintenance_records_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_maintenance_records
    ADD CONSTRAINT "asset_maintenance_records_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: assets assets_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT "assets_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: assets assets_warehouseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT "assets_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES public.warehouses(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: attendance_adjustments attendance_adjustments_attendanceRecordId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_adjustments
    ADD CONSTRAINT "attendance_adjustments_attendanceRecordId_fkey" FOREIGN KEY ("attendanceRecordId") REFERENCES public.attendance_records(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: attendance_adjustments attendance_adjustments_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_adjustments
    ADD CONSTRAINT "attendance_adjustments_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: attendance_adjustments attendance_adjustments_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_adjustments
    ADD CONSTRAINT "attendance_adjustments_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: attendance_locations attendance_locations_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_locations
    ADD CONSTRAINT "attendance_locations_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: attendance_records attendance_records_checkOutPhotoFileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT "attendance_records_checkOutPhotoFileId_fkey" FOREIGN KEY ("checkOutPhotoFileId") REFERENCES public.uploaded_files(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: attendance_records attendance_records_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT "attendance_records_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: attendance_records attendance_records_photoFileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT "attendance_records_photoFileId_fkey" FOREIGN KEY ("photoFileId") REFERENCES public.uploaded_files(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: attendance_records attendance_records_shiftAssignmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT "attendance_records_shiftAssignmentId_fkey" FOREIGN KEY ("shiftAssignmentId") REFERENCES public.shift_assignments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: attendance_records attendance_records_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT "attendance_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: attendance_verifications attendance_verifications_attendanceRecordId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_verifications
    ADD CONSTRAINT "attendance_verifications_attendanceRecordId_fkey" FOREIGN KEY ("attendanceRecordId") REFERENCES public.attendance_records(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_actorUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "audit_logs_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: branches branches_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT "branches_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: branches branches_regionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT "branches_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES public.regions(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: chat_group_members chat_group_members_groupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_group_members
    ADD CONSTRAINT "chat_group_members_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES public.chat_groups(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: chat_group_members chat_group_members_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_group_members
    ADD CONSTRAINT "chat_group_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: chat_groups chat_groups_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_groups
    ADD CONSTRAINT "chat_groups_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: chat_groups chat_groups_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_groups
    ADD CONSTRAINT "chat_groups_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: chat_messages chat_messages_groupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT "chat_messages_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES public.chat_groups(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: chat_messages chat_messages_senderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT "chat_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: contract_signatures contract_signatures_contractId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_signatures
    ADD CONSTRAINT "contract_signatures_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES public.employee_contracts(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: contract_signatures contract_signatures_signerUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_signatures
    ADD CONSTRAINT "contract_signatures_signerUserId_fkey" FOREIGN KEY ("signerUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: contract_template_versions contract_template_versions_contractTemplateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_template_versions
    ADD CONSTRAINT "contract_template_versions_contractTemplateId_fkey" FOREIGN KEY ("contractTemplateId") REFERENCES public.contract_templates(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: contract_template_versions contract_template_versions_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_template_versions
    ADD CONSTRAINT "contract_template_versions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: contract_templates contract_templates_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_templates
    ADD CONSTRAINT "contract_templates_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: contract_templates contract_templates_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_templates
    ADD CONSTRAINT "contract_templates_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: cross_department_requests cross_department_requests_assignedToUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cross_department_requests
    ADD CONSTRAINT "cross_department_requests_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cross_department_requests cross_department_requests_createdByUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cross_department_requests
    ADD CONSTRAINT "cross_department_requests_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: cross_department_requests cross_department_requests_decidedByUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cross_department_requests
    ADD CONSTRAINT "cross_department_requests_decidedByUserId_fkey" FOREIGN KEY ("decidedByUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cross_department_requests cross_department_requests_sourceDepartmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cross_department_requests
    ADD CONSTRAINT "cross_department_requests_sourceDepartmentId_fkey" FOREIGN KEY ("sourceDepartmentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: cross_department_requests cross_department_requests_targetDepartmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cross_department_requests
    ADD CONSTRAINT "cross_department_requests_targetDepartmentId_fkey" FOREIGN KEY ("targetDepartmentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: cross_department_requests cross_department_requests_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cross_department_requests
    ADD CONSTRAINT "cross_department_requests_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: department_documents department_documents_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.department_documents
    ADD CONSTRAINT "department_documents_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: department_documents department_documents_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.department_documents
    ADD CONSTRAINT "department_documents_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: department_documents department_documents_uploadedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.department_documents
    ADD CONSTRAINT "department_documents_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: department_level_configs department_level_configs_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.department_level_configs
    ADD CONSTRAINT "department_level_configs_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: department_members department_members_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.department_members
    ADD CONSTRAINT "department_members_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: department_members department_members_positionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.department_members
    ADD CONSTRAINT "department_members_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES public.positions(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: department_members department_members_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.department_members
    ADD CONSTRAINT "department_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: department_overtime_configs department_overtime_configs_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.department_overtime_configs
    ADD CONSTRAINT "department_overtime_configs_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: departments departments_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT "departments_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: departments departments_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT "departments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: departments departments_leaderUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT "departments_leaderUserId_fkey" FOREIGN KEY ("leaderUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: departments departments_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT "departments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: device_tokens device_tokens_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_tokens
    ADD CONSTRAINT "device_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: disciplinary_actions disciplinary_actions_approvedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disciplinary_actions
    ADD CONSTRAINT "disciplinary_actions_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: disciplinary_actions disciplinary_actions_violationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disciplinary_actions
    ADD CONSTRAINT "disciplinary_actions_violationId_fkey" FOREIGN KEY ("violationId") REFERENCES public.violations(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: document_types document_types_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_types
    ADD CONSTRAINT "document_types_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: employee_bank_accounts employee_bank_accounts_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_bank_accounts
    ADD CONSTRAINT "employee_bank_accounts_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public.employee_profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: employee_bonuses employee_bonuses_approvedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_bonuses
    ADD CONSTRAINT "employee_bonuses_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: employee_bonuses employee_bonuses_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_bonuses
    ADD CONSTRAINT "employee_bonuses_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: employee_bonuses employee_bonuses_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_bonuses
    ADD CONSTRAINT "employee_bonuses_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: employee_contracts employee_contracts_approvedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_contracts
    ADD CONSTRAINT "employee_contracts_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: employee_contracts employee_contracts_contractTemplateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_contracts
    ADD CONSTRAINT "employee_contracts_contractTemplateId_fkey" FOREIGN KEY ("contractTemplateId") REFERENCES public.contract_templates(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: employee_contracts employee_contracts_contractTemplateVersionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_contracts
    ADD CONSTRAINT "employee_contracts_contractTemplateVersionId_fkey" FOREIGN KEY ("contractTemplateVersionId") REFERENCES public.contract_template_versions(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: employee_contracts employee_contracts_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_contracts
    ADD CONSTRAINT "employee_contracts_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: employee_contracts employee_contracts_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_contracts
    ADD CONSTRAINT "employee_contracts_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: employee_deductions employee_deductions_approvedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_deductions
    ADD CONSTRAINT "employee_deductions_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: employee_deductions employee_deductions_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_deductions
    ADD CONSTRAINT "employee_deductions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: employee_deductions employee_deductions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_deductions
    ADD CONSTRAINT "employee_deductions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: employee_documents employee_documents_documentTypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_documents
    ADD CONSTRAINT "employee_documents_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES public.document_types(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: employee_documents employee_documents_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_documents
    ADD CONSTRAINT "employee_documents_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public.employee_profiles(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: employee_documents employee_documents_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_documents
    ADD CONSTRAINT "employee_documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: employee_documents employee_documents_verifiedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_documents
    ADD CONSTRAINT "employee_documents_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: employee_kpi_assignments employee_kpi_assignments_assignedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_kpi_assignments
    ADD CONSTRAINT "employee_kpi_assignments_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: employee_kpi_assignments employee_kpi_assignments_kpiTemplateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_kpi_assignments
    ADD CONSTRAINT "employee_kpi_assignments_kpiTemplateId_fkey" FOREIGN KEY ("kpiTemplateId") REFERENCES public.kpi_templates(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: employee_kpi_assignments employee_kpi_assignments_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_kpi_assignments
    ADD CONSTRAINT "employee_kpi_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: employee_kpi_results employee_kpi_results_criteriaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_kpi_results
    ADD CONSTRAINT "employee_kpi_results_criteriaId_fkey" FOREIGN KEY ("criteriaId") REFERENCES public.kpi_criteria(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: employee_kpi_results employee_kpi_results_employeeKpiAssignmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_kpi_results
    ADD CONSTRAINT "employee_kpi_results_employeeKpiAssignmentId_fkey" FOREIGN KEY ("employeeKpiAssignmentId") REFERENCES public.employee_kpi_assignments(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: employee_profiles employee_profiles_positionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_profiles
    ADD CONSTRAINT "employee_profiles_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES public.positions(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: employee_profiles employee_profiles_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_profiles
    ADD CONSTRAINT "employee_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: employee_requests employee_requests_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_requests
    ADD CONSTRAINT "employee_requests_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: employee_requests employee_requests_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_requests
    ADD CONSTRAINT "employee_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: employee_salary_components employee_salary_components_componentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_salary_components
    ADD CONSTRAINT "employee_salary_components_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES public.salary_components(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: employee_salary_components employee_salary_components_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_salary_components
    ADD CONSTRAINT "employee_salary_components_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: employee_salary_components employee_salary_components_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_salary_components
    ADD CONSTRAINT "employee_salary_components_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: face_profiles face_profiles_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.face_profiles
    ADD CONSTRAINT "face_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: face_registration_images face_registration_images_faceProfileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.face_registration_images
    ADD CONSTRAINT "face_registration_images_faceProfileId_fkey" FOREIGN KEY ("faceProfileId") REFERENCES public.face_profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: feedbacks feedbacks_senderUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedbacks
    ADD CONSTRAINT "feedbacks_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: grant_milestones grant_milestones_packageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grant_milestones
    ADD CONSTRAINT "grant_milestones_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES public.project_grant_packages(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: inventory_check_items inventory_check_items_inventoryCheckId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_check_items
    ADD CONSTRAINT "inventory_check_items_inventoryCheckId_fkey" FOREIGN KEY ("inventoryCheckId") REFERENCES public.inventory_checks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: inventory_check_items inventory_check_items_materialId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_check_items
    ADD CONSTRAINT "inventory_check_items_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES public.materials(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: inventory_checks inventory_checks_approvedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_checks
    ADD CONSTRAINT "inventory_checks_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: inventory_checks inventory_checks_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_checks
    ADD CONSTRAINT "inventory_checks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: inventory_checks inventory_checks_warehouseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_checks
    ADD CONSTRAINT "inventory_checks_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES public.warehouses(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: kpi_criteria kpi_criteria_kpiTemplateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_criteria
    ADD CONSTRAINT "kpi_criteria_kpiTemplateId_fkey" FOREIGN KEY ("kpiTemplateId") REFERENCES public.kpi_templates(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: kpi_templates kpi_templates_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_templates
    ADD CONSTRAINT "kpi_templates_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: kpi_templates kpi_templates_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_templates
    ADD CONSTRAINT "kpi_templates_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: kpi_templates kpi_templates_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_templates
    ADD CONSTRAINT "kpi_templates_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: kpi_templates kpi_templates_positionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_templates
    ADD CONSTRAINT "kpi_templates_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES public.positions(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: leave_balances leave_balances_leaveTypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_balances
    ADD CONSTRAINT "leave_balances_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES public.leave_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: leave_balances leave_balances_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_balances
    ADD CONSTRAINT "leave_balances_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: leave_requests leave_requests_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT "leave_requests_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: leave_requests leave_requests_leaveTypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT "leave_requests_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES public.leave_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: leave_requests leave_requests_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT "leave_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: level_promotion_requests level_promotion_requests_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.level_promotion_requests
    ADD CONSTRAINT "level_promotion_requests_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: level_promotion_requests level_promotion_requests_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.level_promotion_requests
    ADD CONSTRAINT "level_promotion_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: location_trackings location_trackings_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location_trackings
    ADD CONSTRAINT "location_trackings_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: material_issue_items material_issue_items_materialId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.material_issue_items
    ADD CONSTRAINT "material_issue_items_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES public.materials(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: material_issue_items material_issue_items_materialIssueId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.material_issue_items
    ADD CONSTRAINT "material_issue_items_materialIssueId_fkey" FOREIGN KEY ("materialIssueId") REFERENCES public.material_issues(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: material_issues material_issues_approvedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.material_issues
    ADD CONSTRAINT "material_issues_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: material_issues material_issues_issuedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.material_issues
    ADD CONSTRAINT "material_issues_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: material_issues material_issues_issuedToDepartmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.material_issues
    ADD CONSTRAINT "material_issues_issuedToDepartmentId_fkey" FOREIGN KEY ("issuedToDepartmentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: material_issues material_issues_issuedToUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.material_issues
    ADD CONSTRAINT "material_issues_issuedToUserId_fkey" FOREIGN KEY ("issuedToUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: material_issues material_issues_requestedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.material_issues
    ADD CONSTRAINT "material_issues_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: material_issues material_issues_warehouseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.material_issues
    ADD CONSTRAINT "material_issues_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES public.warehouses(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: material_return_items material_return_items_materialId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.material_return_items
    ADD CONSTRAINT "material_return_items_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES public.materials(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: material_return_items material_return_items_materialReturnId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.material_return_items
    ADD CONSTRAINT "material_return_items_materialReturnId_fkey" FOREIGN KEY ("materialReturnId") REFERENCES public.material_returns(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: material_returns material_returns_receivedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.material_returns
    ADD CONSTRAINT "material_returns_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: material_returns material_returns_returnedByDepartmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.material_returns
    ADD CONSTRAINT "material_returns_returnedByDepartmentId_fkey" FOREIGN KEY ("returnedByDepartmentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: material_returns material_returns_returnedByUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.material_returns
    ADD CONSTRAINT "material_returns_returnedByUserId_fkey" FOREIGN KEY ("returnedByUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: material_returns material_returns_warehouseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.material_returns
    ADD CONSTRAINT "material_returns_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES public.warehouses(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: materials materials_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materials
    ADD CONSTRAINT "materials_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.material_categories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: newsfeed_posts newsfeed_posts_approvedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsfeed_posts
    ADD CONSTRAINT "newsfeed_posts_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: newsfeed_posts newsfeed_posts_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsfeed_posts
    ADD CONSTRAINT "newsfeed_posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: newsfeed_posts newsfeed_posts_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsfeed_posts
    ADD CONSTRAINT "newsfeed_posts_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: notification_deliveries notification_deliveries_deviceTokenId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_deliveries
    ADD CONSTRAINT "notification_deliveries_deviceTokenId_fkey" FOREIGN KEY ("deviceTokenId") REFERENCES public.device_tokens(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: notification_deliveries notification_deliveries_notificationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_deliveries
    ADD CONSTRAINT "notification_deliveries_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES public.notifications(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notification_deliveries notification_deliveries_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_deliveries
    ADD CONSTRAINT "notification_deliveries_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notification_targets notification_targets_notificationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_targets
    ADD CONSTRAINT "notification_targets_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES public.notifications(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notification_targets notification_targets_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_targets
    ADD CONSTRAINT "notification_targets_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notifications notifications_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "notifications_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: overtime_rate_rules overtime_rate_rules_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.overtime_rate_rules
    ADD CONSTRAINT "overtime_rate_rules_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: overtime_rate_rules overtime_rate_rules_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.overtime_rate_rules
    ADD CONSTRAINT "overtime_rate_rules_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: overtime_requests overtime_requests_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.overtime_requests
    ADD CONSTRAINT "overtime_requests_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: overtime_requests overtime_requests_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.overtime_requests
    ADD CONSTRAINT "overtime_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: payroll_calculation_snapshots payroll_calculation_snapshots_payrollId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_calculation_snapshots
    ADD CONSTRAINT "payroll_calculation_snapshots_payrollId_fkey" FOREIGN KEY ("payrollId") REFERENCES public.payrolls(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: payroll_items payroll_items_componentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_items
    ADD CONSTRAINT "payroll_items_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES public.salary_components(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payroll_items payroll_items_payrollId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_items
    ADD CONSTRAINT "payroll_items_payrollId_fkey" FOREIGN KEY ("payrollId") REFERENCES public.payrolls(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: payroll_periods payroll_periods_approvedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_periods
    ADD CONSTRAINT "payroll_periods_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payroll_periods payroll_periods_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_periods
    ADD CONSTRAINT "payroll_periods_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: payroll_periods payroll_periods_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_periods
    ADD CONSTRAINT "payroll_periods_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: payroll_periods payroll_periods_lockedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_periods
    ADD CONSTRAINT "payroll_periods_lockedById_fkey" FOREIGN KEY ("lockedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payroll_periods payroll_periods_reviewedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_periods
    ADD CONSTRAINT "payroll_periods_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payrolls payrolls_payrollPeriodId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payrolls
    ADD CONSTRAINT "payrolls_payrollPeriodId_fkey" FOREIGN KEY ("payrollPeriodId") REFERENCES public.payroll_periods(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: payrolls payrolls_salaryProfileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payrolls
    ADD CONSTRAINT "payrolls_salaryProfileId_fkey" FOREIGN KEY ("salaryProfileId") REFERENCES public.salary_profiles(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: payrolls payrolls_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payrolls
    ADD CONSTRAINT "payrolls_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: performance_review_cycles performance_review_cycles_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.performance_review_cycles
    ADD CONSTRAINT "performance_review_cycles_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: performance_review_cycles performance_review_cycles_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.performance_review_cycles
    ADD CONSTRAINT "performance_review_cycles_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: performance_reviews performance_reviews_cycleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.performance_reviews
    ADD CONSTRAINT "performance_reviews_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES public.performance_review_cycles(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: performance_reviews performance_reviews_reviewerUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.performance_reviews
    ADD CONSTRAINT "performance_reviews_reviewerUserId_fkey" FOREIGN KEY ("reviewerUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: performance_reviews performance_reviews_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.performance_reviews
    ADD CONSTRAINT "performance_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: positions positions_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT "positions_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: post_comments post_comments_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT "post_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: post_comments post_comments_postId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT "post_comments_postId_fkey" FOREIGN KEY ("postId") REFERENCES public.newsfeed_posts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: post_likes post_likes_postId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT "post_likes_postId_fkey" FOREIGN KEY ("postId") REFERENCES public.newsfeed_posts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: post_likes post_likes_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT "post_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: project_grant_packages project_grant_packages_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_grant_packages
    ADD CONSTRAINT "project_grant_packages_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: project_grant_packages project_grant_packages_vaultId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_grant_packages
    ADD CONSTRAINT "project_grant_packages_vaultId_fkey" FOREIGN KEY ("vaultId") REFERENCES public.talent_retention_vaults(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: refresh_sessions refresh_sessions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_sessions
    ADD CONSTRAINT "refresh_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: regions regions_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regions
    ADD CONSTRAINT "regions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: report_snapshots report_snapshots_generatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_snapshots
    ADD CONSTRAINT "report_snapshots_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: reviewer_assignments reviewer_assignments_employeeUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviewer_assignments
    ADD CONSTRAINT "reviewer_assignments_employeeUserId_fkey" FOREIGN KEY ("employeeUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: reviewer_assignments reviewer_assignments_reviewCycleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviewer_assignments
    ADD CONSTRAINT "reviewer_assignments_reviewCycleId_fkey" FOREIGN KEY ("reviewCycleId") REFERENCES public.performance_review_cycles(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: reviewer_assignments reviewer_assignments_reviewerUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviewer_assignments
    ADD CONSTRAINT "reviewer_assignments_reviewerUserId_fkey" FOREIGN KEY ("reviewerUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: reward_withdrawal_requests reward_withdrawal_requests_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reward_withdrawal_requests
    ADD CONSTRAINT "reward_withdrawal_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_permissionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES public.permissions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: salary_profiles salary_profiles_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salary_profiles
    ADD CONSTRAINT "salary_profiles_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: salary_profiles salary_profiles_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salary_profiles
    ADD CONSTRAINT "salary_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: shift_assignments shift_assignments_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_assignments
    ADD CONSTRAINT "shift_assignments_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: shift_assignments shift_assignments_shiftId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_assignments
    ADD CONSTRAINT "shift_assignments_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES public.shifts(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: shift_assignments shift_assignments_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_assignments
    ADD CONSTRAINT "shift_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: shift_registrations shift_registrations_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_registrations
    ADD CONSTRAINT "shift_registrations_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: shift_registrations shift_registrations_shiftId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_registrations
    ADD CONSTRAINT "shift_registrations_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES public.shifts(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: shift_registrations shift_registrations_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_registrations
    ADD CONSTRAINT "shift_registrations_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: shift_swaps shift_swaps_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_swaps
    ADD CONSTRAINT "shift_swaps_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: shift_swaps shift_swaps_fromShiftId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_swaps
    ADD CONSTRAINT "shift_swaps_fromShiftId_fkey" FOREIGN KEY ("fromShiftId") REFERENCES public.shifts(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: shift_swaps shift_swaps_requesterUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_swaps
    ADD CONSTRAINT "shift_swaps_requesterUserId_fkey" FOREIGN KEY ("requesterUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: shift_swaps shift_swaps_targetUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_swaps
    ADD CONSTRAINT "shift_swaps_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: shift_swaps shift_swaps_toShiftId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_swaps
    ADD CONSTRAINT "shift_swaps_toShiftId_fkey" FOREIGN KEY ("toShiftId") REFERENCES public.shifts(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: stock_receipt_items stock_receipt_items_materialId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_receipt_items
    ADD CONSTRAINT "stock_receipt_items_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES public.materials(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: stock_receipt_items stock_receipt_items_receiptId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_receipt_items
    ADD CONSTRAINT "stock_receipt_items_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES public.stock_receipts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stock_receipts stock_receipts_approvedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_receipts
    ADD CONSTRAINT "stock_receipts_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: stock_receipts stock_receipts_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_receipts
    ADD CONSTRAINT "stock_receipts_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: stock_receipts stock_receipts_warehouseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_receipts
    ADD CONSTRAINT "stock_receipts_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES public.warehouses(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: stock_transactions stock_transactions_materialId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_transactions
    ADD CONSTRAINT "stock_transactions_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES public.materials(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: stock_transactions stock_transactions_performedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_transactions
    ADD CONSTRAINT "stock_transactions_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: stock_transactions stock_transactions_warehouseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_transactions
    ADD CONSTRAINT "stock_transactions_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES public.warehouses(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: stock_transfer_items stock_transfer_items_materialId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_transfer_items
    ADD CONSTRAINT "stock_transfer_items_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES public.materials(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: stock_transfer_items stock_transfer_items_transferId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_transfer_items
    ADD CONSTRAINT "stock_transfer_items_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES public.stock_transfers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stock_transfers stock_transfers_approvedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_transfers
    ADD CONSTRAINT "stock_transfers_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: stock_transfers stock_transfers_receivedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_transfers
    ADD CONSTRAINT "stock_transfers_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: stock_transfers stock_transfers_requestedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_transfers
    ADD CONSTRAINT "stock_transfers_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: stock_transfers stock_transfers_shippedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_transfers
    ADD CONSTRAINT "stock_transfers_shippedById_fkey" FOREIGN KEY ("shippedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: stock_transfers stock_transfers_sourceWarehouseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_transfers
    ADD CONSTRAINT "stock_transfers_sourceWarehouseId_fkey" FOREIGN KEY ("sourceWarehouseId") REFERENCES public.warehouses(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: stock_transfers stock_transfers_targetWarehouseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_transfers
    ADD CONSTRAINT "stock_transfers_targetWarehouseId_fkey" FOREIGN KEY ("targetWarehouseId") REFERENCES public.warehouses(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: system_settings system_settings_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT "system_settings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: system_settings system_settings_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT "system_settings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: talent_retention_vaults talent_retention_vaults_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.talent_retention_vaults
    ADD CONSTRAINT "talent_retention_vaults_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_assignments task_assignments_assignedByUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_assignments
    ADD CONSTRAINT "task_assignments_assignedByUserId_fkey" FOREIGN KEY ("assignedByUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: task_assignments task_assignments_reviewedByUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_assignments
    ADD CONSTRAINT "task_assignments_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: task_assignments task_assignments_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_assignments
    ADD CONSTRAINT "task_assignments_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_assignments task_assignments_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_assignments
    ADD CONSTRAINT "task_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_attachments task_attachments_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_attachments
    ADD CONSTRAINT "task_attachments_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_attachments task_attachments_uploadedByUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_attachments
    ADD CONSTRAINT "task_attachments_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: task_comments task_comments_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_comments
    ADD CONSTRAINT "task_comments_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_comments task_comments_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_comments
    ADD CONSTRAINT "task_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_extension_requests task_extension_requests_assignmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_extension_requests
    ADD CONSTRAINT "task_extension_requests_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES public.task_assignments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_extension_requests task_extension_requests_decidedByUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_extension_requests
    ADD CONSTRAINT "task_extension_requests_decidedByUserId_fkey" FOREIGN KEY ("decidedByUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: task_extension_requests task_extension_requests_requestedByUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_extension_requests
    ADD CONSTRAINT "task_extension_requests_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_extension_requests task_extension_requests_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_extension_requests
    ADD CONSTRAINT "task_extension_requests_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_group_members task_group_members_groupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_group_members
    ADD CONSTRAINT "task_group_members_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES public.task_groups(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_group_members task_group_members_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_group_members
    ADD CONSTRAINT "task_group_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_groups task_groups_createdByUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_groups
    ADD CONSTRAINT "task_groups_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: task_groups task_groups_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_groups
    ADD CONSTRAINT "task_groups_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: task_status_histories task_status_histories_actorUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_status_histories
    ADD CONSTRAINT "task_status_histories_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: task_status_histories task_status_histories_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_status_histories
    ADD CONSTRAINT "task_status_histories_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_targets task_targets_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_targets
    ADD CONSTRAINT "task_targets_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tasks tasks_createdByUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "tasks_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: tasks tasks_departmentContextId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "tasks_departmentContextId_fkey" FOREIGN KEY ("departmentContextId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tasks tasks_groupLeaderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "tasks_groupLeaderId_fkey" FOREIGN KEY ("groupLeaderId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tasks tasks_parentTaskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "tasks_parentTaskId_fkey" FOREIGN KEY ("parentTaskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: uploaded_files uploaded_files_uploadedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.uploaded_files
    ADD CONSTRAINT "uploaded_files_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: user_approval_requests user_approval_requests_requestedDepartmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_approval_requests
    ADD CONSTRAINT "user_approval_requests_requestedDepartmentId_fkey" FOREIGN KEY ("requestedDepartmentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_approval_requests user_approval_requests_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_approval_requests
    ADD CONSTRAINT "user_approval_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_notification_preferences user_notification_preferences_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_notification_preferences
    ADD CONSTRAINT "user_notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_roles user_roles_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_roles user_roles_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: vault_transactions vault_transactions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vault_transactions
    ADD CONSTRAINT "vault_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: vault_transactions vault_transactions_vaultId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vault_transactions
    ADD CONSTRAINT "vault_transactions_vaultId_fkey" FOREIGN KEY ("vaultId") REFERENCES public.talent_retention_vaults(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: vesting_milestones vesting_milestones_vaultId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vesting_milestones
    ADD CONSTRAINT "vesting_milestones_vaultId_fkey" FOREIGN KEY ("vaultId") REFERENCES public.talent_retention_vaults(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: violations violations_confirmedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.violations
    ADD CONSTRAINT "violations_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: violations violations_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.violations
    ADD CONSTRAINT "violations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: violations violations_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.violations
    ADD CONSTRAINT "violations_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: warehouse_stocks warehouse_stocks_materialId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warehouse_stocks
    ADD CONSTRAINT "warehouse_stocks_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES public.materials(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: warehouse_stocks warehouse_stocks_warehouseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warehouse_stocks
    ADD CONSTRAINT "warehouse_stocks_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES public.warehouses(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: warehouses warehouses_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT "warehouses_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: warehouses warehouses_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT "warehouses_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: warehouses warehouses_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT "warehouses_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: warehouses warehouses_managerUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT "warehouses_managerUserId_fkey" FOREIGN KEY ("managerUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: wifi_configs wifi_configs_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wifi_configs
    ADD CONSTRAINT "wifi_configs_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict OKBOB78cjq7bSaOeZ9h87eII6jkLqGxMgmdRglKhdFKzWGkfshwDvc0VjZAGC1v

