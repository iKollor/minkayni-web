/* La tabla de redirecciones y su aplicación al menú.
 *
 * El caso que motiva estas pruebas: el plugin Navigation de Strapi guardaba
 * "Súmate" apuntando a `/join`, una ruta que no existe. El ítem quedaba en el
 * menú principal de las once páginas llevando a una página de rebote con
 * `meta refresh`. Google lo señaló como navegación deficiente al revisar la
 * activación de Ad Grants.
 */
import assert from "node:assert/strict";
import test from "node:test";

import { REDIRECCIONES, destinoReal, rutasRedirigidas } from "../src/data/redirects";
import { localizeNavigation, repararRutas, withBatucadaProject } from "../src/data/site";
import type { NavTree } from "../src/schemas/navigation";

test("destinoReal resuelve las rutas muertas y deja pasar las buenas", () => {
    assert.equal(destinoReal("/join"), "/about#contacto");
    assert.equal(destinoReal("/batucada-popular"), "/projects/batucada-popular/");
    assert.equal(destinoReal("/about"), "/about");
    assert.equal(destinoReal("/"), "/");
    assert.equal(destinoReal(""), "");
});

test("la barra final no impide reconocer una ruta redirigida", () => {
    /* El CMS guarda unas con barra y otras sin ella; las dos formas son la
       misma ruta y tienen que resolverse igual. */
    assert.equal(destinoReal("/join/"), "/about#contacto");
    assert.equal(destinoReal("/batucada-popular/"), "/projects/batucada-popular/");
});

test("rutasRedirigidas duplica la tabla en inglés", () => {
    const tabla = rutasRedirigidas();
    for (const [origen, destino] of Object.entries(REDIRECCIONES)) {
        assert.equal(tabla[origen], destino, `falta ${origen}`);
        assert.equal(tabla[`/en${origen}`], `/en${destino}`, `falta /en${origen}`);
    }
    assert.equal(Object.keys(tabla).length, Object.keys(REDIRECCIONES).length * 2);
});

test("ningún destino de la tabla es a su vez una ruta redirigida", () => {
    /* Una redirección que apunta a otra redirección es un salto de más, que es
       justo lo que se está quitando. */
    for (const [origen, destino] of Object.entries(REDIRECCIONES)) {
        const soloRuta = destino.split("#")[0];
        assert.equal(destinoReal(soloRuta), soloRuta, `${origen} apunta a otra redirección: ${destino}`);
    }
});

const arbolDelCms: NavTree = [
    { title: "Conócenos", type: "INTERNAL", path: "/about", items: [], additionalFields: { style: "default" } },
    {
        title: "Proyectos",
        type: "INTERNAL",
        path: "/projects",
        items: [{ title: "Batucada Popular", type: "INTERNAL", path: "/batucada-popular", items: [] }],
        additionalFields: { style: "default" },
    },
    { title: "Súmate", type: "INTERNAL", path: "/join", items: [], additionalFields: { style: "cta" } },
];

test("repararRutas arregla el árbol que llega del CMS, padres e hijos", () => {
    const reparado = repararRutas(arbolDelCms);
    assert.equal(reparado[2].path, "/about#contacto", "«Súmate» sigue apuntando a /join");
    assert.equal(reparado[1].items?.[0].path, "/projects/batucada-popular/", "el hijo del megamenú no se reparó");
    assert.equal(reparado[0].path, "/about", "una ruta sana no debe tocarse");
});

test("el menú final de los dos idiomas no contiene ninguna ruta muerta", () => {
    for (const locale of ["es", "en"] as const) {
        const menu = localizeNavigation(repararRutas(withBatucadaProject(arbolDelCms)), locale);
        const rutas = menu.flatMap((item) => [item.path, ...(item.items ?? []).map((hijo) => hijo.path)]);
        for (const ruta of rutas) {
            assert.ok(ruta, "un ítem del menú se quedó sin ruta");
            const sinIdioma = (ruta as string).replace(/^\/en(?=\/|$)/, "") || "/";
            const sinAncla = sinIdioma.split("#")[0];
            assert.equal(
                destinoReal(sinAncla),
                sinAncla,
                `[${locale}] el menú enlaza a ${ruta}, que solo es una redirección`
            );
        }
    }
});
