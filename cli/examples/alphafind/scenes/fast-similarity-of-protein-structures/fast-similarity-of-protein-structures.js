const structure = builder
  .download({ url: 'https://alphafold.ebi.ac.uk/files/AF-A0A1D6JW22-F1-model_v6.pdb' })
  .parse({ format: 'pdb' })
  .modelStructure({})
  .component({})
  .representation({})
  .color({ color: 'red' });
