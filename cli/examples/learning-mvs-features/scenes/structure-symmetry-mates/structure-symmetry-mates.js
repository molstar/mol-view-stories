builder
  .download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/1a34.bcif' })
  .parse({ format: 'bcif' })
  .symmetryMatesStructure({ radius: 100 })
  .component({ selector: 'all' })
  .representation({ type: 'cartoon' });
