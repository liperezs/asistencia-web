const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxuYAFOmuQi-4nTMRGXqINbNIeUszp-6yuYZ_DNcCv5n7YKuC5T0ShKWDHZnqyBFDHPsQ/exec"; // <-- tu URL aquí

// ========== LOGIN ==========
async function login() {
  const usuario = document.getElementById("loginUsuario");
  const password = document.getElementById("loginPassword");

  if (!usuario.value.trim() || !password.value.trim()) {
    return Swal.fire({
      icon: 'info',
      title: 'Campos incompletos',
      text: 'Por favor completa usuario y contraseña.'
    });
  }

  mostrarCargando("Verificando credenciales...");

  const res = await fetch(WEB_APP_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "login",
      usuario: usuario.value.trim().toLowerCase(),
      password: password.value.trim().toLowerCase()
    })
  });

  const data = await res.json();
  Swal.close();

  if (data.status === "success") {
    sessionStorage.setItem("usuario", data.usuario);
    sessionStorage.setItem("nombre", data.nombre);
    sessionStorage.setItem("perfil", data.perfil);

    Swal.fire({
      icon: 'success',
      title: '¡Bienvenido!',
      text: `Hola, ${data.nombre}`
    }).then(() => {
      window.location.href = "dashboard.html";
    });
  } else {
    Swal.fire({
      icon: 'error',
      title: 'Error de acceso',
      text: data.message || 'Usuario o contraseña incorrectos.'
    });
  }
}

// ========== REGISTRO ==========
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btnRegistrarUsuario");
  if (btn) {
    btn.addEventListener("click", registrarUsuario);
    activarValidacionCampos();
  }

  // 🔽 Activar búsqueda con Enter en filtros
  ["filtroUsuario", "filtroFechaIni", "filtroFechaFin"].forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          buscarRegistros();
        }
      });
    }
  });
});


async function registrarUsuario() {
  const usuario = document.getElementById("regUsuario");
  const password = document.getElementById("regPassword");
  const nombre = document.getElementById("regNombre");
  const area = document.getElementById("regArea");
  const sucursal = document.getElementById("regSucursal");
  const perfil = document.getElementById("regPerfil");

  const campos = [usuario, password, nombre, area, sucursal];

  // Validación
  let error = false;
  campos.forEach(input => {
    input.classList.remove("border-red-500", "border-green-500");
    if (!input.value.trim()) {
      input.classList.add("border-red-500");
      error = true;
    } else {
      input.classList.add("border-green-500");
    }
  });

  if (error) {
    return Swal.fire({
      icon: 'warning',
      title: 'Campos obligatorios',
      text: 'Por favor completa todos los campos antes de continuar.'
    });
  }

  mostrarCargando("Registrando usuario...");

  const res = await fetch(WEB_APP_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "registerUser",
      usuario: usuario.value.trim(),
      password: password.value.trim(),
      nombre: nombre.value.trim(),
      area: area.value,
      sucursal: sucursal.value,
      perfil: perfil.value
    })
  });

  const data = await res.json();
  Swal.close();

  if (data.status === "success") {
    Swal.fire({
      icon: 'success',
      title: 'Registro exitoso',
      text: 'El usuario ha sido registrado correctamente.'
    }).then(() => {
      window.location.href = "index.html";
    });
  } else {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo registrar el usuario. Intenta nuevamente.'
    });
  }
}

// ========== ASISTENCIA ==========
async function registrarAsistencia(tipo) {
  try {
    const usuario = sessionStorage.getItem("usuario");
    if (!usuario) {
      return Swal.fire({ icon: 'error', title: 'Sesión vencida', text: 'Vuelve a iniciar sesión.' });
    }

    // 1) Fecha/Hora correctas (yyyy-MM-dd y HH:mm:ss)
    const { fecha, hora } = fechaHoraGT();

    // 2) Geolocalización (lat, long y URL)
    const { lat, lng, url } = await obtenerGeo();
    console.log('Geo a enviar:', { lat, lng, url }); // Debug Geolocalización

    // Validar que se obtuvieron coordenadas
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return Swal.fire({ icon: 'error', title: 'Error de geolocalización', text: 'No se pudieron obtener las coordenadas.' });
    }
    // 3) Construcción del payload según sea entrada o salida
    const body = { action: "registrarAsistencia", usuario, tipo };

    if (tipo === "entrada") {
      body.fechaEntrada = fecha;
      body.horaEntrada  = hora;
      body.latEntrada   = lat;
      body.longEntrada  = lng;
      body.urlEntrada   = url;
    } else {
      body.fechaSalida = fecha;
      body.horaSalida  = hora;
      body.latSalida   = lat;
      body.longSalida  = lng;
      body.urlSalida   = url;
    }

    // 4) Envío
    const resp = await fetch(WEB_APP_URL, {
      method: "POST",
     headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify(body)
    });
    const result = await resp.json();

    if (result.status === "success") {
  Swal.fire({
    icon: 'success',
    title: `Registro de ${tipo} exitoso`
  }).then(() => {
    cerrarModal();
    goToLogin(); // redirige al login después de cerrar el mensaje
  });
} else {
  Swal.fire({ icon: 'error', title: 'No se pudo registrar', text: result.message || 'Intenta de nuevo' });
}

    /*if (result.status === "success") {
      Swal.fire({ icon: 'success', title: `Registro de ${tipo} exitoso` });
      cerrarModal();
      goToLogin(); // Forzar relogin para evitar manipulación del sistema
      // Refrescar lista si existe (página admin)
      if (typeof buscarRegistros === 'function') buscarRegistros();
    } else {
      Swal.fire({ icon: 'error', title: 'No se pudo registrar', text: result.message || 'Intenta de nuevo' });
    }*/
  } catch (err) {
    const msg = (err && err.message) ? err.message : 'Error desconocido';
    Swal.fire({ icon: 'error', title: 'Error de geolocalización/registro', text: msg });
  }
}


