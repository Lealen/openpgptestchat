package chat

type Message struct {
	Author string `json:"author"`
	Body   string `json:"body"`
	Hash   string `json:"hash"`
}

func (self *Message) String() string {
	return self.Hash + ": " + self.Author + " says " + self.Body
}
