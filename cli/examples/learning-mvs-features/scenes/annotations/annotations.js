const struct = builder
  .download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/9rxg.bcif' })
  .parse({ format: 'bcif' })
  .modelStructure({ });
const repr = struct
  .component({ })
  .focus()
  .representation({ type: 'cartoon' });

repr.colorFromUri({ 
  uri: './annotations-9rxg.cif',
  format: 'cif',
  schema: 'all_atomic',
  category_name: 'annotations',
  field_name: 'color',
});

struct.labelFromUri({ 
  uri: './annotations-9rxg.cif',
  format: 'cif',
  schema: 'all_atomic',
  category_name: 'annotations',
  field_name: 'label',
});
