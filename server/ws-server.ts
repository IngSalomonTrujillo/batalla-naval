/**
 * Este es un servidor de juego multijugador simple que utiliza WebSockets para la comunicación en tiempo real.
 * El servidor admite la creación de juegos, la unión a juegos existentes, el inicio de juegos, los movimientos de los
 * jugadores, el abandono de juegos y la gestión de errores.
 */
interface Game {
    id: string;
    players: Player[];
    started: boolean;
    turn: number;
    size:number;
}

interface Player {
        socket: WebSocket;
        playerName: string;
}

/**
 * Registro de juegos activos.
 * Cada juego se identifica por un ID de sala único y contiene una lista de jugadores, un indicador de si el juego ha
 * comenzado y un índice de turno.
 */
const games: Record<string, Game> = {};

/**
 * Tipos de mensajes que se reciben a través de la conexión WebSocket.
 */
type InboundMessage = 'create' | 'join' | 'start' | 'move' | 'hit' | 'leave' | 'estadoHundido' | 'shipPositions';

/**
 * Tipos de mensajes que se envían a través de la conexión WebSocket.
 */
type OutboundMessage = 'gameCreated' | 'playerJoined' | 'gameStarted' | 'move' | 'playerLeft' | 'leftGame' | 'defeatship' | 'estadoHit' | 'error' | 'info' | 'shipPositions';

/**
 * Interfaz de mensaje que se envía y se recibe a través de la conexión WebSocket.
 * Cada mensaje tiene un tipo y puede contener datos adicionales.
 * Los tipos de mensaje admitidos son: create, join, start, move, leave.
 */
interface Message {
    type: InboundMessage | OutboundMessage;
    gameId?: string;
    move?: string;
    message?: string;
    playerName?: string;
    playerCount?: number;
    size?: number;
    hit?: boolean;
    hundido?: number;
    posicionesBarcos?: [];
}

/**
 * Genera un ID de sala aleatorio de 8 caracteres de longitud.
 *
 * @returns {string} - Un ID de sala generado aleatoriamente.
 */
function generateGameId(): string {
    return Math.random().toString(36).substring(2, 10);
}

/**
 * Envía un mensaje a través de la conexión WebSocket a un cliente específico.
 *
 * @param {WebSocket} socket - El socket del cliente al que se enviará el mensaje.
 * @param {Message} message - El mensaje que se enviará al cliente.
 */
function sendMessage(socket: WebSocket, message: Message) {
    const messageString = JSON.stringify(message);

    socket.send(messageString);
    console.log(`%c-> %c${socket.url}: ${messageString}`, 'color: #ee0000', 'color: inherit');
}

const SERVER_HOST = '127.0.0.1';
const SERVER_PORT = 9092;

/**
 * Crea un servidor HTTP en el puerto 8080 y escucha las conexiones WebSocket.
 * Cada cliente que se conecta al servidor se agrega a un juego existente o se crea uno nuevo.
 * Los mensajes enviados por los clientes se reenvían a todos los jugadores en el mismo juego.
 * Los mensajes de error se envían al cliente que los ha provocado.
 * Los clientes que se desconectan se eliminan del juego al que pertenecen.
 * Los juegos se eliminan cuando no hay jugadores en ellos.
 * Los juegos se inician cuando hay al menos dos jugadores en ellos.
 * Los juegos tienen un turno que se incrementa cada vez que se recibe un movimiento.
 * Los movimientos solo se aceptan si es el turno del jugador que los envía.
 * Los movimientos se reenvían a todos los jugadores en el mismo juego.
 * Los movimientos cambian el turno al siguiente jugador en el juego.
 * Los jugadores pueden abandonar un juego en cualquier momento.
 * Los jugadores que abandonan un juego se eliminan del juego y se notifica a los demás jugadores.
 */
Deno.serve({ hostname: SERVER_HOST, port: SERVER_PORT }, (req) => {
    if (req.headers.get('upgrade') != 'websocket') {
        return new Response(null, { status: 501 });
    }

    const { socket, response } = Deno.upgradeWebSocket(req);

    console.log('Nuevo cliente conectado.');

    // Manejadores de eventos de WebSocket. Cada evento se activa cuando se recibe un mensaje del cliente.
    socket.addEventListener('open', () => {
        console.log('¡Se ha conectado un nuevo cliente!');
    });

    // Los mensajes se analizan y se envían a la función correspondiente para su procesamiento.
    socket.addEventListener('message', (event) => {
        console.log('Mensaje recibido desde el servidor:', event.data);
        const message = JSON.parse(event.data);
        console.log('Mensaje recibido:', message);
        handleMessage(socket, message);
    });

    // Manejador de eventos de cierre de WebSocket. Se activa cuando el cliente se desconecta.
    socket.addEventListener('close', () => {
        handleDisconnect(socket);
    });

    return response;
});

