const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs").promises;

const app = express();
const PORT = process.env.PORT || 5000;
const RUTA_BD = path.join(__dirname, "datos.json");

/* Middleware */
app.use(cors());
app.use(express.json());

/* Archivos estáticos */
app.use("/css", express.static(path.join(__dirname, "css")));
app.use("/script", express.static(path.join(__dirname, "script")));

/* Páginas HTML */
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "Cuerpo", "Inicio.html"));
});

app.get("/pagina/productos", (req, res) => {
    res.sendFile(path.join(__dirname, "Cuerpo", "Productos.html"));
});

app.get("/pagina/ventas", (req, res) => {
    res.sendFile(path.join(__dirname, "Cuerpo", "Ventas.html"));
});

/* Base de datos */
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

/* API PRODUCTOS */
app.get("/api/productos", async (req, res) => {
    try {
        let datos = await leerDatos();
        res.json(datos.productos);
    } catch (e) {
        res.status(500).json({ error: "Error al leer productos" });
    }
});

app.post("/api/productos", async (req, res) => {
    try {
        let { codigo, nombre, marca, precio, stock, unidad, vencimiento, fechaReabastecimiento, stockMinimo } = req.body;
        if (!codigo || !nombre || precio == null || stock == null) {
            return res.status(400).json({ error: "Datos incompletos" });
        }
        let datos = await leerDatos();
        if (datos.productos.find(p => p.codigo === codigo)) {
            return res.status(409).json({ error: "Código ya existe" });
        }
        datos.productos.push({
            codigo, nombre, marca: marca || "—", precio, stock,
            unidad: unidad || "unid.", vencimiento: vencimiento || "—",
            fechaReabastecimiento: fechaReabastecimiento || "—",
            stockMinimo: stockMinimo || 5, activo: true
        });
        await guardarDatos(datos);
        res.status(201).json({ mensaje: "Producto guardado", codigo });
    } catch (e) {
        res.status(500).json({ error: "Error al guardar producto" });
    }
});

app.put("/api/productos/:codigo", async (req, res) => {
    try {
        let codigo = req.params.codigo;
        let datos = await leerDatos();
        let prod = datos.productos.find(p => p.codigo === codigo);
        if (!prod) return res.status(404).json({ error: "No encontrado" });

        Object.assign(prod, req.body);
        await guardarDatos(datos);
        res.json({ mensaje: "Actualizado" });
    } catch (e) {
        res.status(500).json({ error: "Error al actualizar" });
    }
});

app.put("/api/productos/:codigo/stock", async (req, res) => {
    try {
        let { stock } = req.body;
        let datos = await leerDatos();
        let prod = datos.productos.find(p => p.codigo === req.params.codigo);
        if (prod) {
            prod.stock = stock;
            await guardarDatos(datos);
            res.json({ mensaje: "Stock actualizado" });
        } else {
            res.status(404).json({ error: "No encontrado" });
        }
    } catch (e) { res.status(500).json({ error: "Error stock" }); }
});

app.delete("/api/productos/:codigo", async (req, res) => {
    try {
        let datos = await leerDatos();
        let prod = datos.productos.find(p => p.codigo === req.params.codigo);
        if (prod) {
            prod.activo = false;
            await guardarDatos(datos);
            res.json({ mensaje: "Desactivado" });
        }
    } catch (e) { res.status(500).json({ error: "Error eliminar" }); }
});

/* API VENTAS */
app.get("/api/ventas", async (req, res) => {
    try {
        let datos = await leerDatos();
        res.json(datos.ventas);
    } catch (e) { res.status(500).json({ error: "Error ventas" }); }
});

app.post("/api/ventas", async (req, res) => {
    try {
        let { codigo, fecha, total, pago, detalle } = req.body;
        let datos = await leerDatos();
        datos.ventas.push({ codigo, fecha, total, pago, detalle });
        await guardarDatos(datos);
        res.status(201).json({ mensaje: "Venta guardada" });
    } catch (e) { res.status(500).json({ error: "Error al registrar venta" }); }
});

app.delete("/api/ventas/:codigo", async (req, res) => {
    try {
        let datos = await leerDatos();
        datos.ventas = datos.ventas.filter(v => v.codigo !== req.params.codigo);
        await guardarDatos(datos);
        res.json({ mensaje: "Venta eliminada" });
    } catch (e) { res.status(500).json({ error: "Error al eliminar" }); }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
