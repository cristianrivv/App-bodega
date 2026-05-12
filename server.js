const express = require("express");
const cors    = require("cors");
const path    = require("path");
const fs      = require("fs").promises;

const app     = express();
const PUERTO  = 3000;
const RUTA_BD = path.join(__dirname, "datos.json");

/*Middleware */
app.use(cors());
app.use(express.json());

/*Archivos estáticos */
app.use("/css",    express.static(path.join(__dirname, "css")));
app.use("/script", express.static(path.join(__dirname, "script")));
/*Páginas HTML */
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "Cuerpo", "Inicio.html"));
});
app.get("/pagina/productos", (req, res) => {
    res.sendFile(path.join(__dirname, "Cuerpo", "Productos.html"));
});
app.get("/pagina/ventas", (req, res) => {
    res.sendFile(path.join(__dirname, "Cuerpo", "Ventas.html"));
});

const DATOS_INICIALES = { productos: [], ventas: [] };
async function leerDatos() {
    try {
        let contenido = await fs.readFile(RUTA_BD, "utf8");
        return JSON.parse(contenido);
    } catch (err) {
        if (err.code === "ENOENT" || err instanceof SyntaxError) {
            await guardarDatos(DATOS_INICIALES);
            return { ...DATOS_INICIALES };
        }
        throw err;
    }
}

async function guardarDatos(datos) {
    await fs.writeFile(RUTA_BD, JSON.stringify(datos, null, 2), "utf8");
}
/* GET /api/productos */
app.get("/api/productos", async (req, res) => {
    try {
        let datos = await leerDatos();
        res.json(datos.productos);
    } catch (e) {
        res.status(500).json({ error: "Error al leer productos" });
    }
});
/* GET /api/productos */
app.get("/productos-api", async (req, res) => {
    try {
        let datos = await leerDatos();
        res.json(datos.productos);
    } catch (e) {
        res.status(500).json({ error: "Error al leer productos" });
    }
});
/* POST /productos — registrar nuevo */
app.post("/api/productos", async (req, res) => {
    try {
        let { codigo, nombre, precio, stock, unidad, fechaReabastecimiento } = req.body;
        if (!codigo || !nombre || precio == null || stock == null) {
            return res.status(400).json({ error: "Datos incompletos" });
        }
        if (precio <= 0) return res.status(400).json({ error: "Precio inválido" });
        if (stock < 0)   return res.status(400).json({ error: "Stock inválido" });

        let datos = await leerDatos();
        if (datos.productos.find(p => p.codigo === codigo)) {
            return res.status(409).json({ error: "Código ya existe" });
        }
        datos.productos.push({ codigo, nombre, precio, stock,
                                unidad: unidad || "unid.",
                                fechaReabastecimiento: fechaReabastecimiento || "—" });
        await guardarDatos(datos);
        res.status(201).json({ mensaje: "Producto guardado", codigo });
    } catch (e) {
        console.error("POST /productos:", e.message);
        res.status(500).json({ error: "Error al guardar producto" });
    }
});

/* PUT /productos/:codigo — editar producto completo */
app.put("/api/productos/:codigo", async (req, res) => {
    try {
        let codigo = req.params.codigo;
        let { nombre, precio, stock, unidad, fechaReabastecimiento } = req.body;
        if (!nombre || precio == null || stock == null) {
            return res.status(400).json({ error: "Datos incompletos" });
        }
        let datos = await leerDatos();
        let prod  = datos.productos.find(p => p.codigo === codigo);
        if (!prod) return res.status(404).json({ error: "Producto no encontrado" });
        prod.nombre  = nombre;
        prod.precio  = precio;
        prod.stock   = stock;
        prod.unidad  = unidad || prod.unidad || "unid.";
        prod.fechaReabastecimiento = fechaReabastecimiento || prod.fechaReabastecimiento || "—";
        await guardarDatos(datos);
        res.json({ mensaje: "Producto actualizado", codigo });
    } catch (e) {
        console.error("PUT /productos/:codigo:", e.message);
        res.status(500).json({ error: "Error al actualizar producto" });
    }
});

/* PUT /productos/:codigo/stock, actualiza solo el stock */
app.put("/api/productos/:codigo/stock", async (req, res) => {
    try {
        let codigo = req.params.codigo;
        let { stock } = req.body;
        if (stock == null || stock < 0) return res.status(400).json({ error: "Stock inválido" });

        let datos = await leerDatos();
        let prod  = datos.productos.find(p => p.codigo === codigo);
        if (!prod) return res.status(404).json({ error: "Producto no encontrado" });

        prod.stock = stock;
        await guardarDatos(datos);
        res.json({ mensaje: "Stock actualizado", codigo, stock });
    } catch (e) {
        console.error("PUT /productos/:codigo/stock:", e.message);
        res.status(500).json({ error: "Error al actualizar stock" });
    }
});

/* Borrar /productos/:codigo */
app.delete("/api/productos/:codigo", async (req, res) => {
    try {
        let codigo = req.params.codigo;
        let datos  = await leerDatos();
        let antes  = datos.productos.length;
        datos.productos = datos.productos.filter(p => p.codigo !== codigo);
        if (datos.productos.length === antes) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }
        await guardarDatos(datos);
        res.json({ mensaje: "Producto eliminado", codigo });
    } catch (e) {
        console.error("DELETE /productos/:codigo:", e.message);
        res.status(500).json({ error: "Error al eliminar producto" });
    }
});

/* GET */
app.get("/api/ventas", async (req, res) => {
    try {
        let datos = await leerDatos();
        res.json(datos.ventas);
    } catch (e) {
        res.status(500).json({ error: "Error al leer ventas" });
    }
});

/* POST */
app.post("/api/ventas", async (req, res) => {
    try {
        let { codigo, fecha, total, pago, detalle } = req.body;
        if (!codigo || !fecha || total == null || !pago) {
            return res.status(400).json({ error: "Datos de venta incompletos" });
        }
        let datos = await leerDatos();
        if (datos.ventas.find(v => v.codigo === codigo)) {
            return res.status(409).json({ error: "Código de venta ya existe" });
        }
        datos.ventas.push({ codigo, fecha, total, pago, detalle: detalle || [] });
        await guardarDatos(datos);
        res.status(201).json({ mensaje: "Venta guardada", codigo });
    } catch (e) {
        console.error("POST /ventas:", e.message);
        res.status(500).json({ error: "Error al guardar venta" });
    }
});
app.delete("/api/ventas/:codigo", async (req, res) => {
    try {
        let codigo = req.params.codigo;
        let datos  = await leerDatos();
        let antes  = datos.ventas.length;
        datos.ventas = datos.ventas.filter(v => v.codigo !== codigo);
        if (datos.ventas.length === antes) {
            return res.status(404).json({ error: "Venta no encontrada" });
        }
        await guardarDatos(datos);
        res.json({ mensaje: "Venta eliminada", codigo });
    } catch (e) {
        console.error("DELETE /ventas/:codigo:", e.message);
        res.status(500).json({ error: "Error al eliminar venta" });
    }
});

async function iniciar() {
    await leerDatos(); /* asegura que datos.json si existe */
    app.listen(PUERTO, () => {
        console.log("Servidor corriendo en http://localhost:" + PUERTO);
        console.log("Archivo de datos: " + RUTA_BD);
    });
}

iniciar();
