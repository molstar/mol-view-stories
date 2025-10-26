builder
  .download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/1wrf.bcif' })
  .parse({ format: 'bcif' })
  .modelStructure({ model_index: 2 })
  .component({ selector: 'all' })
  .representation({ type: 'cartoon' });

builder.camera({ position: [4.6, -2.2, 64.7], target: [4.6, -2.2, 14.3] });
