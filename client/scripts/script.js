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

        img.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text", barco.id); // Establece el id del barco al arrastrar
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

    // Función para colocar un barco en el tablero
    function colocarBarco(barco) {
        const tablero = document.querySelector(".tablero-propio");

        // Añadimos los eventos de dragover y drop a cada celda del tablero
        tablero.querySelectorAll(".posición").forEach(celda => {
            celda.addEventListener("dragover", (e) => {
                e.preventDefault(); // Necesario para permitir el drop
            });

            celda.addEventListener("drop", (e) => {
                e.preventDefault();
                const barcoId = e.dataTransfer.getData("text");
                const barco = barcos.find(b => b.id === barcoId);
                const posicionId = e.target.id;

                // Posición de la celda donde se suelta
                const letra = posicionId.charAt(posicionId.length - 2);
                const numero = parseInt(posicionId.charAt(posicionId.length - 3));

                // Celdas ocupadas para la colocación
                const celdasOcupadas = [];
                for (let i = 0; i < barco.width; i++) {
                    const nuevaLetra = String.fromCharCode(letra.charCodeAt(0) + i);
                    celdasOcupadas.push(`#p${numero}${nuevaLetra}`);
                }

                // Verificamos si las celdas están libres
                const validPlacement = celdasOcupadas.every(celdaId => !document.querySelector(celdaId).hasChildNodes());

                if (validPlacement) {
                    // Coloca el barco en las celdas
                    celdasOcupadas.forEach(celdaId => {
                        const celda = document.querySelector(celdaId);
                        const imgClone = document.getElementById(barco.id).cloneNode(true);
                        imgClone.style.width = "100%"; // Ajustamos el tamaño del barco
                        celda.appendChild(imgClone);
                    });
                } else {
                    alert("No se puede colocar el barco aquí, hay celdas ocupadas.");
                }
            });
        });
    }

    // Función para colocar los barcos de dos en dos
    function colocarBarcosDeDosEnDos() {
        let index = 0;

        // Coloca barcos de dos en dos con un intervalo
        function colocarSiguienteBarco() {
            if (index < barcos.length) {
                // Coloca dos barcos a la vez
                for (let i = 0; i < 2 && index < barcos.length; i++) {
                    colocarBarco(barcos[index]); // Coloca el barco en el tablero
                    index++;
                }
                setTimeout(colocarSiguienteBarco, 1500); // Espera 1.5 segundos para colocar el siguiente par
            }
        }

        colocarSiguienteBarco();
    }

    // Llamada a la función para colocar los barcos de dos en dos
    colocarBarcosDeDosEnDos();
});

function volverPagina() {
    window.history.back(); 
}
