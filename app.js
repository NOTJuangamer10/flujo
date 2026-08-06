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
