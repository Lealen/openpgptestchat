package chat

import (
	"bytes"
	"encoding/hex"
	"fmt"
	"io"
	"log"

	"golang.org/x/crypto/openpgp"
	"golang.org/x/net/websocket"
)

const channelBufSize = 100

var maxId int = 0

// Chat client.
type Client struct {
	id          int
	ws          *websocket.Conn
	server      *Server
	ch          chan *Message
	doneCh      chan bool
	publickey   string
	fingerprint string
	channels    []string
}

// Create new chat client.
func NewClient(ws *websocket.Conn, server *Server) *Client {

	if ws == nil {
		panic("ws cannot be nil")
	}

	if server == nil {
		panic("server cannot be nil")
	}

	maxId++
	ch := make(chan *Message, channelBufSize)
	doneCh := make(chan bool)

	return &Client{maxId, ws, server, ch, doneCh, "", "", []string{}}
}

func (c *Client) Conn() *websocket.Conn {
	return c.ws
}

func (c *Client) Write(msg *Message) {
	select {
	case c.ch <- msg:
	default:
		c.server.Del(c)
		err := fmt.Errorf("client %d is disconnected.", c.id)
		c.server.Err(err)
	}
}

func (c *Client) Done() {
	c.doneCh <- true
}

// Listen Write and Read request via chanel
func (c *Client) Listen() {
	go c.listenWrite()
	c.listenRead()
}

// Listen write request via chanel
func (c *Client) listenWrite() {
	log.Println("Listening write to client")
	for {
		select {

		// send message to the client
		case msg := <-c.ch:
			log.Println("Send:", msg)
			websocket.JSON.Send(c.ws, msg)

		// receive done request
		case <-c.doneCh:
			c.server.Del(c)
			c.doneCh <- true // for listenRead method
			return
		}
	}
}

// Listen read request via chanel
func (c *Client) listenRead() {
	log.Println("Listening read from client")
	for {
		select {

		// receive done request
		case <-c.doneCh:
			c.server.Del(c)
			c.doneCh <- true // for listenWrite method
			return

		// read data from websocket connection
		default:
			var msg Message
			err := websocket.JSON.Receive(c.ws, &msg)
			if err == io.EOF {
				c.doneCh <- true
			} else if err != nil {
				c.server.Err(err)
			} else if msg.Type == ServerMessageType {
				if msg.Hash == "setpublickey" { // set your public key
					c.publickey = msg.Body //TODO: check key
					entitylist, err := openpgp.ReadArmoredKeyRing(bytes.NewBufferString(msg.Body))
					if err != nil {
						log.Println(err)
					} else {
						log.Println("Set key:", hex.EncodeToString(entitylist[0].PrimaryKey.Fingerprint[:]))
						c.fingerprint = hex.EncodeToString(entitylist[0].PrimaryKey.Fingerprint[:])
					}
				} else if msg.Hash == "getpublickey" { // get somebody public key
					log.Println("Asked for key:", msg.Body)
					for k := range c.server.clients {
						if c.server.clients[k].fingerprint == msg.Body {
							log.Println("Send key:", msg.Body)
							c.Write(&Message{"", c.server.clients[k].publickey, "getpublickey", ServerMessageType})
						}
					}
				} else if msg.Hash == "join" { // join channel
					log.Println("Client "+c.fingerprint+" join:", msg.Body)
					c.channels = append(c.channels, msg.Body)
				} else if msg.Hash == "leave" { // exit channel
					log.Println("Client "+c.fingerprint+" leave:", msg.Body)
					for k := range c.channels {
						if c.channels[k] == msg.Body {
							c.channels = append(c.channels[:k], c.channels[k+1:]...)
						}
					}
				}
			} else if msg.Type == ChannelMessageType {
				c.server.sendChannel(&msg, c)
			} else if msg.Type == PrivateMessageType {
				c.server.sendPrivate(&msg, c)
			} else {
				log.Println("Type not found: " + msg.Type)
			}

			/*
				else  else {
					c.server.SendAll(&msg)
				}*/
		}
	}
}
