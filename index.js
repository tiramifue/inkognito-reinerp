"use strict"
/////Network Config/////
const port = 3000
    /////Network Config/////

const moment = require("moment")
const express = require("express")
const app = express()
const fs = require("fs");
const crypto = require("crypto");
app.use(express.static("public"));

let server = require("http").Server(app)
let io = require("socket.io")(server, {
    pingTimeout: 50000
})

let lobbys = []

const ultradefaultcardpack = {
    ncolors: ["yellow", "red", "green", "blue", "black"],
    scolors: ["block", "+2", "reverse", "cswitch", "+4"],
    probnormal: 10,
    probblock: 20,
    probreverse: 10,
    probcolor: 20,
    probp2: 20,
    probp4: 20,
    grustack: true,
    grumustplay: true,
    grudrawtillok: true,
    thinktime: 20000,
    startcards: 10,
    punishmentcards: 2
}

const ultradefaultlobby = {
    howmany: 10,
    maxplayers: 10,
    maxchatmsg: 20,
    maxplayername: 20
}

write("cardpacks", "default", ultradefaultcardpack, false)
let defaultcards = read("cardpacks", "default")


write("lobbys", "default", ultradefaultlobby, false)
let defaultlobby = read("lobbys", "default")


class Cardpack {
    constructor(colors, spec, pnormal, pblock, preverse, pcolor, pp2, pp4, stack, mustplay, drawtillok, thinktime, startcards, punishmentcards) {
        //Probability must be 100
        this._colors = colors
        this._spec = spec
        this._normal = pnormal
        this._block = pblock
        this._reverse = preverse
        this._color = pcolor
        this._p2 = pp2
        this._p4 = pp4
        this._startcards = startcards
        this._punishmentcards = punishmentcards
        this._url = new Map()
        for (let i = 0; i < 10; i++)
            for (let a = 0; a < colors.length; a++) this.geturl.set(`${colors[a]}-${i}`, `/game/img/${colors[a]}-${i}.png`); //creation of all colors from 0-9
        for (let i = 0; i < spec.length; i++)
            for (let a = 0; a < colors.length; a++) this.geturl.set(`${colors[a]}-${spec[i]}`, `/game/img/${colors[a]}-${spec[i]}.png`); //creation of all special cards that have a color
        //    for (let i = 0; i < speccol.length; i++) this.geturl.set(speccol[i], `/game/img/${speccol[i]}.png`); //creation of all special colors
        this._url = JSON.stringify(Array.from(this._url));

        //Gamerules
        this._stack = stack
        this._mustplay = mustplay
        this._drawtillok = drawtillok
        this._thinktime = thinktime
    }

    get getmaxplayers() { return this._maxplayers }
    get getcolors() { return this._colors }
    get getnormal() { return this._normal }
    get getblock() { return this._block }
    get getreverse() { return this._reverse }
    get getcolor() { return this._color }
    get getp2() { return this._p2 }
    get getp4() { return this._p4 }
    get geturl() { return this._url }
    get getstack() { return this._stack }
    get getmustplay() { return this._mustplay }
    get getdrawtillok() { return this._drawtillok }
    get getthinktime() { return this._thinktime }
    get getpunishmentcards() { return this._punishmentcards }
    get getstartcards() { return this._startcards }
}

let defaultcardpack = new Cardpack(defaultcards.ncolors, defaultcards.scolors, defaultcards.probnormal, defaultcards.probblock, defaultcards.probreverse, defaultcards.probcolor, defaultcards.probp2, defaultcards.probp4, defaultcards.grustack, defaultcards.grumustplay, defaultcards.grudrawtillok, defaultcards.thinktime, defaultcards.startcards, defaultcards.punishmentcards)

