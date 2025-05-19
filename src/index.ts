import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'


async function verificarPasta(caminhoPasta: string): Promise<string[]> {
    const arquivos = fs.readdirSync(path.join(__dirname, caminhoPasta))
    console.log(arquivos)
    return arquivos
}



interface Line {
    telefone: string,
    codigo: string,
    nome: string,
    valorTotal: string,
    valorParcela: string,
    banco: string
}

async function processarArquivo(caminho: string, fileName: string) {
    try {
        console.log("Processando Arquivos")
        const fileStream = fs.createReadStream(path.join(caminho))

        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        })

        //Array para novo arquivo
        let newFile: Line[] = []
        for await (const linha of rl) {
            const campos = linha.split(',')

            const telefone = campos[0];
            const codigo = campos[1];
            const nome = campos[2];
            const valorTotal = campos[3].toString() + "," + campos[4].toString();
            const valorParcela = campos[5].toString() + "," + campos[6].toString();
            const banco = campos[7];

            const line = {
                telefone,
                codigo,
                nome,
                valorTotal,
                valorParcela,
                banco
            }

            const validação = await validarLinha(line)

            if (!validação) {
                continue
            }
            console.log("Linha validada: ", valorParcela)
            newFile.push(line)
            // console.log({telefone, codigo, nome, valorTotal, valorParcela, banco});
        }

        await salvarNovaBase(newFile, path.join(__dirname, 'save', `UPDATED-${fileName}`))

    } catch (error) {
        console.error(error)
    }
}

const validarLinha = async (line: Line): Promise<boolean> => {

    const value = line.valorParcela.replace("R$", '').replace(" ", '')
    const parcela = parseFloat(value)

    if (parcela > 150) {
        return true
    }

    return false
}

async function salvarNovaBase(linhas: Line[], caminho: string) {
    const linhaTxt = linhas.map(line => [
        line.telefone,
        line.codigo,
        line.nome,
        line.valorTotal,
        line.valorParcela,
        line.banco
    ].join(';'))

    const cabecalho = [
        'telefone',
        'codigo',
        'nome',
        'var2',
        'var3',
        'var4'
    ].join(';');

    const resumo = [cabecalho, ...linhaTxt].join('\n')
    fs.writeFileSync(caminho, resumo, 'utf-8')
    return true
}

verificarPasta("files").then((result) => {
    for (const file of result) {
        const caminhoArquivo = path.join(__dirname, '/files/' + file);
        processarArquivo(caminhoArquivo, file)
    }
})
