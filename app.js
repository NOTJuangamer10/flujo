// Flujo · Beta 1
// Libro de gastos con estilo editorial
// Todo en localStorage, sin servidor

var CLAVE = 'flujo_gastos';

// Estado: mes seleccionado (anio-mes, ej "2025-08")
var mesActual = new Date().toISOString().slice(0, 7);

// Mapear categorías a etiquetas legibles (minúsculas, estilo libro)
var ETIQUETAS_CAT = {
    comida: 'comida',
    transporte: 'transporte',
    ocio: 'ocio',
    casa: 'casa',
    estudios: 'estudios',
    ropa: 'ropa',
    salud: 'salud',
    otros: 'otros'
};

// Pillo los elementos del DOM
var formGasto = document.getElementById('form-gasto');
var inputCantidad = document.getElementById('input-cantidad');
var inputCategoria = document.getElementById('input-categoria');
var inputDesc = document.getElementById('input-desc');
var inputFecha = document.getElementById('input-fecha');
var listaGastos = document.getElementById('lista-gastos');
var vacio = document.getElementById('vacio');
var totalGastado = document.getElementById('total-gastado');
var totalNumero = document.getElementById('total-numero');
var totalMedia = document.getElementById('total-media');
var mesActualSpan = document.getElementById('mes-actual');
var libroPagina = document.getElementById('libro-pagina');
var btnMesAnterior = document.getElementById('mes-anterior');
var btnMesSiguiente = document.getElementById('mes-siguiente');

// Pongo la fecha de hoy por defecto
inputFecha.value = new Date().toISOString().slice(0, 10);

// === persistencia ===
function cargarGastos() {
    var datos = localStorage.getItem(CLAVE);
    if (datos === null) {
        return [];
    }
    try {
        return JSON.parse(datos);
    } catch (e) {
        return [];
    }
}

function guardarGastos(gastos) {
    localStorage.setItem(CLAVE, JSON.stringify(gastos));
}

// === formateo ===
function formatearEuros(cantidad) {
    return cantidad.toFixed(2).replace('.', ',') + ' €';
}

function formatearFechaCorta(fechaStr) {
    var meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    var fecha = new Date(fechaStr + 'T00:00:00');
    var dia = fecha.getDate();
    var mes = meses[fecha.getMonth()];
    return String(dia).padStart(2, '0') + ' ' + mes;
}

function formatearMes(mesStr) {
    var meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    var partes = mesStr.split('-');
    var anio = partes[0];
    var mes = parseInt(partes[1], 10) - 1;
    return meses[mes] + ' ' + anio;
}

// === lógica de gastos ===
function gastosDelMes() {
    var todos = cargarGastos();
    return todos.filter(function (g) {
        return g.fecha.startsWith(mesActual);
    });
}

// Añadir gasto
formGasto.addEventListener('submit', function (e) {
    e.preventDefault();
    var cantidad = parseFloat(inputCantidad.value);
    if (isNaN(cantidad) || cantidad <= 0) {
        return;
    }

    var gasto = {
        id: Date.now(),
        cantidad: cantidad,
        categoria: inputCategoria.value,
        descripcion: inputDesc.value.trim(),
        fecha: inputFecha.value
    };

    var gastos = cargarGastos();
    gastos.push(gasto);
    guardarGastos(gastos);

    formGasto.reset();
    inputFecha.value = new Date().toISOString().slice(0, 10);
    inputCategoria.value = 'comida';
    mostrarGastos();
});

// Borrar gasto
function borrarGasto(id) {
    if (!confirm('¿Borrar este apunte?')) return;
    var gastos = cargarGastos();
    var nuevos = gastos.filter(function (g) { return g.id !== id; });
    guardarGastos(nuevos);
    mostrarGastos();
}

// === pintar la lista y totales ===
function mostrarGastos() {
    var gastos = gastosDelMes();

    // Ordenar por fecha descendente (más reciente primero)
    gastos.sort(function (a, b) {
        return b.fecha.localeCompare(a.fecha);
    });

    listaGastos.innerHTML = '';
    totalGastado.textContent = formatearEuros(0);
    totalNumero.textContent = '0';
    totalMedia.textContent = formatearEuros(0);
    libroPagina.textContent = 'p. 1';

    if (gastos.length === 0) {
        vacio.style.display = 'block';
        return;
    }
    vacio.style.display = 'none';

    var total = 0;
    gastos.forEach(function (g, i) {
        total += g.cantidad;

        var li = document.createElement('li');
        li.className = 'apunte';

        var numero = document.createElement('span');
        numero.className = 'apunte-numero';
        // Número con relleno (001, 002…) estilo libro contable
        numero.textContent = String(gastos.length - i).padStart(3, '0');

        var fecha = document.createElement('span');
        fecha.className = 'apunte-fecha';
        fecha.textContent = formatearFechaCorta(g.fecha);

        var desc = document.createElement('span');
        desc.className = 'apunte-desc';
        desc.textContent = g.descripcion || '(sin descripción)';

        var cat = document.createElement('span');
        cat.className = 'apunte-cat';
        cat.textContent = ETIQUETAS_CAT[g.categoria] || g.categoria;
        desc.appendChild(cat);

        var cantidad = document.createElement('span');
        cantidad.className = 'apunte-cantidad';
        cantidad.textContent = formatearEuros(g.cantidad);

        var borrar = document.createElement('button');
        borrar.className = 'apunte-borrar';
        borrar.textContent = '×';
        borrar.title = 'borrar';
        borrar.setAttribute('aria-label', 'borrar apunte');
        borrar.onclick = function () { borrarGasto(g.id); };

        li.appendChild(numero);
        li.appendChild(fecha);
        li.appendChild(desc);
        li.appendChild(cantidad);
        li.appendChild(borrar);
        listaGastos.appendChild(li);
    });

    totalGastado.textContent = formatearEuros(total);
    totalNumero.textContent = String(gastos.length);
    var media = total / gastos.length;
    totalMedia.textContent = formatearEuros(media);

    // Número de "página" decorativo
    var pagina = Math.floor(gastos.length / 25) + 1;
    libroPagina.textContent = 'p. ' + pagina;
}

// === cambiar de mes ===
btnMesAnterior.addEventListener('click', function () {
    var partes = mesActual.split('-');
    var anio = parseInt(partes[0], 10);
    var mes = parseInt(partes[1], 10);
    mes--;
    if (mes < 1) { mes = 12; anio--; }
    mesActual = anio + '-' + String(mes).padStart(2, '0');
    actualizarMes();
    mostrarGastos();
});

btnMesSiguiente.addEventListener('click', function () {
    var partes = mesActual.split('-');
    var anio = parseInt(partes[0], 10);
    var mes = parseInt(partes[1], 10);
    mes++;
    if (mes > 12) { mes = 1; anio++; }
    mesActual = anio + '-' + String(mes).padStart(2, '0');
    actualizarMes();
    mostrarGastos();
});

function actualizarMes() {
    mesActualSpan.textContent = formatearMes(mesActual);
}

// === al cargar ===
actualizarMes();
mostrarGastos();



// === BETA 2: diagrama de Sankey + gráficos + ingresos ===
// Añade:
// 1. Gestión de ingresos (fuentes de dinero)
// 2. Diagrama de Sankey (ingresos -> total -> categorías)
// 3. Gráfico de barras apiladas (últimos 6 meses)
// 4. Gráfico de donut (desglose por categoría este mes)
// Todo dibujado en canvas vanilla, sin librerías


// --- paleta de colores por categoría (muted, editorial) ---
var COLORES_CAT = {
    comida: '#b8860b',
    transporte: '#4a6b8a',
    ocio: '#b06a8a',
    casa: '#6b8a5a',
    estudios: '#6a5a8a',
    ropa: '#b56a4a',
    salud: '#9a4a4a',
    otros: '#7a7a6a'
};

// Helper: ajustar canvas al tamaño CSS y devicePixelRatio
function prepareCanvas(canvas) {
    var dpr = window.devicePixelRatio || 1;
    var rect = canvas.getBoundingClientRect();
    var cssW = Math.max(1, Math.round(rect.width));
    var cssH = Math.max(1, Math.round(rect.height));
    if (canvas.width !== cssW * dpr || canvas.height !== cssH * dpr) {
        canvas.width = cssW * dpr;
        canvas.height = cssH * dpr;
    }
    var ctx = canvas.getContext('2d');
    // reset transform and scale so subsequent drawing uses CSS px coordinates
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    return { ctx: ctx, w: cssW, h: cssH, dpr: dpr };
}

