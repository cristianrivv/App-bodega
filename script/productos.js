let productos  = [];
let contador   = 1;
let modalEditar = null;

function mostrarToast(msg) {
    let el = document.getElementById("toastNotif");
    let m  = document.getElementById("toastMensaje");
    if (!el || !m) return;
    m.textContent = msg;
    bootstrap.Toast.getOrCreateInstance(el, { delay: 3500 }).show();
}

/*Valida campos del formulario de registro */
function validarRegistro() {
    let nombre = document.getElementById("nombre");
    let precio = document.getElementById("precio");
    let stock  = document.getElementById("stock");
    let stockMinimo = document.getElementById("stockMinimo");
    let ok = true;
    if (!nombre.value.trim()) {
        nombre.classList.add("is-invalid"); ok = false;
    } else { nombre.classList.remove("is-invalid"); }
    if (isNaN(parseFloat(precio.value)) || parseFloat(precio.value) <= 0) {
        precio.classList.add("is-invalid"); ok = false;
    } else { precio.classList.remove("is-invalid"); }
    if (isNaN(parseInt(stock.value)) || parseInt(stock.value) < 0) {
        stock.classList.add("is-invalid"); ok = false;
    } else { stock.classList.remove("is-invalid"); }
    if (isNaN(parseInt(stockMinimo.value)) || parseInt(stockMinimo.value) < 0) {
        stockMinimo.classList.add("is-invalid"); ok = false;
    } else { stockMinimo.classList.remove("is-invalid"); }
    return ok;
}

async function registrarProducto() {
    if (!validarRegistro()) return;
    let nombre     = document.getElementById("nombre").value.trim();
    let precio     = parseFloat(document.getElementById("precio").value);
    let stock      = parseInt(document.getElementById("stock").value);
    let stockMinimo = parseInt(document.getElementById("stockMinimo").value);
    let unidad     = document.getElementById("unidad").value;
    let marca      = document.getElementById("marca").value.trim();
    let vencInput  = document.getElementById("vencimiento").value;
    let codigo     = "P" + String(contador).padStart(3,"0");

    /* Formatear vencimiento a DD/MM/AAAA si fue ingresado */
    let vencimiento = "—";
    if (vencInput) {
        let p = vencInput.split("-");
        vencimiento = p[2] + "/" + p[1] + "/" + p[0];
    }

    let hoy = new Date();
    let fechaRegistro =
        hoy.getDate().toString().padStart(2,"0") + "/" +
        (hoy.getMonth()+1).toString().padStart(2,"0") + "/" +
        hoy.getFullYear();
    let nuevo = { codigo, nombre, marca: marca || "—", precio, stock, stockMinimo, unidad,
        vencimiento, fechaReabastecimiento: fechaRegistro };
    try {
        let res = await fetch("/api/productos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nuevo)
        });
        if (!res.ok) {
            let err = await res.json();
            mostrarToast("Error: " + (err.error || "Error al guardar"));
            return;
        }
        productos.push(nuevo);
        contador++;
        mostrarProductos();
        limpiarFormulario();
        mostrarToast(" Producto \"" + nombre + "\" registrado.");
    } catch (e) {
        mostrarToast("Error: No se pudo conectar con el servidor.");
        console.error(e);
    }
}

