let productos = [];
let contador = 1;
let modalEditar = null;

function mostrarToast(msg) {
    let el = document.getElementById("toastNotif");
    let m = document.getElementById("toastMensaje");
    if (!el || !m) return;
    m.textContent = msg;
    bootstrap.Toast.getOrCreateInstance(el, { delay: 3500 }).show();
}

function validarRegistro() {
    let campos = ["nombre", "precio", "stock"];
    let ok = true;
    campos.forEach(id => {
        let el = document.getElementById(id);
        if (!el.value.trim() || parseFloat(el.value) < 0) {
            el.classList.add("is-invalid"); ok = false;
        } else { el.classList.remove("is-invalid"); }
    });
    return ok;
}

async function registrarProducto() {
    if (!validarRegistro()) return;
    
    let nombre = document.getElementById("nombre").value.trim();
    let precio = parseFloat(document.getElementById("precio").value);
    let stock = parseInt(document.getElementById("stock").value);
    let stockMinimo = parseInt(document.getElementById("stockMinimo")?.value) || 5;
    let unidad = document.getElementById("unidad").value;
    let marca = document.getElementById("marca").value.trim();
    let vencInput = document.getElementById("vencimiento").value;
    let codigo = "P" + String(contador).padStart(3,"0");

    let vencimiento = "—";
    if (vencInput) {
        let p = vencInput.split("-");
        vencimiento = p[2] + "/" + p[1] + "/" + p[0];
    }

    let hoy = new Date();
    let fechaRegistro = hoy.toLocaleDateString('es-PE');

    let nuevo = { codigo, nombre, marca: marca || "—", precio, stock, unidad, vencimiento, fechaReabastecimiento: fechaRegistro, stockMinimo, activo: true };

    try {
        let res = await fetch("/api/productos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nuevo)
        });
        if (!res.ok) throw new Error("Error al guardar");
        
        productos.push(nuevo);
        contador++;
        mostrarProductos();
        limpiarFormulario();
        mostrarToast("Producto registrado correctamente.");
    } catch (e) {
        mostrarToast("Error de conexión con el servidor.");
    }
}

function mostrarProductos() {
    let tbody = document.getElementById("tablaProductos");
    let sinMsg = document.getElementById("sinProductos");
    if (!tbody) return;
    tbody.innerHTML = "";
    let visibles = productos.filter(p => p.activo !== false);
    
    if (visibles.length === 0) {
        sinMsg?.classList.remove("d-none");
        return;
    }
    sinMsg?.classList.add("d-none");

    visibles.forEach((p, i) => {
        let claseStock = p.stock === 0 ? "text-danger fw-bold" : (p.stock <= p.stockMinimo ? "text-warning" : "");
        tbody.innerHTML += `
        <tr>
            <td>${p.codigo}</td>
            <td>${p.nombre}</td>
            <td>${p.marca}</td>
            <td>S/${p.precio.toFixed(2)}</td>
            <td class="${claseStock}">${p.stock}</td>
            <td>${p.unidad}</td>
            <td><button class="btn btn-sm btn-outline-warning" onclick="abrirModalEditar(${productos.indexOf(p)})">Editar</button>
                <button class="btn btn-sm btn-danger" onclick="eliminarProducto(${productos.indexOf(p)})">🗑</button></td>
        </tr>`;
    });
}

function limpiarFormulario() {
    ["nombre", "precio", "stock", "marca", "vencimiento", "stockMinimo"].forEach(id => {
        let el = document.getElementById(id);
        if (el) el.value = "";
    });
}

async function iniciarSistema() {
    try {
        let res = await fetch("/api/productos");
        productos = await res.json();
        if (productos.length > 0) {
            let ultimo = productos[productos.length-1].codigo;
            contador = parseInt(ultimo.replace("P","")) + 1;
        }
        mostrarProductos();
    } catch (e) { console.error(e); }
}

iniciarSistema();
