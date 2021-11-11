const socket = io()
let selected
let lobbys

///////Getting end recieving Lobby info/////
socket.emit("reqlobbys");
socket.on("reclobbys", _lobbys => {
    lobbys = _lobbys;
    displaylobbys();
});

socket.on("recapproval", () => {
    document.cookie = `uname=${$("#name").val()}`
    document.cookie = `lobby=${selected}`
    window.location = "/game/game.html"
});

socket.on("invalidusername", () => {
    $("#usrinput").addClass("shake");
    setTimeout(() => {
        $("#usrinput").removeClass("shake")
    }, 1000);
});
///////Getting end recieving Lobby info\\\\\
/////Event Listener/////

$(() => {
    $("#outlobbys").click(e => {
        if (e.target.getAttribute("id") > -1) {
            $("div > p").css("font-weight", "100");
            $(e.target).css("font-weight", "bold");
            selected = Number(e.target.getAttribute("id"));
        }
    })

    $("#connect").click(() => {
        socket.emit("reqapproval", { name: $("#name").val(), lobby: selected });
    })

    $(document).keypress(e => {
        if (e.key == "Enter") {
            let tempobject = {
                name: $("#name").val(),
                lobby: selected
            }
            socket.emit("reqapproval", tempobject)
        }
    })
})

/////Event Listener\\\\\

function displaylobbys() {
    $("#outlobbys").text("");
    for (let i = 0; i < lobbys.names.length; i++) {
        if (!lobbys.status[i]) {
            $("#outlobbys").append(`<div id="-2" class="d-flex justify-content-between"><p id="${i}" class="lobbynames cursor-pointer" style="color: #64dd17">${lobbys.names[i]}</p><p id="-1" style="color: #64dd17">${lobbys.players[i]}</p></div>`);
        }
    }
}