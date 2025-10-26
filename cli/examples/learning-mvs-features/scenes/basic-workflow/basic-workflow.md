## Basic workflow

A typical MolViewSpec view definition contains at least 5 basic steps:

1. **Download** data &ensp;[&#x2B95;](#download)
2. **Parse** data &ensp;[&#x2B95;](#parse)
3. Create **structure** &ensp;[&#x2B95;](#structure_model)
4. Select a **component** of structure &ensp;[&#x2B95;](#component_all)
5. Create a 3D **representation** &ensp;[&#x2B95;](#representation_cartoon)

```js
builder
  .download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/1cbs_updated.cif' })
  .parse({ format: 'mmcif' })
  .modelStructure({ })
  .component({ selector: 'all' })
  .representation({ type: 'cartoon' });
```

This basic view can be further customized and extended by:

- Colors &ensp;[&#x2B95;](#color)
- Opacity &ensp;[&#x2B95;](#opacity)
- Labels &ensp;[&#x2B95;](#labels)
- Tooltips &ensp;[&#x2B95;](#tooltips)
- Annotations &ensp;[&#x2B95;](#annotations)
- Transforms &ensp;[&#x2B95;](#transforms)
- Volumetric data &ensp;[&#x2B95;](#volumes)
- Geometrical primitives &ensp;[&#x2B95;](#primitives)
- Camera and canvas settings &ensp;[&#x2B95;](#camera)
- Interactive stories &ensp;[&#x2B95;](#snapshot_A)
- Animations &ensp;[&#x2B95;](#animations)
- Custom data and extensions &ensp;[&#x2B95;](#custom_data)

---

[&#x2B05; Back to start](#start)
