let productos      = [];
let ventas         = [];
let carrito        = [];
let contadorVenta  = 1;
let todasLasVentas = []; /* copia para filtros */

function mostrarToast(msg, tipo = "info") {
    let background = "var(--bg-surface-alt)"; // default
    let icon = "info";
    let color = "#fff";
    
    if (tipo === "danger") {
        background = "linear-gradient(to right, #E05252, #c94040)";
        icon = "warning-circle";
    } else if (tipo === "warning") {
        background = "linear-gradient(to right, #E89C2F, #d4871e)";
        icon = "warning";
    } else if (tipo === "success") {
        background = "linear-gradient(to right, #4CAF7D, #3d9669)";
        icon = "check-circle";
    }

    Toastify({
        text: `<i class="ph-bold ph-${icon}" style="font-size: 18px;"></i> <span style="font-weight: 500;">${msg}</span>`,
        duration: 3500,
        close: true,
        gravity: "top", // top or bottom
        position: "right", // left, center or right
        escapeMarkup: false,
        style: {
            background: background,
            color: color,
            borderRadius: "10px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 18px",
            fontFamily: "'Inter', sans-serif"
        }
    }).showToast();
}

/* ── Sidebar Toggle ─────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
    const btn     = document.getElementById("btn-toggle-sidebar");
    const sidebar = document.querySelector(".sidebar");
    const html    = document.documentElement;

    if (!btn || !sidebar) return;

    if (html.classList.contains("sidebar-pre-collapse")) {
        sidebar.classList.add("collapsed");
    }

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            html.classList.remove("sidebar-pre-collapse");
        });
    });

    btn.addEventListener("click", () => {
        sidebar.classList.toggle("collapsed");
        localStorage.setItem("sidebarCollapsed", sidebar.classList.contains("collapsed"));
    });
});

/* Seleccion de productos */
function actualizarSelect() {
    let sel = document.getElementById("productoVenta");
    sel.innerHTML = "";
    if (productos.length === 0) {
        sel.innerHTML = "<option disabled>No hay productos registrados</option>";
        return;
    }
    productos.forEach(function(p, i) {
        let opt = document.createElement("option");
        opt.value = i;
        let unid = p.unidad || "unid.";
        opt.textContent = p.nombre + " — S/" + p.precio.toFixed(2) + " (Stock: " + p.stock + " " + unid + ")";
        if (p.stock === 0) { opt.disabled = true; opt.textContent += " (Sin stock)"; }
        sel.appendChild(opt);
    });
}
function agregarAlCarrito() {
    if (productos.length === 0) {
        mostrarToast("No hay productos disponibles.", "warning");
        return;
    }

    let sel      = document.getElementById("productoVenta");
    let cantInput = document.getElementById("cantidadVenta");
    let index    = parseInt(sel.value);
    let cantidad = parseInt(cantInput.value);

    if (isNaN(cantidad) || cantidad <= 0) {
        cantInput.classList.add("is-invalid");
        mostrarToast("Ingresa una cantidad válida.", "warning");
        return;
    }
    cantInput.classList.remove("is-invalid");

    let prod = productos[index];
    if (cantidad > prod.stock) {
        mostrarToast("Stock insuficiente. Disponible: " + prod.stock, "warning");
        return;
    }

    let existente = carrito.find(c => c.codigo === prod.codigo);
    if (existente) {
        if (existente.cantidad + cantidad > prod.stock) {
            mostrarToast("La cantidad total supera el stock.", "warning");
            return;
        }
        existente.cantidad += cantidad;
    } else {
        carrito.push({ codigo: prod.codigo, nombre: prod.nombre,
        precio: prod.precio, cantidad,
        unidad: prod.unidad || "unid." });
    }
    cantInput.value = "";
    guardarCarritoEnStorage();
    renderCarrito();
}

function guardarCarritoEnStorage() {
    localStorage.setItem("bodegaCarrito", JSON.stringify(carrito));
}

