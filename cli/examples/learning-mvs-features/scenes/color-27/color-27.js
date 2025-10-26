const struct = builder
  .download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/9rxg.bcif' })
  .parse({ format: 'bcif' })
  .modelStructure({ });
const repr = struct
  .component({ })
  .focus()
  .representation({ type: 'cartoon' });

repr.color({ color: 'orange', selector: { label_asym_id: 'A' } });
