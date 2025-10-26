## Transforms

Rotation and translation can be applied to structures to superpose them.

```js
const struct1 = builder
  .download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/2e2o.bcif' })
  .parse({ format: 'bcif' })
  .modelStructure();

const struct2 = builder
  .download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/2e2n.bcif' })
  .parse({ format: 'bcif' })
  .modelStructure()
  .transform({
    rotation:[
      0.291445, -0.479952, 0.827469,
      0.949818, 0.042465, -0.309906,
      0.113601, 0.876266, 0.468243,
    ],
    translation: [-17.28577537, 3.84218601, 5.61300478],
  });
```

[Documentation for transform](https://molstar.org/mol-view-spec-docs/tree-schema/#transform)

---

[&#x2B05; Back to *Basic workflow*](#intro)
