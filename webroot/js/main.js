define(
	"main",
	[
		"ChannelList"
	],
	function(ChannelList) {
		var ws = new WebSocket("ws://localhost:8080/entry");
		var list = new ChannelList(ws);
		ko.applyBindings(list);

		list.join(ws, "1")
		list.join(ws, "2")
	}
);
