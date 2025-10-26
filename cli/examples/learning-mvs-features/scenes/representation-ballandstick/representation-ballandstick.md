## Representation

`representation` node adds a 3D visual representation of a structure component.

A wide range of representation types is supported: cartoon, backbone, **ball_and_stick**, line, spacefill, carbohydrate, surface.

```js
builder
  .download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/3d11.bcif' })
  .parse({ format: 'bcif' })
  .modelStructure({ })
  .component({ })

  .representation({ type: 'ball_and_stick' });
```

[Documentation for representation](https://molstar.org/mol-view-spec-docs/tree-schema/#representation)

---

[&#x2B05; Back to *Basic workflow*](#intro)
