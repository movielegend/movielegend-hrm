const { exec } = require('child_process');
exec('npx tsc --noEmit', { stdio: 'pipe' }, (error, stdout, stderr) => {
  const fs = require('fs');
  fs.writeFileSync('ts-output.txt', stdout + '\n' + stderr + '\n' + (error ? error.message : ''));
});
