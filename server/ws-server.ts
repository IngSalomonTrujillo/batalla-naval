/**
 * Este es un servidor para un juego de batalla entre héroes, usando WebSockets para la comunicación en tiempo real.
 * Los jugadores pueden crear un equipo, unirse a uno existente, comenzar la batalla, realizar movimientos y salir.
 */

interface Battle {
    id: string;
    participants: WebSocket[];
    inProgress: boolean;
    round: number;
}

/**
 * Registro de batallas activas.
 * Cada batalla se identifica por un ID único, con una lista de participantes, un indicador de si está en progreso y un índice de ronda.
 */
const battles: Record<string, Battle> = {};

/**
 * Tipos de mensajes que se reciben a través de la conexión WebSocket.
 */
type IncomingMessage = 'createTeam' | 'joinTeam' | 'startBattle' | 'attack' | 'leaveTeam';

/**
 * Tipos de mensajes que se envían a través de la conexión WebSocket.
 */
type OutgoingMessage = 'teamCreated' | 'participantJoined' | 'battleStarted' | 'attackPerformed' | 'participantLeft' | 'leftTeam' | 'error' | 'battleResult';

/**
 * Interfaz de mensaje que se envía y se recibe a través de la conexión WebSocket.
 */
interface Message {
    type: IncomingMessage | OutgoingMessage;
    battleId?: string;
    attack?: string;
    message?: string;
    participantCount?: number;
}

/**
 * Genera un ID de batalla aleatorio de 8 caracteres de longitud.
 */
function generateBattleId(): string {
    return Math.random().toString(36).substring(2, 10);
}

/**
 * Envía un mensaje a través de la conexión WebSocket a un cliente específico.
 */
function sendMessage(socket: WebSocket, message: Message) {
    const messageString = JSON.stringify(message);
    socket.send(messageString);
    console.log(`%c-> %c${socket.url}: ${messageString}`, 'color: #ee0000', 'color: inherit');
}

const SERVER_HOST = '127.0.0.1';
const SERVER_PORT = 8080;

/**
 * Crea un servidor HTTP en el puerto 8080 y maneja las conexiones WebSocket.
 */
Deno.serve({ hostname: SERVER_HOST, port: SERVER_PORT }, (req) => {
    if (req.headers.get('upgrade') != 'websocket') {
        return new Response(null, { status: 501 });
    }

    const { socket, response } = Deno.upgradeWebSocket(req);

    socket.addEventListener('open', () => {
        console.log('¡Un nuevo guerrero se ha unido!');
    });

    socket.addEventListener('message', (event) => {
        const message = JSON.parse(event.data);
        handleMessage(socket, message);
    });

    socket.addEventListener('close', () => {
        handleDisconnect(socket);
    });

    return response;
});

/**
 * Maneja un mensaje recibido a través de la conexión WebSocket.
 */
function handleMessage(socket: WebSocket, message: Message) {
    switch (message.type) {
        case 'createTeam':
            handleCreateTeam(socket);
            break;
        case 'joinTeam':
            handleJoinTeam(socket, message.battleId);
            break;
        case 'startBattle':
            handleStartBattle(socket, message.battleId);
            break;
        case 'attack':
            handleAttack(socket, message.battleId, message.attack);
            break;
        case 'leaveTeam':
            handleLeaveTeam(socket, message.battleId);
            break;
        default:
            sendMessage(socket, { type: 'error', message: 'Tipo de mensaje desconocido' });
    }
}

/**
 * Crea un nuevo equipo (batalla) y agrega al jugador como el primer participante.
 */
function handleCreateTeam(socket: WebSocket) {
    const battleId = generateBattleId();
    battles[battleId] = { id: battleId, participants: [socket], inProgress: false, round: 0 };
    sendMessage(socket, { type: 'teamCreated', battleId });
}

/**
 * Maneja el evento de unión a un equipo (batalla) existente.
 */