function mostrarProductos() {
    let tbody  = document.getElementById("tablaProductos");
    let sinMsg = document.getElementById("sinProductos");
    tbody.innerHTML = "";

    if (productos.length === 0) {
        sinMsg.classList.remove("d-none");
        return;
    }
    sinMsg.classList.add("d-none");

    productos.forEach(function(p, i) {
        let limite = p.stockMinimo != null ? p.stockMinimo : 5;
        let claseStock = p.stock === 0
            ? "stock-critico"
            : p.stock <= limite ? "stock-bajo" : "stock-ok";

        let iconStock = p.stock === 0 ? "🚫" : p.stock <= limite ? "⚠️" : "";
        let fechaR    = p.fechaReabastecimiento || "—";
        let unidad    = p.unidad || "unid.";
        let marca     = p.marca || "—";

        /* Lógica de vencimiento */
        let vencTexto = p.vencimiento || "—";
        let vencClase = "";
        if (p.vencimiento && p.vencimiento !== "—") {
            let partes = p.vencimiento.split("/");
            let fechaVenc = new Date(partes[2], partes[1]-1, partes[0]);
            let hoy = new Date();
            let diasRestantes = Math.ceil((fechaVenc - hoy) / (1000 * 60 * 60 * 24));
            if (diasRestantes < 0)        { vencClase = "text-danger fw-bold"; vencTexto += " 🚫"; }
            else if (diasRestantes <= 30) { vencClase = "stock-bajo";          vencTexto += " ⚠️"; }
        }

        tbody.innerHTML += `
        <tr>
            <td>${p.codigo}</td>
            <td>${p.nombre}</td>
            <td><small>${marca}</small></td>
            <td>S/${p.precio.toFixed(2)}</td>
            <td class="${claseStock}">${p.stock} ${iconStock}</td>
            <td>${limite}</td>
            <td><span class="badge-pago">${unidad}</span></td>
            <td class="${vencClase}"><small>${vencTexto}</small></td>
            <td><small>${fechaR}</small></td>
            <td>
                <button class="btn btn-sm btn-outline-warning me-1"
                        onclick="abrirModalEditar(${i})"
                        aria-label="Editar producto ${p.nombre}">
                        Editar
                </button>
                <button class="btn btn-sm btn-danger"
                        onclick="eliminarProducto(${i})"
                        aria-label="Eliminar producto ${p.nombre}">
                    🗑
                </button>
            </td>
        </tr>`;
    });
}
function abrirModalEditar(index) {
    let p = productos[index];
    document.getElementById("editCodigo").value          = p.codigo;
    document.getElementById("editNombre").value          = p.nombre;
    document.getElementById("editMarca").value           = p.marca === "—" ? "" : (p.marca || "");
    document.getElementById("editPrecio").value          = p.precio;
    document.getElementById("editStockNuevo").value      = p.stock;
    document.getElementById("editStockMinimo").value     = p.stockMinimo != null ? p.stockMinimo : 5;
    document.getElementById("editStockActual").textContent = p.stock;
    document.getElementById("editUnidadActual").textContent = " " + (p.unidad || "unid.");
    let selUnidad = document.getElementById("editUnidad");
    selUnidad.value = p.unidad || "unid.";

    /* Cargar vencimiento en formato AAAA-MM-DD para el input date */
    let vencISO = "";
    if (p.vencimiento && p.vencimiento !== "—") {
        let partes = p.vencimiento.split("/");
        vencISO = partes[2] + "-" + partes[1] + "-" + partes[0];
    }
    document.getElementById("editVencimiento").value = vencISO;
    /* Fecha de hoy por defecto */
    let hoy = new Date();
    let fechaISO = hoy.getFullYear() + "-" +
        (hoy.getMonth()+1).toString().padStart(2,"0") + "-" +
        hoy.getDate().toString().padStart(2,"0");
    document.getElementById("editFechaReabastecimiento").value = fechaISO;
    /* Limpiar validaciones previas */
    ["editNombre","editPrecio","editStockNuevo"].forEach(function(id) {
        document.getElementById(id).classList.remove("is-invalid");
    });

    modalEditar = new bootstrap.Modal(document.getElementById("modalEditar"));
    modalEditar.show();
}

