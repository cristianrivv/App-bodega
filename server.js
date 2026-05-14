const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs").promises;

const app = express();
const PORT = process.env.PORT || 5000;
const RUTA_BD = path.join(__dirname, "datos.json");

app.use(cors());
app.use(express.json());
app.use("/css", express.static(path.join(__dirname, "css")));
app.use("/script", express.static(path.join(__dirname, "script")));

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "Cuerpo", "Inicio.html")));
app.get("/pagina/productos", (req, res) => res.sendFile(path.join(__dirname, "Cuerpo", "Productos.html")));
app.get("/pagina/ventas", (req, res) => res.sendFile(path.join(__dirname, "Cuerpo", "Ventas.html")));

const DATOS_INICIALES = { productos: [], ventas: [] };

async function leerDatos() {
    try {
        let contenido = await fs.readFile(RUTA_BD, "utf8");
        return JSON.parse(contenido);
    } catch (err) {
        await guardarDatos(DATOS_INICIALES);
        return { ...DATOS_INICIALES };
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
    } catch (e) { res.status(500).json({ error: "Error" }); }
});

app.post("/api/productos", async (req, res) => {
    try {
        let { codigo, nombre, marca, precio, stock, unidad, stockMinimo } = req.body;
        let datos = await leerDatos();
        datos.productos.push({
            codigo, nombre, marca: marca || "—", precio, stock,
            unidad: unidad || "unid.", 
            stockMinimo: parseInt(stockMinimo) || 5, 
            activo: true
        });
        await guardarDatos(datos);
        res.status(201).json({ mensaje: "Guardado" });
    } catch (e) { res.status(500).json({ error: "Error" }); }
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
        } else { res.status(404).json({ error: "No encontrado" }); }
    } catch (e) { res.status(500).json({ error: "Error" }); }
});

/* API VENTAS */
app.get("/api/ventas", async (req, res) => {
    try {
        let datos = await leerDatos();
        res.json(datos.ventas);
    } catch (e) { res.status(500).json({ error: "Error" }); }
});

app.post("/api/ventas", async (req, res) => {
    try {
        let datos = await leerDatos();
        datos.ventas.push(req.body);
        await guardarDatos(datos);
        res.status(201).json({ mensaje: "Venta guardada" });
    } catch (e) { res.status(500).json({ error: "Error" }); }
});

app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
