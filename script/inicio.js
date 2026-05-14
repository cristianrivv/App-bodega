let productos = [];
let ventas = [];

function fechaHoy() {
    let h = new Date();
    return h.getDate().toString().padStart(2,"0") + "/" + (h.getMonth()+1).toString().padStart(2,"0") + "/" + h.getFullYear();
}

function actualizarDashboard() {
    let hoy = fechaHoy();
    let totalHoy = ventas.filter(v => v.fecha === hoy).reduce((s, v) => s + v.total, 0);
    
    document.getElementById("ventasHoy").textContent = "S/" + totalHoy.toFixed(2);

    // LÓGICA DE ALERTAS SOLICITADA POR EL PROFE
    let bajo = productos.filter(p => p.activo && p.stock > 0 && p.stock <= p.stockMinimo).length;
    let quiebre = productos.filter(p => p.activo && p.stock <= 0).length;
    
    // Mostramos ambos en la tarjeta de Stock Bajo
    document.getElementById("stockBajo").innerHTML = `${bajo} <small style="font-size:12px; display:block; color: #ff6b6b;">(${quiebre} en quiebre)</small>`;

    let tabla = document.getElementById("tablaUltimasVentas");
    tabla.innerHTML = "";
    [...ventas].reverse().slice(0, 5).forEach(v => {
        tabla.innerHTML += `<tr><td>${v.codigo}</td><td>${v.fecha}</td><td>S/${v.total.toFixed(2)}</td><td>${v.pago}</td></tr>`;
    });
}

function abrirModal(tipo) {
    let titulo = document.getElementById("modalTitulo");
    let cuerpo = document.getElementById("modalCuerpo");

    if (tipo === 'stock') {
        titulo.textContent = "🚨 Alertas de Inventario";
        let quiebre = productos.filter(p => p.activo && p.stock <= 0);
        let bajo = productos.filter(p => p.activo && p.stock > 0 && p.stock <= p.stockMinimo);

        cuerpo.innerHTML = `
            <h6 class="text-danger fw-bold">🚫 QUIEBRE DE STOCK (Agotados)</h6>
            <div class="list-group mb-3">
                ${quiebre.length ? quiebre.map(p => `<div class="list-group-item bg-dark text-white border-danger d-flex justify-content-between"><span>${p.nombre}</span><span class="badge bg-danger">0 ${p.unidad}</span></div>`).join('') : '<p class="text-secondary small">No hay productos en quiebre.</p>'}
            </div>
            <h6 class="text-warning fw-bold">⚠️ STOCK BAJO (Límite personalizado)</h6>
            <div class="list-group">
                ${bajo.length ? bajo.map(p => `<div class="list-group-item bg-dark text-white border-warning d-flex justify-content-between"><span>${p.nombre} <small class="text-secondary">(Mín: ${p.stockMinimo})</small></span><span class="badge bg-warning text-dark">${p.stock} ${p.unidad}</span></div>`).join('') : '<p class="text-secondary small">No hay productos por debajo del mínimo.</p>'}
            </div>
        `;
    }
    new bootstrap.Modal(document.getElementById("modalDetalle")).show();
}

async function iniciar() {
    let [r1, r2] = await Promise.all([fetch("/api/productos"), fetch("/api/ventas")]);
    productos = await r1.json();
    ventas = await r2.json();
    actualizarDashboard();
}
iniciar();