// Helper: convertir hex (#rrggbb or #rgb) a rgba(...) con alpha
function hexToRgba(hex, alpha) {
    if (!hex) return 'rgba(122,122,122,' + (alpha || 1) + ')';
    var h = hex.replace('#', '');
    if (h.length === 3) {
        h = h.split('').map(function (c) { return c + c; }).join('');
    }
    var r = parseInt(h.substring(0, 2), 16);
    var g = parseInt(h.substring(2, 4), 16);
    var b = parseInt(h.substring(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + (alpha == null ? 1 : alpha) + ')';
}


// --- ingresos ---
var CLAVE_INGRESOS = 'flujo_ingresos';

function cargarIngresos() {
    var datos = localStorage.getItem(CLAVE_INGRESOS);
    if (datos === null) return [];
    try { return JSON.parse(datos); } catch (e) { return []; }
}

function guardarIngresos(lista) {
    localStorage.setItem(CLAVE_INGRESOS, JSON.stringify(lista));
}

// creo la sección de ingresos y la meto entre el balance y el formulario
var seccionIngresos = document.createElement('section');
seccionIngresos.className = 'ingresos';
seccionIngresos.innerHTML =
    '<div class="ingresos-titulo">fuentes de ingreso</div>' +
    '<form id="form-ingreso" class="form-ingreso">' +
    '<input type="text" id="input-fuente" placeholder="beca, padres, trabajo…" required>' +
    '<input type="number" id="input-importe-ing" step="0.01" min="0" placeholder="0,00" required>' +
    '<button type="submit">añadir</button>' +
    '</form>' +
    '<ul id="lista-ingresos" class="lista-ingresos"></ul>';
// la meto después del balance, antes del formulario
var balanceSeccion = document.querySelector('.balance');
balanceSeccion.parentNode.insertBefore(seccionIngresos, balanceSeccion.nextSibling);

var formIngreso = document.getElementById('form-ingreso');
var inputFuente = document.getElementById('input-fuente');
var inputImporteIng = document.getElementById('input-importe-ing');
var listaIngresos = document.getElementById('lista-ingresos');

formIngreso.addEventListener('submit', function (e) {
    e.preventDefault();
    var importe = parseFloat(inputImporteIng.value);
    if (isNaN(importe) || importe <= 0) return;
    var ingresos = cargarIngresos();
    ingresos.push({
        id: Date.now(),
        fuente: inputFuente.value.trim(),
        cantidad: importe
    });
    guardarIngresos(ingresos);
    formIngreso.reset();
    mostrarIngresos();
    actualizarBalance();
    dibujarTodo();
});

function borrarIngreso(id) {
    if (!confirm('¿Borrar esta fuente de ingreso?')) return;
    var ingresos = cargarIngresos();
    guardarIngresos(ingresos.filter(function (i) { return i.id !== id; }));
    mostrarIngresos();
    actualizarBalance();
    dibujarTodo();
}

function mostrarIngresos() {
    var ingresos = cargarIngresos();
    listaIngresos.innerHTML = '';
    if (ingresos.length === 0) return;
    ingresos.forEach(function (ing) {
        var li = document.createElement('li');
        li.className = 'ingreso-item';
        var texto = document.createElement('span');
        texto.className = 'ingreso-fuente';
        texto.textContent = ing.fuente;
        var cant = document.createElement('span');
        cant.className = 'ingreso-cantidad';
        cant.textContent = formatearEuros(ing.cantidad);
        var btn = document.createElement('button');
        btn.className = 'ingreso-borrar';
        btn.textContent = '×';
        btn.setAttribute('aria-label', 'borrar ingreso');
        btn.onclick = function () { borrarIngreso(ing.id); };
        li.appendChild(texto);
        li.appendChild(cant);
        li.appendChild(btn);
        listaIngresos.appendChild(li);
    });
}

// extiendo el balance para mostrar ingresos y saldo
function actualizarBalance() {
    var gastosMes = gastosDelMes();
    var totalG = gastosMes.reduce(function (s, g) { return s + g.cantidad; }, 0);
    var ingresos = cargarIngresos();
    var totalI = ingresos.reduce(function (s, i) { return s + i.cantidad; }, 0);
    var saldo = totalI - totalG;

    // actualizo el primer item del balance (gastado) y añado ingresos + saldo
    var balance = document.querySelector('.balance');
    // si ya tiene ingresos/saldo no los duplico
    if (!document.getElementById('balance-ingresos')) {
        var sep1 = document.createElement('div');
        sep1.className = 'balance-sep';
        var itemIng = document.createElement('div');
        itemIng.className = 'balance-item';
        itemIng.id = 'balance-ingresos';
        itemIng.innerHTML = '<div class="balance-etiqueta">ingresos</div><div class="balance-cantidad" id="total-ingresos">0,00 €</div>';
        var sep2 = document.createElement('div');
        sep2.className = 'balance-sep';
        var itemSal = document.createElement('div');
        itemSal.className = 'balance-item';
        itemSal.id = 'balance-saldo';
        itemSal.innerHTML = '<div class="balance-etiqueta">saldo</div><div class="balance-cantidad" id="total-saldo">0,00 €</div>';
        balance.appendChild(sep1);
        balance.appendChild(itemIng);
        balance.appendChild(sep2);
        balance.appendChild(itemSal);
    }
    document.getElementById('total-ingresos').textContent = formatearEuros(totalI);
    var saldoEl = document.getElementById('total-saldo');
    saldoEl.textContent = formatearEuros(saldo);
    saldoEl.style.color = saldo < 0 ? '#a83232' : '#2d5e3e';
}


// --- sección de gráficos ---
var seccionGraficos = document.createElement('section');
seccionGraficos.className = 'graficos';
seccionGraficos.innerHTML =
    '<div class="graficos-titulo">flujo de dinero</div>' +
    '<canvas id="sankey" width="600" height="320"></canvas>' +
    '<div class="graficos-grid">' +
    '<div class="grafico-block">' +
    '<div class="grafico-subtitulo">últimos 6 meses</div>' +
    '<canvas id="barras" width="560" height="200"></canvas>' +
    '</div>' +
    '<div class="grafico-block">' +
    '<div class="grafico-subtitulo">por categoría</div>' +
    '<canvas id="donut" width="240" height="240"></canvas>' +
    '<div id="donut-leyenda" class="donut-leyenda"></div>' +
    '</div>' +
    '</div>';
// la meto después de los ingresos, antes del formulario
seccionIngresos.parentNode.insertBefore(seccionGraficos, seccionIngresos.nextSibling);

var canvasSankey = document.getElementById('sankey');
var canvasBarras = document.getElementById('barras');
var canvasDonut = document.getElementById('donut');


// --- dibujar el diagrama de Sankey ---
// ingresos (izq) -> total (centro) -> categorías (der)
function dibujarSankey() {
    var p = prepareCanvas(canvasSankey);
    var ctx = p.ctx;
    var w = p.w;
    var h = p.h;
    ctx.clearRect(0, 0, w, h);

    var ingresos = cargarIngresos();
    var gastosMes = gastosDelMes();

    // agrupar gastos por categoría
    var porCat = {};
    gastosMes.forEach(function (g) {
        if (!porCat[g.categoria]) porCat[g.categoria] = 0;
        porCat[g.categoria] += g.cantidad;
    });

    var totalG = gastosMes.reduce(function (s, g) { return s + g.cantidad; }, 0);
    var totalI = ingresos.reduce(function (s, i) { return s + i.cantidad; }, 0);

    if (totalG === 0 && totalI === 0) {
        ctx.fillStyle = '#9a9a9a';
        ctx.font = 'italic 16px Fraunces, Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('sin datos para mostrar', w / 2, h / 2);
        return;
    }

    // si no hay ingresos, uso el total de gastos como "flujo"
    var total = Math.max(totalI, totalG);
    if (total === 0) total = 1;

    // layout
    var margenSup = 30;
    var margenInf = 30;
    var alturaDisp = h - margenSup - margenInf;
    var xIzq = 80;
    var xCen = w / 2;
    var xDer = w - 80;
    var anchoNodo = 16;
    var gap = 4;

    // calcular alturas de nodos
    var nodosIzq = ingresos.map(function (i) {
        return { nombre: i.fuente, valor: i.cantidad, color: '#2d5e3e' };
    });
    if (nodosIzq.length === 0 && totalG > 0) {
        nodosIzq = [{ nombre: 'gastos', valor: totalG, color: '#5c5c5c' }];
    }

    var nodosDer = Object.keys(porCat).map(function (cat) {
        return { nombre: cat, valor: porCat[cat], color: COLORES_CAT[cat] || '#7a7a6a' };
    });
    if (nodosDer.length === 0) {
        nodosDer = [{ nombre: 'sin gastos', valor: 0, color: '#7a7a6a' }];
    }

    // posicionar nodos izquierda
    var y = margenSup;
    var sumaIzq = nodosIzq.reduce(function (s, n) { return s + n.valor; }, 0) || total;
    nodosIzq.forEach(function (n) {
        n.altura = (n.valor / sumaIzq) * alturaDisp;   // ✅ BIEN
        n.y = y;
        y += n.altura + gap;
    });

    // posicionar nodos derecha (usando su propia suma para que llenen el espacio)
    y = margenSup;
    var sumaDer = nodosDer.reduce(function (s, n) { return s + n.valor; }, 0) || 1;
    nodosDer.forEach(function (n) {
        n.altura = (n.valor / sumaDer) * alturaDisp;   // ✅ BIEN
        n.y = y;
        y += n.altura + gap;
    });

    // nodo central (total)
    var cenAltura = alturaDisp;
    var cenY = margenSup;

    // dibujar curvas de izquierda a centro
    nodosIzq.forEach(function (n) {
        if (n.altura < 1) return;
        var yInicio = n.y;
        var yFin = cenY + (n.y - margenSup) / (alturaDisp) * cenAltura;
        // simplifico: el flujo va al centro proporcionalmente
        ctx.fillStyle = hexToRgba(n.color, 0.25);
        ctx.beginPath();
        ctx.moveTo(xIzq + anchoNodo, yInicio);
        ctx.bezierCurveTo(
            (xIzq + xCen) / 2, yInicio,
            (xIzq + xCen) / 2, yFin,
            xCen - anchoNodo / 2, yFin);
        ctx.lineTo(xCen - anchoNodo / 2, yFin + n.altura);
        ctx.bezierCurveTo(
            (xIzq + xCen) / 2, yFin + n.altura,
            (xIzq + xCen) / 2, yInicio + n.altura,
            xIzq + anchoNodo, yInicio + n.altura);
        ctx.closePath();
        ctx.fill();
    });

    // dibujar curvas de centro a derecha
    nodosDer.forEach(function (n) {
        if (n.altura < 1) return;
        var yInicio = cenY + (n.y - margenSup) / (alturaDisp) * cenAltura;
        var yFin = n.y;
        ctx.fillStyle = hexToRgba(n.color, 0.25);
        ctx.beginPath();
        ctx.moveTo(xCen + anchoNodo / 2, yInicio);
        ctx.bezierCurveTo(
            (xCen + xDer) / 2, yInicio,
            (xCen + xDer) / 2, yFin,
            xDer - anchoNodo, yFin);
        ctx.lineTo(xDer - anchoNodo, yFin + n.altura);
        ctx.bezierCurveTo(
            (xCen + xDer) / 2, yFin + n.altura,
            (xCen + xDer) / 2, yInicio + n.altura,
            xCen + anchoNodo / 2, yInicio + n.altura);
        ctx.closePath();
        ctx.fill();
    });

    // dibujar nodos izquierda
    nodosIzq.forEach(function (n) {
        if (n.altura < 1) return;
        ctx.fillStyle = n.color;
        ctx.fillRect(xIzq, n.y, anchoNodo, n.altura);
        // etiqueta
        ctx.fillStyle = '#1a1a1a';
        ctx.font = '11px "Inter Tight", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(n.nombre, xIzq - 8, n.y + n.altura / 2 + 4);
        ctx.fillStyle = '#5c5c5c';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillText(formatearEuros(n.valor), xIzq - 8, n.y + n.altura / 2 + 18);
    });

    // dibujar nodo central
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(xCen - anchoNodo / 2, cenY, anchoNodo, cenAltura);

    // dibujar nodos derecha
    nodosDer.forEach(function (n) {
        if (n.altura < 1) return;
        ctx.fillStyle = n.color;
        ctx.fillRect(xDer, n.y, anchoNodo, n.altura);
        // etiqueta
        ctx.fillStyle = '#1a1a1a';
        ctx.font = '11px "Inter Tight", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(n.nombre, xDer + anchoNodo + 8, n.y + n.altura / 2 + 4);
        ctx.fillStyle = '#5c5c5c';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillText(formatearEuros(n.valor), xDer + anchoNodo + 8, n.y + n.altura / 2 + 18);
    });
}


// --- dibujar barras apiladas (últimos 6 meses) ---
function dibujarBarras() {
    var p = prepareCanvas(canvasBarras);
    var ctx = p.ctx;
    var w = p.w;
    var h = p.h;
    ctx.clearRect(0, 0, w, h);

    var todos = cargarGastos();
    var meses = [];
    var hoy = new Date();
    for (var i = 5; i >= 0; i--) {
        var d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
        var key = d.toISOString().slice(0, 7);
        var label = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][d.getMonth()];
        var gastosMes = todos.filter(function (g) { return g.fecha.startsWith(key); });
        var porCat = {};
        gastosMes.forEach(function (g) {
            if (!porCat[g.categoria]) porCat[g.categoria] = 0;
            porCat[g.categoria] += g.cantidad;
        });
        meses.push({ label: label, porCat: porCat });
    }

    var maxTotal = Math.max.apply(null, meses.map(function (m) {
        return Object.keys(m.porCat).reduce(function (s, k) { return s + m.porCat[k]; }, 0);
    }).concat([1]));

    var margenIzq = 40;
    var margenInf = 24;
    var margenSup = 10;
    var margenDer = 10;
    var areaW = w - margenIzq - margenDer;
    var areaH = h - margenSup - margenInf;
    var anchoBarra = areaW / 6 * 0.6;
    var gapBarra = areaW / 6 * 0.4;

    // eje Y (líneas de referencia)
    ctx.strokeStyle = '#ece6d8';
    ctx.lineWidth = 1;
    for (var n = 0; n <= 4; n++) {
        var yLinea = margenSup + (areaH / 4) * n;
        ctx.beginPath();
        ctx.moveTo(margenIzq, yLinea);
        ctx.lineTo(w - margenDer, yLinea);
        ctx.stroke();
        // etiqueta del eje
        var valor = maxTotal * (1 - n / 4);
        ctx.fillStyle = '#9a9a9a';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(formatearEuros(valor).replace(' €', ''), margenIzq - 6, yLinea + 3);
    }

    // dibujar barras
    meses.forEach(function (m, i) {
        var x = margenIzq + (anchoBarra + gapBarra) * i + gapBarra / 2;
        var yAcum = margenSup + areaH;
        Object.keys(m.porCat).forEach(function (cat) {
            var valor = m.porCat[cat];
            var alturaBarra = (valor / maxTotal) * areaH;
            ctx.fillStyle = COLORES_CAT[cat] || '#7a7a6a';
            ctx.fillRect(x, yAcum - alturaBarra, anchoBarra, alturaBarra);
            yAcum -= alturaBarra;
        });
        // etiqueta del mes
        ctx.fillStyle = '#5c5c5c';
        ctx.font = '10px "Inter Tight", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(m.label, x + anchoBarra / 2, h - 8);
    });
}


// --- dibujar donut (desglose por categoría este mes) ---
function dibujarDonut() {
    var p = prepareCanvas(canvasDonut);
    var ctx = p.ctx;
    var w = p.w;
    var h = p.h;
    ctx.clearRect(0, 0, w, h);

    var gastosMes = gastosDelMes();
    var porCat = {};
    gastosMes.forEach(function (g) {
        if (!porCat[g.categoria]) porCat[g.categoria] = 0;
        porCat[g.categoria] += g.cantidad;
    });

    var total = gastosMes.reduce(function (s, g) { return s + g.cantidad; }, 0);

    if (total === 0) {
        ctx.fillStyle = '#9a9a9a';
        ctx.font = 'italic 13px Fraunces, Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('sin gastos', w / 2, h / 2);
        return;
    }

    var cx = w / 2;
    var cy = h / 2;
    var radioExt = Math.min(w, h) / 2 - 10;
    var radioInt = radioExt * 0.6;

    var anguloInicio = -Math.PI / 2;
    var cats = Object.keys(porCat);

    cats.forEach(function (cat) {
        var valor = porCat[cat];
        var angulo = (valor / total) * Math.PI * 2;
        ctx.fillStyle = COLORES_CAT[cat] || '#7a7a6a';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radioExt, anguloInicio, anguloInicio + angulo);
        ctx.closePath();
        ctx.fill();
        anguloInicio += angulo;
    });

    // agujero del donut
    ctx.fillStyle = '#faf7f2';
    ctx.beginPath();
    ctx.arc(cx, cy, radioInt, 0, Math.PI * 2);
    ctx.fill();

    // texto central
    ctx.fillStyle = '#1a1a1a';
    ctx.font = '600 16px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(formatearEuros(total), cx, cy + 2);
    ctx.fillStyle = '#9a9a9a';
    ctx.font = '9px "Inter Tight", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TOTAL', cx, cy + 16);

    // leyenda
    var leyenda = document.getElementById('donut-leyenda');
    leyenda.innerHTML = '';
    cats.forEach(function (cat) {
        var item = document.createElement('div');
        item.className = 'leyenda-item';
        var dot = document.createElement('span');
        dot.className = 'leyenda-dot';
        dot.style.background = COLORES_CAT[cat] || '#7a7a6a';
        var texto = document.createElement('span');
        texto.className = 'leyenda-texto';
        texto.textContent = cat + ' · ' + Math.round((porCat[cat] / total) * 100) + '%';
        item.appendChild(dot);
        item.appendChild(texto);
        leyenda.appendChild(item);
    });
}


