## Color

`color` node can be used to add color to a 3D visual representation.

**Color can be restricted to a part of the structure...**

```js
const struct = builder
  .download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/9rxg.bcif' })
  .parse({ format: 'bcif' })
  .modelStructure({ });
const repr = struct
  .component({ })
  .representation({ type: 'cartoon' });

repr.color({ color: 'orange', selector: { label_asym_id: 'A' } });
```

[Documentation for color](https://molstar.org/mol-view-spec-docs/tree-schema/#color)

[Documentation for selectors](https://molstar.org/mol-view-spec-docs/selectors/)

---

[&#x2B05; Back to *Basic workflow*](#intro)
