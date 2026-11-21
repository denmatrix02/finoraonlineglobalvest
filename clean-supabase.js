import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://wovkbicnwygbyhtxpjqk.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvdmtiaWNud3lnYnlodHhwanFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2NzQ1MjQsImV4cCI6MjEwMDI1MDUyNH0.fZurKOb-j-DGOIMmXa52PmQyw-JjLUHFi_24zbI8XXE');

async function cleanData() {
  console.log('Cleaning transactions...');
  const { data: txs } = await supabase.from('transactions').select('*');
  for (const tx of txs || []) {
    let updated = false;
    let newCat = tx.category;
    let newNote = tx.note;
    if (newCat && (newCat.includes('Virtual') || newCat.includes('virtual'))) {
      newCat = newCat.replace(/Virtual Minting/ig, 'Admin Credit');
      newCat = newCat.replace(/virtual/ig, '');
      updated = true;
    }
    if (newNote && (newNote.includes('Virtual') || newNote.includes('virtual'))) {
      newNote = newNote.replace(/virtual ecosystem/ig, 'ecosystem');
      newNote = newNote.replace(/virtual transfer/ig, 'transfer');
      newNote = newNote.replace(/virtual loans/ig, 'loans');
      newNote = newNote.replace(/virtual credits/ig, 'funds');
      newNote = newNote.replace(/virtual currency/ig, 'funds');
      newNote = newNote.replace(/virtual/ig, '');
      updated = true;
    }
    if (updated) {
      await supabase.from('transactions').update({ category: newCat, note: newNote }).eq('id', tx.id);
      console.log('Updated tx:', tx.id);
    }
  }

  console.log('Cleaning messages...');
  const { data: msgs } = await supabase.from('messages').select('*');
  for (const msg of msgs || []) {
    if (msg.content && (msg.content.includes('Virtual') || msg.content.includes('virtual'))) {
      let newContent = msg.content;
      newContent = newContent.replace(/virtual credits/ig, 'funds');
      newContent = newContent.replace(/virtual currency/ig, 'funds');
      newContent = newContent.replace(/virtual/ig, '');
      await supabase.from('messages').update({ content: newContent }).eq('id', msg.id);
      console.log('Updated msg:', msg.id);
    }
  }
  console.log('Done');
}
cleanData();
