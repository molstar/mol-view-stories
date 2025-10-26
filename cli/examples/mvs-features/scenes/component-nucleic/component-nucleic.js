const struct = builder
  .download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/1a34.bcif' })
  .parse({ format: 'bcif' })
  .modelStructure({ });

struct.component().focus();

struct
  .component({ selector: 'nucleic' })
  .representation({ type: 'cartoon' });