class Card {
    constructor(cardpack, start) {
        let type = Math.floor(Math.random() * Math.floor(100))
        let number = Math.floor(Math.random() * Math.floor(10))
        let color = Math.floor(Math.random() * Math.floor(4))
        this.cardpack = cardpack

        if (start) {
            type = cardpack.getp4 + cardpack.getp2 + cardpack.getcolor + cardpack.getblock + cardpack.getreverse + cardpack.getnormal
        }

        if (type < cardpack.getp4) {
            this.value = "+4"
            this.color = cardpack.getcolors[4]
            this.type = "p4"
        } else if (type < cardpack.getp4 + cardpack.getp2) {
            this.value = "+2"
            this.color = cardpack.getcolors[color]
            this.type = "p2"
        } else if (type < cardpack.getp4 + cardpack.getp2 + cardpack.getcolor) {
            this.value = "cswitch"
            this.color = cardpack.getcolors[4]
            this.type = "color"
        } else if (type < cardpack.getp4 + cardpack.getp2 + cardpack.getcolor + cardpack.getblock) {
            this.value = "Block"
            this.color = cardpack.getcolors[color]
            this.type = "block"
        } else if (type < cardpack.getp4 + cardpack.getp2 + cardpack.getcolor + cardpack.getblock + cardpack.getreverse) {
            this.value = "Reverse"
            this.color = cardpack.getcolors[color]
            this.type = "reverse"
        } else if (type <= cardpack.getp4 + cardpack.getp2 + cardpack.getcolor + cardpack.getblock + cardpack.getreverse + cardpack.getnormal) {
            this.value = String(number);
            this.color = cardpack.getcolors[color]
            this.type = "normal"
        }
    }
}

class Player {
    constructor(socketid, username, lobby, lobbyid, cardpack) {
        this._username = username
        this._socketid = socketid
        this._lobbyid = lobbyid
        this._lobby = +lobby
        this._cards = []
        this._uno = false
        this._ready = false
        this._cardpack = cardpack

        for (let i = 0; i < cardpack.getstartcards; i++) {
            this._cards.push(new Card(cardpack))
        }
    }
    get getlobbyid() { return this._lobbyid }
    get getcards() { return this._cards }
    get getlobby() { return this._lobby }
    get getsocketid() { return this._socketid }
    get getready() { return this._ready }
    get getusername() { return this._username }
    get getcardslength() { return this._cards.length }
    get getcardpack() { return this._cardpack }
    get getready() { return this._ready }
    get getuno() { return this._uno }
    set uno(bool) { this._uno = bool }
    set setready(bool) { this._ready = bool }

    pushcards(howmany) {
        for (let i = 0; i < howmany; i++) {
            this._cards.push(new Card(this.getcardpack))
        }
    }

    getcard(cardnum) {
        if (typeof(cardnum) === "number") {
            return this._cards[cardnum]
        }
    }
}

class Lobby {
    constructor(name, lobbyid, cardpack, maxplayers, maxchatmsglength, maxplayernamelength) {
        this._name = name
        this._lobbyid = lobbyid
        this._cardpack = cardpack
        this._currentplayer = 0
        this._status = false //False Waiting, True Running
        this._playdirection = true //False Backwards, True Forwards
        this._players = new Map()
        this._chat = []
        this._currentcard = new Card(cardpack, true)
        this._ready = 0
        this._tempstack = 0
        this._latestcard
        this._plays = 0
        this._maxplayers = maxplayers
        this._maxchatmsglength = maxchatmsglength
        this._maxplayernamelength = maxplayernamelength
    }

    get getplayervalues() { return [...this._players.values()] }
    get getmaxplayers() { return this._maxplayers }
    get getmaxplayernamelength() { return this._maxplayernamelength }
    get getmaxchatmsglength() { return this._maxchatmsglength }
    get getplays() { return this._plays }
    get getchat() { return this._chat }
    get getcurrentcard() { return this._currentcard }
    get getplayersizenum() { return this._players.size }
    get getcurrentplayer() { return this._currentplayer }
    get getname() { return this._name }
    get getstatus() { return this._status }
    get getplayersize() { return `${this._players.size} / ${this._maxplayers}` }
    get getcardpack() { return this._cardpack }
    get getdirection() { return this._playdirection }
    get getplayers() { return this._players }
    get getlobbyid() { return this._lobbyid }
    get getlobbyready() { return this._ready }
    get getplaydirection() { return this._playdirection }
    get gettempstack() { return this._tempstack }
    get getlatestcard() { return this._latestcard }
    set plays(num) { this._plays = num }
    set tempstack(num) { this._tempstack = num }
    set currentplayer(num) { this._currentplayer = num }
    set currentcard(card) { this._currentcard = card }
    set playdirection(direc) { this._playdirection = direc }
    set latestcard(num) { this._latestcard = num }
    get getplayerinfo() {
        let temparr = [];
        [...this.getplayers.values()].forEach(a => {
            temparr.push({ name: a.getusername, ready: a.getready, cards: a.getcardslength, socketid: a.getsocketid })
        })
        return temparr
    }

