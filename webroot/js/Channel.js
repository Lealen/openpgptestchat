define(
	"Channel",
	[
		"Message"
	],
	function(Message) {

		function Channel(ws, hash) {
			var that = this;
			this.hash = ko.observable(hash);
			this.messages = ko.observableArray();

			this.editingMessage = ko.observable(new Message());

			this.send = function() {
				//send
				var model = this.editingMessage().toModel();
				model.hash = hash;
				console.log(model);
				ws.send($.toJSON(model));

				//clear
				var message = new Message();
				message.author(model.author);
				this.editingMessage(message);

			};

			this.onmessage = function(e) {
				//read
				var model = $.evalJSON(e.data);
				console.log(model);
				var msg = new Message(model);
				this.messages.push(msg);
			};

			this.toModel = function() {
				return {
					hash: this.hash(),
					messages: this.messages(),
					editingMessage: this.editingMessage()
				};
			}
		}

		return Channel;
	}
);