// ========== CONSULTA ADMIN ==========
async function buscarRegistros() {
  const usuario = document.getElementById("filtroUsuario").value;
  const fechaIni = document.getElementById("filtroFechaIni").value;
  const fechaFin = document.getElementById("filtroFechaFin").value;
  const tabla = document.getElementById("tablaRegistros");
  const tarjetas = document.getElementById("contenedorTarjetas");

  tabla.innerHTML = "";
  tarjetas.innerHTML = "";

  const res = await fetch(WEB_APP_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "getAsistencia",
      usuario,
      fechaIni,
      fechaFin
    })
  });

  const data = await res.json();

  if (data.status === "success") {
    if (data.data.length === 0) {
      tabla.innerHTML = "<tr><td colspan='5' class='p-2 text-center'>Sin registros</td></tr>";
      tarjetas.innerHTML = "<p class='text-center text-sm text-gray-500'>Sin registros</p>";
      return;
    }

    data.data.forEach(reg => {
      // Tabla
      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="border p-2">${reg[0]}</td>
        <td class="border p-2">${reg[1]} ${reg[2]}</td>
        <td class="border p-2"><a href="${reg[5]}" target="_blank">Ver</a></td>
        <td class="border p-2">${reg[6]} ${reg[7]}</td>
        <td class="border p-2"><a href="${reg[10]}" target="_blank">Ver</a></td>
      `;
      tabla.appendChild(row);

      // Tarjeta
      const div = document.createElement("div");
      div.className = "border rounded p-3 shadow bg-white text-sm";
      div.innerHTML = `
        <div><strong>Usuario:</strong> ${reg[0]}</div>
        <div><strong>Entrada:</strong> ${reg[1]} ${reg[2]}</div>
        <div><strong>Geo Entrada:</strong> <a href="${reg[5]}" target="_blank" class="text-blue-600 underline">Ver</a></div>
        <div><strong>Salida:</strong> ${reg[6] || "-"} ${reg[7] || ""}</div>
        <div><strong>Geo Salida:</strong> <a href="${reg[10]}" target="_blank" class="text-blue-600 underline">Ver</a></div>
      `;
      tarjetas.appendChild(div);
    });
  } else {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudieron cargar los registros."
    });
  }
}


// ========== UTILIDADES ==========
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function mostrarCargando(texto) {
  Swal.fire({
    title: texto,
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });
}

// ========== LOGOUT ==========
function logout() {
  Swal.fire({
    title: '¿Deseas cerrar sesión?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#9ca3af',
    confirmButtonText: 'Cerrar sesión'
  }).then((result) => {
    if (result.isConfirmed) {
      sessionStorage.clear();
      window.location.href = "index.html";
    }
  });
}

// ========== VALIDACIÓN EN TIEMPO REAL ==========
function activarValidacionCampos() {
  const campos = [
    "regUsuario",
    "regPassword",
    "regNombre",
    "regArea",
    "regSucursal"
  ];
  campos.forEach(id => {
    const campo = document.getElementById(id);
    if (campo) {
      campo.addEventListener("input", () => {
        if (campo.value.trim()) {
          campo.classList.remove("border-red-500");
          campo.classList.add("border-green-500");
        } else {
          campo.classList.remove("border-green-500");
          campo.classList.add("border-red-500");
        }
      });
    }
  });
}
function cerrarModal() {
  const modal = document.getElementById("modalAsistencia");
  if (modal) modal.classList.add("hidden");
}
function limpiarFiltros() {
  document.getElementById("filtroUsuario").value = "";
  document.getElementById("filtroFechaIni").value = "";
  document.getElementById("filtroFechaFin").value = "";
  buscarRegistros();
}
function fechaHoraGT() {
  const now = new Date();
  // Forzar a zona America/Guatemala (UTC-6, sin DST)
  const zoned = new Date(
    now.toLocaleString('en-US', { timeZone: 'America/Guatemala' })
  );
  const yyyy = String(zoned.getFullYear());
  const mm = String(zoned.getMonth() + 1).padStart(2, '0');
  const dd = String(zoned.getDate()).padStart(2, '0');
  const HH = String(zoned.getHours()).padStart(2, '0');
  const MM = String(zoned.getMinutes()).padStart(2, '0');
  const SS = String(zoned.getSeconds()).padStart(2, '0');
  return { fecha: `${yyyy}-${mm}-${dd}`, hora: `${HH}:${MM}:${SS}` };
}

function obtenerGeo(opts = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }) {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      return reject(new Error('Geolocalización no soportada'));
    }
    // Nota: geolocalización requiere HTTPS. Si estás probando con file:// o http://, el navegador puede bloquearla.
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const url = `https://maps.google.com/?q=${lat},${lng}`;
        resolve({ lat, lng, url });
      },
      (err) => reject(err),
      opts
    );
  });
}
function goToLogin() {
  try {
    sessionStorage.clear(); // o removeItem('usuario')/('nombre')/('perfil')
  } catch {}
  // Evita regresar con Back
  window.location.replace('index.html');
  // Fallback por si algún navegador difiere:
  setTimeout(() => { window.location.href = 'index.html'; }, 5000);
}