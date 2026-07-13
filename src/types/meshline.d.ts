import type { ThreeElement } from '@react-three/fiber';
import type { MeshLineGeometry, MeshLineMaterial } from 'meshline';

// `extend({ MeshLineGeometry, MeshLineMaterial })` in Lanyard.tsx registers
// these at runtime; this augmentation is the matching compile-time half so
// `<meshLineGeometry>`/`<meshLineMaterial>` type-check as JSX.
declare module '@react-three/fiber' {
  interface ThreeElements {
    meshLineGeometry: ThreeElement<typeof MeshLineGeometry>;
    meshLineMaterial: ThreeElement<typeof MeshLineMaterial>;
  }
}
