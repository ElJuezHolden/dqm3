import Link from "next/link";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Monstruos grandes" };

export default function Page() {
  return (
    <article className="max-w-3xl space-y-5">
      <PageHeader title="Monstruos grandes" subtitle="Qué son, si compensan y cómo convertir uno pequeño en grande." />
      <section className="card space-y-3 p-5 text-sm leading-relaxed text-text/90">
        <h2 className="h-title text-lg font-semibold">¿Qué son?</h2>
        <p>
          Cualquier monstruo puede tener versión grande. Ocupan <b>2 huecos</b> del equipo, así que puedes llevar 4 pequeños, 2 pequeños + 1 grande o 2 grandes.
          Tienen un <b>50 % más de PV y PM</b> y un <b>10 % más</b> del resto de stats. Siguen teniendo 3 talentos, pero <b>6 rasgos</b> en lugar de 3: empiezan con 3 desbloqueados y el cuarto llega a nivel 60.
        </p>
      </section>
      <section className="card space-y-3 p-5 text-sm leading-relaxed text-text/90">
        <h2 className="h-title text-lg font-semibold">¿Siempre son mejores?</h2>
        <p>
          Casi todos los grandes traen un rasgo <b>táctico</b> que les deja actuar más de una vez por turno, pero la mitad dicen «a veces», así que pueden acabar atacando una sola vez.
          Cuatro pequeños garantizan 4 acciones (y algunos pequeños también tienen rasgo táctico).
        </p>
        <p>
          Además, los rasgos tácticos <b>reducen las stats un 10, 20 o 30 %</b> según cuántas acciones den. El +10 % de ser grande no lo compensa, así que en ataque, defensa, agilidad y sabiduría un pequeño suele rendir más; los PV y PM sí quedan por encima.
          Compruébalo en <Link className="link" href="/calculadoras/stats">Stats máximos</Link> moviendo el tamaño.
        </p>
        <p>
          Los grandes tienen un <b>+50 % de resistencia a los ataques sin daño</b> (estados), así que suelen ser inmunes a uno o dos; aunque los rasgos «Ultra Crafty» del rival reducen mucho esa inmunidad.
        </p>
        <p>
          Los hechizos a todos los enemigos hacen menos daño total contra un equipo con menos monstruos, pero los ataques fuertes a un solo objetivo castigan más a los grandes. Hay rasgos que hacen más daño a grandes (o a pequeños).
        </p>
        <p>
          De los 3 rasgos extra, uno casi siempre es el táctico: en la práctica ganas 2. Tienen que encajar con el monstruo; por ejemplo, si ya potencia el hielo, un rasgo extra de fuego no aporta.
          Un <Link className="link" href="/monstruos/spiked-hare">Spiked Hare</Link> grande, en cambio…
        </p>
      </section>
      <section className="card space-y-3 p-5 text-sm leading-relaxed text-text/90">
        <h2 className="h-title text-lg font-semibold">¿Dónde se encuentran?</h2>
        <p>
          Aparecen al azar en una zona después de ganar el rango E de su arena. Son bastante más grandes a la vista, pero raros; la probabilidad parece subir conforme ganas más rangos.
          El DLC <b>Mole Hole</b> tiene muchos monstruos grandes para capturar.
        </p>
      </section>
      <section className="card space-y-3 p-5 text-sm leading-relaxed text-text/90">
        <h2 className="h-title text-lg font-semibold">¿Puedo hacer grande a uno pequeño?</h2>
        <p>Sí, aunque cuesta trabajo:</p>
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>Encuentra dos monstruos grandes de tipos distintos y fusiónalos.</li>
          <li>Consigue uno o más <Link className="link" href="/monstruos/bongo-drongo">Bongo Drongo</Link> (tercera zona, detrás del Green Dragon, o rodeando por el camino largo).</li>
          <li>Prueba a sintetizar tu grande con un Bongo Drongo. Si el resultado sale pequeño, descártalo. Si puede salir grande, fusiona ese Bongo Drongo con el monstruo pequeño objetivo.</li>
          <li>Después fusiona tu grande con ese pequeño combinado. Si aún sale pequeño, repite con más Bongo Drongos.</li>
        </ol>
        <p>
          <b>O bien</b>: combina tu pequeño con otro grande que encuentres y sigue fusionándolo con grandes hasta superar el umbral. El tamaño es bastante aleatorio: desactiva el autoguardado y prueba varias veces.
        </p>
      </section>
      <p className="text-xs text-muted">Guía adaptada de la de MetalKid.</p>
    </article>
  );
}
