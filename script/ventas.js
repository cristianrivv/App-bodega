let productos = [];
let ventas = [];
let carrito = [];
let contadorVenta = 1;

async function iniciarSistema() {
    try {
        const [r1, r2] = await Promise.all([fetch("/api/productos"), fetch("/api/ventas")]);
        productos = await r1.json();
        ventas = await r2.json();
        if (ventas.length > 0) {
            let ultimo = ventas[ventas.length-1].codigo;
            contadorVenta = parseInt(ultimo.replace("V","")) + 1;
        }
        actualizarSelect();
        mostrarVentas(ventas);
    } catch (e) { console.error(e); }
}

function actualizarSelect() {
    let sel = document.getElementById("productoVenta");
    if (!sel) return;
    sel.innerHTML = '<option value="" selected disabled>Seleccione un producto</option>';
    productos.filter(p => p.activo).forEach(p => {
        let opt = document.createElement("option");
        opt.value = productos.indexOf(p);
        opt.textContent = `${p.nombre} (Stock: ${p.stock})`;
        if (p.stock <= 0) opt.disabled = true;
        sel.appendChild(opt);
    });
}

function agregarAlCarrito() {
    let sel = document.getElementById("productoVenta");
    let cant = parseInt(document.getElementById("cantidadVenta").value);
    let p = productos[sel.value];
    if (!p || cant <= 0 || cant > p.stock) return alert("Cantidad no válida");
    carrito.push({ codigo: p.codigo, nombre: p.nombre, precio: p.precio, cantidad: cant, subtotal: p.precio * cant });
    renderCarrito();
}

function renderCarrito() {
    let lista = document.getElementById("listaVenta");
    let total = carrito.reduce((s, i) => s + i.subtotal, 0);
    lista.innerHTML = carrito.map(i => `<li>${i.nombre} x ${i.cantidad} - S/${i.subtotal.toFixed(2)}</li>`).join("");
    document.getElementById("totalVenta").textContent = `Total: S/${total.toFixed(2)}`;
}

async function registrarVenta() {
    if (carrito.length === 0) return;
    let venta = {
        codigo: "V" + String(contadorVenta).padStart(3,"0"),
        fecha: new Date().toLocaleDateString('es-PE'),
        total: carrito.reduce((s, i) => s + i.subtotal, 0),
        pago: document.getElementById("metodoPago").value,
        detalle: [...carrito]
    };

    await fetch("/api/ventas", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(venta) });

    for (let item of carrito) {
        let p = productos.find(prod => prod.codigo === item.codigo);
        p.stock -= item.cantidad;
        await fetch(`/api/productos/${p.codigo}/stock`, { method: "PUT", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ stock: p.stock }) });
    }

    location.reload();
}

function mostrarVentas(lista) {
    let tbody = document.getElementById("tablaVentas");
    if (!tbody) return;
    tbody.innerHTML = "";
    lista.forEach(v => {
        let detalleHtml = (v.detalle || []).map(item => {
            let pActual = productos.find(p => p.codigo === item.codigo);
            // ETIQUETA GRIS SI NO HAY STOCK
            let etiqueta = (!pActual || pActual.stock <= 0) ? ` <small class="text-secondary">(sin stock)</small>` : "";
            return `<div>${item.nombre}${etiqueta} x${item.cantidad}</div>`;
        }).join("");

        tbody.innerHTML += `<tr><td>${v.codigo}</td><td>${v.fecha}</td><td>${detalleHtml}</td><td>S/${v.total.toFixed(2)}</td><td>${v.pago}</td></tr>`;
    });
}

iniciarSistema();