// --- dibujar todos los gráficos ---
function dibujarTodo() {
    dibujarSankey();
    dibujarBarras();
    dibujarDonut();
}


// --- extender mostrarGastos para actualizar balance y gráficos ---
// uso function expression para evitar el bug de hoisting
var mostrarGastosViejo = mostrarGastos;
mostrarGastos = function () {
    mostrarGastosViejo();
    actualizarBalance();
    dibujarTodo();
};


// --- inicializar ---
mostrarIngresos();
actualizarBalance();
dibujarTodo();



// === BETA 2.1: Sankey redibujado + fix timezone barras ===
// Reescribo dibujarSankey con un algoritmo mejor:
//   - nodos centrados verticalmente (no apilados desde arriba)
//   - nodos redondeados con sombra suave
//   - una sola curva bezier por cinta (puntos de control al 42%, como D3)
//   - paleta editorial (verde ingresos, tinta centro, crema + acento gastos)
// Tambien arreglo el bug de timezone en las barras (toISOString da mal el mes
// cerca de medianoche por la conversion UTC)


// redefino dibujarSankey usando asignacion (no declaration) para pisar la vieja
dibujarSankey = function () {
    var p = prepareCanvas(canvasSankey);
    var ctx = p.ctx, w = p.w, h = p.h;
    ctx.clearRect(0, 0, w, h);

    var ingresos = cargarIngresos();
    var gastosMes = gastosDelMes();
    var porCat = {};
    gastosMes.forEach(function (g) {
        if (!porCat[g.categoria]) porCat[g.categoria] = 0;
        porCat[g.categoria] += g.cantidad;
    });
    var totalG = gastosMes.reduce(function (s, g) { return s + g.cantidad; }, 0);
    var totalI = ingresos.reduce(function (s, i) { return s + i.cantidad; }, 0);

    if (totalG === 0 && totalI === 0) {
        ctx.fillStyle = '#9a9a9a';
        ctx.font = 'italic 16px Fraunces, Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('sin datos para mostrar', w / 2, h / 2);
        return;
    }

    var total = Math.max(totalI, totalG, 1);

    // layout
    var nodeW = 100, nodeR = 4, gap = 5;
    var pad = 10, mTop = 10, mBot = 10;
    var areaH = h - mTop - mBot;
    var xL = pad;
    var xC = (w - nodeW) / 2;
    var xR = w - nodeW - pad;

    // nodos izquierda (ingresos)
    var left = ingresos.map(function (i) {
        return { label: i.fuente, value: i.cantidad };
    });
    if (left.length === 0 && totalG > 0) {
        left = [{ label: 'gastos', value: totalG }];
    }

    // nodos derecha (categorias)
    var right = Object.keys(porCat).map(function (cat) {
        return { label: cat, value: porCat[cat], cat: cat };
    });
    if (right.length === 0) {
        right = [{ label: 'sin gastos', value: 0, cat: 'otros' }];
    }

    var sumL = left.reduce(function (s, n) { return s + n.value; }, 0) || total;
    var sumR = right.reduce(function (s, n) { return s + n.value; }, 0) || 1;
    var minH = 38;

    // posicionar nodos centrados verticalmente
    function layoutCol(nodes, sum) {
        var totalH = 0;
        nodes.forEach(function (n) {
            n.h = Math.max(minH, (n.value / sum) * areaH);
            totalH += n.h;
        });
        if (totalH > areaH) {
            var sc = (areaH - gap * (nodes.length - 1)) / totalH;
            nodes.forEach(function (n) { n.h = Math.max(minH, n.h * sc); });
            totalH = nodes.reduce(function (s, n) { return s + n.h; }, 0);
        }
        var y = mTop + (areaH - totalH - gap * (nodes.length - 1)) / 2;
        nodes.forEach(function (n) { n.y = y; y += n.h + gap; });
    }
    layoutCol(left, sumL);
    layoutCol(right, sumR);
    var cenH = areaH, cenY = mTop;

    // helper: rectangulo redondeado
    function rrect(x, y, w, h, r) {
        r = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y, x + w, y + r, r);
        ctx.lineTo(x + w, y + h - r);
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h);
        ctx.arcTo(x, y + h, x, y + h - r, r);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();
    }

    // helper: dibujar una cinta (flujo) con una sola curva bezier
    function flow(x0, y0, h0, x1, y1, h1, col) {
        ctx.fillStyle = col;
        ctx.beginPath();
        var cp = Math.abs(x1 - x0) * 0.42;
        ctx.moveTo(x0, y0);
        ctx.bezierCurveTo(x0 + cp, y0, x1 - cp, y1, x1, y1);
        ctx.lineTo(x1, y1 + h1);
        ctx.bezierCurveTo(x1 - cp, y1 + h1, x0 + cp, y0 + h0, x0, y0 + h0);
        ctx.closePath();
        ctx.fill();
    }

    // helper: dibujar nodo con sombra y acento opcional
    function nodeBox(n, x, bg, accent) {
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.08)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetY = 2;
        ctx.fillStyle = bg;
        rrect(x, n.y, nodeW, n.h, nodeR);
        ctx.fill();
        ctx.restore();
        if (accent) {
            ctx.save();
            rrect(x, n.y, nodeW, n.h, nodeR);
            ctx.clip();
            ctx.fillStyle = accent;
            ctx.fillRect(x, n.y, 5, n.h);
            ctx.restore();
        }
    }

    // helper: texto del nodo
    function nodeText(n, x, accent, sum, light) {
        var txCol = light ? '#fff' : '#1a1a1a';
        var subCol = light ? 'rgba(255,255,255,0.7)' : '#5c5c5c';
        var tx = accent ? x + 14 : x + 10;
        var mw = nodeW - (accent ? 24 : 20);
        ctx.fillStyle = txCol;
        ctx.font = '600 11px "Inter Tight", sans-serif';
        ctx.textAlign = 'left';
        ctx.save();
        ctx.beginPath();
        ctx.rect(tx, n.y, mw, n.h);
        ctx.clip();
        ctx.fillText(n.label, tx, n.y + n.h / 2 - 2);
        ctx.restore();
        var pct = ((n.value / sum) * 100).toFixed(1) + '%';
        ctx.fillStyle = subCol;
        ctx.font = '400 9px "JetBrains Mono", monospace';
        ctx.fillText(formatearEuros(n.value) + ' (' + pct + ')', tx, n.y + n.h / 2 + 11);
    }

    // flujos izq -> centro (verde editorial semitransparente)
    var leftH = left.reduce(function (s, n) { return s + n.h; }, 0);
    left.forEach(function (n) {
        if (n.h < 2) return;
        var yDst = cenY + ((n.y - left[0].y) / leftH) * cenH;
        var hDst = (n.h / leftH) * cenH;
        flow(xL + nodeW, n.y, n.h, xC, yDst, hDst, 'rgba(45,94,62,0.25)');
    });

    // flujos centro -> der (color de cada categoria)
    var rightH = right.reduce(function (s, n) { return s + n.h; }, 0);
    right.forEach(function (n) {
        if (n.h < 2) return;
        var ySrc = cenY + ((n.y - right[0].y) / rightH) * cenH;
        var hSrc = (n.h / rightH) * cenH;
        var col = COLORES_CAT[n.cat] || '#7a7a6a';
        flow(xC + nodeW, ySrc, hSrc, xR, n.y, n.h, hexToRgba(col, 0.3));
    });

    // nodos izquierda (verde oscuro, texto blanco)
    left.forEach(function (n) {
        nodeBox(n, xL, '#2d5e3e', null);
        nodeText(n, xL, null, sumL, true);
    });

    // nodo centro (tinta negra, texto blanco)
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.1)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = '#1a1a1a';
    rrect(xC, cenY, nodeW, cenH, nodeR);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#fff';
    ctx.font = '600 12px "Inter Tight", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('total', xC + nodeW / 2, cenY + cenH / 2 - 6);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '400 10px "JetBrains Mono", monospace';
    ctx.fillText(formatearEuros(total) + ' (100.0%)', xC + nodeW / 2, cenY + cenH / 2 + 8);

    // nodos derecha (crema + franja de color de categoria)
    right.forEach(function (n) {
        var accent = COLORES_CAT[n.cat] || '#7a7a6a';
        nodeBox(n, xR, '#f3eee5', accent);
        nodeText(n, xR, accent, sumR, false);
    });
};


// redefino dibujarBarras con el fix de timezone
dibujarBarras = function () {
    var p = prepareCanvas(canvasBarras);
    var ctx = p.ctx, w = p.w, h = p.h;
    ctx.clearRect(0, 0, w, h);

    var todos = cargarGastos();
    var meses = [];
    var hoy = new Date();
    var nombresMeses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

    for (var i = 5; i >= 0; i--) {
        var d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
        // FIX TIMEZONE: usar getFullYear/getMonth en vez de toISOString
        // toISOString convierte a UTC y puede dar el mes equivocado cerca de medianoche
        var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
        var label = nombresMeses[d.getMonth()];
        var gastosMes = todos.filter(function (g) { return g.fecha.startsWith(key); });
        var porCat = {};
        var totalMes = 0;
        gastosMes.forEach(function (g) {
            if (!porCat[g.categoria]) porCat[g.categoria] = 0;
            porCat[g.categoria] += g.cantidad;
            totalMes += g.cantidad;
        });
        meses.push({ label: label, porCat: porCat, total: totalMes });
    }

    var maxTotal = Math.max.apply(null, meses.map(function (m) { return m.total; }).concat([1]));

    var margenIzq = 44, margenInf = 22, margenSup = 12, margenDer = 12;
    var areaW = w - margenIzq - margenDer;
    var areaH = h - margenSup - margenInf;
    var anchoBarra = areaW / 6 * 0.65;
    var gapBarra = areaW / 6 * 0.35;

    // eje Y
    ctx.strokeStyle = '#ece6d8';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#9a9a9a';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    for (var n = 0; n <= 4; n++) {
        var yLinea = margenSup + (areaH / 4) * n;
        ctx.beginPath();
        ctx.moveTo(margenIzq, yLinea);
        ctx.lineTo(w - margenDer, yLinea);
        ctx.stroke();
        var valor = maxTotal * (1 - n / 4);
        var texto = valor >= 100 ? Math.round(valor) + '€' : valor.toFixed(0) + '€';
        ctx.fillText(texto, margenIzq - 6, yLinea + 3);
    }

    // barras
    meses.forEach(function (m, i) {
        var x = margenIzq + (anchoBarra + gapBarra) * i + gapBarra / 2;
        var yAcum = margenSup + areaH;
        Object.keys(m.porCat).forEach(function (cat) {
            var valor = m.porCat[cat];
            var alturaBarra = (valor / maxTotal) * areaH;
            ctx.fillStyle = COLORES_CAT[cat] || '#7a7a6a';
            ctx.fillRect(x, yAcum - alturaBarra, anchoBarra, alturaBarra);
            yAcum -= alturaBarra;
        });
        ctx.fillStyle = '#5c5c5c';
        ctx.font = '10px "Inter Tight", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(m.label, x + anchoBarra / 2, h - 6);
        if (m.total > 0) {
            ctx.fillStyle = '#7a6f5c';
            ctx.font = '9px "JetBrains Mono", monospace';
            ctx.fillText(Math.round(m.total) + '€', x + anchoBarra / 2, margenSup + areaH - Math.max((m.total / maxTotal) * areaH, 14) - 4);
        }
    });
};


