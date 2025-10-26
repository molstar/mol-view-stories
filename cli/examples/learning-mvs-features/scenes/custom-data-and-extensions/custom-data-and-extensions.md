## Custom data and extensions

When creating any MolViewSpec node (`download`, `structure`, `component` etc.), custom data can be added to it.

MolViewSpec code in Molstar allows adding "MVS load extensions" which can read these custom data and apply arbitrary actions. In this way, developers can build customized Molstar instances with additional MolViewSpec features.

Example:

```js
const ligandHEC = struct
  .component({
    selector: { label_comp_id: 'HEC' },
    custom: {
      molstar_show_non_covalent_interactions: true,
    },
  });
```

[Documentation for MVS load extensions](https://molstar.org/mol-view-spec-docs/mvs-molstar-extension/load-extensions/)

---

[&#x2B05; Back to *Basic workflow*](#intro)
