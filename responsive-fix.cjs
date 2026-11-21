const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      content = content.replace(
        /<div className="flex bg-\[#111\] min-h-screen text-white">/g,
        '<div className="flex flex-col md:flex-row bg-[#111] min-h-screen text-white pb-16 md:pb-0">'
      );
      
      content = content.replace(
        /<div className="flex min-h-screen bg-\[#111111\]">/g,
        '<div className="flex flex-col md:flex-row min-h-screen bg-[#111111] pb-16 md:pb-0">'
      );
      
      content = content.replace(
        /<div className="flex min-h-screen bg-\[#141414\]">/g,
        '<div className="flex flex-col md:flex-row min-h-screen bg-[#141414] pb-16 md:pb-0">'
      );

      fs.writeFileSync(fullPath, content);
    }
  }
}

replaceInDir(path.join(__dirname, 'src/pages'));
