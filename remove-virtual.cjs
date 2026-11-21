const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js') || fullPath.endsWith('.html')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      content = content.replace(/transferVirtualFunds/g, 'transferFunds');
      content = content.replace(/mintVirtualCurrency/g, 'mintCurrency');
      content = content.replace(/applyForVirtualLoan/g, 'applyForLoan');
      content = content.replace(/Virtual Minting/ig, 'Admin Credit');
      content = content.replace(/virtual ecosystem/ig, 'ecosystem');
      content = content.replace(/virtual transfer/ig, 'transfer');
      content = content.replace(/virtual loans/ig, 'loans');
      content = content.replace(/virtual credits/ig, 'funds');
      content = content.replace(/virtual currency/ig, 'funds');
      content = content.replace(/Virtual Account/ig, 'Account');
      content = content.replace(/Virtual Loan/ig, 'Loan');
      content = content.replace(/virtual grant/ig, 'grant');
      content = content.replace(/Virtual Banking/ig, 'Banking');
      
      fs.writeFileSync(fullPath, content);
    }
  }
}

replaceInDir(path.join(__dirname, 'src'));
replaceInDir(path.join(__dirname, 'public'));
let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
html = html.replace(/Virtual Banking/ig, 'Banking');
html = html.replace(/virtual loans/ig, 'loans');
fs.writeFileSync(path.join(__dirname, 'index.html'), html);
