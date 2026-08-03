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

    formGasto.requestFullscreen();
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