    broadcastmsg(type, what) {
        this.getplayers.forEach(element => {
            io.to(element.getsocketid).emit(type, what)
        })
    }

    broadcastusers() {
        let tempobject = {
            players: this.getplayerinfo,
            gamestatus: this.getstatus,
            direction: this.getplaydirection,
            currentplayer: this.getcurrentplayer
        }
        this.broadcastmsg("recuser", tempobject)
    }

    adduser(socketid, username, lobby) {
        if (this.getmaxplayers + 1 > this.getplayers.size) {
            this.getplayers.set(socketid, new Player(socketid, username, lobby, this.getlobbyid, this.getcardpack))
            if (this.getplayers.size > 1) {
                this.broadcastmsg("enoughplayers", true)
            }
        }
        this.addchatmsg(username, `\xa0<a class="font-weight-bold text-white-50">${username}</a>\xa0\xa0<a class="font-italic text-white-50">joined the game</a>`, "sys")
        this.broadcastusers()
    }

    removeuser(socketid) {
        let user = this._players.get(socketid)
        if (this.iscurrent(user.getsocketid)) {
            this.next(1)
        }
        this.addchatmsg(user.getusername, `\xa0<a class="font-weight-bold text-white-50">${user.getusername}</a>\xa0\xa0<a class="font-italic text-white-50">left the game</a>`, "sys")
        this.getplayers.delete(socketid)
        if (this.getstatus) {
            if (this.getplayers.size < 2) {
                this.exit(this.getlobbyid, false)
            }
        } else {
            if (this.getplayers.size < 1) {
                this.broadcastmsg("enoughplayers", false)
            }
        }
        this.broadcastusers()
    }

    ready(socketid, bool) {
        let players = this.getplayervalues
        let player = this.getplayers.get(socketid)

        player.setready = bool
        bool ? this._ready++ : this._ready--

            if (this.getplayers.size <= this.getlobbyready * 1.66) {
                this._status = true
                this.addchatmsg(player.getusername, `\xa0<a class="font-weight-bold text-red">Game starts</a>`, "sys")
                this.broadcastmsg("enoughplayers", false)
                this.sendcards("all")
                this.sendcurrentcard()
                io.to(players[0].getsocketid).emit("turn", this.getcardpack.getthinktime, true)
                this.tick(this.getcardpack.getthinktime, this.getplays)
            }
        this.broadcastusers()
    }

    sendcards(who) {
        if (who === "all") {
            this.getplayers.forEach(element => {
                io.to(element.getsocketid).emit("cards", element.getcards, this.getcardpack.geturl)
            })
        } else {
            io.to(who).emit("cards", this.getplayers.get(who).getcards, this.getcardpack.geturl)
        }
    }

    sendcurrentcard() {
        this.getplayers.forEach(element => {
            io.to(element.getsocketid).emit("currentcard", this.getcurrentcard, this.getcardpack.geturl)
        })
    }

    addchatmsg(username, string1, type) {
            let time = moment().format("HH:mm:ss")
            let message = `<a class="font-sm font-weight-light">[${time}]</a> <a class="font-weight-bold">${type == "user" ? `${username}:\xa0` : "<a class='font-italic text-white-50'>>>></a>"}</a> <a class="font-weight-light">${string1}</a>` //Expected output: [time] username?>>> message             ? means or
    this._chat.push(message)

    //Update Chat on Clients
    this.broadcastmsg("recchat", this.getchat)
  }

  next(steps) {
    let current = this.getcurrentplayer
    let size = this.getplayersizenum
    let players = this.getplayervalues
    this.sendcards(players[current].getsocketid)
    this.sendcurrentcard()

    if (this.getdirection) {
      if (steps === 2) {
        if (current === size - 2) {
          this.currentplayer = 0;
        } else if (current === size - 1) {
          this.currentplayer = 1;
        } else {
          this.currentplayer = current + 2;
        }
      } else if (steps === 1) {
        current + 1 === size ? this.currentplayer = 0 : this.currentplayer = current + 1;
      }
    } else {
      if (steps === 2) {
        if (current === 0) {
          this.currentplayer = size - 2;
        } else if (current === 1) {
          this.currentplayer = size - 1;
        } else {
          this.currentplayer = current - 2;
        }
      } else if (steps === 1) {
        current === 0 ? this.currentplayer = size - 1 : this.currentplayer = current - 1;
      }
      this.sendcurrentcard()
    }

    for (let i = 0; i < players.length; i++) {
      i === this.getcurrentplayer ? io.to(players[i].getsocketid).emit("turn", this.getcardpack.getthinktime, true) : io.to(players[i].getsocketid).emit("turn", this.getcardpack.getthinktime, false)
    }
    this.broadcastusers()
    this.tick(this.getcardpack.getthinktime, this.getplays)
  }

