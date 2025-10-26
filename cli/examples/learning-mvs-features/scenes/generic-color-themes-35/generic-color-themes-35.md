## Annotations

### Generic color themes

When applying color from annotations, color assignment can be customized via generic color themes.

- Categorical themes: map a categorical variable (e.g. residue name) to color
- **Discrete themes: map ranges of a numeric variable (e.g. pLDDT) to discrete colors**
- Continuous themes: map a numeric variable (e.g. B-factor) to a continuous color palette

```js
repr.colorFromSource({ 
  schema: 'all_atomic', 
  category_name: 'atom_site', 
  field_name: 'B_iso_or_equiv', 
  palette: { 
    kind: 'discrete',
    mode: 'absolute',
    colors: [
      ['#0053d6', 90, 100],  // dark blue
      ['#65cbf3', 70, 90],   // light blue
      ['#ffdb13', 50, 70],   // yellow
      ['#ff7d45', 0, 50],    // orange
    ],
  },
});
```

[Documentation for annotations](https://molstar.org/mol-view-spec-docs/annotations/)

---

[&#x2B05; Back to *Basic workflow*](#intro)
