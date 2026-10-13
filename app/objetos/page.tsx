import { Suspense } from "react";
import { ItemList } from "@/components/pages/Items";
import { Loading } from "@/components/ui";

export const metadata = { title: "Objetos" };

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <ItemList />
    </Suspense>
  );
}