async function guardarEdicion() {
    let codigo       = document.getElementById("editCodigo").value;
    let nombreInput  = document.getElementById("editNombre");
    let precioInput  = document.getElementById("editPrecio");
    let stockInput   = document.getElementById("editStockNuevo");
    let stockMinInput = document.getElementById("editStockMinimo");
    let fechaInput   = document.getElementById("editFechaReabastecimiento");
    let nombre  = nombreInput.value.trim();
    let precio  = parseFloat(precioInput.value);
    let stock   = parseInt(stockInput.value);
    let stockMinimo = parseInt(stockMinInput.value);
    let unidad  = document.getElementById("editUnidad").value;
    let marca   = document.getElementById("editMarca").value.trim() || "—";
    let vencInput = document.getElementById("editVencimiento").value;
    let vencimiento = "—";
    if (vencInput) {
        let p2 = vencInput.split("-");
        vencimiento = p2[2] + "/" + p2[1] + "/" + p2[0];
    }
    let ok = true;

    if (!nombre) { nombreInput.classList.add("is-invalid"); ok = false; }
    else nombreInput.classList.remove("is-invalid");
    if (isNaN(precio) || precio <= 0) { precioInput.classList.add("is-invalid"); ok = false; }
    else precioInput.classList.remove("is-invalid");
    if (isNaN(stock) || stock < 0) { stockInput.classList.add("is-invalid"); ok = false; }
    else stockInput.classList.remove("is-invalid");
    if (isNaN(stockMinimo) || stockMinimo < 0) { stockMinInput.classList.add("is-invalid"); ok = false; }
    else stockMinInput.classList.remove("is-invalid");
    if (!ok) return;

    /* Formatear fecha seleccionada  */
    let fechaFormateada = "—";
    if (fechaInput.value) {
        let partes = fechaInput.value.split("-");
        fechaFormateada = partes[2] + "/" + partes[1] + "/" + partes[0];
    }
    let datosActualizados = { codigo, nombre, marca, precio, stock, stockMinimo, unidad,
        vencimiento, fechaReabastecimiento: fechaFormateada };
    try {
        let res = await fetch("/api/productos/" + codigo, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datosActualizados)
        });
        if (!res.ok) {
            let err = await res.json();
            mostrarToast("Error al actualizar: " + (err.error || "Error desconocido"));
            return;
        }

        let index = productos.findIndex(p => p.codigo === codigo);
        if (index !== -1) productos[index] = datosActualizados;

        mostrarProductos();
        if (modalEditar) modalEditar.hide();
        mostrarToast(" Producto \"" + nombre + "\" actualizado. Reabastecimiento: " + fechaFormateada);
    } catch (e) {
        mostrarToast(" No se pudo conectar con el servidor.");
        console.error(e);
    }
}
async function eliminarProducto(index) {
    let p = productos[index];
    if (!confirm("¿Eliminar \"" + p.nombre + "\"?\nEsto no afecta las ventas ya registradas.")) return;

    try {
        let res = await fetch("/api/productos/" + p.codigo, { method: "DELETE" });
        if (!res.ok) {
            mostrarToast(" Error al eliminar.");
            return;
        }
        productos.splice(index, 1);
        mostrarProductos();
        mostrarToast(" Producto \"" + p.nombre + "\" eliminado.");
    } catch (e) {
        mostrarToast(" No se pudo conectar con el servidor.");
        console.error(e);
    }
}
function limpiarFormulario() {
    ["nombre","precio","stock","stockMinimo","marca","vencimiento"].forEach(function(id) {
        let el = document.getElementById(id);
        if (el) {
            el.value = "";
            el.classList.remove("is-invalid","is-valid");
        }
    });
}
async function iniciarSistema() {
    try {
        let res = await fetch("/api/productos");
        if (!res.ok) throw new Error("Error al cargar productos");
        productos = await res.json();

        if (productos.length > 0) {
            let ultimo = productos[productos.length-1].codigo;
            contador = parseInt(ultimo.replace("P","")) + 1;
        }
        mostrarProductos();
    } catch (e) {
        console.error(e);
        mostrarToast(" No se pudo conectar con el servidor.");
    }
}

iniciarSistema();