/**
 * Maneja un mensaje recibido a través de la conexión WebSocket. Los mensajes se analizan y se envían a la función
 * correspondiente para su procesamiento.
 *
 * @param {WebSocket} socket - El socket del cliente que ha enviado el mensaje.
 * @param {Message} message - El mensaje recibido del cliente.
 */
function handleMessage(socket: WebSocket, message: Message) {

    console.log('handleMessage - Tipo de mensaje:', message.type); 
    console.log('Mensaje completo:', message);
    // Básicamente, se intercambia un "único mensaje" que contiene un "tipo" y una carga útil adicional. Dependiendo del
    // tipo de mensaje, se realiza una acción específica. Por eso usamos un "switch":
    switch (message.type) {
        case 'create':
            // Si el mensaje es de tipo "create", se maneja la creación de un nuevo juego. Solo se necesita la conexión
            // WebSocket del jugador para crear un nuevo juego.
            
            if (typeof message.playerName === 'string' && message.playerName.trim() !== '' && message.size) { 
                console.log('Creando juego para el jugador:', message.playerName);
                 handleCreateGame(socket, message.playerName, message.size);
                 } else { 
                    console.error('El nombre del jugador está vacío en el servidor.');

                    sendMessage(socket, { type: 'error', message: 'El nombre del jugador no puede estar vacío y la partida debe tener una cantidad.' }); 
                }

            break;
        case 'join':
            // Para manejar la unión a un juego existente, se necesita la conexión WebSocket del jugador y el ID del
            // juego al cual el jugador se desea unir.
            console.log('Jugador uniéndose al juego:', message.playerName);
            if (message.playerName) { 
                handleJoinGame(socket, message.gameId, message.playerName, message.size);
             } 
             else {
                 sendMessage(socket, { type: 'error', message: 'El nombre del jugador no puede estar vacío.' }); 
                }
            break;
        case 'start':
            // Para manejar el inicio de un juego, se necesita la conexión WebSocket del jugador y el ID del juego a
            // iniciar.
            handleStartGame(socket, message.gameId);
            break;


        case 'shipPositions':
            handleShipPositions(socket, message.gameId, message.playerName, message.posicionesBarcos);
            break;

        case 'move':
            // Para manejar los movimientos de los jugadores, se necesita la conexión WebSocket del jugador, el ID del
            // juego y el movimiento del jugador. El movimiento se reenvía a todos los jugadores en el juego.
            handleMove(socket, message.gameId, message.move , message.playerName);
            break;
            
        case 'hit':
            handleHit(socket, message.move, message.hit, message.playerName, message.gameId);  ;
            break;
              
        case 'leave':
            // Para manejar el abandono de un juego, se necesita la conexión WebSocket del jugador y el ID del juego.
            handleLeaveGame(socket, message.gameId);
            break;

        case 'estadoHundido':
            // Para manejar el abandono de un juego, se necesita la conexión WebSocket del jugador y el ID del juego.
            handleHundido(socket, message.hundido, message.playerName, message.gameId);
            break;
        default:
            // Si el tipo de mensaje no es reconocido, se envía un mensaje de error al jugador.
            sendMessage(socket, { type: 'error', message: 'Unknown message type' });
    }
}

/**
 * Maneja el evento de creación de un juego (tipo de mensaje recibido desde el cliente: create). Crea un nuevo juego con
 * un ID de sala único y agrega al cliente que ha creado el juego como el primer jugador.
 *
 * @param {WebSocket} socket - El socket del cliente que ha creado el juego.
 */
function handleCreateGame(socket: WebSocket, playerName: string, size: number) {
    // Verificar si el nombre del jugador no está vacío
    if (!playerName || playerName.trim() === '') {
        sendMessage(socket, { type: 'error', message: 'El nombre del jugador no puede estar vacío entro aqui.' });
        return;
    }

    console.log('Crear juego con ID para el jugador:', playerName);
    const gameId = generateGameId();

    games[gameId] = { id: gameId, players: [{ socket, playerName }], started: false, turn: 0, size };
    sendMessage(socket, { type: 'gameCreated', gameId, playerName, size });
}

/**
 * Maneja el evento de hundimiento de un barco.
 *
 * @param {WebSocket} socket - El socket del cliente que ha enviado el mensaje.
 * @param {number} [hundido] - El número de barcos hundidos.
 */

function handleHundido(socket: WebSocket, hundido?: number, playerName?: string, gameId?: string) {
    if (!playerName) {
        sendMessage(socket, { type: 'error', message: 'No se especificó ningún nombre de jugador...' });
        return;
    }
    if (hundido ===0) {
        sendMessage(socket, { type: 'error', message: 'No se ha hundido ningun barco' });
        return;
    }
else {
    if (!gameId) {
        sendMessage(socket, { type: 'error', message: 'No se especificó ningún ID de juego...' });
        return;
    }

    const game = games[gameId];

    if (!game) {
        sendMessage(socket, { type: 'error', message: `No se encontró ningún juego bajo el ID "${gameId}"` });
        return;
    }
    game.players.forEach((player) => {
       
        sendMessage(player.socket, { type: 'defeatship', hundido, playerName }); }
    );
};
}   


