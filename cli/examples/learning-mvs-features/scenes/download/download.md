## Download

`download` node is used to get structural data. It must define the source URL, which can be:

- `http://` or `https://` to get data from the web
- `file://` to get data from a local disk (only applies in some contexts, e.g. command-line, not in browser)
- Relative URL to get data from the current website, or to get assets packed along within a [MVSX file](https://molstar.org/mol-view-spec-docs/#mvsx)

```js
builder.download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/1cbs_updated.cif' });

builder.download({ url: 'file:///home/bob/1cbs.cif' });

builder.download({ url: './1cbs.cif' });
```

[Documentation for download](https://molstar.org/mol-view-spec-docs/tree-schema/#download)

---

[&#x2B05; Back to *Basic workflow*](#intro)
