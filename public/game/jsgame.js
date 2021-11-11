let socket = io();
let currentcard = {}
let cards = []
let canplay = false
let animationtime = 500
let latestcard
let smallscreen = function() { return $("#gamecol")[0].getBoundingClientRect().left + +pageXOffset < 300 || $(window).width() < 1140 ? true : false }

let userinfos = {
    name: getCookie("uname"),
    lobby: getCookie("lobby")
};

let currentURL = {...window}.location.href;
window.history.pushState("object or string", "Title", "/");

//Initial Contact Sockets
socket.emit("reqapproval", userinfos);

socket.on("recapproval", () => {
    socket.emit("newuser", userinfos)
    $("title").text(`JUNO - ${userinfos.name}`)
});

//Error Sockets
socket.on("invalidchat", () => $("#chat").effect("shake"))

socket.on("cantdraw", () => $("#draw").effect("shake"))

socket.on("hasstarted", () => {
    alert("The game has already started")
    window.location = "../../index.html"
})

socket.on("leave", () => {
    alert("Game Over")
    window.location = "../../index.html"
})
socket.on("invalidusername", () => {
        alert("Invalid Username")
        window.location = "../../index.html"
    })
    //Unlock Sockets
socket.on("enoughplayers", bool => bool ? $("#readybutton").css("display", "inline") : $("#readybutton").css("display", "none"))

socket.on("turn", (thinktime, bool) => {
    canplay = bool
    sethov(canplay)
        //Wenn bool true is thinktime anzeigen
})

socket.on("hasuno", (bool) => $("#uno").css("display", bool ? "inline" : "none"))

socket.on("debugg", (str) => {
    alert(str)
})

//Output related Sckets
socket.on("recuser", obj => {
    $("#playerscontent").text("")
    for (let i = 0; i < obj.players.length; i++) {
        obj.gamestatus ? obj.players[i].ready = false : null
        $("#playerscontent").append(`<div id="player${i}" class="card elegant-color-dark mb-1"><div class="card-body"><div class="white-text d-flex justify-content-between" style="width=100%"><a>${obj.players[i].socketid == socket.id ? "<i class='fas fa-user'></i>" : ""}\xa0\xa0${obj.players[i].name}</a><a id="dir${i}"></a><a>${obj.players[i].cards}</a></div></div></div>`)
        obj.players[i].ready ? $(`#player${i}`).addClass("border border-success") : $(`#player${i}`).removeClass("border border-success")
    } //obj.direction = bool (true: down) obj.currentplayer = number (current player in array)
    currentplayerVisual(obj.currentplayer, obj.direction, obj.gamestatus)
    obj.gamestatus && obj.players[obj.currentplayer].socketid == socket.id ? $("#gamecard").addClass("border border-light") : $("#gamecard").removeClass("border border-light")
})

function currentplayerVisual(player, direction, started) {
    if (started) {
        $(`#player${player}`).addClass("border border-light")
        $(`#dir${player}`).html(`<i class="${direction ? "fas fa-angle-double-down" : "fas fa-angle-double-up"} text-white"></i>`)
    }
}

socket.on("recchat", (arr) => {
    $("#chatcontent").text("")
    arr.reverse().forEach(x => {
        $("#chatcontent").append(`<div class="white-text" style="width=100%">${x}</div>`)
    })
})

socket.on("currentcard", (obj, urlstring) => {
    outd2.innerText = ""
    currentcard = obj
    let url = new Map(JSON.parse(urlstring));

    let path = url.get(`${obj.color}-${obj.value}`)
    $("#outd2").append(`<img id="outd2img" src=${path} style="max-height:180px">`)
})

socket.on("cards", (arr, urlstring) => {
    $("#outd1").text("") //der loste
    let url = new Map(JSON.parse(urlstring));
    cards = arr
    for (let i = 0; i < arr.length; i++) {
        let path = url.get(`${arr[i].color}-${arr[i].value}`)
        $("#outd1").append(`<div class="playercard col-5 col-sm-3 col-md-2 col-lg-2 col-xl-2 p-0 m-1 d-flex justify-content-center"><img id=${i} src=${path} class="temphov zoom" p-0" style="max-height:180px"></div>`)
    }
    sethov(canplay)
})

socket.on("stack", amount => { //i hobs da ausgebessert do is zuerst gstondn "ammount"
    if (typeof amount == "number") {
        //do smth when is displayed
    } else {
        //when this happens it is false which means display none
    }
})

//JQuery Click Handler
$(() => {
    reupd()

    $(window).resize(() => reupd())


    $("#readybutton").click(() => {
        $("#readybutton").toggleClass("btn-light btn-success")
        socket.emit("ready", $("#readybutton").hasClass("btn-success"))
        $("#readybutton").text($("#readybutton").hasClass("btn-success") ? "ready" : "not ready")
    })

    $("#chat").keypress(e => {
        if (e.key == "Enter") {
            socket.emit("reqchat", $("#chat").val());
            $("#chat").val("")
        }
    })

    $("#uno").click(() => socket.emit("recuno"))
    $("#draw").click(() => socket.emit("draw"))
    $("#debugbutton").click(() => $("#centralModalInfo").modal("show"))
    $(".spselect").click(e => {
        play(animationtime, latestcard, e.target.getAttribute("id"))
        $("#centralModalInfo").modal("hide")
    })

    $("#outd1").click(e => {
        if (canplay) {
            let id = e.target.getAttribute("id")
            let card = cards[id]
            if (card.value == currentcard.value || card.color == currentcard.color || card.type == "p4" || card.type == "color") {
                if (card.type == "p4" || card.type == "color") {
                    $("#centralModalInfo").modal("show")
                    latestcard = id
                } else {
                    play(animationtime, id, false)
                }

            }
        }
    })
})

async function play(ms, id, colorcard) {
    moveElement(id)
    let promise = new Promise((res) => {
        setTimeout(() => res(), ms)
    });
    await promise;
    if (id >= 0) {
        if (typeof colorcard == "string") {
            socket.emit("playcolorcard", id, colorcard)
        } else {
            socket.emit("playcard", id)
        }
    }
}


function getCookie(cname) {
    let name = `${cname}=`;
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(";");
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == " ") {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function sethov(bool) {
    if (bool) {
        $(".temphov").removeClass("nhov")
        $(".temphov").addClass("zoom hov")
        $("#draw").attr("disabled", false);
    } else {
        $(".temphov").removeClass("zoom hov")
        $(".temphov").addClass("nhov")
        $("#draw").attr("disabled", true);
    }
}

function showModal(modal, bool) {
    modal.modal(bool ? "hide" : "show")
    $("#closeplayers, #closechat").css("display", bool ? "inline" : "none")
}

function updateSM() {
    showModal($("#playersmodal, #chatmodal"), smallscreen())
    $("#futter").css("display", smallscreen() ? "none" : "inline")
}

function getCoords(e) {
    let box = e.getBoundingClientRect();
    return { top: box.top + pageYOffset, left: box.left + pageXOffset };
}

function moveElement(what) {
    let c1 = getCoords(document.getElementById("outd2img"))
    let c2 = getCoords(document.getElementById(what))
    $(`#${what}`).css("transition", "all .5s ease-in-out")
    $(`#${what}`).css("transform", `translate(${(c1.left - c2.left).toString()}px,${(c1.top - c2.top).toString()}px)`)
}

function reupd() {
    document.getElementById("gamecol").getBoundingClientRect().left + +pageXOffset < 400 ? $(".modal-side").addClass("modal-sm") : $(".modal-side").removeClass("modal-sm")
    updateSM()
    setTimeout(() => {
        updateSM()
    }, 500);
}