  async tick(ms, count) {
    let promise = new Promise((res) => {
      setTimeout(() => res(), ms)
    });
    await promise;
    if (this.getplays === count) {
      let players = this.getplayervalues
      let curentplayer = players[this.getcurrentplayer]
      curentplayer.pushcards(this.getcardpack.getpunishmentcards + this.gettempstack)
      this.tempstack = 0
      this.next(1)
    }
    console.log(count)
  }

  exit(socketid, msg) {
    let player = this.getplayers.get(socketid)
    if (typeof msg === "string") {
      this.addchatmsg(player.getname, msg)
    }
    this.broadcastmsg("leave", true)
    deletelobby(getlobbyplace(this.getlobbyid))
  }

  play(socketid, cardnum, color) {
    let player = this.getplayers.get(socketid)
    let playcard = player.getcards[cardnum]
    let currentcard = this.getcurrentcard
    let cardpack = this.getcardpack
    let canplay = false;
    let players = this.getplayervalues

    if (playcard.color === currentcard.color || currentcard.value === playcard.value || playcard.type === "p4" || playcard.type === "color") {
      canplay = true
    }

    if (canplay) {
      this.broadcastmsg("stack", false)
      player.getcards.splice(cardnum, 1)
      this.plays = this.getplays + 1
      if (player.getcardslength === 0) {
        this.exit(player.getsocketid)
      }

      if (player.getcardslength === 1 && player.getuno === false) {
        io.to(player.getsocketid).emit("hasforgotuno", true)
        io.to(player.getsocketid).emit("hasuno", false)
        player.pushcards(this.getcardpack.getpunishmentcards)
        this.sendcards(player.getsocketid)
      }

      player.setuno = false
      io.to(player.getsocketid).emit("hasuno", false)

      switch (playcard.type) {
        case "normal":
          player.pushcards(this.gettempstack)
          this.tempstack = 0
          this.next(1)
          break
        case "reverse":
          player.pushcards(this.gettempstack)
          this.tempstack = 0
          this.playdirection = !this.getplaydirection
          this.next(1)
          break
        case "block":
          player.pushcards(this.gettempstack)
          this.tempstack = 0
          this.next(2)
          break
        case "color":
          playcard.color = color
          player.pushcards(this.gettempstack)
          this.tempstack = 0
          this.next(1)
          break
        case "p4":
          playcard.color = color
          if (cardpack.getstack) {
            if (currentcard.type === "p2") {
              player.pushcards(this.gettempstack)
              this.tempstack = 0
            }
            this.tempstack = this.gettempstack + 4
            this.next(1)
            if (!this.canplaycard(players[this.getcurrentplayer].getsocketid, "p4")) {
              players[this.getcurrentplayer].pushcards(this.gettempstack)
              this.tempstack = 0
            } else {
              this.broadcastmsg("stack", this.gettempstack)
            }
          } else {
            this.next(1)
            this.getplayers[this.getcurrentplayer].pushcards(4)
          }
          this.sendcards(players[this.getcurrentplayer].getsocketid)
          this.broadcastusers()
          break
        case "p2":
          if (cardpack.getstack) {
            if (currentcard.type === "p4") {
              player.pushcards(this.gettempstack)
              this.tempstack = 0
            }
            this.tempstack = this.gettempstack + 2
            this.next(1)
            if (!this.canplaycard(players[this.getcurrentplayer].getsocketid, "p2")) {
              players[this.getcurrentplayer].pushcards(this.gettempstack)
              this.tempstack = 0
            } else {
              this.broadcastmsg("stack", this.gettempstack)
            }
          } else {
            this.next(1)
            this.getplayers[this.getcurrentplayer].pushcards(2)
          }
          this.sendcards(players[this.getcurrentplayer].getsocketid)
          this.broadcastusers()
          break
      }

      let arr = [...players.values()]
      let currentplayer = arr[this.getcurrentplayer]
      if (typeof currentplayer === "object") {
        if (currentplayer.getcardslength === 2) {
          if (this.canplayanycard(currentplayer.getsocketid)) {
            io.to(currentplayer.getsocketid).emit("hasuno", true)
          }
        }
      }
      this.currentcard = playcard
      this.sendcurrentcard()

    }
  }

