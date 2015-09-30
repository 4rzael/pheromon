'use strict';

var sixSenseDecoder = require('6sense/src/codec/decodeFromSMS.js');
var genericCodec = require('quipu/parser.js');
require('es6-shim');


function getDataType(data) {
	if (data.toString().match(/^net(NODATA|GPRS|EDGE|3G|H\/H+)$/))
		return 'network';
	else if (data.toString().match('init *'))
		return 'request';
	else if (data.toString().slice(0, 1) === '0')
		return 'message';
	else if (data.toString().slice(0, 1) === '1')
		return 'data';
	else if (data.toString().slice(0, 1) === '2')
		return 'status';
	else
		return 'other';
}

function printMsg(msg, sim) {
	return decode(msg)
	.then(function(decoded) {
		var type = getDataType(msg);
		switch (type) {
			case 'network':
				console.log('['+sim+']'+'[NETWORK]>' + decoded.toString());
				break;
			case 'request':
				console.log('['+sim+']'+'[REQUEST]>' + decoded.toString());
				break;
			case 'message':
				console.log('['+sim+']'+'[MESSAGE]>' + decoded.toString());
				break;
			case 'data':
				console.log('['+sim+']'+'[DATA]   >' + decoded.toString());
				break;
			case 'status':
				console.log('['+sim+']'+'[STATUS] >' + decoded.toString());
				break;
			default:
				console.log('['+sim+']'+'[OTHER]  >' + decoded.toString());
				break;
		}

		return {decoded: decoded.toString(), type: type};
	})    
	.catch(function(err){
        console.log('Error in printMsg ', err);
        throw err;
    });
}

// Decode any message received by SMS or TCP
function decode(message) {

	switch (message[0]) {
		case '0': // message : not encoded
			return Promise.resolve(message.slice(1));

		case '1': // data : 6sense_encoded
			return sixSenseDecoder(message.slice(1).toString())
				.then(function(decodedMessage){
					return(JSON.stringify(decodedMessage));
				})
				.catch(function(err){
					console.log('error in case 1 ', err);
					throw err;
				});

		case '2': // status : generic_encoded
			return genericCodec.decode(message.slice(1).toString())
				.then(function(decodedMessage){
					return(JSON.stringify(decodedMessage));
				})
				.catch(function(err){
					console.log('error in case 2 ', err);
					throw err;
				});
			
		default :
			return Promise.resolve(message); // not a message, data or status (can be a network, sim, etc...)
	}
}

module.exports = {printMsg: printMsg, decode: decode, getDataType: getDataType};
