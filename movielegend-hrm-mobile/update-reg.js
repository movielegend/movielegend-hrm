const fs = require('fs');
const path = 'src/features/registration/RegistrationSteps.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldComponent = "export function RegistrationDepartmentScreen() {
  const router = useRouter();
  const { values, update } = useRegistration();
  const [search, setSearch] = useState('');
  const departments = usePublicDepartments({ search });
  const { handleSubmit, setValue, watch, formState: { errors } } = useForm<DepartmentStepValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: { requestedDepartmentId: values.requestedDepartmentId },
  });
  const selectedId = watch('requestedDepartmentId');
  const submit = handleSubmit((data) => {
    Keyboard.dismiss();
    update(data);
    router.push('/register/review');
  });
  const activeDepartments = departments.data?.items.filter((department) => department.isActive) ?? [];
  return (
    <Screen>
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <ScrollView
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ marginBottom: 24, paddingTop: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Pressable onPress={() => router.back()} style={{ padding: 4, marginRight: 12 }}>
                <Ionicons name="arrow-back" size={24} color="#111827" />
              </Pressable>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>Chọn phòng ban</Text>
            </View>
            <StepBar currentStep={3} />
          </View>

          <SearchInput value={search} onChangeText={setSearch} placeholder="Tìm phòng ban..." />
          <View style={{ height: 16 }} />

          {departments.isLoading ? <LoadingState /> : null}
          {departments.isError ? <ErrorState error={departments.error} onRetry={() => void departments.refetch()} /> : null}
          {!departments.isLoading && !activeDepartments.length ? <EmptyState title="Không có phòng ban khả dụng" /> : null}
          
          <View style={{ gap: 12 }}>
            {activeDepartments.map((department) => (
              <DepartmentOption key={department.id} department={department} selected={selectedId === department.id} onPress={() => setValue('requestedDepartmentId', department.id, { shouldValidate: true })} />
            ))}
          </View>
          
          {errors.requestedDepartmentId ? <Text style={{ color: '#EF4444', fontSize: 13, marginTop: 12 }}>{errors.requestedDepartmentId.message}</Text> : null}
        </ScrollView>
        
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', padding: 24, borderTopWidth: 1, borderTopColor: '#ECEEF3' }}>
           <Pressable onPress={submit} style={{ backgroundColor: '#111827', height: 60, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700' }}>TIẾP TỤC</Text>
            </Pressable>
        </View>
      </View>
    </Screen>
  );
}";

const newComponent = export function RegistrationDepartmentScreen() {
  const router = useRouter();
  const { values, update } = useRegistration();
  const [search, setSearch] = useState('');
  const departments = usePublicDepartments({ search });
  
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  
  const { handleSubmit, setValue, watch, formState: { errors } } = useForm<DepartmentStepValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: { requestedDepartmentId: values.requestedDepartmentId },
  });
  const selectedId = watch('requestedDepartmentId');
  
  const submit = handleSubmit((data) => {
    Keyboard.dismiss();
    update(data);
    router.push('/register/review');
  });
  
  const activeDepartments = departments.data?.items.filter((department) => department.isActive) ?? [];
  
  const regionsMap = new Map();
  activeDepartments.forEach(dept => {
    if (dept.branch?.region) {
      regionsMap.set(dept.branch.region.id, dept.branch.region);
    }
  });
  const regions = Array.from(regionsMap.values());

  const branchesMap = new Map();
  if (selectedRegionId) {
    activeDepartments.forEach(dept => {
      if (dept.branch && dept.branch.region?.id === selectedRegionId) {
        branchesMap.set(dept.branch.id, dept.branch);
      }
    });
  }
  const branches = Array.from(branchesMap.values());

  const filteredDepartments = selectedBranchId 
    ? activeDepartments.filter(dept => dept.branch?.id === selectedBranchId)
    : [];

  const handleBack = () => {
    if (selectedBranchId) {
      setSelectedBranchId(null);
      setValue('requestedDepartmentId', '', { shouldValidate: true });
    } else if (selectedRegionId) {
      setSelectedRegionId(null);
    } else {
      router.back();
    }
  };

  const getTitle = () => {
    if (!selectedRegionId) return 'Chọn Miền';
    if (!selectedBranchId) return 'Chọn Chi nhánh';
    return 'Chọn Phòng ban';
  };

  return (
    <Screen>
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <ScrollView
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ marginBottom: 24, paddingTop: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Pressable onPress={handleBack} style={{ padding: 4, marginRight: 12 }}>
                <Ionicons name="arrow-back" size={24} color="#111827" />
              </Pressable>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>{getTitle()}</Text>
            </View>
            <StepBar currentStep={3} />
          </View>

          <SearchInput value={search} onChangeText={setSearch} placeholder="Tìm kiếm..." />
          <View style={{ height: 16 }} />

          {departments.isLoading ? <LoadingState /> : null}
          {departments.isError ? <ErrorState error={departments.error} onRetry={() => void departments.refetch()} /> : null}
          {!departments.isLoading && !activeDepartments.length ? <EmptyState title="Không có dữ liệu khả dụng" /> : null}
          
          <View style={{ gap: 12 }}>
            {!selectedRegionId && regions.map(region => (
              <Pressable 
                key={region.id} 
                onPress={() => setSelectedRegionId(region.id)}
                style={{ backgroundColor: '#FFFFFF', borderColor: '#ECEEF3', borderRadius: 12, borderWidth: 1, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <Text style={{ color: '#111827', fontSize: 16, fontWeight: '700' }}>{region.name}</Text>
                <Ionicons name="chevron-forward" size={24} color="#CBD5E1" />
              </Pressable>
            ))}

            {selectedRegionId && !selectedBranchId && branches.map(branch => (
              <Pressable 
                key={branch.id} 
                onPress={() => setSelectedBranchId(branch.id)}
                style={{ backgroundColor: '#FFFFFF', borderColor: '#ECEEF3', borderRadius: 12, borderWidth: 1, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <Text style={{ color: '#111827', fontSize: 16, fontWeight: '700' }}>{branch.name}</Text>
                <Ionicons name="chevron-forward" size={24} color="#CBD5E1" />
              </Pressable>
            ))}

            {selectedBranchId && filteredDepartments.map((department) => (
              <DepartmentOption 
                key={department.id} 
                department={department} 
                selected={selectedId === department.id} 
                onPress={() => setValue('requestedDepartmentId', department.id, { shouldValidate: true })} 
              />
            ))}
          </View>
          
          {errors.requestedDepartmentId ? <Text style={{ color: '#EF4444', fontSize: 13, marginTop: 12 }}>{errors.requestedDepartmentId.message}</Text> : null}
        </ScrollView>
        
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', padding: 24, borderTopWidth: 1, borderTopColor: '#ECEEF3' }}>
           <Pressable 
             onPress={submit} 
             disabled={!selectedId}
             style={{ backgroundColor: !selectedId ? '#9CA3AF' : '#111827', height: 60, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700' }}>TIẾP TỤC</Text>
            </Pressable>
        </View>
      </View>
    </Screen>
  );
};

content = content.replace(
  oldComponent.replace(/^"/, '').replace(/"$/, ''),
  newComponent
);
fs.writeFileSync(path, content);
console.log('Successfully updated RegistrationSteps.tsx');
