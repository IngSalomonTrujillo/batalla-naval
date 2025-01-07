document.addEventListener("DOMContentLoaded", function() {
    const tableros = document.querySelectorAll(".tablero-propio, .tablero-enemigo");
    const letras = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
    const numeros = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

    tableros.forEach(tablero => {
        // Crear encabezados de letras
        for (let i = 0; i <= letras.length; i++) {
            const div = document.createElement("div");
            div.className = "posición header";
            if (i > 0) {
                div.textContent = letras[i - 1];
            }
            tablero.appendChild(div);
        }

        // Crear filas y columnas
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
});
