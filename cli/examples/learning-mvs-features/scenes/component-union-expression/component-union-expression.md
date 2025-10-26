## Component

`component` node is used to select a subset of the parent structure. 

A component can be defined by:

- static selectors: "all", "polymer", "protein", "nucleic", "branched", "ligand", "ion", "water",
- component expression: selecting by entity ID, chain ID, residue numbers, atom names etc.,
- **union component expression: an array of simple component expressions.**


```js
builder
  .download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/1a34.bcif' })
  .parse({ format: 'bcif' })
  .modelStructure({ })

  .component({ selector: [
    { 
      label_asym_id: 'A',
      beg_label_seq_id: 37,
      end_label_seq_id: 158,
    },
    { 
      label_asym_id: 'B',
    },
  ] })
  
  .representation({ type: 'cartoon' });
```

[Documentation for component](https://molstar.org/mol-view-spec-docs/tree-schema/#component)

[Documentation for selectors](https://molstar.org/mol-view-spec-docs/selectors/)

---

[&#x2B05; Back to *Basic workflow*](#intro)
