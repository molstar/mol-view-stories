## Annotations

### Annotations from source

Annotation data can also be stored together with the structural data.

- Annotation data are stored together with the structural data in the source CIF or BCIF file.
- Annotation data are referenced via `colorFromSource`, `labelFromSource`, `tooltipFromSource`, `componentFromSource` methods.

```js
struct.labelFromSource({ 
  schema: 'all_atomic',
  category_name: 'pdbx_poly_seq_scheme',
  field_name: 'mon_id',
  field_remapping: { 
    label_asym_id: 'asym_id', 
    label_seq_id: 'seq_id',
  },
});
```

Source file (https://www.ebi.ac.uk/pdbe/entry-files/download/9rxg_updated.cif):

```
...
loop_
_pdbx_poly_seq_scheme.asym_id
_pdbx_poly_seq_scheme.entity_id
_pdbx_poly_seq_scheme.seq_id
_pdbx_poly_seq_scheme.mon_id
_pdbx_poly_seq_scheme.ndb_seq_num
_pdbx_poly_seq_scheme.pdb_seq_num
_pdbx_poly_seq_scheme.auth_seq_num
_pdbx_poly_seq_scheme.pdb_mon_id
_pdbx_poly_seq_scheme.auth_mon_id
_pdbx_poly_seq_scheme.pdb_strand_id
_pdbx_poly_seq_scheme.pdb_ins_code
_pdbx_poly_seq_scheme.hetero
A 1 1 VAL 1 1 ? ? ? A . n
A 1 2 LEU 2 2 2 LEU LEU A . n
A 1 3 SER 3 3 3 SER SER A . n
A 1 4 ALA 4 4 4 ALA ALA A . n
A 1 5 ALA 5 5 5 ALA ALA A . n
A 1 6 ASP 6 6 6 ASP ASP A . n
A 1 7 LYS 7 7 7 LYS LYS A . n
A 1 8 GLY 8 8 8 GLY GLY A . n
A 1 9 ASN 9 9 9 ASN ASN A . n
...
```

[Documentation for annotations](https://molstar.org/mol-view-spec-docs/annotations/)

---

[&#x2B05; Back to *Basic workflow*](#intro)
