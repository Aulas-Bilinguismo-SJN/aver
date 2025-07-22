const BACKEND_URL = 'https://script.google.com/macros/s/AKfycbxRNGfdkC8aMOowMFIusKSmJauSNBDFb5i-AbUaIifpm7HPk1_rOpfi5A9xFjqx_OWDmg/exec';
const BASE_A_ID = '1GU1oKIb9E0Vvwye6zRB2F_fT2jGzRvJ0WoLtWKuio-E';

let baseA = [];
const items = Array.from({length: 50}, (_, i) => ({
    id: i + 1,
    documento: "",
    profesor: "",
    materia: ""
}));

// Cargar BaseA al inicio
async function init() {
    try {
        const res = await fetch(`${BACKEND_URL}?action=obtenerBaseA&id=${BASE_A_ID}`);
        const data = await res.json();
        if (data.success) {
            baseA = data.data;
            console.log("BaseA cargada");
        } else {
            alert("Error cargando base de datos");
        }
    } catch (e) {
        alert("Error de conexión");
    }
    renderGrid();
}

// Buscar persona por documento
const findByDoc = (doc) => baseA.find(r => String(r.Documento).trim() === doc.trim());

// Registrar operación
async function saveOperation(item, tipo, comentario = "") {
    const persona = findByDoc(item.documento);
    await fetch(BACKEND_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: "registrarOperacion",
            equipo: item.id,
            documento: item.documento,
            profesor: item.profesor,
            materia: item.materia,
            tipo,
            nombre: persona?.["Nombre Completo"] || "",
            curso: persona?.["Curso"] || "",
            telefono: persona?.["Teléfono"] || "",
            comentario
        })
    });
}

// Mostrar modal
function showModal(itemId) {
    if (!baseA.length) return alert("Base de datos no cargada");
    
    const item = items[itemId - 1];
    const modal = document.getElementById('modalMetodos');
    const content = document.getElementById('listaMetodos');
    
    if (item.documento) {
        showReturnModal(item, modal, content);
    } else {
        showLoanModal(item, modal, content);
    }
    
    modal.style.display = 'block';
}

function showLoanModal(item, modal, content) {
    content.innerHTML = `
        <h2>Equipo ${item.id}</h2>
        <div style="display:flex;flex-direction:column;gap:15px">
            <div>
                <label>Documento:</label>
                <textarea id="doc" rows="2" placeholder="Ingrese documento"></textarea>
            </div>
            <div>
                <label>Profesor:</label>
                <input id="prof" placeholder="Nombre del profesor">
            </div>
            <div>
                <label>Materia:</label>
                <input id="mat" placeholder="Materia">
            </div>
            <div style="display:flex;gap:10px;justify-content:flex-end">
                <button onclick="saveLoan(${item.id})" style="background:#007bff;color:white;padding:8px 16px;border:none;border-radius:4px">Guardar</button>
                <button onclick="closeModal()" style="background:#6c757d;color:white;padding:8px 16px;border:none;border-radius:4px">Cancelar</button>
            </div>
        </div>
    `;
}

function showReturnModal(item, modal, content) {
    content.innerHTML = `
        <h2>Devolver Equipo ${item.id}</h2>
        <div style="display:flex;flex-direction:column;gap:15px">
            <div>
                <p><strong>Documento:</strong> ${item.documento}</p>
                <p><strong>Profesor:</strong> ${item.profesor}</p>
                <p><strong>Materia:</strong> ${item.materia || '-'}</p>
            </div>
            <div>
                <label>Comentario:</label>
                <textarea id="comment" rows="3" placeholder="Comentario opcional"></textarea>
            </div>
            <div style="display:flex;gap:10px;justify-content:flex-end">
                <button onclick="saveReturn(${item.id})" style="background:#dc3545;color:white;padding:8px 16px;border:none;border-radius:4px">Devolver</button>
                <button onclick="closeModal()" style="background:#6c757d;color:white;padding:8px 16px;border:none;border-radius:4px">Cancelar</button>
            </div>
        </div>
    `;
}

async function saveLoan(itemId) {
    const doc = document.getElementById('doc').value.trim();
    const prof = document.getElementById('prof').value.trim();
    const mat = document.getElementById('mat').value.trim();
    
    if (!doc) return alert("Ingrese documento");
    if (!findByDoc(doc)) return alert("Documento no encontrado");
    
    const item = items[itemId - 1];
    item.documento = doc;
    item.profesor = prof;
    item.materia = mat;
    
    await saveOperation(item, "Préstamo");
    closeModal();
    renderGrid();
}

async function saveReturn(itemId) {
    const comment = document.getElementById('comment').value.trim();
    const item = items[itemId - 1];
    
    await saveOperation(item, "Devolución", comment);
    
    item.documento = "";
    item.profesor = "";
    item.materia = "";
    
    closeModal();
    renderGrid();
}

function closeModal() {
    document.getElementById('modalMetodos').style.display = 'none';
}

function renderGrid() {
    const container = document.getElementById("malla") || document.getElementById("contenedorEquipos");
    container.innerHTML = "";
    container.style.cssText = "display:grid;grid-template-columns:repeat(10,1fr);gap:15px;padding:20px";
    
    items.forEach(item => {
        const occupied = !!item.documento;
        const div = document.createElement("div");
        div.style.cssText = `
            background:${occupied ? '#d4edda' : '#f8f9fa'};
            border:2px solid ${occupied ? '#28a745' : '#ccc'};
            display:flex;flex-direction:column;align-items:center;justify-content:center;
            cursor:pointer;border-radius:8px;padding:15px;min-height:60px
        `;
        div.innerHTML = `
            <div style="font-weight:bold;font-size:18px">${item.id}</div>
            <div style="color:${occupied ? 'green' : '#6c757d'};font-size:24px">${occupied ? '✓' : '○'}</div>
        `;
        div.onclick = () => showModal(item.id);
        container.appendChild(div);
    });
}

function resetearMalla() {
    if (confirm("¿Resetear todos los equipos?")) {
        items.forEach(item => {
            item.documento = "";
            item.profesor = "";
            item.materia = "";
        });
        renderGrid();
    }
}

// Event listeners
window.onclick = e => e.target.id === 'modalMetodos' && closeModal();
document.addEventListener('keydown', e => e.key === 'Escape' && closeModal());
document.addEventListener('DOMContentLoaded', init);
