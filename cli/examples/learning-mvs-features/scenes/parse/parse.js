builder
  .download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/1cbs.bcif' })
  .parse({ format: 'bcif' })
  .modelStructure({ })
  .component({ selector: 'all' })
  .representation({ type: 'cartoon' });
