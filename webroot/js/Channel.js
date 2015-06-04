define(
	"Channel",
	[
		"Message"
	],
	function(Message) {

		function Channel(ws, clientfingerprint, hash, type) {
			var that = this;
			this.clientfingerprint = clientfingerprint;
			this.type = ko.observable(type);
			this.hash = ko.observable(hash);
			this.messages = ko.observableArray();
			this.visible = ko.observable(false);

			this.locked = ko.observable(true);

			this.editingMessage = ko.observable(new Message());

			this.encryptkey = "";

			this.setencryptkey = function(encryptkey) {
				this.encryptkey = encryptkey;
				this.locked(false);
			};

			this.send = function() {
				//send
				var model = this.editingMessage().toModel();
				if(this.type()=="privatemessagetype") {
					
					model2 = this.editingMessage().toModel();
					model2.author = model2.author+"@"+this.clientfingerprint;
					that.messages.push(model2);

					model.hash = this.hash();
					model.type = this.type();
					openpgp.encryptMessage(this.encryptkey.keys, model.body).then(function(pgpMessage) {
						model.body = pgpMessage;
						console.log(model);
						ws.send($.toJSON(model));

						//clear
						var message = new Message();
						message.author(model.author);
						that.editingMessage(message);
					}).catch(function(error) {
						alert("SYSTEM MESSAGE: FAIL TO ENCRYPT MESSAGE:"+error);
					});
				} else { //TODO: encryption to channels
					model.hash = this.hash();
					model.type = this.type();
					console.log(model);
					ws.send($.toJSON(model));
				}
			};

/*			this.onmessage = function(e) {
				//read
				var model = $.evalJSON(e.data);
				console.log(model);
				var msg = new Message(model);
				this.messages.push(msg);
			};*/

			this.toModel = function() {
				return {
					hash: this.hash(),
					messages: this.messages(),
					editingMessage: this.editingMessage()
				};
			};
		}

		return Channel;
	}
);