// redibujar todo con las funciones nuevas
dibujarTodo();



// === BETA 3: tabs + Sankey proporcional + OCR tickets ===
// 1. tabs: resumen / apuntes / tickets
// 2. Sankey proporcional (nodos escalan al total global, no a su suma)
// 3. OCR de tickets con Tesseract.js (offline desde CDN)


// --- 1. FIX SANKEY PROPORCIONAL ---
// redefino dibujarSankey con minH=3 y usando el total global como escala
dibujarSankey = function () {
    var p = prepareCanvas(canvasSankey);
    var ctx = p.ctx, w = p.w, h = p.h;
    ctx.clearRect(0, 0, w, h);

    var ingresos = cargarIngresos();
    var gastosMes = gastosDelMes();
    var porCat = {};
    gastosMes.forEach(function (g) {
        if (!porCat[g.categoria]) porCat[g.categoria] = 0;
        porCat[g.categoria] += g.cantidad;
    });
    var totalG = gastosMes.reduce(function (s, g) { return s + g.cantidad; }, 0);
    var totalI = ingresos.reduce(function (s, i) { return s + i.cantidad; }, 0);

    if (totalG === 0 && totalI === 0) {
        ctx.fillStyle = '#9a9a9a';
        ctx.font = 'italic 16px Fraunces, Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('sin datos para mostrar', w / 2, h / 2);
        return;
    }

    var total = Math.max(totalI, totalG, 1);

    var nodeW = 100, nodeR = 4, gap = 5;
    var pad = 10, mTop = 10, mBot = 10;
    var areaH = h - mTop - mBot;
    var xL = pad;
    var xC = (w - nodeW) / 2;
    var xR = w - nodeW - pad;

    var left = ingresos.map(function (i) {
        return { label: i.fuente, value: i.cantidad };
    });
    if (left.length === 0 && totalG > 0) {
        left = [{ label: 'gastos', value: totalG }];
    }

    var right = Object.keys(porCat).map(function (cat) {
        return { label: cat, value: porCat[cat], cat: cat };
    });
    if (right.length === 0) {
        right = [{ label: 'sin gastos', value: 0, cat: 'otros' }];
    }

    // CAMBIO: minH muy pequeño para que los nodos sean proporcionales
    var minH = 3;

    // CAMBIO: ambos lados usan el total global como escala
    function layoutCol(nodes) {
        var totalH = 0;
        nodes.forEach(function (n) {
            n.h = Math.max(minH, (n.value / total) * areaH);
            totalH += n.h;
        });
        if (totalH > areaH) {
            var sc = (areaH - gap * (nodes.length - 1)) / totalH;
            nodes.forEach(function (n) { n.h = Math.max(minH, n.h * sc); });
            totalH = nodes.reduce(function (s, n) { return s + n.h; }, 0);
        }
        var y = mTop + (areaH - totalH - gap * (nodes.length - 1)) / 2;
        nodes.forEach(function (n) { n.y = y; y += n.h + gap; });
    }
    layoutCol(left);
    layoutCol(right);
    var cenH = areaH, cenY = mTop;

    function rrect(x, y, w, h, r) {
        r = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y, x + w, y + r, r);
        ctx.lineTo(x + w, y + h - r);
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h);
        ctx.arcTo(x, y + h, x, y + h - r, r);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();
    }

    function flow(x0, y0, h0, x1, y1, h1, col) {
        if (h0 < 1 && h1 < 1) return;
        ctx.fillStyle = col;
        ctx.beginPath();
        var cp = Math.abs(x1 - x0) * 0.42;
        ctx.moveTo(x0, y0);
        ctx.bezierCurveTo(x0 + cp, y0, x1 - cp, y1, x1, y1);
        ctx.lineTo(x1, y1 + h1);
        ctx.bezierCurveTo(x1 - cp, y1 + h1, x0 + cp, y0 + h0, x0, y0 + h0);
        ctx.closePath();
        ctx.fill();
    }

    function nodeBox(n, x, bg, accent) {
        if (n.h < 1) return;
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.08)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetY = 2;
        ctx.fillStyle = bg;
        rrect(x, n.y, nodeW, n.h, nodeR);
        ctx.fill();
        ctx.restore();
        if (accent && n.h > 5) {
            ctx.save();
            rrect(x, n.y, nodeW, n.h, nodeR);
            ctx.clip();
            ctx.fillStyle = accent;
            ctx.fillRect(x, n.y, 5, n.h);
            ctx.restore();
        }
    }

    function nodeText(n, x, accent, light) {
        if (n.h < 10) return;
        var txCol = light ? '#fff' : '#1a1a1a';
        var subCol = light ? 'rgba(255,255,255,0.7)' : '#5c5c5c';
        var tx = accent ? x + 14 : x + 10;
        var mw = nodeW - (accent ? 24 : 20);
        ctx.fillStyle = txCol;
        ctx.font = '600 11px "Inter Tight", sans-serif';
        ctx.textAlign = 'left';
        ctx.save();
        ctx.beginPath();
        ctx.rect(tx, n.y, mw, n.h);
        ctx.clip();
        ctx.fillText(n.label, tx, n.y + n.h / 2 - 2);
        ctx.restore();
        if (n.h < 20) return;
        var pct = ((n.value / total) * 100).toFixed(1) + '%';
        ctx.fillStyle = subCol;
        ctx.font = '400 9px "JetBrains Mono", monospace';
        ctx.fillText(formatearEuros(n.value) + ' (' + pct + ')', tx, n.y + n.h / 2 + 11);
    }

    var leftH = left.reduce(function (s, n) { return s + n.h; }, 0);
    left.forEach(function (n) {
        if (n.h < 2) return;
        var yDst = cenY + ((n.y - left[0].y) / leftH) * cenH;
        var hDst = (n.h / leftH) * cenH;
        flow(xL + nodeW, n.y, n.h, xC, yDst, hDst, 'rgba(45,94,62,0.25)');
    });

    var rightH = right.reduce(function (s, n) { return s + n.h; }, 0);
    right.forEach(function (n) {
        if (n.h < 2) return;
        var ySrc = cenY + ((n.y - right[0].y) / rightH) * cenH;
        var hSrc = (n.h / rightH) * cenH;
        var col = COLORES_CAT[n.cat] || '#7a7a6a';
        flow(xC + nodeW, ySrc, hSrc, xR, n.y, n.h, hexToRgba(col, 0.3));
    });

    left.forEach(function (n) {
        nodeBox(n, xL, '#2d5e3e', null);
        nodeText(n, xL, null, true);
    });

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.1)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = '#1a1a1a';
    rrect(xC, cenY, nodeW, cenH, nodeR);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#fff';
    ctx.font = '600 12px "Inter Tight", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('total', xC + nodeW / 2, cenY + cenH / 2 - 6);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '400 10px "JetBrains Mono", monospace';
    ctx.fillText(formatearEuros(total), xC + nodeW / 2, cenY + cenH / 2 + 8);

    right.forEach(function (n) {
        var accent = COLORES_CAT[n.cat] || '#7a7a6a';
        nodeBox(n, xR, '#f3eee5', accent);
        nodeText(n, xR, accent, false);
    });
};


// --- 2. SISTEMA DE TABS ---
// creo el contenedor de tabs y lo meto despues del balance
var tabsWrap = document.createElement('div');
tabsWrap.className = 'tabs';
tabsWrap.innerHTML =
    '<div class="tab-nav">' +
    '<button class="tab-btn active" data-tab="resumen">resumen</button>' +
    '<button class="tab-btn" data-tab="apuntes">apuntes</button>' +
    '<button class="tab-btn" data-tab="tickets">tickets</button>' +
    '</div>' +
    '<div class="tab-content" id="tab-resumen"></div>' +
    '<div class="tab-content" id="tab-apuntes"></div>' +
    '<div class="tab-content" id="tab-tickets"></div>';
balanceSeccion.parentNode.insertBefore(tabsWrap, balanceSeccion.nextSibling);

// muevo las secciones existentes dentro de las tabs
document.getElementById('tab-resumen').appendChild(seccionIngresos);
document.getElementById('tab-resumen').appendChild(seccionGraficos);
document.getElementById('tab-apuntes').appendChild(document.querySelector('.entrada'));
document.getElementById('tab-apuntes').appendChild(document.querySelector('.libro'));

// logica de cambio de tab
document.querySelectorAll('.tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
        document.querySelectorAll('.tab-btn').forEach(function (b) {
            b.classList.remove('active');
        });
        btn.classList.add('active');
        var tabId = 'tab-' + btn.getAttribute('data-tab');
        document.querySelectorAll('.tab-content').forEach(function (c) {
            c.style.display = 'none';
        });
        document.getElementById(tabId).style.display = 'block';
        // redibujar graficos al volver al resumen
        if (btn.getAttribute('data-tab') === 'resumen') {
            dibujarTodo();
        }
    });
});

// ocultar las tabs de apuntes y tickets al inicio
document.getElementById('tab-apuntes').style.display = 'none';
document.getElementById('tab-tickets').style.display = 'none';


// --- 3. OCR DE TICKETS CON TESSERACT.JS ---
// cargo Tesseract desde CDN la primera vez que se usa
var tesseractCargado = false;

function cargarTesseract(callback) {
    if (tesseractCargado) {
        callback();
        return;
    }
    var script = document.createElement('script');
    script.src = 'https://unpkg.com/tesseract.js@5/dist/tesseract.min.js';
    script.onload = function () {
        tesseractCargado = true;
        callback();
    };
    script.onerror = function () {
        mostrarResultadoTicket('<p class="ticket-error">no se pudo cargar el OCR. revisa tu conexion.</p>');
    };
    document.head.appendChild(script);
}

// creo la seccion de tickets dentro de su tab
var tabTickets = document.getElementById('tab-tickets');
tabTickets.innerHTML =
    '<div class="tickets-titulo">escanear ticket</div>' +
    '<p class="tickets-desc">sube una foto de un ticket de compra y la app intentara extraer los productos y precios automaticamente.</p>' +
    '<div class="ticket-upload">' +
    '<input type="file" id="ticket-file" accept="image/*" capture="environment">' +
    '<button id="btn-escanear" type="button" disabled>escanear</button>' +
    '</div>' +
    '<div id="ticket-progreso" class="ticket-progreso"></div>' +
    '<div id="ticket-resultados" class="ticket-resultados"></div>';

var ticketFile = document.getElementById('ticket-file');
var btnEscanear = document.getElementById('btn-escanear');
var ticketProgreso = document.getElementById('ticket-progreso');
var ticketResultados = document.getElementById('ticket-resultados');

// habilitar el boton cuando se selecciona un archivo
ticketFile.addEventListener('change', function () {
    btnEscanear.disabled = !ticketFile.files[0];
});

// escanear al pulsar el boton
btnEscanear.addEventListener('click', function () {
    var file = ticketFile.files[0];
    if (!file) return;

    ticketResultados.innerHTML = '';
    ticketProgreso.innerHTML = 'cargando motor OCR...';

    cargarTesseract(function () {
        ticketProgreso.innerHTML = 'procesando imagen...';

        tesseractCargado.createWorker('spa', 1, {
            logger: function (m) {
                if (m.status === 'recognizing text') {
                    ticketProgreso.innerHTML = 'reconociendo texto... ' + Math.round(m.progress * 100) + '%';
                }
            }
        }).then(function (worker) {
            worker.recognize(file).then(function (ret) {
                worker.terminate();
                ticketProgreso.innerHTML = '';
                mostrarTicketParseado(ret.data.text);
            }).catch(function (err) {
                worker.terminate();
                ticketProgreso.innerHTML = '';
                mostrarResultadoTicket('<p class="ticket-error">error al procesar la imagen.</p>');
            });
        });
    });
});

