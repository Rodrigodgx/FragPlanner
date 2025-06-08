document.addEventListener('DOMContentLoaded', () => {

    // =================================================================
    // 1. CONFIGURAÇÃO INICIAL E VARIÁVEIS
    // =================================================================
    const canvas = document.getElementById('planner-canvas');
    const ctx = canvas.getContext('2d');
    const mapSelector = document.getElementById('map-selector');
    const lancersList = document.getElementById('lancers-list');
    const utilitiesList = document.getElementById('utilities-list');
    const penToolBtn = document.getElementById('pen-tool');
    const eraserToolBtn = document.getElementById('eraser-tool');
    const colorPicker = document.getElementById('color-picker');
    const clearAllBtn = document.getElementById('clear-all-btn');

    // --- MUDANÇA AQUI ---
    // Criamos uma constante para controlar o tamanho dos ícones no canvas.
    // Se quiser mudar o tamanho de novo, basta alterar este valor!
    const ICON_SIZE_ON_CANVAS = 60; // O valor anterior era 70

    let currentTool = 'pen';
    let isDrawing = false;
    let isDragging = false;
    let currentColor = colorPicker.value;
    let objectsOnCanvas = [];
    let selectedObject = null;
    let startX, startY;
    const backgroundImage = new Image();

    const LANCERS = ['Aranha', 'Axônio', 'Broker', 'Chum', 'Corona', 'Dex', 'Hollowpoint', 'Jaguar', 'Kismet', 'Nitro', 'Pathojen', 'Serket', 'Sonar', 'Zéfiro'];
    const UTILITIES = ['Smoke', 'Incendiary', 'Flash'];


    function resizeCanvas() {
        const displayWidth = canvas.clientWidth;
        const displayHeight = canvas.clientHeight;
        if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
            canvas.width = displayWidth;
            canvas.height = displayHeight;
        }
        redrawCanvas();
    }


    // =================================================================
    // 2. FUNÇÕES DE INICIALIZAÇÃO
    // =================================================================
    function populateLists() { /* ...código sem alteração... */
        LANCERS.forEach(name => {
            const icon = createDraggableIcon(name, 'lancer', `assets/lancers/${name}.PNG`);
            lancersList.appendChild(icon);
        });
        UTILITIES.forEach(name => {
            const icon = createDraggableIcon(name, 'utility', `assets/utils/${name}.PNG`);
            utilitiesList.appendChild(icon);
        });
    }
    function createDraggableIcon(name, type, imagePath) { /* ...código sem alteração... */
        const div = document.createElement('div');
        div.className = 'draggable-icon';
        div.draggable = true;
        const img = document.createElement('img');
        img.src = imagePath;
        img.alt = name;
        const span = document.createElement('span');
        span.textContent = name;
        div.appendChild(img);
        div.appendChild(span);
        div.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', JSON.stringify({ name, type, imagePath }));
        });
        return div;
    }
    function loadMap() { /* ...código sem alteração... */ 
        const mapName = mapSelector.value;
        const imagePath = `assets/maps/${mapName}.PNG`;
        backgroundImage.src = imagePath;
        backgroundImage.onload = () => redrawCanvas();
        backgroundImage.onerror = () => {
            const errorMessage = `ERRO: Não foi possível carregar o mapa!\n\nVerifique se o arquivo existe em:\n${imagePath}`;
            console.error(errorMessage);
            alert(errorMessage);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        };
    }

    // =================================================================
    // 3. LÓGICA DO CANVAS E DESENHO
    // =================================================================
    function redrawCanvas() {
        const displayWidth = canvas.clientWidth;
        const displayHeight = canvas.clientHeight;
        if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
            canvas.width = displayWidth;
            canvas.height = displayHeight;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (backgroundImage.complete && backgroundImage.src) {
            ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
        }
        objectsOnCanvas.forEach(obj => {
            if (obj.type === 'icon') {
                ctx.drawImage(obj.img, obj.x, obj.y, obj.width, obj.height);
                if (obj === selectedObject) {
                    ctx.strokeStyle = '#FFFF00';
                    ctx.lineWidth = 3;
                    ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
                }
            } else if (obj.type === 'path') { 
                drawPath(obj);
            }
            // Lógica de desenhar formas foi removida
        });
    }

    // Apenas a função de desenhar caminho livre permanece
    function drawPath(obj){
        ctx.beginPath();
        ctx.moveTo(obj.points[0].x, obj.points[0].y);
        obj.points.forEach(point => ctx.lineTo(point.x, point.y));
        ctx.strokeStyle = obj.color;
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.stroke();
    }
    // Funções drawLine, drawRect, drawCircle foram removidas

    // =================================================================
    // 4. MANIPULAÇÃO DE EVENTOS
    // =================================================================
    canvas.addEventListener('dragover', (e) => e.preventDefault());
    
    canvas.addEventListener('drop', (e) => { 
        e.preventDefault(); 
        const data = JSON.parse(e.dataTransfer.getData('text/plain')); 
        const rect = canvas.getBoundingClientRect(); 
        const x = e.clientX - rect.left; 
        const y = e.clientY - rect.top; 
        const iconImage = new Image(); 
        iconImage.src = data.imagePath; 
        iconImage.onload = () => { 
            objectsOnCanvas.push({ 
                type: 'icon', 
                name: data.name, 
                img: iconImage, 
                // --- MUDANÇA AQUI ---
                // Usamos a nossa nova constante para definir o tamanho e o centro do ícone
                x: x - (ICON_SIZE_ON_CANVAS / 2), 
                y: y - (ICON_SIZE_ON_CANVAS / 2), 
                width: ICON_SIZE_ON_CANVAS, 
                height: ICON_SIZE_ON_CANVAS 
            }); 
            redrawCanvas(); 
        }; 
    });

    canvas.addEventListener('mousedown', (e) => { const rect = canvas.getBoundingClientRect(); const mouseX = e.clientX - rect.left; const mouseY = e.clientY - rect.top; selectedObject = getObjectAtPosition(mouseX, mouseY); if (selectedObject && selectedObject.type === 'icon') { isDragging = true; canvas.style.cursor = 'grabbing'; startX = mouseX - selectedObject.x; startY = mouseY - selectedObject.y; } else { selectedObject = null; isDrawing = true; startX = mouseX; startY = mouseY; if (currentTool === 'pen') { objectsOnCanvas.push({ type: 'path', color: currentColor, points: [{ x: startX, y: startY }] }); } } redrawCanvas(); });
    
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        if (!isDragging && !isDrawing) { const objectUnderMouse = getObjectAtPosition(mouseX, mouseY); if (objectUnderMouse && objectUnderMouse.type === 'icon') { canvas.style.cursor = 'grab'; } else { canvas.style.cursor = currentTool === 'eraser' ? 'cell' : 'crosshair'; } return; }
        if (isDragging && selectedObject) {
            selectedObject.x = mouseX - startX;
            selectedObject.y = mouseY - startY;
        } else if (isDrawing) {
            if (currentTool === 'pen') {
                objectsOnCanvas[objectsOnCanvas.length - 1].points.push({ x: mouseX, y: mouseY });
            } else if (currentTool === 'eraser') {
                eraseAtPosition(mouseX, mouseY);
            }
        }
        redrawCanvas();
    });

    canvas.addEventListener('mouseup', (e) => {
        if (isDragging) { const rect = canvas.getBoundingClientRect(); const mouseX = e.clientX - rect.left; const mouseY = e.clientY - rect.top; const objectUnderMouse = getObjectAtPosition(mouseX, mouseY); canvas.style.cursor = objectUnderMouse ? 'grab' : 'crosshair'; }
        isDrawing = false;
        isDragging = false;
        // Lógica de finalização de formas foi removida
        redrawCanvas();
    });

    window.addEventListener('keydown', (e) => { if (e.key === 'Delete' && selectedObject) { objectsOnCanvas = objectsOnCanvas.filter(obj => obj !== selectedObject); selectedObject = null; redrawCanvas(); } });
    function getObjectAtPosition(x, y) { for (let i = objectsOnCanvas.length - 1; i >= 0; i--) { const obj = objectsOnCanvas[i]; if (obj.type === 'icon') { if (x >= obj.x && x <= obj.x + obj.width && y >= obj.y && y <= obj.y + obj.height) { return obj; } } } return null; }
    function eraseAtPosition(x, y) { objectsOnCanvas = objectsOnCanvas.filter(obj => { if (obj.type !== 'path') return true; const padding = 10; return !obj.points.some(p => Math.abs(p.x - x) < padding && Math.abs(p.y - y) < padding); }); }


    // =================================================================
    // 5. EVENT LISTENERS DA UI
    // =================================================================
    const toolBtns = document.querySelectorAll('.tool-btn');
    toolBtns.forEach(btn => { btn.addEventListener('click', () => { toolBtns.forEach(b => b.classList.remove('active')); btn.classList.add('active'); currentTool = btn.id.replace('-tool', ''); canvas.style.cursor = currentTool === 'eraser' ? 'cell' : 'crosshair'; selectedObject = null; redrawCanvas(); }); });
    colorPicker.addEventListener('input', (e) => { currentColor = e.target.value; });
    mapSelector.addEventListener('change', loadMap);
    clearAllBtn.addEventListener('click', () => { if (confirm('Você tem certeza que deseja limpar todo o planejamento?')) { objectsOnCanvas = []; selectedObject = null; redrawCanvas(); } });


    // =================================================================
    // 6. EXECUÇÃO INICIAL
    // =================================================================
    window.addEventListener('resize', resizeCanvas);
    populateLists();
    loadMap();
    penToolBtn.click();
    resizeCanvas();
});