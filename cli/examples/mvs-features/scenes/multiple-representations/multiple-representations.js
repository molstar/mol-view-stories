const struct = builder
  .download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/3d11.bcif' })
  .parse({ format: 'bcif' })
  .modelStructure({ });

struct.component().focus();

struct
  .component({ selector: 'polymer' })
  .representation({ type: 'cartoon' });
struct
  .component({ selector: 'ion' })
  .representation({ type: 'ball_and_stick' });
struct
  .component({ selector: 'branched' })
  .representation({ type: 'ball_and_stick' });
struct
  .component({ selector: 'branched' })
  .representation({ type: 'carbohydrate', size_factor: 2 });