function renderCarrito() {
    let lista = document.getElementById("listaVenta");
    let vacioMsg = document.getElementById("carritoVacio");
    lista.innerHTML = "";
    if (carrito.length === 0) {
        let li = document.createElement("li");
        li.id = "carritoVacio";
        li.className = "text-secondary";
        li.textContent = "El carrito está vacío.";
        lista.appendChild(li);
        document.getElementById("totalVenta").textContent = "Total: S/0.00";
        return;
    }
    let total = 0;
    carrito.forEach(function(item, i) {
        let sub = item.precio * item.cantidad;
        total += sub;
        let li = document.createElement("li");
        li.className = "d-flex justify-content-between align-items-center";
        li.innerHTML =
            "<span>" + item.nombre + " × " + item.cantidad + " " + (item.unidad || "unid.") +
            " — <strong>S/" + sub.toFixed(2) + "</strong></span>" +
            "<button class='btn btn-sm btn-outline-danger ms-2' " +
            "onclick='quitarDelCarrito(" + i + ")' " +
            "aria-label='Quitar " + item.nombre + "'><i class='ph-bold ph-x'></i></button>";
        lista.appendChild(li);
    });
    document.getElementById("totalVenta").textContent = "Total: S/" + total.toFixed(2);
}
function quitarDelCarrito(i) {
    let nombre = carrito[i].nombre;
    carrito.splice(i, 1);
    guardarCarritoEnStorage();
    renderCarrito();
    mostrarToast("\"" + nombre + "\" quitado del carrito.", "info");
}
function limpiarCarrito() {
    if (carrito.length === 0) return;
    if (!confirm("¿Vaciar el carrito?")) return;
    carrito = [];
    guardarCarritoEnStorage();
    renderCarrito();
}
async function registrarVenta() {
    if (carrito.length === 0) {
        mostrarToast("El carrito está vacío.", "warning");
        return;
    }

    /* Validar stock antes de confirmar */
    for (let item of carrito) {
        let prod = productos.find(p => p.codigo === item.codigo);
        if (!prod || prod.stock < item.cantidad) {
            mostrarToast("Stock insuficiente para: " + item.nombre, "danger");
            return;
        }
    }
    let metodo = document.getElementById("metodoPago").value;
    let total  = carrito.reduce((s, item) => s + item.precio * item.cantidad, 0);
    let codigo = "V" + String(contadorVenta).padStart(3,"0");
    let hoy = new Date();
    let fecha =
        hoy.getDate().toString().padStart(2,"0") + "/" +
        (hoy.getMonth()+1).toString().padStart(2,"0") + "/" +
        hoy.getFullYear();
    let nuevaVenta = { codigo, fecha, total, pago: metodo, detalle: [...carrito] };
    try {
        /*Guarda venta */
        let r1 = await fetch("/api/ventas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nuevaVenta)
        });
        if (!r1.ok) { mostrarToast("Error al guardar la venta.", "danger"); return; }

        /* Desconta stock en el servidor */
        for (let item of carrito) {
            let prod = productos.find(p => p.codigo === item.codigo);
            if (prod) {
                prod.stock -= item.cantidad;
                await fetch("/api/productos/" + prod.codigo + "/stock", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ stock: prod.stock })
                });
                
                // Mostrar alerta de stock si corresponde
                let limite = prod.stockMinimo != null ? prod.stockMinimo : 5;
                if (prod.stock === 0) {
                    setTimeout(() => mostrarToast(`Producto agotado: ${prod.nombre}`, "danger"), 500);
                } else if (prod.stock <= limite) {
                    setTimeout(() => mostrarToast(`Stock bajo del producto: ${prod.nombre} (Quedan: ${prod.stock})`, "warning"), 500);
                }
            }
        }

        ventas.push(nuevaVenta);
        todasLasVentas = [...ventas];
        contadorVenta++;
        carrito = [];
        guardarCarritoEnStorage();

        renderCarrito();
        actualizarSelect();
        mostrarVentas(ventas);
        mostrarToast("Venta " + codigo + " registrada — S/" + total.toFixed(2), "success");

    } catch (e) {
        mostrarToast(" No se pudo conectar con el servidor.");
        console.error(e);
    }
}

function mostrarVentas(lista) {
    let tbody  = document.getElementById("tablaVentas");
    let sinMsg = document.getElementById("sinVentas");
    tbody.innerHTML = "";

    if (lista.length === 0) {
        sinMsg.classList.remove("d-none");
        return;
    }
    sinMsg.classList.add("d-none");

    [...lista].reverse().forEach(function(v, i) {
        let indexReal = ventas.indexOf(v);
        tbody.innerHTML += `
        <tr>
            <td>${v.codigo}</td>
            <td>${v.fecha}</td>
            <td><strong>S/${v.total.toFixed(2)}</strong></td>
            <td><span class="badge-pago">${v.pago}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-warning"
                        onclick="verDetalleVenta(${indexReal})"
                        aria-label="Ver detalle de venta ${v.codigo}">
                        Ver
                </button>
            </td>
            <td>
                <button class="btn btn-sm btn-danger"
                        onclick="eliminarVenta(${indexReal})"
                        aria-label="Eliminar venta ${v.codigo}">
                    <i class="ph-bold ph-trash"></i>
                </button>
            </td>
        </tr>`;
    });
}

