## Parse

`parse` node is used to parse raw structural data and supports a variety of common file formats (**mmcif**, **bcif**, **pdb**, **xyz**, **mol**, **mol2**, **gro**, **lammpstrj**, **sdf**, **xtc**, **pdbqt**, **map**).

It is recommended to use Binary CIF (**bcif**) files whenever possible, as they provide good compression and thus reduce the amount of downloaded data.

```js
builder
  .download({ url: 
  'https://www.ebi.ac.uk/pdbe/entry-files/download/1cbs.bcif'
  })
  
  .parse({ format: 'bcif' })

  .modelStructure({ })
  .component({ selector: 'all' })
  .representation({ type: 'cartoon' });
```

[Documentation for parse](https://molstar.org/mol-view-spec-docs/tree-schema/#parse)

---

[&#x2B05; Back to *Basic workflow*](#intro)
