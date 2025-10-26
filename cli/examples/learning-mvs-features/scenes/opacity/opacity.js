const struct = builder
  .download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/9rxg.bcif' })
  .parse({ format: 'bcif' })
  .modelStructure({ });
const repr = struct
  .component({ })
  .focus()
  .representation({ type: 'cartoon' });

repr
  .color({ color: '#ffa500', selector: { label_asym_id: 'A' } })
  .color({ color: '#005aff', selector: { label_asym_id: 'B' } })
  .color({ color: '#00ffa5', selector: { label_asym_id: 'C' } })
  .color({ color: '#ff005a', selector: { label_asym_id: 'D' } });

repr.opacity({ opacity: 0.4 });