// parsear el texto del OCR y extraer productos y precios
function mostrarTicketParseado(texto) {
    var lineas = texto.split('\n');
    var items = [];
    var totalDetectado = null;

    lineas.forEach(function (linea) {
        linea = linea.trim();
        if (!linea) return;

        // buscar el total
        if (/total/i.test(linea)) {
            var matchTotal = linea.match(/(\d+[,.]\d{2})/);
            if (matchTotal) {
                totalDetectado = parseFloat(matchTotal[1].replace(',', '.'));
            }
        }

        // buscar lineas con producto + precio al final
        // patron: texto seguido de numero con decimal
        var match = linea.match(/^(.+?)\s+(\d+[,.]\d{2})\s*€?\s*$/);
        if (match && !/total|subtotal|cambio|efectivo|tarjeta|iva|base/i.test(match[1])) {
            var precio = parseFloat(match[2].replace(',', '.'));
            if (precio > 0 && precio < 1000) {
                items.push({
                    nombre: match[1].trim().toLowerCase(),
                    precio: precio
                });
            }
        }
    });

    if (items.length === 0) {
        mostrarResultadoTicket(
            '<p class="ticket-error">no se detectaron productos. prueba con otra foto o mas nitida.</p>' +
            '<details class="ticket-raw"><summary>ver texto detectado</summary><pre>' + escaparHTML(texto) + '</pre></details>'
        );
        return;
    }

    // pintar los items detectados
    var html = '<div class="ticket-lista-titulo">productos detectados (' + items.length + ')</div>';
    html += '<ul class="ticket-lista">';
    items.forEach(function (item, i) {
        html += '<li class="ticket-item">' +
            '<input type="checkbox" checked data-idx="' + i + '">' +
            '<span class="ticket-item-nombre">' + escaparHTML(item.nombre) + '</span>' +
            '<span class="ticket-item-precio">' + formatearEuros(item.precio) + '</span>' +
            '</li>';
    });
    html += '</ul>';

    var totalItems = items.reduce(function (s, it) { return s + it.precio; }, 0);
    html += '<div class="ticket-total-items">suma: ' + formatearEuros(totalItems) + '</div>';
    if (totalDetectado) {
        html += '<div class="ticket-total-oficial">total del ticket: ' + formatearEuros(totalDetectado) + '</div>';
    }

    html += '<div class="ticket-acciones">';
    html += '<label class="ticket-cat-label">categoria: ';
    html += '<select id="ticket-categoria">';
    html += '<option value="comida">comida</option>';
    html += '<option value="transporte">transporte</option>';
    html += '<option value="ocio">ocio</option>';
    html += '<option value="casa">casa</option>';
    html += '<option value="estudios">estudios</option>';
    html += '<option value="ropa">ropa</option>';
    html += '<option value="salud">salud</option>';
    html += '<option value="otros">otros</option>';
    html += '</select></label>';
    html += '<button id="btn-guardar-ticket" type="button">guardar como gastos</button>';
    html += '</div>';

    mostrarResultadoTicket(html);

    // boton guardar
    document.getElementById('btn-guardar-ticket').addEventListener('click', function () {
        var cat = document.getElementById('ticket-categoria').value;
        var hoy = new Date().toISOString().slice(0, 10);
        var gastos = cargarGastos();
        var checkboxes = document.querySelectorAll('.ticket-item input[type=checkbox]');
        var guardados = 0;

        checkboxes.forEach(function (cb, i) {
            if (cb.checked) {
                gastos.push({
                    id: Date.now() + i,
                    cantidad: items[i].precio,
                    categoria: cat,
                    descripcion: items[i].nombre,
                    fecha: hoy
                });
                guardados++;
            }
        });

        guardarGastos(gastos);
        mostrarGastos();
        actualizarBalance();
        dibujarTodo();

        mostrarResultadoTicket('<p class="ticket-ok">' + guardados + ' gasto(s) guardado(s).</p>');
        ticketFile.value = '';
        btnEscanear.disabled = true;
    });
}

function mostrarResultadoTicket(html) {
    ticketResultados.innerHTML = html;
}

function escaparHTML(texto) {
    return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}


// redibujar al cargar
dibujarTodo();



// === BETA 3.1: fix OCR colgado + fix letras borrosas ===
// 1. fix bug: tesseractCargado.createWorker -> Tesseract.createWorker
//    (tesseractCargado es un boolean, no la libreria)
// 2. fix letras borrosas: esperar a que las fuentes carguen antes de dibujar
//    y redondear las coordenadas Y de los textos a enteros
// 3. añadir timeout de 90s al OCR para que no se quede colgado nunca


// --- 1. FIX OCR: redefino la funcion de escanear ---
btnEscanear.addEventListener('click', function () {
    var file = ticketFile.files[0];
    if (!file) return;

    ticketResultados.innerHTML = '';
    ticketProgreso.innerHTML = 'cargando motor OCR...';
    btnEscanear.disabled = true;

    cargarTesseract(function () {
        if (typeof Tesseract === 'undefined') {
            ticketProgreso.innerHTML = '';
            btnEscanear.disabled = false;
            mostrarResultadoTicket('<p class="ticket-error">la libreria OCR no se cargo. recarga e intentalo de nuevo.</p>');
            return;
        }

        ticketProgreso.innerHTML = 'inicializando motor (puede tardar 10-20s la primera vez)...';

        var timeoutId = setTimeout(function () {
            ticketProgreso.innerHTML = '';
            btnEscanear.disabled = false;
            mostrarResultadoTicket('<p class="ticket-error">el OCR tardo demasiado. prueba con una foto mas pequeña o menos nitida.</p>');
        }, 90000);

        try {
            Tesseract.createWorker('spa', 1, {
                logger: function (m) {
                    if (m.status === 'recognizing text') {
                        clearTimeout(timeoutId);
                        ticketProgreso.innerHTML = 'reconociendo texto... ' + Math.round(m.progress * 100) + '%';
                    } else if (m.status) {
                        ticketProgreso.innerHTML = m.status + '...';
                    }
                }
            }).then(function (worker) {
                return worker.recognize(file).then(function (ret) {
                    return worker.terminate().then(function () {
                        clearTimeout(timeoutId);
                        ticketProgreso.innerHTML = '';
                        btnEscanear.disabled = false;
                        mostrarTicketParseado(ret.data.text);
                    });
                }).catch(function (err) {
                    return worker.terminate().then(function () {
                        clearTimeout(timeoutId);
                        ticketProgreso.innerHTML = '';
                        btnEscanear.disabled = false;
                        mostrarResultadoTicket('<p class="ticket-error">error al reconocer el texto: ' + escaparHTML(err.message || String(err)) + '</p>');
                    });
                });
            }).catch(function (err) {
                clearTimeout(timeoutId);
                ticketProgreso.innerHTML = '';
                btnEscanear.disabled = false;
                mostrarResultadoTicket('<p class="ticket-error">no se pudo iniciar el motor OCR: ' + escaparHTML(err.message || String(err)) + '</p>');
            });
        } catch (err) {
            clearTimeout(timeoutId);
            ticketProgreso.innerHTML = '';
            btnEscanear.disabled = false;
            mostrarResultadoTicket('<p class="ticket-error">error inesperado: ' + escaparHTML(err.message || String(err)) + '</p>');
        }
    });
});


// --- 2. FIX LETRAS BORROSAS ---
// redefino dibujarSankey para redondear las Y de los textos
// y usar las coordenadas que prepareCanvas ya escala correctamente
dibujarSankey = function () {
    var p = prepareCanvas(canvasSankey);
    var ctx = p.ctx, w = p.w, h = p.h;
    ctx.clearRect(0, 0, w, h);

    var ingresos = cargarIngresos();
    var gastosMes = gastosDelMes();
    var porCat = {};
    gastosMes.forEach(function (g) {
        if (!porCat[g.categoria]) porCat[g.categoria] = 0;
        porCat[g.categoria] += g.cantidad;
    });
    var totalG = gastosMes.reduce(function (s, g) { return s + g.cantidad; }, 0);
    var totalI = ingresos.reduce(function (s, i) { return s + i.cantidad; }, 0);

    if (totalG === 0 && totalI === 0) {
        ctx.fillStyle = '#9a9a9a';
        ctx.font = 'italic 16px Fraunces, Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('sin datos para mostrar', w / 2, h / 2);
        return;
    }

    var total = Math.max(totalI, totalG, 1);

    var nodeW = 100, nodeR = 4, gap = 5;
    var pad = 10, mTop = 10, mBot = 10;
    var areaH = h - mTop - mBot;
    var xL = pad;
    var xC = (w - nodeW) / 2;
    var xR = w - nodeW - pad;

    var left = ingresos.map(function (i) {
        return { label: i.fuente, value: i.cantidad };
    });
    if (left.length === 0 && totalG > 0) {
        left = [{ label: 'gastos', value: totalG }];
    }

    var right = Object.keys(porCat).map(function (cat) {
        return { label: cat, value: porCat[cat], cat: cat };
    });
    if (right.length === 0) {
        right = [{ label: 'sin gastos', value: 0, cat: 'otros' }];
    }

    var minH = 3;

    function layoutCol(nodes) {
        var totalH = 0;
        nodes.forEach(function (n) {
            n.h = Math.max(minH, (n.value / total) * areaH);
            totalH += n.h;
        });
        if (totalH > areaH) {
            var sc = (areaH - gap * (nodes.length - 1)) / totalH;
            nodes.forEach(function (n) { n.h = Math.max(minH, n.h * sc); });
            totalH = nodes.reduce(function (s, n) { return s + n.h; }, 0);
        }
        var y = mTop + (areaH - totalH - gap * (nodes.length - 1)) / 2;
        nodes.forEach(function (n) {
            n.y = Math.round(y);
            y += n.h + gap;
        });
    }
    layoutCol(left);
    layoutCol(right);
    var cenH = areaH, cenY = Math.round(mTop);

    function rrect(x, y, w, h, r) {
        r = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y, x + w, y + r, r);
        ctx.lineTo(x + w, y + h - r);
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h);
        ctx.arcTo(x, y + h, x, y + h - r, r);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();
    }

    function flow(x0, y0, h0, x1, y1, h1, col) {
        if (h0 < 1 && h1 < 1) return;
        ctx.fillStyle = col;
        ctx.beginPath();
        var cp = Math.abs(x1 - x0) * 0.42;
        ctx.moveTo(x0, y0);
        ctx.bezierCurveTo(x0 + cp, y0, x1 - cp, y1, x1, y1);
        ctx.lineTo(x1, y1 + h1);
        ctx.bezierCurveTo(x1 - cp, y1 + h1, x0 + cp, y0 + h0, x0, y0 + h0);
        ctx.closePath();
        ctx.fill();
    }

    function nodeBox(n, x, bg, accent) {
        if (n.h < 1) return;
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.08)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetY = 2;
        ctx.fillStyle = bg;
        rrect(x, n.y, nodeW, Math.round(n.h), nodeR);
        ctx.fill();
        ctx.restore();
        if (accent && n.h > 5) {
            ctx.save();
            rrect(x, n.y, nodeW, Math.round(n.h), nodeR);
            ctx.clip();
            ctx.fillStyle = accent;
            ctx.fillRect(x, n.y, 5, Math.round(n.h));
            ctx.restore();
        }
    }

    function nodeText(n, x, accent, light) {
        if (n.h < 10) return;
        var txCol = light ? '#fff' : '#1a1a1a';
        var subCol = light ? 'rgba(255,255,255,0.7)' : '#5c5c5c';
        var tx = accent ? x + 14 : x + 10;
        var mw = nodeW - (accent ? 24 : 20);
        ctx.fillStyle = txCol;
        ctx.font = '600 11px "Inter Tight", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        var cy = Math.round(n.y + n.h / 2);
        ctx.save();
        ctx.beginPath();
        ctx.rect(tx, n.y, mw, n.h);
        ctx.clip();
        ctx.fillText(n.label, tx, cy - 5);
        ctx.restore();
        if (n.h < 20) return;
        var pct = ((n.value / total) * 100).toFixed(1) + '%';
        ctx.fillStyle = subCol;
        ctx.font = '400 9px "JetBrains Mono", monospace';
        ctx.fillText(formatearEuros(n.value) + ' (' + pct + ')', tx, cy + 8);
    }

    var leftH = left.reduce(function (s, n) { return s + n.h; }, 0);
    left.forEach(function (n) {
        if (n.h < 2) return;
        var yDst = cenY + ((n.y - left[0].y) / leftH) * cenH;
        var hDst = (n.h / leftH) * cenH;
        flow(xL + nodeW, n.y, n.h, xC, yDst, hDst, 'rgba(45,94,62,0.25)');
    });

    var rightH = right.reduce(function (s, n) { return s + n.h; }, 0);
    right.forEach(function (n) {
        if (n.h < 2) return;
        var ySrc = cenY + ((n.y - right[0].y) / rightH) * cenH;
        var hSrc = (n.h / rightH) * cenH;
        var col = COLORES_CAT[n.cat] || '#7a7a6a';
        flow(xC + nodeW, ySrc, hSrc, xR, n.y, n.h, hexToRgba(col, 0.3));
    });

    left.forEach(function (n) {
        nodeBox(n, xL, '#2d5e3e', null);
        nodeText(n, xL, null, true);
    });

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.1)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = '#1a1a1a';
    rrect(xC, cenY, nodeW, Math.round(cenH), nodeR);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#fff';
    ctx.font = '600 12px "Inter Tight", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('total', xC + nodeW / 2, cenY + cenH / 2 - 6);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '400 10px "JetBrains Mono", monospace';
    ctx.fillText(formatearEuros(total), xC + nodeW / 2, cenY + cenH / 2 + 8);

    right.forEach(function (n) {
        var accent = COLORES_CAT[n.cat] || '#7a7a6a';
        nodeBox(n, xR, '#f3eee5', accent);
        nodeText(n, xR, accent, false);
    });
};


