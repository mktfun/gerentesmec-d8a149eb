const fs = require('fs');
let content = fs.readFileSync('src/pages/Index.tsx', 'utf-8');
const target = '<h4 className="text-sm font-bold text-foreground truncate">{m.name}</h4>';
const replacement = `<h4 className="text-sm font-bold text-foreground truncate flex items-center gap-2">
                    {m.name}
                    {m.isInactive && (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded-sm" title="Inativo há mais de 24h">
                        <AlertTriangle className="w-3 h-3" /> Inativo
                      </span>
                    )}
                  </h4>`;
if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync('src/pages/Index.tsx', content);
    console.log('Success');
} else {
    console.log('Not found');
}
