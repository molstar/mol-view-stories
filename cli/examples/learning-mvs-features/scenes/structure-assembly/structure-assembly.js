builder
  .download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/1a34.bcif' })
  .parse({ format: 'bcif' })
  .assemblyStructure({ assembly_id: '1' })
  .component({ selector: 'all' })
  .representation({ type: 'cartoon' });
