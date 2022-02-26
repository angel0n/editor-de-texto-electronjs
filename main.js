const {app, BrowserWindow, Menu, dialog, ipcMain, shell} = require('electron')
const fs = require('fs')
const path  = require('path')

var mainWindows

async function createWindow(){
    mainWindows = new BrowserWindow({
        width:800,
        height: 600,
        webPreferences:{
            contextIsolation: false,
            nodeIntegration: true,
        }
    })

    await mainWindows.loadFile('src/pages/editor/index.html')
    //mainWindows.webContents.openDevTools()
    createNewFile()

    //escuta eventos do render (script)
    ipcMain.on('update-content',(event,data)=>{
        file.content = data
    })
}

app.whenReady().then(createWindow)

app.on('activate',()=>{
    if(BrowserWindow.getAllWindows().length === 0) createWindow()
})

var file = {}
//cria um novo
function createNewFile(){
    file = {
        name: 'Novo Arquivo.txt',
        content: '',
        saved: false,
        path: app.getPath('documents')+'/Novo Arquivo.txt'
    }
    //envia evento para o render (script)
    mainWindows.webContents.send('set-file',file)
}

function writeFile(filePath){
    try{
        fs.writeFile(filePath,file.content,(error)=>{
            if(error)throw error
            file.path = filePath
            file.saved = true 
            file.name = path.basename(filePath)

            mainWindows.webContents.send('set-file',file)

        })
    }catch(e){
        console.log(e);
    }
}

//salva como
async function saveFileAs(){
    let dialogFile = await dialog.showSaveDialog({
        defaultPath: file.path
    })

    if(dialogFile.canceled) return false
    
    writeFile(dialogFile.filePath)
    
}

function saveFile(){
    if(file.saved){
        return writeFile(file.path)
    }else{
        saveFileAs()
    }
}

function readFile(filePath){
    try {
        return fs.readFileSync(filePath,'utf8')
    } catch (error) {
        console.log(error);
        return ''
    }
}

async function openFile(){
    let dialogFile = await dialog.showOpenDialog({
        defaultPath: file.path
    })
    
    if(dialogFile.canceled) return false

    file = {
        name: path.basename(dialogFile.filePaths[0]),
        content: readFile(dialogFile.filePaths[0]),
        saved:true,
        path: dialogFile.filePaths[0]
    }

    mainWindows.webContents.send('set-file',file)
}

//template menu
const templateMenu = [
    {
        label: 'Arquivo',
        submenu:[
            {
                label: 'Novo',
                accelerator: 'CmdOrCtrl+N',
                click(){
                    createNewFile()
                }
            },
            {
                label: 'Abrir',
                accelerator: 'CmdOrCtrl+O',
                click(){
                    openFile()
                }
            },
            {
                label: 'Salvar',
                accelerator: 'CmdOrCtrl+S',
                click(){
                    saveFile()
                }
            },
            {
                label: 'Salvar como',
                accelerator: 'CmdOrCtrl+Shift+S',
                click(){
                    saveFileAs()
                }
            },
            {
                label: 'Fechar',
                role: process.platform === 'darwin' ? 'closer' : 'quit'
            }
        ]
    },
    {
        label: 'Editar',
        submenu:[
            {
                label: 'Desfazer',
                role:'undo'
            },
            {
                label: 'Refazer',
                role: 'redo'
            },
            {
                type: 'separator'
            },
            {
                label: 'Copiar',
                role: 'copy'
            },
            {
                label: 'Cortar',
                role: 'cut'
            },
            {
                label: 'Colar',
                role: 'paste'
            }

        ]
    },
    {
        label: 'Ajuda',
        submenu:[
            {
                label: 'Youtube',
                click(){
                    shell.openExternal('https://www.youtube.com')
                }
            }
        ]
    }
]

//Menu 
const menu = Menu.buildFromTemplate(templateMenu)
Menu.setApplicationMenu(menu)