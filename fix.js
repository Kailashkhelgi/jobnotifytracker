const fs = require('fs');
let t = fs.readFileSync('app.js', 'utf8');

// Fix start tags: `< div ` -> `<div `
t = t.replace(/<[ \t]+([a-zA-Z0-9-]+)/g, '<$1');

// Fix closing tags: `</ div ` -> `</div ` or `< /div` -> `</div`
t = t.replace(/<\/[ \t]+([a-zA-Z0-9-]+)/g, '</$1');
t = t.replace(/<[ \t]+\/[ \t]*([a-zA-Z0-9-]+)/g, '</$1');

// Fix ending bracket: ` >` -> `>`
t = t.replace(/([a-zA-Z0-9-"'%])[ \t]+>/g, '$1>');

fs.writeFileSync('app.js', t);
console.log('Fixed tags safely');
