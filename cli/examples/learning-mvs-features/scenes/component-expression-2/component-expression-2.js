const struct = builder
  .download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/1a34.bcif' })
  .parse({ format: 'bcif' })
  .modelStructure({ });

struct.component().focus();

struct
  .component({ selector: { 
    label_asym_id: 'A',
    beg_label_seq_id: 37,
    end_label_seq_id: 158,
  } })
  .representation({ type: 'cartoon' });
