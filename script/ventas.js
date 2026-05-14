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
    } catch (e) { console.error("Error al iniciar:", e); }
}

function actualizarSelect() {
    let sel = document.getElementById("productoVenta");
    if (!sel) return;
    sel.innerHTML = '<option value="" selected disabled>Seleccione un producto</option>';
    productos.filter(p => p.activo !== false).forEach((p, index) => {
        let opt = document.createElement("option");
        opt.value = productos.indexOf(p);
        opt.textContent = `${p.nombre} (Stock: ${p.stock})`;
        if (p.stock <= 0) opt.disabled = true;
        sel.appendChild(opt);
    });
}

function agregarAlCarrito() {
    let sel = document.getElementById("productoVenta");
    let cantInput = document.getElementById("cantidadVenta");
    let idx = sel.value;
    let cant = parseInt(cantInput.value);

    if (!idx || isNaN(cant) || cant <= 0) return alert("Cantidad inválida");
    let p = productos[idx];

    if (cant > p.stock) return alert("No hay suficiente stock");

    carrito.push({ codigo: p.codigo, nombre: p.nombre, precio: p.precio, cantidad: cant, subtotal: p.precio * cant });
    renderCarrito();
}

function renderCarrito() {
    let lista = document.getElementById("listaVenta");
    let total = 0;
    lista.innerHTML = "";
    carrito.forEach((item, i) => {
        total += item.subtotal;
        lista.innerHTML += `<li>${item.nombre} x ${item.cantidad} - S/${item.subtotal.toFixed(2)}</li>`;
    });
    document.getElementById("totalVenta").textContent = `Total: S/${total.toFixed(2)}`;
}

async function registrarVenta() {
    if (carrito.length === 0) return;
    let codigo = "V" + String(contadorVenta).padStart(3,"0");
    let nuevaVenta = {
        codigo,
        fecha: new Date().toLocaleDateString('es-PE'),
        total: carrito.reduce((s, i) => s + i.subtotal, 0),
        pago: document.getElementById("metodoPago").value,
        detalle: [...carrito]
    };

    try {
        await fetch("/api/ventas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nuevaVenta)
        });

        // Actualizar stock de cada producto vendido
        for (let item of carrito) {
            let p = productos.find(prod => prod.codigo === item.codigo);
            p.stock -= item.cantidad;
            await fetch(`/api/productos/${p.codigo}/stock`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ stock: p.stock })
            });
        }

        ventas.push(nuevaVenta);
        carrito = [];
        contadorVenta++;
        renderCarrito();
        actualizarSelect();
        mostrarVentas(ventas);
        alert("Venta registrada!");
    } catch (e) { alert("Error al procesar venta"); }
}

function mostrarVentas(lista) {
    let tbody = document.getElementById("tablaVentas");
    if (!tbody) return;
    tbody.innerHTML = "";
    lista.forEach(v => {
        tbody.innerHTML += `<tr><td>${v.codigo}</td><td>${v.fecha}</td><td>S/${v.total.toFixed(2)}</td><td>${v.pago}</td></tr>`;
    });
}

iniciarSistema();
