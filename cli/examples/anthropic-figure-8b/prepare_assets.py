#!/usr/bin/env python3
"""Extract public structural templates with rigid transforms only (Python stdlib).

Usage: python3 prepare_assets.py /path/to/downloads
Expected: 1hzh.pdb, 9c3c.cif, 5ik8.pdb. No network access or third-party packages.
"""
import json
import math
from pathlib import Path
import shlex
import sys

ROOT = Path(__file__).resolve().parent

def sub(a, b): return [x-y for x, y in zip(a, b)]
def dot(a, b): return sum(x*y for x, y in zip(a, b))
def unit(v):
    n = math.sqrt(dot(v, v))
    if n < 1e-8: raise ValueError('Degenerate orientation')
    return [x/n for x in v]
def cross(a, b): return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]
def center(atoms): return [sum(a['xyz'][i] for a in atoms)/len(atoms) for i in range(3)]

SUGARS = {'NAG', 'BMA', 'MAN', 'GAL', 'FUC'}

def pdb(path, sugars=False):
    atoms = []
    for line in path.read_text().splitlines():
        if line.startswith('ENDMDL'): break
        het = sugars and line.startswith('HETATM') and line[17:20] in SUGARS
        if (line.startswith('ATOM  ') or het) and line[16] in ' A':
            atoms.append(dict(atom=line[12:16].strip(), res=line[17:20], chain=line[21],
                              seq=int(line[22:26]), icode=line[26], xyz=[float(line[i:i+8]) for i in (30,38,46)],
                              element=line[76:78].strip(), het=het))
    return atoms

def cif(path):
    # RCSB atom_site records are one row per line; parse columns by name.
    headers, atoms = [], []
    for line in path.read_text().splitlines():
        if line.startswith('_atom_site.'): headers.append(line.strip().split('.')[1])
        elif line.startswith('ATOM '):
            row = dict(zip(headers, shlex.split(line)))
            if row['pdbx_PDB_model_num'] != '1' or row['label_alt_id'] not in ('.', 'A'): continue
            atoms.append(dict(atom=row['auth_atom_id'], res=row['auth_comp_id'],
                              chain=row['auth_asym_id'], seq=int(row['auth_seq_id']),
                              icode=row.get('pdbx_PDB_ins_code', '?').replace('?', ' '),
                              xyz=[float(row['Cartn_'+i]) for i in 'xyz'], element=row['type_symbol']))
    return atoms

def normalized(atoms, direction=None, origin=None):
    """Align principal length to +Y without scaling or deforming coordinates."""
    ca = [a for a in atoms if a['atom'] == 'CA']
    origin = origin or center(ca)
    points = [sub(a['xyz'], origin) for a in ca]
    if direction is None:
        covariance = [[sum(p[i]*p[j] for p in points) for j in range(3)] for i in range(3)]
        direction = unit([1, 2, 3])
        for _ in range(80): direction = unit([dot(row, direction) for row in covariance])
        # Deterministic sign, not a biological docking orientation.
        if direction[1] < 0: direction = [-x for x in direction]
    y = unit(direction)
    x = unit(cross(y, [0, 0, 1] if abs(y[2]) < .9 else [1, 0, 0]))
    z = cross(x, y)
    return [dict(a, xyz=[dot(sub(a['xyz'], origin), axis) for axis in (x,y,z)]) for a in atoms]

def write(name, atoms, source):
    if not atoms: raise ValueError(f'Empty template: {name}')
    dest = ROOT / 'shared' / 'assets'
    dest.mkdir(parents=True, exist_ok=True)
    lines = ['REMARK   1 '+source, 'REMARK   2 RIGIDLY REORIENTED TEMPLATE; NOT A DOCKED COMPLEX']
    prev = None
    for i, a in enumerate(atoms, 1):
        if prev is not None and a['chain'] != prev: lines.append('TER')
        prev = a['chain']
        x,y,z = a['xyz']
        record = 'HETATM' if a.get('het') else 'ATOM  '
        lines.append(f"{record}{i:5d} {a['atom']:>4s} {a['res']:3s} {a['chain']}{a['seq']:4d}{a['icode']}   {x:8.3f}{y:8.3f}{z:8.3f}  1.00  0.00          {a['element']:>2s}")
    lines.extend(['TER', 'END', ''])
    (dest / (name+'.pdb')).write_text('\n'.join(lines))
    return dict(atoms=len(atoms), source=source,
                bounds=[[round(min(a['xyz'][i] for a in atoms),3),round(max(a['xyz'][i] for a in atoms),3)] for i in range(3)])

def main():
    source = Path(sys.argv[1])
    igg, dg, lg = pdb(source/'1hzh.pdb', sugars=True), cif(source/'9c3c.cif'), pdb(source/'5ik8.pdb')
    stats = {}
    glycans = [a for a in igg if a['het']]
    igg = [a for a in igg if not a['het']]
    fab = [a for a in igg if (a['chain']=='H' and a['seq']<=225) or a['chain']=='L']
    # Orient Fab with variable-domain/paratope end upward, constant end downward.
    var = [a for a in fab if a['seq']<=110 and a['atom']=='CA']
    con = [a for a in fab if a['seq']>=120 and a['atom']=='CA']
    stats['fab'] = write('fab', normalized(fab, sub(center(var),center(con))), 'PDB 1HZH: H 1-225 + L; generic Fab scaffold')
    # Kabat numbering: VH ends at 113 (CH1 starts ASTKGP at 114), VL ends at 107.
    fv = [a for a in fab if a['seq'] <= (113 if a['chain'] == 'H' else 107)]
    stats['fv'] = write('fv', normalized(fv, sub(center(var),center(con))), 'PDB 1HZH: H 1-113 + L 1-107; Fv proxy, no engineered scFv sequence')
    fc = [a for a in igg if a['chain'] in ('H','K') and a['seq']>=230]
    top = [a for a in fc if a['seq']<=250 and a['atom']=='CA']
    bot = [a for a in fc if a['seq']>=440 and a['atom']=='CA']
    # Experimental Asn297 glycans (chains A/B) fill the space between the CH2 domains.
    # The frame comes from CA atoms only, so protein coordinates are unchanged.
    stats['fc'] = write('fc', normalized(fc + glycans, sub(center(top),center(bot))), 'PDB 1HZH: H/K 230-end + Asn297 glycans A/B; generic human IgG1 Fc scaffold')
    # Retain the experimental alpha/beta relationship; omit released alpha NTD.
    dg = [a for a in dg if (a['chain']=='A' and a['seq']>=485) or a['chain']=='B']
    tm = [a for a in dg if a['chain']=='B' and 750<=a['seq']<=774 and a['atom']=='CA']
    outside = [a for a in dg if a['chain']=='B' and a['seq']<=710 and a['atom']=='CA']
    stats['dg'] = write('dg', normalized(dg, sub(center(tm),center(outside)), center(tm)), 'PDB 9C3C: alpha-DG A 485-653 + beta-DG B 654-798; rabbit')
    lg = [a for a in lg if a['chain']=='B']
    stats['lg45-proxy'] = write('lg45-proxy', normalized(lg), 'PDB 5IK8 chain B: mouse LAMA2 LG4-5 HOMOLOG PROXY, NOT LAMA4')
    (ROOT/'shared'/'templates.json').write_text(json.dumps(stats,indent=2)+'\n')
    print(json.dumps(stats,indent=2))

if __name__ == '__main__': main()
