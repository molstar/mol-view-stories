builder
  .download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/1cbs_updated.cif' })
  .parse({ format: 'mmcif' })
  .modelStructure({ })
  .component({ selector: 'all' })
  .representation({ type: 'cartoon' });
