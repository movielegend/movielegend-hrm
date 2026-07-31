const fs = require('fs');
const path = 'src/features/attendance/AttendanceScreens.tsx';
let code = fs.readFileSync(path, 'utf8');

const componentRegex = /(export function [A-Za-z0-9_]+\s*\([^)]*\)\s*\{)/g;
let components = [];
let match;
while ((match = componentRegex.exec(code)) !== null) {
  components.push({
    name: match[1],
    index: match.index,
    length: match[0].length
  });
}

for (let i = components.length - 1; i >= 0; i--) {
  const comp = components[i];
  const nextCompIndex = i < components.length - 1 ? components[i + 1].index : code.length;
  const compBody = code.slice(comp.index, nextCompIndex);
  
  if (compBody.includes('paddingBottom: 100')) {
    // Inject useSafeAreaInsets if not present
    if (!compBody.includes('useSafeAreaInsets()')) {
      const injection = '\n  const insets = useSafeAreaInsets();';
      code = code.slice(0, comp.index + comp.length) + injection + code.slice(comp.index + comp.length);
    }
  }
}

code = code.replace(/paddingBottom:\s*100\s*\}/g, 'paddingBottom: 100 + insets.bottom }');

fs.writeFileSync(path, code);
console.log('Fixed paddingBottom in AttendanceScreens.tsx');
