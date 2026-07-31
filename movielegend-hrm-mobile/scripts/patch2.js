const fs = require('fs');
const path = 'src/features/attendance/AttendanceScreens.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add import for SafeAreaView
if (!code.includes('SafeAreaView')) {
  code = code.replace(/import \{ View,?[^}]*\} from 'react-native';/, (match) => match + '\nimport { SafeAreaView } from \'react-native-safe-area-context\';');
} else if (!code.includes('react-native-safe-area-context')) {
  code = code.replace(/(import .* from 'react-native';)/, (match) => match + '\nimport { SafeAreaView } from \'react-native-safe-area-context\';');
}

// 2. Replace <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}> with <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
code = code.replace(/<View style=\{\{\s*flex:\s*1,\s*backgroundColor:\s*'#F9FAFB'\s*\}\}>/g, '<SafeAreaView style={{ flex: 1, backgroundColor: \'#F9FAFB\' }}>');

// 3. Since <SafeAreaView> is the root element for those screens, we must also replace the closing </View> for those specific screens.
// But it's hard to match the exact closing </View> with regex. 
// A better way is to replace paddingBottom: 100 with useSafeAreaInsets. Wait, they specifically said "chua b?c safee area".
// Let's use Screen component which is already in the project! 
// Wait, is Screen exported from '../../components/Screen'? Let's check imports.
