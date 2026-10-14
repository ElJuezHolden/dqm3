import { RailFrame } from "@/components/RailFrame";

// La lista de monstruos vive en este layout para que no se recargue (ni pierda el scroll)
// al pasar de una ficha a otra.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <RailFrame>{children}</RailFrame>;
}
