
import express from 'express';
import body_parser from 'body-parser';
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const cors = require('cors');
const path = require('path');
const port = process.env.PORT || 4000;

import {
	CONNECTION,
	AVAILABLE_ROOM,
	CREATE_ROOM,
	JOIN,
	LEAVE,
	JOINED,
	LEFT,
	PLAYER_LIST,
	ERROR,
	START,
	END,
	IMAGE_CHANGE,
	BUTTON_RELEASE
} from './src/constant';


let current_players = [];
let count = 30;
let rooms = [];

//app use
app.use(body_parser.urlencoded({ extended: true }));
app.use(body_parser.json());
app.use(express.static(path.join(__dirname, 'src')));
app.use(cors());

http.listen(port, () => {
	console.log('listening on :', port);
});

io.on(CONNECTION, (socket) => {
	console.log(socket);

	//send list of available room asap
	io.emit(AVAILABLE_ROOM, rooms.slice());

	socket.on(CREATE_ROOM, (room_name) => {
		rooms.push(room_name);
		io.emit(AVAILABLE_ROOM, rooms.slice());
	})

	socket.on(JOIN, (player, room_name) => {
		//if player is already added then remove.
		const has = current_players.filter(x => x.name == player.name).length;
		if (has > 0) {
			socket.emit(ERROR, current_players.slice());
		} else {
			current_players.push(player);
			socket.join(room_name);
			socket.broadcast.emit(JOINED, `${player.name} has joined`);
			io.emit(PLAYER_LIST, current_players.slice())
		}
	});

	socket.on(LEAVE, (player, room_name) => {
		//if player is added then remove.
		const has = current_players.filter(x => x.name == player.name).length;
		if (has > 0) {
			current_players = current_players.filter(x => x.name != player.name).slice();
			socket.leave(room_name);
			socket.broadcast.emit(LEFT, `${player.name} has left`);
			io.emit(PLAYER_LIST, current_players.slice());
		} else {
			socket.emit(ERROR, current_players.slice());
		}
	});

	socket.on('start', () => {
		setTimeout(() => { }, 2000);
		setInterval(() => {
			if (count > 0) {
				const image_index = Math.floor((Math.random() * 100) + 1);
				io.emit(IMAGE_CHANGE, image_index);
			} else {
				io.emit(END, current_players.slice());
			}
			count = count - 1;
		}, 3000);
	});

	socket.on(BUTTON_RELEASE, (player) => {
		const index = current_players.findIndex(x => x.name == player.name);
		if (index > 0) {
			current_players[index].score = player.score;
		}
	});

});