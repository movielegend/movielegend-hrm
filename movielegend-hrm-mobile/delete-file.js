const fs = require('fs');
try {
  fs.unlinkSync('d:\\MovieLegend\\movielegend-hrm-mobile\\app\\employee\\newsfeed\\index.tsx');
  console.log('Deleted successfully');
} catch (e) {
  console.error(e);
}
