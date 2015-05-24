define(
	"ChannelList",
	[
		"Channel"
	],
	function(Channel) {

		function ChannelList(ws) {
			var that = this;
			this.channels = ko.observableArray();
			this.newChannelHash = ko.observable("");

			//this.editingMessage = ko.observable(new Message());

			this.join = function(newhash) {
				$.each(that.channels(), function(k, v) {
					if(v.hash()==newhash) {
						newhash = "";
					}
				});
				if(!newhash) {
					return;
				}
				var newchannel = new Channel(ws, newhash);
				this.channels.push(newchannel);
				this.show(newhash);
				this.newChannelHash("");
				setTimeout(function(){resize();}(), 1000); //temporary
			};

			this.show = function(hash) {
				$.each(this.channels(), function(k, v) {
					if(v.hash()==hash) {
						v.visible(true);
					} else {
						v.visible(false);
					}
				});
			};

			ws.onmessage = function(e) {
				var model = $.evalJSON(e.data);
				console.log(model);
				var found = false;
				$.each(that.channels(), function(k, v) {
					if(v.hash()==model.hash) {
						v.onmessage(e);
						found = true
					}
				});

				if(!found) {
					//join channel
				}
			};
		}

		return ChannelList;
	}
);
