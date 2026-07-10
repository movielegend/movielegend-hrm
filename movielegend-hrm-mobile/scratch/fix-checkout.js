const fs = require('fs');

function processFile(filename) {
    let code = fs.readFileSync(filename, 'utf8');
    
    // Remove camera related imports and hooks
    code = code.replace(/import \{ CameraView, useCameraPermissions \} from 'expo-camera';\n/g, '');
    code = code.replace(/const \[permission, requestPermission\] = useCameraPermissions\(\);\n/g, '');
    code = code.replace(/const cameraRef = useRef<CameraView>\(null\);\n/g, '');
    
    // Replace permission UI block
    code = code.replace(/if \(\!permission\) \{[\s\S]*?<\/Screen>\n    \);\n  \}/, '');

    // Replace handleConfirm to use checkOut
    const newHandleConfirm = `const handleConfirm = async () => {
    if (locationError || !location) {
      Alert.alert('Lỗi', locationError || 'Đang lấy vị trí, vui lòng chờ...');
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      await checkOut(payload);
      Alert.alert('Thành công', 'Ra ca thành công!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e: any) {
      Alert.alert('Lỗi chấm công', e.message || 'Có lỗi xảy ra khi chấm công.');
    } finally {
      setLoading(false);
    }
  };`;
    
    // We can just use string substitution for handleConfirm
    // Let's replace the whole handleConfirm block
    code = code.replace(/const handleConfirm = async \(\) => \{[\s\S]*?finally \{\s*setLoading\(false\);\s*\}\s*\};\n/g, newHandleConfirm + '\n');
    
    // In case the old handleConfirm didn't get caught because of spacing:
    code = code.replace(/const handleConfirm = async \(\) => \{[\s\S]*?await checkIn\(payload\);[\s\S]*?setLoading\(false\);\s*\}\s*\};/g, newHandleConfirm);

    fs.writeFileSync(filename, code);
}

processFile('app/leader/attendance/check-out.tsx');
processFile('app/employee/attendance/check-out.tsx');
console.log('done');
