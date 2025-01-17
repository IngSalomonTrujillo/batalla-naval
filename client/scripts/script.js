
document.addEventListener("DOMContentLoaded", function () {
    const tableros = document.querySelectorAll(".tablero-propio, .tablero-enemigo");
    const letras = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
    const numeros = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
    const barcos = [
        { id: "ship1", href: "../images/ship1.png", width: 5, posiciones: [] },
        { id: "ship2", href: "../images/ship2.png", width: 4, posiciones: [] },
        { id: "ship3", href: "../images/ship3.png", width: 5, posiciones: [] },
        { id: "ship4", href: "../images/ship4.png", width: 4, posiciones: [] },
        { id: "ship5", href: "../images/ship5.png", width: 3, posiciones: [] }
    ];
    

    let barcosColocados = 0; // Contador de barcos colocados en el tablero
    let posicionesOcupadas = []; // Array para almacenar las posiciones ocupadas
    let barcosEnemigos = [
        { posiciones: ["A10"] },
        { posiciones: ["B2", "B3", "B4"] },
        { posiciones: ["C5", "C6", "C7", "C8"] }
    ]; // Arreglo para almacenar los barcos enemigos
    const barcoContainer = document.querySelector(".barcos");

    // Crear los barcos arrastrables
    barcos.forEach(barco => {
        const img = document.createElement("img");
        img.src = barco.href;
        img.id = barco.id;
        img.className = "barco";
        img.draggable = true;
        img.setAttribute("data-width", barco.width);
        img.setAttribute("data-rotation", "0"); // Inicializamos la rotación como 0

        img.onerror = function () {
            console.error("No se pudo cargar la imagen: " + barco.href);
        };

        barcoContainer.appendChild(img);

        // Eventos de dragstart para los barcos
        img.addEventListener("dragstart", (e) => {
            if (barcosColocados >= 5) { // Si ya hay 5 barcos en el tablero, no permitir arrastrar más
                e.preventDefault();
                alert("Ya has colocado el máximo de 5 barcos.");
                return;
            }
            e.dataTransfer.setData("text", barco.id); // Establece el id del barco al arrastrar
        });

        // Evento para voltear el barco al hacer clic
        img.addEventListener("click", function () {
            const currentRotation = parseInt(img.getAttribute("data-rotation") || "0");
            const newRotation = (currentRotation + 90) % 360;
            img.style.transform = `rotate(${newRotation}deg)`;
            img.setAttribute("data-rotation", newRotation); // Guardamos la rotación actual
        });
    });

    // Crear los tableros
    tableros.forEach(tablero => {
        for (let i = 0; i <= letras.length; i++) {
            const div = document.createElement("div");
            div.className = "posición header";
            if (i > 0) {
                div.textContent = letras[i - 1];
            }
            tablero.appendChild(div);
        }

        for (let i = 0; i < numeros.length; i++) {
            for (let j = 0; j <= letras.length; j++) {
                const div = document.createElement("div");
                if (j === 0) {
                    div.className = "posición header";
                    div.textContent = numeros[i];
                } else {
                    div.className = "posición";
                    div.id = `${letras[j - 1]}${numeros[i]}`; // Ejemplo: A1, B2, etc.
                }
                tablero.appendChild(div);
            }
        }
    });

    // Función para verificar si una posición está ocupada
    function verificarPosicionOcupada(posicionId) {
        return posicionesOcupadas.includes(posicionId);
    }

    // Función para agregar las posiciones ocupadas
    function agregarPosicionOcupada(posicionId) {
        if (!posicionesOcupadas.includes(posicionId)) {
            posicionesOcupadas.push(posicionId);
        }
    }

    // Función para manejar el arrastre y el drop de la imagen
    document.addEventListener('dragover', function (e) {
        e.preventDefault(); // Necesario para permitir el drop
    });

    document.addEventListener('drop', function (e) {
        const tableroPropio = document.querySelector(".tablero-propio");

        // Verificamos si el drop ocurrió dentro del tablero y sobre una celda válida
        if (tableroPropio.contains(e.target) && e.target.classList.contains('posición')) {
            if (barcosColocados >= 5) { // No permitir colocar más de 5 barcos
                alert("Ya has colocado el máximo de 5 barcos.");
                return;
            }

            const barcoId = e.dataTransfer.getData("text");
            const barco = barcos.find(b => b.id === barcoId);
            const posicionId = e.target.id;

            // No permitir colocar el barco en la primera fila (A) ni en la primera columna (1)
            const letra = posicionId.charAt(0); // Letra de la columna (A, B, C, ...)
            const numero = parseInt(posicionId.substring(1)); // Número de la fila (1, 2, 3, ...)

            if (letra === "A" || numero === 1) {
                alert("No puedes colocar el barco en la primera fila ni en la primera columna.");
                return;
            }

            // Verificar si la posición está ocupada
            if (verificarPosicionOcupada(posicionId)) {
                alert("Esta posición ya está ocupada.");
                return;
            }

            // Calcular si el barco cabe en la posición seleccionada
            const startIdx = letras.indexOf(letra);
            if (startIdx + barco.width > letras.length) {
                alert("El barco no cabe en esta posición.");
                return;
            }

            // Verificar si el barco es horizontal o vertical
            const rotation = parseInt(document.getElementById(barco.id).getAttribute("data-rotation") || "0");

            let targetPositionX = e.target.offsetLeft;
            let targetPositionY = e.target.offsetTop;

            // Validar si las posiciones en el tablero están ocupadas según la orientación
            const posicionesBarco = calcularPosicionesOcupadas(posicionId, barco.width, rotation);

            // Imprimir en consola las posiciones ocupadas por el barco
            console.log(`El barco ${barco.id} ha sido colocado en las siguientes posiciones:`);
            console.log(posicionesBarco);

            // Verificar si las posiciones del barco están ocupadas
            for (let posicion of posicionesBarco) {
                if (verificarPosicionOcupada(posicion)) {
                    alert("No puedes colocar el barco porque hay otro barco en las posiciones.");
                    return;
                }
            }

            // Crear una nueva imagen de barco ajustada
            const imgClone = document.getElementById(barco.id).cloneNode(true);
            imgClone.style.position = "absolute"; // Necesario para posicionarlo libremente sobre el tablero

            imgClone.style.left = `${targetPositionX}px`; // Ajustar la posición X
            imgClone.style.top = `${targetPositionY}px`; // Ajustar la posición Y

            // Colocar el barco sobre el tablero
            tableroPropio.appendChild(imgClone);

            imgClone.draggable = false; // Deshabilitamos el arrastre después de colocar el barco
            imgClone.setAttribute("data-colocado", "true");

            // Eliminar el barco del contenedor de barcos
            const imgOriginal = document.getElementById(barco.id);
            imgOriginal.remove(); // Eliminar del contenedor

            // Aumentar el contador de barcos colocados
            barcosColocados++;

            // Marcar las posiciones ocupadas por el barco
            posicionesBarco.forEach(p => agregarPosicionOcupada(p));

            // Hacer el barco eliminable al hacer clic
            imgClone.addEventListener('click', function () {
                imgClone.remove(); // Eliminar el barco del tablero
                barcosColocados--; // Reducir el contador de barcos colocados
                posicionesBarco.forEach(p => {
                    const idx = posicionesOcupadas.indexOf(p);
                    if (idx !== -1) posicionesOcupadas.splice(idx, 1); // Eliminar las posiciones del array de ocupadas
                });

                // Reagregar el barco al contenedor de barcos
                const imgOriginal = document.createElement("img");
                imgOriginal.src = barco.href;
                imgOriginal.id = barco.id;
                imgOriginal.className = "barco";
                imgOriginal.draggable = true;
                imgOriginal.setAttribute("data-width", barco.width);
                imgOriginal.setAttribute("data-rotation", "0");

                // Reagregar el barco al contenedor
                barcoContainer.appendChild(imgOriginal);
            });

            // Guardar las posiciones del barco colocado en barcosEnemigos
            barcosEnemigos.push({ id: barco.id, posiciones: posicionesBarco });
        }
    });

    // Función para calcular las posiciones ocupadas por un barco
    function calcularPosicionesOcupadas(posicionId, width, rotation) {
        const posiciones = [];
        const letra = posicionId.charAt(0); // Fila, por ejemplo "C"
        const numero = parseInt(posicionId.substring(1)); // Columna, por ejemplo 3
        const filaIndex = letras.indexOf(letra);

        for (let i = 0; i < width; i++) {
            if (rotation === 0) { // Horizontal
                const columna = numero + i;
                if (columna > 10) break;
                posiciones.push(`${letra}${columna}`);
            } else if (rotation === 90) { // Vertical
                const fila = letras[filaIndex + i];
                if (!fila) break;
                posiciones.push(`${fila}${numero}`);
            }
        }

        return posiciones;
    }

    // Lógica del ataque
    const attackButton = document.getElementById('atacar-enemigo');
    const moveInput = document.getElementById('move');

    attackButton.style.display = 'block';
    moveInput.style.display = 'block';

    attackButton.addEventListener('click', function () {
        // Obtener la posición ingresada
        var position = moveInput.value.toUpperCase();

        // Verificar si la posición tiene el formato correcto
        if (!/^[A-J]([1-9]|10)$/.test(position)) {
            alert('Formato de posición no válido');
            return;
        }

        // Obtener la casilla correspondiente en el tablero enemigo (el segundo tablero)
        var enemyBoard = document.getElementById('tablero-enemigo'); // Asegúrate de que el tablero enemigo tenga este ID
        var cell = enemyBoard.querySelector(`#${position}`);

        // Verificar si la casilla existe
        if (!cell) {
            alert('Posición no válida');
            return;
        }

        // Verificar si la casilla ya fue atacada
        if (cell.textContent === 'X' || cell.textContent === 'O') {
            alert('Ya has atacado esta posición.');
            return;
        }

        // Comprobar si la posición corresponde a una ocupada por un barco enemigo
        let atacado = false;
        for (let barco of barcosEnemigos) {
            if (barco.posiciones.includes(position)) {
                atacado = true;
                break;
            }
        }

        if (atacado) {
            console.log(`¡Un barco ha sido atacado en la posición ${position}!`);
            const img = document.createElement('img');
            img.src = "../images/flama.gif"; // GIF de la flama
            img.style.width = "110%"; // Reducir el tamaño de la imagen al 10%

            cell.innerHTML = ''; // Limpiar el contenido actual de la celda
            cell.appendChild(img); // Mostrar la imagen en la celda atacada

            cell.style.color = 'red'; // Resaltar en rojo para indicar un impacto
        } else {
            console.log(`No se ha atacado un barco en la posición ${position}.`);
            cell.textContent = 'O'; // Mostrar "O" si no hay barco en la posición
            cell.style.color = 'blue'; // Resaltar en azul para indicar un fallo
        }
    });



}
);


