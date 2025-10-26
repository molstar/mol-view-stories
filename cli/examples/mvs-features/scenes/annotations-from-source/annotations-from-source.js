const struct = builder
  .download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/9rxg.bcif' })
  .parse({ format: 'bcif' })
  .modelStructure({ });
const repr = struct
  .component({ })
  .focus()
  .representation({ type: 'cartoon' });

struct.labelFromSource({ 
  schema: 'all_atomic',
  category_name: 'pdbx_poly_seq_scheme',
  field_name: 'mon_id',
  field_remapping: { 
    label_asym_id: 'asym_id', 
    label_seq_id: 'seq_id',
  },
});
