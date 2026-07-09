const fs = require('fs');
let content = fs.readFileSync('src/features/tasks/TaskScreens.tsx', 'utf8');

// 1. Add useCompleteTask hook
content = content.replace(import { useLocalSearchParams, useRouter } from 'expo-router';, import { useLocalSearchParams, useRouter } from 'expo-router';\nimport { useCompleteTask } from '../../hooks/useTasks';);

// 2. Add complete hook call inside TaskDetailScreen
content = content.replace(const review = useReviewTaskAssignment(id);, const review = useReviewTaskAssignment(id);\n    const completeTask = useCompleteTask(id ?? ''););

// 3. Add Subtasks section to TaskDetailScreen UI
const subtaskSection = \
        {item.childTasks?.length > 0 ? (
          <SectionCard title="Công vi?c con (Subtasks)">
            {item.childTasks.map(child => (
              <Pressable key={child.id} style={[styles.inlinePanel, { flexDirection: 'column', alignItems: 'flex-start' }]} onPress={() => router.push(\/\/tasks/\\)}>
                <View style={{ flexDirection: 'row', width: '100%', alignItems: 'center' }}>
                  <Text style={[styles.titleText, { flex: 1 }]}>{child.title}</Text>
                  <TaskStatusBadge status={child.status} />
                </View>
                <Text style={styles.metaSmall}>{child.taskCode}</Text>
              </Pressable>
            ))}
          </SectionCard>
        ) : null}

        {item.groupLeaderId === user?.id && item.status !== 'COMPLETED' ? (
          <SectionCard title="Qu?n lý Nhóm (Leader)">
            <SecondaryButton onPress={() => router.push(\/\/tasks/create?parentTaskId=\\)}>
              + Thêm công vi?c con
            </SecondaryButton>
            <View style={{ marginTop: spacing.md }}>
              <PrimaryButton 
                loading={completeTask.isPending}
                onPress={() => void run(() => completeTask.mutateAsync(), 'Ðã hoàn thành công vi?c nhóm')}
              >
                Hoàn thành Task Nhóm
              </PrimaryButton>
            </View>
          </SectionCard>
        ) : null}
\;

content = content.replace(        {canReview ? (, subtaskSection + '\n        {canReview ? (');

fs.writeFileSync('src/features/tasks/TaskScreens.tsx', content);
console.log('TaskScreens updated!');
