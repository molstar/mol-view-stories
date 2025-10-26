builder
  .download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/1a34.bcif' })
  .parse({ format: 'bcif' })
  .modelStructure({ })
  .component({ selector: 'all' })
  .representation({ type: 'cartoon' });
