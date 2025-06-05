const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3000 });

const rooms = {}; // Ex: { sala1: Set([...sockets]), sala2: Set([...]) }
const clientRooms = new Map();  // Associa cada cliente à sua sala
const clientId = new Map();     //Associa cada cliente ao seu id
const liderRoom = new Map();    //Associa o id do lider à sua sala -


var count_sala = 0          //contador de criação de salas
var count_cliente = 0       //contador de criação de id dos clientes na sala

var sala_aberta = true;     //controlar a disponibilidade da sala atual

wss.on('connection', (ws) => {
    // código que deve ser executado logo após o jogador se conectar
    console.log("Um novo Player conectado!------------------------");
    
    // código que deve ser executado quando recebe mensagem do cliente
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
            case "create_player_request":           //criar sala aqui
                            
                //verifica se existe sala
                if (Object.keys(rooms).length == 0)  {
                    count_sala ++;                  //inicia o contador
                    rooms[count_sala] = new Set();  //caso contrario sera criada uma sala com o indice "1"
                    sala_aberta = true              //abre a sala
                }
                else if (!rooms[count_sala]) {      //se não existir room com o indice da room atual
                    rooms[count_sala] = new Set();  //cria uma nova sala
                    sala_aberta = true              //abre a sala
                    console.log("Sala recriada: " + count_sala);                       //-----------depuração
                }
                
                // Verifica se a sala room já existe no objeto rooms. 
                                          
                if  (rooms[count_sala].size < 5 && sala_aberta) { //(rooms[count_sala].size < 3 ) {//&& sala_aberta) {     //se a sala estiver abaixo do limite e aberta

                    // Adiciona o WebSocket ws (a conexão do cliente) ao conjunto de clientes da sala. 
                    // Isso significa que o cliente agora "entrou" na sala.
                    count_cliente ++;
                    rooms[count_sala].add(ws);  //adicionar o cliente na sala atual
                                       
                    // clientRooms é um Map que associa cada cliente à sala que ele entrou.
                    // Isso é útil para Saber em que sala o cliente está.
                    // Enviar mensagens apenas para clientes da mesma sala.
                    // Remover o cliente da sala certa quando ele desconectar.
                    clientRooms.set(ws, count_sala);            // Mapeia a conexão ws com a sala room.
                    clientId.set(ws, count_cliente)             // Mapeia a conexão ws com o id.
                
                } else {        //se a sala estiver cheia ou fechada
                    
                    count_cliente = 0;                          //zera o contador de clientes na sala

                    count_sala ++;                              //conta a  sala
                    rooms[count_sala] = new Set();              //cria uma nova sala
                    sala_aberta = true;                         //abre a sala atual
                    
                    count_cliente ++;
                    rooms[count_sala].add(ws);                  //adicionar o cliente na sala atual
                    
                    clientRooms.set(ws, count_sala);            // Mapeia a conexão ws para a sala room.
                    clientId.set(ws, count_cliente)             // Mapeia a conexão ws com o id.
                    
                }

                console.log("Total de salas: " + Object.keys(rooms).length);    //depuração
                console.log("Sala atual: " + count_sala);                       //depuração
                console.log("Jogador: " + count_cliente);                       //depuração
                console.log("Total de jogadores: " + rooms[count_sala].size);   //depuração
                               
                //envia para o cliente que acabou de entrar na sala
                ws.send(JSON.stringify({ event_name: 'Você foi criado!', jogador: count_cliente, sala: count_sala}));
                
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
            
            case "lider":
                room = clientRooms.get(ws);             //pega a sala do cliente em questao
                liderRoom.set(room, data_cliente.id)    //mapeia a sala com o id od lider
                lider = liderRoom.get(room);            //pega o id do lider da sala 'room'
                console.log("Líder atual: " + lider + " da sala " + room);         //depuração
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
                room = clientRooms.get(ws);
                
                //se a sala for a atual
                if (room == count_sala)  sala_aberta = false                 //fecha a sala
                
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
                        client.send(JSON.stringify({ event_name: 'Position update!', jogador: data_cliente.id, x: data_cliente.x, y: data_cliente.y, s:data_cliente.s}));
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
            case "morte":
                room = clientRooms.get(ws);
                                
                // Envia para todos da sala (exceto o remetente)
                // Percorre todos os clientes CONECTADOS à sala especificada.
                rooms[room].forEach(client => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ event_name: 'Morreu!', jogador: data_cliente.id}));
                    }
                })
                
                break;

            case "placar":
                room = clientRooms.get(ws);
                                
                // Envia para todos da sala (exceto o remetente)
                // Percorre todos os clientes CONECTADOS à sala especificada.
                rooms[room].forEach(client => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ event_name: 'Placar!', jogador: data_cliente.id, item: data_cliente.item}));
                    }
                })
                
                break;
            case "empate":
                room = clientRooms.get(ws);
                                
                // Envia para todos da sala (exceto o remetente)
                // Percorre todos os clientes CONECTADOS à sala especificada.
                rooms[room].forEach(client => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ event_name: 'Empate!', jogador: data_cliente.id}));
                    }
                })
                
                break;
            
            case "sair":    //situacao onde o cliente fica só na sala ou quando concluir o torneio
                console.log("Player desconectou!---------------------------------");
                        
                room = clientRooms.get(ws);     //carrega o numero da sala do cliente que desconectou
                id = clientId.get(ws);          //carrega o numero do cliente que desconectou        
                lider = liderRoom.get(room);    //pega o id do lider da sala 'room'  
                
                console.log("Sala: " + room);       //------------------depuracao
                console.log("Cliente: " + id);      //------------------depuracao
                
                
                if (room && rooms[room]) {  //verifica se esse numero está no rooms
                    
                    if (rooms[room].size > 1) {   //se houver mais jogadores na sala atual
                        
                        //envia pra todos os jogadores da sala que o cliente desconectou
                        rooms[room].forEach(client => {
                            if (client !== ws && client.readyState === WebSocket.OPEN) {
                                client.send(JSON.stringify({ event_name: 'Oponente saiu!', jogador: id}));
                                if (lider == id) {
                                    console.log("Líder que saiu: " + lider + " da sala: " + room);     //--------------*-*depuração
                                    client.send(JSON.stringify({ event_name: 'Novo lider!'}));  //envia a liderança para o primeiro da lista
                                    liderRoom.delete(room);     //deleta o mapa da sala com o id do lider
                                    lider = 0;                  //zera o lider
                                }
                            }
                        })
                    } else if (lider == id) {
                                    console.log("Líder " + lider + " saiu da sala: " + room);     //--------------*-*depuração
                                    liderRoom.delete(room);     //deleta o mapa da sala com o id do lider
                                    lider = 0;                  //zera o lider
                    }

                    rooms[room].delete(ws); // Deleta o cliente na sala
                
                    if (room == count_sala && rooms[room].size == 0) count_cliente = 0;  //se a sala for atual e sair todos os clientes, zera o count_cliente

                    console.log("Total de jogadores: " + rooms[room].size);             //-------------depuração
                    
                    if (rooms[room].size === 0) {
                        delete rooms[room];                                                 // Se não existe cliente na sala, delete-a
                        console.log("Sala eliminada: " + count_sala);                       //-----------depuração
                    }
                    
                    clientRooms.delete(ws);     //deleta o mapa do cliente com a sala
                    clientId.delete(ws);        //deleta o mapa do cliente com o id
                    
                    if (Object.keys(rooms).length == 0) count_sala = 0;     //se não houver sala reinicia o contador de salas

                    console.log("Total de salas: " + Object.keys(rooms).length);    //-----------depuração
                    console.log("Count sala: " + count_sala);                       //-----------depuração
                    
                }

                break

        }
    
    })

    // lidar com o que fazer quando os clientes se desconectam do servidor
    ws.on('close', () => {
        console.log("Player desconectou!---------------------------------");
                        
        room = clientRooms.get(ws);     //carrega o numero da sala do cliente que desconectou
        id = clientId.get(ws);          //carrega o numero do cliente que desconectou        
        lider = liderRoom.get(room);    //pega o id do lider da sala 'room'  
        
        console.log("Sala: " + room);       //------------------depuracao
        console.log("Cliente: " + id);      //------------------depuracao
        
        
        if (room && rooms[room]) {  //verifica se esse numero está no rooms
            
            if (rooms[room].size > 1) {   //se houver mais jogadores na sala atual
                
                //envia pra todos os jogadores da sala que o cliente desconectou
                rooms[room].forEach(client => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ event_name: 'Oponente saiu!', jogador: id}));
                        if (lider == id) {
                            console.log("Líder que saiu: " + lider + " da sala: " + room);     //--------------*-*depuração
                            client.send(JSON.stringify({ event_name: 'Novo lider!'}));  //envia a liderança para o primeiro da lista
                            liderRoom.delete(room);     //deleta o mapa da sala com o id do lider
                            lider = 0;                  //zera o lider
                        }
                    }
                })
            } else if (lider == id) {
                            console.log("Líder " + lider + " saiu da sala: " + room);     //--------------*-*depuração
                            liderRoom.delete(room);     //deleta o mapa da sala com o id do lider
                            lider = 0;                  //zera o lider
            }

            rooms[room].delete(ws); // Deleta o cliente na sala
           
            if (room == count_sala && rooms[room].size == 0) count_cliente = 0;  //se a sala for atual e sair todos os clientes, zera o count_cliente

            console.log("Total de jogadores: " + rooms[room].size);             //-------------depuração
            
            if (rooms[room].size === 0) {
                delete rooms[room];                                                 // Se não existe cliente na sala, delete-a
                console.log("Sala eliminada: " + count_sala);                       //-----------depuração
            }
            
            clientRooms.delete(ws);     //deleta o mapa do cliente com a sala
            clientId.delete(ws);        //deleta o mapa do cliente com o id
            
            if (Object.keys(rooms).length == 0) count_sala = 0;     //se não houver sala reinicia o contador de salas

            console.log("Total de salas: " + Object.keys(rooms).length);    //-----------depuração
            console.log("Count sala: " + count_sala);                       //-----------depuração
            
        }
    });
});

