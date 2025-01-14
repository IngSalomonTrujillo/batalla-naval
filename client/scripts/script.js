document.addEventListener("DOMContentLoaded", function () {
    const tableros = document.querySelectorAll(".tablero-propio, .tablero-enemigo");
    const letras = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
    const numeros = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
    const barcos = [
        { id: "ship0", href: "../images/ship0.png", width: 2 },
        { id: "ship1", href: "../images/ship1.png", width: 3 },
        { id: "ship2", href: "../images/ship2.png", width: 4 },
        { id: "ship3", href: "../images/ship3.png", width: 5 },
        { id: "ship4", href: "../images/ship4.png", width: 3 },
        { id: "ship5", href: "../images/ship5.png", width: 4 }
    ];

    let barcosColocados = 0; // Contador de barcos colocados en el tablero

    // Crear los barcos arrastrables
    const barcoContainer = document.querySelector(".barcos");
    barcos.forEach(barco => {
        const img = document.createElement("img");
        img.src = barco.href;
        img.id = barco.id;
        img.className = "barco";
        img.draggable = true;
        img.setAttribute("data-width", barco.width);

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
        img.addEventListener("click", function() {
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
                    div.id = `p${numeros[i]}${letras[j - 1]}`;
                }
                tablero.appendChild(div);
            }
        }
    });

    // Función para manejar el arrastre y el drop de la imagen
    document.addEventListener('dragover', function(e) {
        e.preventDefault(); // Necesario para permitir el drop
    });

    document.addEventListener('drop', function(e) {
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

            const letra = posicionId.charAt(posicionId.length - 2);
            const numero = parseInt(posicionId.charAt(posicionId.length - 3));

            // No permitir colocar el barco en la primera fila (A) ni en la primera columna (1)
            if (letra === "A" || numero === 1) {
                alert("No puedes colocar el barco en la primera fila ni en la primera columna.");
                return;
            }

            // Calcular si el barco cabe en la posición seleccionada
            const startIdx = letras.indexOf(letra);
            if (startIdx + barco.width > letras.length) {
                alert("El barco no cabe en esta posición.");
                return;
            }

            // Obtener el rectángulo del tablero
            const tableroRect = tableroPropio.getBoundingClientRect(); // Rectángulo del tablero
            const offsetX = e.clientX - tableroRect.left; // Posición horizontal dentro del tablero
            const offsetY = e.clientY - tableroRect.top;  // Posición vertical dentro del tablero

            // Crear una nueva imagen de barco
            const imgClone = document.getElementById(barco.id).cloneNode(true);
            imgClone.style.position = "absolute"; // Necesario para posicionarlo libremente sobre el tablero

            // Aquí evitamos el redimensionamiento automático, manteniendo el tamaño del barco original
            imgClone.style.left = `${offsetX - imgClone.width / 2}px`; // Ajustar la posición X
            imgClone.style.top = `${offsetY - imgClone.height / 2}px`; // Ajustar la posición Y

            // Colocar el barco sobre el tablero
            tableroPropio.appendChild(imgClone);

            // Hacer que la imagen colocada sea arrastrable
            imgClone.draggable = false; // Deshabilitamos el arrastre después de colocar el barco

            // Permitir eliminar el barco al hacer clic sobre él
            imgClone.addEventListener("click", function() {
                imgClone.remove();
                barcosColocados--; // Restar un barco cuando se elimine
            });

            // Aumentar el contador de barcos colocados
            barcosColocados++;
        }
    });

    // Llamada a la función para colocar los barcos de dos en dos
    function colocarBarcosDeDosEnDos() {
        let index = 0;

        function colocarSiguienteBarco() {
            if (index < barcos.length) {
                for (let i = 0; i < 2 && index < barcos.length; i++) {
                    colocarBarco(barcos[index]);
                    index++;
                }
                setTimeout(colocarSiguienteBarco, 1500);
            }
        }

        colocarSiguienteBarco();
    }

    colocarBarcosDeDosEnDos();
});

function volverPagina() {
    window.history.back(); 
}

let jugadores = ['jugador1', 'jugador2'];
let turnoActual = 0;

function iniciarContadores() {
    iniciarContadorPartida();
    iniciarContadorJugador();
}

function iniciarContadorPartida() {
    let partida = document.getElementById('partida');
    let tiempo = 180; // 3 minutos en segundos

    let intervalo = setInterval(() => {
        let minutos = Math.floor(tiempo / 60);
        let segundos = tiempo % 60;
        partida.textContent = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;

        if (tiempo <= 0) {
            clearInterval(intervalo);
        } else {
            tiempo--;
        }
    }, 1000);
}

function iniciarContadorJugador() {
    let jugador = document.getElementById(jugadores[turnoActual]);
    let tiempo = 10; // 60 segundos por jugador
    document.getElementById('turno').textContent = `Turno de: Jugador ${turnoActual + 1}`;

    let intervalo = setInterval(() => {
        jugador.textContent = tiempo;

        if (tiempo <= 0) {
            clearInterval(intervalo);
            turnoActual = (turnoActual + 1) % jugadores.length;
            iniciarContadorJugador();
        } else {
            tiempo--;
        }
    }, 1000);
}

//OCULTAR BOTON JUGAR Y ATACAR
document.addEventListener('DOMContentLoaded', function() {
    // Obtener los elementos del DOM
    var playButton = document.getElementById('iniciar-partida');
    var attackButton = document.getElementById('atacar-enemigo');
    var moveInput = document.getElementById('move');

    // Inicialmente ocultar el botón "Atacar" y el input de movimiento
    attackButton.style.display = 'none';
    moveInput.style.display = 'none';

    // Agregar evento click al botón "Jugar"
    playButton.addEventListener('click', function() {
        // Ocultar el botón "Jugar"
        playButton.style.display = 'none';
        
        // Mostrar el botón "Atacar" y el input de movimiento
        attackButton.style.display = 'block';
        moveInput.style.display = 'block';
    });
});