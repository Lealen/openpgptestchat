define(
	"ChannelList",
	[
		"Channel",
		"Message"
	],
	function(Channel, Message) {

		function ChannelList(ws) {
			var that = this;
			this.channels = ko.observableArray();
			this.newChannelType = ko.observable("channelmessagetype");
			this.newChannelHash = ko.observable("");
			this.loggedin = ko.observable(false);

			this.fingerprint = ko.observable("");
			this.publickey = "";
			this.privatekey = "";

			//this.editingMessage = ko.observable(new Message());

			this.connect = function() { //get keys from user
				var pub = $('#publickeyfile').prop('files');
				if(!pub.length) {
					return;
				}
				pub = pub[0];
				var priv = $('#privatekeyfile').prop('files');
				if(!priv.length) {
					return;
				}
				priv = priv[0];

				var readerpub = new FileReader();
				readerpub.onload = function(e) {
					that.publickey = openpgp.key.readArmored(e.target.result);
					that.fingerprint(that.publickey.keys[0].primaryKey.fingerprint);
					var model = new Message();
					model.body = e.target.result;
					model.hash = "setpublickey";
					model.type = "servermessagetype";
					ws.send($.toJSON(model));
					that.loggedin(true);
				};
				readerpub.readAsText(pub);

				var readerpriv = new FileReader();
				readerpriv.onload = function(e) {
					that.privatekey = openpgp.key.readArmored(e.target.result).keys[0];
					that.privatekey.decrypt($('#passphrate').val());
				};
				readerpriv.readAsText(priv);
			};

			this.join = function(newhash, newchanneltype) {
				$.each(that.channels(), function(k, v) {
					if(v.hash()==newhash) {
						newhash = "";
					}
				});
				if(!newhash) {
					return;
				}
				var newchannel = new Channel(ws, this.fingerprint(), newhash, newchanneltype);
				this.channels.push(newchannel);

				if(newchanneltype=="privatemessagetype") {
					//ask for publickey
					var model = new Message();
					model.body = newhash;
					model.hash = "getpublickey";
					model.type = "servermessagetype";
					ws.send($.toJSON(model));
				} else {
					var model = new Message();
					model.body = newhash;
					model.hash = "join";
					model.type = "servermessagetype";
					ws.send($.toJSON(model));

					$.each(this.channels(), function(k, v) {
						if(v.hash()==newhash) {
							v.locked(false);
						}
					});
				}

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

				if(model.type=="servermessagetype" && model.hash=="getpublickey") { //get somebody public key
					var key = openpgp.key.readArmored(model.body);
					var hash = key.keys[0].primaryKey.fingerprint;

					var found = false;
					$.each(that.channels(), function(k, v) {
						if(v.hash()==hash) {
							v.setencryptkey(key);
						}
					});
				} else {
					var msg = new Message(model);
					if(model.type=="privatemessagetype") {
						var mes = openpgp.message.readArmored(msg.body());
						msg.body(mes.decrypt(that.privatekey).getText());
					} //TODO: channels encryption

					var found = false;
					$.each(that.channels(), function(k, v) {
						if(v.hash()==model.hash && v.type()==model.type) {
							v.messages.push(msg);
							found = true
						}
					});

					if(!found) { //join channel
						that.join(model.hash, model.type);
						$.each(that.channels(), function(k, v) {
							if(v.hash()==model.hash && v.type()==model.type) {
								v.messages.push(msg);
								found = true;
							}
						});
					}

				}
			};
		}

		return ChannelList;
	}
);
