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

		// when connection is established, attempt to log in
		this.sockjs.onopen = function() {
			console.log("Comm: connection open: " + comm.sockjs.protocol); 
			comm.writeEvent('login', {token:comm.auth.token, session:comm.auth.session});
		}
		
		this.sockjs.onclose = function() {
			// not sure what to do about this yet!
			console.log('lost socket connection');
			alert('DRAT! Lost server connection - either server crashed or your internet did.  Please use the reload button to start over.')
		}
		
		// decode incoming messages in {type, data} style for dispatch
		this.sockjs.onmessage = function(e) {
			console.log("Comm: received " + e.data);
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
		if (type != 'ping') console.log("Comm: sending " + JSON.stringify({type:type, data:data}));
		this.sockjs.send(JSON.stringify({type:type, data:data}));
	}	
	

	sf.Comm = Comm;

}())
