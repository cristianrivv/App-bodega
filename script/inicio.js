let productos = [];
let ventas    = [];

/*Helpers de fecha*/
function fechaHoy() {
    let h = new Date();
    return h.getDate().toString().padStart(2,"0") + "/" +
        (h.getMonth()+1).toString().padStart(2,"0") + "/" +
        h.getFullYear();
}
function mesAnioActual() {
    let h = new Date();
    return { mes: h.getMonth()+1, anio: h.getFullYear() };
}
function mostrarToast(msg) {
    let el = document.getElementById("toastNotif");
    let m  = document.getElementById("toastMensaje");
    if (!el || !m) return;
    m.textContent = msg;
    bootstrap.Toast.getOrCreateInstance(el, { delay: 3000 }).show();
}
function actualizarDashboard() {
    let hoy = fechaHoy();
    let { mes, anio } = mesAnioActual();

    let totalHoy = 0;
    let totalMes = 0;

    ventas.forEach(function(v) {
        if (v.fecha === hoy) totalHoy += v.total;
        let p = v.fecha.split("/");
        if (p.length === 3 && parseInt(p[1]) === mes && parseInt(p[2]) === anio) {
            totalMes += v.total;
        }
    });

    document.getElementById("ventasHoy").textContent  = "S/" + totalHoy.toFixed(2);
    document.getElementById("gananciaMes").textContent = "S/" + totalMes.toFixed(2);
    /* Top productos */
    let conteo = {};
    ventas.forEach(function(v) {
        (v.detalle || []).forEach(function(item) {
            conteo[item.nombre] = (conteo[item.nombre] || 0) + item.cantidad;
        });
    });
    let top = Object.entries(conteo).sort((a,b) => b[1]-a[1]);
    let txtTop = top.length > 0 ? top[0][0] : "Sin ventas";
    document.getElementById("masVendido").textContent = txtTop;
    /* Stock bajo dinámico */
    let bajo = productos.filter(p => p.stock <= (p.stockMinimo != null ? p.stockMinimo : 5)).length;
    document.getElementById("stockBajo").textContent = bajo;

    /* Renderizar Alertas Empresariales */
    let panelAlertas = document.getElementById("panelAlertas");
    let sinAlertas = document.getElementById("sinAlertas");
    let contadorAlertas = document.getElementById("contadorAlertas");
    
    if(panelAlertas) {
        panelAlertas.innerHTML = "";
        let countAlertas = 0;
        productos.forEach(p => {
            let limite = p.stockMinimo != null ? p.stockMinimo : 5;
            if (p.stock === 0) {
                countAlertas++;
                panelAlertas.innerHTML += `
                <div class="alert-item alert-critico">
                    <div class="alert-info">
                        <span class="alert-icon">🚫</span>
                        <div class="alert-details">
                            <h4>${p.nombre}</h4>
                            <p>Sin stock disponible (Mínimo: ${limite} ${p.unidad || 'unid.'})</p>
                        </div>
                    </div>
                    <span class="alert-badge badge-critico">AGOTADO</span>
                </div>`;
            } else if (p.stock <= limite) {
                countAlertas++;
                panelAlertas.innerHTML += `
                <div class="alert-item alert-advertencia">
                    <div class="alert-info">
                        <span class="alert-icon">⚠️</span>
                        <div class="alert-details">
                            <h4>${p.nombre}</h4>
                            <p>Stock actual: ${p.stock} ${p.unidad || 'unid.'} (Mínimo: ${limite})</p>
                        </div>
                    </div>
                    <span class="alert-badge badge-advertencia">STOCK BAJO</span>
                </div>`;
            }
        });

        if (countAlertas === 0) {
            sinAlertas.classList.remove("d-none");
            panelAlertas.classList.add("d-none");
            contadorAlertas.textContent = "0 alertas";
        } else {
            sinAlertas.classList.add("d-none");
            panelAlertas.classList.remove("d-none");
            contadorAlertas.textContent = `${countAlertas} alerta${countAlertas>1?'s':''}`;
        }
    }

    /* Últimas 5 ventas */
    let tabla  = document.getElementById("tablaUltimasVentas");
    let sinMsg = document.getElementById("sinVentas");
    tabla.innerHTML = "";
    if (ventas.length === 0) {
        if (sinMsg) sinMsg.classList.remove("d-none");
        return;
    }
    if (sinMsg) sinMsg.classList.add("d-none");
    [...ventas].reverse().slice(0, 5).forEach(function(v) {
        tabla.innerHTML += `
        <tr>
            <td>${v.codigo}</td>
            <td>${v.fecha}</td>
            <td>S/${v.total.toFixed(2)}</td>
            <td><span class="badge-pago">${v.pago}</span></td>
        </tr>`;
    });
}

