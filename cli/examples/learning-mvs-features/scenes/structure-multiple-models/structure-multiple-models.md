## Structure

`structure` node is used to create a structure from parsed data. 

This is available via several builder functions, depending on the desired structure type:

- `modelStructure` for original model coordinates as they are stored in the file, 
- `assemblyStructure` for assembly structure (applies symmetry operators to build biologically relevant assembly),
- `symmetryStructure` for a set of crystal unit cells based on Miller indices,
- `symmetryMatesStructure` for a set of asymmetric units within a radius from the original model.

**Other parameters can also be specified, e.g. model index (for structures with multiple models, like NMR).**

```js
builder
  .download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/1wrf.bcif' })
  .parse({ format: 'bcif' })

  .modelStructure({ model_index: 0 })
  
  .component({ selector: 'all' })
  .representation({ type: 'cartoon' });
```

[Documentation for structure](https://molstar.org/mol-view-spec-docs/tree-schema/#structure)

---

[&#x2B05; Back to *Basic workflow*](#intro)