  iscurrent(socketid) {
    let players = this.getplayervalues
    let pos = players.map(e => e.getsocketid).indexOf(socketid)
    return pos === this.getcurrentplayer ? true : false
  }

  canplaycard(socketid, type) {
    let found = false
    let player = this.getplayers.get(socketid)
    player.getcards.forEach(e => {
      if (e.type === type) { found = true }
    })
    return found
  }

  canplayanycard(socketid) {
    let player = this.getplayers.get(socketid)
    let currentcard = this.getcurrentcard
    let cards = player.getcards
    let plays = false

    cards.forEach(card => {
      if (card.color === currentcard.color || card.value === currentcard.value || card.color === this.getcardpack.getcolors[4]) {
        plays = true
      }
    })
    return plays
  }
}

for (let i = 0; i < defaultlobby.howmany; i++) {
  addlobby(`Public Lobby ${i + 1}`, defaultcardpack, defaultlobby.maxplayers, defaultlobby.maxchatmsg, defaultlobby.maxplayername)
}

io.on("connection", function (socket) {
  socket.on("reqlobbys", () => sendlobbys())
  socket.on("reqapproval", (playerobject) => {
    playerobject.lobby = Math.round(playerobject.lobby)
    if (typeof (playerobject.lobby) == "number" && playerobject.lobby < lobbys.length && typeof (playerobject.name) === "string" && playerobject.name.length < lobbys[playerobject.lobby].getmaxplayernamelength && playerobject.name.length != 0 && !(/^\s*$/.test(playerobject.name))) {
      io.to(socket.id).emit("recapproval")
    } else {
      io.to(socket.id).emit("invalidusername")
    }
  })

  socket.on("recuno", () => {
    let user = whobelong(socket.id)
    if (typeof user === "object") {
      let lobby = lobbys[getlobbyplace(user.getlobbyid)]
      if (user.getcardslength === 2 && lobby.canplayanycard(user.getsocketid)) {
        user.uno = true
        io.to(user.getsocketid).emit("hasuno", false)
      }
    }
  })

  socket.on("newuser", (playerobject) => {
    let lobby = lobbys[playerobject.lobby]
    if (typeof lobby === "object") {
      if (!lobbys[playerobject.lobby].getstatus) {
        lobbys[playerobject.lobby].adduser(socket.id, playerobject.name, playerobject.lobby)
        sendlobbys()
      } else {
        io.to(socket.id).emit("hasstarted")
      }
    }
  })

  socket.on("reqchat", (string) => {
    let user = whobelong(socket.id)
    if (typeof user === "object") {
      let lobby = lobbys[getlobbyplace(user.getlobbyid)]
      if (string.length <= lobby.getmaxchatmsglength && typeof lobby === "object" && !(/^\s*$/.test(string))) {
        typeof (user) === "undefined" ? console.log("chatsenderror/nouser") : lobby.addchatmsg(user.getusername, string, "user")
      } else {
        io.to(socket.id).emit("invalidchat")
      }
    }
  })

  socket.on("disconnect", () => {
    let user = whobelong(socket.id)
    if (typeof user === "object") {
      let lobby = lobbys[getlobbyplace(user.getlobbyid)]
      if (typeof lobby === "object") {
        lobby.removeuser(user.getsocketid)
      }
    }
  })

  socket.on("ready", (bool) => {
    let user = whobelong(socket.id)
    if (typeof user === "object") {
      let lobby = lobbys[getlobbyplace(user.getlobbyid)]
      if (typeof lobby === "object") {
        lobby.ready(user.getsocketid, bool)
      }
    }
  })

  socket.on("draw", () => {
    let user = whobelong(socket.id)
    if (typeof user === "object") {
      let lobby = lobbys[getlobbyplace(user.getlobbyid)]
      if (typeof lobby === "object") {
        let rules = lobby.getcardpack
        if (lobby.iscurrent(user.getsocketid)) {
          if (lobby.canplayanycard(user.getsocketid)) {
            if (rules.getmustplay) {
              io.to(user.getsocketid).emit("cantdraw")
            } else {
              user.uno = false
              user.pushcards(1)
              lobby.next(1)
              lobby.sendcards(user.getsocketid)
              io.to(user.getsocketid).emit("hasuno", user.getuno)
            }
          } else {
            user.uno = false
            io.to(user.getsocketid).emit("hasuno", user.getuno)
            if (rules.getmustplay) {
              user.pushcards(1)
              lobby.sendcards(user.getsocketid)
              if (!rules.getdrawtillok) {
                lobby.next(1)
              }
            } else {
              if (!rules.getdrawtillok) {
                lobby.next(1)
              }
            }
          }

          let arr = [...lobby.getplayers.values()]
          let currentplayer = arr[lobby.getcurrentplayer]
          if (typeof currentplayer === "object") {
            if (currentplayer.getcardslength === 2) {
              if (this.canplayanycard(currentplayer.getsocketid)) {
                io.to(currentplayer.getsocketid).emit("hasuno", true)
              }
            }
          }
        }
      }
    }
  })

  socket.on("playcolorcard", (cardnum, color) => {
    cardnum = Math.round(+cardnum)
    let user = whobelong(socket.id)


    if (typeof user === "object" && typeof cardnum === "number") {
      let lobby = lobbys[getlobbyplace(user.getlobbyid)]
      if (typeof lobby === "object") {
        if (typeof user === "object" && lobby.getstatus && typeof cardnum === "number" && lobby.iscurrent(user.getsocketid)) {
          let card = user.getcard(cardnum)
          if (typeof card === "object") {
            if (card.type === "p4" || card.type === "color") {
              lobby.play(user.getsocketid, cardnum, color)
            }
          }
        }
      }
    }
  })

  socket.on("playcard", (cardnum) => {
    cardnum = Math.round(+cardnum)
    let user = whobelong(socket.id)


    if (typeof user === "object" && typeof cardnum === "number") {
      let lobby = lobbys[getlobbyplace(user.getlobbyid)]
      if (typeof lobby === "object") {
        if (typeof user === "object" && lobby.getstatus) {
          if (lobby.canplayanycard(user.getsocketid)) {
            if (lobby.iscurrent(user.getsocketid)) {
              let card = user.getcard(cardnum)
              if (typeof card === "object") {
                switch (card.type) {
                  case "normal":
                  case "block":
                  case "reverse":
                  case "p2":
                    lobby.play(user.getsocketid, cardnum)
                    break
                }
              }
            }
          } else {
            io.to(user.getsocketid).emit("mustdraw")
          }
        }
      }
    }
  })
})