// --- 3. ESPERAR A QUE LAS FUENTES CARGUEN ANTES DEL PRIMER DIBUJO ---
// esto arregla el texto borroso en el primer render
if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
        dibujarTodo();
    });
} else {
    // fallback para navegadores viejos
    setTimeout(dibujarTodo, 500);
}

// redibujar al cambiar tamaño de ventana (para que el DPR se recalcule)
var resizeTimer;
window.addEventListener('resize', function () {
    this.clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
        dibujarTodo();
    }, 250);
});

// dibujo inicial
dibujarTodo();






// === BETA 4a: tema oscuro + multi-idioma + tab deudas + gestion de personas ===
// (los gastos compartidos, saldar y patrones van en la 4b)

// --- preferencias ---
var FLUJO_PREFS = 'flujo_prefs';

function cargarFlujoPrefs() {
    var d = localStorage.getItem(FLUJO_PREFS);
    if (!d) return { idioma: 'es', tema: 'claro' };
    try { return JSON.parse(d); } catch (e) { return { idioma: 'es', tema: 'claro' }; }
}

function guardarFlujoPrefs(p) {
    localStorage.setItem(FLUJO_PREFS, JSON.stringify(p));
}

var flujoPrefs = cargarFlujoPrefs();

// --- traducciones ---
var TR = {
    es: {
        resumen: 'resumen', apuntes: 'apuntes', tickets: 'tickets', deudas: 'deudas',
        fuentesIngreso: 'fuentes de ingreso', flujoDinero: 'flujo de dinero',
        nuevoApunte: 'nuevo apunte', libroMayor: 'libro mayor',
        gastado: 'gastado', apuntesT: 'apuntes', media: 'media', ingresos: 'ingresos', saldo: 'saldo',
        importe: 'importe', categoria: 'categoria', descripcion: 'descripcion', fecha: 'fecha',
        anotar: 'anotar', anadir: 'añadir', borrar: 'borrar',
        sinApuntes: 'sin apuntes este mes.',
        escanearTicket: 'escanear ticket', ticketDesc: 'sube una foto de un ticket de compra y la app intentara extraer los productos y precios automaticamente.',
        escanear: 'escanear', guardarGastos: 'guardar como gastos',
        productosDetectados: 'productos detectados', suma: 'suma', totalTicket: 'total del ticket',
        personas: 'personas', nuevoGastoCompartido: 'nuevo gasto compartido',
        nombre: 'nombre', pagar: 'pagador', participantes: 'participantes',
        metodo: 'metodo de division', igual: 'igual', partes: 'por partes', exacto: 'exacto', porcentaje: 'porcentaje',
        movimientos: 'movimientos', saldar: 'saldar deudas',
        sinPersonas: 'añade personas para empezar a llevar deudas.',
        sinMovimientos: 'sin movimientos compartidos.',
        patrones: 'patrones detectados', sinPatrones: 'aun no hay patrones detectados. registra mas gastos para que la app encuentre recurrentes.',
        suscripciones: 'suscripciones detectadas', gastoRecurrente: 'gasto recurrente',
        ajustes: 'ajustes', idioma: 'idioma', tema: 'tema', claro: 'claro', oscuro: 'oscuro',
        personasDesc: 'añade las personas con las que compartes gastos (compañeros de piso, amigos, etc.)',
        sugerenciaSaldar: 'para saldar todas las deudas con el minimo de transfers:',
        debes: 'debes a', teDebe: 'te debe',
        balance: 'balance', sinDeudas: 'no hay deudas pendientes. todo saldado.',
        meses: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
        mesesLargo: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
    },
    en: {
        resumen: 'summary', apuntes: 'entries', tickets: 'tickets', deudas: 'debts',
        fuentesIngreso: 'income sources', flujoDinero: 'money flow',
        nuevoApunte: 'new entry', libroMayor: 'general ledger',
        gastado: 'spent', apuntesT: 'entries', media: 'average', ingresos: 'income', saldo: 'balance',
        importe: 'amount', categoria: 'category', descripcion: 'description', fecha: 'date',
        anotar: 'log', anadir: 'add', borrar: 'delete',
        sinApuntes: 'no entries this month.',
        escanearTicket: 'scan receipt', ticketDesc: 'upload a photo of a receipt and the app will try to extract products and prices automatically.',
        escanear: 'scan', guardarGastos: 'save as expenses',
        productosDetectados: 'detected products', suma: 'sum', totalTicket: 'receipt total',
        personas: 'people', nuevoGastoCompartido: 'new shared expense',
        nombre: 'name', pagar: 'payer', participantes: 'participants',
        metodo: 'split method', igual: 'equal', partes: 'by shares', exacto: 'exact', porcentaje: 'by percentage',
        movimientos: 'movements', saldar: 'settle debts',
        sinPersonas: 'add people to start tracking debts.',
        sinMovimientos: 'no shared movements.',
        patrones: 'detected patterns', sinPatrones: 'no patterns detected yet. log more expenses so the app can find recurring ones.',
        suscripciones: 'detected subscriptions', gastoRecurrente: 'recurring expense',
        ajustes: 'settings', idioma: 'language', tema: 'theme', claro: 'light', oscuro: 'dark',
        personasDesc: 'add people you share expenses with (flatmates, friends, etc.)',
        sugerenciaSaldar: 'to settle all debts with minimum transfers:',
        debes: 'you owe to', teDebe: 'owes you',
        balance: 'balance', sinDeudas: 'no pending debts. all settled.',
        meses: ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'],
        mesesLargo: ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
    }
};

function ft(key) {
    var trad = TR[flujoPrefs.idioma] || TR.es;
    return trad[key] || key;
}


// --- aplicar tema ---
function aplicarTema() {
    if (flujoPrefs.tema === 'oscuro') {
        document.body.classList.add('tema-oscuro');
    } else {
        document.body.classList.remove('tema-oscuro');
    }
}


// --- añadir tab de deudas ---
var tabNav = document.querySelector('.tab-nav');
var btnTabDeudas = document.createElement('button');
btnTabDeudas.className = 'tab-btn';
btnTabDeudas.setAttribute('data-tab', 'deudas');
btnTabDeudas.textContent = ft('deudas');
tabNav.appendChild(btnTabDeudas);

var tabDeudas = document.createElement('div');
tabDeudas.className = 'tab-content';
tabDeudas.id = 'tab-deudas';
tabDeudas.style.display = 'none';
document.querySelector('.tabs').appendChild(tabDeudas);

// reusar la logica de cambio de tab
btnTabDeudas.addEventListener('click', function () {
    document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
    btnTabDeudas.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(function (c) { c.style.display = 'none'; });
    tabDeudas.style.display = 'block';
});


// --- almacenamiento de personas y movimientos ---
var CLAVE_PERSONAS = 'flujo_personas';
var CLAVE_MOVIMIENTOS = 'flujo_movimientos';

function cargarPersonas() {
    var d = localStorage.getItem(CLAVE_PERSONAS);
    if (!d) return [];
    try { return JSON.parse(d); } catch (e) { return []; }
}

function guardarPersonas(lista) {
    localStorage.setItem(CLAVE_PERSONAS, JSON.stringify(lista));
}

function cargarMovimientos() {
    var d = localStorage.getItem(CLAVE_MOVIMIENTOS);
    if (!d) return [];
    try { return JSON.parse(d); } catch (e) { return []; }
}

function guardarMovimientos(lista) {
    localStorage.setItem(CLAVE_MOVIMIENTOS, JSON.stringify(lista));
}


// --- construir la UI de deudas ---
tabDeudas.innerHTML =
    '<div class="deudas-grid">' +

    '<div class="deudas-col">' +
    '<div class="deudas-titulo">' + ft('personas') + '</div>' +
    '<p class="deudas-desc">' + ft('personasDesc') + '</p>' +
    '<form id="form-persona" class="form-persona">' +
    '<input type="text" id="input-persona" placeholder="' + ft('nombre') + '" required>' +
    '<button type="submit">' + ft('anadir') + '</button>' +
    '</form>' +
    '<ul id="lista-personas" class="lista-personas"></ul>' +
    '</div>' +

    '<div class="deudas-col">' +
    '<div class="deudas-titulo">' + ft('nuevoGastoCompartido') + '</div>' +
    '<form id="form-compartido" class="form-compartido">' +
    '<label><span>' + ft('descripcion') + '</span><input type="text" id="comp-desc" required></label>' +
    '<label><span>' + ft('importe') + '</span><input type="number" id="comp-importe" step="0.01" min="0" required></label>' +
    '<label><span>' + ft('pagar') + '</span><select id="comp-pagador"></select></label>' +
    '<label><span>' + ft('participantes') + '</span><div id="comp-participantes" class="checkbox-grid"></div></label>' +
    '<label><span>' + ft('metodo') + '</span><select id="comp-metodo"><option value="igual">' + ft('igual') + '</option><option value="partes">' + ft('partes') + '</option><option value="exacto">' + ft('exacto') + '</option><option value="porcentaje">' + ft('porcentaje') + '</option></select></label>' +
    '<div id="comp-metodo-extra"></div>' +
    '<button type="submit">' + ft('anadir') + '</button>' +
    '</form>' +
    '</div>' +

    '</div>' +

    '<div class="deudas-section">' +
    '<div class="deudas-titulo">' + ft('movimientos') + '</div>' +
    '<ul id="lista-movimientos" class="lista-movimientos"></ul>' +
    '<p id="sin-movimientos" class="vacio">' + ft('sinMovimientos') + '</p>' +
    '</div>' +

    '<div class="deudas-section">' +
    '<div class="deudas-titulo">' + ft('saldar') + '</div>' +
    '<div id="saldar-sugerencias"></div>' +
    '</div>' +

    '<div class="deudas-section">' +
    '<div class="deudas-titulo">' + ft('patrones') + '</div>' +
    '<div id="patrones-lista"></div>' +
    '</div>';


// --- gestion de personas ---
var formPersona = document.getElementById('form-persona');
var inputPersona = document.getElementById('input-persona');
var listaPersonas = document.getElementById('lista-personas');

formPersona.addEventListener('submit', function (e) {
    e.preventDefault();
    var nombre = inputPersona.value.trim();
    if (!nombre) return;
    var personas = cargarPersonas();
    if (personas.indexOf(nombre) === -1) {
        personas.push(nombre);
        guardarPersonas(personas);
    }
    inputPersona.value = '';
    mostrarPersonas();
    actualizarSelectPagador();
    actualizarParticipantes();
});

function borrarPersona(nombre) {
    if (!confirm('¿Borrar a ' + nombre + '?')) return;
    var personas = cargarPersonas();
    guardarPersonas(personas.filter(function (p) { return p !== nombre; }));
    mostrarPersonas();
    actualizarSelectPagador();
    actualizarParticipantes();
}

function mostrarPersonas() {
    var personas = cargarPersonas();
    listaPersonas.innerHTML = '';
    if (personas.length === 0) {
        listaPersonas.innerHTML = '<li class="vacio">' + ft('sinPersonas') + '</li>';
        return;
    }
    // calcular balance de cada persona
    var balances = calcularBalances();
    personas.forEach(function (nombre) {
        var li = document.createElement('li');
        li.className = 'persona-item';
        var bal = balances[nombre] || 0;
        var balTexto = formatearEuros(Math.abs(bal));
        var balClase = bal > 0.01 ? 'positivo' : (bal < -0.01 ? 'negativo' : 'cero');
        var balLabel = bal > 0.01 ? ft('teDebe') : (bal < -0.01 ? ft('debes') : ft('balance'));
        li.innerHTML =
            '<span class="persona-nombre">' + escaparHTMLFlujo(nombre) + '</span>' +
            '<span class="persona-balance ' + balClase + '">' + balLabel + ' ' + balTexto + '</span>' +
            '<button class="persona-borrar" data-nombre="' + escaparHTMLFlujo(nombre) + '">×</button>';
        listaPersonas.appendChild(li);
    });
    // botones de borrar
    listaPersonas.querySelectorAll('.persona-borrar').forEach(function (btn) {
        btn.addEventListener('click', function () { borrarPersona(this.getAttribute('data-nombre')); });
    });
}