/**
 *
 *
 * @param {WebSocket} socket - El socket del cliente que se une al juego.
 * @param {string} [gameId] - El ID del juego al que se une el cliente.
 */
function handleJoinGame(socket: WebSocket, gameId?: string, playerName?: string, size?: number) {
    if (!gameId) {
        // Nótese que se envía al cliente un objeto JSON, pero que se debe serializar a texto antes de enviarlo por el
        // WebSocket, ya que sólo es posible enviar strings, ArrayBuffer y Blob vía WebSocket (en realidad hay otros
        // tipos de datos que se pueden enviar, pero al momento de la escritura de este código no son estándar). Por eso
        // se usa el método "JSON.stringify" para convertir el objeto a texto antes de enviarlo...
        socket.send(JSON.stringify({ type: 'error', message: 'No se especificó ningún ID de juego...' }));
        return; // Este "return" es importante para evitar que se siga ejecutando el código...
    }

    if (!playerName) { 
        socket.send(JSON.stringify({ type: 'error', message: 'No se especificó ningún nombre de jugador...' })); 
        return;
     }

    // Se obtiene el juego correspondiente al ID especificado por el cliente...
    const game = games[gameId];

    if (!game) {
        // Si no se encontró ningún juego bajo el ID especificado, se envía un mensaje de error al cliente
        socket.send(JSON.stringify({ type: 'error', message: `No se encontró ningún juego bajo el ID "${gameId}"` }));
        return; // Este "return" es importante para evitar que se siga ejecutando el código...
    }

    if (!size) { 
        socket.send(JSON.stringify({ type: 'error', message: 'No se especificó ningun tamano de partida...' })); 
        return;
     }


    if (game.players.length >= size) {
        // Si el juego ya tiene 4 jugadores, se envía un mensaje de error al cliente
        socket.send(JSON.stringify({ type: 'error', message: 'El juego no admite más jugadores...' }));
        return; // Este "return" es importante para evitar que se siga ejecutando el código...
    }

    // Se agrega al cliente que se unió al juego a la lista de jugadores...
    game.players.push({ socket, playerName });

    // Se notifica a todos los jugadores en el juego que un nuevo jugador se ha unido...
    game.players.forEach((player) => { 
        sendMessage(player.socket, { type: 'playerJoined', gameId, playerCount: game.players.length, playerName }); 
    });

    sendMessage(socket, { type: 'playerJoined', gameId, playerCount: game.players.length, playerName  });
}

/**
 * Maneja el evento de inicio de un juego (tipo de mensaje recibido desde el cliente: start).
 *
 * @param {WebSocket} socket - El socket del cliente que ha iniciado el juego.
 * @param {string} [gameId] - El ID del juego que se va a iniciar.
 */
function handleStartGame(socket: WebSocket, gameId?: string) {
    if (!gameId) {
        socket.send(JSON.stringify({ type: 'error', message: 'No se especificó ningún ID de juego...' }));
        return;
    }

    const game = games[gameId];

    if (!game) {
        socket.send(JSON.stringify({ type: 'error', message: `No se encontró ningún juego bajo el ID "${gameId}"` }));
        return;
    }

    if (game.started) {
        socket.send(JSON.stringify({ type: 'error', message: 'El juego ya se ha iniciado...' }));
        return;
    }

    if (game.players.length < 2) {
        socket.send(
            JSON.stringify({ type: 'error', message: 'No hay suficientes jugadores para iniciar la partida...' }),
        );
        return;
    }

    game.started = true;
    game.players.forEach((player) => {
        if (player.socket !== socket) {
            sendMessage(player.socket, { type: 'gameStarted', gameId });
        }
    });

    sendMessage(socket, { type: 'gameStarted', gameId });
}


/**
 * Maneja el evento de mandar las posiciones de los barcos
 
 */
function handleShipPositions(socket: WebSocket, gameId?:string, playerName?:string, posicionesBarcos?:[])
{
    if (!gameId) {
        sendMessage(socket, { type: 'error', message: 'No se especificó ningún ID de juego...' });
        return;
    }

    if (!playerName) {
        sendMessage(socket, { type: 'error', message: 'No se especificó ningún nombre de jugador error player name...' });
        return;
    }

    if(posicionesBarcos === undefined || !Array.isArray(posicionesBarcos)){
        sendMessage(socket, { type: 'error', message: 'No llegan las posiciones' });
    }

    const game = games[gameId];

    if (!game) {
        sendMessage(socket, { type: 'error', message: `No se encontró ningún juego bajo el ID "${gameId}"` });
        return;
    }

    game.players.forEach((player) => {
        
            sendMessage(player.socket, { type: 'shipPositions', gameId, playerName , posicionesBarcos});
        
    });

    sendMessage(socket, { type: 'shipPositions', gameId, playerName , posicionesBarcos});

}

