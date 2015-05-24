define(
	"MessageList",
	[
		"Message"
	],
	function(Message) {

		function MessageList(ws) {
			var that = this;
			this.messages = ko.observableArray();

			this.editingMessage = ko.observable(new Message());

			this.send = function() {
				//send
				var model = this.editingMessage().toModel();
				console.log(model);
				ws.send($.toJSON(model));

				//clear
				var message = new Message();
				message.author(model.author);
				this.editingMessage(message);

			};

			this.message = function(e) {
				//read
				var model = $.evalJSON(e.data);
				console.log(model);
				var msg = new Message(model);
				this.messages.push(message);
			};
		}

		return MessageList;
	}
);