// --- panel de ajustes ---
var btnAjustes = document.createElement('button');
btnAjustes.id = 'btn-ajustes';
btnAjustes.textContent = ft('ajustes');
btnAjustes.className = 'btn-ajustes';
document.querySelector('.cabecera').appendChild(btnAjustes);

var panelAjustes = document.createElement('div');
panelAjustes.id = 'panel-ajustes';
panelAjustes.style.display = 'none';
panelAjustes.innerHTML =
    '<div class="ajustes-fila">' +
    '<span>' + ft('idioma') + '</span>' +
    '<div class="ajustes-toggle">' +
    '<button data-lang="es" class="' + (flujoPrefs.idioma === 'es' ? 'active' : '') + '">ES</button>' +
    '<button data-lang="en" class="' + (flujoPrefs.idioma === 'en' ? 'active' : '') + '">EN</button>' +
    '</div>' +
    '</div>' +
    '<div class="ajustes-fila">' +
    '<span>' + ft('tema') + '</span>' +
    '<div class="ajustes-toggle">' +
    '<button data-tema="claro" class="' + (flujoPrefs.tema === 'claro' ? 'active' : '') + '">' + ft('claro') + '</button>' +
    '<button data-tema="oscuro" class="' + (flujoPrefs.tema === 'oscuro' ? 'active' : '') + '">' + ft('oscuro') + '</button>' +
    '</div>' +
    '</div>';
document.body.appendChild(panelAjustes);

btnAjustes.addEventListener('click', function (e) {
    e.stopPropagation();
    panelAjustes.style.display = panelAjustes.style.display === 'none' ? 'block' : 'none';
});

document.addEventListener('click', function (e) {
    if (!panelAjustes.contains(e.target) && e.target !== btnAjustes) {
        panelAjustes.style.display = 'none';
    }
});

panelAjustes.querySelectorAll('[data-lang]').forEach(function (btn) {
    btn.addEventListener('click', function () {
        flujoPrefs.idioma = btn.getAttribute('data-lang');
        guardarFlujoPrefs(flujoPrefs);
        // recargar para aplicar todos los cambios de idioma
        location.reload();
    });
});

panelAjustes.querySelectorAll('[data-tema]').forEach(function (btn) {
    btn.addEventListener('click', function () {
        flujoPrefs.tema = btn.getAttribute('data-tema');
        guardarFlujoPrefs(flujoPrefs);
        aplicarTema();
        panelAjustes.querySelectorAll('[data-tema]').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
    });
});


// --- helper ---
function escaparHTMLFlujo(texto) {
    return String(texto).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}



// --- inicializar ---
aplicarTema();
mostrarPersonas();



// === BETA 4b: gastos compartidos + movimientos + saldar deudas + patrones ===
// (continua la 4a que ya tiene personas, tema e idioma)

// --- actualizar select de pagador y checkboxes de participantes ---
function actualizarSelectPagador() {
    var sel = document.getElementById('comp-pagador');
    if (!sel) return;
    var personas = cargarPersonas();
    sel.innerHTML = '';
    personas.forEach(function (p) {
        var opt = document.createElement('option');
        opt.value = p;
        opt.textContent = p;
        sel.appendChild(opt);
    });
}

function actualizarParticipantes() {
    var cont = document.getElementById('comp-participantes');
    if (!cont) return;
    var personas = cargarPersonas();
    cont.innerHTML = '';
    personas.forEach(function (p) {
        var lab = document.createElement('label');
        lab.className = 'check-participante';
        lab.innerHTML = '<input type="checkbox" value="' + escaparHTMLFlujo(p) + '" checked> ' + escaparHTMLFlujo(p);
        cont.appendChild(lab);
    });
}


// --- metodo de division: mostrar campos extra ---
var selectMetodo = document.getElementById('comp-metodo');
var metodoExtra = document.getElementById('comp-metodo-extra');

selectMetodo.addEventListener('change', function () {
    actualizarMetodoExtra();
});

function actualizarMetodoExtra() {
    var metodo = selectMetodo.value;
    var personas = cargarPersonas();
    metodoExtra.innerHTML = '';

    if (metodo === 'partes') {
        metodoExtra.innerHTML = '<div class="metodo-desc">cada persona aporta X partes. ej: 2:1:1 significa que uno paga el doble.</div>';
        personas.forEach(function (p) {
            metodoExtra.innerHTML += '<label class="metodo-fila"><span>' + escaparHTMLFlujo(p) + '</span><input type="number" class="input-partes" data-nombre="' + escaparHTMLFlujo(p) + '" value="1" min="0" step="1"></label>';
        });
    } else if (metodo === 'exacto') {
        metodoExtra.innerHTML = '<div class="metodo-desc">cuanto paga exactamente cada uno. la suma debe ser igual al importe total.</div>';
        personas.forEach(function (p) {
            metodoExtra.innerHTML += '<label class="metodo-fila"><span>' + escaparHTMLFlujo(p) + '</span><input type="number" class="input-exacto" data-nombre="' + escaparHTMLFlujo(p) + '" value="0" min="0" step="0.01"></label>';
        });
    } else if (metodo === 'porcentaje') {
        metodoExtra.innerHTML = '<div class="metodo-desc">que porcentaje paga cada uno. la suma debe ser 100.</div>';
        personas.forEach(function (p) {
            metodoExtra.innerHTML += '<label class="metodo-fila"><span>' + escaparHTMLFlujo(p) + '</span><input type="number" class="input-porcentaje" data-nombre="' + escaparHTMLFlujo(p) + '" value="' + Math.round(100 / personas.length) + '" min="0" max="100" step="1">%</label>';
        });
    }
}


// --- añadir gasto compartido ---
var formCompartido = document.getElementById('form-compartido');
formCompartido.addEventListener('submit', function (e) {
    e.preventDefault();
    var desc = document.getElementById('comp-desc').value.trim();
    var importe = parseFloat(document.getElementById('comp-importe').value);
    var pagador = document.getElementById('comp-pagador').value;
    var metodo = document.getElementById('comp-metodo').value;
    var participantes = [];
    document.querySelectorAll('#comp-participantes input:checked').forEach(function (cb) {
        participantes.push(cb.value);
    });

    if (!desc || isNaN(importe) || importe <= 0 || !pagador || participantes.length === 0) {
        alert('completa todos los campos');
        return;
    }

    // asegurar que el pagador esta en participantes
    if (participantes.indexOf(pagador) === -1) {
        participantes.push(pagador);
    }

    // calcular la parte de cada uno
    var partes = {};
    if (metodo === 'igual') {
        var parte = importe / participantes.length;
        participantes.forEach(function (p) { partes[p] = parte; });
    } else if (metodo === 'partes') {
        var totalPartes = 0;
        var inputsPartes = {};
        document.querySelectorAll('.input-partes').forEach(function (inp) {
            var nombre = inp.getAttribute('data-nombre');
            var val = parseFloat(inp.value) || 0;
            inputsPartes[nombre] = val;
            if (participantes.indexOf(nombre) !== -1) totalPartes += val;
        });
        if (totalPartes === 0) { alert('las partes no pueden ser todas 0'); return; }
        participantes.forEach(function (p) { partes[p] = (inputsPartes[p] || 0) / totalPartes * importe; });
    } else if (metodo === 'exacto') {
        var suma = 0;
        var inputsExacto = {};
        document.querySelectorAll('.input-exacto').forEach(function (inp) {
            var nombre = inp.getAttribute('data-nombre');
            var val = parseFloat(inp.value) || 0;
            inputsExacto[nombre] = val;
            if (participantes.indexOf(nombre) !== -1) suma += val;
        });
        if (Math.abs(suma - importe) > 0.01) {
            alert('la suma de cantidades (' + suma.toFixed(2) + ') no coincide con el importe (' + importe.toFixed(2) + ')');
            return;
        }
        participantes.forEach(function (p) { partes[p] = inputsExacto[p] || 0; });
    } else if (metodo === 'porcentaje') {
        var sumaPct = 0;
        var inputsPct = {};
        document.querySelectorAll('.input-porcentaje').forEach(function (inp) {
            var nombre = inp.getAttribute('data-nombre');
            var val = parseFloat(inp.value) || 0;
            inputsPct[nombre] = val;
            if (participantes.indexOf(nombre) !== -1) sumaPct += val;
        });
        if (Math.abs(sumaPct - 100) > 0.5) {
            alert('los porcentajes suman ' + sumaPct + ', deben sumar 100');
            return;
        }
        participantes.forEach(function (p) { partes[p] = (inputsPct[p] || 0) / 100 * importe; });
    }

    var mov = {
        id: Date.now(),
        descripcion: desc,
        importe: importe,
        pagador: pagador,
        participantes: participantes,
        partes: partes,
        fecha: new Date().toISOString().slice(0, 10)
    };

    var movs = cargarMovimientos();
    movs.push(mov);
    guardarMovimientos(movs);

    formCompartido.reset();
    actualizarMetodoExtra();
    mostrarMovimientos();
    mostrarPersonas();
    mostrarSaldar();
});


// --- mostrar movimientos ---
function mostrarMovimientos() {
    var movs = cargarMovimientos();
    var lista = document.getElementById('lista-movimientos');
    var vacio = document.getElementById('sin-movimientos');
    lista.innerHTML = '';

    if (movs.length === 0) {
        vacio.style.display = 'block';
        return;
    }
    vacio.style.display = 'none';

    movs.slice().reverse().forEach(function (m) {
        var li = document.createElement('li');
        li.className = 'movimiento-item';
        li.innerHTML =
            '<div class="mov-info">' +
            '<div class="mov-desc">' + escaparHTMLFlujo(m.descripcion) + '</div>' +
            '<div class="mov-detalle">' + escaparHTMLFlujo(m.pagador) + ' pago ' + formatearEuros(m.importe) + ' · ' + m.participantes.length + ' personas</div>' +
            '</div>' +
            '<div class="mov-acciones">' +
            '<span class="mov-cantidad">' + formatearEuros(m.importe) + '</span>' +
            '<button class="mov-borrar" data-id="' + m.id + '">×</button>' +
            '</div>';
        lista.appendChild(li);
    });

    lista.querySelectorAll('.mov-borrar').forEach(function (btn) {
        btn.addEventListener('click', function () {
            if (!confirm('¿Borrar este movimiento?')) return;
            var id = parseInt(this.getAttribute('data-id'), 10);
            var movs = cargarMovimientos();
            guardarMovimientos(movs.filter(function (m) { return m.id !== id; }));
            mostrarMovimientos();
            mostrarPersonas();
            mostrarSaldar();
        });
    });
}


// --- calcular balances ---
// positivo = la persona tiene que recibir dinero
// negativo = la persona tiene que pagar
function calcularBalances() {
    var movs = cargarMovimientos();
    var balances = {};
    var personas = cargarPersonas();
    personas.forEach(function (p) { balances[p] = 0; });

    movs.forEach(function (m) {
        Object.keys(m.partes).forEach(function (nombre) {
            if (balances[nombre] === undefined) balances[nombre] = 0;
            // el pagador pago m.importe pero le toca m.partes[pagador]
            // los demas le deben su parte al pagador
            if (nombre === m.pagador) {
                // pagador pago todo, le toca partes[pagador]
                // su balance: + (importe - su parte) = recibio de los demas
                balances[nombre] += m.importe - m.partes[nombre];
            } else {
                // no pagador: debe su parte al pagador
                balances[nombre] -= m.partes[nombre];
            }
        });
    });

    return balances;
}