/**
 * Maneja el evento de movimiento de un jugador (tipo de mensaje recibido desde el cliente: move).
 *
 * @param {WebSocket} socket - El socket del cliente que ha realizado el movimiento.
 * @param {string} [gameId] - El ID del juego en el que se ha realizado el movimiento.
 * @param {string} [move] - El movimiento realizado por el jugador.
 */
function handleMove(socket: WebSocket, gameId?: string, move?: string , playerName?: string) {
    if (!gameId) {
        sendMessage(socket, { type: 'error', message: 'No se especificó ningún ID de juego...' });
        return;
    }

    if (!playerName) {
        sendMessage(socket, { type: 'error', message: 'No se especificó ningún nombre de juego...' });
        return;
    }

    const game = games[gameId];

    if (!game) {
        sendMessage(socket, { type: 'error', message: `No se encontró ningún juego bajo el ID "${gameId}"` });
        return;
    }

    if (!game.started) {
        sendMessage(socket, { type: 'error', message: 'El juego aún no se ha iniciado...' });
        return;
    }

    if (game.players[game.turn].socket !== socket) {
        sendMessage(socket, { type: 'error', message: 'No es tu turno :@' });
        return;
    }

    if (move === undefined || move === null || move === '') {
        sendMessage(socket, { type: 'error', message: '¡Debe especificarse un movimiento!' });
        return;
    }

    game.players.forEach((player) => {
        if (player.socket !== socket) {
            sendMessage(player.socket, { type: 'move', gameId, move, playerName});
        }
    });

    sendMessage(socket, { type: 'move', gameId, move, playerName });
    game.turn = (game.turn + 1) % game.players.length;
}


/**Maneja e indica si le ha dado a un barco o no
 @param {WebSocket} socket - El socket del cliente que ha realizado el movimiento.
 @param {string} [move] - El movimiento realizado por el jugador.
 @param {boolean}[hit] -Si le dio al barco o no
 @param {number}[hundido] -Si le dio al barco o no
 */

 function handleHit(socket: WebSocket, move?: string, hit?: boolean, playerName?:string, gameId?: string) {

    if (move === undefined || move === null || move === '') {
        sendMessage(socket, { type: 'error', message: '¡Debe especificarse un movimiento!' });
        return;
    }
    if (!gameId) {
        sendMessage(socket, { type: 'error', message: 'No se especificó ningún ID de juego...' });
        return;
    }
 
    if (!playerName) {
        sendMessage(socket, { type: 'error', message: 'No se especificó ningún nombre de juego...' });
        return;
    }

    const game = games[gameId];

    if (!game) {
        sendMessage(socket, { type: 'error', message: `No se encontró ningún juego bajo el ID "${gameId}"` });
        return;
    }

    game.players.forEach((player) => {
       
            sendMessage(player.socket, { type: 'estadoHit', move, hit, playerName, gameId });
        
    });

    sendMessage(socket, { type: 'estadoHit', move, hit, playerName, gameId });
        
    
}

/**
 * Maneja el evento de abandono de un jugador (tipo de mensaje recibido desde el cliente: leave).
 *
 * @param {WebSocket} socket - El socket del cliente que se ha desconectado.
 * @param {string} [gameId] - El ID del juego del que el jugador se está yendo.
 */
function handleLeaveGame(socket: WebSocket, gameId?: string) {
    if (!gameId) {
        sendMessage(socket, { type: 'error', message: 'No se especificó ningún ID de juego...' });
        return;
    }

    const game = games[gameId];

    if (!game) {
        sendMessage(socket, { type: 'error', message: `No se encontró ningún juego bajo el ID "${gameId}"` });
        return;
    }

    game.players = game.players.filter((player) => player.socket !== socket);

    if (game.players.length === 0) {
        delete games[gameId];
    } else {
        game.players.forEach((player) =>
            sendMessage(player.socket, { type: 'playerLeft', gameId, playerCount: game.players.length }),
        );
    }

    sendMessage(socket, { type: 'leftGame', gameId });
}
/**
 * Maneja el evento de desconexión de un jugador (evento de cierre de la conexión WebSocket).
 *
 * @param {WebSocket} socket - El socket del cliente que se ha desconectado.
 */
function handleDisconnect(socket: WebSocket) {
    for (const gameId in games) {
        const game = games[gameId];

        if (game.players.some((player) => player.socket === socket)) {
            handleLeaveGame(socket, gameId);
            break;
        }
    }
}
