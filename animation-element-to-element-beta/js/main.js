"use strict";

$(()=>{
  $("#foo").click(()=>{
    let c1 = getCoords(document.getElementById("foo"))
    let c2 = getCoords(document.getElementById("moveto"))

    $("#foo").css("transition","all 1s ease-in-out")
    $("#foo").css("transform",`translate(${(c2.left-c1.left).toString()}px,${(c2.top-c1.top).toString()}px)`)
  })
})

function getCoords(e) {
  let box = e.getBoundingClientRect();
  return { top: box.top + pageYOffset, left: box.left + pageXOffset };
}