# From a graph to a vector

To reach a compressed vector representation, intermediate residue-level vectors are combined, often by summing or averaging. This step compresses the entire 3D structure into a fixed-length numerical representation called a **vector embedding**. The embedding keeps information about residue types, spatial arrangement, and interaction patterns, but in a compact form that machines can compare or analyze. 

Two proteins with similar folds or local environments will have similar embeddings, allowing structural similarity or function to be inferred directly from these vectors.