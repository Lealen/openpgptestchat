define(
	"ChannelList",
	[
      "Channel"
	],
	function(Channel) {

		function ChannelList(ws) {
			var that = this;
			this.channels = ko.observableArray();

			//this.editingMessage = ko.observable(new Message());

			this.join = function(ws, hash) {
            this.channels.push(new Channel(ws, hash));
			};

			ws.onmessage = function(e) {
            var model = $.evalJSON(e.data);
            console.log(model);
				$.each(that.channels(), function(k, v) {
               if(v.hash()==model.hash) {
                  v.onmessage(e);
               }
            });
			};
		}

		return ChannelList;
	}
);
