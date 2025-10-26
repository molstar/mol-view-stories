builder
  .download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/3d11.bcif' })
  .parse({ format: 'bcif' })
  .modelStructure({ })
  .component({ })
  .focus()
  .representation({ type: 'carbohydrate', size_factor: 2 });