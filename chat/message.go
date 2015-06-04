package chat

const ServerMessageType = "servermessagetype"
const ChannelMessageType = "channelmessagetype"
const PrivateMessageType = "privatemessagetype"

type Message struct {
	Author string `json:"author"`
	Body   string `json:"body"`
	Hash   string `json:"hash"`
	Type   string `json:"type"`
}

func (self *Message) String() string {
	return self.Type + "@" + self.Hash + ": " + self.Author + " says " + self.Body
}