function abrirModal(tipo) {
    let titulo = document.getElementById("modalTitulo");
    let cuerpo = document.getElementById("modalCuerpo");
    let hoy    = fechaHoy();
    let { mes, anio } = mesAnioActual();

    if (tipo === "hoy") {
        titulo.textContent = "💰 Ventas de hoy — " + hoy;
        let ventasHoy = ventas.filter(v => v.fecha === hoy);

        if (ventasHoy.length === 0) {
            cuerpo.innerHTML = "<p class='text-secondary text-center py-3'>No hay ventas registradas hoy.</p>";
        } else {
            let total = ventasHoy.reduce((s, v) => s + v.total, 0);
            cuerpo.innerHTML = `
            <p class="text-warning fw-bold mb-3">Total del día: S/${total.toFixed(2)}</p>
            <div class="table-responsive">
            <table class="table table-dark table-bordered table-sm">
                <thead class="table-warning text-dark">
                    <tr>
                        <th>Código</th><th>Hora / Productos</th><th>Total</th><th>Pago</th>
                    </tr>
                </thead>
                <tbody>
                ${ventasHoy.map(function(v) {
                    let items = (v.detalle||[]).map(d => d.nombre + " ×" + d.cantidad).join(", ");
                    return `<tr>
                        <td>${v.codigo}</td>
                        <td><small class="text-secondary">${items || "—"}</small></td>
                        <td>S/${v.total.toFixed(2)}</td>
                        <td><span class="badge-pago">${v.pago}</span></td>
                    </tr>`;
                }).join("")}
                </tbody>
            </table>
            </div>`;
        }
    }

    else if (tipo === "mes") {
        let meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
                    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
        titulo.textContent = " Ganancias de " + meses[mes-1] + " " + anio;

        let ventasMes = ventas.filter(function(v) {
            let p = v.fecha.split("/");
            return p.length===3 && parseInt(p[1])===mes && parseInt(p[2])===anio;
        });

        if (ventasMes.length === 0) {
            cuerpo.innerHTML = "<p class='text-secondary text-center py-3'>No hay ventas este mes.</p>";
        } else {
            /* Agrupar por día */
            let porDia = {};
            ventasMes.forEach(function(v) {
                let dia = v.fecha.split("/")[0];
                porDia[dia] = (porDia[dia] || 0) + v.total;
            });
            let totalMes = ventasMes.reduce((s,v) => s+v.total, 0);
            cuerpo.innerHTML = `
            <p class="text-warning fw-bold mb-3">
                Total del mes: S/${totalMes.toFixed(2)} 
                <span class="text-secondary fw-normal">(${ventasMes.length} ventas)</span>
            </p>
            <div class="table-responsive">
            <table class="table table-dark table-bordered table-sm">
                <thead class="table-warning text-dark">
                    <tr><th>Día</th><th>Total recaudado</th><th>N° ventas</th></tr>
                </thead>
                <tbody>
                ${Object.keys(porDia).sort().map(function(dia) {
                    let cantDia = ventasMes.filter(v => v.fecha.split("/")[0]===dia).length;
                    return `<tr>
                        <td>${dia}/${String(mes).padStart(2,"0")}/${anio}</td>
                        <td>S/${porDia[dia].toFixed(2)}</td>
                        <td>${cantDia}</td>
                    </tr>`;
                }).join("")}
                </tbody>
            </table>
            </div>`;
        }
    }

    else if (tipo === "top") {
        titulo.textContent = " Productos más vendidos";

        let conteo = {};
        ventas.forEach(function(v) {
            (v.detalle||[]).forEach(function(item) {
                if (!conteo[item.nombre]) conteo[item.nombre] = { cantidad: 0, codigo: item.codigo };
                conteo[item.nombre].cantidad += item.cantidad;
            });
        });
        let top = Object.entries(conteo).sort((a,b) => b[1].cantidad - a[1].cantidad);
        if (top.length === 0) {
            cuerpo.innerHTML = "<p class='text-secondary text-center py-3'>Aún no hay ventas registradas.</p>";
        } else {
            let medallas = ["1","2","3"];
            cuerpo.innerHTML = `
            <div class="table-responsive">
            <table class="table table-dark table-bordered table-sm">
                <thead class="table-warning text-dark">
                    <tr>
                        <th>#</th>
                        <th>Producto</th>
                        <th>Unidades vendidas</th>
                        <th>Stock actual</th>
                    </tr>
                </thead>
                <tbody>
                ${top.map(function([nombre, data], i) {
                    let prod = productos.find(p => p.nombre === nombre);
                    let stockActual = prod ? prod.stock : "—";
                    let limite = prod ? (prod.stockMinimo != null ? prod.stockMinimo : 5) : 0;
                    let stockClase = prod && prod.stock === 0 ? "stock-critico" : (prod && prod.stock <= limite ? "stock-bajo" : "stock-ok");
                    let iconStock = prod && prod.stock === 0 ? "🚫" : (prod && prod.stock <= limite ? "⚠️" : "");
                    let medalla = medallas[i] || (i+1) + "°";
                    return `<tr>
                        <td>${medalla}</td>
                        <td><strong>${nombre}</strong></td>
                        <td>${data.cantidad} uds.</td>
                        <td class="${stockClase}">${stockActual} ${iconStock}</td>
                    </tr>`;
                }).join("")}
                </tbody>
            </table>
            </div>`;
        }
    }

    else if (tipo === "stock") {
        titulo.textContent = " Productos con alertas de stock";
        let bajos = productos.filter(p => p.stock <= (p.stockMinimo != null ? p.stockMinimo : 5));
        if (bajos.length === 0) {
            cuerpo.innerHTML = "<p class='text-success text-center py-3'> Todos los productos tienen stock suficiente.</p>";
        } else {
            cuerpo.innerHTML = `
            <p class="text-warning mb-3">
                ${bajos.length} producto(s) en nivel de alerta.
            </p>
            <div class="table-responsive">
            <table class="table table-dark table-bordered table-sm">
                <thead class="table-warning text-dark">
                    <tr><th>Código</th><th>Producto</th><th>Stock</th><th>Precio</th></tr>
                </thead>
                <tbody>
                ${bajos.map(function(p) {
                    let limite = p.stockMinimo != null ? p.stockMinimo : 5;
                    let claseStock = p.stock === 0 ? "stock-critico" : "stock-bajo";
                    return `<tr>
                        <td>${p.codigo}</td>
                        <td>${p.nombre} <small class="text-secondary">(Mín: ${limite})</small></td>
                        <td class="${claseStock}">${p.stock} ${p.stock===0?"🚫":"⚠️"}</td>
                        <td>S/${p.precio.toFixed(2)}</td>
                    </tr>`;
                }).join("")}
                </tbody>
            </table>
            </div>`;
            
        }
    }
    new bootstrap.Modal(document.getElementById("modalDetalle")).show();
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
        actualizarDashboard();
    } catch (err) {
        console.error(err);
        mostrarToast(" No se pudo conectar con el servidor.");
    }
}
iniciarSistema();