function handleJoinTeam(socket: WebSocket, battleId?: string) {
    if (!battleId) {
        socket.send(JSON.stringify({ type: 'error', message: 'No se especificó ningún ID de batalla...' }));
        return;
    }

    const battle = battles[battleId];
    if (!battle) {
        socket.send(JSON.stringify({ type: 'error', message: `No se encontró ninguna batalla con el ID "${battleId}"` }));
        return;
    }

    if (battle.participants.length >= 4) {
        socket.send(JSON.stringify({ type: 'error', message: 'El equipo ya está completo...' }));
        return;
    }

    battle.participants.push(socket);
    battle.participants.forEach((participant) => {
        if (participant !== socket) {
            sendMessage(participant, { type: 'participantJoined', battleId, participantCount: battle.participants.length });
        }
    });

    sendMessage(socket, { type: 'participantJoined', battleId, participantCount: battle.participants.length });
}

/**
 * Inicia la batalla si hay suficientes participantes.
 */
function handleStartBattle(socket: WebSocket, battleId?: string) {
    if (!battleId) {
        socket.send(JSON.stringify({ type: 'error', message: 'No se especificó ningún ID de batalla...' }));
        return;
    }

    const battle = battles[battleId];
    if (!battle) {
        socket.send(JSON.stringify({ type: 'error', message: `No se encontró ninguna batalla con el ID "${battleId}"` }));
        return;
    }

    if (battle.inProgress) {
        socket.send(JSON.stringify({ type: 'error', message: 'La batalla ya ha comenzado...' }));
        return;
    }

    if (battle.participants.length < 2) {
        socket.send(JSON.stringify({ type: 'error', message: 'No hay suficientes guerreros para comenzar la batalla...' }));
        return;
    }

    battle.inProgress = true;
    battle.participants.forEach((participant) => {
        sendMessage(participant, { type: 'battleStarted', battleId });
    });

    sendMessage(socket, { type: 'battleStarted', battleId });
}

/**
 * Realiza el ataque de un jugador y avanza al siguiente participante.
 */
function handleAttack(socket: WebSocket, battleId?: string, attack?: string) {
    if (!battleId) {
        sendMessage(socket, { type: 'error', message: 'No se especificó ningún ID de batalla...' });
        return;
    }

    const battle = battles[battleId];
    if (!battle) {
        sendMessage(socket, { type: 'error', message: `No se encontró ninguna batalla con el ID "${battleId}"` });
        return;
    }

    if (!battle.inProgress) {
        sendMessage(socket, { type: 'error', message: 'La batalla aún no ha comenzado...' });
        return;
    }

    if (battle.participants[battle.round] !== socket) {
        sendMessage(socket, { type: 'error', message: 'No es tu turno de ataque...' });
        return;
    }

    if (attack === undefined || attack === '') {
        sendMessage(socket, { type: 'error', message: '¡Debes especificar un ataque!' });
        return;
    }

    battle.participants.forEach((participant) => {
        sendMessage(participant, { type: 'attackPerformed', battleId, attack });
    });

    sendMessage(socket, { type: 'attackPerformed', battleId, attack });
    battle.round = (battle.round + 1) % battle.participants.length;
}

/**
 * Maneja el evento de que un jugador abandone un equipo (batalla).
 */
function handleLeaveTeam(socket: WebSocket, battleId?: string) {
    if (!battleId) {
        sendMessage(socket, { type: 'error', message: 'No se especificó ningún ID de batalla...' });
        return;
    }

    const battle = battles[battleId];
    if (!battle) {
        sendMessage(socket, { type: 'error', message: `No se encontró ninguna batalla con el ID "${battleId}"` });
        return;
    }

    battle.participants = battle.participants.filter((participant) => participant !== socket);

    if (battle.participants.length === 0) {
        delete battles[battleId];
    } else {
        battle.participants.forEach((participant) =>
            sendMessage(participant, { type: 'participantLeft', battleId, participantCount: battle.participants.length }),
        );
    }

    sendMessage(socket, { type: 'leftTeam', battleId });
}

/**
 * Maneja el evento de desconexión de un jugador.
 */
function handleDisconnect(socket: WebSocket) {
    for (const battleId in battles) {
        const battle = battles[battleId];
        if (battle.participants.includes(socket)) {
            handleLeaveTeam(socket, battleId);
            break;
        }
    }
}
