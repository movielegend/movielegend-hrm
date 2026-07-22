
const fs = require("fs");
const path = require("path");

function walkSync(dir, filelist) {
  const files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = walkSync(path.join(dir, file), filelist);
    }
    else {
      if (file.endsWith(".tsx") || file.endsWith(".ts")) {
        filelist.push(path.join(dir, file));
      }
    }
  });
  return filelist;
}

const allFiles = walkSync("f:/CODE/Movie Legend/movielegend-hrm/movielegend-hrm-mobile/src/features");

allFiles.forEach(file => {
  let content = fs.readFileSync(file, "utf8");
  const newContent = content.replace(/\.items\.length/g, ".items?.length");
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, "utf8");
    console.log("Fixed " + file);
  }
});