/*Modal detalle de venta */
function verDetalleVenta(index) {
    let v      = ventas[index];
    let cuerpo = document.getElementById("cuerpoModalDetalle");
    let titulo = document.getElementById("tituloModalDetalle");
    titulo.textContent = "Detalle — " + v.codigo;

    let filas = (v.detalle || []).map(function(item) {
        let sub = item.precio * item.cantidad;
        let prodActual = productos.find(p => p.codigo === item.codigo);
        let infoExtra = "";
        if (!prodActual) infoExtra = " <span class='text-agotado'>(Producto eliminado)</span>";
        else if (prodActual.stock === 0) infoExtra = " <span class='text-agotado'>(Producto agotado)</span>";

        return `<tr>
            <td>${item.nombre}${infoExtra}</td>
            <td>${item.cantidad}</td>
            <td>S/${item.precio.toFixed(2)}</td>
            <td><strong>S/${sub.toFixed(2)}</strong></td>
        </tr>`;
    }).join("");

    cuerpo.innerHTML = `
    <p class="text-secondary mb-2">
        <strong>Fecha:</strong> ${v.fecha} &nbsp;|&nbsp;
        <strong>Pago:</strong> <span class="badge-pago">${v.pago}</span>
    </p>
    <div class="table-responsive">
    <table class="table table-dark table-bordered table-sm">
        <thead class="table-warning text-dark">
            <tr>
                <th>Producto</th><th>Cantidad</th><th>Precio unit.</th><th>Subtotal</th>
            </tr>
        </thead>
        <tbody>${filas}</tbody>
        <tfoot>
            <tr>
                <td colspan="3" class="text-end text-warning fw-bold">TOTAL</td>
                <td class="text-warning fw-bold">S/${v.total.toFixed(2)}</td>
            </tr>
        </tfoot>
    </table>
    </div>`;

    new bootstrap.Modal(document.getElementById("modalDetalle")).show();
}
/*Elimina venta con devolución de stock*/
async function eliminarVenta(index) {
    let v = ventas[index];
    if (!confirm("¿Eliminar venta " + v.codigo + "?\nSe restaurará el stock de los productos.")) 
        return;
    /* Restaura stock en memoria*/
    (v.detalle || []).forEach(function(item) {
        let prod = productos.find(p => p.codigo === item.codigo);
        if (prod) prod.stock += item.cantidad;
    });
    try {
        let r = await fetch("/api/ventas/" + v.codigo, { method: "DELETE" });
        if (!r.ok) { mostrarToast("Error al eliminar.", "danger"); 
            return; }
        /* Sincronizar stock restaurado */
        for (let item of (v.detalle || [])) {
            let prod = productos.find(p => p.codigo === item.codigo);
            if (prod) {
                await fetch("/api/productos/" + prod.codigo + "/stock", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ stock: prod.stock })
                });
            }
        }
        ventas.splice(index, 1);
        todasLasVentas = [...ventas];
        actualizarSelect();
        mostrarVentas(ventas);
        mostrarToast("Venta eliminada. Stock restaurado.", "success");
    } catch (e) {
        mostrarToast("No se pudo conectar con el servidor.", "danger");
        console.error(e);
    }
}
/* Filtro por fecha */
function filtrarVentas() {
    let valor = document.getElementById("filtroFecha").value;
    if (!valor) { mostrarVentas(ventas); return; }

    let partes = valor.split("-");
    let fechaBuscada = partes[2] + "/" + partes[1] + "/" + partes[0];
    let filtradas = ventas.filter(v => v.fecha === fechaBuscada);
    mostrarVentas(filtradas);
}
function limpiarFiltro() {
    document.getElementById("filtroFecha").value = "";
    mostrarVentas(ventas);
}
async function iniciarSistema() {
    try {
        let [r1, r2] = await Promise.all([
            fetch("/api/productos"),
            fetch("/api/ventas")
        ]);
        if (!r1.ok || !r2.ok) throw new Error("Error al cargar datos");

        productos = await r1.json();
        ventas    = await r2.json();
        todasLasVentas = [...ventas];

        if (ventas.length > 0) {
            let ultimo = ventas[ventas.length-1].codigo;
            contadorVenta = parseInt(ultimo.replace("V","")) + 1;
        }

        // Cargar carrito desde localStorage
        let guardado = localStorage.getItem("bodegaCarrito");
        if(guardado) {
            try {
                carrito = JSON.parse(guardado);
            } catch(e) {
                carrito = [];
            }
        }

        actualizarSelect();
        renderCarrito();
        mostrarVentas(ventas);

    } catch (e) {
        console.error(e);
        mostrarToast("No se pudo conectar con el servidor.", "danger");
    }
}

iniciarSistema();
