// Comm handles socket stuff and inherits from EventDispatcher

// namespace:
this.sf = this.sf||{};

(function() {

var Comm = function(SockJS, auth) {
  this.initialize(SockJS, auth);
}

var p = Comm.prototype;
	
	createjs.EventDispatcher.initialize(p); // inject EventDispatcher methods.
		
	// initialize with the SockJS library and auth = {token, session, endpoint}
	p.initialize = function(SockJS, auth) {
		
		comm = this;
		
		this.auth = auth;
		this.sockjs = new SockJS(auth.endpoint);
		
		this.logging = false;

		// when connection is established, attempt to log in
		this.sockjs.onopen = function() {
			if (this.logging) console.log("Comm: connection open: " + comm.sockjs.protocol); 
			comm.writeEvent('login', {token:comm.auth.token, session:comm.auth.session});
		}
		
		this.sockjs.onclose = function() {
			if (this.logging) console.log('lost socket connection');
			comm.dispatchEvent('disconnect');
		}
		
		// decode incoming messages in {type, data} style for dispatch
		this.sockjs.onmessage = function(e) {
			if (this.logging) console.log("Comm: received " + e.data);
			var message;
			try {
				message = JSON.parse(e.data);
			}
			catch (err) {
				// ignore messages that can't be parsed
			}
			if (message && message.type && (typeof message.type) === 'string') {
				comm.dispatchEvent(message);
			}
		}
		
		
	}


	// encode {type, data} style messages and transmit 
	p.writeEvent = function(type, data) {
		if (type != 'ping') if (this.logging) console.log("Comm: sending " + JSON.stringify({type:type, data:data}));
		this.sockjs.send(JSON.stringify({type:type, data:data}));
	}	
	

	sf.Comm = Comm;

}())
