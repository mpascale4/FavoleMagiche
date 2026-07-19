const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/let title = "Ops! Magia Interrotta ✨";\\n      let message = "La fatina delle storie ha avuto un piccolo contrattempo.";\\n      let reason = "Sembra che i folletti abbiano staccato un filo magico! Prova a ripartire, di solito funziona.";/, 
\`let title = "Ops! Magia Interrotta ✨";
      let message = "La fatina delle storie ha avuto un piccolo contrattempo.";
      let reason = "Sembra che i folletti abbiano staccato un filo magico! Prova a ripartire, di solito funziona.";\`);

fs.writeFileSync('src/App.tsx', code);