function write(path, name, object, force) {
  let savedata = JSON.stringify(object,null, 2)
  if (force) {
    fs.writeFileSync(`./json/${path}/${name}.json`, savedata)
  } else {
    if (fs.existsSync(`./json/${path}/${name}.json`)) {
      console.log("file already exists")
    } else {
      fs.writeFileSync(`./json/${path}/${name}.json`, savedata);
    }
  }
}

function read(path, name) {
  return JSON.parse(fs.readFileSync(`./json/${path}/${name}.json`).toString())
}

function addlobby(name, cardpack, maxplayers, maxchatmsglength, maxplayernamelength) {
  //Optimale randomness mit abfagre
  let randomid = `§${crypto.randomBytes(30).toString("hex")}§`
  let check = 0
  lobbys.forEach(e => {
    if (e.getlobbyid === randomid) {
      check += 1
    }
  })
  if (check === 0) {
    lobbys.push(new Lobby(name, randomid, cardpack, maxplayers, maxchatmsglength, maxplayernamelength))
  }
}

function getlobbyplace(hash) {
  let pos = lobbys.findIndex(obj => obj.getlobbyid === hash);
  return pos
}

function deletelobby(place) {
  lobbys.splice[place, 1]
}

function whobelong(socketid) {
  //net angreifen
  let temp
  lobbys.forEach(element => {
    if (typeof (element.getplayers.get(socketid)) === "object") {
      temp = element.getplayers.get(socketid)
    }
  })
  return temp
}

function sendlobbys() {
  io.emit("reclobbys", {
    names: lobbys.map(val => val.getname),
    status: lobbys.map(val => val.getstatus),
    players: lobbys.map(val => val.getplayersize)
  })
}

server.listen(port)
