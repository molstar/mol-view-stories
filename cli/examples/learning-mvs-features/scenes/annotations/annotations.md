## Annotations

Annotations allow to separate details about components, colors, labels, and tooltips from the main view definition. This helps to keep the view definition concise and generic, and allows efficient visualization even as the data size grows. 

- Annotation data are stored in a separate file (asset) in CIF, BCIF, or JSON format. 
- Annotation data are referenced via `colorFromUri`, `labelFromUri`, `tooltipFromUri`, `componentFromUri` methods.

```js
repr.colorFromUri({ 
  uri: './annotations-9rxg.cif',
  format: 'cif',
  schema: 'all_atomic',
  category_name: 'annotations',
  field_name: 'color',
});

struct.labelFromUri({ 
  uri: './annotations-9rxg.cif',
  format: 'cif',
  schema: 'all_atomic',
  category_name: 'annotations',
  field_name: 'label',
});
```

Asset ./annotations-9rxg.cif:

```
data_annotations_9rxg

loop_
_annotations.label_asym_id
_annotations.color
_annotations.label
A  '#ffa500' 'Orange chain'
B  '#005aff' 'Blue chain'
C  '#00ffa5' 'Green chain'
D  '#ff005a' 'Red chain'
```

Assets can be completely separate files served from arbitrary URL, or they can be packed along with the main view description (`index.mvsj`) into a [MVSX file](https://molstar.org/mol-view-spec-docs/#mvsx). In the MolViewStories builder UI, assets can be added via *Story Options > Asset Upload*.

[Documentation for annotations](https://molstar.org/mol-view-spec-docs/annotations/)

---

[&#x2B05; Back to *Basic workflow*](#intro)
