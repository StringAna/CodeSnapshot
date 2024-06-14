import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import ignore, { Ignore } from 'ignore'

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('codesnapshot.helloWorld', () => {
    const projectDir = vscode.workspace.rootPath?.toString() ?? ''
    const outputFile = path.join(projectDir, 'code_context.txt')

    fs.existsSync(outputFile) && fs.unlinkSync(outputFile)

    const ig = loadGitignore(projectDir)

    const rootEntries = fs.readdirSync(projectDir, { withFileTypes: true })
    rootEntries.forEach((entry) => {
      if (entry.isDirectory()) {
        const dirPath = path.join(projectDir, entry.name)
        readFiles(dirPath, outputFile, projectDir, ig)
      }
    })

    vscode.window.showInformationMessage('Script executed correctly!')
  })

  context.subscriptions.push(disposable)
}

function loadGitignore(projectDir: string) {
  const gitignorePath = path.join(projectDir, '.gitignore')
  const ig = ignore()
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath).toString()
    ig.add(gitignoreContent)
  }
  const fileExtensionsToIgnore = ['jpg', 'png', 'gif', 'pdf', 'doc', 'docx', 'svg', 'mp4', 'jpeg']

  fileExtensionsToIgnore.forEach((extension) => {
    ig.add(`*.${extension}`) // Ignore files with the given extension
  })
  ig.add('.*') // Ignore hidden files
  return ig
}

function readFiles(dir: string, outputFile: string, projectDir: string, ig: Ignore) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  entries.forEach((entry: fs.Dirent) => {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      readFiles(fullPath, outputFile, projectDir, ig)
    } else if (entry.isFile()) {
      appendFileIfNotIgnored(fullPath, outputFile, projectDir, ig)
    }
  })
}

function appendFileIfNotIgnored(fullPath: string, outputFile: string, projectDir: string, ig: Ignore) {
  const isIgnored = ig.ignores(path.relative(projectDir, fullPath))
  if (!isIgnored) {
    const relativePath = path.relative(projectDir, fullPath)
    fs.appendFileSync(outputFile, `// File: ${relativePath}\n`)
    fs.appendFileSync(outputFile, fs.readFileSync(fullPath))
    fs.appendFileSync(outputFile, '\n')
  }
}

export function deactivate() {}
