builder
  .download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/1a34.bcif' })
  .parse({ format: 'bcif' })
  .symmetryStructure({ ijk_min: [-1,-1,-1], ijk_max: [1,1,1] })
  .component({ selector: 'all' })
  .representation({ type: 'cartoon' });