// --- sugerencias para saldar con minimo de transfers ---
function mostrarSaldar() {
    var cont = document.getElementById('saldar-sugerencias');
    var balances = calcularBalances();
    var personas = Object.keys(balances).filter(function (p) { return Math.abs(balances[p]) > 0.01; });

    if (personas.length === 0) {
        cont.innerHTML = '<p class="vacio">' + ft('sinDeudas') + '</p>';
        return;
    }

    // algoritmo greedy: ordenar por balance, los mas negativos pagan a los mas positivos
    var deudores = personas.filter(function (p) { return balances[p] < -0.01; })
        .sort(function (a, b) { return balances[a] - balances[b]; });
    var acreedores = personas.filter(function (p) { return balances[p] > 0.01; })
        .sort(function (a, b) { return balances[b] - balances[a]; });

    var sugerencias = [];
    var i = 0, j = 0;
    var balCopy = {};
    personas.forEach(function (p) { balCopy[p] = balances[p]; });

    while (i < deudores.length && j < acreedores.length) {
        var deuda = Math.min(-balCopy[deudores[i]], balCopy[acreedores[j]]);
        if (deuda > 0.01) {
            sugerencias.push({ de: deudores[i], a: acreedores[j], cantidad: deuda });
        }
        balCopy[deudores[i]] += deuda;
        balCopy[acreedores[j]] -= deuda;
        if (Math.abs(balCopy[deudores[i]]) < 0.01) i++;
        if (Math.abs(balCopy[acreedores[j]]) < 0.01) j++;
    }

    var html = '<p class="saldar-desc">' + ft('sugerenciaSaldar') + '</p>';
    html += '<ul class="saldar-lista">';
    sugerencias.forEach(function (s) {
        html += '<li class="saldar-item">' +
            '<span class="saldar-de">' + escaparHTMLFlujo(s.de) + '</span>' +
            '<span class="saldar-flecha">-></span>' +
            '<span class="saldar-a">' + escaparHTMLFlujo(s.a) + '</span>' +
            '<span class="saldar-cantidad">' + formatearEuros(s.cantidad) + '</span>' +
            '</li>';
    });
    html += '</ul>';
    cont.innerHTML = html;
}


// --- deteccion de patrones ---
function mostrarPatrones() {
    var cont = document.getElementById('patrones-lista');
    var gastos = cargarGastos();
    if (gastos.length < 3) {
        cont.innerHTML = '<p class="vacio">' + ft('sinPatrones') + '</p>';
        return;
    }

    // agrupar por descripcion exacta
    var porDesc = {};
    gastos.forEach(function (g) {
        var key = (g.descripcion || '').toLowerCase().trim();
        if (!key) return;
        if (!porDesc[key]) porDesc[key] = [];
        porDesc[key].push(g);
    });

    // buscar gastos recurrentes (3+ veces con misma descripcion y cantidad similar)
    var recurrentes = [];
    Object.keys(porDesc).forEach(function (key) {
        var items = porDesc[key];
        if (items.length < 3) return;
        // calcular media y ver si las cantidades son parecidas
        var suma = items.reduce(function (s, g) { return s + g.cantidad; }, 0);
        var media = suma / items.length;
        var todosParecidos = items.every(function (g) {
            return Math.abs(g.cantidad - media) / media < 0.2;
        });
        if (todosParecidos) {
            recurrentes.push({
                descripcion: key,
                veces: items.length,
                media: media,
                total: suma,
                ultimo: items[items.length - 1].fecha
            });
        }
    });

    // tambien buscar suscripciones (misma cantidad exacta, repetida)
    var porCantidad = {};
    gastos.forEach(function (g) {
        var key = g.cantidad.toFixed(2);
        if (!porCantidad[key]) porCantidad[key] = [];
        porCantidad[key].push(g);
    });
    var suscripciones = [];
    Object.keys(porCantidad).forEach(function (key) {
        var items = porCantidad[key];
        if (items.length < 2) return;
        // mismo importe, misma descripcion o parecida
        var descs = {};
        items.forEach(function (g) {
            var d = (g.descripcion || '').toLowerCase().trim();
            if (!descs[d]) descs[d] = 0;
            descs[d]++;
        });
        var descPrincipal = Object.keys(descs).sort(function (a, b) { return descs[b] - descs[a]; })[0];
        if (descPrincipal && descs[descPrincipal] >= 2) {
            suscripciones.push({
                descripcion: descPrincipal,
                cantidad: parseFloat(key),
                veces: descs[descPrincipal]
            });
        }
    });

    if (recurrentes.length === 0 && suscripciones.length === 0) {
        cont.innerHTML = '<p class="vacio">' + ft('sinPatrones') + '</p>';
        return;
    }

    var html = '';
    if (suscripciones.length > 0) {
        html += '<div class="patrones-subtitulo">' + ft('suscripciones') + '</div>';
        html += '<ul class="patrones-lista">';
        suscripciones.forEach(function (s) {
            var mensual = s.cantidad;
            html += '<li class="patron-item">' +
                '<span class="patron-desc">' + escaparHTMLFlujo(s.descripcion) + '</span>' +
                '<span class="patron-detalle">' + s.veces + 'x · ' + formatearEuros(s.cantidad) + '</span>' +
                '<span class="patron-anual">~' + formatearEuros(mensual * 12) + '/año</span>' +
                '</li>';
        });
        html += '</ul>';
    }

    if (recurrentes.length > 0) {
        html += '<div class="patrones-subtitulo">' + ft('gastoRecurrente') + '</div>';
        html += '<ul class="patrones-lista">';
        recurrentes.sort(function (a, b) { return b.veces - a.veces; });
        recurrentes.forEach(function (r) {
            html += '<li class="patron-item">' +
                '<span class="patron-desc">' + escaparHTMLFlujo(r.descripcion) + '</span>' +
                '<span class="patron-detalle">' + r.veces + 'x · media ' + formatearEuros(r.media) + '</span>' +
                '<span class="patron-total">total ' + formatearEuros(r.total) + '</span>' +
                '</li>';
        });
        html += '</ul>';
    }

    cont.innerHTML = html;
}



// --- inicializar la 4b ---
actualizarSelectPagador();
actualizarParticipantes();
actualizarMetodoExtra();
mostrarMovimientos();
mostrarSaldar();
mostrarPatrones();


// === FIX I18N COMPLETO: traducir toda la UI estatica ===
// (no solo deudas, sino tabs, balance, secciones, formularios)
function aplicarIdiomaCompleto() {
    var lang = flujoPrefs.idioma;

    // traducir los botones de las tabs
    var tabs = {
        resumen: { es: 'resumen', en: 'summary' },
        apuntes: { es: 'apuntes', en: 'entries' },
        tickets: { es: 'tickets', en: 'tickets' },
        deudas: { es: 'deudas', en: 'debts' }
    };
    document.querySelectorAll('.tab-btn').forEach(function (btn) {
        var tab = btn.getAttribute('data-tab');
        if (tabs[tab]) btn.textContent = tabs[tab][lang];
    });

    // traducir etiquetas del balance
    var balanceLabels = {
        'gastado': { es: 'gastado', en: 'spent' },
        'apuntes': { es: 'apuntes', en: 'entries' },
        'media': { es: 'media', en: 'average' },
        'ingresos': { es: 'ingresos', en: 'income' },
        'saldo': { es: 'saldo', en: 'balance' }
    };
    document.querySelectorAll('.balance-etiqueta').forEach(function (el) {
        var txt = el.textContent.trim().toLowerCase();
        if (balanceLabels[txt]) el.textContent = balanceLabels[txt][lang];
    });

    // traducir titulos de secciones
    var titulos = {
        'fuentes de ingreso': { es: 'fuentes de ingreso', en: 'income sources' },
        'flujo de dinero': { es: 'flujo de dinero', en: 'money flow' },
        'nuevo apunte': { es: 'nuevo apunte', en: 'new entry' },
        'libro mayor': { es: 'libro mayor', en: 'general ledger' },
        'escanear ticket': { es: 'escanear ticket', en: 'scan receipt' },
        'personas': { es: 'personas', en: 'people' },
        'nuevo gasto compartido': { es: 'nuevo gasto compartido', en: 'new shared expense' },
        'movimientos': { es: 'movimientos', en: 'movements' },
        'saldar deudas': { es: 'saldar deudas', en: 'settle debts' },
        'patrones detectados': { es: 'patrones detectados', en: 'detected patterns' }
    };
    document.querySelectorAll('.ingresos-titulo, .graficos-titulo, .entrada-titulo, .libro-cabecera span:first-child, .tickets-titulo, .deudas-titulo').forEach(function (el) {
        var txt = el.textContent.trim().toLowerCase();
        if (titulos[txt]) el.textContent = titulos[txt][lang];
    });

    // traducir etiquetas del formulario de gastos
    var formLabels = {
        'importe': { es: 'importe', en: 'amount' },
        'categoria': { es: 'categoria', en: 'category' },
        'descripcion': { es: 'descripcion', en: 'description' },
        'fecha': { es: 'fecha', en: 'date' }
    };
    document.querySelectorAll('.campo-etiqueta').forEach(function (el) {
        var txt = el.textContent.trim().toLowerCase();
        if (formLabels[txt]) el.textContent = formLabels[txt][lang];
    });

    // traducir placeholders
    var placeholders = {
        'mercadona, metro, café…': { es: 'mercadona, metro, café…', en: 'groceries, metro, coffee...' }
    };
    document.querySelectorAll('input[placeholder]').forEach(function (el) {
        var ph = el.placeholder;
        if (placeholders[ph]) el.placeholder = placeholders[ph][lang];
    });

    // traducir el boton "anotar"
    document.querySelectorAll('.btn-anotar').forEach(function (btn) {
        btn.textContent = lang === 'en' ? 'log' : 'anotar';
    });

    // traducir "añadir" de los formularios de personas y compartido
    document.querySelectorAll('.form-persona button[type=submit]').forEach(function (btn) {
        btn.textContent = lang === 'en' ? 'add' : 'añadir';
    });
    document.querySelectorAll('.form-compartido button[type=submit]').forEach(function (btn) {
        btn.textContent = lang === 'en' ? 'add' : 'añadir';
    });

    // traducir subtitulos de graficos
    var subtitulos = {
        'últimos 6 meses': { es: 'últimos 6 meses', en: 'last 6 months' },
        'por categoría': { es: 'por categoría', en: 'by category' }
    };
    document.querySelectorAll('.grafico-subtitulo').forEach(function (el) {
        var txt = el.textContent.trim().toLowerCase();
        if (subtitulos[txt]) el.textContent = subtitulos[txt][lang];
    });

    // traducir el mensaje de vacio
    document.querySelectorAll('.vacio').forEach(function (el) {
        var txt = el.textContent.trim();
        if (txt.indexOf('sin apuntes') !== -1 || txt.indexOf('no entries') !== -1) {
            el.textContent = lang === 'en' ? 'no entries this month.' : 'sin apuntes este mes.';
        } else if (txt.indexOf('sin movimientos') !== -1 || txt.indexOf('no shared') !== -1) {
            el.textContent = lang === 'en' ? 'no shared movements.' : 'sin movimientos compartidos.';
        } else if (txt.indexOf('sin deudas') !== -1 || txt.indexOf('no pending') !== -1) {
            el.textContent = lang === 'en' ? 'no pending debts. all settled.' : 'no hay deudas pendientes. todo saldado.';
        } else if (txt.indexOf('sin personas') !== -1 || txt.indexOf('add people') !== -1) {
            el.textContent = lang === 'en' ? 'add people to start tracking debts.' : 'añade personas para empezar a llevar deudas.';
        } else if (txt.indexOf('aun no hay patrones') !== -1 || txt.indexOf('no patterns') !== -1) {
            el.textContent = lang === 'en' ? 'no patterns detected yet. log more expenses so the app can find recurring ones.' : 'aun no hay patrones detectados. registra mas gastos para que la app encuentre recurrentes.';
        }
    });

    // traducir leyenda del grafico
    document.querySelectorAll('#grafico-leyenda, .grafico-leyenda').forEach(function (el) {
        el.innerHTML = '<span class="punto-max"></span> ' + (lang === 'en' ? 'highs' : 'maximas')
            + ' &nbsp;&nbsp; <span class="punto-min"></span> ' + (lang === 'en' ? 'lows' : 'minimas');
    });

    // traducir el footer
    document.querySelectorAll('.pie span').forEach(function (el, i) {
        if (i === 0) el.textContent = lang === 'en' ? 'flujo · beta 4' : 'flujo · beta 4';
        if (i === 1) el.textContent = lang === 'en' ? 'local data · no server' : 'datos locales · sin servidor';
    });

    // traducir el cabecera-sub
    var cabSub = document.querySelector('.cabecera-sub');
    if (cabSub) {
        cabSub.textContent = lang === 'en' ? 'expense ledger · vol. 1' : 'libro de gastos · vol. 1';
    }

    // traducir el boton de ajustes
    if (btnAjustes) {
        btnAjustes.textContent = lang === 'en' ? 'settings' : 'ajustes';
    }
}

// aplicar idioma completo al cargar
aplicarIdiomaCompleto();
