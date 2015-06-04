define(
	"main",
	[
		"ChannelList"
	],
	function(ChannelList) {
		var that = this;

		var ws = new WebSocket("ws://" + location.hostname + ":8080/entry");
		var list = new ChannelList(ws);
		ko.applyBindings(list);
	}
);

function resize() {
	$(".messages").each(function() {
		$(this).css("height", $(window).height()-50-250);
	});
}

$(window).on('resize', function(){
	resize();
});
