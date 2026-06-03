const fs = require('fs');
let content = fs.readFileSync('src/components/Crm/UnitSwitcher.tsx', 'utf-8');

const target1 = `    const score = avgScore(unitLeads);
    
    return { dangerCount, score };`;

const replace1 = `    const score = avgScore(unitLeads);
    
    const lastActiveAt = unitLeads.reduce((max, l) => {
      const time = new Date(l.last_message_at || l.created_at).getTime();
      return time > max ? time : max;
    }, 0);
    const isInactive = lastActiveAt === 0 || (Date.now() - lastActiveAt) > 24 * 60 * 60 * 1000;

    return { dangerCount, score, isInactive };`;

if (!content.includes(target1)) { console.error('Target 1 not found'); process.exit(1); }
content = content.replace(target1, replace1);

const target2 = `                        {dangerCount > 0 && <p className="text-[10px] font-bold text-rose-500 mt-0.5">{dangerCount} LEAD{dangerCount > 1 && 'S'} EM RISCO</p>}`;
const replace2 = `                        {dangerCount > 0 && <p className="text-[10px] font-bold text-rose-500 mt-0.5">{dangerCount} LEAD{dangerCount > 1 && 'S'} EM RISCO</p>}
                        {isInactive && opt.id !== 'all' && <p className="text-[10px] font-black text-rose-500 mt-0.5 flex items-center gap-1 bg-rose-500/10 px-1.5 py-0.5 rounded-sm w-fit uppercase" title="Mais de 24h sem mensagens. O WhatsApp caiu?"><AlertTriangle className="w-3 h-3"/> Sem Conexão?</p>}`;

if (!content.includes(target2)) { console.error('Target 2 not found'); process.exit(1); }
content = content.replace(target2, replace2);

const target3 = `  const { dangerCount: selectedDanger, score: selectedScore } = getUnitMetrics(selectedUnit.id);`;
const replace3 = `  const { dangerCount: selectedDanger, score: selectedScore, isInactive: selectedIsInactive } = getUnitMetrics(selectedUnit.id);`;

if (!content.includes(target3)) { console.error('Target 3 not found'); process.exit(1); }
content = content.replace(target3, replace3);

const target4 = `          <span className="font-bold text-foreground tracking-wide">{selectedUnit.name}</span>`;
const replace4 = `          <span className="font-bold text-foreground tracking-wide flex items-center gap-2">
            {selectedUnit.name}
            {selectedIsInactive && selectedUnit.id !== 'all' && (
               <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded-sm">
                 <AlertTriangle className="w-3 h-3" /> Off?
               </span>
            )}
          </span>`;

if (!content.includes(target4)) { console.error('Target 4 not found'); process.exit(1); }
content = content.replace(target4, replace4);

const target5 = `                const { dangerCount, score } = getUnitMetrics(opt.id);`;
const replace5 = `                const { dangerCount, score, isInactive } = getUnitMetrics(opt.id);`;

if (!content.includes(target5)) { console.error('Target 5 not found'); process.exit(1); }
content = content.replace(target5, replace5);

fs.writeFileSync('src/components/Crm/UnitSwitcher.tsx', content);
console.log('Success UnitSwitcher patch');
