function volverPagina() {
    window.history.back(); 
}

let jugadores = ['jugador1', 'jugador2'];
let turnoActual = 0;

function iniciarContador() {
    iniciarContadorJugador();
}

function iniciarContadorJugador() {
    let jugador = document.getElementById(jugadores[turnoActual]);
    let tiempo = 60; // 60 segundos por jugador
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