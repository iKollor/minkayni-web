/* springer (github.com/tannerlinsley/springer) no publica tipos. */
declare module "springer" {
    /**
     * Simula un resorte y devuelve su curva como función de easing (0 → 1).
     * @param tension Fuerza del resorte, de 0 a 1 (por defecto 0,5).
     * @param wobble Cuánto oscila al llegar, de 0 a 1 (por defecto 0,5).
     */
    export default function Springer(tension?: number, wobble?: number): (progress: number) => number;
}
