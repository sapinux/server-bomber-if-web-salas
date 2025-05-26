const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3000 });

const rooms = {}; // Ex: { sala1: Set([...sockets]), sala2: Set([...]) }
const clientRooms = new Map(); // Associa cada cliente à sua sala

wss.on('connection', (ws) => {
    // código que deve ser executado logo após o jogador se conectar
    console.log("Um novo Player conectado!");
    
    ws.on('message', (data) => {
        console.log(`O cliente nos enviou: ${data}`);
        let data_cliente;
        
        try {
            data_cliente = JSON.parse(data);
        } catch (e) {
            console.log('Mensagem inválida:', data);
            return;
        }
        
        switch (data_cliente.event_name) {
            case "create_player_request":   //criar sala aqui
                            
                //verifica se existe sala
                if (Object.keys(rooms).length == 0)  rooms[1] = new Set();  //caso contrario sera criada uma com o indice "1"
                
                // Verifica se a sala room já existe no objeto rooms. 
                                          
                if (rooms[Object.keys(rooms).length].size < 3) {     //se a sala estiver abaixo do limite

                    // Adiciona o WebSocket ws (a conexão do cliente) ao conjunto de clientes da sala. 
                    // Isso significa que o cliente agora "entrou" na sala.
                    rooms[Object.keys(rooms).length].add(ws);
                                       
                    // clientRooms é um Map que associa cada cliente à sala que ele entrou.
                    // Isso é útil para Saber em que sala o cliente está.
                    // Enviar mensagens apenas para clientes da mesma sala.
                    // Remover o cliente da sala certa quando ele desconectar.
                    clientRooms.set(ws, Object.keys(rooms).length);  // Mapeia a conexão ws com a sala room.
                } else {    
                    rooms[Object.keys(rooms).length + 1] = new Set(); 
                    rooms[Object.keys(rooms).length].add(ws);
                    clientRooms.set(ws, Object.keys(rooms).length);  // Mapeia a conexão ws para a sala room.
                }

                console.log("Total de salas: " + Object.keys(rooms).length);                    //depuração
                console.log("Total de jogadores: " + rooms[Object.keys(rooms).length].size);    //depuração
               
                ws.send(JSON.stringify({ event_name: 'Você foi criado!', id: rooms[Object.keys(rooms).length].size, sala: Object.keys(rooms).length }));
                if (rooms[Object.keys(rooms).length].size > 1) {
                    const room = clientRooms.get(ws);

                    // Envia para todos da sala (exceto o remetente)
                    // Percorre todos os clientes CONECTADOS à sala especificada.
                    rooms[room].forEach(client => {
                        if (client !== ws && client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({ event_name: 'Jogador na sala!', sala: room, jogador: rooms[Object.keys(rooms).length].size}));
                        }
                    })
                }

                break;
            case "Create oponente":
                room = clientRooms.get(ws);

                    // Envia para todos da sala (exceto o remetente)
                    // Percorre todos os clientes CONECTADOS à sala especificada.
                    rooms[room].forEach(client => {
                        if (client !== ws && client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({ event_name: 'Oponente criado!', sala: room, jogador: data_cliente.id}));
                        }
                    })

                break;
            case "position_update":
                room = clientRooms.get(ws);
                    
                    // Envia para todos da sala (exceto o remetente)
                    // Percorre todos os clientes CONECTADOS à sala especificada.
                    rooms[room].forEach(client => {
                        if (client !== ws && client.readyState === WebSocket.OPEN) {
                            if ("x" in data_cliente) client.send(JSON.stringify({ event_name: 'Position update!', x: data_cliente.x, jogador: data_cliente.id}));
                            if ("y" in data_cliente) client.send(JSON.stringify({ event_name: 'Position update!', y: data_cliente.y, jogador: data_cliente.id}));
                        }
                    })

                break;
            case "iniciar_partida":
                room = clientRooms.get(ws);
                        // Envia para todos da sala (exceto o remetente)
                        // Percorre todos os clientes CONECTADOS à sala especificada.
                        rooms[room].forEach(client => {
                            if (client !== ws && client.readyState === WebSocket.OPEN) {
                                client.send(JSON.stringify({ event_name: 'Iniciar partida!'})); //avisa os jogadores para iniciar a partida
                            }
                        })
                break;
            case "jogador_escolhido":
                room = clientRooms.get(ws);
                        // Envia para todos da sala (exceto o remetente)
                        // Percorre todos os clientes CONECTADOS à sala especificada.
                        rooms[room].forEach(client => {
                            if (client !== ws && client.readyState === WebSocket.OPEN) {
                                client.send(JSON.stringify({ event_name: 'Jogador escolhido!', item: data_cliente.item, jogador: data_cliente.id})); //avisa os jogadores para iniciar a partida
                            }
                        })
                break;
            case "create_bomba":
                room = clientRooms.get(ws);
                    
                    if ("item" in data_cliente) {
                        // Envia para todos da sala (exceto o remetente)
                        // Percorre todos os clientes CONECTADOS à sala especificada.
                        rooms[room].forEach(client => {
                            if (client !== ws && client.readyState === WebSocket.OPEN) {
                                client.send(JSON.stringify({ event_name: 'Create bomba!', item: data_cliente.item, jogador: data_cliente.id, poder_bomba: data_cliente.poder_bomba}));
                            }
                        })
                    }

                break;
            case "chutar_bomba":
                room = clientRooms.get(ws);
                    if ("x" in data_cliente) {
                        // Envia para todos da sala (exceto o remetente)
                        // Percorre todos os clientes CONECTADOS à sala especificada.
                        rooms[room].forEach(client => {
                            if (client !== ws && client.readyState === WebSocket.OPEN) {
                               client.send(JSON.stringify({ event_name: 'Chutar bomba!', x: data_cliente.x, jogador: data_cliente.id}));
                            }
                        })
                    }

                    if ("y" in data_cliente) {
                        // Envia para todos da sala (exceto o remetente)
                        // Percorre todos os clientes CONECTADOS à sala especificada.
                        rooms[room].forEach(client => {
                            if (client !== ws && client.readyState === WebSocket.OPEN) {
                                client.send(JSON.stringify({ event_name: 'Chutar bomba!', y: data_cliente.y, jogador: data_cliente.id}));
                            }
                        })
                    }

                break;
            case "lancar_bomba":
                room = clientRooms.get(ws);
                    
                    if ("item" in data_cliente) {
                        // Envia para todos da sala (exceto o remetente)
                        // Percorre todos os clientes CONECTADOS à sala especificada.
                        rooms[room].forEach(client => {
                            if (client !== ws && client.readyState === WebSocket.OPEN) {
                             client.send(JSON.stringify({ event_name: 'Lancar bomba!', item: data_cliente.item, jogador: data_cliente.id, direcao: data_cliente.direcao}));
                            }
                        })
                    }

                break;
             case "create_bonus":
                room = clientRooms.get(ws);

                if ("item" in data_cliente) {
                        // Envia para todos da sala (exceto o remetente)
                        // Percorre todos os clientes CONECTADOS à sala especificada.
                        rooms[room].forEach(client => {
                            if (client !== ws && client.readyState === WebSocket.OPEN) {
                             client.send(JSON.stringify({ event_name: 'Create bonus!', item: data_cliente.item, jogador: data_cliente.id, x: data_cliente.x, y: data_cliente.y}));
                            }
                        })
                    }

                break;
        }

        

        

    })

    // lidar com o que fazer quando os clientes se desconectam do servidor
    ws.on('close', () => {
        console.log("Player desconectou!");
        
        
        
        const room = clientRooms.get(ws);
        
        
        console.log("sala: " + room);
        if (room && rooms[room]) {
            rooms[room].delete(ws); // Deleta o cliente na sala
            
            
            
            console.log("Total de jogadores: " + rooms[room].size);         //depuração
            
            if (rooms[room].size === 0) delete rooms[room]; // Se não existe cliente na sala, delete-a
            clientRooms.delete(ws);
            
            console.log("Total de salas: " + Object.keys(rooms).length);    //depuração
            
        }

        
    });
    
});

