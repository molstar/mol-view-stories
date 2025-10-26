const struct = builder
  .download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/1cbs.bcif' })
  .parse({ format: 'bcif' })
  .modelStructure({ ref: 'struct' });

struct
  .component({ selector: 'polymer' })
  .representation({ type: 'cartoon' })
  .color({ color: '#ffa500' });

struct
  .component({ selector: 'ligand' })
  .representation({ type: 'spacefill' })
  .color({ color: '#005aff' });

struct
  .primitives({ label_attachment: 'bottom-center' })
  .label({
    position: {},
    text: 'MolViewSpec',
    label_size: 6,
  });

struct
  .primitives({ label_attachment: 'top-center' })
  .label({
    position: {},
    text: 'Features Overview',
    label_size: 6,
  });

struct.component().focus({ direction:[0.4, -0.8, -0.4], up:[-0.1, 0.4, -0.9] });
  