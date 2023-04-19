import { lstatSync, readFileSync, readdirSync, statSync } from "fs"
import { basename, extname, join, parse } from "path"
import chalk from "chalk";

interface ProjectSizeConfig {
    name: string,
    path: string,
    git: string,
    ignore: string[]
}
interface ObjectInfo {
    path: string,
    name: string,
    size: number,
    type: string,
    extension?: string | undefined,
    children?: (ObjectInfo | undefined)[],
    lines?: number | undefined
}
interface FileExtensionCounter {
    name: string;
    extension: string;
    length: number;
}
class ProjectSize implements ProjectSizeConfig {
    constructor(config: ProjectSizeConfig) {
        if (config.name)
            this.name = config.name
        if (config.path)
            this.path = config.path
        if (config.git)
            this.git = config.git
        if (config.ignore)
            this.ignore = config.ignore
    }
    path: string = '';
    name: string = '';
    git: string = '';
    ignore: string[] = [];
    tree: (ObjectInfo | undefined)[] = [];
    totalFiles: number = 0;
    totalDirectories: number = 0;
    totalLines: number = 0;
    totalSize: number = 0;
    totalFileExtension: FileExtensionCounter[] = [];

    public directoryTree() {
        this.tree.push(this.read(this.path))
    }

    public read(path: string, parent: string | null = null) {
        path = join(path)
        let stat = statSync(path);
        let item: ObjectInfo = {
            path: "",
            name: "",
            size: 0,
            type: ""
        };

        if (stat.isDirectory()) {
            let dirData = readdirSync(path);
            if (this.ignore.indexOf(basename(path)) > -1)
                return;

            item.path = (parent) ? parent + "/" + basename(path) : basename(path);
            item.name = basename(path)
            item.size = stat.size;
            item.type = "directory"
            item.children = dirData.map(child => this.read(join(path, child), basename(path))).filter(e => !!e);
            this.totalSize = this.totalSize + item.size;
            this.totalDirectories = this.totalDirectories + 1;
        }

        if (stat.isFile()) {
            item.path = (parent) ? parent + "/" + basename(path) : basename(path);
            item.name = basename(path)
            item.size = stat.size;
            item.extension = extname(path).toLowerCase();
            let fileData = readFileSync(join(path));
            item.lines = fileData.toString().split('\n').length;
            this.totalLines = this.totalLines + item.lines;
            this.totalSize = this.totalSize + item.size;
            this.totalFiles = this.totalFiles + 1;
            this.addToExtensionCounter(item.extension)
        }
        return item;
    }
    private addToExtensionCounter(extension: string): void {
        // Filtra se ja existe algo inserido
        let filtered = this.totalFileExtension.filter(item => {
            return item.extension === extension
        });

        if (filtered.length > 0) {
            filtered[0].length++;
        }
        else {
            this.totalFileExtension.push({
                name: this.extensionName(extension),
                extension: extension,
                length: 1
            })
        }
    }
    private extensionName(format: string): string {
        if (format === '.txt') {
            return "text"
        }
        if (format === '.js') {
            return "javascript"
        }
        if (format === '.json') {
            return "json"
        }
        if (format === '.ts') {
            return "typescript"
        }
        if (format === '.php') {
            return "typescript"
        }
        return "file"
    }


    public printTree(tree: (ObjectInfo | undefined)[], parent: string | null = null, depth: number | undefined = 0) {
        tree.forEach((item: ObjectInfo | undefined) => {
            if (typeof item === 'undefined') return;
            console.log(this.addSpace(depth) + item?.name)
            if (typeof item?.children !== 'undefined' && item?.children?.length > 0)
                this.printTree(item?.children, item?.name, depth + 1)
        })
    }
    private addSpace(depth: number): string {
        let space = '';
        for (let index = 0; index < (depth * 2); index++) {
            if (index == 0)
                space = space + " ";
            else
                space = space + " ";
        }
        return space
    }


    public info() {
        console.log("======", chalk.red(this.name.toUpperCase()), "======")
        console.log("Total de Arquivos:", chalk.green(this.totalFiles));
        console.log("Total de linhas de código:", chalk.green(this.totalLines));
        console.log("Total de Diretórios:", chalk.green(this.totalDirectories));
        console.log("Tamanho estimado:", chalk.green(this.totalSize), "bytes");
        this.infoTotalFilesExt()
    }
    private infoTotalFilesExt() {
        this.totalFileExtension.forEach(item => {
            console.log("\t", item.name + chalk.blue(` (${item.extension})`) + ":", chalk.green(item.length));
        })
    }

}
let config: ProjectSizeConfig = {
    name: "Projeto Teste",
    path: "D:/Develop/project-size",
    git: "",
    ignore: ['node_modules']
};

let project = new ProjectSize(config);


project.directoryTree();
project.info();