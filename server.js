const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3000 });

const rooms = {}; // Ex: { sala1: Set([...sockets]), sala2: Set([...]) }
const clientRooms = new Map(); // Associa cada cliente à sua sala
const clientId = new Map();     //Associa cada cliente ao seu id

var count_sala = 0      //contador de criação de salas
var count_cliente = 0    //contador de criação de id dos clientes na sala
//const sala = new Map(); //Associa o cada sala a quantidade de clientes

//var sala_aberta = true;   //controlar a disponibilidade da sala atual

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
                if (Object.keys(rooms).length == 0)  {
                    count_sala ++;
                    rooms[count_sala] = new Set();  //caso contrario sera criada uma sala com o indice "1"
                }
                
                // Verifica se a sala room já existe no objeto rooms. 
                                          
                if  (count_cliente < 3) { //(rooms[count_sala].size < 3 ) {//&& sala_aberta) {     //se a sala estiver abaixo do limite

                    // Adiciona o WebSocket ws (a conexão do cliente) ao conjunto de clientes da sala. 
                    // Isso significa que o cliente agora "entrou" na sala.
                    count_cliente ++;
                    rooms[count_sala].add(ws);  //adicionar o cliente na sala atual
                                       
                    // clientRooms é um Map que associa cada cliente à sala que ele entrou.
                    // Isso é útil para Saber em que sala o cliente está.
                    // Enviar mensagens apenas para clientes da mesma sala.
                    // Remover o cliente da sala certa quando ele desconectar.
                    clientRooms.set(ws, count_sala);            // Mapeia a conexão ws com a sala room.
                    clientId.set(ws, rooms[count_sala].size)    // Mapeia a conexão ws com o id.
                } else {        //se a sala estiver cheia 
                    count_cliente = 0;

                    count_sala ++;  
                    rooms[count_sala] = new Set();              //cria uma nova sala
                    
                    count_cliente ++;
                    rooms[count_sala].add(ws);                  //adicionar o cliente na sala atual
                    
                    clientRooms.set(ws, count_sala);            // Mapeia a conexão ws para a sala room.
                    clientId.set(ws, count_cliente)    // Mapeia a conexão ws com o id.
                    //sala_aberta = true;     //abre a sala atual
                }

                console.log("Total de salas: " + Object.keys(rooms).length);    //depuração
                console.log("Sala atual: " + count_sala);                       //depuração
                console.log("Jogador: " + count_cliente);                       //depuração
                console.log("Total de jogadores: " + rooms[count_sala].size);   //depuração
               
                //envia para o cliente que acabou de entrar na sala
                ws.send(JSON.stringify({ event_name: 'Você foi criado!', id: count_cliente, sala: count_sala }));
                
                if (rooms[count_sala].size > 1) {   //se houver mais jogadores na sala atual
                                        
                    // Envia para todos da sala (exceto o remetente)
                    // Percorre todos os clientes CONECTADOS à sala especificada.
                    rooms[count_sala].forEach(client => {
                        if (client !== ws && client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({ event_name: 'Jogador na sala!', jogador: count_cliente, sala: count_sala}));
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

            case "iniciar_partida":
                //sala_aberta = false;    //fecha a sala atual
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
                        
        const room = clientRooms.get(ws);   //carrega o numero da sala do cliente que desconectou
        const id = clientId.get(ws);        //carrega o numero do cliente que desconectou        
        
        console.log("Sala: " + room);       //------------------depuracao
        console.log("Cliente: " + id);      //------------------depuracao
        
        if (room && rooms[room]) {  //verifica se esse numero está no rooms
            
            if (rooms[room].size > 1) {   //se houver mais jogadores na sala atual
                //envia pra todos os jogadores da sala que o cliente desconectou
                rooms[room].forEach(client => {
                                if (client !== ws && client.readyState === WebSocket.OPEN) {
                                    client.send(JSON.stringify({ event_name: 'Oponente saiu!', jogador: id}));
                                }
                })
            }

            rooms[room].delete(ws); // Deleta o cliente na sala
            
            if (room == count_sala && rooms[room].size == 0) count_cliente = 0;  //se a sala for atual e sair todos os clientes, zera o count_cliente

            console.log("Total de jogadores: " + rooms[room].size);         //-------------depuração
            
            if (rooms[room].size === 0) delete rooms[room]; // Se não existe cliente na sala, delete-a
            
            clientRooms.delete(ws);     //deleta o mapa do cliente com a sala
            clientId.delete(ws);        //deleta o mapa do cliente com o id
            
            if (Object.keys(rooms).length == 0) count_sala = 0; //reinicia o contador

            console.log("Total de salas: " + Object.keys(rooms).length);    //-----------depuração
            
        }

        
    });
    
});

