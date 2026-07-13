const { exec } = require('child_process');
exec('npx tsc --noEmit', (error, stdout, stderr) => {
  console.log('STDOUT:', stdout);
  console.log('STDERR:', stderr);
  console.log('ERROR:', error ? error.message : null);
});
