## Annotations

### Generic color themes

When applying color from annotations, color assignment can be customized via generic color themes.

- **Categorical themes: map a categorical variable (e.g. residue name) to color**
- Discrete themes: map ranges of a numeric variable (e.g. pLDDT) to discrete colors
- Continuous themes: map a numeric variable (e.g. B-factor) to a continuous color palette

```js
repr.colorFromSource({ 
  schema: 'all_atomic',
  category_name: 'atom_site',
  field_name: 'label_comp_id',
  palette: { 
    kind: 'categorical', 
    colors: 'ResidueName',
    missing_color: 'yellow'
  },
});
```

[Documentation for annotations](https://molstar.org/mol-view-spec-docs/annotations/)

---

[&#x2B05; Back to *Basic workflow*](#intro)
