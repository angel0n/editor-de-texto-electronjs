const { ipcRenderer } = require('electron')

const textArea = document.getElementById('text')
const title = document.getElementById('title')

//escuta envento do main
ipcRenderer.on('set-file', function(event,data){
    textArea.value = data.content
    title.innerHTML = data.name + " | Editor"
})

function handleChangeText(){
    //envia evento para o main
    ipcRenderer.send('update-content',textArea.value)
}