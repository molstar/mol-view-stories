## Color

`color` node can be used to add color to a 3D visual representation.

```js
const struct = builder
  .download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/9rxg.bcif' })
  .parse({ format: 'bcif' })
  .modelStructure({ });
const repr = struct
  .component({ })
  .representation({ type: 'cartoon' });

repr.color({ color: 'orange' });
```

[Documentation for color](https://molstar.org/mol-view-spec-docs/tree-schema/#color)

---

[&#x2B05; Back to *Basic workflow*](#intro)
